import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
import { conditionsDoneMap } from '$lib/email/emailConditions';
import { dayNumberForTime, slotNumberForTime } from '$lib/slot/derive';
import type { PageServerLoad } from './$types';

// Gebäudemanagement-Raumanforderungen (nur diese; Anny/T-Räume haben eine
// eigene Quelle). Schlüssel je Anforderung: room + day + slot.
// Zusätzlich pro Anforderung die Belegung des Raums in diesem Slot anreichern
// (Prüfung, Modul, Prüfer, Zeit, NTAs inkl. NTA-Zeit).
export const load: PageServerLoad = async () => {
	const data = await backendRequest(gql`
		query {
			roomRequests {
				room
				starttime
				from
				until
				approved
				active
			}
		}
	`);

	const roomRequests = data.roomRequests ?? [];

	// HH:MM direkt aus dem ISO-String (keine Zeitzonen-Umrechnung).
	const hhmm = (iso: string) => {
		const m = /T(\d{2}):(\d{2})/.exec(iso ?? '');
		return m ? `${m[1]}:${m[2]}` : '';
	};

	// Semester-Config (Tage/Anfangszeiten) zuerst laden — für den return und um die
	// absolute Startzeit je (day, slot) für die zeitbasierte examsAt-Query zu bauen.
	const cfg = await backendRequest(gql`
		query {
			semesterConfig {
				days {
					date
				}
				starttimes {
					start
				}
			}
			rooms {
				name
				requestWith
				deactivated
			}
			planningState {
				phases {
					conditions {
						key
						done
					}
				}
			}
		}
	`);
	// Backend liefert keine day/slot-Nummern mehr → 1-basierte Position rekonstruieren.
	const cfgDays = (cfg.semesterConfig?.days ?? []).map((d: any, i: number) => ({
		...d,
		number: i + 1
	}));
	const cfgStarts = (cfg.semesterConfig?.starttimes ?? []).map((s: any, i: number) => ({
		...s,
		number: i + 1
	}));

	// Belegung je Startzeit einmal laden (die Anfragen tragen die starttime direkt).
	const startKeys = [...new Set(roomRequests.map((r: any) => r.starttime))] as string[];
	const slotQuery = gql`
		query ($starttime: Time!) {
			examsAt(starttime: $starttime) {
				ancode
				zpaExam {
					module
					duration
				}
				mainExamer {
					shortname
				}
				planEntry {
					starttime
				}
				plannedRooms {
					room {
						name
					}
					studentsInRoom
					ntaMtknr
				}
				ntas {
					name
					mtknr
					deltaDurationPercent
				}
			}
		}
	`;

	const slotResults = await Promise.all(
		startKeys.map(async (starttime): Promise<[string, any[]]> => {
			try {
				const d = await backendRequest(slotQuery, { starttime });
				return [starttime, d.examsAt ?? []];
			} catch {
				return [starttime, []];
			}
		})
	);

	// key `${starttime}-${room}` → Liste der dort geplanten Prüfungen
	const plannedByKey: Record<string, any[]> = {};
	for (const [starttime, exams] of slotResults) {
		for (const e of exams) {
			const perRoom: Record<string, { regular: number; ntas: any[] }> = {};
			for (const pr of e.plannedRooms ?? []) {
				const rn = pr.room?.name;
				if (!rn) continue;
				if (!perRoom[rn]) perRoom[rn] = { regular: 0, ntas: [] };
				if (pr.ntaMtknr) {
					const nta = (e.ntas ?? []).find((n: any) => n.mtknr === pr.ntaMtknr);
					perRoom[rn].ntas.push({
						name: nta?.name ?? pr.ntaMtknr,
						delta: nta?.deltaDurationPercent ?? 0,
						minutes: Math.round(
							(e.zpaExam.duration * (100 + (nta?.deltaDurationPercent ?? 0))) / 100
						)
					});
				} else {
					perRoom[rn].regular += (pr.studentsInRoom ?? []).length;
				}
			}
			for (const rn of Object.keys(perRoom)) {
				const mk = `${starttime}-${rn}`;
				if (!plannedByKey[mk]) plannedByKey[mk] = [];
				plannedByKey[mk].push({
					ancode: e.ancode,
					module: e.zpaExam.module,
					examer: e.mainExamer?.shortname ?? '',
					time: hhmm(e.planEntry?.starttime),
					duration: e.zpaExam.duration,
					regular: perRoom[rn].regular,
					ntas: perRoom[rn].ntas
				});
			}
		}
	}

	// Tag/Slot rein zur Anzeige/Gruppierung aus der Startzeit ableiten (starttime bleibt
	// der Schlüssel für die Mutationen).
	const enriched = roomRequests.map((r: any) => ({
		...r,
		day: dayNumberForTime(r.starttime, cfgDays),
		slot: slotNumberForTime(r.starttime, cfgStarts),
		planned: plannedByKey[`${r.starttime}-${r.room}`] ?? []
	}));

	// Für „Anfrage hinzufügen": die als Management-Request markierten Räume (cfg oben).
	const managementRooms = (cfg.rooms ?? [])
		.filter((r: any) => r.requestWith === 'MANAGEMENT' && !r.deactivated)
		.map((r: any) => r.name)
		.sort();

	return {
		roomRequests: enriched,
		days: cfgDays,
		starttimes: cfgStarts,
		managementRooms,
		conditionsDone: conditionsDoneMap(cfg.planningState)
	};
};
