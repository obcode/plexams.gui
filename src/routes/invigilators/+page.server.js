import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load() {
	const data = await request(
		env.PLEXAMS_SERVER,
		gql`
			query {
				permanentNonInvigilators {
					teacherID
					name
					reason
				}
				invigilatorCandidates {
					id
					shortname
					fullname
				}
			}
		`
	);

	const candidates = (data.invigilatorCandidates ?? [])
		.slice()
		.sort((/** @type {any} */ a, /** @type {any} */ b) => a.shortname.localeCompare(b.shortname));
	const permanent = (data.permanentNonInvigilators ?? [])
		.slice()
		.sort((/** @type {any} */ a, /** @type {any} */ b) =>
			(a.name ?? '').localeCompare(b.name ?? '')
		);

	return { permanent, candidates };
}
