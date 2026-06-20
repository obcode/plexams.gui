<script>
	import AttachmentManager from '$lib/email/AttachmentManager.svelte';
	import EmailSender from '$lib/email/EmailSender.svelte';

	export let data;

	// Auswahl für den Einzelversand eines Deckblatts.
	let selectedExamerId = '';
	$: selectedExamer = data.expectedExamers.find(
		(/** @type {any} */ e) => String(e.key) === String(selectedExamerId)
	);
</script>

<div class="mx-2 mt-4 flex flex-col gap-6">
	<div class="flex flex-col gap-2">
		<h1 class="text-2xl font-semibold">E-Mail-Anhänge</h1>
		<p class="max-w-3xl text-sm text-base-content/60">
			Anhänge werden im Backend zwischengespeichert und beim Versand automatisch der passenden
			E-Mail beigelegt. Während eine Validierung oder ein Transfer läuft, lehnt der Server Uploads
			und Versand ab — das wird hier nur als Hinweis angezeigt.
		</p>
	</div>

	<section class="flex flex-col gap-3">
		<h2 class="text-lg font-semibold text-base-content/80">Aufsichtskalender (invigilation-image)</h2>
		<AttachmentManager
			kind="invigilation-image"
			title="Aufsichtskalender"
			description="Pro Aufsicht ein Kalender-PNG (key = Aufsichts-ID). Am einfachsten direkt unter „Aufsichten mit Anforderungen“ über „Bilder auf Server hochladen“. Alternativ hier ein ZIP hochladen — der key wird aus der letzten Ziffernfolge des Dateinamens abgeleitet (die Export-Dateien heißen bereits <id>.png)."
			unitPlural="Kalender"
			acceptZip={true}
			expectedKeys={data.expectedInvigilators}
		/>
	</section>

	<section class="flex flex-col gap-3">
		<h2 class="text-lg font-semibold text-base-content/80">Deckblätter (cover-page)</h2>
		<AttachmentManager
			kind="cover-page"
			title="Deckblätter"
			description="ZIP mit den Deckblatt-PDFs hochladen. Der key (Lehrer-ID) wird aus der letzten Ziffernfolge des Dateinamens abgeleitet, z. B. Deckblatt_12345.pdf → 12345. Abgeglichen gegen die Prüfenden mit von mir geplanten Prüfungen."
			unitPlural="Deckblätter"
			acceptZip={true}
			expectedKeys={data.expectedExamers}
		/>

		<!-- Versand der Deckblätter -->
		<div class="flex flex-col gap-1">
			<h3 class="text-sm font-semibold text-base-content/70">Versenden</h3>
			<p class="text-xs text-base-content/50">
				Probelauf mailt nur an dich. Findet der Server für einen Prüfer kein PDF (weder Upload noch
				<span class="font-mono">coverPages.dir</span>), kommt dafür eine ERROR-Zeile — der Rest läuft
				weiter.
			</p>
		</div>

		<EmailSender
			emailKey="sendEmailCoverPages"
			title="Alle Deckblätter versenden"
			description="An alle Prüfenden mit von mir geplanten Prüfungen."
		/>

		<!-- Einzelversand -->
		<div class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
			<div class="flex flex-wrap items-end gap-3">
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Einzelne/r Prüfende/r</span>
					<select class="select select-bordered select-sm w-64" bind:value={selectedExamerId}>
						<option value="">— auswählen —</option>
						{#each data.expectedExamers as e (e.key)}
							<option value={e.key}>{e.label} ({e.key})</option>
						{/each}
					</select>
				</label>
			</div>
			<EmailSender
				emailKey="sendEmailCoverPage"
				title={selectedExamer
					? `Deckblatt an ${selectedExamer.label}`
					: 'Deckblatt an einzelne/n Prüfende/n'}
				description="Sendet nur das Deckblatt der oben gewählten Person."
				extraArgs={{ teacherID: { type: 'Int!', value: Number(selectedExamerId) } }}
				disabled={!selectedExamerId}
			/>
		</div>
	</section>
</div>
