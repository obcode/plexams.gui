<script>
	import EmailSender from '$lib/email/EmailSender.svelte';
	import { emailGroups } from '$lib/email/emails';

	export let data;
</script>

<div class="mx-2 mt-4 flex flex-col gap-6">
	<div class="flex flex-col gap-2">
		<h1 class="text-2xl font-semibold">E-Mails versenden</h1>
		<p class="max-w-3xl text-sm text-base-content/60">
			Jeder Versand ist standardmäßig ein <strong>Probelauf</strong> — die E-Mail geht dann nur an
			dich (den Planer). Über „Wirklich senden …" wird nach einer Bestätigung an alle Empfänger
			versendet. Solange eine Validierung oder ein ZPA-Transfer läuft, lehnt der Server den Versand
			ab; das wird hier nur als Hinweis angezeigt.
		</p>
	</div>

	{#each emailGroups as group}
		<section class="flex flex-col gap-3">
			<h2 class="text-lg font-semibold text-base-content/80">{group.title}</h2>
			<div class="grid grid-cols-1 gap-3 xl:grid-cols-2">
				{#each group.emails as email (email.key)}
					<div class="flex flex-col gap-2">
						<EmailSender
							emailKey={email.key}
							title={email.title}
							description={email.description}
							conditionsDone={data.conditionsDone}
						/>
						{#if email.links}
							<div class="flex flex-wrap gap-2 px-1">
								{#each email.links as link}
									<a
										href={link.href}
										class="btn btn-sm gap-2 {link.primary ? 'btn-primary' : 'btn-outline'}"
									>
										{link.label}
									</a>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</section>
	{/each}
</div>
