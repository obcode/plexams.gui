<script>
	import { KIND_LABEL, inquiryPath } from '#lib/portal/inquiry.js';
	import { formatBerlin } from '#lib/portal/time.js';

	/** @type {{ data: any }} */
	let { data } = $props();
	const session = $derived(data.session);
	const teacher = $derived(session?.teachers?.[0]);
	const inquiries = $derived(/** @type {any[]} */ (data.inquiries ?? []));
	const open = $derived(inquiries.filter((i) => i.open));
	const closed = $derived(inquiries.filter((i) => !i.open));
	const concerning = $derived(open.filter((i) => i.affected));
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
		{#if open.length === 0}
			<p class="mt-2 text-base-content/70">
				Derzeit ist keine Abfrage offen. Sobald die Prüfungsplanung eine Abfrage öffnet, finden Sie
				sie hier und bekommen eine E-Mail.
			</p>
		{:else if concerning.length === 0}
			<!-- Die Schranke: ZPA-Person, aber von keiner offenen Abfrage betroffen. -->
			<div class="alert mt-3">
				<span>Sie haben keine Prüfung im zu planenden Semester. Für Sie ist nichts zu tun.</span>
			</div>
		{:else}
			<ul class="mt-3 grid grid-cols-1 gap-3">
				{#each concerning as inquiry (inquiry.semester + inquiry.kind)}
					{@const href = inquiryPath(inquiry)}
					<li class="card border border-base-300 bg-base-100">
						<div class="card-body gap-2">
							<h3 class="card-title text-base">
								{KIND_LABEL[inquiry.kind] ?? inquiry.kind} · {inquiry.semester}
							</h3>
							<p class="text-sm text-base-content/70">
								{#if inquiry.deadline}Bitte bis {formatBerlin(inquiry.deadline)} Uhr.{/if}
								{#if inquiry.nothingToReport}Sie haben angegeben, dass Sie nichts zu melden haben.{/if}
							</p>
							{#if href}
								<div class="card-actions">
									<a class="btn btn-primary btn-sm" {href}>Öffnen</a>
								</div>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	{#if closed.some((i) => i.affected)}
		<section class="mt-6">
			<h2 class="text-lg font-medium">Abgeschlossene Abfragen</h2>
			<ul class="mt-2 list-inside list-disc text-sm">
				{#each closed.filter((i) => i.affected) as inquiry (inquiry.semester + inquiry.kind)}
					{@const href = inquiryPath(inquiry)}
					<li>
						{#if href}<a class="link" {href}>
								{KIND_LABEL[inquiry.kind] ?? inquiry.kind} · {inquiry.semester}
							</a>{:else}{KIND_LABEL[inquiry.kind] ?? inquiry.kind} · {inquiry.semester}{/if}
						– nur noch zum Nachlesen
					</li>
				{/each}
			</ul>
		</section>
	{/if}

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
