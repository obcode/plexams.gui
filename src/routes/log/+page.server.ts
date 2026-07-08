import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import type { PageServerLoad } from './$types';

type MutationLogEntry = {
	time: string;
	name: string;
	type: string;
	user: string | null;
	args: { key: string; value: string }[];
	ancodes: number[];
	error: string | null;
	durationMs: number | null;
};

export const load: PageServerLoad = async () => {
	const data = await request<{ mutationLogNames: string[]; mutationLog: MutationLogEntry[] }>(
		env.PLEXAMS_SERVER,
		gql`
			query {
				mutationLogNames
				mutationLog(limit: 200) {
					time
					name
					type
					user
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
};
