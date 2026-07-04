import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
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
			planningState {
				blockedAreas
			}
		}
	`;

	const { semesterConfig, planningState } = await request<any>(env.PLEXAMS_SERVER, semesterQuery);
	const invigilationsBlocked = (planningState?.blockedAreas ?? []).includes('INVIGILATIONS');

	// Semester noch nicht konfiguriert → leer zurück, die Seite zeigt einen Hinweis
	if (!semesterConfig) {
		return {
			semesterConfig: null,
			days: [] as any[],
			ntas: [] as any[],
			invigilationsBlocked,
			focus: url.searchParams.get('focus')
		};
	}

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
		request<any>(env.PLEXAMS_SERVER, ntaQuery),
		Promise.all(
			semesterConfig.days.map(async (day: { number: number; date: string }) => {
				const slots = await Promise.all(
					semesterConfig.starttimes.map(async (time: { number: number; start: string }) => {
						const data = await request<any>(env.PLEXAMS_SERVER, slotQuery, {
							day: day.number,
							time: time.number
						});
						return { time, slot: data.roomsWithInvigilationsForSlot };
					})
				);
				return { ...day, slots };
			})
		)
	]);

	return {
		semesterConfig,
		days,
		ntas: ntaData.ntas ?? [],
		invigilationsBlocked,
		focus: url.searchParams.get('focus')
	};
};
