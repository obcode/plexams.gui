<script>
	export let group;
	import SlotsMiniMap from '$lib/slot/SlotsMiniMap.svelte';

	let collapsed = group.examGroupInfo.notPlannedByMe;

	function bg(notPlannedByMe) {
		if (notPlannedByMe) {
			return 'bg-red-200';
		}
		return '';
	}

	function regs(exam) {
		let sum = 0;
		for (const reg of exam.studentRegs) {
			sum += reg.studentRegs.length;
		}

		return sum;
	}
</script>

<div class="card lg:card-side bg-base-100 shadow-xl m-3 {bg(group.examGroupInfo.notPlannedByMe)} ">
	<div class="card-body">
		<a href="/exam/examGroups/{group.examGroupCode}">
			<h2 class="card-title">
				Gruppe {group.examGroupCode} mit {group.examGroupInfo.studentRegs} Anmeldungen aus {group
					.examGroupInfo.programs} und maximaler Dauer von {group.examGroupInfo.maxDuration}
			</h2></a
		>
		<ul>
			{#each group.exams as exam}
				<li>
					{exam.exam.ancode}. {exam.exam.zpaExam.mainExamer}: {exam.exam.zpaExam.module}
					<div class="badge badge-success gap-2">{regs(exam.exam)}</div>
				</li>
			{/each}
		</ul>
		{#if !collapsed}
			<h3
				class="text-xl"
				on:click={() => {
					collapsed = !collapsed;
				}}
			>
				Konflikte:
			</h3>
			<div>
				{#each group.examGroupInfo.conflicts as conflict}
					<a href="/exam/examGroups/{conflict.examGroupCode}">
						<button class="btn btn-xs p-1 mx-1">
							{conflict.examGroupCode}
							<div class="badge  badge-secondary  badge-xs">{conflict.count}</div>
						</button>
					</a>
				{/each}
			</div>
			<div><SlotsMiniMap slots={group.examGroupInfo.possibleSlots} /></div>
		{:else}
			<span
				on:click={() => {
					collapsed = !collapsed;
				}}
			>
				...more
			</span>
		{/if}
		<div class="card-actions justify-end">
			Anmeldungen:
			<button class="btn btn-primary">&sum; {group.examGroupInfo.studentRegs}</button>
		</div>
	</div>
</div>
