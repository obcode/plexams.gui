import { writable } from 'svelte/store';
import { request, gql } from 'graphql-request';

export const semester = writable('...');

const fetchSemester = async () => {
	const query = gql`
		query {
			semester {
				id
			}
		}
	`;

	request('http://localhost:8080/query', query).then((data) => {
		semester.set(data.semester.id);
	});
};

fetchSemester();

export const allSemesterNames = writable([]);

const fetchAllSemester = async () => {
	const query = gql`
		query {
			allSemesterNames {
				id
			}
		}
	`;

	request('http://localhost:8080/query', query).then((data) => {
		allSemesterNames.set(data.allSemesterNames.map((s) => s.id));
	});
};

fetchAllSemester();
