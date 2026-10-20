import { getDb } from "./db.js";
import { byPosition } from "../lib/ordering.js";

export const listColumns = async (projectId) => {
  const db = await getDb();
  const all = await db.getAllFromIndex("columns", "by-project", projectId);
  return all.filter((c) => !c.deletedAt).sort(byPosition);
};
