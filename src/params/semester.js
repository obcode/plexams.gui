/**
 * Ein Semester wie im Backend: "2027-SS", "2026-WS".
 * @type {import('@sveltejs/kit').ParamMatcher}
 */
export function match(param) {
	return /^\d{4}-(SS|WS)$/.test(param);
}
