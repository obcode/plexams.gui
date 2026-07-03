<script lang="ts">
	type MiniSlot = { dayNumber: number; slotNumber: number };
	type Planned = { dayNumber: number | null; slotNumber: number | null };

	let {
		slots,
		planned = { dayNumber: null, slotNumber: null }
	}: { slots: MiniSlot[]; planned?: Planned } = $props();

	const days = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
	const times = [1, 2, 3, 4, 5, 6];

	// Farb-Map je (Tag,Slot): rot = kein Raum, grün = Raum vorhanden. Reaktiv zu
	// `slots` (früher lief das nur einmal beim Init). Schlüssel „tag,slot" — die
	// Bracket-Notation [[day,time]] im Markup ergibt denselben String.
	const plan = $derived.by(() => {
		const m: Record<string, string> = {};
		for (const i of days) for (const j of times) m[`${i},${j}`] = 'bg-red-500';
		for (const slot of slots) m[`${slot.dayNumber},${slot.slotNumber}`] = 'bg-green-500';
		return m;
	});
</script>

<table>
	{#each times as time}
		<tr>
			{#each days as day}
				<td>
					{#if planned.dayNumber == day && planned.slotNumber == time}
						<span class="m-1 {plan[[day, time]]}">
							<span class="m-2 bg-yellow-200">
								<span>📍</span>
							</span>
						</span>
					{:else}
						<span class="m-1 {plan[[day, time]]}">
							({day},{time})
						</span>
					{/if}
				</td>
			{/each}
		</tr>
	{/each}
</table>
