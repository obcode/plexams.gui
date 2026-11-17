import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
import { GENERATION_CONFIG_FIELDS } from '$lib/semester/generationConfig';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const data = await backendRequest(gql`
			query {
				generationConfig {
					${GENERATION_CONFIG_FIELDS}
				}
			}
		`);
	return { config: data.generationConfig ?? null };
};
