import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
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

	const data = await request<{ ntas: any[] }>(env.PLEXAMS_SERVER, query);

	const semesterQuery = gql`
		query {
			semester {
				id
			}
		}
	`;

	const semesterData = await request<{ semester: { id: string } }>(
		env.PLEXAMS_SERVER,
		semesterQuery
	);

	return {
		semester: semesterData.semester.id,
		ntas: data.ntas
	};
};
