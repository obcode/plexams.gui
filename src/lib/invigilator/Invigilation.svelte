<script>
	export let invigilation;

	function bg() {
		if (invigilation.isSelfInvigilation) return 'bg-green-300';
		if (invigilation.roomName == null && invigilation.isReserve) return 'bg-yellow-300';
		return 'bg-orange-300';
	}
</script>

<div>
	<span class="badge {bg()}">
		Tag {invigilation.slot.dayNumber}, Slot {invigilation.slot.slotNumber}:
		{#if invigilation.roomName}
			{invigilation.roomName}
		{:else}
			Reserve
		{/if}
	</span>
	{#if invigilation.prePlanned}
		<span title="vorgeplant">📌</span>
	{/if}
</div>
