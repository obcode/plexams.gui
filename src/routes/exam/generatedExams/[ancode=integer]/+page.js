import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
export function load({ params }) {
	throw redirect(308, `/exam/assembledExams/${params.ancode}`);
}
