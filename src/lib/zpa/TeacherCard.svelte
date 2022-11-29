<script>
	export let teacher;
	import { fade } from 'svelte/transition';
	import Overlay from '../Overlay.svelte';
	let show = false;
</script>

{#if show}
	<Overlay isModalOpen={show}>
		<div class="mockup-code">
			<pre><code>{JSON.stringify(teacher, null, `\t`)}</code></pre>
		</div></Overlay
	>
{/if}

<div class="card bg-base-100 shadow-xl" on:click={() => (show = true)} transition:fade>
	<div class="card-body">
		{teacher.shortname}
	</div>
</div>
