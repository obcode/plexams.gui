<script lang="ts">
	let {
		roomsWithInvigilators,
		details,
		selectedInvigilator
	}: { roomsWithInvigilators: any; details: boolean; selectedInvigilator: any } = $props();

	const teacherIds = $derived.by(() => {
		const ids = new Set<number>();
		if (roomsWithInvigilators.invigilator) ids.add(roomsWithInvigilators.invigilator.id);
		for (const roomAndExam of roomsWithInvigilators.roomAndExams) {
			ids.add(roomAndExam.exam.mainExamerID);
		}
		return ids;
	});

	const bgRoom = $derived.by(() => {
		if (teacherIds.has(selectedInvigilator)) return 'bg-blue-400';
		if (roomsWithInvigilators) {
			if (roomsWithInvigilators.name == 'No Room') return 'bg-cyan-100';
			if (roomsWithInvigilators.invigilator) return 'bg-green-300';
		}
		return 'bg-red-400';
	});
</script>

<div class="card card-compact lg:card-side {bgRoom} shadow-xl m-2 border-2 border-black rounded-lg">
	<div class="card-body w-full">
		<div class="card-title">
			{roomsWithInvigilators.name}
			<div class="badge badge-error">{roomsWithInvigilators.studentCount}</div>
			<div class="badge badge-accent">{roomsWithInvigilators.maxDuration}</div>
		</div>
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
						<div class="badge badge-error">{roomAndExam.room.studentsInRoom.length} S.</div>
						<div class="badge badge-accent">{roomAndExam.room.duration} Min.</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
