<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import WriteButton from '$lib/WriteButton.svelte';
	import {
		dryRunTestMail,
		ensureDryRunTestMail,
		setDryRunTestMail,
		resetDryRunTestMail
	} from '$lib/email/dryRunTestMail';

	// Probeläufe-Empfänger anzeigen/setzen/zurücksetzen. Alle „Probelauf"-Buttons
	// (EmailSender) lesen denselben Store → Änderungen schlagen sofort durch.

	let input = $state('');
	let busy = $state(false);
	let error = $state('');
	let savedAt = $state('');
	// Eingabefeld nur einmal aus dem geladenen Override vorbelegen.
	let seeded = false;

	onMount(() => {
		ensureDryRunTestMail();
	});

	$effect(() => {
		if (!seeded && $dryRunTestMail) {
			input = $dryRunTestMail.override ?? '';
			seeded = true;
		}
	});

	async function save() {
		if (busy) return;
		busy = true;
		error = '';
		savedAt = '';
		try {
			await setDryRunTestMail(input.trim());
			savedAt = new Date().toLocaleTimeString('de-DE');
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			busy = false;
		}
	}

	async function reset() {
		if (busy) return;
		busy = true;
		error = '';
		savedAt = '';
		try {
			const status = await resetDryRunTestMail();
			input = status.override ?? '';
			savedAt = new Date().toLocaleTimeString('de-DE');
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			busy = false;
		}
	}
</script>

<div class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
	<div class="flex flex-wrap items-center gap-2">
		<span class="font-semibold">Probelauf-Empfänger</span>
		<span class="text-sm text-base-content/50">nur für diese Session</span>
	</div>

	<!-- Warnung, wenn der Empfänger vom konfigurierten Default abweicht -->
	{#if $dryRunTestMail?.overridden}
		<div class="alert alert-warning flex-wrap py-2 text-sm" transition:fade>
			<span>
				Probelauf-Empfänger weicht ab: <span class="font-mono font-semibold"
					>{$dryRunTestMail.current}</span
				> — zurücksetzen?
			</span>
			<WriteButton class="btn btn-warning btn-sm" disabled={busy} onclick={reset}>
				Zurücksetzen
			</WriteButton>
		</div>
	{/if}

	<div class="flex flex-wrap items-end gap-3">
		<label class="flex flex-col gap-1">
			<span class="text-xs font-medium text-base-content/60">E-Mail (leer = Default)</span>
			<input
				type="email"
				class="input input-bordered input-sm w-full sm:w-80"
				placeholder={$dryRunTestMail?.default ?? ''}
				bind:value={input}
			/>
		</label>
		<WriteButton class="btn btn-primary btn-sm" disabled={busy} onclick={save}>
			{busy ? 'speichert …' : 'Setzen'}
		</WriteButton>
		{#if $dryRunTestMail?.overridden}
			<WriteButton class="btn btn-outline btn-sm" disabled={busy} onclick={reset}>
				Auf Default zurücksetzen
			</WriteButton>
		{/if}
		{#if savedAt}
			<span class="text-xs text-success">gespeichert ({savedAt})</span>
		{/if}
	</div>

	{#if $dryRunTestMail}
		<div class="text-xs text-base-content/50">
			Probeläufe gehen aktuell an <span class="font-mono">{$dryRunTestMail.current}</span>. Default:
			<span class="font-mono">{$dryRunTestMail.default}</span>.
		</div>
	{/if}

	{#if error}
		<div class="alert alert-error py-2 text-sm"><span>{error}</span></div>
	{/if}
</div>
