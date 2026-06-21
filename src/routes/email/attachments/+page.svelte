<script>
	import AttachmentManager from '$lib/email/AttachmentManager.svelte';
	import EmailSender from '$lib/email/EmailSender.svelte';

	export let data;

	// Hochgeladene Aufsichtskalender (vom AttachmentManager gemeldet) → steuert,
	// ob „Veröffentlichte Aufsichten“ versendet werden kann.
	/** @type {import('$lib/email/attachments').Attachment[]} */
	let invigAttachments = [];
	$: hasInvigImages = invigAttachments.length > 0;

	// Hochgeladene Deckblätter (vom AttachmentManager gemeldet) → steuert, ob
	// versendet werden kann und welche Prüfenden im Einzelversand wählbar sind.
	/** @type {import('$lib/email/attachments').Attachment[]} */
	let coverAttachments = [];
	$: uploadedExamerKeys = new Set(coverAttachments.map((a) => String(a.key)));
	$: hasCovers = uploadedExamerKeys.size > 0;
	// nur Prüfende, für die ein Deckblatt vorliegt
	$: availableExamers = data.expectedExamers.filter((/** @type {any} */ e) =>
		uploadedExamerKeys.has(String(e.key))
	);

	// Auswahl für den Einzelversand eines Deckblatts.
	let selectedExamerId = '';
	$: selectedExamer = availableExamers.find(
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
			description="Pro Aufsicht ein Kalender-PNG (key = Aufsichts-ID). Die Kalender werden aus den gerenderten Karten erzeugt — das geht nur auf „Aufsichten mit Anforderungen“."
			unitPlural="Kalender"
			expectedKeys={data.expectedInvigilators}
			on:change={(e) => (invigAttachments = e.detail)}
		>
			<a
				slot="actions"
				href="/zpa/invigilator_requirements"
				class="btn btn-primary btn-sm gap-2"
				title="Wechselt auf „Aufsichten mit Anforderungen“ — dort nochmal „Kalender auf Server hochladen“ klicken"
			>
				⬆ Kalender auf Server hochladen
			</a>
		</AttachmentManager>
		<p class="text-xs text-base-content/50">
			Hinweis: Dieser Button wechselt auf die Seite „Aufsichten mit Anforderungen“. Dort musst du den
			Upload mit „Kalender auf Server hochladen“ noch einmal auslösen.
		</p>

		<!-- Versand der veröffentlichten Aufsichten -->
		<div class="flex flex-col gap-1">
			<h3 class="text-sm font-semibold text-base-content/70">Versenden</h3>
			<p class="text-xs text-base-content/50">
				Probelauf mailt nur an die Testadresse. Je Aufsicht eine Mail mit ihrem Kalender; fehlt ein
				PNG, kommt dafür eine WARN-Zeile — der Rest läuft weiter.
			</p>
		</div>

		{#if !hasInvigImages}
			<div class="alert alert-warning py-2 text-sm">
				<span>Es sind noch keine Aufsichtskalender hochgeladen — Versand nicht möglich.</span>
			</div>
		{/if}

		<EmailSender
			emailKey="sendEmailPublishedInvigilations"
			title="Veröffentlichte Aufsichten versenden"
			description="Je Aufsicht eine Mail mit ihrem Aufsichtskalender."
			disabled={!hasInvigImages}
			conditionsDone={data.conditionsDone}
		/>
	</section>

	<section class="flex flex-col gap-3">
		<h2 class="text-lg font-semibold text-base-content/80">Deckblätter (cover-page)</h2>
		<AttachmentManager
			kind="cover-page"
			title="Deckblätter"
			description="ZIP mit allen Deckblatt-PDFs hochladen oder ein einzelnes PDF nachreichen. Der key (Lehrer-ID) wird aus der letzten Ziffernfolge des Dateinamens abgeleitet (z. B. Deckblatt_12345.pdf → 12345) oder beim Einzel-Upload direkt gewählt. Abgeglichen gegen die Prüfenden mit von mir geplanten Prüfungen."
			unitPlural="Deckblätter"
			acceptZip={true}
			acceptSingle={true}
			singleAccept=".pdf"
			expectedKeys={data.expectedExamers}
			on:change={(e) => (coverAttachments = e.detail)}
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

		{#if !hasCovers}
			<div class="alert alert-warning py-2 text-sm">
				<span>Es sind noch keine Deckblätter hochgeladen — Versand nicht möglich.</span>
			</div>
		{/if}

		<EmailSender
			emailKey="sendEmailCoverPages"
			title="Alle Deckblätter versenden"
			description="An alle Prüfenden mit von mir geplanten Prüfungen."
			disabled={!hasCovers}
			conditionsDone={data.conditionsDone}
		/>

		<!-- Einzelversand -->
		<div class="flex flex-col gap-3 rounded-lg border border-base-300 bg-base-100 p-4">
			<div class="flex flex-wrap items-end gap-3">
				<label class="flex flex-col gap-1">
					<span class="text-xs font-medium text-base-content/60">Einzelner Prüfender</span>
					<select
						class="select select-bordered select-sm w-64"
						bind:value={selectedExamerId}
						disabled={!availableExamers.length}
					>
						<option value="">— auswählen —</option>
						{#each availableExamers as e (e.key)}
							<option value={e.key}>{e.label} ({e.key})</option>
						{/each}
					</select>
				</label>
			</div>
			<EmailSender
				emailKey="sendEmailCoverPage"
				title={selectedExamer
					? `Deckblatt an ${selectedExamer.label}`
					: 'Deckblatt an einzelnen Prüfenden'}
				description="Sendet nur das Deckblatt der oben gewählten Person."
				extraArgs={{ teacherID: { type: 'Int!', value: Number(selectedExamer?.key ?? 0) } }}
				disabled={!selectedExamer}
				conditionsDone={data.conditionsDone}
			/>
		</div>
	</section>
</div>
