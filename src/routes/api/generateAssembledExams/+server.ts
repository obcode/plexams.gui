import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = () =>
	gqlProxy(gql`
		mutation {
			generateAssembledExams {
				state {
					dirty
					reason
					changedAt
				}
				changes {
					ancode
					module
					kind
					details
				}
			}
		}
	`);
