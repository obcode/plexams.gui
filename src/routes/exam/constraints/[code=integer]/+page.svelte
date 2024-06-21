<script>
	export let data;
	let constraints = data.constraints;
	let exam = data.exam;
	console.log(data.constraints);
</script>

<div class="text-center m-2 text-4xl">
	<span class="uppercase">
		Constraints für Prüfung <br />
		{exam.ancode}. {exam.module} ({exam.mainExamer})
	</span>
</div>

{#if constraints}
	<div class="flex">
		<label class="label cursor-pointer">
			<input
				type="checkbox"
				class="toggle mx-3"
				bind:checked={constraints.notPlannedByMe}
				on:click={() => {
					console.log('check');
				}}
			/>
			<span class="label-text">Nicht von mir geplant</span>
		</label>
	</div>
	{#if !constraints.notPlannedByMe}
		<div class="flex">
			<label class="label cursor-pointer">
				<input
					type="checkbox"
					class="toggle mx-3"
					bind:checked={constraints.online}
					on:click={() => {
						console.log('check');
					}}
				/>
				<span class="label-text">Online</span>
			</label>
		</div>
		{#if constraints.excludeDays}
			<div>
				{constraints.excludeDays}
			</div>
		{/if}
		{#if constraints.sameSlot}
			<div>
				Im selben Slot
				<table class="table w-auto">
					<tbody>
						{#each constraints.sameSlotExams as sameSlotExam}
							<tr>
								<td>{sameSlotExam.ancode}</td>
								<td>{sameSlotExam.module}</td>
								<td>{sameSlotExam.mainExamer}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
		<div class="mockup-code">
			<pre><code>{JSON.stringify(constraints, undefined, 4)}</code></pre>
		</div>
	{/if}
{:else}
	<div role="alert" class="alert">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			class="stroke-info shrink-0 w-6 h-6"
			><path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
			></path></svg
		>
		<span>Keine Constraints vorhanden.</span>
	</div>
{/if}
