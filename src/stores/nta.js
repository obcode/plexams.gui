import { env } from '$env/dynamic/public';
import { writable } from 'svelte/store';
import { request, gql } from 'graphql-request';

export const ntas = writable([]);

export const fetchNTAs = async () => {
	const query = gql`
		query {
			ntas {
				name
				mtknr
				compensation
				deltaDurationPercent
				needsRoomAlone
				program
				from
				until
				lastSemester
				exams {
					anCode
					module
				}
			}
		}
	`;

	request(env.PLEXAMS_SERVER, query).then((data) => {
		ntas.set(data.ntas);
	});
};
