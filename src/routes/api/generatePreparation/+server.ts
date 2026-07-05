import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

// Aufbereitete Prüfungen UND StudentRegs in einem Schritt erzeugen.
export const POST: RequestHandler = () =>
	gqlProxy(gql`
		mutation {
			generatePreparation {
				assembledExams {
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
				studentRegs {
					state {
						dirty
						reason
						changedAt
					}
					studentCount
				}
			}
		}
	`);
