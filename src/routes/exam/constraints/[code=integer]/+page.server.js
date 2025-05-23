import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load({ params }) {
	const queryE = gql`
		query {
            zpaExam(ancode: ${params.code}) {
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
            }
		}
	`;

	const dataE = await request(env.PLEXAMS_SERVER, queryE);

	const queryC = gql`
		query {
			constraintForAncode(ancode: ${params.code}) {
                ancode
                notPlannedByMe
                online
                excludeDays
                possibleDays
                sameSlot
                roomConstraints {
                    allowedRooms
                    placesWithSocket
                    lab
                    exahm
                    seb
                    kdpJiraURL
                    maxStudents
                    comments
                }
			}
        }
	`;

	const dataC = await request(env.PLEXAMS_SERVER, queryC);

	if (dataC.constraintForAncode && dataC.constraintForAncode.sameSlot) {
		let sameSlotExams = [];
		for (const ancode of dataC.constraintForAncode.sameSlot) {
			const querySameSlot = gql`
                query {
                    zpaExam(ancode: ${ancode}) {
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
                    }
                }
            `;

			const dataSameSlot = await request(env.PLEXAMS_SERVER, querySameSlot);
			sameSlotExams.push(dataSameSlot.zpaExam);
		}
		dataC.constraintForAncode.sameSlotExams = sameSlotExams;
	}

	const semesterQuery = gql`
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
		}
	`;

	const semesterData = await request(env.PLEXAMS_SERVER, semesterQuery);

	const roomsQuery = gql`
		query {
			rooms {
				name
				seats
				handicap
				lab
				placesWithSocket
				needsRequest
				exahm
				seb
			}
		}
	`;

	const roomsData = await request(env.PLEXAMS_SERVER, roomsQuery);

	return {
		code: params.code,
		exam: dataE.zpaExam,
		constraints: dataC.constraintForAncode,
		semesterConfig: semesterData.semesterConfig,
		rooms: roomsData.rooms
	};
}
