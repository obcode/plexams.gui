import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load() {
	const data = await request(
		env.PLEXAMS_SERVER,
		gql`
			query {
				mutationLogNames
				mutationLog(limit: 200) {
					time
					name
					type
					args {
						key
						value
					}
					ancodes
					error
					durationMs
				}
			}
		`
	);

	return {
		names: data.mutationLogNames ?? [],
		initial: data.mutationLog ?? []
	};
}
