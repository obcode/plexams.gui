import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';
import type { PageServerLoad } from './$types';

// Prüfungsverteilung / Statistik: aggregierte Qualitätskennzahlen des aktuellen
// (gespeicherten) Terminplans aus examSpreadStatistics. Reine Lese-Query; die
// Aufbereitung/Darstellung passiert in der Seite bzw. in $lib/statistics.
//
// examSpreadStatistics liefert zwei identisch aufgebaute Scopes: `regular`
// (normaler Studienverlauf, ≤ maxRegularNonRepeatExams Nicht-Wdh.-Prüfungen) und
// `all` (alle Studierenden). Dieselbe Feldauswahl wird für beide interpoliert.
const SCOPE_FIELDS = `
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
`;

export const load: PageServerLoad = async () => {
	try {
		const data = await request<any>(
			env.PLEXAMS_SERVER,
			gql`
				query {
					examSpreadStatistics {
						maxRegularNonRepeatExams
						examGapMinutes
						notTooCloseMinutes
						regular {
							${SCOPE_FIELDS}
						}
						all {
							${SCOPE_FIELDS}
						}
					}
				}
			`
		);
		return { stats: data.examSpreadStatistics ?? null, loadError: '' };
	} catch (e) {
		return { stats: null, loadError: gqlErrorMessage(e) };
	}
};
