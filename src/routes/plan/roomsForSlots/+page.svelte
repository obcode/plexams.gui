<script lang="ts">
	export let data: PageData;
	let rooms = data.rooms;

	let selectedDays: number[] = [];
	let availableDays: number[] = [];

	$: if (rooms) {
		availableDays = [...new Set(rooms.map((slot) => slot.day))].sort((a, b) => a - b);
	}

	$: filteredSlots =
		selectedDays.length === 0 ? rooms : rooms?.filter((slot) => selectedDays.includes(slot.day));

	function roomAvailable(room: any, slot: any): string {
		if (slot && slot.rooms.map((room) => room.name).includes(room)) {
			return 'X';
		}
		return '';
	}
</script>

<div class="text-center m-2">
	<div class="text-4xl text-center mt-8 uppercase">Verfügbare Räume</div>

	<div class="my-4">
		<label class="label">
			<span class="label-text">Tage auswählen:</span>
		</label>
		<div class="flex flex-wrap gap-2 justify-center">
			{#each availableDays as day}
				<label class="label cursor-pointer">
					<input
						type="checkbox"
						class="checkbox checkbox-primary"
						bind:group={selectedDays}
						value={day}
					/>
					<span class="label-text ml-2">Tag {day}</span>
				</label>
			{/each}
		</div>
	</div>
</div>
<div class="overflow-x-auto w-full">
	<div class="grid grid-cols-1">
		<div class="overflow-x-auto">
			<table class="table table-zebra w-90%">
				<!-- head -->
				<thead>
					<tr>
						<th>Slot</th>
						{#each rooms as room}
							<th>{room.name}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each filteredSlots as slot}
						<tr>
							<td class="font-bold text-right"> ({slot.day}, {slot.slot})</td>
							{#each rooms as room}
								<td>{roomAvailable(room.name, slot)}</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
