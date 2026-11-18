import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CONDITION_LINK, conditionLink } from './conditionLinks';
import { EMAIL_CONDITION } from '$lib/email/emailConditions';

const routesDir = fileURLToPath(new URL('../../routes/(planner)', import.meta.url));

describe('conditionLinks', () => {
	it('points every condition at an existing route', () => {
		for (const [key, href] of Object.entries(CONDITION_LINK)) {
			const path = href.split('#')[0];
			expect(existsSync(`${routesDir}${path}/+page.svelte`), `${key} → ${href}`).toBe(true);
		}
	});

	it('links every email condition to its card on /email', () => {
		for (const [emailKey, cond] of Object.entries(EMAIL_CONDITION)) {
			expect(conditionLink(cond)).toBe(`/email#${emailKey}`);
		}
		expect(conditionLink('ntaRoomAloneSent')).toBe('/email#sendEmailNTARoomAlone');
	});

	it('returns undefined for unknown conditions', () => {
		expect(conditionLink('doesNotExist')).toBeUndefined();
	});
});
