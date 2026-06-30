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
				}
			}
			studyPrograms {
				shortname
				category
			}
			zpaExams {
				primussAncodes {
					program
					ancode
				}
			}
			zpaExamsToPlanWithConstraints {
				zpaExam {
					mainExamer
				}
				constraints {
					notPlannedByMe
				}
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

	// Mit einer ZPA-Prüfung verbundene Primuss-Anmeldungen: Schlüssel „program/ancode".
	/** @type {Set<string>} */
	const connected = new Set();
	for (const z of data.zpaExams ?? [])
		for (const p of z.primussAncodes ?? []) connected.add(`${p.program}/${p.ancode}`);

	// „zu planende Prüfende": Prüfende der zu planenden ZPA-Prüfungen (ohne
	// notPlannedByMe). Die Namensformate unterscheiden sich (ZPA „Nachname,
	// Vorname" vs. Primuss „Nachname I."), daher Abgleich über Nachname + erste
	// Initiale; Primuss-Mehrfachnamen („A B./C D.") werden gesplittet.
	/** @param {string} name → „nachname|i" aus „Nachname, Vorname" */
	const zpaKey = (name) => {
		const i = (name ?? '').indexOf(',');
		if (i < 0) return '';
		const ln = name.slice(0, i).trim().toLowerCase();
		const fi = (name.slice(i + 1).trim()[0] ?? '').toLowerCase();
		return ln ? `${ln}|${fi}` : '';
	};
	/** @type {Set<string>} */
	const toPlanKeys = new Set();
	for (const e of data.zpaExamsToPlanWithConstraints ?? []) {
		if (!e.constraints || e.constraints.notPlannedByMe === false) {
			const k = zpaKey(e.zpaExam?.mainExamer);
			if (k) toPlanKeys.add(k);
		}
	}
	/** @param {string} name → matcht ein Primuss-Name eine:n zu planende:n Prüfende:n? */
	const primussToPlan = (name) => {
		for (const part of (name ?? '').split('/')) {
			const toks = part.trim().split(/\s+/).filter(Boolean);
			if (toks.length < 2) continue;
			const fi = (toks[toks.length - 1].match(/[a-zäöüß]/i)?.[0] ?? '').toLowerCase();
			const ln = toks.slice(0, -1).join(' ').toLowerCase();
			if (ln && toPlanKeys.has(`${ln}|${fi}`)) return true;
		}
		return false;
	};

	// Flags je Primuss-Prüfung anreichern.
	const primussExams = (data.primussExams ?? []).map((/** @type {any} */ pe) => ({
		...pe,
		exams: (pe.exams ?? []).map((/** @type {any} */ x) => ({
			...x,
			connected: connected.has(`${x.program}/${x.ancode}`),
			toPlanExamer: primussToPlan(x.mainExamer)
		}))
	}));

	return {
		primussExams,
		catByProgram
	};
}
