<script>
	export let data;
	import NtaCard from '$lib/nta/NTACard.svelte';

	let showRoomAlone = false;
	let showHardware = false;

	$: filteredNtas =
		data.ntasWithRegs?.filter((ntaWithReg) => {
			if (showRoomAlone && !ntaWithReg.nta.needsRoomAlone) return false;
			if (showHardware && !ntaWithReg.nta.needsHardware) return false;
			return true;
		}) || [];
</script>

<div class="text-center m-2">
	<div class="text-4xl text-center mt-8 uppercase">
		{data.ntasWithRegs.length} Studierende mit Nachteilsausgleich und Anmeldungen im aktuellen Semester
	</div>
</div>

<div class="flex justify-center gap-4 mb-4">
	<label class="flex items-center">
		<input type="checkbox" bind:checked={showRoomAlone} class="mr-2" />
		Nur Einzelraum benötigt
	</label>
	<label class="flex items-center">
		<input type="checkbox" bind:checked={showHardware} class="mr-2" />
		Nur Hardware benötigt
	</label>
</div>

{#if data.ntasWithRegs == null}
	No NTA found in this semester.
{:else}
	<div class="py-4 grid gap-4 grid-cols-3">
		{#each filteredNtas as nta}
			<NtaCard {nta} />
		{/each}
	</div>
{/if}
