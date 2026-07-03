import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load() {
	const data = await request(
		env.PLEXAMS_SERVER,
		gql`
			query {
				studyPrograms {
					shortname
					name
					degree
					category
					active
					retired
					externalExamsBase
					faculty
				}
			}
		`
	);

	const programs = (data.studyPrograms ?? [])
		.slice()
		.sort((/** @type {any} */ a, /** @type {any} */ b) => a.shortname.localeCompare(b.shortname));

	return { programs };
}
