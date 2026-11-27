<script>
	// Das Layout der Planungsoberfläche: Navigation, Zustands-Polling, Footer.
	// CSS, Theme und Titel liegen im Wurzel-Layout, das auch das Portal teilt.
	import Nav from '#lib/Nav.svelte';
	import Footer from '#lib/Footer.svelte';
	import { browser } from '$app/env';
	import { checkAssembledExams } from '#lib/assembledExams/store.js';
	import { checkStudentRegs } from '#lib/studentRegs/store.js';
	/**
	 * @typedef {Object} Props
	 * @property {import('svelte').Snippet} [children]
	 * @property {import('./$types').LayoutData} [data]
	 */

	/** @type {Props} */
	let { children, data } = $props();

	// Nach jeder erfolgreichen Mutation (POST an /api/…) den „aufbereitete
	// Prüfungen veraltet?"-Zustand sofort neu prüfen. Reiner Beobachter: die
	// Antwort wird unverändert durchgereicht.
	if (browser && !(/** @type {any} */ (window).__geCheckPatched)) {
		/** @type {any} */ (window).__geCheckPatched = true;
		const origFetch = window.fetch.bind(window);
		// Endpoints, die selbst nichts invalidieren (keine Re-Prüfung nötig)
		const skip = [
			'/api/exam/assembledExamsState',
			'/api/exam/generateAssembledExams',
			'/api/primuss/studentRegsState',
			'/api/primuss/generateStudentRegs',
			'/api/log/mutationLog',
			// Todos ändern keine Planungsdaten.
			'/api/todo/'
		];
		window.fetch = async (/** @type {any} */ input, /** @type {any} */ init) => {
			const res = await origFetch(input, init);
			try {
				const url = typeof input === 'string' ? input : (input?.url ?? '');
				const method = (init?.method ?? input?.method ?? 'GET').toUpperCase();
				if (
					res.ok &&
					method === 'POST' &&
					url.includes('/api/') &&
					!skip.some((s) => url.includes(s))
				) {
					checkAssembledExams();
					checkStudentRegs();
				}
			} catch {
				/* ignore */
			}
			return res;
		};
	}
</script>

<!-- At least one window high, so the footer (with the versions) sits at the bottom
     of the window even on a short page. -->
<div class="flex min-h-screen flex-col">
	<Nav />
	<div class="flex flex-1 flex-col px-3 pb-4 sm:px-4 lg:px-8">
		{@render children?.()}
		<div class="mt-auto">
			<Footer
				guiVersion={data?.guiVersion}
				buildTime={data?.buildTime}
				serverInfo={data?.serverInfo}
			/>
		</div>
	</div>
</div>
