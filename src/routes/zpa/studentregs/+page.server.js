import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export const load = async () => {
	const query = gql`
		query {
			studentRegsImportErrors {
				registration {
					anCode
					mtknr
					program
				}
				error {
					semester
					anCode
					exam
					mtknr
					program
				}
			}
		}
	`;

	let res = await request(env.PLEXAMS_SERVER, query);

	return {
		studentRegsImportErrors: res.studentRegsImportErrors
	};
};
