"use server";

/**
 * Thin board-only server actions for the client ProjectsBoard.
 * Kept separate from project-actions so the client table does not pull the
 * whole project detail / Xero module graph.
 */

export {
  bulkArchiveProjectsAction,
  bulkMoveProjectsAction,
  createProjectQuickAction,
  deleteProjectsAction,
  duplicateProjectsAction,
} from "./project-actions";
