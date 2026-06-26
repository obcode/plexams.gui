import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { request as gqlrequest, gql } from 'graphql-request';
import { gqlErrorMessage } from '$lib/gqlError';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { name, type, ancode, args, since, until, limit } = await request.json();

	// datetime-local kommt schon als ISO/UTC vom Client; sicherheitshalber normalisieren
	/** @param {string} v */
	const toISO = (v) => {
		if (!v) return null;
		const d = new Date(v);
		return Number.isNaN(d.getTime()) ? null : d.toISOString();
	};

	// nur vollständige key=value-Paare an den Server geben
	const pairs = (Array.isArray(args) ? args : [])
		.map((/** @type {any} */ p) => ({ key: p.key?.trim() || null, value: p.value?.trim() || null }))
		.filter((/** @type {any} */ p) => p.key || p.value);

	const query = gql`
		query (
			$name: String
			$type: String
			$ancode: Int
			$args: [ArgFilterInput!]
			$since: Time
			$until: Time
			$limit: Int
		) {
			mutationLog(
				name: $name
				type: $type
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
		type: type || null,
		ancode: ancode === '' || ancode == null ? null : Number(ancode),
		args: pairs.length ? pairs : null,
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
