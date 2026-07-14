import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
import type { PageServerLoad } from './$types';

type SpecialInterest = { name: string; filename: string; ancodes: number[] };

export const load: PageServerLoad = async () => {
	const data = await backendRequest(gql`
		query {
			specialInterests {
				name
				filename
				ancodes
			}
		}
	`);
	return { interests: data.specialInterests ?? [] };
};
