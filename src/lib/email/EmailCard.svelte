<script lang="ts">
	import EmailSender from '#lib/email/EmailSender.svelte';
	import type { EmailDef } from '#lib/email/emails.js';

	let {
		email,
		conditionsDone = {},
		allRequirementsPresent = false
	}: {
		email: EmailDef;
		conditionsDone?: Record<string, boolean>;
		allRequirementsPresent?: boolean;
	} = $props();
</script>

<div id={email.key} class="flex scroll-mt-20 flex-col gap-2">
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
					class="btn btn-sm h-auto max-w-full gap-2 whitespace-normal {link.primary
						? 'btn-primary'
						: 'btn-outline'}"
				>
					{link.label}
				</a>
			{/each}
		</div>
	{/if}
</div>
