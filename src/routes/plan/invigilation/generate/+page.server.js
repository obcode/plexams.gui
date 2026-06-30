import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

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

export async function load() {
	const data = await request(
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
}
