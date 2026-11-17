import { error, fail } from '@sveltejs/kit';
import { gql } from 'graphql-request';
import { portalRequest } from '$lib/server/backend';
import { portalErrorMessage } from '$lib/portal/errors';
import { preplanInputFromForm } from '$lib/portal/inquiry';

const ENTRY = `
	id
	revision
	teacher {
		id
		fullname
	}
	createdBy
	submittedBy
	submittedAt
	withdrawn
	examKind
	module
	programs
	expectedStudents
	durationMin
	remark
	review
	reviewNote
`;

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
	const semester = params.semester;
	/** @type {any} */
	let data;
	try {
		data = await portalRequest(
			gql`
				query ($semester: String!) {
					inquiries {
						semester
						kind
						state
						open
						deadline
						intro
						affected
						nothingToReport
					}
					preplanSubmissions(semester: $semester) {
						${ENTRY}
					}
					preplanTeachers(semester: $semester) {
						id
						fullname
						shortname
					}
					studyPrograms {
						shortname
						name
					}
				}
			`,
			{ semester }
		);
	} catch (/** @type {any} */ e) {
		const code = e?.response?.errors?.[0]?.extensions?.code;
		if (code === 'NOT_FOUND') error(404, 'Für dieses Semester gibt es keine EXaHM/SEB-Abfrage.');
		error(503, portalErrorMessage(e));
	}
	const inquiry = data.inquiries.find(
		(/** @type {any} */ i) => i.semester === semester && i.kind === 'PREPLAN'
	);
	if (!inquiry) error(404, 'Für dieses Semester gibt es keine EXaHM/SEB-Abfrage.');
	return {
		semester,
		inquiry,
		entries: data.preplanSubmissions,
		teachers: data.preplanTeachers,
		programs: data.studyPrograms
	};
}

/** @param {FormDataEntryValue | null} v */
function optionalInt(v) {
	const s = String(v ?? '').trim();
	return s === '' ? null : Number(s);
}

/** @type {import('./$types').Actions} */
export const actions = {
	save: async ({ request, params }) => {
		const form = await request.formData();
		const input = preplanInputFromForm(form);
		const id = optionalInt(form.get('id'));
		try {
			await portalRequest(
				gql`
					mutation (
						$semester: String!
						$id: Int
						$onBehalfOf: Int
						$expectedRevision: Int
						$input: PreplanInput!
					) {
						submitPreplan(
							semester: $semester
							id: $id
							onBehalfOf: $onBehalfOf
							expectedRevision: $expectedRevision
							input: $input
						) {
							id
						}
					}
				`,
				{
					semester: params.semester,
					id,
					onBehalfOf: id === null ? optionalInt(form.get('onBehalfOf')) : null,
					expectedRevision: optionalInt(form.get('expectedRevision')),
					input
				}
			);
			return { saved: true };
		} catch (e) {
			// Die Eingaben bleiben stehen: sie gehen mit dem Fehler zurück an die Seite.
			return fail(400, { error: portalErrorMessage(e), id, input });
		}
	},
	withdraw: async ({ request, params }) => {
		const form = await request.formData();
		try {
			await portalRequest(
				gql`
					mutation ($semester: String!, $id: Int!, $rev: Int!) {
						withdrawSubmission(semester: $semester, id: $id, expectedRevision: $rev) {
							id
						}
					}
				`,
				{
					semester: params.semester,
					id: Number(form.get('id')),
					rev: Number(form.get('expectedRevision'))
				}
			);
			return { withdrawn: true };
		} catch (e) {
			return fail(400, { error: portalErrorMessage(e) });
		}
	},
	nothing: async ({ request, params }) => {
		const form = await request.formData();
		try {
			await portalRequest(
				gql`
					mutation ($semester: String!, $value: Boolean!) {
						setNothingToReport(semester: $semester, kind: PREPLAN, value: $value) {
							nothingToReport
						}
					}
				`,
				{ semester: params.semester, value: form.get('value') === 'true' }
			);
			return { nothing: true };
		} catch (e) {
			return fail(400, { error: portalErrorMessage(e) });
		}
	}
};
