<script>
	export let plannedExam;
	export let showOnlyExamsWithNTAs;
	export let details;
	export let showRooms;

	let exam = plannedExam.zpaExam;
	let constraints = plannedExam.constraints;
	let ntas = plannedExam.ntas;
	// let slot = plannedExam.planEntry;

	let showRoom = true;
	$: if (showRooms != 'all') {
		showRoom = false;
		for (const room of plannedExam.plannedRooms) {
			if (showRooms == room.room.name) showRoom = true;
		}
	} else {
		showRoom = true;
	}

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

	let studentRegs = plannedExam.studentRegsCount;

	let studentsInRoom = 0;
	if (plannedExam.plannedRooms) {
		for (const room of plannedExam.plannedRooms) {
			if (room.roomName != 'No Room') studentsInRoom += room.studentsInRoom.length;
		}
	}

	let studentRegsWithoutRoom = studentRegs - studentsInRoom;

	const exahm =
		constraints != null && constraints.roomConstraints != null && constraints.roomConstraints.exahm;
	const seb =
		constraints != null && constraints.roomConstraints != null && constraints.roomConstraints.seb;
	const placesWithSocket =
		constraints != null &&
		constraints.roomConstraints != null &&
		constraints.roomConstraints.placesWithSocket;
	const lab =
		constraints != null && constraints.roomConstraints != null && constraints.roomConstraints.lab;

	// let allowedRoomsUnfiltered = [];

	// async function fetchRoomsForSlot() {
	// 	const day = slot.dayNumber;
	// 	const time = slot.slotNumber;
	// 	const response = await fetch('/api/plan/roomsForSlot', {
	// 		method: 'POST',
	// 		body: JSON.stringify({ day, time }),
	// 		headers: {
	// 			'content-type': 'application/json'
	// 		}
	// 	});
	// 	let data = await response.json();
	// 	allowedRoomsUnfiltered = data.roomsForSlot;
	// }

	// let allowedRooms = [];

	// $: if (exahm) {
	// 	allowedRooms = allowedRoomsUnfiltered.filter((room) => room.exahm);
	// } else if (lab) {
	// 	allowedRooms = allowedRoomsUnfiltered.filter((room) => room.lab);
	// } else if (placesWithSocket) {
	// 	allowedRooms = allowedRoomsUnfiltered.filter((room) => room.placesWithSocket);
	// } else {
	// 	allowedRooms = allowedRoomsUnfiltered;
	// }

	// let roomToUse = 'none';
	// let roomToUseNTA = [];

	// if (ntas) {
	// 	for (let nta of ntas) {
	// 		roomToUseNTA.push('none');
	// 	}
	// }

	// async function addRoom(nta) {
	// 	if (nta) {
	// 	} else {

	// 		const response = await fetch('/api/rooms/addRoomToExam', {
	// 			method: 'POST',
	// 			body: JSON.stringify({
	// 				input: {
	// 					ancode: exam.ancode,
	// 					day: slot.dayNumber,
	// 					time: slot.slotNumber,
	// 					roomName: roomToUse,
	// 					seatsPlanned: 0,
	// 					duration: exam.duration,
	// 					handicap: false,
	// 					mktnrs: []
	// 				}
	// 			}),
	// 			headers: {
	// 				'content-type': 'application/json'
	// 			}
	// 		});
	// 		let data = await response.json();
	// 		return data.addExamGroupToSlot;
	// 	}
	// }

	// onMount(() => {
	// 	// fetchRoomsForSlot();
	// });

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
		if (room.exahmRooms) {
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

	function ntaName(exam, mtknr) {
		for (const nta of exam.ntas) {
			if (nta.mtknr == mtknr) {
				return nta.name;
			}
		}
	}

	async function prePlanRoom(ancode, room) {
		const roomName = room.room.name;
		const reserve = room.reserve;
		const mtknr = room.ntaMtknr;

		const res = await fetch('/api/prePlanRoom', {
			method: 'POST',
			body: JSON.stringify({ ancode, roomName, reserve, mtknr }),
			headers: {
				'content-type': 'application/json'
			}
		});

		const result = await res.json();
	}
</script>

{#if show && showRoom}
	<div class="card lg:card-side {bg()} shadow-xl m-3 border-2 border-black rounded-lg">
		<div class="card-body">
			<div>
				<div class="flex justify-between">
					{#if exahm}
						<div class="badge badge-error">EXaHM</div>
					{/if}
					{#if seb}
						<div class="badge badge-error">SEB</div>
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
				<div class="badge badge-warning">{exam.duration}</div>
				Min.
			</div>

			<div>
				{exam.ancode}. {exam.mainExamer}:
				{exam.module}
			</div>

			<div class="">
				{#if plannedExam.plannedRooms}
					{#each plannedExam.plannedRooms as room}
						{#if room.handicap}
							<div
								class="flex border-dashed border-2 border-black {bgRoom(
									room.room
								)} rounded-lg m-1 p-1"
							>
								{#if room.prePlanned}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="24"
										height="24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
										class="icon icon-tabler icon-tabler-calendar-check"
										viewBox="0 0 24 24"
									>
										<path stroke="none" d="M0 0h24v24H0z" fill="none" />
										<path d="M11.5 21h-5.5a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v6" />
										<path d="M16 3v4" />
										<path d="M8 3v4" />
										<path d="M4 11h16" />
										<path d="M15 19l2 2l4 -4" />
									</svg>
								{:else}
									<button
										class="btn btn-xs btn-outline mr-2"
										on:click={() => prePlanRoom(exam.ancode, room)}
									>
										OK
									</button>
								{/if}
								{room.room.name} (
								{#each room.studentsInRoom as student}
									{ntaName(plannedExam, student)};
								{/each}
								<div class="badge badge-warning">{room.duration}</div>
								Minuten)
							</div>
						{:else}
							<div class="flex border-2 border-black {bgRoom(room.room)}  rounded-lg m-1 p-1">
								{#if room.prePlanned}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="24"
										height="24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
										class="icon icon-tabler icon-tabler-calendar-check"
										viewBox="0 0 24 24"
									>
										<path stroke="none" d="M0 0h24v24H0z" fill="none" />
										<path d="M11.5 21h-5.5a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v6" />
										<path d="M16 3v4" />
										<path d="M8 3v4" />
										<path d="M4 11h16" />
										<path d="M15 19l2 2l4 -4" />
									</svg>
								{:else}
									<button
										class="btn btn-xs btn-outline mr-2"
										on:click={() => prePlanRoom(exam.ancode, room)}
									>
										OK
									</button>
								{/if}
								{room.room.name}
								{#if room.room.name != 'ONLINE' && room.room.name != 'No Room'}
									({room.studentsInRoom.length}/{room.room.seats})
									{#if room.reserve}
										<div class="badge badge-info gap-2">Reserve</div>
									{/if}
								{/if}
								{#if room.room.name == 'No Room'}
									({room.studentsInRoom.length})
								{/if}
							</div>
						{/if}
					{/each}
				{:else}
					kein Raum!!!
				{/if}
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
								{nta.name} ({nta.mtknr})
								{#if nta.needsRoomAlone}
									<div class="badge badge-error">Raum</div>
								{/if}
								{#if details}
									<div>
										{nta.compensation}
									</div>
								{/if}
								<div class="flex justify-between m-2">
									<div>{nta.deltaDurationPercent}%</div>
									<div class="w-3/4">
										<!-- svelte-ignore element_invalid_self_closing_tag -->
										<progress
											class="progress progress-error w-full"
											value={nta.deltaDurationPercent}
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
