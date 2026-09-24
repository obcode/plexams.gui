// Browser-seitige Zugriffe auf die Todos, über die /api/todo-Proxys
// (Konvention: GraphQL nie direkt aus dem Browser). Jede Funktion wirft mit einer
// lesbaren Meldung, wenn das Backend ablehnt.

/**
 * @param {string} name Proxy unter /api/todo/
 * @param {Record<string, any>} [body]
 * @returns {Promise<any>}
 */
async function post(name, body = {}) {
	const res = await fetch(`/api/todo/${name}`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body)
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok || data?.error) throw new Error(data?.error || `Fehler (HTTP ${res.status})`);
	return data;
}

/** @param {{ done?: boolean, label?: string, link?: { kind: string, key: string } }} [filter] */
export const fetchTodos = (filter) => post('todos', { filter }).then((d) => d.todos ?? []);

/** @returns {Promise<string[]>} */
export const fetchLabels = () => post('labels').then((d) => d.todoLabels ?? []);

/** @param {string} kind @param {string} query */
export const fetchLinkSuggestions = (kind, query) =>
	post('linkSuggestions', { kind, query }).then((d) => d.todoLinkSuggestions ?? []);

/** @param {Record<string, any>} input */
export const createTodo = (input) => post('createTodo', { input }).then((d) => d.createTodo);

/** @param {number} id @param {Record<string, any>} input */
export const updateTodo = (id, input) =>
	post('updateTodo', { id, input }).then((d) => d.updateTodo);

/** @param {number} id @param {boolean} done */
export const setTodoDone = (id, done) =>
	post('setTodoDone', { id, done }).then((d) => d.setTodoDone);

/** @param {number} id */
export const deleteTodo = (id) => post('deleteTodo', { id }).then((d) => d.deleteTodo);

/** @param {number} todoId @param {string} body */
export const addTodoComment = (todoId, body) =>
	post('addTodoComment', { todoId, body }).then((d) => d.addTodoComment);

/** @param {number} id @param {string} body */
export const updateTodoComment = (id, body) =>
	post('updateTodoComment', { id, body }).then((d) => d.updateTodoComment);

/** @param {number} todoId @param {{ kind: string, key: string }} link */
export const addTodoLink = (todoId, link) =>
	post('addTodoLink', { todoId, link: { kind: link.kind, key: link.key } }).then(
		(d) => d.addTodoLink
	);

/** @param {number} todoId @param {{ kind: string, key: string }} link */
export const removeTodoLink = (todoId, link) =>
	post('removeTodoLink', { todoId, link: { kind: link.kind, key: link.key } }).then(
		(d) => d.removeTodoLink
	);

/** @param {string} fromSemester @returns {Promise<number>} */
export const carryOverTodos = (fromSemester) =>
	post('carryOverTodos', { fromSemester }).then((d) => d.carryOverTodos);
