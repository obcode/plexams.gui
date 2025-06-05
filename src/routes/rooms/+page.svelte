<script lang="ts">
	import type { PageData } from './$houdini';
	export let data: PageData;

	$: ({ Rooms } = data);

	let rooms: any = [];
	$: rooms = $Rooms?.data?.rooms || [];

	function onClick(column: any) {
		if (column === 'nta') {
			rooms = $Rooms?.data?.rooms.filter((r) => r.handicap);
		} else if (column === 'lab') {
			rooms = $Rooms?.data?.rooms.filter((r) => r.lab);
		} else if (column === 'placesWithSocket') {
			rooms = $Rooms?.data?.rooms.filter((r) => r.placesWithSocket);
		} else if (column === 'exahm') {
			rooms = $Rooms?.data?.rooms.filter((r) => r.exahm);
		} else if (column === 'seb') {
			rooms = $Rooms?.data?.rooms.filter((r) => r.seb);
		} else if (column === 'needsRequest') {
			rooms = $Rooms?.data?.rooms.filter((r) => r.needsRequest);
		} else if (column === 'seats') {
			rooms = $Rooms?.data?.rooms;
			rooms?.sort((r1: any, r2: any) => r2.seats - r1.seats);
		} else if (column === 'name') {
			rooms = $Rooms?.data?.rooms;
			rooms?.sort((r1: any, r2: any) => r1.name.localeCompare(r2.name));
		}
	}
</script>

<div class="text-center m-2">
	<div class="text-4xl text-center mt-8 uppercase">
		{rooms.length} Räume
	</div>
</div>

<div class="grid grid-cols-1 justify-items-center">
	<div class="overflow-x-auto">
		<table class="table table-zebra">
			<!-- head -->
			<thead>
				<tr>
					<th on:click={() => onClick('name')}>Name</th>
					<th on:click={() => onClick('seats')}>Plätze</th>
					<th on:click={() => onClick('nta')}>NTA</th>
					<th on:click={() => onClick('lab')}>Labor</th>
					<th on:click={() => onClick('placesWithSocket')}>Steckdosen</th>
					<th on:click={() => onClick('exahm')}>EXaHM</th>
					<th on:click={() => onClick('seb')}>SEB</th>
					<th on:click={() => onClick('needsRequest')}>Anforderung</th>
				</tr>
			</thead>
			<tbody>
				{#each rooms as room}
					<tr>
						<td class="font-bold"> {room.name} </td>
						<td class="text-right"> {room.seats} Plätze </td>
						<td>
							{#if room.handicap}
								<div class="badge badge-info">NTA</div>
							{/if}
						</td>
						<td>
							{#if room.lab}
								<div class="badge badge-info">Labor</div>
							{/if}
						</td>
						<td>
							{#if room.placesWithSocket}
								<div class="badge badge-info">Steckdosen</div>
							{/if}
						</td>
						<td>
							{#if room.exahm}
								<div class="badge badge-info">EXaHM</div>
							{/if}
						</td>
						<td>
							{#if room.seb}
								<div class="badge badge-info">SEB</div>
							{/if}
						</td>
						<td>
							{#if room.needsRequest}
								<div class="badge badge-info">Request</div>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
