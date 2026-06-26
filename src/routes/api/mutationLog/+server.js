import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { name, ancode, key, value, since, until, limit } = await request.json();

	// datetime-local („2026-06-26T05:00") → volles RFC3339, das der Time-Scalar erwartet
	/** @param {string} v */
	const toISO = (v) => {
		if (!v) return null;
		const d = new Date(v);
		return Number.isNaN(d.getTime()) ? null : d.toISOString();
	};

	const query = gql`
		query (
			$name: String
			$ancode: Int
			$args: [ArgFilterInput!]
			$since: Time
			$until: Time
			$limit: Int
		) {
			mutationLog(
				name: $name
				ancode: $ancode
				args: $args
				since: $since
				until: $until
				limit: $limit
			) {
				time
				name
				type
				args {
					key
					value
				}
				ancodes
				error
				durationMs
			}
		}
	`;

	const variables = {
		name: name || null,
		ancode: ancode === '' || ancode == null ? null : Number(ancode),
		args: key || value ? [{ key: key || null, value: value || null }] : null,
		since: toISO(since),
		until: toISO(until),
		limit: Number(limit) || 200
	};

	try {
		const data = await gqlrequest(env.PLEXAMS_SERVER, query, variables);
		return json(data);
	} catch (e) {
		return json({ error: gqlErrorMessage(e) }, { status: 400 });
	}
}
