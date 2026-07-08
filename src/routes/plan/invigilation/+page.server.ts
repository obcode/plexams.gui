import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import { combineStarttime } from '$lib/exam/setExamTime';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const semesterQuery = gql`
		query {
			semesterConfig {
				days {
					date
				}
				starttimes {
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

	// Backend liefert keine `number` mehr in days/starttimes — die 1-basierte
	// Nummer entspricht der Position (Index+1) in der geordneten Liste. Rekonstruieren,
	// damit alle nachgelagerten `.number`-Zugriffe (UI-Keys, Kind-Komponenten) weiter greifen.
	semesterConfig.days = (semesterConfig.days ?? []).map((d: any, i: number) => ({
		...d,
		number: i + 1
	}));
	semesterConfig.starttimes = (semesterConfig.starttimes ?? []).map((s: any, i: number) => ({
		...s,
		number: i + 1
	}));

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
		query ($starttime: Time!) {
			roomsWithInvigilationsAt(starttime: $starttime) {
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
							starttime: combineStarttime(day.date, time.start, day.date)
						});
						return { time, slot: data.roomsWithInvigilationsAt };
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
