export type ProjectStatus = "planning" | "active" | "completed" | "paused";
export type TaskStatus = "todo" | "in_progress" | "done";
export type Priority = "low" | "medium" | "high";

export interface Project {
  id: number;
  name: string;
  description: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface Label {
  id: number;
  name: string;
  color: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  due_date: string | null;
  project_id: number;
  assignee_id: number | null;
  labels: Label[];
  created_at: string;
  updated_at: string;
}

export interface DashboardSummary {
  projects: number;
  members: number;
  tasks: number;
  labels: number;
  tasks_by_status: Record<string, number>;
}