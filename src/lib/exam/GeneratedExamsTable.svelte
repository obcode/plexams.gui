<script>
	export let exams;

	import { goto } from '$app/navigation';
	import { mkStarttime } from '$lib/jshelper/misc.js';

	let searchTermAncode = '';
	let searchTermTeachers = '';
	let searchTermModule = '';
	let searchTermGroups = '';

	// Filter kombinieren (UND): jedes gesetzte Feld grenzt weiter ein.
	$: filteredExams = exams.filter((/** @type {any} */ exam) => {
		if (searchTermAncode && !exam.ancode.toString().startsWith(searchTermAncode.trim())) {
			return false;
		}
		if (
			searchTermModule &&
			!exam.zpaExam.module.toLowerCase().includes(searchTermModule.trim().toLowerCase())
		) {
			return false;
		}
		if (
			searchTermTeachers &&
			!exam.zpaExam.mainExamer.toLowerCase().includes(searchTermTeachers.trim().toLowerCase())
		) {
			return false;
		}
		if (searchTermGroups) {
			const needle = searchTermGroups.trim().toLowerCase();
			const hit = exam.primussExams.some((/** @type {any} */ pe) =>
				pe.exam.program.toLowerCase().startsWith(needle)
			);
			if (!hit) return false;
		}
		return true;
	});

	$: hasFilter = !!(searchTermAncode || searchTermModule || searchTermTeachers || searchTermGroups);

	function clearFilters() {
		searchTermAncode = '';
		searchTermModule = '';
		searchTermTeachers = '';
		searchTermGroups = '';
	}

	/** @param {number} ancode */
	function gotoo(ancode) {
		goto(`/exam/generatedExams/${ancode}`);
	}

	/** @param {any} exam */
	function regs(exam) {
		let sum = 0;
		for (const reg of exam.primussExams) {
			sum += reg.studentRegs.length;
		}
		return sum;
	}

	/** Zeilen-Hintergrund je nach Status (Theme-Tokens, keine festen Farben). */
	/** @param {any} exam */
	function rowClass(exam) {
		if (exam.constraints && exam.constraints.notPlannedByMe) {
			return 'opacity-50';
		}
		if (regs(exam) == 0) {
			return 'bg-error/10';
		}
		return '';
	}
</script>

<div class="flex flex-col gap-3">
	<!-- Suchleiste -->
	<div class="flex flex-wrap items-end gap-2 rounded-lg border border-base-300 bg-base-100 p-3">
		<label class="flex flex-col gap-1">
			<span class="text-xs font-medium text-base-content/60">AnCode</span>
			<input
				class="input input-bordered input-sm w-28"
				type="text"
				bind:value={searchTermAncode}
				placeholder="z. B. 123"
			/>
		</label>
		<label class="flex flex-col gap-1">
			<span class="text-xs font-medium text-base-content/60">Modul</span>
			<input
				class="input input-bordered input-sm w-56"
				type="text"
				bind:value={searchTermModule}
				placeholder="Modulname"
			/>
		</label>
		<label class="flex flex-col gap-1">
			<span class="text-xs font-medium text-base-content/60">Prüfer:in</span>
			<input
				class="input input-bordered input-sm w-48"
				type="text"
				bind:value={searchTermTeachers}
				placeholder="Name"
			/>
		</label>
		<label class="flex flex-col gap-1">
			<span class="text-xs font-medium text-base-content/60">Gruppe</span>
			<input
				class="input input-bordered input-sm w-32"
				type="text"
				bind:value={searchTermGroups}
				placeholder="Studiengang"
			/>
		</label>
		<div class="flex-1"></div>
		<div class="flex items-center gap-2">
			<span class="badge badge-ghost badge-sm tabular-nums">
				{filteredExams.length} / {exams.length}
			</span>
			{#if hasFilter}
				<button class="btn btn-ghost btn-sm" on:click={clearFilters}>zurücksetzen</button>
			{/if}
		</div>
	</div>

	<div class="overflow-x-auto rounded-lg border border-base-300">
		<table class="table table-sm">
			<thead>
				<tr>
					<th>Termin</th>
					<th>AnCode</th>
					<th>Modul</th>
					<th>Prüfer:in</th>
					<th>Dauer</th>
					<th>Wdh.</th>
					<th>Constraints</th>
					<th>Anmeldungen</th>
					<th>NTA</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredExams as exam}
					<tr class="hover {rowClass(exam)}">
						<td class="whitespace-nowrap">
							{#if exam.planEntry != null}
								<div class="flex items-center gap-1">
									{#if exam.planEntry.locked}
										<span title="festgelegt">🔒</span>
									{/if}
									<span class="tabular-nums">{mkStarttime(exam.planEntry.starttime)}</span>
								</div>
							{:else}
								<span class="text-base-content/30">—</span>
							{/if}
						</td>
						<td>
							<button
								class="link link-primary font-medium tabular-nums"
								on:click={() => gotoo(exam.ancode)}
							>
								{exam.ancode}
							</button>
							<div class="mt-0.5 flex flex-wrap gap-1">
								{#each exam.primussExams as primussExam}
									{#if primussExam.exam.ancode != exam.ancode}
										<span class="badge badge-ghost badge-xs tabular-nums">
											{primussExam.exam.program}/{primussExam.exam.ancode}
										</span>
									{/if}
								{/each}
							</div>
						</td>
						<td>{exam.zpaExam.module}</td>
						<td class="whitespace-nowrap">
							{exam.mainExamer.shortname}
							{#if exam.mainExamer.isLBA}<span class="badge badge-secondary badge-sm">LBA</span
								>{/if}
							{#if exam.mainExamer.fk != 'FK07'}
								<span class="badge badge-outline badge-sm">{exam.mainExamer.fk}</span>
							{/if}
						</td>
						<td class="tabular-nums">
							{#if exam.zpaExam.duration > 0}
								{exam.zpaExam.duration}
							{:else}
								<span class="badge badge-warning badge-sm" title="keine Dauer">0</span>
							{/if}
						</td>
						<td class="text-center">
							{#if exam.zpaExam.isRepeaterExam}
								<span title="Wiederholungsprüfung">🔁</span>
							{/if}
						</td>
						<td>
							<div class="flex flex-wrap gap-1">
								{#if exam.constraints && exam.constraints.online}
									<span class="badge badge-warning badge-sm">Online</span>
								{/if}
								{#if exam.constraints && exam.constraints.roomConstraints}
									{#if exam.constraints.roomConstraints.exahm}
										<span class="badge badge-error badge-sm">EXaHM</span>
									{/if}
									{#if exam.constraints.roomConstraints.seb}
										<span class="badge badge-error badge-sm">SEB</span>
									{/if}
									{#if exam.constraints.roomConstraints.lab}
										<span class="badge badge-error badge-sm">Labor</span>
									{/if}
								{/if}
							</div>
						</td>
						<td>
							<div class="flex flex-wrap items-center gap-1">
								{#if regs(exam) == 0}
									<span class="badge badge-error badge-sm tabular-nums">0</span>
								{:else}
									<span class="badge badge-success badge-sm tabular-nums">∑ {regs(exam)}</span>
								{/if}
								{#each exam.primussExams as primussExam}
									{#if primussExam.studentRegs.length > 0}
										<span class="badge badge-ghost badge-sm gap-1">
											{primussExam.exam.program}
											<span class="badge badge-neutral badge-xs tabular-nums">
												{primussExam.studentRegs.length}
											</span>
										</span>
									{/if}
								{/each}
							</div>
						</td>
						<td>
							{#if !exam.constraints || (exam.constraints && !exam.constraints.notPlannedByMe)}
								<div class="flex flex-wrap items-center gap-1">
									{#each exam.primussExams as primussExam}
										{#if primussExam.ntas.length > 0}
											<span class="badge badge-ghost badge-sm gap-1">
												{primussExam.exam.program}
												<span class="badge badge-neutral badge-xs tabular-nums">
													{primussExam.ntas.length}
												</span>
											</span>
											{#each primussExam.ntas as nta}
												{#if nta.needsRoomAlone}
													<span class="badge badge-error badge-sm">Raum</span>
												{/if}
											{/each}
										{/if}
									{/each}
								</div>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		{#if filteredExams.length === 0}
			<div class="p-6 text-center text-sm text-base-content/50">
				Keine Prüfungen entsprechen den Filtern.
			</div>
		{/if}
	</div>
</div>
