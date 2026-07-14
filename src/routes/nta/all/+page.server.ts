import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const query = gql`
		query {
			ntas {
				name
				email
				mtknr
				compensation
				deltaDurationPercent
				needsRoomAlone
				needsHardware
				program
				from
				until
				lastSemester
				deactivated
			}
		}
	`;

	const data = await backendRequest<{ ntas: any[] }>(query);

	const semesterQuery = gql`
		query {
			semester {
				id
			}
		}
	`;

	const semesterData = await backendRequest<{ semester: { id: string } }>(semesterQuery);

	return {
		semester: semesterData.semester.id,
		ntas: data.ntas
	};
};
