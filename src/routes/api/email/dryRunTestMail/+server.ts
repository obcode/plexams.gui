import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

// Aktueller Probelauf-Empfänger (Session-Override oder konfigurierter Default).
export const GET: RequestHandler = () =>
	gqlProxy(gql`
		query {
			dryRunTestMail {
				override
				current
				default
				overridden
			}
		}
	`);
