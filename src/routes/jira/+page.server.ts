import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';
import type { PageServerLoad } from './$types';

// Verbindung + offene Issues (flach & nach Anfragetyp) in einem Round-Trip
// vorladen. Ein PAT-/Netzwerkfehler darf die Seite nicht killen → als
// connectionError weiterreichen; die interaktiven Teile arbeiten client-seitig.
export const load: PageServerLoad = async () => {
	try {
		const data = await request<{
			jiraConnection: any;
			jiraOpenIssues: any[];
			jiraOpenIssuesByRequestType: any[];
		}>(
			env.PLEXAMS_SERVER,
			gql`
				query {
					jiraConnection {
						name
						displayName
						emailAddress
					}
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
			`
		);
		return {
			connection: data.jiraConnection ?? null,
			openIssues: data.jiraOpenIssues ?? [],
			byRequestType: data.jiraOpenIssuesByRequestType ?? [],
			connectionError: ''
		};
	} catch (e) {
		return {
			connection: null,
			openIssues: [],
			byRequestType: [],
			connectionError: gqlErrorMessage(e)
		};
	}
};
