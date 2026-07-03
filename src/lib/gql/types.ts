// Ergonomische Re-Exports der von graphql-codegen generierten Schema-Typen
// ($lib/__generated__/graphql, erzeugt via `npm run codegen`). Komponenten und
// die Datenschicht importieren von hier statt direkt aus dem generierten File —
// so bleibt die Abhängigkeit an einer Stelle und der Pfad kurz.
export type {
	ZpaExam,
	Constraints,
	ExamScheduleConflict,
	PlanEntry,
	Slot,
	StudentReg
} from '$lib/__generated__/graphql';
