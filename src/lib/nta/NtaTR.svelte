<script>
	export let nta;
	let maybeColor = '';
	if (nta.needsRoomAlone) {
		maybeColor = 'text-red-800';
	}
</script>

<tr>
	<td>{nta.name}</td>
	<td>
		{#if nta.email}
			{nta.email}
		{:else}
			<i class="text-slate-400">fehlt</i>
		{/if}
	</td>
	<td><a href="/nta/{nta.mtknr}"><span class="font-mono">{nta.mtknr}</span></a></td>
	<td class={maybeColor}>{nta.compensation}</td>
	<td>{nta.from}</td>
	<td>
		{#if nta.deactivated}
			<i class="text-red-800">deaktiviert</i>
		{:else}
			{nta.until}
		{/if}
	</td>
	<td>
		{#if nta.lastSemester}
			{nta.lastSemester}
		{:else}
			-
		{/if}
	</td>
</tr>
