<script>
	import AttachmentManager from '$lib/email/AttachmentManager.svelte';

	export let data;
</script>

<div class="mx-2 mt-4 flex flex-col gap-6">
	<div class="flex flex-col gap-2">
		<h1 class="text-2xl font-semibold">E-Mail-Anhänge</h1>
		<p class="max-w-3xl text-sm text-base-content/60">
			Anhänge werden im Backend zwischengespeichert und beim eigentlichen Versand (folgt in einer
			späteren Phase) automatisch der passenden E-Mail beigelegt. Während eine Validierung oder ein
			Transfer läuft, lehnt der Server Uploads ab — das wird hier nur als Hinweis angezeigt.
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
			description="ZIP mit den Deckblatt-PDFs hochladen. Der key (Lehrer-ID) wird aus der letzten Ziffernfolge des Dateinamens abgeleitet, z. B. Deckblatt_12345.pdf → 12345. Abgeglichen gegen alle Prüfenden im Plan."
			unitPlural="Deckblätter"
			acceptZip={true}
			expectedKeys={data.expectedExamers}
		/>
	</section>
</div>
