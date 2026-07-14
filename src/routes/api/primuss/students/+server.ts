import { json } from '@sveltejs/kit';
import { gql } from 'graphql-request';
import { backendRequest } from '$lib/server/backend';
import { gqlErrorMessage } from '$lib/gqlError';
import type { RequestHandler } from './$types';

const FIELDS = `
	mtknr
	name
	program
	group
	zpaAncodes
	regsWithProgram {
		program
		primussAncode
		zpaAncode
	}
	nta {
		name
		compensation
		deltaDurationPercent
		needsRoomAlone
	}
	zpaStudent {
		firstName
		lastName
		email
	}
`;

export const POST: RequestHandler = async ({ request }) => {
	const { mtknr, regex } = await request.json();
	try {
		if (mtknr) {
			const data = await backendRequest(
				gql`query ($mtknr: String!) { studentByMtknr(mtknr: $mtknr) { ${FIELDS} } }`,
				{ mtknr: String(mtknr) }
			);
			return json({ students: data.studentByMtknr ? [data.studentByMtknr] : [] });
		}
		const data = await backendRequest(
			gql`query ($regex: String!) { studentsByName(regex: $regex) { ${FIELDS} } }`,
			{ regex: String(regex ?? '') }
		);
		return json({ students: data.studentsByName ?? [] });
	} catch (e) {
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
};
