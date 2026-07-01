import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load({ params }) {
	const query = gql`
		query {
			primussExams {
				program
				exams {
					ancode
					module
					mainExamer
					program
					examType
					presence
					studentRegsCount
					connected
				}
			}
			studyPrograms {
				shortname
				category
			}
			zpaExams {
				ancode
				module
				mainExamer
			}
			teachers {
				shortname
				fk
			}
		}
	`;

	const data = await request(env.PLEXAMS_SERVER, query);

	// Programm-Kürzel → Kategorie (fk07 | mucdai | misc); unbekannte → Sonstige
	/** @type {Record<string, string>} */
	const catByProgram = {};
	for (const sp of data.studyPrograms ?? []) {
		catByProgram[sp.shortname] = sp.category;
	}

	// ZPA-Prüfung je Ancode — Ziel-Vorschau beim Inline-Verbinden.
	/** @type {Record<number, { ancode: number, module: string, mainExamer: string }>} */
	const zpaByAncode = {};
	for (const z of data.zpaExams ?? []) {
		if (z.ancode != null)
			zpaByAncode[z.ancode] = { ancode: z.ancode, module: z.module, mainExamer: z.mainExamer };
	}

	// FK07-Prüfende: alle Personen (Teacher) mit fk === „FK07". Die Namensformate
	// unterscheiden sich (Teacher „Nachname, Vorname" vs. Primuss „Nachname I."),
	// daher Abgleich über Nachname + erste Initiale; Primuss-Mehrfachnamen
	// („A B./C D.") werden gesplittet.
	/** @param {string} name → „nachname|i" aus „Nachname, Vorname" */
	const teacherKey = (name) => {
		const i = (name ?? '').indexOf(',');
		if (i < 0) return '';
		const ln = name.slice(0, i).trim().toLowerCase();
		const fi = (name.slice(i + 1).trim()[0] ?? '').toLowerCase();
		return ln ? `${ln}|${fi}` : '';
	};
	/** @type {Set<string>} */
	const fk07Keys = new Set();
	for (const t of data.teachers ?? []) {
		if (t.fk === 'FK07') {
			const k = teacherKey(t.shortname);
			if (k) fk07Keys.add(k);
		}
	}
	/** @param {string} name → matcht ein Primuss-Name eine:n FK07-Prüfende:n? */
	const primussIsFK07 = (name) => {
		for (const part of (name ?? '').split('/')) {
			const toks = part.trim().split(/\s+/).filter(Boolean);
			if (toks.length < 2) continue;
			const fi = (toks[toks.length - 1].match(/[a-zäöüß]/i)?.[0] ?? '').toLowerCase();
			const ln = toks.slice(0, -1).join(' ').toLowerCase();
			if (ln && fk07Keys.has(`${ln}|${fi}`)) return true;
		}
		return false;
	};

	// „FK07"-Flag je Primuss-Prüfung anreichern; `connected` kommt direkt vom
	// Backend (berücksichtigt auch externe/MUC.DAI-Verknüpfungen).
	const primussExams = (data.primussExams ?? []).map((/** @type {any} */ pe) => ({
		...pe,
		exams: (pe.exams ?? []).map((/** @type {any} */ x) => ({
			...x,
			fk07: primussIsFK07(x.mainExamer)
		}))
	}));

	return {
		primussExams,
		catByProgram,
		zpaByAncode
	};
}
