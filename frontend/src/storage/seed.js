import { generateNKeysBetween } from "fractional-indexing";
import { getDb } from "./db.js";
import { newRecord } from "./records.js";

const DEFAULT_COLUMNS = [
  { name: "To do", colorKey: "todo" },
  { name: "Doing", colorKey: "doing" },
  { name: "Done", colorKey: "done" },
];

const run = async () => {
  const db = await getDb();
  // One transaction: either the project and all columns exist, or nothing does.
  const tx = db.transaction(["projects", "columns"], "readwrite");

  const projects = await tx.objectStore("projects").getAll();
  if (projects.some((p) => !p.deletedAt)) {
    await tx.done;
    return; // already set up
  }

  const project = newRecord({ name: "My tasks", key: "TASK", taskCounter: 0 });
  await tx.objectStore("projects").add(project);

  const positions = generateNKeysBetween(null, null, DEFAULT_COLUMNS.length);
  for (const [i, col] of DEFAULT_COLUMNS.entries()) {
    await tx
      .objectStore("columns")
      .add(
        newRecord({ projectId: project.id, position: positions[i], ...col }),
      );
  }

  await tx.done;
};

// Memoized, so React StrictMode's double effect in dev can't seed twice.
let seeding = null;
export const ensureDefaultProject = () => {
  seeding ??= run().catch((err) => {
    seeding = null; // allow a retry
    throw err;
  });
  return seeding;
};
