<script>
	import '../app.css';
	import Nav from '$lib/Nav.svelte';
	import { themeChange } from 'theme-change';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { checkGeneratedExams } from '$lib/generatedExams/store';
	import { checkStudentRegs } from '$lib/studentRegs/store';

	// Nach jeder erfolgreichen Mutation (POST an /api/…) den „generierte
	// Prüfungen veraltet?"-Zustand sofort neu prüfen. Reiner Beobachter: die
	// Antwort wird unverändert durchgereicht.
	if (browser && !(/** @type {any} */ (window).__geCheckPatched)) {
		/** @type {any} */ (window).__geCheckPatched = true;
		const origFetch = window.fetch.bind(window);
		// Endpoints, die selbst nichts invalidieren (keine Re-Prüfung nötig)
		const skip = [
			'/api/generatedExamsState',
			'/api/generateGeneratedExams',
			'/api/studentRegsState',
			'/api/generateStudentRegs',
			'/api/mutationLog'
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
					checkGeneratedExams();
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
	<slot />
</div>
