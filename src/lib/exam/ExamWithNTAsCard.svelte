<script lang="ts">
	let {
		plannedExam,
		showOnlyExamsWithNTAs,
		details
	}: { plannedExam: any; showOnlyExamsWithNTAs: boolean; details: boolean } = $props();

	const exam = $derived(plannedExam.exam);
	const ntas = $derived(plannedExam.nta);

	const show = $derived(showOnlyExamsWithNTAs ? !!(ntas && ntas.length > 0) : true);

	function bg() {
		if (ntas && ntas.length > 0) return 'bg-yellow-200';

		return 'bg-base-100';
	}
</script>

{#if show}
	<div class="card lg:card-side {bg()} shadow-xl m-3 border border-black rounded-lg">
		<div class="card-body">
			<div>
				<div>{exam.ancode}. {exam.zpaExam.mainExamer}</div>
				<div>{exam.zpaExam.module}</div>
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
										></progress>
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
