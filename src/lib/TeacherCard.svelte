<script>
	export let teacher;
	import { fade } from 'svelte/transition';
	import Overlay from './Overlay.svelte';
	let show = false;
</script>

{#if show}
	<Overlay closingFun={() => (show = false)}
		><pre>{JSON.stringify(teacher, null, `\t`)}</pre></Overlay
	>
{/if}

<div
	class="p-6 bg-gray-100 text-gray-800 text-center rounded-md
	 shadow-sm hover:shadow-md hover:bg-green-200 flex flex-col items-center"
	transition:fade
	on:click={() => (show = true)}
>
	{teacher.fullname}
</div>
