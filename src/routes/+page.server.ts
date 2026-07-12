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
		`
	);

	return {
		semester: data.semester.id,
		planningState: data.planningState
	};
};
