<script>
	import { onDestroy, tick, createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';
	import { getConvert, getWsClient } from '$lib/validation/wsClient';
	import { checkAssembledExams } from '$lib/assembledExams/store';
	import { checkStudentRegs } from '$lib/studentRegs/store';

	// Generische Terminal-Ausgabe für argumentlose Streaming-Subscriptions
	// (LogLine: level/text, PROGRESS in-place, endet mit DONE). Mehrere Aktionen
	// teilen sich ein Terminal. Exklusive Aktionen werden serverseitig
	// blockiert (ERROR + DONE) — das zeigen wir als Hinweis.

	/** @type {{ field: string, label: string, primary?: boolean, disabled?: boolean }[]} */
	export let actions = [];

	const dispatch = createEventDispatcher();

	let running = false;
	/** @type {string | null} */
	let runningField = null;
	let done = false;
	let blocked = false;
	/** @type {string | null} */
	let errorMsg = null;
	// Aussagekräftige Fehlermeldungen vom Reporter/error-Kanal (ERROR-Level-Zeilen,
	// die keine reine Sperrmeldung sind) — prominent als Alert statt nur im Terminal.
	/** @type {string[]} */
	let errorTexts = [];
	/** ANSI-Codes entfernen, damit die Klartext-Meldung lesbar ist. */
	const stripAnsi = (/** @type {string} */ t) => (t ?? '').replace(/\[[0-9;]*m/g, '');

	/** @type {{ level: string, html: string }[]} */
	let lines = [];
	/** @type {{ html: string } | null} */
	let current = null;

	/** @type {HTMLDivElement} */
	let termEl;
	/** @type {any} */
	let convert = null;
	/** @type {any} */
	let wsClient = null;
	/** @type {(() => void) | null} */
	let unsubscribe = null;

	/** @param {string} t */
	const isBlockedMessage = (t) =>
		/running, cannot start now|a validation or another|writes? (are |is )?(not allowed|blocked)|exclusive|already running|is published|locked|gesperrt/i.test(
			t
		);

	async function scrollToBottom() {
		await tick();
		if (termEl) termEl.scrollTop = termEl.scrollHeight;
	}

	/** @param {string} field */
	async function start(field) {
		if (running) return;
		lines = [];
		current = null;
		errorMsg = null;
		errorTexts = [];
		blocked = false;
		done = false;
		running = true;
		runningField = field;

		try {
			if (!convert) convert = await getConvert();
			if (!wsClient) wsClient = await getWsClient();
		} catch (e) {
			errorMsg = 'Konnte WebSocket-Client nicht laden: ' + (e instanceof Error ? e.message : e);
			running = false;
			return;
		}

		unsubscribe = wsClient.subscribe(
			{ query: `subscription { ${field} { level text } }` },
			{
				/** @param {any} msg */
				next: (msg) => {
					if (msg.errors && msg.errors.length) {
						errorMsg = msg.errors.map((/** @type {any} */ e) => e.message).join('; ');
						return;
					}
					const line = msg.data && msg.data[field];
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
						if (line.level === 'ERROR') {
							// Sperrmeldung → eigener Hinweis; sonst aussagekräftige
							// Reporter-/error-Meldung prominent als Fehler-Alert zeigen.
							if (isBlockedMessage(text)) {
								blocked = true;
							} else {
								errorTexts = [...errorTexts, stripAnsi(text)];
								errorMsg = errorTexts.join('\n');
							}
						}
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
					dispatch('done', { field, blocked });
					// Subscriptions (z. B. importExamsFromZPA/importStudentsFromZPA)
					// können aufbereitete Prüfungen / StudentRegs invalidieren →
					// Banner-Zustände sofort neu prüfen.
					checkAssembledExams();
					checkStudentRegs();
				}
			}
		);
	}

	function close() {
		lines = [];
		current = null;
		errorMsg = null;
		errorTexts = [];
		blocked = false;
		done = false;
	}

	onDestroy(() => {
		if (unsubscribe) unsubscribe();
	});
</script>

<div class="flex flex-col gap-3">
	<div class="flex flex-wrap items-center gap-2">
		{#each actions as a}
			<button
				class="btn btn-sm gap-2 {a.primary ? 'btn-primary' : 'btn-outline'}"
				disabled={running || a.disabled}
				title={a.disabled ? 'gesperrt' : ''}
				on:click={() => start(a.field)}
			>
				{#if running && runningField === a.field}
					<span class="loading loading-spinner loading-xs"></span>
				{/if}
				{a.label}
			</button>
		{/each}
		{#if done && !errorMsg && !blocked}
			<span class="badge badge-success">fertig</span>
		{/if}
		{#if !running && (lines.length || current || errorMsg || blocked)}
			<button class="btn btn-ghost btn-xs gap-1" on:click={close}>✕ schließen</button>
		{/if}
	</div>

	{#if blocked}
		<div class="alert alert-warning py-2 text-sm" transition:fade>
			<span>
				Aktion momentan nicht möglich: Es läuft gerade eine Validierung, ein Transfer oder eine
				andere Generierung. Bitte später erneut versuchen.
			</span>
		</div>
	{/if}
	{#if errorMsg}
		<div class="alert alert-error py-2 text-sm" transition:fade>
			<span class="whitespace-pre-wrap break-words">{errorMsg}</span>
		</div>
	{/if}

	{#if lines.length || current}
		<div
			bind:this={termEl}
			class="max-h-72 overflow-auto rounded-lg border border-base-300 p-3 font-mono text-xs leading-relaxed"
			style="background:#1e1e2e; color:#d4d4d4"
		>
			{#each lines as line}
				<div class="whitespace-pre-wrap break-words">{@html line.html}</div>
			{/each}
			{#if current}
				<div class="flex items-start gap-2 whitespace-pre-wrap break-words" style="color:#f9e2af">
					<span class="loading loading-spinner loading-xs mt-0.5"></span>
					<span>{@html current.html}</span>
				</div>
			{/if}
		</div>
	{/if}
</div>
