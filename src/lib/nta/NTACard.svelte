<script>
	export let nta;
</script>

<div class="card bg-base-100 shadow-xl m-2">
	<div class="card-body">
		<div class="flex justify-between">
			<span class="text-xl text-green-900">
				{nta.nta.name} ({nta.nta.program})
			</span>
			{#if nta.nta.needsHardware}
				<div class="badge badge-info">spezielle Hardware</div>
			{/if}
			{#if nta.nta.needsRoomAlone}
				<div class="badge badge-warning">eigener Raum</div>
			{/if}
		</div>
		<div>
			<span class="text-blue-900">
				{nta.nta.compensation}
			</span>
			<span class="text-red-500">
				gültig bis {nta.nta.until}
			</span>
		</div>
		<div>
			<span class="text-black-900">
				<ul>
					{#each nta.exams as exam}
						{#if exam.constraints && exam.constraints.notPlannedByMe}
							<li class="text-slate-400">
								{exam.ancode}. {exam.zpaExam.mainExamer}: {exam.zpaExam.module}
							</li>
						{:else}
							<li>
								{exam.ancode}. {exam.zpaExam.mainExamer}: {exam.zpaExam.module}
								{#if exam.constraints && exam.constraints.roomConstraints && exam.constraints.roomConstraints.seb}
									<div class="badge badge-error">SEB</div>
								{/if}
								{#if exam.constraints && exam.constraints.roomConstraints && exam.constraints.roomConstraints.exahm}
									<div class="badge badge-error">EXaHM</div>
								{/if}
								{#if exam.roomName}
									<div class="badge badge-success">{exam.roomName}</div>
								{:else}
									<div class="badge badge-warning">noch nicht geplant</div>
								{/if}
							</li>
						{/if}
					{/each}
				</ul>
			</span>
		</div>
	</div>
</div>
