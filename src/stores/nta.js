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

	request('http://localhost:8080/query', query).then((data) => {
		ntas.set(data.ntas);
	});
};
