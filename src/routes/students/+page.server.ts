import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import type { PageServerLoad } from './$types';

type PrimussExam = {
	program: string;
	exams: { ancode: number; module: string; mainExamer: string }[];
};

export const load: PageServerLoad = async () => {
	const data = await request<{ primussExams: PrimussExam[] }>(
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
	const examByKey: Record<string, { module: string; mainExamer: string }> = {};
	for (const pe of data.primussExams ?? []) {
		for (const e of pe.exams ?? []) {
			examByKey[`${pe.program}/${e.ancode}`] = { module: e.module, mainExamer: e.mainExamer };
		}
	}
	return { examByKey };
};
