<script>
	export let nta;
</script>

<div class="card bg-base-100 shadow-xl m-2">
	<div class="card-body">
		<div class="flex justify-between">
			<span class="text-xl text-green-900">
				{nta.nta.name} ({nta.nta.program})
			</span>
			{#if nta.nta.needsRoomAlone}
				<span class="text-red-900 font-extrabold">eigener Raum</span>
			{/if}
		</div>
		<div>
			<span class="text-blue-900">
				{nta.nta.compensation}
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
							</li>
						{/if}
					{/each}
				</ul>
			</span>
		</div>
	</div>
</div>
