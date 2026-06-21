import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

// Gebäudemanagement-Raumanforderungen (nur diese; Anny/T-Räume haben eine
// eigene Quelle). Schlüssel je Anforderung: room + day + slot.
// Zusätzlich pro Anforderung die Belegung des Raums in diesem Slot anreichern
// (Prüfung, Modul, Prüfer, Zeit, NTAs inkl. NTA-Zeit).
export async function load() {
	const data = await request(
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
	/** @param {string} iso */
	const hhmm = (iso) => {
		const m = /T(\d{2}):(\d{2})/.exec(iso ?? '');
		return m ? `${m[1]}:${m[2]}` : '';
	};

	// Belegung pro (day, slot) einmal laden.
	const slotKeys = [...new Set(roomRequests.map((/** @type {any} */ r) => `${r.day}-${r.slot}`))];
	const slotQuery = gql`
		query ($day: Int!, $time: Int!) {
			examsInSlot(day: $day, time: $time) {
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
		slotKeys.map(async (k) => {
			const [day, slot] = k.split('-').map(Number);
			try {
				const d = await request(env.PLEXAMS_SERVER, slotQuery, { day, time: slot });
				return /** @type {[string, any[]]} */ ([k, d.examsInSlot ?? []]);
			} catch {
				return /** @type {[string, any[]]} */ ([k, []]);
			}
		})
	);

	/** key `${day}-${slot}-${room}` → Liste der dort geplanten Prüfungen */
	/** @type {Record<string, any[]>} */
	const plannedByKey = {};
	for (const [k, exams] of slotResults) {
		const [day, slot] = k.split('-');
		for (const e of exams) {
			/** @type {Record<string, { regular: number, ntas: any[] }>} */
			const perRoom = {};
			for (const pr of e.plannedRooms ?? []) {
				const rn = pr.room?.name;
				if (!rn) continue;
				if (!perRoom[rn]) perRoom[rn] = { regular: 0, ntas: [] };
				if (pr.ntaMtknr) {
					const nta = (e.ntas ?? []).find((/** @type {any} */ n) => n.mtknr === pr.ntaMtknr);
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

	const enriched = roomRequests.map((/** @type {any} */ r) => ({
		...r,
		planned: plannedByKey[`${r.day}-${r.slot}-${r.room}`] ?? []
	}));

	return { roomRequests: enriched };
}
