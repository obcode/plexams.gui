import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { PHASE_HELP, STEP_HELP } from '#lib/help/workflow.js';
import { GLOSSARY, glossaryEntry } from '#lib/help/glossary.js';

// The keys of the planning steps as the backend declares them
// (plexams.go/plexams/planning_state.go). Update this list together with the
// explanations when the backend adds, renames or removes a step.
const BACKEND_STEPS = [
	'zpaPersonsImported',
	'exahmRequested',
	'sebExahmDemandEntered',
	'annyRoomsBooked',
	'sebExahmPreplanned',
	'zpaImported',
	'sebExahmZpaConnected',
	'zpaExamsSelected',
	'mucDaiImported',
	'primussImported',
	'zpaPrimussConnected',
	'constraintsEntered',
	'examPlanningInfoSent',
	'assembledExams',
	'studentRegs',
	'studentRegsUploaded',
	'primussDataAllSent',
	'ntaRoomAloneSent',
	'otherFKExamsScheduled',
	'exahmSebPlanned',
	'exahmSebFixed',
	'examScheduleGenerated',
	'draftSent',
	'examPlanPublished',
	'roomRequestsSent',
	'roomsAssigned',
	'secretariatRoomsSent',
	'roomPlanPublished',
	'kdpRoomsSent',
	'invigReqsImported',
	'invigilationsRequested',
	'invigilationsAssigned',
	'invigilationPlanPublished',
	'ntaPlannedSent',
	'invigSecretariatSent',
	'lbaRepeatersSent',
	'coverPagesSent'
];
const BACKEND_PHASES = ['phaseMinus1', 'phase0', 'phase1', 'phase2', 'phase3'];

describe('workflow help', () => {
	it('explains every step of the planning checklist', () => {
		expect(BACKEND_STEPS.filter((k) => !STEP_HELP[k])).toEqual([]);
	});

	it('explains no step the checklist does not have', () => {
		expect(Object.keys(STEP_HELP).filter((k) => !BACKEND_STEPS.includes(k))).toEqual([]);
	});

	it('introduces every phase', () => {
		expect(BACKEND_PHASES.filter((k) => !PHASE_HELP[k])).toEqual([]);
	});

	it('says what to do and why for every step', () => {
		for (const [key, help] of Object.entries(STEP_HELP)) {
			expect(help.what.length, key).toBeGreaterThan(20);
			expect(help.why.length, key).toBeGreaterThan(20);
		}
	});
});

describe('glossary', () => {
	it('has unique ids', () => {
		const ids = GLOSSARY.map((e) => e.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('keeps the tooltip to one short sentence', () => {
		for (const e of GLOSSARY) expect(e.short.length, e.id).toBeLessThanOrEqual(130);
	});

	it('resolves every <Term id="…"> used in the app', () => {
		const src = fileURLToPath(new URL('../..', import.meta.url));
		const files = readdirSync(src, { recursive: true, encoding: 'utf8' }).filter((f) =>
			f.endsWith('.svelte')
		);
		expect(files.length).toBeGreaterThan(50);
		for (const file of files) {
			const text = readFileSync(`${src}/${file}`, 'utf8');
			for (const m of text.matchAll(/<Term\s+id="([^"]+)"/g)) {
				expect(glossaryEntry(m[1]), `${file}: ${m[1]}`).toBeDefined();
			}
		}
	});
});
