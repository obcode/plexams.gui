import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = () =>
	gqlProxy(gql`
		mutation {
			generateStudentRegs {
				state {
					dirty
					reason
					changedAt
				}
				studentCount
			}
		}
	`);
