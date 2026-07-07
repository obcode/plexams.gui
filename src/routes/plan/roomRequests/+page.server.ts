import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import { conditionsDoneMap } from '$lib/email/emailConditions';
import { combineStarttime } from '$lib/exam/setExamTime';
import type { PageServerLoad } from './$types';

// Gebäudemanagement-Raumanforderungen (nur diese; Anny/T-Räume haben eine
// eigene Quelle). Schlüssel je Anforderung: room + day + slot.
// Zusätzlich pro Anforderung die Belegung des Raums in diesem Slot anreichern
// (Prüfung, Modul, Prüfer, Zeit, NTAs inkl. NTA-Zeit).
export const load: PageServerLoad = async () => {
	const data = await request<any>(
		env.PLEXAMS_SERVER,
		gql`
			query {
				roomRequests {
					room
					day
					slot
					from
					until
					approved
					active
				}
			}
		`
	);

	const roomRequests = data.roomRequests ?? [];

	// HH:MM direkt aus dem ISO-String (keine Zeitzonen-Umrechnung).
	const hhmm = (iso: string) => {
		const m = /T(\d{2}):(\d{2})/.exec(iso ?? '');
		return m ? `${m[1]}:${m[2]}` : '';
	};

	// Semester-Config (Tage/Anfangszeiten) zuerst laden — für den return und um die
	// absolute Startzeit je (day, slot) für die zeitbasierte examsAt-Query zu bauen.
	const cfg = await request<any>(
		env.PLEXAMS_SERVER,
		gql`
			query {
				semesterConfig {
					days {
						number
						date
					}
					starttimes {
						number
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
		`
	);
	const dateByDay = new Map<number, string>(
		(cfg.semesterConfig?.days ?? []).map((d: any) => [d.number, d.date])
	);
	const startBySlot = new Map<number, string>(
		(cfg.semesterConfig?.starttimes ?? []).map((t: any) => [t.number, t.start])
	);
	const slotStarttime = (day: number, slot: number) =>
		combineStarttime(dateByDay.get(day), startBySlot.get(slot), dateByDay.get(day));

	// Belegung pro (day, slot) einmal laden.
	const slotKeys = [...new Set(roomRequests.map((r: any) => `${r.day}-${r.slot}`))] as string[];
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
		slotKeys.map(async (k): Promise<[string, any[]]> => {
			const [day, slot] = k.split('-').map(Number);
			try {
				const d = await request<any>(env.PLEXAMS_SERVER, slotQuery, {
					starttime: slotStarttime(day, slot)
				});
				return [k, d.examsAt ?? []];
			} catch {
				return [k, []];
			}
		})
	);

	// key `${day}-${slot}-${room}` → Liste der dort geplanten Prüfungen
	const plannedByKey: Record<string, any[]> = {};
	for (const [k, exams] of slotResults) {
		const [day, slot] = k.split('-');
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
				const mk = `${day}-${slot}-${rn}`;
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

	const enriched = roomRequests.map((r: any) => ({
		...r,
		planned: plannedByKey[`${r.day}-${r.slot}-${r.room}`] ?? []
	}));

	// Für „Anfrage hinzufügen": die als Management-Request markierten Räume (cfg oben).
	const managementRooms = (cfg.rooms ?? [])
		.filter((r: any) => r.requestWith === 'MANAGEMENT' && !r.deactivated)
		.map((r: any) => r.name)
		.sort();

	return {
		roomRequests: enriched,
		days: cfg.semesterConfig?.days ?? [],
		starttimes: cfg.semesterConfig?.starttimes ?? [],
		managementRooms,
		conditionsDone: conditionsDoneMap(cfg.planningState)
	};
};
