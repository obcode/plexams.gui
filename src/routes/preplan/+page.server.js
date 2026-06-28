import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load() {
	const data = await request(
		env.PLEXAMS_SERVER,
		gql`
			query {
				preplanExams {
					id
					examKind
					examerID
					examerName
					module
					programs
					expectedStudents
					duration
					plannedDayNumber
					plannedSlotNumber
					ancode
					notes
					constraints {
						notPlannedByMe
						doNotPublish
						online
						fixedDay
						fixedTime
						excludeDays
						possibleDays
						sameSlot
						roomConstraints {
							allowedRooms
							exahm
							seb
							lab
							placesWithSocket
							kdpJiraURL
							maxStudents
							additionalSeats
							comments
						}
					}
				}
				teachers(fromZPA: false) {
					id
					fullname
				}
				zpaExams {
					ancode
				}
				studyPrograms {
					shortname
					name
					category
				}
				semesterConfig {
					slots {
						dayNumber
						slotNumber
						starttime
					}
					mucDaiSlots {
						dayNumber
						slotNumber
						starttime
					}
				}
				preplanOverview {
					slots {
						dayNumber
						slotNumber
						starttime
						exahm {
							examCount
							seatsNeeded
							roomsSuggested
							rooms
							seatsAvailable
							seatsBooked
							roomsToBook
						}
						seb {
							examCount
							seatsNeeded
							roomsSuggested
							rooms
							seatsAvailable
							seatsBooked
							roomsToBook
						}
						conflicts {
							program
							preplanExamIDs
							modules
						}
					}
				}
			}
		`
	);

	const teachers = (data.teachers ?? [])
		.slice()
		.sort((/** @type {any} */ a, /** @type {any} */ b) => a.fullname.localeCompare(b.fullname));

	// gültige Slots = slots ∪ mucDaiSlots (dedupliziert, sortiert)
	/** @type {Map<string, any>} */
	const slotMap = new Map();
	for (const s of [
		...(data.semesterConfig?.slots ?? []),
		...(data.semesterConfig?.mucDaiSlots ?? [])
	]) {
		slotMap.set(`${s.dayNumber}-${s.slotNumber}`, s);
	}
	const slots = [...slotMap.values()].sort(
		(/** @type {any} */ a, /** @type {any} */ b) =>
			a.dayNumber - b.dayNumber || a.slotNumber - b.slotNumber
	);

	// Übersicht: „ohne Slot"-Eimer (dayNumber == null) zuerst, dann nach Tag/Slot.
	const overview = (data.preplanOverview?.slots ?? [])
		.slice()
		.sort((/** @type {any} */ a, /** @type {any} */ b) => {
			if (a.dayNumber == null) return -1;
			if (b.dayNumber == null) return 1;
			return a.dayNumber - b.dayNumber || a.slotNumber - b.slotNumber;
		});

	return {
		exams: data.preplanExams ?? [],
		teachers,
		studyPrograms: data.studyPrograms ?? [],
		slots,
		overview,
		// ZPA-Prüfungsliste importiert? → dann unverbundene Ancodes hervorheben
		zpaPresent: (data.zpaExams ?? []).length > 0
	};
}
