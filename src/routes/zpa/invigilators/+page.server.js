import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load({ params }) {
	const query = gql`
		query {
			invigilators {
				teacher {
					fullname
					shortname
					isProf
					isLBA
					isProfHC
					isStaff
					lastSemester
					fk
					id
					email
				}
				hasSubmittedRequirements
			}
		}
	`;

	const data = await request(env.PLEXAMS_SERVER, query);

	return {
		invigilators: data.invigilators
	};
}
