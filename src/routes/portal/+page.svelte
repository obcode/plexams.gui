<script>
	/** @type {{ data: any }} */
	let { data } = $props();
	const session = $derived(data.session);
	const teacher = $derived(session?.teachers?.[0]);
</script>

<h1 class="text-2xl font-semibold">Willkommen{teacher ? `, ${teacher.fullname}` : ''}</h1>

{#if !teacher && !(session?.actsFor?.length > 0)}
	<!-- Die Schranke: angemeldet, aber keine ZPA-Person. -->
	<div class="alert mt-6">
		<span>
			Ihre Kennung ist keiner Person im ZPA zugeordnet. Für Sie gibt es hier deshalb nichts
			einzutragen. Wenn das nicht stimmt, wenden Sie sich bitte an die Prüfungsplanung.
		</span>
	</div>
{:else}
	<section class="mt-6">
		<h2 class="text-lg font-medium">Offene Abfragen</h2>
		<p class="mt-2 text-base-content/70">
			Derzeit ist keine Abfrage offen. Sobald die Prüfungsplanung eine Abfrage öffnet, finden Sie
			sie hier und bekommen eine E-Mail.
		</p>
	</section>

	{#if session?.actsFor?.length > 0}
		<section class="mt-6">
			<h2 class="text-lg font-medium">Vertretungen</h2>
			<p class="mt-2 text-base-content/70">
				Sie können hier auch für
				{session.actsFor.map((/** @type {any} */ t) => t.fullname).join(', ')} handeln.
			</p>
		</section>
	{/if}
{/if}

<section class="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
	<a href="/portal/zugang" class="card border border-base-300 bg-base-100 hover:bg-base-200">
		<div class="card-body">
			<h2 class="card-title text-base">Zugang für Skripte</h2>
			<p class="text-sm text-base-content/70">
				Persönliche Tokens, um das Portal per API abzufragen – zum Beispiel mit Claude.
			</p>
		</div>
	</a>
	<a href="/portal/hilfe/api" class="card border border-base-300 bg-base-100 hover:bg-base-200">
		<div class="card-body">
			<h2 class="card-title text-base">Hilfe zur API</h2>
			<p class="text-sm text-base-content/70">Adresse, Anmeldung und Beispiele.</p>
		</div>
	</a>
</section>
