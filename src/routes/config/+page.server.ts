import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const data = await backendRequest(gql`
		query {
			semester {
				id
			}
			planer {
				name
				email
				testMail
				cc
				noreplyMail
				noreplyName
				defaultMail
				effectiveTestMail
				effectiveCc
				effectiveNoreplyMail
				effectiveNoreplyName
			}
			semesterConfigInput {
				from
				until
				startTimes
				forbiddenDays
				mucDaiAllowedTimes
				timelagMin
				notTooCloseMinutes
				crossCampusGapMinutes
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
	`);

	// Prüfungstage kommen vom Backend (semesterConfig.days), damit z. B. spätere
	// Samstags-Nutzung nur dort geändert werden muss. Separat + tolerant: ohne Config
	// (frisches Semester) kann semesterConfig fehlschlagen — dann leitet das Formular
	// die Tage aus from/until ab.
	let days: { number: number; date: string }[] = [];
	// Effektive (aus der Config berechnete) Werte für Hinweistexte im Formular.
	let effective: { maxSeatsPerSlot: number } | null = null;
	try {
		const dd = await backendRequest(gql`
			query {
				semesterConfig {
					days {
						date
					}
					maxSeatsPerSlot
				}
			}
		`);
		// Die 1-basierte Tag-Nummer entspricht der Position (Index+1) in den geordneten
		// Tagen; das Setup-Formular (SemesterConfigForm) liest sie als d.number.
		if (dd.semesterConfig?.days)
			days = dd.semesterConfig.days.map((d: any, i: number) => ({ ...d, number: i + 1 }));
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
