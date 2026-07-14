import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const queryTodos = gql`
		query {
			invigilatorTodos {
				sumExamRooms
				sumReserve
				sumOtherContributions
				sumOtherContributionsOvertimeCutted
				invigilatorCount
				todoPerInvigilator
				todoPerInvigilatorOvertimeCutted
				invigilators {
					teacher {
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
					requirements {
						excludedDates
						excludedDays
						examTimes {
							from
							until
						}
						examDays
						partTime
						oralExamsContribution
						liveCodingContribution
						masterContribution
						freeSemester
						overtimeLastSemester
						overtimeThisSemester
						allContributions
						factor
						fromZpa
						timeWindows {
							date
							from
							until
						}
					}
					todos {
						totalMinutes
						doingMinutes
						enough
						invigilationDays
						invigilations {
							roomName
							slot {
								starttime
							}
							isReserve
							isSelfInvigilation
							prePlanned
							duration
						}
					}
				}
			}
		}
	`;

	const dataTodos = await backendRequest(queryTodos);

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
		}
	`;

	const semesterData = await backendRequest(semesterQuery);

	// Backend liefert keine `number` mehr — die 1-basierte Nummer entspricht der
	// Position (Index+1). Rekonstruieren, damit `.number`-Zugriffe in InvigilatorTR/
	// InvigilatorDays weiter funktionieren.
	const semesterConfig = semesterData.semesterConfig;
	if (semesterConfig) {
		semesterConfig.days = (semesterConfig.days ?? []).map((d: any, i: number) => ({
			...d,
			number: i + 1
		}));
		semesterConfig.starttimes = (semesterConfig.starttimes ?? []).map((s: any, i: number) => ({
			...s,
			number: i + 1
		}));
	}

	// Personen, die Aufsicht machen würden (factor > 0), aber per
	// invigilatorConstraints.<id>.isNotInvigilator in der semester.yaml manuell
	// ausgeschlossen sind.
	const excludedQuery = gql`
		query {
			invigilatorsExcludedByConfig {
				teacher {
					id
					fullname
				}
				requirements {
					factor
				}
			}
		}
	`;

	const excludedData = await backendRequest(excludedQuery);

	return {
		semesterConfig,
		todos: dataTodos.invigilatorTodos,
		excludedByConfig: excludedData.invigilatorsExcludedByConfig ?? []
	};
};
