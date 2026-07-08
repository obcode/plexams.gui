import { gql } from 'graphql-request';
import { gqlProxy } from '$lib/server/gqlProxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { name, type, user, ancode, args, since, until, limit } = await request.json();

	// datetime-local kommt schon als ISO/UTC vom Client; sicherheitshalber normalisieren
	const toISO = (v: string) => {
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
			$user: String
			$ancode: Int
			$args: [ArgFilterInput!]
			$since: Time
			$until: Time
			$limit: Int
		) {
			mutationLog(
				name: $name
				type: $type
				user: $user
				ancode: $ancode
				args: $args
				since: $since
				until: $until
				limit: $limit
			) {
				time
				name
				type
				user
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
		user: user || null,
		ancode: ancode === '' || ancode == null ? null : Number(ancode),
		args: pairs.length ? pairs : null,
		since: toISO(since),
		until: toISO(until),
		limit: Number(limit) || 200
	};

	return gqlProxy(query, variables);
};
