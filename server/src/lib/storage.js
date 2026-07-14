export const storage = {
  users: [],
  quizzes: [],
  attempts: []
};

export function resetStorage() {
  storage.users = [];
  storage.quizzes = [];
  storage.attempts = [];
}

export function nextId(items) {
  const ids = items
    .map((item) => Number(item.id ?? item._id ?? 0))
    .filter((value) => Number.isFinite(value));
  return String(ids.length ? Math.max(...ids) + 1 : 1);
}
