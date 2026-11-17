/** @type {import('./$types').PageServerLoad} */
export function load({ url }) {
	// Die Adresse dieser Installation, wie der Browser sie sieht.
	return { endpoint: `${url.origin}/query/token` };
}
