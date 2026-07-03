<script lang="ts">
	import { page } from '$app/stores';

	let {
		nta,
		ontoggle,
		onedit
	}: { nta: any; ontoggle?: (nta: any) => void; onedit?: (nta: any) => void } = $props();

	const maybeColor = $derived(nta.needsRoomAlone ? 'text-error' : '');
</script>

<tr class={nta.deactivated ? 'opacity-50' : ''}>
	<td>{nta.name}</td>
	<td>
		{#if nta.email}
			{nta.email}
		{:else}
			<i class="text-base-content/40">fehlt</i>
		{/if}
	</td>
	<td><a class="link font-mono" href="/nta/{nta.mtknr}">{nta.mtknr}</a></td>
	<td class={maybeColor}>{nta.compensation}</td>
	<td>{nta.from}</td>
	<td>{nta.until}</td>
	<td>{nta.lastSemester ? nta.lastSemester : '-'}</td>
	<td>
		<label
			class="label cursor-pointer justify-start gap-2 px-0"
			title="Deaktivierung wirkt erst bei der nächsten Aufbereitung/Generierung"
		>
			<input
				type="checkbox"
				class="toggle toggle-sm toggle-success"
				checked={!nta.deactivated}
				disabled={$page.data?.readOnly}
				onchange={() => ontoggle?.(nta)}
			/>
			<span class="text-xs {nta.deactivated ? 'text-error' : 'text-success'}">
				{nta.deactivated ? 'inaktiv' : 'aktiv'}
			</span>
		</label>
	</td>
	<td>
		<button class="btn btn-ghost btn-xs" onclick={() => onedit?.(nta)}>✎ Bearbeiten</button>
	</td>
</tr>
