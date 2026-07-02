import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

// Terminplan-Generierung: Gate (EXAMS in blockedAreas → Schreiben gesperrt) und
// die aktuell angewandten Constraints (read-only, nach tier sortiert).
export async function load() {
	try {
		const data = await request(
			env.PLEXAMS_SERVER,
			gql`
				query {
					planningState {
						blockedAreas
					}
					examScheduleConstraints {
						name
						title
						description
						kind
						weight
						tier
					}
				}
			`
		);
		return {
			blockedAreas: data.planningState?.blockedAreas ?? [],
			constraints: [...(data.examScheduleConstraints ?? [])].sort(
				(/** @type {any} */ a, /** @type {any} */ b) => a.tier - b.tier
			),
			loadError: ''
		};
	} catch (e) {
		return { blockedAreas: [], constraints: [], loadError: gqlErrorMessage(e) };
	}
}
