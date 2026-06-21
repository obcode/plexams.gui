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
			}
		`
	);
	return { conditionsDone: conditionsDoneMap(data.planningState) };
}
