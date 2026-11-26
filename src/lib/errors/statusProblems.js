import { writable } from 'svelte/store';
import { UNREACHABLE_MESSAGE } from '#lib/errors/plannerErrors.js';

// Status queries the navigation bar polls (assembled exams, registrations, backup,
// semester list). A failed query used to be swallowed: the banners simply kept an
// old or empty state, and the planner could not tell "nothing to do" from "could
// not check". Each query reports here; the bar shows what could not be checked.

/** @typedef {{ label: string, message: string }} StatusProblem */

/** @type {import('svelte/store').Writable<Record<string, StatusProblem>>} */
export const statusProblems = writable({});

/**
 * The query `key` succeeded: forget an earlier problem.
 * @param {string} key
 */
export function statusOk(key) {
	statusProblems.update((m) => {
		if (!(key in m)) return m;
		const next = { ...m };
		delete next[key];
		return next;
	});
}

/**
 * The query `key` failed.
 * @param {string} key
 * @param {string} label what could not be checked, e.g. „Stand der aufbereiteten Prüfungen“
 * @param {string} message why, in German
 */
export function statusFailed(key, label, message) {
	// The general text speaks of an input that was not saved; a status query saves nothing.
	if (message === UNREACHABLE_MESSAGE) message = 'Der Plexams-Server antwortet gerade nicht.';
	statusProblems.update((m) => ({ ...m, [key]: { label, message } }));
}
