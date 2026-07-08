import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

// Offene Issues (FK07PP) in einem Rutsch: die flache Liste (trägt reporter +
// issueType — daraus wird die „nach Typ"-Sicht clientseitig gruppiert) und die
// Gruppierung nach Anfragetyp (Customer Request Type). created ist in den
// Listen bewusst leer (schnell gehalten) — Datum kommt aus der Detail-Query.
export const GET: RequestHandler = async () => {
	return gqlProxy(gql`
		query {
			jiraOpenIssues {
				key
				summary
				status
				issueType
				url
				created
				reporter {
					displayName
				}
			}
			jiraOpenIssuesByRequestType {
				requestType
				issues {
					key
					summary
					status
					url
					reporter {
						displayName
					}
				}
			}
		}
	`);
};
