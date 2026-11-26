<script>
	import { isBusy, plannerErrorMessage } from '#lib/errors/plannerErrors.js';
	import {
		CLIENT_LOAD_MESSAGE,
		streamErrorMessage,
		streamFailureMessage
	} from '#lib/errors/streamErrors.js';
	import { onDestroy, tick } from 'svelte';
	import { fade } from 'svelte/transition';
	import { getConvert, getWsClient } from '#lib/validation/wsClient.js';
	import { checkAssembledExams } from '#lib/assembledExams/store.js';
	import { checkStudentRegs } from '#lib/studentRegs/store.js';

	// Generische Terminal-Ausgabe für argumentlose Streaming-Subscriptions
	// (LogLine: level/text, PROGRESS in-place, endet mit DONE). Mehrere Aktionen
	// teilen sich ein Terminal. Exklusive Aktionen werden serverseitig
	// blockiert (ERROR + DONE) — das zeigen wir als Hinweis.

	/**
	 * @typedef {Object} Props
	 * @property {{ field: string, label: string, primary?: boolean, disabled?: boolean }[]} [actions]
	 * @property {(info: { field: string, blocked: boolean }) => void} [ondone] - meldet Abschluss einer Aktion
	 */

	/** @type {Props} */
	let { actions = [], ondone } = $props();

	let running = $state(false);
	/** @type {string | null} */
	let runningField = $state(null);
	let done = $state(false);
	let blocked = $state(false);
	/** @type {string | null} */
	let errorMsg = $state(null);
	// Aussagekräftige Fehlermeldungen vom Reporter/error-Kanal (ERROR-Level-Zeilen,
	// die keine reine Sperrmeldung sind) — prominent als Alert statt nur im Terminal.
	/** @type {string[]} */
	let errorTexts = [];

	// Zeilen nach Level farblich hervorheben (Catppuccin-Palette passend zum
	// Terminal-Hintergrund). WARN-Zeilen — z. B. die Warnf-Warnung der
	// Terminplan-Generierung — sollen sich deutlich von normalen Zeilen abheben.
	/** @param {string} level */
	const lineColor = (level) => (level === 'ERROR' ? '#f38ba8' : level === 'WARN' ? '#f9e2af' : '');
	/** @param {string} level */
	const linePrefix = (level) => (level === 'ERROR' ? '✖ ' : level === 'WARN' ? '⚠ ' : '');

	/** @type {{ level: string, html: string }[]} */
	let lines = $state([]);
	/** @type {{ html: string } | null} */
	let current = $state(null);

	/** @type {HTMLDivElement | undefined} */
	let termEl = $state();
	/** @type {any} */
	let convert = null;
	/** @type {any} */
	let wsClient = null;
	/** @type {(() => void) | null} */
	let unsubscribe = null;

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
		} catch {
			errorMsg = CLIENT_LOAD_MESSAGE;
			running = false;
			return;
		}

		unsubscribe = wsClient.subscribe(
			{ query: `subscription { ${field} { level text code } }` },
			{
				/** @param {any} msg */
				next: (msg) => {
					if (msg.errors && msg.errors.length) {
						errorMsg = streamFailureMessage(msg.errors);
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
							if (isBusy(line.code)) {
								blocked = true;
							} else {
								errorTexts = [...errorTexts, streamErrorMessage(line)];
								errorMsg = errorTexts.join('\n');
							}
						}
						if (line.level === 'DONE') done = true;
					}
					scrollToBottom();
				},
				/** @param {any} err */
				error: (err) => {
					errorMsg = streamFailureMessage(err);
					running = false;
				},
				complete: () => {
					if (current) {
						lines = [...lines, { level: 'PROGRESS', html: current.html }];
						current = null;
					}
					running = false;
					done = true;
					ondone?.({ field, blocked });
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
				onclick={() => start(a.field)}
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
			<button class="btn btn-ghost btn-xs gap-1" onclick={close}>✕ schließen</button>
		{/if}
	</div>

	{#if blocked}
		<div class="alert alert-warning py-2 text-sm" transition:fade>
			<span>
				{plannerErrorMessage('BUSY')}
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
				<div
					class="whitespace-pre-wrap break-words {line.level === 'WARN' || line.level === 'ERROR'
						? 'font-semibold'
						: ''}"
					style={lineColor(line.level) ? `color:${lineColor(line.level)}` : ''}
				>
					{linePrefix(line.level)}{@html line.html}
				</div>
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
