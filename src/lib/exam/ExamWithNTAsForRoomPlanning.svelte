<script>
	export let plannedExam;
	export let showOnlyExamsWithNTAs;
	export let details;
	import { onMount } from 'svelte';

	let exam = plannedExam.exam;
	let constraints = plannedExam.constraints;
	let ntas = plannedExam.nta;
	let slot = plannedExam.slot;

	let show = true;
	$: if (showOnlyExamsWithNTAs) {
		show = ntas && ntas.length > 0;
	} else {
		show = true;
	}

	function bg() {
		if (ntas && ntas.length > 0) return 'bg-yellow-200';
		return 'bg-base-100';
	}

	let studentRegs = 0;
	for (const studReg of exam.studentRegs) {
		studentRegs += studReg.studentRegs.length;
	}

	const exahm =
		constraints != null &&
		constraints.roomConstraints != null &&
		constraints.roomConstraints.exahmRooms;
	const placesWithSocket =
		constraints != null &&
		constraints.roomConstraints != null &&
		constraints.roomConstraints.placesWithSocket;
	const lab =
		constraints != null && constraints.roomConstraints != null && constraints.roomConstraints.lab;

	let allowedRoomsUnfiltered = [];

	async function fetchRoomsForSlot() {
		const day = slot.dayNumber;
		const time = slot.slotNumber;
		const response = await fetch('/api/plan/roomsForSlot', {
			method: 'POST',
			body: JSON.stringify({ day, time }),
			headers: {
				'content-type': 'application/json'
			}
		});
		let data = await response.json();
		// console.log(data.plannedExamsInSlot);
		allowedRoomsUnfiltered = data.roomsForSlot;
	}

	let allowedRooms = [];

	$: if (exahm) {
		allowedRooms = allowedRoomsUnfiltered.filter((room) => room.exahm);
	} else if (lab) {
		allowedRooms = allowedRoomsUnfiltered.filter((room) => room.lab);
	} else if (placesWithSocket) {
		allowedRooms = allowedRoomsUnfiltered.filter((room) => room.placesWithSocket);
	} else {
		allowedRooms = allowedRoomsUnfiltered;
	}

	let roomToUse = 'none';

	onMount(() => {
		fetchRoomsForSlot();
	});
</script>

{#if show}
	<div class="card lg:card-side {bg()} shadow-xl m-3 border border-black rounded-lg">
		<div class="card-body">
			<div>
				{#if exahm}
					<div class="badge badge-error">EXaHM</div>
				{/if}
				{#if placesWithSocket}
					<div class="badge badge-error">Steckdosen</div>
				{/if}
				{#if lab}
					<div class="badge badge-error">Labor</div>
				{/if}
			</div>
			<a href="/exam/examGroups/{exam.ancode}">
				<div>{exam.ancode}. {exam.zpaExam.mainExamer}</div>
				<div>{exam.zpaExam.module}</div>
				<div class="badge badge-success">{studentRegs} Anmeldungen</div>
			</a>
			<div class="p-1 m-2">
				<select class="select select-sm select-bordered  select-ghost m-2" bind:value={roomToUse}>
					<option selected value="none">Raum auswählen</option>
					{#each allowedRooms as room}
						<option value={room.name}>{room.name} ({room.seats} Plätze)</option>
					{/each}
				</select>
				<!-- <div class="flex mx-2">
					<button
						class="btn btn-xs btn-outline"
						disabled={enabledButton(slotToMove)}
						on:click={addToSlot}
					>
						{#if inSlot}
							verschieben
						{:else}
							In Slot einplanen
						{/if}
					</button>
					{#if inSlot}
						<button class="btn-xs btn btn-outline mx-2" on:click={rmFromSlot}>entfernen</button>
					{/if}
				</div> -->
			</div>
			{#if ntas && ntas.length > 0}
				<div>
					<ul>
						{#each ntas as nta}
							<li class="border border-gray-400 rounded m-1 p-1">
								{nta.nta.name}
								{#if nta.nta.needsRoomAlone}
									<div class="badge badge-error">Raum</div>
								{/if}
								{#if details}
									<div>
										{nta.nta.compensation}
									</div>
								{/if}
								<div class="flex justify-between m-2">
									<div>{nta.nta.deltaDurationPercent}%</div>
									<div class="w-3/4">
										<progress
											class="progress progress-error w-full"
											value={nta.nta.deltaDurationPercent}
											max={100}
										/>
									</div>
								</div>
								<div class="p-1 m-2">
									<select
										class="select select-sm select-bordered  select-ghost m-2"
										bind:value={roomToUse}
									>
										<option selected value="none">Raum auswählen</option>
										{#each allowedRooms as room}
											<option value={room.name}>{room.name}</option>
										{/each}
									</select>
									<!-- <div class="flex mx-2">
					<button
						class="btn btn-xs btn-outline"
						disabled={enabledButton(slotToMove)}
						on:click={addToSlot}
					>
						{#if inSlot}
							verschieben
						{:else}
							In Slot einplanen
						{/if}
					</button>
					{#if inSlot}
						<button class="btn-xs btn btn-outline mx-2" on:click={rmFromSlot}>entfernen</button>
					{/if}
				</div> -->
								</div>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	</div>
{/if}
