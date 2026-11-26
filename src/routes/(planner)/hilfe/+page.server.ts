import { gql } from 'graphql-request';
import { backendRequest } from '#lib/server/backend.js';
import type { PageServerLoad } from './$types';

// The help page lists the planning steps in the backend's order and wording, so it
// can never describe a step the checklist does not have. Without the backend it
// still renders: the glossary and the general sections need no data.
export const load: PageServerLoad = async () => {
	try {
		const data = await backendRequest(gql`
			query {
				planningState {
					phases {
						key
						title
						conditions {
							key
							title
							done
							gate
							auto
						}
					}
				}
			}
		`);
		return { phases: data.planningState.phases };
	} catch {
		return { phases: [] };
	}
};
