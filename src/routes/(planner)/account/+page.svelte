<script>
	import { invalidateAll } from '$app/navigation';

	/** @type {{ data: import('./$types').PageData }} */
	let { data } = $props();

	let account = $derived(data.account);

	/** @param {unknown} e */
	const errMsg = (e) => (e instanceof Error ? e.message : String(e));

	/** @param {string | null | undefined} iso */
	function fmtDate(iso) {
		if (!iso) return '';
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return String(iso);
		return d.toLocaleString('de-DE', {
			timeZone: 'Europe/Berlin',
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	/** @param {string} url @param {any} [body] */
	async function post(url, body) {
		const res = await fetch(url, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body ?? {})
		});
		const d = await res.json().catch(() => ({}));
		if (!res.ok || d?.error) throw new Error(d?.error || `Fehler (HTTP ${res.status})`);
		return d;
	}

	// ── Kürzel ──────────────────────────────────────────────────────────────────
	let shortname = $state(data.account?.shortname ?? '');
	// Vorbefüllung an den geladenen Wert koppeln (z. B. nach invalidateAll), solange
	// der Nutzer nicht gerade tippt.
	let shortnameDirty = $state(false);
	$effect(() => {
		if (!shortnameDirty) shortname = account?.shortname ?? '';
	});

	let zpaShort = $derived(account?.shortnameFromZpa ?? '');
	let usingZpa = $derived((account?.shortname ?? '') === zpaShort);

	let savingShort = $state(false);
	let shortError = $state('');
	let shortMsg = $state('');

	async function saveShortname() {
		if (savingShort) return;
		savingShort = true;
		shortError = '';
		shortMsg = '';
		try {
			await post('/api/account/setShortname', { shortname: shortname.trim() });
			shortnameDirty = false;
			shortMsg = 'Kürzel gespeichert.';
			await invalidateAll();
		} catch (e) {
			shortError = errMsg(e);
		} finally {
			savingShort = false;
		}
	}

	async function resetShortnameToZpa() {
		if (savingShort) return;
		savingShort = true;
		shortError = '';
		shortMsg = '';
		try {
			await post('/api/account/setShortname', { shortname: '' });
			shortnameDirty = false;
			shortMsg = 'Auf ZPA-Kürzel zurückgesetzt.';
			await invalidateAll();
		} catch (e) {
			shortError = errMsg(e);
		} finally {
			savingShort = false;
		}
	}

	// ── Jira-PAT ──────────────────────────────────────────────────────────────────
	let tokenInput = $state('');
	let savingToken = $state(false);
	let removingToken = $state(false);
	let tokenError = $state('');
	let tokenMsg = $state('');

	async function saveToken() {
		if (savingToken || !tokenInput.trim()) return;
		savingToken = true;
		tokenError = '';
		tokenMsg = '';
		try {
			await post('/api/account/setJiraToken', { token: tokenInput.trim() });
			tokenInput = '';
			tokenMsg = 'Jira-Token gespeichert.';
			await invalidateAll();
		} catch (e) {
			tokenError = errMsg(e);
		} finally {
			savingToken = false;
		}
	}

	async function removeToken() {
		if (removingToken) return;
		if (!confirm('Hinterlegtes Jira-Token wirklich entfernen?')) return;
		removingToken = true;
		tokenError = '';
		tokenMsg = '';
		try {
			await post('/api/account/removeJiraToken');
			tokenMsg = 'Jira-Token entfernt.';
			await invalidateAll();
		} catch (e) {
			tokenError = errMsg(e);
		} finally {
			removingToken = false;
		}
	}

	// ── Verbindungstest (nutzt das eigene, gerade gespeicherte PAT) ────────────────
	let testing = $state(false);
	let testError = $state('');
	/** @type {{ name: string, displayName: string, emailAddress: string } | null} */
	let testResult = $state(null);

	async function testConnection() {
		if (testing) return;
		testing = true;
		testError = '';
		testResult = null;
		try {
			const res = await fetch('/api/jira/connection', { method: 'GET' });
			const d = await res.json().catch(() => ({}));
			if (!res.ok || d?.error) throw new Error(d?.error || `Fehler (HTTP ${res.status})`);
			if (!d?.jiraConnection) throw new Error('Keine Verbindung — kein Jira-Token hinterlegt?');
			testResult = d.jiraConnection;
		} catch (e) {
			testError = errMsg(e);
		} finally {
			testing = false;
		}
	}
</script>

<svelte:head><title>Mein Account · Plexams</title></svelte:head>

<div class="mx-auto max-w-2xl py-6">
	<header class="mb-6">
		<h1 class="text-2xl font-bold">👤 Mein Account</h1>
		<p class="mt-1 text-sm text-base-content/60">
			Eigene Identität und persönliche Einstellungen — Kürzel und Jira-Zugang.
		</p>
	</header>

	{#if !data.available}
		<div class="alert alert-warning">
			<span>
				Kontodaten nicht verfügbar — dies erfordert ein angemeldetes Konto und ein Backend mit
				OIDC-Auth.
				{#if data.loadError}<span class="mt-1 block font-mono text-xs opacity-70"
						>{data.loadError}</span
					>{/if}
			</span>
		</div>
	{:else}
		<!-- Identität (read-only aus dem IdP) -->
		<div class="card mb-6 border border-base-300 bg-base-100 shadow-sm">
			<div class="card-body gap-3 p-4">
				<h2 class="text-sm font-semibold text-base-content/70">Identität</h2>
				<p class="text-xs text-base-content/50">
					Diese Angaben stammen aus der Anmeldung (Identity Provider) und lassen sich hier nicht
					ändern.
				</p>
				<dl class="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-sm">
					<dt class="text-base-content/60">Name</dt>
					<dd class="font-medium">{account?.name || '—'}</dd>
					<dt class="text-base-content/60">E-Mail</dt>
					<dd class="break-all">{account?.email || '—'}</dd>
					<dt class="text-base-content/60">Rolle</dt>
					<dd><span class="badge badge-ghost badge-sm">{account?.role || '—'}</span></dd>
				</dl>
			</div>
		</div>

		<!-- Kürzel -->
		<div class="card mb-6 border border-base-300 bg-base-100 shadow-sm">
			<div class="card-body gap-3 p-4">
				<h2 class="text-sm font-semibold text-base-content/70">Kürzel</h2>
				<p class="text-xs text-base-content/50">
					Dein Kürzel für Prüfungs- und Aufsichtsplanung. Ohne eigene Angabe gilt das ZPA-Kürzel
					{#if zpaShort}(<span class="font-mono">{zpaShort}</span>){/if}.
				</p>

				{#if shortError}
					<div class="alert alert-error alert-sm">
						<span class="font-mono text-sm break-words whitespace-pre-wrap">{shortError}</span>
						<button class="btn btn-ghost btn-xs" onclick={() => (shortError = '')}>schließen</button
						>
					</div>
				{/if}
				{#if shortMsg}
					<div class="alert alert-success alert-sm"><span>{shortMsg}</span></div>
				{/if}

				<div class="flex flex-wrap items-end gap-3">
					<label class="flex flex-col gap-1">
						<span class="text-xs font-medium text-base-content/60">Kürzel</span>
						<input
							type="text"
							class="input input-bordered input-sm w-full sm:w-48"
							bind:value={shortname}
							oninput={() => (shortnameDirty = true)}
							placeholder={zpaShort || 'z. B. brau'}
						/>
					</label>
					<button
						class="btn btn-primary btn-sm"
						disabled={savingShort || !shortname.trim()}
						onclick={saveShortname}
					>
						{savingShort ? 'speichert …' : 'Speichern'}
					</button>
					<button
						class="btn btn-ghost btn-sm"
						disabled={savingShort || usingZpa}
						title={usingZpa ? 'Bereits das ZPA-Kürzel' : 'Auf ZPA-Kürzel zurücksetzen'}
						onclick={resetShortnameToZpa}
					>
						Auf ZPA zurücksetzen
					</button>
				</div>
				{#if usingZpa}
					<span class="text-xs text-base-content/50">Aktuell wird das ZPA-Kürzel verwendet.</span>
				{/if}
			</div>
		</div>

		<!-- Jira-PAT -->
		<div class="card border border-base-300 bg-base-100 shadow-sm">
			<div class="card-body gap-3 p-4">
				<h2 class="text-sm font-semibold text-base-content/70">
					Jira-Zugang (Personal Access Token)
				</h2>
				<p class="text-xs text-base-content/50">
					Dein persönliches Jira-PAT wird verschlüsselt gespeichert und nie im Klartext angezeigt.
					Es wird für deine Jira-Anfragen (Anlegen/Kommentieren) verwendet.
				</p>

				<!-- Status -->
				<div class="flex flex-wrap items-center gap-2 text-sm">
					{#if account?.jiraTokenSet}
						<span class="badge badge-success gap-1">✓ Token hinterlegt</span>
						{#if account?.jiraTokenUpdatedAt}
							<span class="text-xs text-base-content/50"
								>zuletzt aktualisiert: {fmtDate(account.jiraTokenUpdatedAt)}</span
							>
						{/if}
					{:else}
						<span class="badge badge-ghost gap-1">Kein Token hinterlegt</span>
					{/if}
				</div>

				{#if tokenError}
					<div class="alert alert-error alert-sm">
						<span class="font-mono text-sm break-words whitespace-pre-wrap">{tokenError}</span>
						<button class="btn btn-ghost btn-xs" onclick={() => (tokenError = '')}>schließen</button
						>
					</div>
				{/if}
				{#if tokenMsg}
					<div class="alert alert-success alert-sm"><span>{tokenMsg}</span></div>
				{/if}

				<!-- Token setzen (write-only) -->
				<div class="flex flex-wrap items-end gap-3">
					<label class="flex flex-col gap-1">
						<span class="text-xs font-medium text-base-content/60">
							{account?.jiraTokenSet ? 'Neues Token' : 'Token'}
						</span>
						<input
							type="password"
							autocomplete="off"
							class="input input-bordered input-sm w-full sm:w-80"
							bind:value={tokenInput}
							placeholder="PAT einfügen …"
						/>
					</label>
					<button
						class="btn btn-primary btn-sm"
						disabled={savingToken || !tokenInput.trim()}
						onclick={saveToken}
					>
						{savingToken ? 'speichert …' : 'Token speichern'}
					</button>
				</div>

				<div class="mt-1 flex flex-wrap items-center gap-3">
					<button
						class="btn btn-outline btn-sm"
						disabled={testing || (!account?.jiraTokenSet && !savingToken)}
						onclick={testConnection}
					>
						{testing ? 'testet …' : 'Verbindung testen'}
					</button>
					{#if account?.jiraTokenSet}
						<button
							class="btn btn-ghost btn-sm text-error"
							disabled={removingToken}
							onclick={removeToken}
						>
							{removingToken ? 'entfernt …' : 'Token entfernen'}
						</button>
					{/if}
				</div>

				<!-- Testergebnis -->
				{#if testError}
					<div class="alert alert-error alert-sm">
						<span class="font-mono text-sm break-words whitespace-pre-wrap">{testError}</span>
						<button class="btn btn-ghost btn-xs" onclick={() => (testError = '')}>schließen</button>
					</div>
				{/if}
				{#if testResult}
					<div class="alert alert-success alert-sm">
						<span>
							Verbunden als <span class="font-medium">{testResult.displayName}</span>
							({testResult.name}) · {testResult.emailAddress}
						</span>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
