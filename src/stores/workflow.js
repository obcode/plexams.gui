import { writable } from 'svelte/store';
import { request, gql } from 'graphql-request';

export const workflow = writable([]);

export const fetchWorkflow = async () => {
	const query = gql`
		query {
			workflow {
				number
				name
				done
				deadline
			}
		}
	`;

	request('http://localhost:8080/query', query)
		.then((data) => {
			workflow.set(data.workflow);
		})
		.catch((error) => console.log(error.response.errors[0].message));
};

export const nextDeadline = writable({});

export const fetchNextDeadline = async () => {
	const query = gql`
		query {
			nextDeadline {
				number
				name
				done
				deadline
			}
		}
	`;

	request('http://localhost:8080/query', query)
		.then((data) => {
			console.log(data.nextDeadline);
			nextDeadline.set(data.nextDeadline);
		})
		.catch((error) => console.log(error.response.errors[0].message));
};

export function mkDate(datestring) {
	const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
	return new Date(datestring).toLocaleDateString('de-DE', options);
}
