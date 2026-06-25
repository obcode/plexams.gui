// Gemeinsames Selektions-Set für ConnectedExam — von der Load-Query und allen
// Mutations-Proxies genutzt, damit ein per Mutation zurückgegebener Eintrag
// exakt dieselben Felder trägt und 1:1 im State ersetzt werden kann.
export const CONNECTED_EXAM_FIELDS = `
	zpaExam {
		ancode
		module
		mainExamer
		examType
		groups
	}
	primussExams {
		ancode
		module
		mainExamer
		program
		examType
	}
	otherPrimussExams {
		ancode
		module
		mainExamer
		program
	}
	warnings {
		level
		message
		program
		ancode
		module
		examer
	}
`;
