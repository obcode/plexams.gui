import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import { conditionsDoneMap } from '$lib/email/emailConditions';

export async function load() {
	const data = await request(
		env.PLEXAMS_SERVER,
		gql`
			query {
				planningState {
					phases {
						conditions {
							key
							done
						}
					}
				}
				invigilators {
					hasSubmittedRequirements
				}
			}
		`
	);
	// „alle Anforderungen da": jede Aufsicht hat ihre Anforderungen eingetragen
	// → für „Fehlende Anforderungen" ist dann kein echter Versand nötig.
	const invigilators = data.invigilators ?? [];
	const allRequirementsPresent =
		invigilators.length > 0 &&
		invigilators.every((/** @type {any} */ i) => i.hasSubmittedRequirements);

	return {
		conditionsDone: conditionsDoneMap(data.planningState),
		allRequirementsPresent
	};
}
