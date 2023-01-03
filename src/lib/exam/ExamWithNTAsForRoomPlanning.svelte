<script>
	export let plannedExam;
	export let showOnlyExamsWithNTAs;
	export let details;
	import { onMount } from 'svelte';

	let exam = plannedExam.exam.exam;
	let constraints = plannedExam.exam.constraints;
	let ntas = plannedExam.exam.nta;
	let slot = plannedExam.exam.slot;

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

	let studentsInRoom = 0;
	for (const room of plannedExam.rooms) {
		if (room.room.name != 'No Room') studentsInRoom += room.seatsPlanned;
	}

	let studentRegsWithoutRoom = studentRegs - studentsInRoom;

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
	let roomToUseNTA = [];

	if (ntas) {
		for (let nta of ntas) {
			roomToUseNTA.push('none');
		}
	}

	async function addRoom(nta) {
		if (nta) {
			console.log(`für NTA ${nta} einplanen`);
		} else {
			console.log('als normalen Prüfungsraum einplanen');

			const response = await fetch('/api/rooms/addRoomToExam', {
				method: 'POST',
				body: JSON.stringify({
					input: {
						ancode: exam.ancode,
						day: slot.dayNumber,
						time: slot.slotNumber,
						roomName: roomToUse,
						seatsPlanned: 0,
						duration: exam.duration,
						handicap: false,
						mktnrs: []
					}
				}),
				headers: {
					'content-type': 'application/json'
				}
			});
			let data = await response.json();
			return data.addExamGroupToSlot;
		}
	}

	onMount(() => {
		// fetchRoomsForSlot();
	});

	function bgRoom(room) {
		if (room.name == 'No Room') {
			return 'bg-red-600';
		}
		if (room.name == 'ONLINE') {
			return 'bg-green-600';
		}
		if (room.name == 'R1.046') {
			return 'bg-red-400';
		}
		if (room.name == 'R1.049') {
			return 'bg-blue-300';
		}
		if (room.exahm) {
			return 'bg-cyan-300';
		}
		if (room.lab) {
			return 'bg-yellow-300';
		}
		if (room.handicap) {
			return 'bg-red-200';
		}
		return 'bg-green-300';
	}
</script>

{#if show}
	<div class="card lg:card-side {bg()} shadow-xl m-3 border-2 border-black rounded-lg">
		<div class="card-body">
			<div>
				<div class="flex justify-between">
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
			</div>
			<div class="border-2 border-black bg-orange-300 rounded-lg p-1">
				<div class="badge badge-success">{studentRegs}</div>
				Studierende
				<br />
				{#if studentRegsWithoutRoom > 0}
					<div class="badge badge-error">{studentRegsWithoutRoom}</div>
					ohne Raum
					<br />
				{/if}
				<div class="badge badge-warning">{exam.zpaExam.duration}</div>
				Min.
			</div>

			<div>
				{exam.ancode}. {exam.zpaExam.mainExamer}:
				{exam.zpaExam.module}
			</div>

			<div class="">
				{#each plannedExam.rooms as room}
					{#if room.handicap}
						<div class="border-dashed border-2 border-black {bgRoom(room.room)} rounded-lg m-1 p-1">
							{room.room.name} ({room.students[0].name},
							<div class="badge badge-warning">{room.duration}</div>
							 Minuten)
						</div>
					{:else}
						<div class="border-2 border-black {bgRoom(room.room)}  rounded-lg m-1 p-1">
							{room.room.name}
							{#if room.room.name != 'ONLINE' && room.room.name != 'No Room'}
								({room.seatsPlanned}/{room.room.seats})
								{#if room.reserve}
									<div class="badge badge-info gap-2">Reserve</div>
								{/if}
							{/if}
						</div>
					{/if}
				{/each}
				<!-- <select class="select select-sm select-bordered  select-ghost m-2" bind:value={roomToUse}>
					<option selected value="none">Raum auswählen</option>
					{#each allowedRooms as room}
						<option value={room.name}>{room.name} ({room.seats} Plätze)</option>
					{/each}
				</select>
				<div class="flex mx-2">
					<button class="btn btn-xs btn-outline" on:click={() => addRoom()}> einplanen </button>
				</div> -->
			</div>
			{#if ntas && ntas.length > 0}
				<div>
					<ul>
						{#each ntas as nta, index}
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
								<!-- <div class="p-1 m-2">
									<select
										class="select select-sm select-bordered  select-ghost m-2"
										bind:value={roomToUseNTA[index]}
									>
										<option selected value="none">Raum auswählen</option>
										{#each allowedRooms as room}
											<option value={room.name}>{room.name}</option>
										{/each}
									</select>
									<div class="flex mx-2">
										<button class="btn btn-xs btn-outline" on:click={() => addRoom(nta.nta.mtknr)}>
											einplanen
										</button>
									</div>
								</div> -->
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	</div>
{/if}
