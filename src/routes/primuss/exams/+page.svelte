<script>
	import { invalidateAll } from '$app/navigation';
	import { backendBase, postUpload } from '$lib/email/attachments';
	import EmailSender from '$lib/email/EmailSender.svelte';

	export let data;

	let program = data.primussExams.length > 0 ? data.primussExams[0].program : '';

	// --- Sammellisten-Import (ZIP per REST an POST /upload/primuss-zip) ---
	// inkrementell/wiederholbar; nach dem Upload aktualisiert invalidateAll die
	// Anmeldedaten unten.
	let uploading = false;
	let blocked = false;
	let uploadError = '';
	/** @type {any} */
	let result = null;
	/** @type {number | ''} */
	let mailAncode = '';

	/** @param {Event} ev */
	async function onFile(ev) {
		const input = /** @type {HTMLInputElement} */ (ev.target);
		const file = input.files?.[0];
		if (!file) return;
		uploading = true;
		uploadError = '';
		blocked = false;
		try {
			const fd = new FormData();
			fd.append('file', file);
			const r = await postUpload(`${backendBase()}/upload/primuss-zip`, fd);
			if (r.blocked) {
				blocked = true;
			} else if (!r.ok) {
				uploadError = r.error || 'Upload fehlgeschlagen';
			} else {
				result = r.result;
				await invalidateAll(); // Anmeldedaten unten aktualisieren
			}
		} finally {
			uploading = false;
			input.value = '';
		}
	}

	$: programs = result?.programs ?? [];
	$: skipped = result?.skipped ?? [];
	$: affected = result?.affectedZpaAncodes ?? [];
	$: hasFirstImport = programs.some((/** @type {any} */ p) => p.firstImport);

	$: exams = data.primussExams.filter((/** @type {any} */ p) => p.program == program);
	$: rows = exams.length > 0 ? exams[0].exams : [];

	// Studiengänge nach Kategorie gruppieren: FK07 / MUC.DAI / Sonstige
	const CAT_LABEL = /** @type {Record<string, string>} */ ({
		fk07: 'FK07',
		mucdai: 'MUC.DAI',
		misc: 'Sonstige'
	});
	const CAT_ORDER = ['fk07', 'mucdai', 'misc'];
	/** @param {string} prog */
	const catOf = (prog) => data.catByProgram?.[prog] ?? 'misc';

	$: groups = CAT_ORDER.map((key) => ({
		key,
		label: CAT_LABEL[key],
		items: data.primussExams.filter((/** @type {any} */ p) => catOf(p.program) === key)
	})).filter((g) => g.items.length > 0);
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Prüfungslisten aus Primuss</h1>
		<span class="badge badge-primary badge-lg tabular-nums">{data.primussExams.length}</span>
		<span class="text-sm text-base-content/60">Studiengänge</span>
		<div class="flex-1"></div>
		<label class="btn btn-outline btn-sm" class:btn-disabled={uploading}>
			{uploading ? 'lädt hoch …' : 'Sammellisten-ZIP importieren'}
			<input
				type="file"
				accept=".zip,application/zip"
				class="hidden"
				on:change={onFile}
				disabled={uploading}
			/>
		</label>
	</div>

	{#if blocked}
		<div class="alert alert-warning py-2 text-sm">
			<span>
				Import momentan nicht möglich: Es läuft gerade eine Validierung, ein Transfer oder ein
				E-Mail-Versand. Bitte später erneut versuchen.
			</span>
		</div>
	{/if}
	{#if uploadError}
		<div class="alert alert-error py-2 text-sm"><span>{uploadError}</span></div>
	{/if}

	{#if result}
		<!-- Import-Ergebnis (inkrementell/wiederholbar) -->
		<section class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-3">
			<div class="flex items-center gap-2">
				<h2 class="font-semibold">Import-Ergebnis</h2>
				<span class="text-xs text-base-content/50">
					inkrementell — Gruppen nacheinander und später erneut (geänderte Daten) hochladbar
				</span>
				<div class="flex-1"></div>
				<button class="btn btn-ghost btn-xs" on:click={() => (result = null)}>schließen</button>
			</div>

			<div class="overflow-x-auto rounded-lg border border-base-200">
				<table class="table table-sm">
					<thead>
						<tr>
							<th>Studiengang</th>
							<th class="text-right">Prüfungen</th>
							<th class="text-right">Anmeldungen</th>
							<th class="text-right">Konflikte</th>
							<th>geänderte Ancodes</th>
							<th>fehlt</th>
						</tr>
					</thead>
					<tbody>
						{#each programs as p}
							<tr class="hover">
								<td class="font-medium">
									{p.program}
									{#if p.firstImport}
										<span class="badge badge-ghost badge-sm" title="initiale Primuss-Daten">
											Erstimport
										</span>
									{/if}
								</td>
								<td class="text-right tabular-nums">{p.exams}</td>
								<td class="text-right tabular-nums">{p.studentRegs}</td>
								<td class="text-right tabular-nums">{p.conflicts}</td>
								<td class="text-sm">
									{#if (p.changedAncodes ?? []).length}
										<span class="tabular-nums" title={p.changedAncodes.join(', ')}>
											{p.changedAncodes.length} geändert
										</span>
									{:else}
										<span class="text-base-content/30">—</span>
									{/if}
								</td>
								<td>
									{#if (p.missing ?? []).length}
										<div class="flex flex-wrap gap-1">
											{#each p.missing as m}
												<span class="badge badge-warning badge-sm">{m}</span>
											{/each}
										</div>
									{:else}
										<span class="text-base-content/30">—</span>
									{/if}
								</td>
							</tr>
						{:else}
							<tr><td colspan="6" class="py-4 text-center text-sm text-base-content/50">—</td></tr>
						{/each}
					</tbody>
				</table>
			</div>

			{#if skipped.length}
				<div class="rounded-lg border border-warning/40 bg-warning/10 p-2 text-sm">
					<span class="font-medium">Übersprungen ({skipped.length}):</span>
					<span class="break-words">{skipped.join(', ')}</span>
				</div>
			{/if}

			{#if hasFirstImport}
				<div class="alert alert-info py-2 text-sm">
					<span>
						Erstimport dabei — noch keine E-Mails. Nächster Schritt ist die
						<a class="link" href="/exam/connected">Anmeldungszuordnung (ZPA ↔ Primuss)</a>.
					</span>
				</div>
			{/if}

			<!-- Update-Mails nur, wenn der Import etwas geändert hat -->
			{#if affected.length}
				<div class="flex items-center gap-2">
					<h3 class="text-sm font-semibold">Update-Mails</h3>
					<span class="badge badge-info badge-sm tabular-nums">{affected.length} betroffen</span>
				</div>
				<p class="text-xs text-base-content/60">
					Nur die durch den Import <strong>geänderten</strong> ZPA-Prüfungen — je Prüfung einzeln senden.
				</p>
				<div class="flex flex-wrap items-center gap-1">
					<span class="mr-1 text-sm text-base-content/50">betroffene Ancodes:</span>
					{#each affected as a}
						<button
							class="badge gap-1 tabular-nums {mailAncode === a ? 'badge-primary' : 'badge-ghost'}"
							on:click={() => (mailAncode = a)}
						>
							{a}
						</button>
					{/each}
				</div>
				<div class="xl:w-1/2">
					<EmailSender
						emailKey="sendEmailPrimussData"
						title="Update-Mail (gewählte Prüfung)"
						description={mailAncode
							? `Primuss-Update zu Ancode ${mailAncode} (updated).`
							: 'Oben einen betroffenen Ancode wählen.'}
						extraArgs={{
							ancode: { type: 'Int!', value: Number(mailAncode) },
							updated: { type: 'Boolean!', value: true }
						}}
						disabled={!mailAncode}
						repeatable
						confirmText={`Update-Mail zu Ancode ${mailAncode} wirklich senden?`}
					/>
				</div>
			{/if}
		</section>
	{/if}

	<!-- Studiengang-Auswahl, gruppiert nach Kategorie -->
	<div class="flex flex-col gap-2">
		{#each groups as group}
			<div class="flex flex-wrap items-center gap-2">
				<span class="w-20 text-sm font-medium text-base-content/60">{group.label}</span>
				<div class="join flex-wrap">
					{#each group.items as primussExam}
						<input
							type="radio"
							name="program"
							aria-label="{primussExam.program} ({primussExam.exams.length})"
							bind:group={program}
							value={primussExam.program}
							class="btn btn-sm join-item"
						/>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<div class="overflow-x-auto rounded-lg border border-base-300">
		<table class="table table-zebra table-sm">
			<thead>
				<tr>
					<th>AnCode</th>
					<th>Modul</th>
					<th>Prüfer:in</th>
					<th>Art</th>
					<th class="text-right">Anmeldungen</th>
				</tr>
			</thead>
			<tbody>
				{#each rows as exam}
					<tr class={exam.studentRegsCount == 0 ? 'text-base-content/40' : ''}>
						<td class="tabular-nums">{exam.ancode}</td>
						<td>{exam.module}</td>
						<td>{exam.mainExamer}</td>
						<td>{exam.examType}</td>
						<td class="text-right tabular-nums">
							{exam.studentRegsCount}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
