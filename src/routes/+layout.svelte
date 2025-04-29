<script>
	import '../app.css';
	import Nav from '$lib/Nav.svelte';
	import { themeChange } from 'theme-change';
	import { onMount } from 'svelte';
	onMount(() => {
		themeChange(false);
	});
</script>

<svelte:head><title>Plexams</title></svelte:head>

<div class="p-8">
	<Nav />
	<slot />
</div>
