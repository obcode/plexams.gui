import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';
import type { PageServerLoad } from './$types';

const FIELDS = `
	timelagMin
	iterations
	startTemp
	endTemp
	toleranceMin
	maxSpanHours
	weightMinuteBalance
	weightBeyondTolerance
	weightOverTargetFactor
	weightCoverage
	weightMaxDays
	weightPreferExamDays
	weightDistribution
	weightDaySpan
`;

export const load: PageServerLoad = async () => {
	const data = await request<any>(
		env.PLEXAMS_SERVER,
		gql`
			query {
				generationConfig {
					${FIELDS}
				}
			}
		`
	);
	return { config: data.generationConfig ?? null };
};
