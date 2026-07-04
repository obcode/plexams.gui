import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import type { PageServerLoad } from './$types';

type SpecialInterest = { name: string; filename: string; ancodes: number[] };

export const load: PageServerLoad = async () => {
	const data = await request<{ specialInterests: SpecialInterest[] }>(
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
};
