import { generateKeyBetween } from "fractional-indexing";
import { getDb } from "./db.js";
import { newRecord } from "./records.js";
import { byPosition } from "../lib/ordering.js";

const PRIORITIES = ["low", "medium", "high"];

const normalizeTags = (tags) => [
  ...new Set(tags.map((t) => t.toLowerCase().trim()).filter(Boolean)),
];

export const listTasks = async (projectId) => {
  const db = await getDb();
  const all = await db.getAllFromIndex("tasks", "by-project", projectId);
  return all.filter((t) => !t.deletedAt).sort(byPosition);
};

export const createTask = async ({
  projectId,
  columnId,
  title,
  description = "",
  priority = "medium",
  dueAt = null,
  tags = [],
}) => {
  const cleanTitle = title?.trim();
  if (!cleanTitle) throw new Error("Task title is required");
  if (!PRIORITIES.includes(priority)) throw new Error(`Invalid priority: ${priority}`);

  const db = await getDb();
  // One transaction: the task and the project counter are saved together or not at all.
  const tx = db.transaction(["tasks", "projects"], "readwrite");

  const project = await tx.objectStore("projects").get(projectId);
  if (!project || project.deletedAt) throw new Error(`Project ${projectId} not found`);

  // New tasks go to the bottom of their column.
  const inColumn = (await tx.objectStore("tasks").index("by-column").getAll(columnId))
    .filter((t) => !t.deletedAt)
    .sort(byPosition);
  const last = inColumn.at(-1)?.position ?? null;

  const counter = project.taskCounter + 1;

  const task = newRecord({
    projectId,
    columnId,
    position: generateKeyBetween(last, null),
    displayId: `${project.key}-${counter}`,
    title: cleanTitle,
    description,
    priority,
    dueAt,
    tags: normalizeTags(tags),
  });

  await tx.objectStore("projects").put({
    ...project,
    taskCounter: counter,
    updatedAt: task.createdAt,
  });
  await tx.objectStore("tasks").add(task);
  await tx.done;
  return task;
};

const EDITABLE = ["title", "description", "priority", "dueAt", "tags"];

// Edit the content of a task. Column and position are NOT editable here, use moveTask.
export const updateTask = async (id, changes) => {
  const patch = Object.fromEntries(
    EDITABLE.filter((k) => k in changes).map((k) => [k, changes[k]]),
  );

  if ("title" in patch) {
    patch.title = patch.title?.trim();
    if (!patch.title) throw new Error("Task title is required");
  }
  if ("priority" in patch && !PRIORITIES.includes(patch.priority)) {
    throw new Error(`Invalid priority: ${patch.priority}`);
  }
  if ("tags" in patch) patch.tags = normalizeTags(patch.tags);

  const db = await getDb();
  // Read and write in one transaction, so two quick saves can't overwrite each other.
  const tx = db.transaction("tasks", "readwrite");
  const existing = await tx.store.get(id);
  if (!existing || existing.deletedAt) throw new Error(`Task ${id} not found`);

  const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  await tx.store.put(updated);
  await tx.done;
  return updated;
};

// Move a task to `columnId`, at `index` among that column's other tasks.
// index 0 = top. An index larger than the column size means bottom.
export const moveTask = async (id, { columnId, index }) => {
  const db = await getDb();
  const tx = db.transaction(["tasks", "columns"], "readwrite");

  const task = await tx.objectStore("tasks").get(id);
  if (!task || task.deletedAt) throw new Error(`Task ${id} not found`);

  const column = await tx.objectStore("columns").get(columnId);
  if (!column || column.deletedAt || column.projectId !== task.projectId) {
    throw new Error(`Column ${columnId} not found in this project`);
  }

  // The column's tasks without the moving one, so the same code works for
  // moving up, moving down, and moving to another column.
  const siblings = (await tx.objectStore("tasks").index("by-column").getAll(columnId))
    .filter((t) => !t.deletedAt && t.id !== id)
    .sort(byPosition);

  const i = Math.min(Math.max(index, 0), siblings.length);
  const position = generateKeyBetween(
    siblings[i - 1]?.position ?? null,
    siblings[i]?.position ?? null,
  );

  const moved = { ...task, columnId, position, updatedAt: new Date().toISOString() };
  await tx.objectStore("tasks").put(moved);
  await tx.done;
  return moved;
};

// Soft delete: the record stays in the database, but every read hides it.
export const deleteTask = async (id) => {
  const db = await getDb();
  const tx = db.transaction("tasks", "readwrite");
  const existing = await tx.store.get(id);
  if (existing && !existing.deletedAt) {
    const now = new Date().toISOString();
    await tx.store.put({ ...existing, deletedAt: now, updatedAt: now });
  }
  await tx.done;
};
