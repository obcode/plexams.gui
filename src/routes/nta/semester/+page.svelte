<script>
	import { mkStarttime } from '$lib/jshelper/misc.js';
	import NtaCard from '$lib/nta/NTACard.svelte';

	export let data;

	// Studierenden-Sicht: Filter
	let showRoomAlone = false;
	let showHardware = false;
	$: filteredNtas = (data.ntasWithRegs ?? []).filter((/** @type {any} */ s) => {
		if (showRoomAlone && !s.nta.needsRoomAlone) return false;
		if (showHardware && !s.nta.needsHardware) return false;
		return true;
	});

	// Prüfungs-Sicht: Suche
	let searchAncode = '';
	let searchModule = '';
	let searchTeacher = '';
	$: filteredExams = (data.examsWithNtas ?? []).filter((/** @type {any} */ exam) => {
		if (searchAncode && !exam.ancode.toString().startsWith(searchAncode)) return false;
		if (searchModule && !exam.zpaExam.module.toLowerCase().includes(searchModule.toLowerCase()))
			return false;
		if (
			searchTeacher &&
			!exam.zpaExam.mainExamer.toLowerCase().includes(searchTeacher.toLowerCase())
		)
			return false;
		return true;
	});
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">NTA im Semester</h1>
		<!-- Umschalter; jede Sicht lädt nur ihre eigenen (teils teuren) Daten -->
		<div role="tablist" class="tabs tabs-boxed">
			<a role="tab" href="?view=students" class="tab {data.view === 'students' ? 'tab-active' : ''}">
				nach Studierenden
			</a>
			<a role="tab" href="?view=exams" class="tab {data.view === 'exams' ? 'tab-active' : ''}">
				nach Prüfungen
			</a>
		</div>
	</div>

	{#if data.view === 'students'}
		<div class="flex flex-wrap items-center gap-4">
			<span class="text-sm text-base-content/60">
				{(data.ntasWithRegs ?? []).length} Studierende mit NTA und Anmeldungen
			</span>
			<label class="label cursor-pointer gap-2">
				<input type="checkbox" bind:checked={showRoomAlone} class="checkbox checkbox-sm" />
				<span class="label-text">nur eigener Raum</span>
			</label>
			<label class="label cursor-pointer gap-2">
				<input type="checkbox" bind:checked={showHardware} class="checkbox checkbox-sm" />
				<span class="label-text">nur Hardware</span>
			</label>
		</div>

		{#if !filteredNtas.length}
			<div class="text-base-content/50">Keine NTAs mit Anmeldungen im aktuellen Semester.</div>
		{:else}
			<div class="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
				{#each filteredNtas as nta (nta.mtknr)}
					<NtaCard {nta} />
				{/each}
			</div>
		{/if}
	{:else}
		<div class="flex flex-wrap items-center gap-2">
			<span class="text-sm text-base-content/60">
				{(data.examsWithNtas ?? []).length} Prüfungen mit NTA
			</span>
			<div class="flex-1"></div>
			<input
				class="input input-bordered input-sm"
				type="text"
				bind:value={searchAncode}
				placeholder="AnCode"
			/>
			<input
				class="input input-bordered input-sm"
				type="text"
				bind:value={searchModule}
				placeholder="Modul"
			/>
			<input
				class="input input-bordered input-sm"
				type="text"
				bind:value={searchTeacher}
				placeholder="Prüfer:in"
			/>
		</div>

		<div class="overflow-x-auto">
			<table class="table table-zebra w-full">
				<thead>
					<tr>
						<th>Termin</th>
						<th>AnCode</th>
						<th>Modul</th>
						<th>Prüfer:in</th>
						<th>Dauer</th>
						<th>Constraints</th>
						<th>NTA</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredExams as exam (exam.ancode)}
						<tr>
							<td>
								{#if exam.planEntry != null}
									<div class="flex items-center gap-2">
										{#if exam.planEntry.locked}
											<span title="festgelegt">🔒</span>
										{/if}
										<span>{mkStarttime(exam.planEntry.starttime)}</span>
									</div>
								{/if}
							</td>
							<td>
								{exam.ancode}
								{#each exam.primussExams as primussExam}
									{#if primussExam.exam.ancode != exam.ancode}
										<div class="badge badge-sm">
											{primussExam.exam.program}/{primussExam.exam.ancode}
										</div>
									{/if}
								{/each}
							</td>
							<td>{exam.zpaExam.module}</td>
							<td>
								{exam.mainExamer.shortname}
								{#if exam.mainExamer.isLBA}<div class="badge badge-secondary badge-sm">LBA</div>{/if}
								{#if exam.mainExamer.fk != 'FK07'}<div class="badge badge-secondary badge-sm">
										{exam.mainExamer.fk}
									</div>{/if}
							</td>
							<td>
								{#if exam.zpaExam.duration > 0}
									{exam.zpaExam.duration} / {exam.maxDuration}
								{:else}
									<div class="badge badge-warning badge-sm">{exam.zpaExam.duration}</div>
								{/if}
							</td>
							<td>
								{#if exam.constraints && exam.constraints.roomConstraints}
									{#if exam.constraints.roomConstraints.seb}
										<div class="badge badge-warning badge-sm">SEB</div>
									{/if}
									{#if exam.constraints.roomConstraints.exahm}
										<div class="badge badge-error badge-sm">EXaHM</div>
									{/if}
								{/if}
							</td>
							<td>
								<ul>
									{#each exam.ntas as nta}
										<li>
											{nta.name}
											<span class="badge badge-sm">
												+{nta.deltaDurationPercent}% =
												{(exam.zpaExam.duration * (100 + nta.deltaDurationPercent)) / 100} Min.
											</span>
											{#if nta.needsRoomAlone}
												<span class="badge badge-error badge-sm">Raum</span>
											{/if}
										</li>
									{/each}
								</ul>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
