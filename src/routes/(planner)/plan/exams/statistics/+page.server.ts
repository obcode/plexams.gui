import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
import { gqlErrorMessage } from '$lib/gqlError';
import type { PageServerLoad } from './$types';

// Prüfungsverteilung / Statistik: aggregierte Qualitätskennzahlen des aktuellen
// (gespeicherten) Terminplans aus examSpreadStatistics. Reine Lese-Query; die
// Aufbereitung/Darstellung passiert in der Seite bzw. in $lib/statistics.
//
// Die Kennzahlen beziehen sich auf den „normalen Studienverlauf": Studierende mit
// höchstens maxRegularNonRepeatExams Nicht-Wiederholungsprüfungen. Wiederholungs-
// lastige Ausreißer (excludedStudentCount) sind ausgeblendet; allFreeDayShare gibt
// den freeDayShare über alle Studierenden für einen „kaum abweichend"-Hinweis an.
export const load: PageServerLoad = async () => {
	try {
		const data = await backendRequest(gql`
			query {
				examSpreadStatistics {
					studentCount
					multiExamStudentCount
					totalPlannedExams
					studentsWithUnplannedExams
					avgExamsPerStudent
					maxExamsPerStudent
					freeDayShare
					sameDayShare
					adjacentDayShare
					conflictShare
					threeExamsOneDayCount
					avgMinFreeDays
					medianMinFreeDays
					avgProximityCost
					maxRegularNonRepeatExams
					excludedStudentCount
					allFreeDayShare
					examGapMinutes
					notTooCloseMinutes
					studentBuckets {
						key
						label
						count
						share
					}
					pairBuckets {
						key
						label
						count
						share
					}
					examCountBuckets {
						examCount
						label
						students
						share
					}
					byProgram {
						program
						studentCount
						multiExamStudentCount
						avgExamsPerStudent
						freeDayShare
						sameDayShare
						avgMinFreeDays
						lowSampleSize
					}
					worstStudents {
						mtknr
						name
						program
						group
						examCount
						minFreeDays
						worstLabel
						exams {
							ancode
							module
							starttime
							durationMinutes
						}
					}
				}
			}
		`);
		return { stats: data.examSpreadStatistics ?? null, loadError: '' };
	} catch (e) {
		return { stats: null, loadError: gqlErrorMessage(e) };
	}
};
