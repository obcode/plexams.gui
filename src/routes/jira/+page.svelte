<script>
	import {
		fetchConnection,
		fetchIssue,
		fetchTransitions,
		createIssue,
		addComment,
		runTransition,
		attachToIssue
	} from '$lib/jira/client.js';
	import { connectionStatus, normalizeIssueKey } from '$lib/jira/jira.js';

	let { data } = $props();

	/** @param {unknown} e */
	const errMsg = (e) => (e instanceof Error ? e.message : String(e));

	// ── Verbindung ────────────────────────────────────────────────────────────
	let connection = $state(data.connection);
	let connError = $state(data.connectionError);
	let checking = $state(false);
	let status = $derived(connectionStatus(connection, connError));

	async function recheck() {
		checking = true;
		connError = '';
		try {
			connection = await fetchConnection();
		} catch (e) {
			connection = null;
			connError = errMsg(e);
		} finally {
			checking = false;
		}
	}

	// ── Neues Issue ─────────────────────────────────────────────────────────────
	let cProject = $state('');
	let cIssueType = $state('');
	let cSummary = $state('');
	let cDescription = $state('');
	let creating = $state(false);
	let createError = $state('');
	/** @type {import('$lib/jira/jira.js').JiraIssue | null} */
	let created = $state(null);

	async function submitCreate() {
		if (!cSummary.trim() || creating) return;
		creating = true;
		createError = '';
		created = null;
		try {
			created = await createIssue({
				project: cProject.trim(),
				issueType: cIssueType.trim(),
				summary: cSummary.trim(),
				description: cDescription.trim()
			});
			cSummary = '';
			cDescription = '';
		} catch (e) {
			createError = errMsg(e);
		} finally {
			creating = false;
		}
	}

	// ── Issue-Editor (nachschlagen / kommentieren / Status / Anhang) ─────────────
	let lookupKey = $state('');
	/** @type {import('$lib/jira/jira.js').JiraIssue | null} */
	let issue = $state(null);
	let loading = $state(false);
	let editError = $state('');

	/** @type {{ id: string, name: string }[]} */
	let transitions = $state([]);
	let selectedTransition = $state('');

	let commentBody = $state('');
	let commenting = $state(false);
	let commentMsg = $state('');

	let transitioning = $state(false);
	let transitionMsg = $state('');

	/** @type {File | null} */
	let attachFile = $state(null);
	let attaching = $state(false);
	let attachMsg = $state('');

	function resetEditorMessages() {
		commentMsg = '';
		transitionMsg = '';
		attachMsg = '';
	}

	/** @param {string} key */
	async function loadIssue(key) {
		const k = normalizeIssueKey(key);
		if (!k) return;
		loading = true;
		editError = '';
		resetEditorMessages();
		try {
			issue = await fetchIssue(k);
			lookupKey = k;
			if (!issue) {
				editError = `Kein Issue „${k}“ gefunden.`;
				transitions = [];
				return;
			}
			transitions = await fetchTransitions(k).catch(() => []);
			selectedTransition = '';
		} catch (e) {
			issue = null;
			transitions = [];
			editError = errMsg(e);
		} finally {
			loading = false;
		}
	}

	/** Ein soeben erstelltes Issue in den Editor übernehmen. */
	function openCreatedInEditor() {
		if (created?.key) loadIssue(created.key);
	}

	async function submitComment() {
		if (!issue || !commentBody.trim() || commenting) return;
		commenting = true;
		commentMsg = '';
		try {
			const ok = await addComment(issue.key, commentBody.trim());
			commentMsg = ok ? '✓ Kommentar hinzugefügt.' : 'Konnte Kommentar nicht speichern.';
			if (ok) commentBody = '';
		} catch (e) {
			commentMsg = errMsg(e);
		} finally {
			commenting = false;
		}
	}

	async function submitTransition() {
		if (!issue || !selectedTransition || transitioning) return;
		transitioning = true;
		transitionMsg = '';
		try {
			const ok = await runTransition(issue.key, selectedTransition);
			if (ok) {
				transitionMsg = '✓ Status geändert.';
				await loadIssue(issue.key); // Status/Übergänge frisch holen
			} else {
				transitionMsg = 'Übergang fehlgeschlagen.';
			}
		} catch (e) {
			transitionMsg = errMsg(e);
		} finally {
			transitioning = false;
		}
	}

	/** @param {Event} e */
	function pickFile(e) {
		const input = /** @type {HTMLInputElement} */ (e.currentTarget);
		attachFile = input.files?.[0] ?? null;
		attachMsg = '';
	}

	async function submitAttachment() {
		if (!issue || !attachFile || attaching) return;
		attaching = true;
		attachMsg = '';
		try {
			const r = await attachToIssue({ key: issue.key, file: attachFile });
			if (r.ok) attachMsg = `✓ „${attachFile.name}“ angehängt.`;
			else if (r.blocked)
				attachMsg = 'Gerade gesperrt (Validierung/Transfer läuft) — später erneut.';
			else attachMsg = r.error || 'Upload fehlgeschlagen.';
		} catch (e) {
			attachMsg = errMsg(e);
		} finally {
			attaching = false;
		}
	}
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<!-- Kopf mit Verbindungs-Badge -->
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Jira</h1>
		{#if status.ok}
			<span class="badge badge-success gap-1">● {status.text}</span>
		{:else}
			<span class="badge badge-error gap-1">○ {status.text}</span>
		{/if}
		{#if connection?.emailAddress}
			<span class="text-sm text-base-content/50">{connection.emailAddress}</span>
		{/if}
		<div class="flex-1"></div>
		<button class="btn btn-ghost btn-sm" disabled={checking} onclick={recheck}>
			{checking ? 'prüfe …' : 'Verbindung prüfen'}
		</button>
	</div>
	{#if connError}
		<div class="alert alert-warning py-2 text-sm"><span>{connError}</span></div>
	{/if}

	<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
		<!-- ── Neues Issue ──────────────────────────────────────────────────── -->
		<section class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
			<h2 class="text-lg font-semibold">Neues Issue</h2>
			<div class="flex flex-wrap gap-3">
				<label class="flex flex-1 flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Projekt (optional)</span>
					<input
						type="text"
						class="input input-bordered input-sm w-full"
						bind:value={cProject}
						placeholder="Standard: jira.project"
					/>
				</label>
				<label class="flex flex-1 flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Typ (optional)</span>
					<input
						type="text"
						class="input input-bordered input-sm w-full"
						bind:value={cIssueType}
						placeholder="Standard: Task"
					/>
				</label>
			</div>
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">Zusammenfassung *</span>
				<input
					type="text"
					class="input input-bordered input-sm w-full"
					bind:value={cSummary}
					placeholder="Titel des Issues"
				/>
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">Beschreibung</span>
				<textarea
					class="textarea textarea-bordered textarea-sm w-full"
					rows="4"
					bind:value={cDescription}
					placeholder="optional"
				></textarea>
			</label>
			<div class="flex items-center gap-3">
				<button
					class="btn btn-primary btn-sm"
					disabled={creating || !cSummary.trim()}
					onclick={submitCreate}
				>
					{creating ? 'erstelle …' : 'Issue erstellen'}
				</button>
			</div>
			{#if createError}
				<div class="alert alert-error py-2 text-sm"><span>{createError}</span></div>
			{/if}
			{#if created}
				<div class="alert alert-success flex-wrap gap-2 py-2 text-sm">
					<span>
						Erstellt:
						<a class="link font-semibold" href={created.url} target="_blank" rel="noreferrer">
							{created.key}
						</a>
					</span>
					<button class="btn btn-ghost btn-xs" onclick={openCreatedInEditor}>
						im Editor öffnen →
					</button>
				</div>
			{/if}
		</section>

		<!-- ── Issue bearbeiten ─────────────────────────────────────────────── -->
		<section class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
			<h2 class="text-lg font-semibold">Issue bearbeiten</h2>
			<div class="flex flex-wrap items-end gap-2">
				<label class="flex flex-1 flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Issue-Key</span>
					<input
						type="text"
						class="input input-bordered input-sm w-full"
						bind:value={lookupKey}
						placeholder="z. B. PLEX-12"
						onkeydown={(e) => e.key === 'Enter' && loadIssue(lookupKey)}
					/>
				</label>
				<button
					class="btn btn-sm"
					disabled={loading || !lookupKey.trim()}
					onclick={() => loadIssue(lookupKey)}
				>
					{loading ? 'lädt …' : 'Laden'}
				</button>
			</div>

			{#if editError}
				<div class="alert alert-error py-2 text-sm"><span>{editError}</span></div>
			{/if}

			{#if issue}
				<div class="flex flex-col gap-2 rounded-md bg-base-200 p-3">
					<div class="flex flex-wrap items-center gap-2">
						<a
							class="link link-primary font-semibold"
							href={issue.url}
							target="_blank"
							rel="noreferrer"
						>
							{issue.key}
						</a>
						{#if issue.issueType}
							<span class="badge badge-neutral badge-sm">{issue.issueType}</span>
						{/if}
						{#if issue.status}
							<span class="badge badge-info badge-sm">{issue.status}</span>
						{/if}
					</div>
					<div class="font-medium">{issue.summary}</div>
					{#if issue.description}
						<div class="whitespace-pre-wrap text-sm text-base-content/70">{issue.description}</div>
					{/if}
				</div>

				<!-- Kommentar -->
				<div class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Kommentar</span>
					<textarea
						class="textarea textarea-bordered textarea-sm w-full"
						rows="2"
						bind:value={commentBody}
						placeholder="Kommentartext"
					></textarea>
					<div class="flex items-center gap-2">
						<button
							class="btn btn-sm"
							disabled={commenting || !commentBody.trim()}
							onclick={submitComment}
						>
							{commenting ? 'sende …' : 'Kommentar hinzufügen'}
						</button>
						{#if commentMsg}
							<span class="text-sm text-base-content/70">{commentMsg}</span>
						{/if}
					</div>
				</div>

				<!-- Status ändern -->
				<div class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Status ändern</span>
					<div class="flex flex-wrap items-center gap-2">
						<select
							class="select select-bordered select-sm w-full sm:w-56"
							bind:value={selectedTransition}
							disabled={!transitions.length}
						>
							<option value=""
								>{transitions.length ? 'Übergang wählen …' : 'keine Übergänge'}</option
							>
							{#each transitions as t}
								<option value={t.id}>{t.name}</option>
							{/each}
						</select>
						<button
							class="btn btn-sm"
							disabled={transitioning || !selectedTransition}
							onclick={submitTransition}
						>
							{transitioning ? 'ändere …' : 'ausführen'}
						</button>
						{#if transitionMsg}
							<span class="text-sm text-base-content/70">{transitionMsg}</span>
						{/if}
					</div>
				</div>

				<!-- Anhang -->
				<div class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Datei anhängen (PDF/CSV …)</span>
					<div class="flex flex-wrap items-center gap-2">
						<input
							type="file"
							class="file-input file-input-bordered file-input-sm w-full sm:w-auto"
							accept=".pdf,.csv,application/pdf,text/csv"
							onchange={pickFile}
						/>
						<button
							class="btn btn-sm"
							disabled={attaching || !attachFile}
							onclick={submitAttachment}
						>
							{attaching ? 'lädt …' : 'anhängen'}
						</button>
					</div>
					{#if attachMsg}
						<span class="text-sm text-base-content/70">{attachMsg}</span>
					{/if}
				</div>
			{/if}
		</section>
	</div>
</div>
