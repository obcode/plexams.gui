import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () =>
	gqlProxy(gql`
		query {
			studentRegsState {
				dirty
				reason
				changedAt
			}
		}
	`);
