import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const data = await request<any>(
		env.PLEXAMS_SERVER,
		gql`
			query {
				semester {
					id
				}
				planer {
					name
					email
				}
				semesterConfigInput {
					from
					until
					startTimes
					forbiddenDays
					mucDaiAllowedTimes
					timelagMin
					notTooCloseMinutes
					maxSeatsPerSlot
					emails {
						profs
						lbas
						lbasLastSemester
						additionalExamer
						fs
						sekr
						roomManagement
						kdp
						lbaba
					}
				}
			}
		`
	);

	// Prüfungstage kommen vom Backend (semesterConfig.days), damit z. B. spätere
	// Samstags-Nutzung nur dort geändert werden muss. Separat + tolerant: ohne Config
	// (frisches Semester) kann semesterConfig fehlschlagen — dann leitet das Formular
	// die Tage aus from/until ab.
	let days: { number: number; date: string }[] = [];
	// Effektive (aus der Config berechnete) Werte für Hinweistexte im Formular.
	let effective: { maxSeatsPerSlot: number } | null = null;
	try {
		const dd = await request<any>(
			env.PLEXAMS_SERVER,
			gql`
				query {
					semesterConfig {
						days {
							number
							date
						}
						maxSeatsPerSlot
					}
				}
			`
		);
		if (dd.semesterConfig?.days) days = dd.semesterConfig.days;
		if (dd.semesterConfig) effective = { maxSeatsPerSlot: dd.semesterConfig.maxSeatsPerSlot };
	} catch {
		// ohne Config (frisches Semester) kann semesterConfig fehlschlagen → keine Tage
	}

	return {
		semester: data.semester?.id ?? '',
		// global (semesterübergreifend) in der DB
		planer: data.planer ?? { name: '', email: '' },
		// null = frisches Semester ohne Config → leeres Formular
		config: data.semesterConfigInput ?? null,
		days,
		// effektive Werte (SemesterConfig) für Hinweistexte; null bei frischem Semester
		effective
	};
};
