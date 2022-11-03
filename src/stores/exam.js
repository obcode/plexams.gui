import { env } from '$env/dynamic/public';
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

	request(env.PUBLIC_PLEXAMS_SERVER, query).then((data) => {
		connectedExams.set(data.connectedExams);
	});
};

export const ancodesToPlan = writable([]);
