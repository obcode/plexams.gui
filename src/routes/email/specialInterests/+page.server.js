import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load() {
	const data = await request(
		env.PLEXAMS_SERVER,
		gql`
			query {
				specialInterests {
					name
					filename
					ancodes
				}
			}
		`
	);
	return { interests: data.specialInterests ?? [] };
}
