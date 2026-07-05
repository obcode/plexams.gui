import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

// Nachschlage-Liste ancode → { module, mainExamer } für die Validierungs-Findings
// (dort stehen sonst nur nackte Ancodes). zpaExams enthält auch externe
// MUC.DAI-Prüfungen anderer Fakultäten, daher werden auch deren Ancodes aufgelöst.
export const GET: RequestHandler = () =>
	gqlProxy(
		gql`
			query {
				zpaExams {
					ancode
					module
					mainExamer
				}
			}
		`,
		{}
	);
