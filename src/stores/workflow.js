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
			}
		}
	`;

	request('http://localhost:8080/query', query)
		.then((data) => {
			workflow.set(data.workflow);
		})
		.catch((error) => console.log(error.response.errors[0].message));
};

export const initWorkflow = async () => {
	const mutation = gql`
		mutation {
			initWorkflow {
				number
				name
				done
			}
		}
	`;

	request('http://localhost:8080/query', mutation).then((data) => {
		workflow.set(data.workflow);
	});
};
