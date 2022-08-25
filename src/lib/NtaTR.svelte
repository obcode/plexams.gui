<script>
	export let nta;
	let maybeColor = '';
	if (nta.needsRoomAlone) {
		maybeColor = 'text-red-800';
	}
</script>

<tr class={maybeColor}>
	<td>{nta.name}</td>
	<td><span class="font-mono">{nta.mtknr}</span></td>
	<td>{nta.compensation}</td>
	<td>{nta.until}</td>
	<td>
		{#if nta.lastSemester}
			{nta.lastSemester}
		{:else}
			-
		{/if}
	</td>
</tr>
