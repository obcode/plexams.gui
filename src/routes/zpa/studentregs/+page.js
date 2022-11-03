import { env } from '$env/dynamic/public';
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

	let studentRegsImportErrors;
	await request(env.PUBLIC_PLEXAMS_SERVER, query).then((res) => {
		studentRegsImportErrors = res.studentRegsImportErrors;
	});

	return {
		studentRegsImportErrors
	};
};
