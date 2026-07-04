import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load({ params }) {
	const semesterQuery = gql`
		query {
			semesterConfig {
				days {
					number
					date
				}
				mucDaiSlots {
					dayNumber
					slotNumber
				}
				starttimes {
					number
					start
				}
				forbiddenSlots {
					dayNumber
					slotNumber
				}
			}
			roomsForSlots {
				day
				slot
				rooms {
					name
					seats
					handicap
					lab
					placesWithSocket
					exahm
					seb
					needsRequest
				}
			}
		}
	`;

	const semesterData = await request(env.PLEXAMS_SERVER, semesterQuery);

	const examsWithoutSlotQuery = gql`
		query {
			examsWithoutSlot {
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
					faculty
					groups
					primussAncodes {
						program
						ancode
					}
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
						needsHardware
						program
						from
						until
						lastSemester
					}
				}
				constraints {
					ancode
					notPlannedByMe
					notPlannedByMeInFK
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
				maxDuration
				planEntry {
					dayNumber
					slotNumber
					ancode
					locked
					phaseFixed
				}
			}
		}
	`;

	const data = await request(env.PLEXAMS_SERVER, examsWithoutSlotQuery);

	// Kompakte Liste der geplanten Prüfungen für die zeitbasierte Kalenderansicht
	// (Blöcke nach echter Start-Zeit + Dauer). Robust gegen Slot-0/0-externe
	// (planEntry.starttime wirft dort) via Teil-Daten.
	const plannedQuery = gql`
		query {
			plannedExams {
				ancode
				zpaExam {
					ancode
					module
					mainExamer
					mainExamerID
					duration
					isRepeaterExam
					faculty
					primussAncodes {
						ancode
					}
				}
				studentRegsCount
				maxDuration
				constraints {
					notPlannedByMe
					notPlannedByMeInFK
					online
					roomConstraints {
						exahm
						seb
					}
				}
				primussExams {
					exam {
						program
					}
					studentRegs {
						mtknr
					}
				}
				planEntry {
					dayNumber
					slotNumber
					starttime
					locked
					phaseFixed
				}
			}
		}
	`;
	let plannedExams = [];
	try {
		const pd = await request(env.PLEXAMS_SERVER, plannedQuery);
		plannedExams = pd.plannedExams ?? [];
	} catch (e) {
		const resp = /** @type {any} */ (e)?.response;
		if (resp?.data?.plannedExams) plannedExams = resp.data.plannedExams;
	}

	// „nicht von mir geplant"-Prüfungen (andere FK): zu-planende ZPA-Prüfungen mit
	// gesetztem Flag. Die mit echtem Slot erscheinen bereits über examsInSlot bzw.
	// plannedExams im Raster/Zeit-View; hier brauchen wir v. a. die OHNE Slot
	// (Slot 0/0 out-of-period oder noch ganz ohne Zeit) für den eigenen Block.
	let otherFkExams;
	try {
		const od = await request(
			env.PLEXAMS_SERVER,
			gql`
				query {
					zpaExamsToPlanWithConstraints {
						zpaExam {
							ancode
							module
							mainExamer
							faculty
							isRepeaterExam
							primussAncodes {
								program
								ancode
							}
						}
						constraints {
							notPlannedByMe
							notPlannedByMeInFK
						}
						planEntry {
							dayNumber
							slotNumber
							starttime
						}
						studentRegsCount
					}
				}
			`
		);
		otherFkExams = (od.zpaExamsToPlanWithConstraints ?? [])
			.filter((/** @type {any} */ e) => e.constraints?.notPlannedByMe)
			.map((/** @type {any} */ e) => ({
				ancode: e.zpaExam.ancode,
				zpaExam: e.zpaExam,
				constraints: e.constraints,
				planEntry: e.planEntry,
				studentRegsCount: e.studentRegsCount
			}));
	} catch {
		otherFkExams = [];
	}

	let semesterConfig = semesterData.semesterConfig;

	// Semester noch nicht konfiguriert → leer zurück, die Seite zeigt einen Hinweis
	if (!semesterConfig) {
		return {
			semesterConfig: null,
			examsWithoutSlot: [],
			globalSlotStatus: new Map(),
			roomsForSlots: new Map()
		};
	}

	let globalSlotStatus = new Map();

	for (let day of semesterConfig.days) {
		for (let time of semesterConfig.starttimes) {
			const key = `${day.number},${time.number}`;
			globalSlotStatus.set(key, 'okay');
		}
	}

	if (semesterConfig.forbiddenSlots) {
		for (let slot of semesterConfig.forbiddenSlots) {
			const key = `${slot.dayNumber},${slot.slotNumber}`;
			globalSlotStatus.set(key, 'forbidden');
		}
	}

	let roomForSlotsMap = new Map();
	if (semesterData.roomsForSlots) {
		for (let slot of semesterData.roomsForSlots) {
			const key = `${slot.day},${slot.slot}`;
			roomForSlotsMap.set(key, slot.rooms);
		}
	}

	return {
		semesterConfig: semesterData.semesterConfig,
		examsWithoutSlot: data.examsWithoutSlot,
		plannedExams,
		otherFkExams,
		globalSlotStatus: globalSlotStatus,
		roomsForSlots: roomForSlotsMap
	};
}
