import { defineParams } from '@sveltejs/kit/params';

// Route param matchers, used as `[ancode=integer]` or `[semester=semester]`. Since SvelteKit 3
// they live in this one file instead of src/params/. A matcher returns the param when it
// matches and `undefined` when it does not.

/** @param {string} param */
export function isInteger(param) {
	return /^\d+$/.test(param);
}

/**
 * Ein Semester wie im Backend: "2027-SS", "2026-WS".
 *
 * @param {string} param
 */
export function isSemester(param) {
	return /^\d{4}-(SS|WS)$/.test(param);
}

export const params = defineParams({
	integer: (param) => (isInteger(param) ? param : undefined),
	semester: (param) => (isSemester(param) ? param : undefined)
});
