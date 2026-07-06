<script>
	import '../app.css';
	import Nav from '$lib/Nav.svelte';
	import Footer from '$lib/Footer.svelte';
	import { themeChange } from 'theme-change';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { checkAssembledExams } from '$lib/assembledExams/store';
	import { checkStudentRegs } from '$lib/studentRegs/store';
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
			'/api/log/mutationLog'
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

	onMount(() => {
		themeChange(false);
	});
</script>

<svelte:head><title>Plexams</title></svelte:head>

<div class="p-8">
	<Nav />
	{@render children?.()}
	<Footer guiVersion={data?.guiVersion} serverInfo={data?.serverInfo} />
</div>
