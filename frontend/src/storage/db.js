import { openDB } from "idb";

const DB_NAME = "tack";
const DB_VERSION = 1;

let dbPromise = null;

// Lazy: the database opens on first use, so a failure can be handled by the caller.
export const getDb = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // One block per version. Never edit an old block, add a new one.
        if (oldVersion < 1) {
          db.createObjectStore("projects", { keyPath: "id" });

          const columns = db.createObjectStore("columns", { keyPath: "id" });
          columns.createIndex("by-project", "projectId");

          const tasks = db.createObjectStore("tasks", { keyPath: "id" });
          tasks.createIndex("by-project", "projectId");
          tasks.createIndex("by-column", "columnId");
        }
      },
    }).catch((err) => {
      dbPromise = null; 
      throw err;
    });
  }
  return dbPromise;
};
