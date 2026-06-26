import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load() {
	const data = await request(
		env.PLEXAMS_SERVER,
		gql`
			query {
				primussExams {
					program
					exams {
						ancode
						module
						mainExamer
					}
				}
			}
		`
	);

	// Lookup: "program/ancode" → { module, mainExamer }
	/** @type {Record<string, {module:string, mainExamer:string}>} */
	const examByKey = {};
	for (const pe of data.primussExams ?? []) {
		for (const e of pe.exams ?? []) {
			examByKey[`${pe.program}/${e.ancode}`] = { module: e.module, mainExamer: e.mainExamer };
		}
	}
	return { examByKey };
}
