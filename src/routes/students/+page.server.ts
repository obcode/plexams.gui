import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
import type { PageServerLoad } from './$types';

type PrimussExam = {
	program: string;
	exams: { ancode: number; module: string; mainExamer: string }[];
};

export const load: PageServerLoad = async () => {
	const data = await backendRequest(gql`
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
	`);

	// Lookup: "program/ancode" → { module, mainExamer }
	const examByKey: Record<string, { module: string; mainExamer: string }> = {};
	for (const pe of data.primussExams ?? []) {
		for (const e of pe.exams ?? []) {
			examByKey[`${pe.program}/${e.ancode}`] = { module: e.module, mainExamer: e.mainExamer };
		}
	}
	return { examByKey };
};
