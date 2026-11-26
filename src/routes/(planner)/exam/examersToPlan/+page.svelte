<script lang="ts">
	import Term from '#lib/help/Term.svelte';
	let { data } = $props();
	const examers = data.examers;

	let searchTerm = $state('');
	let hideFK07Profs = $state(false);

	const filteredExamers = $derived.by(() => {
		let result = examers;

		// Filter FK07 Profs wenn aktiviert
		if (hideFK07Profs) {
			result = result.filter((examer: any) => !(examer.fk === 'FK07' && examer.isProf));
		}

		// Filter nach Suchbegriff
		if (searchTerm) {
			const q = searchTerm.toLowerCase();
			result = result.filter(
				(examer: any) =>
					examer.fullname.toLowerCase().includes(q) ||
					examer.shortname.toLowerCase().includes(q) ||
					examer.fk.toLowerCase().includes(q)
			);
		}

		return result;
	});
</script>

<div class="mx-2 mt-4 mb-3 flex flex-col gap-2">
	<h1 class="text-2xl font-semibold">Prüfende mit zu planenden Prüfungen</h1>
	<p class="max-w-3xl text-sm text-base-content/70">
		Alle Prüfenden, die in diesem Semester mindestens eine zu planende Prüfung haben, mit ihren
		Prüfungen. Die Liste hilft beim Abgleich: Wer muss angeschrieben werden, und wer gehört nicht
		zur eigenen Fakultät (<Term id="fk" />) oder ist <Term id="lba">Lehrbeauftragte:r</Term>? Ändern
		lässt sich hier nichts; die Auswahl der Prüfungen geschieht unter
		<a class="link" href="/exam/examsToPlan">Prüfungen auswählen &amp; Vorgaben</a>.
	</p>
</div>

<div class="flex mb-4 items-center">
	<input
		class="input input-bordered w-full max-w-x mr-2"
		type="text"
		bind:value={searchTerm}
		placeholder="Suche nach Name oder FK"
	/>
	<label class="label cursor-pointer flex items-center gap-2">
		<span class="label-text">FK07 Profs ausblenden</span>
		<input type="checkbox" class="toggle toggle-primary" bind:checked={hideFK07Profs} />
	</label>
</div>

<div class="overflow-x-auto my-2">
	<table class="table table-compact w-full">
		<thead>
			<tr>
				<th>Kurzname</th>
				<th>Name</th>
				<th>FK</th>
				<th>Status</th>
				<th>Prüfungen</th>
				<th>Email</th>
			</tr>
		</thead>
		<tbody>
			{#each filteredExamers as examer}
				<tr>
					<td>{examer.shortname}</td>
					<td>{examer.fullname}</td>
					<td>
						{#if examer.fk != 'FK07'}
							<div class="badge badge-secondary">{examer.fk}</div>
						{:else}
							{examer.fk}
						{/if}
					</td>
					<td>
						{#if examer.isProf}
							<div class="badge badge-primary">Prof</div>
						{/if}
						{#if examer.isLBA}
							<div class="badge badge-secondary">LBA</div>
						{/if}
						{#if examer.isProfHC}
							<div class="badge badge-accent">Prof HC</div>
						{/if}
					</td>
					<td>
						{#each examer.exams as exam}
							<div class="mb-1">
								<a href="/exam/assembledExams/{exam.ancode}" class="font-bold">{exam.ancode}</a>:
								{exam.module}
								{#if exam.groups && exam.groups.length > 0}
									<span class="text-sm text-gray-500">({exam.groups.join(', ')})</span>
								{/if}
								{#if exam.isRepeaterExam}
									<span class="badge badge-warning ml-1">Wdh.</span>
								{/if}
							</div>
						{/each}
					</td>
					<td>
						<a href="mailto:{examer.email}" class="link">{examer.email}</a>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<div class="text-center my-4 text-lg">
	Insgesamt {filteredExamers.length} Prüfende
</div>
