import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import { conditionsDoneMap } from '$lib/email/emailConditions';

// Promises NICHT awaiten → SvelteKit streamt sie: die Seite ist sofort da,
// die Inhalte (Gating „bereits gesendet", „alle Anforderungen") laufen nach.
export function load() {
	const conditionsDone = request(
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
			}
		`
	)
		.then((/** @type {any} */ d) => conditionsDoneMap(d.planningState))
		.catch(() => /** @type {Record<string, boolean>} */ ({}));

	// „alle Anforderungen da": jede Aufsicht hat ihre Anforderungen eingetragen
	// → für „Fehlende Anforderungen" ist dann kein echter Versand nötig.
	const allRequirementsPresent = request(
		env.PLEXAMS_SERVER,
		gql`
			query {
				invigilators {
					hasSubmittedRequirements
				}
			}
		`
	)
		.then((/** @type {any} */ d) => {
			const invigilators = d.invigilators ?? [];
			return (
				invigilators.length > 0 &&
				invigilators.every((/** @type {any} */ i) => i.hasSubmittedRequirements)
			);
		})
		.catch(() => false);

	// Empfänger-Kandidaten für die Prüfungsplanungs-Info (Auswahl im UI).
	const examPlanningMailRecipients = request(
		env.PLEXAMS_SERVER,
		gql`
			query {
				examPlanningMailRecipients {
					category
					teacher {
						id
						shortname
						fullname
						email
					}
					exams {
						ancode
					}
				}
			}
		`
	)
		.then((/** @type {any} */ d) => d.examPlanningMailRecipients ?? [])
		.catch(() => /** @type {any[]} */ ([]));

	return { conditionsDone, allRequirementsPresent, examPlanningMailRecipients };
}
