import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { keys } from "../../lib/queryKeys.js";
import { ensureDefaultProject } from "../../storage/seed.js";
import { listProjects } from "../../storage/projects.js";
import { listColumns } from "../../storage/columns.js";
import {
  createTask,
  deleteTask,
  listTasks,
  moveTask,
  updateTask,
} from "../../storage/tasks.js";

// Reads

// Seeds the default project on first launch, then returns the first project.
export const useProject = () =>
  useQuery({
    queryKey: keys.projects,
    queryFn: async () => {
      await ensureDefaultProject();
      return listProjects();
    },
    select: (projects) => projects[0],
  });

export const useColumns = (projectId) =>
  useQuery({
    queryKey: keys.columns(projectId),
    queryFn: () => listColumns(projectId),
    enabled: !!projectId,
  });

export const useTasks = (projectId) =>
  useQuery({
    queryKey: keys.tasks(projectId),
    queryFn: () => listTasks(projectId),
    enabled: !!projectId,
  });

// Writes

// Every task mutation does the same thing afterwards: refresh the task list.
const useTaskMutation = (projectId, mutationFn, { alsoInvalidate = [] } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      Promise.all(
        [keys.tasks(projectId), ...alsoInvalidate].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
  });
};

// Creating a task also bumps the project's task counter, so refresh projects too.
export const useCreateTask = (projectId) =>
  useTaskMutation(projectId, createTask, { alsoInvalidate: [keys.projects] });

export const useUpdateTask = (projectId) =>
  useTaskMutation(projectId, ({ id, changes }) => updateTask(id, changes));

export const useMoveTask = (projectId) =>
  useTaskMutation(projectId, ({ id, columnId, index }) =>
    moveTask(id, { columnId, index }),
  );

export const useDeleteTask = (projectId) => useTaskMutation(projectId, deleteTask);
