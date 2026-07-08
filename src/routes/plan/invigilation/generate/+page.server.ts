import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import { GENERATION_CONFIG_FIELDS } from '$lib/semester/generationConfig';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const data = await request<any>(
		env.PLEXAMS_SERVER,
		gql`
			query {
				generationConfig {
					${GENERATION_CONFIG_FIELDS}
				}
			}
		`
	);
	return { config: data.generationConfig ?? null };
};
