import { getDb } from "./db.js";

export const listProjects = async () => {
  const db = await getDb();
  const all = await db.getAll("projects");
  return all
    .filter((p) => !p.deletedAt)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
};
