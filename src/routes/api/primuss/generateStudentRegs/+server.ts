import { gql } from 'graphql-request';
import { gqlProxy } from '#lib/server/gqlProxy.js';
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
