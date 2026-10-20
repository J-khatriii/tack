import { useCallback, useEffect, useState } from "react";
import { ensureDefaultProject } from "../storage/seed.js";
import { listProjects } from "../storage/projects.js";
import { listColumns } from "../storage/columns.js";
import { createTask, listTasks } from "../storage/tasks.js";

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

  const addTask = async () => {
    await createTask({
      projectId: state.project.id,
      columnId: state.columns[0].id,
      title: `Test task ${state.tasks.length + 1}`,
    });
    await load();
  };

  if (!state) return <p className="p-6 text-fg-muted">loading...</p>;

  return (
    <div className="mx-auto max-w-md p-6">
      <button
        onClick={addTask}
        className="rounded-md bg-accent px-3 py-1.5 text-sm text-white"
      >
        Add test task
      </button>
      <ul className="mt-4 space-y-1 text-sm text-fg-muted">
        {state.tasks.map((t) => (
          <li key={t.id}>
            {t.displayId} · {t.title} · position {t.position}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
