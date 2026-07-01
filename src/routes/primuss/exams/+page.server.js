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
	// („A B./C D.") werden gesplittet. Umlaute werden transkribiert, weil die
	// Personenliste ae/oe/ue/ss schreibt, Primuss aber ä/ö/ü/ß („Göller" vs.
	// „Goeller"). Zusätzlich ein Fallback für einteilige Primuss-Namen ohne
	// Initiale („Brockhaus"): matcht, wenn der Nachname eindeutig zu FK07 gehört
	// (kein/e Namensvetter:in in einer anderen Fakultät).
	/** @param {string} s */
	const norm = (s) =>
		(s ?? '')
			.toLowerCase()
			.replace(/ö/g, 'oe')
			.replace(/ü/g, 'ue')
			.replace(/ä/g, 'ae')
			.replace(/ß/g, 'ss');

	/** @type {Set<string>} „nachname|i" aller FK07-Prüfenden */
	const fk07Keys = new Set();
	/** @type {Map<string, Set<string>>} Nachname → Menge der Fakultäten */
	const surnameFks = new Map();
	for (const t of data.teachers ?? []) {
		const raw = t.shortname ?? '';
		const ci = raw.indexOf(',');
		if (ci < 0) continue;
		const ln = norm(raw.slice(0, ci).trim());
		const fi = norm(raw.slice(ci + 1).trim())[0] ?? '';
		if (!ln) continue;
		if (!surnameFks.has(ln)) surnameFks.set(ln, new Set());
		surnameFks.get(ln)?.add(t.fk);
		if (t.fk === 'FK07' && fi) fk07Keys.add(`${ln}|${fi}`);
	}
	/** @type {Set<string>} Nachnamen, die eindeutig (nur) zu FK07 gehören */
	const fk07Surnames = new Set();
	for (const [ln, fks] of surnameFks) {
		if (fks.size === 1 && fks.has('FK07')) fk07Surnames.add(ln);
	}

	/** @param {string} name → matcht ein Primuss-Name eine:n FK07-Prüfende:n? */
	const primussIsFK07 = (name) => {
		for (const part of (name ?? '').split('/')) {
			const toks = part.trim().split(/\s+/).filter(Boolean);
			if (!toks.length) continue;
			const last = toks[toks.length - 1];
			const isInitial = /^[a-zäöüß]\.?$/i.test(last);
			const surnameToks = isInitial && toks.length >= 2 ? toks.slice(0, -1) : toks;
			const ln = norm(surnameToks.join(' '));
			if (!ln) continue;
			// präzise: Nachname + Initiale
			if (isInitial && toks.length >= 2 && fk07Keys.has(`${ln}|${norm(last)[0]}`)) return true;
			// Fallback: eindeutiger FK07-Nachname
			if (fk07Surnames.has(ln)) return true;
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
