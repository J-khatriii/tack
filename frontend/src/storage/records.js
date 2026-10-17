export const newRecord = (fields) => {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...fields,
  };
};
