import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

// Session-Override entfernen → der konfigurierte Default gilt wieder.
export const POST: RequestHandler = () =>
	gqlProxy(gql`
		mutation {
			resetDryRunTestMail {
				override
				current
				default
				overridden
			}
		}
	`);
