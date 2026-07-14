import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
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
	const data = await backendRequest(gql`
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
	`);

	return {
		names: data.mutationLogNames ?? [],
		initial: data.mutationLog ?? []
	};
};
