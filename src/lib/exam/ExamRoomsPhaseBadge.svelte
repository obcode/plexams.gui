<script>
	// Statusanzeige für den EXaHM/SEB-Fixierungs-Stand (Phase A). Speist sich aus
	// der Query examRoomsPhaseState { planned fixed allFixed }.
	//   • allFixed            → grün:  „EXaHM/SEB fixiert: {fixed}/{planned} ✓"
	//   • planned>0 && !allFixed → gelb: „EXaHM/SEB nicht (vollständig) fixiert: …"
	//   • planned === 0       → grau:  „keine EXaHM/SEB-Prüfungen geplant"
	/** @type {{ state: { planned: number, fixed: number, allFixed: boolean } | null }} */
	let { state } = $props();
</script>

{#if state}
	{#if state.planned === 0}
		<span class="badge badge-ghost gap-1" title="keine EXaHM/SEB-Prüfungen geplant">
			keine EXaHM/SEB-Prüfungen geplant
		</span>
	{:else if state.allFixed}
		<span class="badge badge-success gap-1 tabular-nums">
			EXaHM/SEB fixiert: {state.fixed}/{state.planned} ✓
		</span>
	{:else}
		<span
			class="badge badge-warning gap-1 tabular-nums"
			title="Nicht fixierte EXaHM/SEB-Prüfungen können in Phase B den Slot wechseln."
		>
			EXaHM/SEB nicht (vollständig) fixiert: {state.fixed}/{state.planned}
		</span>
	{/if}
{/if}
