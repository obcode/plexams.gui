import { writable } from 'svelte/store';
import { request, gql } from 'graphql-request';

export const primussExams = writable([]);

const fetchPrimussExams = async () => {
	const query = gql`
		query {
			primussExams {
				program
				exams {
					anCode
					module
					mainExamer
					program
					examType
					presence
					studentRegs {
						name
					}
					conflicts {
						conflicts {
							anCode
						}
					}
				}
			}
		}
	`;

	request('http://localhost:8080/query', query).then((data) => {
		primussExams.set(data.primussExams);
	});
};

// fetchPrimussExams();
