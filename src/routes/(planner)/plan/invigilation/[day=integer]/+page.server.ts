import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
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
	// Position (Index+1). Rekonstruieren, damit `.number`-Zugriffe (Tag-Auswahl,
	// Kind-Komponenten) weiter funktionieren.
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

	return {
		semesterConfig,
		day: params.day
	};
};
