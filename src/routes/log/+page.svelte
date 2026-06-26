<script>
	export let data;

	/** @type {any[]} */
	let logs = data.initial;
	const names = data.names;

	// Quelle/Typ client-seitig filtern (Backend hat dafür kein Argument)
	let typeFilter = 'alle';
	$: typeCounts = {
		mutation: logs.filter((/** @type {any} */ l) => l.type === 'mutation').length,
		subscription: logs.filter((/** @type {any} */ l) => l.type === 'subscription').length,
		cli: logs.filter((/** @type {any} */ l) => l.type === 'cli').length
	};
	$: shownLogs =
		typeFilter === 'alle' ? logs : logs.filter((/** @type {any} */ l) => l.type === typeFilter);

	// Filter
	let name = '';
	let ancode = '';
	/** @type {{key:string, value:string}[]} mehrere Parameter-Paare (UND) */
	let params = [{ key: '', value: '' }];
	let since = '';
	let until = '';
	let limit = 200;

	let loading = false;
	let error = '';

	// datetime-local ist Ortszeit → im Browser zu ISO/UTC machen, damit der
	// Time-Scalar des Servers korrekt filtert (Server läuft UTC).
	/** @param {string} v */
	const toISO = (v) => {
		if (!v) return '';
		const d = new Date(v);
		return Number.isNaN(d.getTime()) ? '' : d.toISOString();
	};

	const addParam = () => (params = [...params, { key: '', value: '' }]);
	/** @param {number} i */
	const rmParam = (i) =>
		(params = params.length > 1 ? params.filter((_, j) => j !== i) : [{ key: '', value: '' }]);

	async function apply() {
		if (loading) return;
		loading = true;
		error = '';
		try {
			const res = await fetch('/api/mutationLog', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					name,
					ancode,
					args: params.filter((p) => p.key.trim() || p.value.trim()),
					since: toISO(since),
					until: toISO(until),
					limit
				})
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok || result?.error) {
				error = result?.error || `Fehler (HTTP ${res.status})`;
				return;
			}
			logs = result.mutationLog ?? [];
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	function reset() {
		name = '';
		ancode = '';
		params = [{ key: '', value: '' }];
		since = '';
		until = '';
		limit = 200;
		logs = data.initial;
	}

	$: hasFilter = !!(
		name ||
		ancode ||
		since ||
		until ||
		params.some((p) => p.key.trim() || p.value.trim())
	);

	// Klick-Filter aus der Tabelle
	/** @param {number} a */
	function filterByAncode(a) {
		ancode = String(a);
		apply();
	}
	/** @param {string} key @param {string} value */
	function filterByArg(key, value) {
		// leere erste Zeile ersetzen, sonst anhängen (kein Duplikat)
		const empty = params.findIndex((p) => !p.key.trim() && !p.value.trim());
		const exists = params.some((p) => p.key === key && p.value === value);
		if (!exists) {
			if (empty >= 0) params[empty] = { key, value };
			else params = [...params, { key, value }];
			params = params;
		}
		apply();
	}

	/** @param {string} iso */
	function fmt(iso) {
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return iso;
		return d.toLocaleString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}

	/** @param {KeyboardEvent} e */
	const onEnter = (e) => e.key === 'Enter' && apply();
</script>

<div class="mx-2 mt-4 flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold">Mutations-Audit-Log</h1>
		<span class="badge badge-primary badge-lg tabular-nums">{shownLogs.length}</span>
		<span class="text-sm text-base-content/50">neueste zuerst</span>
		<div class="flex-1"></div>
		<div class="flex flex-wrap items-center gap-1">
			<span class="text-sm text-base-content/50">Quelle:</span>
			<button
				class="badge gap-1 tabular-nums {typeFilter === 'alle' ? 'badge-primary' : 'badge-ghost'}"
				on:click={() => (typeFilter = 'alle')}
			>
				alle {logs.length}
			</button>
			<button
				class="badge gap-1 tabular-nums {typeFilter === 'mutation'
					? 'badge-neutral'
					: 'badge-ghost'}"
				on:click={() => (typeFilter = 'mutation')}
			>
				Mutation {typeCounts.mutation}
			</button>
			<button
				class="badge gap-1 tabular-nums {typeFilter === 'subscription'
					? 'badge-info'
					: 'badge-ghost'}"
				on:click={() => (typeFilter = 'subscription')}
			>
				Subscription {typeCounts.subscription}
			</button>
			<button
				class="badge gap-1 tabular-nums {typeFilter === 'cli' ? 'badge-secondary' : 'badge-ghost'}"
				on:click={() => (typeFilter = 'cli')}
			>
				CLI {typeCounts.cli}
			</button>
		</div>
	</div>

	<!-- Filter -->
	<div class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-3">
		<div class="flex flex-wrap items-end gap-3">
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">Operation</span>
				<select class="select select-bordered select-sm w-56" bind:value={name} on:change={apply}>
					<option value="">alle</option>
					{#each names as n}
						<option value={n}>{n}</option>
					{/each}
				</select>
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">Ancode</span>
				<input
					type="number"
					class="input input-bordered input-sm w-28"
					bind:value={ancode}
					on:keydown={onEnter}
					placeholder="beliebig"
				/>
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">von</span>
				<input type="datetime-local" class="input input-bordered input-sm" bind:value={since} />
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">bis</span>
				<input type="datetime-local" class="input input-bordered input-sm" bind:value={until} />
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs font-medium text-base-content/60">max.</span>
				<input
					type="number"
					class="input input-bordered input-sm w-24"
					bind:value={limit}
					on:keydown={onEnter}
				/>
			</label>
		</div>

		<!-- Parameter-Paare (UND) -->
		<div class="flex flex-col gap-1">
			<span class="text-xs font-medium text-base-content/60"
				>Parameter (key = Wert, UND-verknüpft)</span
			>
			{#each params as p, i}
				<div class="flex items-center gap-2">
					<input
						type="text"
						class="input input-bordered input-sm w-40"
						bind:value={p.key}
						on:keydown={onEnter}
						placeholder="key, z. B. program"
					/>
					<span class="text-base-content/40">=</span>
					<input
						type="text"
						class="input input-bordered input-sm w-40"
						bind:value={p.value}
						on:keydown={onEnter}
						placeholder="Wert, z. B. GS"
					/>
					<button class="btn btn-ghost btn-xs" title="Zeile entfernen" on:click={() => rmParam(i)}>
						✕
					</button>
					{#if i === params.length - 1}
						<button class="btn btn-ghost btn-xs" on:click={addParam}>+ Parameter</button>
					{/if}
				</div>
			{/each}
		</div>

		<div class="flex items-center gap-2">
			<button class="btn btn-primary btn-sm" disabled={loading} on:click={apply}>
				{loading ? 'lädt …' : 'Filtern'}
			</button>
			{#if hasFilter}
				<button class="btn btn-ghost btn-sm" on:click={reset}>zurücksetzen</button>
			{/if}
		</div>
	</div>

	{#if error}
		<div class="alert alert-error py-2 text-sm"><span>{error}</span></div>
	{/if}

	<!-- Liste -->
	<div class="overflow-x-auto rounded-lg border border-base-300">
		<table class="table table-sm">
			<thead>
				<tr>
					<th>Zeit</th>
					<th>Operation</th>
					<th>Typ</th>
					<th>Argumente</th>
					<th>Ancodes</th>
					<th class="text-right">Dauer</th>
				</tr>
			</thead>
			<tbody>
				{#each shownLogs as l}
					<tr class="hover {l.error ? 'bg-error/10' : ''}">
						<td class="tabular-nums whitespace-nowrap text-sm">{fmt(l.time)}</td>
						<td class="font-medium">{l.name}</td>
						<td>
							{#if l.type === 'cli'}
								<span class="badge badge-secondary badge-sm">CLI</span>
							{:else if l.type === 'subscription'}
								<span class="badge badge-info badge-sm">Subscription</span>
							{:else}
								<span class="badge badge-neutral badge-sm">Mutation</span>
							{/if}
						</td>
						<td>
							<div class="flex flex-wrap gap-1">
								{#each l.args ?? [] as a}
									<button
										class="badge badge-ghost badge-sm hover:badge-primary"
										title="nach {a.key} = {a.value} filtern"
										on:click={() => filterByArg(a.key, a.value)}
									>
										<span class="text-base-content/50">{a.key}:</span>&nbsp;{a.value}
									</button>
								{/each}
							</div>
							{#if l.error}
								<div class="mt-1 text-xs text-error">{l.error}</div>
							{/if}
						</td>
						<td>
							<div class="flex flex-wrap gap-1">
								{#each l.ancodes ?? [] as a}
									<button
										class="badge badge-outline badge-xs tabular-nums hover:badge-primary"
										title="nach Ancode {a} filtern"
										on:click={() => filterByAncode(a)}
									>
										{a}
									</button>
								{/each}
							</div>
						</td>
						<td class="text-right tabular-nums text-base-content/70">
							{l.type === 'subscription' && !l.durationMs ? '—' : `${l.durationMs} ms`}
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="6" class="py-8 text-center text-sm text-base-content/50">
							Keine Log-Einträge für diesen Filter.
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
