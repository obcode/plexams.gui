import { env } from '$env/dynamic/public';
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

	request(PUBLIC_PLEXAMS_SERVER, query).then((data) => {
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

	request(env.PUBLIC_PLEXAMS_SERVER, query).then((data) => {
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

	request(env.PUBLIC_PLEXAMS_SERVER, query).then((data) => {
		zpaExams.set(data.zpaExamsByType);
	});
};

export const zpaExamsToPlan = writable([]);

export const fetchZPAExamsToPlan = async () => {
	const query = gql`
		query {
			zpaExamsToPlan {
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
	`;

	request(env.PUBLIC_PLEXAMS_SERVER, query).then((data) => {
		zpaExamsToPlan.set(data.zpaExamsToPlan);
	});
};

export const zpaExamsNotToPlan = writable([]);

export const fetchZPAExamsNotToPlan = async () => {
	const query = gql`
		query {
			zpaExamsNotToPlan {
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
	`;

	request(env.PUBLIC_PLEXAMS_SERVER, query).then((data) => {
		zpaExamsNotToPlan.set(data.zpaExamsNotToPlan);
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

export async function addZpaExamToPlan(anCode) {
	const mutation = gql`
		mutation ($anCode: Int!) {
			addZpaExamToPlan(anCode: $anCode)
		}
	`;

	const variables = {
		anCode
	};

	request(env.PUBLIC_PLEXAMS_SERVER, mutation, variables).then((data) => {
		fetchZPAExamsNotToPlan();
		fetchZPAExamsToPlan();
	});
}

export async function rmZpaExamToPlan(anCode) {
	const mutation = gql`
		mutation ($anCode: Int!) {
			rmZpaExamFromPlan(anCode: $anCode)
		}
	`;

	const variables = {
		anCode
	};

	console.log(variables);

	request(env.PUBLIC_PLEXAMS_SERVER, mutation, variables).then((data) => {
		fetchZPAExamsToPlan();
		fetchZPAExamsNotToPlan();
	});
}
