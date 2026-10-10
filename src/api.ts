import type { DashboardSummary, Label, Member, Project, Task } from "./types";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail ?? `Request failed (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

const resource = <T>(path: string) => ({
  list: () => request<T[]>(path),
  create: (data: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: unknown) => request<T>(`${path}/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: number) => request<void>(`${path}/${id}`, { method: "DELETE" }),
});

export const api = {
  health: () => request<{ status: string }>("/health"),
  projects: resource<Project>("/projects"),
  members: resource<Member>("/members"),
  labels: resource<Label>("/labels"),
  tasks: resource<Task>("/tasks"),
  summary: () => request<DashboardSummary>("/dashboard/summary"),
};