import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import { conditionsDoneMap } from '$lib/email/emailConditions';

export async function load({ params }) {
	const query = gql`
		query {
			planningState {
				phases {
					conditions {
						key
						done
					}
				}
			}
			plannedExams {
				ancode
				zpaExam {
					zpaID
					semester

					ancode
					module
					mainExamer
					mainExamerID
					examType
					examTypeFull
					duration
					isRepeaterExam
					groups
					primussAncodes {
						program
						ancode
					}
				}
				mainExamer {
					fullname
					shortname
					isProf
					isLBA
					isProfHC
					isStaff
					lastSemester
					fk
					id
					email
				}
				primussExams {
					exam {
						ancode
						module
						mainExamer
						program
						examType
						presence
					}
					studentRegs {
						mtknr
						ancode
						program
						group
						name
						presence
					}
					conflicts {
						ancode
						numberOfStuds
					}
					ntas {
						name
						mtknr
						compensation
						deltaDurationPercent
						needsRoomAlone
						program
						from
						until
						lastSemester
					}
				}
				constraints {
					ancode
					notPlannedByMe
					excludeDays
					possibleDays
					fixedDay
					fixedTime
					sameSlot
					online
					roomConstraints {
						placesWithSocket
						lab
						exahm
						seb
					}
				}
				conflicts {
					ancode
					numberOfStuds
					primussAncodes {
						ancode
						program
						numberOfStuds
					}
				}
				studentRegsCount
				ntas {
					name
					mtknr
					compensation
					deltaDurationPercent
					needsRoomAlone
					program
					from
					until
					lastSemester
				}
				maxDuration
				planEntry {
					dayNumber
					slotNumber
					ancode
					locked
					starttime
				}
			}
		}
	`;

	let data;
	try {
		data = await request(env.PLEXAMS_SERVER, query);
	} catch (e) {
		// Einzelne planEntry.starttime werfen für externe Zeiten außerhalb des
		// Prüfungszeitraums (Slot 0/0). GraphQL nullt dadurch nur den betroffenen
		// planEntry und liefert die übrigen Daten trotzdem — die nutzen wir, statt
		// die ganze Seite mit 500 abzubrechen (diese Prüfungen zeigen dann keinen
		// Slot-Termin).
		const resp = /** @type {any} */ (e)?.response;
		if (resp?.data?.plannedExams) data = resp.data;
		else throw e;
	}

	return {
		plannedExams: data.plannedExams,
		// Vorbedingungen fürs Generieren (Gate des „Generieren"-Buttons)
		conditions: conditionsDoneMap(data.planningState)
	};
}
