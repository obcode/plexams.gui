import { gql } from 'graphql-request';
import { backendRequest } from '#lib/server/backend.js';
import { TODO_FIELDS } from '#lib/server/todoFields.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const data = await backendRequest(gql`
		query {
			semester {
				id
			}
			planningState {
				blockedAreas
				phases {
					key
					title
					conditions {
						key
						title
						done
						gate
						auto
					}
				}
			}
		}
	`);

	// Eigener Request mit eigenem try/catch: ein Backend ohne Todos darf die
	// Planungs-Checkliste nicht mitreißen.
	let todos = [];
	try {
		const t = await backendRequest(gql`
			query {
				todos(filter: { done: false }) {
					${TODO_FIELDS}
				}
			}
		`);
		todos = t.todos;
	} catch {
		// älteres Backend ohne Todos
	}

	// Portal für Prüfende: ungesichtete Meldungen (alle Semester) und neue Eingaben
	// seit dem letzten Blick in die Änderungsübersicht. Ein älteres Backend kennt das
	// nicht – dann eben ohne.
	let portal: { inbox: { semester: string; kind: string; open: number }[]; unseen: number } = {
		inbox: [],
		unseen: 0
	};
	try {
		const p = await backendRequest<{
			inquiryInboxSummary: { semester: string; kind: string; open: number }[];
			myNotificationSetting: { unseen: { count: number }[] };
		}>(gql`
			query {
				inquiryInboxSummary {
					semester
					kind
					open
				}
				myNotificationSetting {
					unseen {
						count
					}
				}
			}
		`);
		portal = {
			inbox: p.inquiryInboxSummary,
			unseen: p.myNotificationSetting.unseen.reduce((n, u) => n + u.count, 0)
		};
	} catch {
		// älteres Backend ohne Portal
	}

	return {
		portal,
		semester: data.semester.id,
		planningState: data.planningState,
		todos
	};
};
