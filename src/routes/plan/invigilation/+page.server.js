import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load({ url }) {
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

	const { semesterConfig } = await request(env.PLEXAMS_SERVER, semesterQuery);

	const ntaQuery = gql`
		query {
			ntas {
				mtknr
				name
				compensation
				deltaDurationPercent
				needsRoomAlone
				needsHardware
			}
		}
	`;

	const slotQuery = gql`
		query ($day: Int!, $time: Int!) {
			roomsWithInvigilationsForSlot(day: $day, time: $time) {
				reserve {
					shortname
					id
				}
				reservePrePlanned
				roomsWithInvigilators {
					name
					maxDuration
					studentCount
					prePlanned
					roomAndExams {
						room {
							duration
							studentsInRoom
						}
						exam {
							ancode
							module
							mainExamer
							mainExamerID
						}
					}
					invigilator {
						shortname
						id
					}
				}
			}
		}
	`;

	// load the NTA list and every (day, time) slot in parallel
	const [ntaData, days] = await Promise.all([
		request(env.PLEXAMS_SERVER, ntaQuery),
		Promise.all(
			semesterConfig.days.map(async (/** @type {{ number: number, date: string }} */ day) => {
				const slots = await Promise.all(
					semesterConfig.starttimes.map(
						async (/** @type {{ number: number, start: string }} */ time) => {
							const data = await request(env.PLEXAMS_SERVER, slotQuery, {
								day: day.number,
								time: time.number
							});
							return { time, slot: data.roomsWithInvigilationsForSlot };
						}
					)
				);
				return { ...day, slots };
			})
		)
	]);

	return { semesterConfig, days, ntas: ntaData.ntas ?? [], focus: url.searchParams.get('focus') };
}
