<script>
	export let roomsWithInvigilators;
	export let details;
	export let selectedInvigilator;

	let teacherIds = new Set();
	if (roomsWithInvigilators.invigilator) {
		teacherIds.add(roomsWithInvigilators.invigilator.id);
	}
	for (const roomAndExam of roomsWithInvigilators.roomAndExams) {
		teacherIds.add(roomAndExam.exam.mainExamerID);
	}

	let bgRoom = 'bg-red-400';
	$: {
		if (teacherIds.has(selectedInvigilator)) {
			bgRoom = 'bg-blue-400';
		} else {
			bgRoom = 'bg-red-400';
			if (roomsWithInvigilators) {
				if (roomsWithInvigilators.invigilator) {
					bgRoom = 'bg-green-300';
				}
				if (roomsWithInvigilators.name == 'No Room') {
					bgRoom = 'bg-cyan-100';
				}
			}
		}
	}
</script>

<div class="card lg:card-side {bgRoom} shadow-xl m-2 border-2 border-black rounded-lg">
	<div class="card-body">
		<h2 class="card-title">
			{roomsWithInvigilators.name},
			<div class="badge badge-error">{roomsWithInvigilators.studentCount}</div>
			Studs,
			<div class="badge badge-accent">{roomsWithInvigilators.maxDuration}</div>
			Minuten
		</h2>
		{#if roomsWithInvigilators.invigilator}
			<div class="border-2 border-black bg-yellow-300 rounded-lg m-1 p-1">
				{roomsWithInvigilators.invigilator.id}.
				{roomsWithInvigilators.invigilator.shortname}
			</div>
		{/if}
		{#if details}
			<ul>
				{#each roomsWithInvigilators.roomAndExams as roomAndExam}
					<li class="border-2 border-black rounded-lg m-1 p-1">
						{roomAndExam.exam.ancode}. {roomAndExam.exam.mainExamer}: {roomAndExam.exam.module}
						<div class="badge badge-error">{roomAndExam.room.studentsInRoom.length}</div>
						Studs,
						<div class="badge badge-accent">{roomAndExam.room.duration}</div>
						Min.
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
