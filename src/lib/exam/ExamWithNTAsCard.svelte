<script>
	export let plannedExam;
	export let showOnlyExamsWithNTAs;

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
								{nta.nta.name}, {nta.nta.compensation}
								<div class="flex justify-between m-2">
									<div>{nta.nta.deltaDurationPercent}% Verlängerung</div>
									<div class="w-1/2">
										<progress
											class="progress w-full"
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
