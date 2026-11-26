<script>
	import PageIntro from '#lib/help/PageIntro.svelte';
	import Term from '#lib/help/Term.svelte';
	import ValidationGroup from '#lib/validation/ValidationGroup.svelte';
	import StreamAction from '#lib/zpa/StreamAction.svelte';
	import SyncLog from '#lib/zpa/SyncLog.svelte';
	import { zpaValidators } from '#lib/validation/validators.js';
	import { refreshAll } from '$app/navigation';
	import { page } from '$app/state';
	import { isViewer } from '#lib/auth.js';

	let { data } = $props();

	// nach einem Im-/Export den Sync-Verlauf neu laden
	const refreshLog = () => refreshAll();

	// Der komplette Datenabgleich schreibt (überschreibt Importe, verschickt Mails):
	// für die VIEWER-Rolle ausblenden, bei geschütztem Semester deaktivieren.
	// Enforcement macht das Backend (lehnt VIEWER/read-only ab) — das ist nur die Politur.
	let viewer = $derived(isViewer(page.data?.me));
	let readOnly = $derived(page.data?.readOnly ?? false);

	// Downloads (Import aus ZPA) — ohne Argumente.
	/** @type {{ field: string, title: string, desc: string }[]} */
	const downloads = [
		{
			field: 'importTeachersFromZPA',
			title: 'Dozierende',
			desc: 'Lädt alle Lehrenden mit Namen und E-Mail-Adresse. Nötig, bevor Prüfende angeschrieben oder Aufsichten geplant werden. Ersetzt die bisher geladene Liste.'
		},
		{
			field: 'importExamsFromZPA',
			title: 'Prüfungen',
			desc: 'Lädt die offizielle Prüfungsliste des Semesters. Ersetzt die bisher geladene Liste; deine Auswahl der zu planenden Prüfungen und die Vorgaben bleiben erhalten.'
		},
		{
			field: 'importInvigilatorRequirementsFromZPA',
			title: 'Aufsichts-Anforderungen',
			desc: 'Lädt, was die Aufsichtführenden im ZPA eingetragen haben (Sperrtage und Wünsche). Erst sinnvoll, nachdem die Abfrage dazu verschickt wurde.'
		},
		{
			field: 'importStudentsFromZPA',
			title: 'Studierende',
			desc: 'Lädt zu den angemeldeten Studierenden die Angaben aus dem ZPA, vor allem die E-Mail-Adressen. Vor dem Übertragen der Anmeldungen nötig.'
		}
	];

	// Uploads (ins ZPA übertragen) — die Prüfungs-Uploads haben ein dryRun-Argument.
	/** @type {{ field: string, title: string, desc: string, hasDryRun: boolean }[]} */
	const uploads = [
		{
			field: 'uploadExamsToZPA',
			title: 'Prüfungen',
			desc: 'Überträgt die Termine aller geplanten Prüfungen, ohne Räume und Aufsichten. Für den Stand nach der Terminplanung.',
			hasDryRun: true
		},
		{
			field: 'uploadExamsWithRoomsToZPA',
			title: 'Prüfungen mit Räumen',
			desc: 'Überträgt Termine und Räume. Für den Stand nach der Raumplanung.',
			hasDryRun: true
		},
		{
			field: 'uploadExamsWithInvigilatorsToZPA',
			title: 'Prüfungen mit Räumen & Aufsichten',
			desc: 'Überträgt Termine, Räume und Aufsichten. Für den fertigen Plan.',
			hasDryRun: true
		},
		{
			field: 'uploadStudentRegsToZPA',
			title: 'Anmeldungen',
			desc: 'Überträgt, wer zu welcher Prüfung angemeldet ist. Danach sehen die Studierenden ihre Prüfungen im ZPA. Kein Probelauf.',
			hasDryRun: false
		}
	];
</script>

<div class="mx-2 mt-4 flex flex-col gap-6">
	<PageIntro title="ZPA-Import &amp; Veröffentlichung" help="glossar-zpa">
		Hier holst du Daten aus dem <Term id="zpa" /> nach Plexams und überträgst am Ende den Plan dorthin
		zurück. Laden ändert nur die Kopie in Plexams, nie das ZPA. Übertragen ändert, was Lehrende und Studierende
		im ZPA sehen. Unten steht, wann zuletzt was geladen oder übertragen wurde.
		{#snippet howto()}
			<ol>
				<li>
					Zu Beginn der Planung: „Dozierende" und „Prüfungen" laden. Danach geht es mit
					<a href="/exam/examsToPlan">Prüfungen auswählen &amp; Vorgaben</a> weiter.
				</li>
				<li>
					Wenn die Anmeldungen aufbereitet sind: „Studierende" laden, dann „Anmeldungen" übertragen.
				</li>
				<li>
					Nach Terminplanung, Raumplanung und Aufsichtenplanung jeweils den passenden Stand
					übertragen, immer zuerst als Probelauf.
				</li>
				<li>
					Nach jedem Übertragen die ZPA-Validierung starten: Sie vergleicht, ob im ZPA dasselbe
					steht wie in Plexams.
				</li>
			</ol>
		{/snippet}
	</PageIntro>

	<!-- Kompletter Datenabgleich (identisch zum nächtlichen Auto-Sync): zieht alle
	     vier Quellen nacheinander, protokolliert die Diffs und verschickt die
	     Änderungs-Mail. Schreib-Aktion → für VIEWER ausgeblendet. -->
	{#if !viewer}
		<div class="flex flex-col gap-3">
			<div class="flex flex-wrap items-baseline gap-2">
				<h2 class="text-xl font-semibold">Datenabgleich</h2>
				<span class="text-sm text-base-content/60">
					alles auf einmal laden, wie es Plexams jede Nacht selbst tut
				</span>
			</div>
			<StreamAction
				field="triggerScheduledSync"
				title="ZPA + Anny jetzt abgleichen"
				description="Lädt nacheinander Prüfungen, Dozierende und Aufsichts-Anforderungen aus dem ZPA und die Raumbuchungen aus Anny. Ersetzt die bisher geladenen Daten und verschickt eine E-Mail mit den Unterschieden zum vorherigen Stand. Es gibt keinen Probelauf; der Vorgang dauert einen Moment."
				accent="warning"
				actionLabel="Jetzt abgleichen"
				disabled={readOnly}
				disabledTitle="Semester ist geschützt (nur lesen)"
				ondone={refreshLog}
			/>
		</div>
	{/if}

	<!-- ZPA-Validierungen: eigene Ampel, manuell starten -->
	<div class="flex flex-col gap-3">
		<div class="flex flex-wrap items-baseline gap-2">
			<h2 class="text-xl font-semibold">ZPA-Validierung</h2>
			<span class="text-sm text-base-content/60">
				vergleicht Termine, Räume und Aufsichten im ZPA mit dem Plan in Plexams; startet nur auf
				Klick und hat eine eigene Ampel oben in der Leiste
			</span>
		</div>
		<ValidationGroup validators={zpaValidators} storeId="zpa" autostart={false} />
	</div>

	<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
		<!-- Downloads -->
		<div class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
			<div class="flex items-center gap-2">
				<span class="flex h-8 w-8 items-center justify-center rounded-lg bg-info/15 text-info">
					<svg
						class="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4" />
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 20h16" />
					</svg>
				</span>
				<h2 class="text-lg font-semibold">Aus dem ZPA laden</h2>
			</div>
			{#each downloads as d}
				<StreamAction
					field={d.field}
					title={d.title}
					description={d.desc}
					accent="info"
					actionLabel="Laden"
					ondone={refreshLog}
				/>
			{/each}
		</div>

		<!-- Uploads -->
		<div class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
			<div class="flex items-center gap-2">
				<span
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-success/15 text-success"
				>
					<svg
						class="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 20V8m0 0l-4 4m4-4l4 4" />
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 4h16" />
					</svg>
				</span>
				<h2 class="text-lg font-semibold">Ins ZPA übertragen</h2>
			</div>
			{#each uploads as u}
				<StreamAction
					field={u.field}
					title={u.title}
					description={u.desc}
					hasDryRun={u.hasDryRun}
					accent="success"
					actionLabel="Übertragen"
					ondone={refreshLog}
				/>
			{/each}
		</div>
	</div>

	<!-- Sync-Verlauf (zeitgestempelte Historie aller Transfers) -->
	<div class="flex flex-col gap-3">
		<div class="flex flex-wrap items-baseline gap-2">
			<h2 class="text-xl font-semibold">Verlauf</h2>
			<span class="text-sm text-base-content/60">
				wann zuletzt was geladen oder übertragen wurde
			</span>
			<button class="btn btn-ghost btn-xs" onclick={refreshLog}>↻ neu laden</button>
		</div>
		{#await data.syncLog}
			<div class="flex items-center gap-2 text-sm text-base-content/50">
				<span class="loading loading-spinner loading-sm"></span> lädt …
			</div>
		{:then entries}
			<SyncLog {entries} />
		{:catch}
			<div class="alert alert-error py-2 text-sm">
				<span>Der Verlauf konnte nicht geladen werden. Lade die Seite neu.</span>
			</div>
		{/await}
	</div>
</div>
