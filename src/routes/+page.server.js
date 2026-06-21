import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load() {
	const data = await request(
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
}
