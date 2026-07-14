import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const data = await backendRequest(gql`
		query {
			semester {
				id
			}
			planningState {
				blockedAreas
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

	return {
		semester: data.semester.id,
		planningState: data.planningState
	};
};
