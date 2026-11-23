import { defineEnvVars } from '@sveltejs/kit/env';

/**
 * Every environment variable this app reads. Since SvelteKit 3 a variable exists for the code
 * only once it is declared here: private ones come from `$app/env/private` (server-only),
 * public ones from `$app/env/public`.
 *
 * All of them are read when the process starts, not baked in at build time: one image runs in
 * every installation. All of them are optional and passed through unchanged, exactly as
 * `$env/dynamic/*` handed them out before; each reader states its own fallback.
 *
 * `ORIGIN` is not listed: adapter-node reads it itself, outside the app code.
 */

/** @param {string | undefined} value */
const optional = (value) => value;

export const variables = defineEnvVars({
	PLEXAMS_SERVER: {
		description:
			'GraphQL endpoint for the SSR process and the /api proxies, container-internal in production.',
		schema: optional
	},
	PLEXAMS_PORTAL_SERVER: {
		description: 'GraphQL endpoint of the portal. Unset means it is derived from PLEXAMS_SERVER.',
		schema: optional
	},
	SENTRY_DSN: {
		description: 'Where server-side errors are reported. Unset means no reporting.',
		schema: optional
	},
	SENTRY_ENVIRONMENT: {
		description: 'Environment name attached to server-side reports.',
		schema: optional
	},
	PUBLIC_PLEXAMS_SERVER: {
		public: true,
		description: 'The GraphQL URL as the browser sees it; also the base of the REST routes.',
		schema: optional
	},
	PUBLIC_SENTRY_DSN: {
		public: true,
		description:
			'Where browser errors are reported. Public by design: a DSN may only write. Unset means no reporting.',
		schema: optional
	},
	PUBLIC_SENTRY_ENVIRONMENT: {
		public: true,
		description: 'Environment name attached to browser reports.',
		schema: optional
	},
	PUBLIC_SENTRY_TUNNEL: {
		public: true,
		description:
			'Path of the same-origin tunnel for browser reports. Unset means /monitoring, `off` sends directly.',
		schema: optional
	}
});
