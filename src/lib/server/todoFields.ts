// Feldauswahl für Todos — geteilt von den SSR-Loads und den /api/todo-Proxys,
// damit Liste, Detailseite und Mutationsantworten dieselbe Form haben.

export const TODO_FIELDS = `
	id
	title
	description
	priority
	dueDate
	labels
	recurring
	done
	doneAt
	doneBy
	doneByName
	createdAt
	createdBy
	createdByName
	updatedAt
	carriedFromSemester
	commentCount
	links {
		kind
		key
		label
		href
	}
`;

export const TODO_COMMENT_FIELDS = `
	id
	todoId
	body
	author
	authorName
	createdAt
	editedAt
`;
