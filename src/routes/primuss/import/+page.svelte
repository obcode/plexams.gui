<script>
	import { backendBase, postUpload } from '$lib/email/attachments';
	import EmailSender from '$lib/email/EmailSender.svelte';

	// Sammellisten-Import: ZIP des Sammellisten-Ordners per REST an
	// POST /upload/primuss-zip (Form-Feld `file`). Wiederholbar/inkrementell —
	// Gruppen nacheinander und später erneut (geänderte Daten) hochladbar.

	let uploading = false;
	let blocked = false;
	let uploadError = '';
	/** @type {any} */
	let result = null;

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
			}
		} finally {
			uploading = false;
			input.value = '';
		}
	}

	$: programs = result?.programs ?? [];
	$: skipped = result?.skipped ?? [];
	$: affected = result?.affectedZpaAncodes ?? [];

	// --- Update-Mails an betroffene Prüfungen ---
	/** @type {number | ''} */
	let mailAncode = '';
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Sammellisten importieren</h1>
	</div>

	<div class="alert alert-info py-2 text-sm">
		<span>
			ZIP des Sammellisten-Ordners hochladen. Der Import ist <strong>inkrementell</strong> — du
			kannst Studiengänge nacheinander und später (bei geänderten Daten) <strong>erneut</strong>
			hochladen. Anschließend lassen sich gezielt Update-Mails an die betroffenen Prüfenden senden.
		</span>
	</div>

	<!-- Upload -->
	<div class="flex flex-wrap items-center gap-3 rounded-lg border border-base-300 bg-base-100 p-3">
		<label class="btn btn-primary btn-sm" class:btn-disabled={uploading}>
			{uploading ? 'lädt hoch …' : 'ZIP hochladen'}
			<input
				type="file"
				accept=".zip,application/zip"
				class="hidden"
				on:change={onFile}
				disabled={uploading}
			/>
		</label>
		<span class="text-xs text-base-content/50">Sammellisten-Ordner als ZIP (Form-Feld „file")</span>
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
		<!-- Ergebnis je Gruppe -->
		<div class="overflow-x-auto rounded-lg border border-base-300">
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
							<td class="font-medium">{p.program}</td>
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
			<div class="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
				<span class="font-medium">Übersprungen ({skipped.length}):</span>
				<span class="break-words">{skipped.join(', ')}</span>
			</div>
		{/if}

		<!-- Update-Mails an betroffene Prüfungen -->
		<section class="flex flex-col gap-3">
			<h2 class="text-lg font-semibold text-base-content/80">
				Update-Mails
				{#if affected.length}
					<span class="badge badge-info badge-sm tabular-nums">{affected.length} betroffen</span>
				{/if}
			</h2>
			{#if affected.length}
				<p class="text-sm text-base-content/60">
					Nur die durch den Import <strong>betroffenen</strong> ZPA-Prüfungen. Update-Mail je Prüfung
					einzeln senden (eine nach der anderen) oder per Sammelmail an alle.
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

				<div class="grid grid-cols-1 gap-3 xl:grid-cols-2">
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
					<EmailSender
						emailKey="sendEmailPrimussDataAll"
						title="Update-Mails (alle betroffenen)"
						description="Sammelversand der Primuss-Update-Mails."
						repeatable
					/>
				</div>
			{:else}
				<p class="text-sm text-base-content/50">
					Keine betroffenen ZPA-Prüfungen aus diesem Import.
				</p>
			{/if}
		</section>
	{/if}
</div>
