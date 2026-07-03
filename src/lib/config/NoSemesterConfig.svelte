<script lang="ts">
	// Anzeige, wenn semesterConfig null ist (Semester noch nicht konfiguriert).
	let { semester = '' }: { semester?: string } = $props();
</script>

<div class="mx-2 mt-10 flex justify-center">
	<div class="card max-w-xl border border-base-300 bg-base-100 shadow-sm">
		<div class="card-body items-center gap-3 text-center">
			<div class="text-5xl">🗓️</div>
			<h2 class="card-title">Noch keine Semester-Konfiguration</h2>
			<p class="text-sm text-base-content/70">
				Für dieses Semester{semester ? ` (${semester})` : ''} ist noch keine Konfiguration hinterlegt.
				Lege sie an, um mit der Planung zu beginnen.
			</p>
			<div class="card-actions mt-1">
				<a class="btn btn-primary btn-sm" href="/config">Konfiguration anlegen</a>
				<a class="btn btn-ghost btn-sm" href="/config/new">Neues Semester anlegen</a>
			</div>
			<p class="text-xs text-base-content/40">Alternativ über das plexams-CLI initialisieren.</p>
		</div>
	</div>
</div>
