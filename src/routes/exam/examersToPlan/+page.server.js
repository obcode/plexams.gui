import { env } from '$env/dynamic/private';
import { request, gql } from 'graphql-request';

export async function load({ params }) {
	const query = gql`
		query {
			zpaExamsToPlanWithConstraints {
				zpaExam {
					ancode
					module
					groups
					mainExamer
					mainExamerID
					isRepeaterExam
				}
				constraints {
					notPlannedByMe
				}
			}
			teachers(fromZPA: false) {
				fullname
				shortname
				isProf
				isLBA
				isProfHC
				isStaff
				fk
				id
				email
			}
		}
	`;

	const data = await request(env.PLEXAMS_SERVER, query);

	// Filtere Prüfungen, die von mir zu planen sind (keine constraints ODER notPlannedByMe === false)
	const examsToPlan = data.zpaExamsToPlanWithConstraints.filter(
		(exam) => !exam.constraints || exam.constraints.notPlannedByMe === false
	);

	// Erstelle eine Map von Teacher IDs zu Teacher Objekten
	const teacherMap = new Map();
	data.teachers.forEach((teacher) => {
		teacherMap.set(teacher.id, teacher);
	});

	// Gruppiere Prüfungen nach Prüfenden
	const examerMap = new Map();

	examsToPlan.forEach((exam) => {
		const examerId = exam.zpaExam.mainExamerID;
		const teacher = teacherMap.get(examerId);

		if (teacher) {
			if (!examerMap.has(examerId)) {
				examerMap.set(examerId, {
					...teacher,
					exams: []
				});
			}
			examerMap.get(examerId).exams.push({
				ancode: exam.zpaExam.ancode,
				module: exam.zpaExam.module,
				groups: exam.zpaExam.groups,
				isRepeaterExam: exam.zpaExam.isRepeaterExam
			});
		}
	});

	// Konvertiere Map zu Array und sortiere nach Namen
	const examers = Array.from(examerMap.values()).sort((a, b) =>
		a.shortname.localeCompare(b.shortname)
	);

	return {
		examers
	};
}
