import { writable, readable } from 'svelte/store';
import { request, gql } from 'graphql-request';
import { semester } from './semester';

export const fk07programs = readable(['DC', 'IC', 'IB', 'IF', 'IG', 'IN', 'IS', 'IT']);

export const teachers = writable([]);

const fetchTeacher = async () => {
	const query = gql`
		query {
			teachers(fromZPA: false) {
				fullname
				shortname
				isProf
				isLBA
				isProfHC
				isStaff
				lastSemester
				fk
				id
				email
			}
		}
	`;

	request('http://localhost:8080/query', query).then((data) => {
		teachers.set(data.teachers);
	});
};
export const invigilators = writable([]);

const fetchInvigilators = async () => {
	const query = gql`
		query {
			invigilators {
				fullname
				shortname
				isProf
				isLBA
				isProfHC
				isStaff
				lastSemester
				fk
				id
				email
			}
		}
	`;

	request('http://localhost:8080/query', query).then((data) => {
		invigilators.set(data.invigilators);
	});
};

export const zpaExams = writable([]);

const fetchZPAExams = async () => {
	const query = gql`
		query {
			zpaExamsByType {
				type
				exams {
					zpaID
					semester
					anCode
					module
					mainExamer
					mainExamerID
					examType
					examTypeFull
					duration
					isRepeaterExam
					groups
				}
			}
		}
	`;

	request('http://localhost:8080/query', query).then((data) => {
		zpaExams.set(data.zpaExamsByType);
	});
};

export function fetchZPA() {
	fetchTeacher();
	fetchZPAExams();
	fetchInvigilators();
}

semester.subscribe((_) => {
	fetchZPA();
});
