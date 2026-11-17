<script>
	import { enhance } from '$app/forms';
	import { formatBerlin } from '$lib/portal/time';

	/** @type {{ data: any, form: any }} */
	let { data, form } = $props();

	let copied = $state(false);
	async function copy(/** @type {string} */ text) {
		await navigator.clipboard.writeText(text);
		copied = true;
	}
</script>

<h1 class="text-2xl font-semibold">Zugang für Skripte</h1>
<p class="mt-2 text-base-content/70">
	Mit einem persönlichen Token können Skripte – oder Claude – das Portal in Ihrem Namen abfragen.
	Ein Token kann nie mehr als Sie selbst. Wie das geht, steht in der
	<a class="link" href="/portal/hilfe/api">Hilfe zur API</a>.
</p>

{#if form?.created}
	<div class="alert alert-success mt-6 flex-col items-start" role="status">
		<p class="font-medium">Token „{form.created.description}" angelegt.</p>
		<p class="text-sm">
			Kopieren Sie es jetzt – es wird nur dieses eine Mal angezeigt. Bewahren Sie es auf wie ein
			Passwort.
		</p>
		<code class="w-full break-all rounded bg-base-100 p-2 text-sm text-base-content select-all"
			>{form.created.secret}</code
		>
		<button class="btn btn-sm" type="button" onclick={() => copy(form.created.secret)}>
			{copied ? 'Kopiert' : 'Kopieren'}
		</button>
	</div>
{/if}
{#if form?.error}
	<div class="alert alert-error mt-6" role="alert">{form.error}</div>
{/if}

<form method="POST" action="?/create" use:enhance class="card mt-6 border border-base-300">
	<fieldset class="card-body gap-4">
		<legend class="card-title text-base">Neues Token</legend>
		<label class="flex flex-col gap-1">
			<span class="text-sm">Wofür? (nur für Sie, zum Wiedererkennen)</span>
			<input
				class="input input-bordered w-full"
				name="description"
				required
				maxlength="200"
				value={form?.description ?? ''}
			/>
		</label>
		<fieldset class="flex flex-col gap-2">
			<legend class="text-sm">Umfang</legend>
			<label class="flex items-center gap-2">
				<input
					type="radio"
					class="radio"
					name="scope"
					value="READ"
					checked={form?.scope !== 'WRITE'}
				/>
				<span>Nur lesen</span>
			</label>
			<label class="flex items-center gap-2">
				<input
					type="radio"
					class="radio"
					name="scope"
					value="WRITE"
					checked={form?.scope === 'WRITE'}
				/>
				<span>Lesen und eintragen</span>
			</label>
		</fieldset>
		<label class="flex flex-col gap-1">
			<span class="text-sm">Gültig für</span>
			<select class="select select-bordered w-full sm:w-48" name="expiresInDays">
				<option value="30">30 Tage</option>
				<option value="90" selected>90 Tage</option>
				<option value="180">180 Tage</option>
				<option value="365">1 Jahr</option>
			</select>
		</label>
		<div>
			<button class="btn btn-primary">Token anlegen</button>
		</div>
	</fieldset>
</form>

<h2 class="mt-8 text-lg font-medium">Ihre Tokens</h2>
{#if data.tokens.length === 0}
	<p class="mt-2 text-base-content/70">Sie haben noch kein Token.</p>
{:else}
	<ul class="mt-2 flex flex-col gap-2">
		{#each data.tokens as token (token.id)}
			<li class="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-base-300 p-3">
				<div class="grow">
					<div class="font-medium">{token.description}</div>
					<div class="text-sm text-base-content/70">
						<span class="font-mono">{token.id}</span> ·
						{token.scope === 'WRITE' ? 'lesen und eintragen' : 'nur lesen'} ·
						{#if token.revokedAt}
							widerrufen am {formatBerlin(token.revokedAt)}
						{:else}
							gültig bis {formatBerlin(token.expiresAt)}
						{/if}
						{#if token.lastUsedAt}· zuletzt benutzt {formatBerlin(token.lastUsedAt)}{/if}
					</div>
				</div>
				{#if !token.revokedAt}
					<form method="POST" action="?/revoke" use:enhance>
						<input type="hidden" name="id" value={token.id} />
						<button class="btn btn-outline btn-error btn-sm">Widerrufen</button>
					</form>
				{/if}
			</li>
		{/each}
	</ul>
{/if}
