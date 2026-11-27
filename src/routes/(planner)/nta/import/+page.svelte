<script>
	import { page } from '$app/state';
	import { refreshAll } from '$app/navigation';
	import { isViewer } from '#lib/auth.js';
	import { clientErrorMessage } from '#lib/errors/clientErrors.js';
	import { httpErrorMessage } from '#lib/errors/plannerErrors.js';
	import { backendBase, postUpload } from '#lib/email/attachments.js';
	import PageIntro from '#lib/help/PageIntro.svelte';
	import Term from '#lib/help/Term.svelte';
	import WriteButton from '#lib/WriteButton.svelte';
	import NTAForm from '#lib/nta/NTAForm.svelte';
	import NtaListRow from '#lib/nta/NtaListRow.svelte';
	import {
		SHAREPOINT_URL,
		applyItem,
		countByStatus,
		formatDate,
		rowKey,
		selectedByDefault,
		sortRows,
		uploadSummaryText
	} from '#lib/nta/ntaList.js';

	let { data } = $props();

	let lists = $derived(data.preview.lists);
	let viewer = $derived(isViewer(page.data?.me));
	let total = $derived(
		lists.reduce((/** @type {number} */ n, /** @type {any} */ l) => n + l.rows.length, 0)
	);

	// Selection and corrections, keyed by rowKey. Reset whenever the data changes
	// (after an upload or an apply), so the page always starts from the backend's view.
	/** @type {Record<string, boolean>} */
	let selected = $state({});
	/** @type {Record<string, any>} */
	let edits = $state({});
	/** @type {Record<string, boolean>} */
	let showUnchanged = $state({});
	$effect(() => {
		/** @type {Record<string, boolean>} */
		const next = {};
		for (const l of lists) for (const r of l.rows) next[rowKey(l.fk, r)] = selectedByDefault(r);
		selected = next;
		edits = {};
	});

	let selectedRows = $derived(
		lists.flatMap((/** @type {any} */ l) =>
			l.rows
				.filter((/** @type {any} */ r) => selected[rowKey(l.fk, r)])
				.map((/** @type {any} */ r) => ({ fk: l.fk, row: r }))
		)
	);

	// --- Upload (POST /upload/nta-list) ---
	let uploading = $state(false);
	let blocked = $state(false);
	let uploadError = $state('');
	/** @type {string[]} */
	let uploadSummary = $state([]);

	/** @param {Event} ev */
	async function onFiles(ev) {
		const input = /** @type {HTMLInputElement} */ (ev.target);
		const files = [...(input.files ?? [])];
		if (files.length === 0) return;
		uploading = true;
		uploadError = '';
		blocked = false;
		uploadSummary = [];
		applyResult = '';
		try {
			const fd = new FormData();
			for (const f of files) fd.append('file', f);
			const r = await postUpload(`${backendBase()}/upload/nta-list`, fd);
			if (r.blocked) {
				blocked = true;
			} else if (!r.ok) {
				uploadError = r.error || 'Das Einlesen ist fehlgeschlagen. Versuche es noch einmal.';
			} else {
				uploadSummary = (r.result?.lists ?? []).map(uploadSummaryText);
				await refreshAll();
			}
		} finally {
			uploading = false;
			input.value = '';
		}
	}

	// --- Apply (applyNTAList) ---
	let applying = $state(false);
	let applyError = $state('');
	let applyResult = $state('');

	async function apply() {
		applying = true;
		applyError = '';
		applyResult = '';
		const items = selectedRows.map((/** @type {{ fk: string, row: any }} */ { fk, row }) =>
			applyItem(row, edits[rowKey(fk, row)])
		);
		try {
			const res = await fetch('/api/nta/applyNTAList', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ items })
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok || result?.error) {
				applyError = result?.error ?? httpErrorMessage(res.status);
				return;
			}
			const { added, updated } = result.applyNTAList ?? result;
			applyResult = `Übernommen: ${added} neu angelegt, ${updated} aktualisiert.`;
			uploadSummary = [];
			await refreshAll();
		} catch (err) {
			applyError = clientErrorMessage(err);
		} finally {
			applying = false;
		}
	}

	// --- Remove a list (removeNTAList) ---
	let removeError = $state('');
	/** @param {any} list */
	async function removeList(list) {
		if (
			!confirm(
				`Die eingelesene Liste ${list.faculty} entfernen? Die NTA-Stammdaten bleiben, wie sie sind.`
			)
		)
			return;
		removeError = '';
		try {
			const res = await fetch('/api/nta/removeNTAList', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ fk: list.fk })
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok || result?.error) {
				removeError = result?.error ?? httpErrorMessage(res.status);
				return;
			}
			await refreshAll();
		} catch (err) {
			removeError = clientErrorMessage(err);
		}
	}

	// --- Correct a proposal ---
	/** @type {{ key: string, row: any } | null} */
	let editing = $state(null);
	/** @param {string} key @param {any} row */
	function openEdit(key, row) {
		editing = { key, row };
	}
	/** @param {any} input */
	function onEdited(input) {
		if (!editing) return;
		edits[editing.key] = input;
		selected[editing.key] = true;
		editing = null;
	}
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<PageIntro
		title="NTA-Liste einlesen"
		count={total}
		subtitle="Einträge in den eingelesenen Listen"
	>
		Die <Term id="nta">Nachteilsausgleiche</Term> kommen nicht mehr als Bescheid per E-Mail. Die Geschäftsstelle
		des Prüfungsausschusses legt je Fakultät eine Excel-Liste in einen SharePoint-Ordner. Lade die Listen
		dort herunter und hier hoch: Plexams vergleicht jede Zeile mit den NTA-Stammdaten und zeigt, was neu
		ist, was sich geändert hat und was gleich geblieben ist. In die Stammdaten kommt nur, was du auswählst
		und übernimmst.
		{#snippet howto()}
			<ol class="ml-5 list-decimal">
				<li>
					Den SharePoint-Ordner öffnen und die aktuellen Listen herunterladen (z. B.
					<span class="font-mono">226_07_Liste_NTA_Stand_27-11-26.xlsx</span> für FK 07 und
					<span class="font-mono">226_21_…</span> für FK 21, MUC.DAI).
				</li>
				<li>
					Die Dateien hier hochladen, gern mehrere auf einmal. Eine neue Liste einer Fakultät
					ersetzt die vorherige; Plexams sagt dir, was sich seit dem letzten Stand geändert hat.
				</li>
				<li>
					Die Zeilen durchsehen. „Unvollständig“ heißt, dass Plexams den Text nicht ganz lesen
					konnte: mit „Bearbeiten“ korrigieren, dann ist die Zeile ausgewählt.
				</li>
				<li>„Übernehmen“ legt neue NTAs an und aktualisiert geänderte.</li>
			</ol>
			<p class="mt-2">
				Die Liste ist <b>nicht vollständig</b>: Sie enthält nur Nachteilsausgleiche, die ab 2026 neu
				gewährt wurden. Ältere stehen weiterhin nur in den NTA-Stammdaten. Änderungen der
				Prüfungsform stehen gar nicht drin. Nach jeder Sitzung des Prüfungsausschusses wird die
				Liste ergänzt; dann einfach die neue Datei hochladen. Die Anmeldungen in der Liste dienen
				nur zum Vergleich, denn Primuss ist oft aktueller.
			</p>
		{/snippet}
		{#snippet actions()}
			<a
				class="btn btn-outline btn-sm"
				href={SHAREPOINT_URL}
				target="_blank"
				rel="noopener noreferrer"
			>
				SharePoint-Ordner mit den NTA-Listen öffnen ↗
			</a>
		{/snippet}
	</PageIntro>

	{#if !viewer}
		<div class="flex flex-col gap-2 rounded-lg border border-base-300 bg-base-100 p-4">
			<div class="flex flex-wrap items-center gap-3">
				<label class="btn btn-primary btn-sm gap-2" class:btn-disabled={uploading || data.readOnly}>
					{#if uploading}<span class="loading loading-spinner loading-xs"></span>{/if}
					NTA-Listen (.xlsx) einlesen …
					<input
						type="file"
						accept=".xlsx"
						multiple
						class="hidden"
						disabled={uploading || data.readOnly}
						onchange={onFiles}
					/>
				</label>
				<span class="text-xs text-base-content/60"> Einlesen ändert noch keine Stammdaten. </span>
			</div>
			{#if blocked}
				<div class="alert alert-warning py-2 text-sm">
					<span>
						Gerade läuft eine Validierung, ein Import, eine Übertragung oder ein E-Mail-Versand.
						Lies die Liste danach noch einmal ein.
					</span>
				</div>
			{/if}
			{#if uploadError}
				<div class="alert alert-error py-2 text-sm"><span>{uploadError}</span></div>
			{/if}
			{#each uploadSummary as line}
				<div class="alert alert-success py-2 text-sm"><span>{line}</span></div>
			{/each}
		</div>
	{/if}

	{#if removeError}
		<div class="alert alert-error py-2 text-sm"><span>{removeError}</span></div>
	{/if}

	{#if lists.length === 0}
		<div
			class="rounded-lg border border-dashed border-base-300 p-6 text-center text-sm text-base-content/60"
		>
			Für dieses Semester ist noch keine NTA-Liste eingelesen.
		</div>
	{:else if !data.preview.primussRegsAvailable}
		<p class="text-xs text-base-content/60">
			Es sind noch keine Primuss-Anmeldungen importiert. Sobald sie da sind, vergleicht diese Seite
			die Anmeldungen der Liste mit denen aus Primuss.
		</p>
	{/if}

	{#each lists as list (list.fk)}
		{@const counts = countByStatus(list.rows)}
		{@const rows = sortRows(list.rows)}
		{@const visible = showUnchanged[list.fk]
			? rows
			: rows.filter((/** @type {any} */ r) => r.status !== 'UNCHANGED')}
		<section class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
			<div class="flex flex-wrap items-center gap-2">
				<h2 class="text-lg font-semibold">{list.faculty}</h2>
				{#if counts.NEW}<span class="badge badge-success badge-sm">{counts.NEW} neu</span>{/if}
				{#if counts.CHANGED}<span class="badge badge-warning badge-sm">
						{counts.CHANGED} geändert
					</span>{/if}
				{#if counts.PROBLEM}<span class="badge badge-error badge-sm">
						{counts.PROBLEM} unvollständig
					</span>{/if}
				<span class="badge badge-ghost badge-sm">{counts.UNCHANGED} unverändert</span>
				<div class="flex-1"></div>
				<WriteButton class="btn btn-ghost btn-xs" onclick={() => removeList(list)}>
					Liste entfernen
				</WriteButton>
			</div>
			<div class="text-xs text-base-content/60">
				<span class="font-mono">{list.filename}</span>
				{#if list.stand}· Stand {formatDate(list.stand, true)}{/if}
				· eingelesen {formatDate(list.importedAt, true)}{#if list.importedBy}&nbsp;von {list.importedBy}{/if}
			</div>
			{#if !list.semesterMatches}
				<div class="alert alert-warning py-2 text-sm">
					<span>
						Diese Liste gehört {list.semester
							? `zum Semester ${list.semester}`
							: 'zu keinem erkennbaren Semester'}, nicht zu {data.semester}. Prüfe, ob du die
						richtige Datei erwischt hast.
					</span>
				</div>
			{/if}
			{#each list.warnings as w}
				<div class="alert alert-warning py-2 text-sm"><span>{w}</span></div>
			{/each}

			<div class="overflow-x-auto">
				<table class="table table-sm w-full">
					<thead>
						<tr>
							<th></th>
							<th>Status</th>
							<th>Studierende</th>
							<th>Nachteilsausgleich laut Liste</th>
							<th>Abgleich</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each visible as row (row.line)}
							{@const key = rowKey(list.fk, row)}
							<NtaListRow
								{row}
								checked={!!selected[key]}
								edited={edits[key]}
								primussRegsAvailable={data.preview.primussRegsAvailable}
								readonly={viewer}
								ontoggle={(c) => (selected[key] = c)}
								onedit={() => openEdit(key, row)}
							/>
						{/each}
					</tbody>
				</table>
			</div>
			{#if counts.UNCHANGED}
				<button
					class="btn btn-ghost btn-xs self-start"
					onclick={() => (showUnchanged[list.fk] = !showUnchanged[list.fk])}
				>
					{showUnchanged[list.fk]
						? 'Unveränderte ausblenden'
						: `${counts.UNCHANGED} unveränderte anzeigen`}
				</button>
			{/if}
		</section>
	{/each}

	{#if lists.length && !viewer}
		<div
			class="sticky bottom-2 flex flex-wrap items-center gap-3 rounded-lg border border-base-300 bg-base-200 p-3 shadow"
		>
			<WriteButton
				class="btn btn-primary btn-sm gap-2"
				disabled={applying || selectedRows.length === 0}
				onclick={apply}
			>
				{#if applying}<span class="loading loading-spinner loading-xs"></span>{/if}
				{selectedRows.length === 1 ? 'Ausgewähltes NTA' : `Ausgewählte ${selectedRows.length} NTAs`} in
				die Stammdaten übernehmen
			</WriteButton>
			<span class="hidden text-xs text-base-content/60 sm:inline">
				Neue werden angelegt, bestehende aktualisiert. Ein deaktiviertes NTA bleibt deaktiviert.
			</span>
			{#if applyError}
				<div class="alert alert-error w-full py-2 text-sm"><span>{applyError}</span></div>
			{/if}
			{#if applyResult}
				<div class="alert alert-success w-full py-2 text-sm">
					<span>{applyResult} <a class="link" href="/nta/all">Zu den NTA-Stammdaten</a></span>
				</div>
			{/if}
		</div>
	{/if}
</div>

{#if editing}
	<div class="modal modal-open">
		<div class="modal-box max-w-2xl">
			<h3 class="mb-1 text-lg font-semibold">Vorschlag korrigieren: {editing.row.name}</h3>
			<p class="mb-4 text-xs text-base-content/60">
				Laut Liste: „{editing.row.compensation}“, gültig {editing.row.validity}. Gespeichert wird
				erst beim Übernehmen.
			</p>
			<NTAForm
				mode="edit"
				nta={edits[editing.key] ?? editing.row.proposal}
				onsubmit={onEdited}
				submitLabel="Korrektur merken"
				oncancel={() => (editing = null)}
			/>
		</div>
		<button class="modal-backdrop" aria-label="Schließen" onclick={() => (editing = null)}></button>
	</div>
{/if}
