<script>
	export let data;
	import NtaCard from '$lib/nta/NTACard.svelte';
</script>

<div class="text-center m-2">
	<div class="text-4xl text-center mt-8 uppercase">
		{data.ntasWithRegs.length} Studierende mit Nachteilsausgleich und Anmeldungen im aktuellen Semester
	</div>
</div>

{#if data.ntasWithRegs == null}
	No NTA found in this semester.
{:else}
	<div class="py-4 grid gap-4 grid-cols-3">
		{#each data.ntasWithRegs as nta}
			<NtaCard {nta} />
		{/each}
	</div>
{/if}
