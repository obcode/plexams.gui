import { writable } from 'svelte/store';
import { request, gql } from 'graphql-request';

export const connectedExams = writable([]);

export const fetchConnectedExams = async () => {
	const query = gql`
		query {
			connectedExams {
				zpaExam {
					anCode
					module
					mainExamer
					examType
					groups
				}
				primussExams {
					anCode
					module
					mainExamer
					program
					examType
				}
			}
		}
	`;

	request('http://localhost:8080/query', query).then((data) => {
		connectedExams.set(data.connectedExams);
	});
};

export const ancodesToPlan = writable([]);
