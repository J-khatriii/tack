import { useCallback, useEffect, useState } from "react";
import { ensureDefaultProject } from "../storage/seed.js";
import { listProjects } from "../storage/projects.js";
import { listColumns } from "../storage/columns.js";
import {
  createTask,
  deleteTask,
  listTasks,
  moveTask,
  updateTask,
} from "../storage/tasks.js";

const btn = "rounded border border-border px-2 py-0.5 text-xs hover:bg-surface-hover";

function App() {
  const [state, setState] = useState(null);

  const load = useCallback(async () => {
    await ensureDefaultProject();
    const [project] = await listProjects();
    const columns = await listColumns(project.id);
    const tasks = await listTasks(project.id);
    setState({ project, columns, tasks });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = (fn) => async () => {
    try {
      await fn();
    } catch (err) {
      console.error(err);
    }
    await load();
  };

  if (!state) return <p className="p-6 text-fg-muted">loading...</p>;
  const { project, columns, tasks } = state;

  return (
    <div className="mx-auto max-w-2xl p-6 text-sm text-fg-muted">
      <button
        className={btn}
        onClick={run(() =>
          createTask({
            projectId: project.id,
            columnId: columns[0].id,
            title: `Test task ${tasks.length + 1}`,
          }),
        )}
      >
        Add task
      </button>

      {columns.map((col, ci) => (
        <div key={col.id} className="mt-4">
          <h2 className="font-semibold text-fg">{col.name}</h2>
          <ul className="mt-1 space-y-1">
            {tasks
              .filter((t) => t.columnId === col.id)
              .map((t) => (
                <li key={t.id} className="flex items-center gap-2">
                  <span className="w-48 truncate">
                    {t.displayId} {t.title} ({t.position})
                  </span>
                  <button
                    className={btn}
                    onClick={run(() => updateTask(t.id, { title: `${t.title}!` }))}
                  >
                    rename
                  </button>
                  <button
                    className={btn}
                    onClick={run(() => moveTask(t.id, { columnId: col.id, index: 0 }))}
                  >
                    to top
                  </button>
                  {columns[ci + 1] && (
                    <button
                      className={btn}
                      onClick={run(() =>
                        moveTask(t.id, { columnId: columns[ci + 1].id, index: 0 }),
                      )}
                    >
                      next column
                    </button>
                  )}
                  <button className={btn} onClick={run(() => deleteTask(t.id))}>
                    delete
                  </button>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default App;