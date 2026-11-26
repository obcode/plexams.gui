import { plannerErrorMessage, UNREACHABLE_MESSAGE } from '#lib/errors/plannerErrors.js';

// Readable message for a failed graphql-request call. A ClientError carries the
// GraphQL errors under response.errors; each is translated by its code
// (extensions.code), so the planner reads German advice instead of backend text.
// Without a response the backend was not reached at all.
/** @param {any} e */
export function gqlErrorMessage(e) {
	const errs = e?.response?.errors;
	if (Array.isArray(errs) && errs.length) {
		return errs
			.map((/** @type {any} */ x) => plannerErrorMessage(x?.extensions?.code, x?.message))
			.join(' ');
	}
	if (e?.response) return e instanceof Error ? e.message : String(e);
	return UNREACHABLE_MESSAGE;
}

// The code of the first GraphQL error, if it has one.
/** @param {any} e @returns {string | undefined} */
export function gqlErrorCode(e) {
	const code = e?.response?.errors?.[0]?.extensions?.code;
	return typeof code === 'string' ? code : undefined;
}
