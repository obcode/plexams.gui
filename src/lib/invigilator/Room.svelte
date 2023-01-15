<script>
	export let roomsWithInvigilators;

	function bg() {
		if (roomsWithInvigilators.invigilator) return 'bg-green-300';
		if (roomsWithInvigilators.name == 'No Room') return 'bg-cyan-100';
		return 'bg-red-400';
	}
</script>

<div class="card lg:card-side {bg()} shadow-xl m-2 border-2 border-black rounded-lg">
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
		<ul>
			{#each roomsWithInvigilators.roomAndExams as roomAndExam}
				<li class="border-2 border-black rounded-lg m-1 p-1">
					{roomAndExam.exam.ancode}. {roomAndExam.exam.mainExamer}: {roomAndExam.exam.module}
					<div class="badge badge-error">{roomAndExam.room.seatsPlanned}</div>
					Studs,
					<div class="badge badge-accent">{roomAndExam.room.duration}</div>
					Min.
				</li>
			{/each}
		</ul>
	</div>
</div>
