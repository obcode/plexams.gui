<script>
	import EmailSender from '$lib/email/EmailSender.svelte';

	/** @type {import('$lib/email/emails').EmailDef} */
	export let email;
	/** @type {Record<string, boolean>} */
	export let conditionsDone = {};
	export let allRequirementsPresent = false;
</script>

<div class="flex flex-col gap-2">
	<EmailSender
		emailKey={email.key}
		title={email.title}
		description={email.description}
		extraArgs={email.extraArgs ?? {}}
		conditionKey={email.conditionKey ?? ''}
		{conditionsDone}
		hideRealSend={email.key === 'sendEmailInvigilationsMissing' && allRequirementsPresent}
		hideRealSendHint="alle Anforderungen vorhanden — kein Versand nötig"
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
