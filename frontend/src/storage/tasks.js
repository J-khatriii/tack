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
