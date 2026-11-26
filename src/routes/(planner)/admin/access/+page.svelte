<script>
	import { clientErrorMessage } from '#lib/errors/clientErrors.js';
	import { httpErrorMessage } from '#lib/errors/plannerErrors.js';
	import { refreshAll } from '$app/navigation';
	import { formatBerlin } from '#lib/portal/time.js';

	/** @type {{ data: any }} */
	let { data } = $props();

	/** @type {Record<string, string>} */
	const PROBLEM = {
		NO_ADDRESS: 'keine E-Mail-Adresse im ZPA',
		EXTERNAL_ADDRESS: 'Adresse außerhalb von @hm.edu',
		SHARED_ADDRESS: 'Adresse mehrfach vergeben',
		ALIAS_UNKNOWN_TEACHER: 'Alias zeigt auf unbekannte Person'
	};

	let error = $state('');
	let busy = $state(false);

	let aliasEmail = $state('');
	let aliasTeacher = $state('');
	let aliasNote = $state('');
	let blockEmail = $state('');
	let blockReason = $state('');
	let probeEmail = $state('');
	/** @type {any} */
	let probe = $state(null);

	async function post(/** @type {string} */ url, /** @type {any} */ body) {
		const res = await fetch(url, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body)
		});
		const d = await res.json().catch(() => ({}));
		if (!res.ok || d?.error) throw new Error(d?.error || httpErrorMessage(res.status));
		return d;
	}

	/** @param {() => Promise<void>} fn */
	async function run(fn) {
		if (busy) return;
		busy = true;
		error = '';
		try {
			await fn();
			await refreshAll();
		} catch (e) {
			error = clientErrorMessage(e);
		} finally {
			busy = false;
		}
	}

	const addAlias = () =>
		run(async () => {
			await post('/api/access/setLoginAlias', {
				email: aliasEmail.trim(),
				teacherID: Number(aliasTeacher),
				note: aliasNote.trim()
			});
			aliasEmail = aliasTeacher = aliasNote = '';
		});
	const removeAlias = (/** @type {any} */ a) =>
		run(() => post('/api/access/removeLoginAlias', { email: a.email, teacherID: a.teacherID }));
	const addBlock = () =>
		run(async () => {
			await post('/api/access/setPortalLoginBlock', {
				email: blockEmail.trim(),
				reason: blockReason.trim()
			});
			blockEmail = blockReason = '';
		});
	const removeBlock = (/** @type {any} */ b) =>
		run(() => post('/api/access/removePortalLoginBlock', { email: b.email }));
	const revoke = (/** @type {any} */ t) => {
		if (!confirm(`Token „${t.description}" von ${t.ownerEmail} widerrufen?`)) return;
		run(() => post('/api/access/revokePortalAccessToken', { id: t.id }));
	};
	async function resolve() {
		error = '';
		probe = null;
		try {
			probe = (await post('/api/access/resolveLogin', { email: probeEmail.trim() }))
				.accessResolveLogin;
		} catch (e) {
			error = clientErrorMessage(e);
		}
	}
	/** Abgewiesene Kennung als Alias vormerken. */
	function prefillAlias(/** @type {string} */ email) {
		aliasEmail = email;
		document.getElementById('alias-form')?.scrollIntoView({ behavior: 'smooth' });
	}
</script>

<h1 class="mt-4 text-2xl font-semibold">Zugang zum Portal</h1>
<p class="mt-1 text-sm text-base-content/70">
	Wer ins Portal für Prüfende kommt: automatisch alle, deren SSO-Adresse zu einer Person im ZPA
	passt. Hier lassen sich Ausnahmen pflegen.
</p>

{#if !data.available}
	<div class="alert alert-warning mt-4">Nicht verfügbar: {data.loadError}</div>
{:else}
	{#if error}
		<div class="alert alert-error mt-4" role="alert">{error}</div>
	{/if}

	<section class="mt-6">
		<h2 class="text-lg font-medium">Wer käme nicht hinein? ({data.accessIdentityReport.length})</h2>
		{#if data.accessIdentityReport.length === 0}
			<p class="mt-1 text-sm text-base-content/70">Keine Auffälligkeiten im aktiven Semester.</p>
		{:else}
			<div class="mt-2 overflow-x-auto">
				<table class="table table-sm">
					<thead>
						<tr><th>Person</th><th>ZPA-ID</th><th>Problem</th><th>Adresse</th><th></th></tr>
					</thead>
					<tbody>
						{#each data.accessIdentityReport as p (p.kind + p.teacherID + p.email)}
							<tr>
								<td>
									{p.teacherName || '–'}{#if p.hasExams}<span class="badge badge-sm ml-1">
											Prüfungen
										</span>{/if}
								</td>
								<td class="font-mono">{p.teacherID}</td>
								<td>{PROBLEM[p.kind] ?? p.kind}</td>
								<td class="font-mono text-xs">{p.email}</td>
								<td>
									{#if p.kind !== 'ALIAS_UNKNOWN_TEACHER'}
										<button
											class="btn btn-ghost btn-xs"
											onclick={() => (aliasTeacher = String(p.teacherID))}
										>
											Alias…
										</button>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>

	<section class="mt-8" id="alias-form">
		<h2 class="text-lg font-medium">Aliase</h2>
		<p class="mt-1 text-sm text-base-content/70">
			Für Personen, deren SSO-Adresse nicht der Adresse im ZPA entspricht.
		</p>
		<form class="mt-2 flex flex-wrap gap-2" onsubmit={(e) => (e.preventDefault(), addAlias())}>
			<input
				class="input input-bordered input-sm w-full sm:w-72"
				placeholder="SSO-Adresse"
				bind:value={aliasEmail}
				required
			/>
			<input
				class="input input-bordered input-sm w-full sm:w-32"
				placeholder="ZPA-ID"
				inputmode="numeric"
				bind:value={aliasTeacher}
				required
			/>
			<input
				class="input input-bordered input-sm w-full sm:w-64"
				placeholder="Notiz"
				bind:value={aliasNote}
			/>
			<button class="btn btn-primary btn-sm" disabled={busy}>Hinzufügen</button>
		</form>
		{#if data.loginAliases.length > 0}
			<ul class="mt-3 flex flex-col gap-1">
				{#each data.loginAliases as a (a.email + a.teacherID)}
					<li class="flex flex-wrap items-center gap-x-3 text-sm">
						<span class="font-mono">{a.email}</span> → {a.teacherName || `ZPA-ID ${a.teacherID}`}
						{#if a.note}<span class="text-base-content/60">({a.note})</span>{/if}
						<button class="btn btn-ghost btn-xs" disabled={busy} onclick={() => removeAlias(a)}>
							Entfernen
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section class="mt-8">
		<h2 class="text-lg font-medium">Zuletzt abgewiesen</h2>
		<p class="mt-1 text-sm text-base-content/70">
			Kennungen, die seit dem letzten Neustart nicht hineinkamen – meist fehlt ein Alias.
		</p>
		{#if data.rejectedLogins.length === 0}
			<p class="mt-1 text-sm text-base-content/70">Keine.</p>
		{:else}
			<ul class="mt-2 flex flex-col gap-1">
				{#each data.rejectedLogins as r (r.email)}
					<li class="flex flex-wrap items-center gap-x-3 text-sm">
						<span class="font-mono">{r.email}</span>
						<span class="text-base-content/60">{r.count}× · zuletzt {formatBerlin(r.at)}</span>
						<button class="btn btn-ghost btn-xs" onclick={() => prefillAlias(r.email)}>
							Als Alias…
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section class="mt-8">
		<h2 class="text-lg font-medium">Adresse prüfen</h2>
		<form class="mt-2 flex flex-wrap gap-2" onsubmit={(e) => (e.preventDefault(), resolve())}>
			<input
				class="input input-bordered input-sm w-full sm:w-72"
				placeholder="E-Mail-Adresse"
				bind:value={probeEmail}
				required
			/>
			<button class="btn btn-sm">Auflösen</button>
		</form>
		{#if probe}
			<div class="mt-2 rounded-lg border border-base-300 p-3 text-sm">
				<div>Planungsrolle: <strong>{probe.role ?? 'keine'}</strong></div>
				<div>
					Person(en): {probe.teachers.length === 0
						? 'keine'
						: probe.teachers
								.map((/** @type {any} */ t) => `${t.fullname || '?'} (${t.id})`)
								.join(', ')}
				</div>
				{#if probe.blocked}<div class="text-error">Portalzugang gesperrt</div>{/if}
				<div>Portal: <strong>{probe.portalAccess ? 'Zugang' : 'kein Zugang'}</strong></div>
			</div>
		{/if}
	</section>

	<section class="mt-8">
		<h2 class="text-lg font-medium">Sperren</h2>
		<form class="mt-2 flex flex-wrap gap-2" onsubmit={(e) => (e.preventDefault(), addBlock())}>
			<input
				class="input input-bordered input-sm w-full sm:w-72"
				placeholder="E-Mail-Adresse"
				bind:value={blockEmail}
				required
			/>
			<input
				class="input input-bordered input-sm w-full sm:w-64"
				placeholder="Grund"
				bind:value={blockReason}
			/>
			<button class="btn btn-warning btn-sm" disabled={busy}>Sperren</button>
		</form>
		{#if data.portalLoginBlocks.length > 0}
			<ul class="mt-3 flex flex-col gap-1">
				{#each data.portalLoginBlocks as b (b.email)}
					<li class="flex flex-wrap items-center gap-x-3 text-sm">
						<span class="font-mono">{b.email}</span>
						{#if b.reason}<span class="text-base-content/60">{b.reason}</span>{/if}
						<button class="btn btn-ghost btn-xs" disabled={busy} onclick={() => removeBlock(b)}>
							Aufheben
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section class="mt-8">
		<h2 class="text-lg font-medium">Tokens ({data.portalAccessTokens.length})</h2>
		{#if data.portalAccessTokens.length > 0}
			<div class="mt-2 overflow-x-auto">
				<table class="table table-sm">
					<thead>
						<tr><th>Kennung</th><th>Wofür</th><th>Umfang</th><th>Status</th><th></th></tr>
					</thead>
					<tbody>
						{#each data.portalAccessTokens as t (t.id)}
							<tr>
								<td class="font-mono text-xs">{t.ownerEmail}</td>
								<td>
									{t.description}
									<span class="font-mono text-xs text-base-content/60">{t.id}</span>
								</td>
								<td>{t.scope === 'WRITE' ? 'eintragen' : 'lesen'}</td>
								<td class="text-xs">
									{t.revokedAt
										? `widerrufen ${formatBerlin(t.revokedAt)}`
										: `bis ${formatBerlin(t.expiresAt)}`}
								</td>
								<td>
									{#if !t.revokedAt}
										<button
											class="btn btn-ghost btn-xs text-error"
											disabled={busy}
											onclick={() => revoke(t)}
										>
											Widerrufen
										</button>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
{/if}
