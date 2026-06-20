<script>
	import { onDestroy, tick } from 'svelte';
	import { slide, fade } from 'svelte/transition';
	import { getConvert, getWsClient } from '$lib/validation/wsClient';

	// Wiederverwendbare Komponente für genau EINEN E-Mail-Versand-Typ. Kann auf
	// der Übersichtsseite /email oder einzeln auf anderen Seiten eingebunden
	// werden. Streamt die LogLines der zugehörigen Subscription wie ein Terminal
	// (ANSI im text möglich; PROGRESS-Zeilen werden in-place aktualisiert).

	/** Subscription-Feldname, z. B. 'sendEmailConstraints'
	 * @type {string} */
	export let emailKey;
	/** Überschrift der Karte
	 * @type {string} */
	export let title;
	/** kurze Beschreibung darunter */
	export let description = '';
	/** zusätzliche Subscription-Argumente neben `run`, z. B.
	 * { teacherID: { type: 'Int!', value: 123 } }
	 * @type {Record<string, { type: string, value: any }>} */
	export let extraArgs = {};
	/** Buttons deaktivieren (z. B. solange keine Auswahl getroffen ist) */
	export let disabled = false;

	// --- Laufzeit-Status ---
	let running = false;
	let done = false;
	/** war der letzte Lauf ein echter Versand (run: true)? */
	let lastReal = false;
	/** Bestätigungs-Schritt für den echten Versand sichtbar? */
	let confirming = false;
	/** Server lehnt ab, weil eine Validierung/ein Transfer läuft → nur Hinweis */
	let blocked = false;
	/** @type {string | null} */
	let errorMsg = null;

	// Terminal: alle Zeilen ausser PROGRESS werden angehängt; die jeweils letzte
	// PROGRESS-Zeile wird in-place aktualisiert.
	/** @type {{ level: string, html: string }[]} */
	let lines = [];
	/** @type {{ html: string } | null} */
	let current = null;

	let showTerminal = true;

	/** @type {HTMLDivElement} */
	let termEl;

	/** @type {any} */
	let convert = null;
	/** @type {any} */
	let wsClient = null;
	/** @type {(() => void) | null} */
	let unsubscribe = null;

	// erkennt die „läuft gerade etwas anderes"-Ablehnung des Servers
	/** @param {string} text */
	function isBlockedMessage(text) {
		return /a validation or another transfer\/email is running|cannot start now/i.test(text);
	}

	async function scrollToBottom() {
		await tick();
		if (termEl) termEl.scrollTop = termEl.scrollHeight;
	}

	/** @param {boolean} run */
	async function start(run) {
		if (running) return;
		confirming = false;
		lines = [];
		current = null;
		errorMsg = null;
		blocked = false;
		done = false;
		running = true;
		lastReal = run;

		try {
			if (!convert) convert = await getConvert();
			if (!wsClient) wsClient = await getWsClient();
		} catch (e) {
			errorMsg = 'Konnte WebSocket-Client nicht laden: ' + (e instanceof Error ? e.message : e);
			running = false;
			return;
		}

		// Query + Variablen aus run + optionalen extraArgs aufbauen.
		const entries = Object.entries(extraArgs);
		const decls = ['$run: Boolean!', ...entries.map(([n, a]) => `$${n}: ${a.type}`)].join(', ');
		const callArgs = ['run: $run', ...entries.map(([n]) => `${n}: $${n}`)].join(', ');
		/** @type {Record<string, any>} */
		const variables = { run };
		for (const [n, a] of entries) variables[n] = a.value;

		unsubscribe = wsClient.subscribe(
			{
				query: `subscription (${decls}) { ${emailKey}(${callArgs}) { level text } }`,
				variables
			},
			{
				/** @param {any} msg */
				next: (msg) => {
					if (msg.errors && msg.errors.length) {
						errorMsg = msg.errors.map((/** @type {any} */ e) => e.message).join('; ');
						return;
					}
					const line = msg.data && msg.data[emailKey];
					if (!line) return;
					const text = line.text ?? '';
					const html = convert.toHtml(text);
					if (line.level === 'PROGRESS') {
						current = { html };
					} else {
						if (current) {
							lines = [...lines, { level: 'PROGRESS', html: current.html }];
							current = null;
						}
						lines = [...lines, { level: line.level, html }];
						if (line.level === 'ERROR' && isBlockedMessage(text)) blocked = true;
						if (line.level === 'DONE') done = true;
					}
					scrollToBottom();
				},
				/** @param {any} err */
				error: (err) => {
					errorMsg =
						err instanceof Error
							? err.message
							: Array.isArray(err)
								? err.map((/** @type {any} */ e) => e.message).join('; ')
								: err && err.reason
									? err.reason
									: 'Verbindungsfehler';
					running = false;
				},
				complete: () => {
					if (current) {
						lines = [...lines, { level: 'PROGRESS', html: current.html }];
						current = null;
					}
					running = false;
					done = true;
				}
			}
		);
	}

	onDestroy(() => {
		if (unsubscribe) unsubscribe();
	});

	// echte Fehler (Verbindung etc.) — die Server-Ablehnung „läuft schon etwas"
	// ist KEIN harter Fehler, sondern ein Hinweis.
	$: hardError = !!errorMsg;
</script>

<div
	class="flex flex-col gap-3 rounded-lg border bg-base-100 p-4 {hardError
		? 'border-error/40'
		: blocked
			? 'border-warning/40'
			: done
				? 'border-success/40'
				: 'border-base-300'}"
>
	<!-- Kopf -->
	<div class="flex items-start justify-between gap-2">
		<div class="min-w-0">
			<div class="font-medium">{title}</div>
			{#if description}
				<div class="text-xs text-base-content/50">{description}</div>
			{/if}
		</div>
		<div class="flex items-center gap-2">
			{#if running}
				<span class="badge badge-info gap-2">
					<span class="loading loading-spinner loading-xs"></span> sendet …
				</span>
			{:else if blocked}
				<span class="badge badge-warning">blockiert</span>
			{:else if done}
				<span class="badge {lastReal ? 'badge-success' : 'badge-ghost'}">
					{lastReal ? '✓ versendet' : '✓ Probelauf'}
				</span>
			{/if}
		</div>
	</div>

	<!-- Aktionen -->
	<div class="flex flex-wrap items-center gap-2">
		<button
			class="btn btn-primary btn-sm gap-2"
			disabled={running || disabled}
			on:click={() => start(false)}
		>
			{#if running && !lastReal}
				<span class="loading loading-spinner loading-xs"></span>
			{/if}
			Probelauf (nur an mich)
		</button>

		<div class="mx-1 h-6 w-px bg-base-300"></div>

		{#if confirming}
			<div class="flex items-center gap-2 rounded-lg bg-error/10 px-2 py-1" transition:slide>
				<span class="text-xs font-medium text-error">Wirklich an alle Empfänger senden?</span>
				<button class="btn btn-error btn-xs" disabled={running} on:click={() => start(true)}>
					Ja, senden
				</button>
				<button class="btn btn-ghost btn-xs" on:click={() => (confirming = false)}>
					Abbrechen
				</button>
			</div>
		{:else}
			<button
				class="btn btn-outline btn-error btn-sm gap-2"
				disabled={running || disabled}
				on:click={() => (confirming = true)}
			>
				✉ Wirklich senden …
			</button>
		{/if}
	</div>

	<!-- Hinweis: Server lehnt ab, weil etwas anderes läuft -->
	{#if blocked}
		<div class="alert alert-warning py-2 text-sm" transition:fade>
			<span>
				Versand momentan nicht möglich: Es läuft gerade eine Validierung oder ein anderer
				Transfer/E-Mail-Versand. Bitte später erneut versuchen.
			</span>
		</div>
	{/if}

	{#if hardError}
		<div class="alert alert-error py-2 text-sm" transition:fade>
			<span>{errorMsg}</span>
		</div>
	{/if}

	<!-- Terminal (einklappbar) -->
	{#if lines.length || current}
		<div>
			<button
				class="btn btn-ghost btn-xs gap-1 px-1 text-base-content/60"
				on:click={() => (showTerminal = !showTerminal)}
			>
				{showTerminal ? '▾' : '▸'} Terminal-Ausgabe ({lines.length})
			</button>
			{#if showTerminal}
				<div
					bind:this={termEl}
					class="mt-1 max-h-60 overflow-auto rounded-lg p-3 font-mono text-xs leading-relaxed"
					style="background:#1e1e2e; color:#d4d4d4"
					transition:slide
				>
					{#each lines as line}
						<div class="whitespace-pre-wrap break-words">{@html line.html}</div>
					{/each}
					{#if current}
						<div
							class="flex items-start gap-2 whitespace-pre-wrap break-words"
							style="color:#f9e2af"
						>
							<span class="loading loading-spinner loading-xs mt-0.5"></span>
							<span>{@html current.html}</span>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>
