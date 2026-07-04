import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import { conditionsDoneMap } from '$lib/email/emailConditions';
import type { PageServerLoad } from './$types';

// Promises NICHT awaiten → SvelteKit streamt sie: die Seite ist sofort da,
// die Inhalte (Gating „bereits gesendet", „alle Anforderungen") laufen nach.
export const load: PageServerLoad = () => {
	const conditionsDone = request<any>(
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
		.then((d) => conditionsDoneMap(d.planningState))
		.catch(() => ({}) as Record<string, boolean>);

	// „alle Anforderungen da": jede Aufsicht hat ihre Anforderungen eingetragen
	// → für „Fehlende Anforderungen" ist dann kein echter Versand nötig.
	const allRequirementsPresent = request<any>(
		env.PLEXAMS_SERVER,
		gql`
			query {
				invigilators {
					hasSubmittedRequirements
				}
			}
		`
	)
		.then((d) => {
			const invigilators = d.invigilators ?? [];
			return invigilators.length > 0 && invigilators.every((i: any) => i.hasSubmittedRequirements);
		})
		.catch(() => false);

	// Empfänger-Kandidaten für die Prüfungsplanungs-Info (Auswahl im UI).
	const examPlanningMailRecipients = request<any>(
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
						fk
						isLBA
					}
					exams {
						ancode
						module
					}
				}
			}
		`
	)
		.then((d) => d.examPlanningMailRecipients ?? [])
		.catch(() => [] as any[]);

	return { conditionsDone, allRequirementsPresent, examPlanningMailRecipients };
};
