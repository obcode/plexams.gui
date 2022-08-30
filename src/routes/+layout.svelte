<script>
	import '../app.css';
	import Nav from '$lib/Nav.svelte';
</script>

<svelte:head><title>Plexams</title></svelte:head>

<div class="p-8">
	<Nav />
	<slot />
</div>
