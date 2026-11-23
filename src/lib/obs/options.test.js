import { describe, expect, it } from 'vitest';
import { commonOptions, DATA_COLLECTION } from './options';
import { scrubBreadcrumb, scrubEvent } from './scrub';

/** @param {unknown} value @returns {unknown[]} */
const leaves = (value) =>
	value !== null && typeof value === 'object' && !Array.isArray(value)
		? Object.values(value).flatMap(leaves)
		: [value];

describe('DATA_COLLECTION', () => {
	it('lets the SDK collect nothing on its own', () => {
		for (const leaf of leaves(DATA_COLLECTION)) {
			expect(leaf === false || (Array.isArray(leaf) && leaf.length === 0), String(leaf)).toBe(true);
		}
	});

	// An omitted key means Sentry's default, and every default collects. This list is what
	// Sentry 11.16 knows; when a release adds a category, add it here and to DATA_COLLECTION.
	it('states every category Sentry 11 defaults to on', () => {
		expect(Object.keys(DATA_COLLECTION).sort()).toEqual(
			[
				'cookies',
				'databaseQueryData',
				'genAI',
				'graphQL',
				'httpBodies',
				'httpHeaders',
				'mcp',
				'queues',
				'stackFrameVariables',
				'urlQueryParams',
				'userInfo'
			].sort()
		);
		expect(DATA_COLLECTION.graphQL).toEqual({ document: false, variables: false });
	});
});

describe('commonOptions', () => {
	it('passes DATA_COLLECTION and the scrubber to both inits', () => {
		expect(commonOptions.dataCollection).toBe(DATA_COLLECTION);
		expect(commonOptions.beforeSend).toBe(scrubEvent);
		expect(commonOptions.beforeBreadcrumb).toBe(scrubBreadcrumb);
	});

	it('carries no option Sentry 11 removed', () => {
		expect(commonOptions).not.toHaveProperty('sendDefaultPii');
		expect(commonOptions).not.toHaveProperty('enableLogs');
	});
});
