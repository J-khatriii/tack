import {
  useColumns,
  useCreateTask,
  useDeleteTask,
  useMoveTask,
  useProject,
  useTasks,
  useUpdateTask,
} from "../features/board/queries.js";

const btn = "rounded border border-border px-2 py-0.5 text-xs hover:bg-surface-hover";

function App() {
  const { data: project } = useProject();
  const { data: columns = [] } = useColumns(project?.id);
  const { data: tasks = [] } = useTasks(project?.id);

  const createTask = useCreateTask(project?.id);
  const updateTask = useUpdateTask(project?.id);
  const moveTask = useMoveTask(project?.id);
  const deleteTask = useDeleteTask(project?.id);

  if (!project) return <p className="p-6 text-fg-muted">loading...</p>;

  return (
    <div className="mx-auto max-w-2xl p-6 text-sm text-fg-muted">
      <button
        className={btn}
        onClick={() =>
          createTask.mutate({
            projectId: project.id,
            columnId: columns[0].id,
            title: `Test task ${tasks.length + 1}`,
          })
        }
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
                    {t.displayId} {t.title}
                  </span>
                  <button
                    className={btn}
                    onClick={() =>
                      updateTask.mutate({ id: t.id, changes: { title: `${t.title}!` } })
                    }
                  >
                    rename
                  </button>
                  <button
                    className={btn}
                    onClick={() => moveTask.mutate({ id: t.id, columnId: col.id, index: 0 })}
                  >
                    to top
                  </button>
                  {columns[ci + 1] && (
                    <button
                      className={btn}
                      onClick={() =>
                        moveTask.mutate({ id: t.id, columnId: columns[ci + 1].id, index: 0 })
                      }
                    >
                      next column
                    </button>
                  )}
                  <button className={btn} onClick={() => deleteTask.mutate(t.id)}>
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