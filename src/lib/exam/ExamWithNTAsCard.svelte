<script>
	export let plannedExam;
	export let showOnlyExamsWithNTAs;
	export let details;

	let exam = plannedExam.exam;
	let ntas = plannedExam.nta;

	let show = true;
	$: if (showOnlyExamsWithNTAs) {
		show = ntas && ntas.length > 0;
	} else {
		show = true;
	}
</script>

{#if show}
	<div class="card lg:card-side bg-base-100 shadow-xl m-3">
		<div class="card-body">
			<a href="/exam/examGroups/{exam.ancode}">
				<div>{exam.ancode}. {exam.zpaExam.mainExamer}</div>
				<div>{exam.zpaExam.module}</div>
			</a>
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
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	</div>
{/if}
