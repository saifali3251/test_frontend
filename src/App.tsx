import { FormEvent, ReactNode, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  CircleDot,
  FolderKanban,
  LayoutDashboard,
  Menu,
  Pencil,
  Plus,
  Tags,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { api } from "./api";
import type { Label, Member, Priority, Project, ProjectStatus, Task, TaskStatus } from "./types";

type View = "overview" | "projects" | "tasks" | "members" | "labels";
type Dialog = { kind: Exclude<View, "overview">; item?: Project | Task | Member | Label } | null;

const navItems: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "tasks", label: "Tasks", icon: CheckCircle2 },
  { id: "members", label: "People", icon: Users },
  { id: "labels", label: "Labels", icon: Tags },
];

const titleCase = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

function App() {
  const [view, setView] = useState<View>("overview");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const summary = useQuery({ queryKey: ["summary"], queryFn: api.summary });
  const projects = useQuery({ queryKey: ["projects"], queryFn: api.projects.list });
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: api.tasks.list });
  const members = useQuery({ queryKey: ["members"], queryFn: api.members.list });
  const labels = useQuery({ queryKey: ["labels"], queryFn: api.labels.list });
  const loading = [summary, projects, tasks, members, labels].some((query) => query.isLoading);
  const error = [summary, projects, tasks, members, labels].find((query) => query.error)?.error;

  const openCreate = () => view !== "overview" && setDialog({ kind: view });

  return (
    <div className="app-shell">
      <aside className={menuOpen ? "sidebar open" : "sidebar"}>
        <div className="brand"><span className="brand-mark">F</span><span>Fieldwork</span></div>
        <button className="close-menu icon-button" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={20} /></button>
        <nav>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} className={view === id ? "nav-item active" : "nav-item"} onClick={() => { setView(id); setMenuOpen(false); }}>
              <Icon size={18} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-note"><CircleDot size={16} /><span>All systems operational</span></div>
      </aside>

      <main>
        <header className="topbar">
          <button className="menu-button icon-button" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={21} /></button>
          <div><p className="eyebrow">Project workspace</p><h1>{navItems.find((item) => item.id === view)?.label}</h1></div>
          {view !== "overview" && <button className="primary-button" onClick={openCreate}><Plus size={17} /> New {view === "members" ? "person" : view.slice(0, -1)}</button>}
        </header>

        <div className="content">
          {loading && <div className="state">Loading workspace...</div>}
          {error && <div className="state error">{error.message}</div>}
          {!loading && !error && view === "overview" && <Overview summary={summary.data!} tasks={tasks.data!} projects={projects.data!} />}
          {!loading && !error && view === "projects" && <Projects items={projects.data!} onEdit={(item) => setDialog({ kind: "projects", item })} />}
          {!loading && !error && view === "tasks" && <Tasks items={tasks.data!} projects={projects.data!} members={members.data!} onEdit={(item) => setDialog({ kind: "tasks", item })} />}
          {!loading && !error && view === "members" && <Members items={members.data!} onEdit={(item) => setDialog({ kind: "members", item })} />}
          {!loading && !error && view === "labels" && <Labels items={labels.data!} onEdit={(item) => setDialog({ kind: "labels", item })} />}
        </div>
      </main>

      {dialog && <Editor dialog={dialog} projects={projects.data ?? []} members={members.data ?? []} labels={labels.data ?? []} onClose={() => setDialog(null)} />}
    </div>
  );
}

function Overview({ summary, tasks, projects }: { summary: NonNullable<ReturnType<typeof useQuery>['data']> & { projects: number; members: number; tasks: number; labels: number; tasks_by_status: Record<string, number> }; tasks: Task[]; projects: Project[] }) {
  const done = summary.tasks_by_status.done ?? 0;
  const completion = summary.tasks ? Math.round((done / summary.tasks) * 100) : 0;
  return (
    <div className="overview-grid">
      <section className="summary-band">
        <div><p className="eyebrow">At a glance</p><h2>Work moving forward.</h2><p>{completion}% of tracked tasks are complete.</p></div>
        {[{ label: "Projects", value: summary.projects }, { label: "Open tasks", value: summary.tasks - done }, { label: "People", value: summary.members }].map((metric) => <div className="metric" key={metric.label}><strong>{metric.value}</strong><span>{metric.label}</span></div>)}
      </section>
      <section className="panel activity"><div className="section-heading"><div><p className="eyebrow">Recent</p><h2>Latest tasks</h2></div></div>
        {tasks.length === 0 ? <Empty text="No tasks yet. Create a project, then add your first task." /> : tasks.slice(0, 5).map((task) => <div className="activity-row" key={task.id}><StatusDot status={task.status} /><div><strong>{task.title}</strong><span>{projects.find((project) => project.id === task.project_id)?.name}</span></div><Badge value={task.priority} /></div>)}
      </section>
      <section className="panel progress"><div className="section-heading"><div><p className="eyebrow">Distribution</p><h2>Task status</h2></div></div>
        {(["todo", "in_progress", "done"] as TaskStatus[]).map((status) => { const count = summary.tasks_by_status[status] ?? 0; const width = summary.tasks ? (count / summary.tasks) * 100 : 0; return <div className="progress-row" key={status}><div><span>{titleCase(status)}</span><strong>{count}</strong></div><div className="progress-track"><span style={{ width: `${width}%` }} /></div></div>; })}
      </section>
    </div>
  );
}

function Projects({ items, onEdit }: { items: Project[]; onEdit: (item: Project) => void }) {
  const remove = useRemove("projects");
  if (!items.length) return <Empty text="No projects yet. Create one to organize your work." />;
  return <div className="item-grid">{items.map((item) => <article className="project-card" key={item.id}><div className="card-top"><Badge value={item.status} /><Actions onEdit={() => onEdit(item)} onDelete={() => remove.mutate(item.id)} /></div><h2>{item.name}</h2><p>{item.description || "No description provided."}</p><div className="card-footer"><span>Updated</span><time>{new Date(item.updated_at).toLocaleDateString()}</time></div></article>)}</div>;
}

function Tasks({ items, projects, members, onEdit }: { items: Task[]; projects: Project[]; members: Member[]; onEdit: (item: Task) => void }) {
  const remove = useRemove("tasks");
  if (!items.length) return <Empty text="No tasks yet. Add one when a project is ready." />;
  return <div className="table-wrap"><table><thead><tr><th>Task</th><th>Project</th><th>Assignee</th><th>Priority</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.title}</strong><span className="cell-note">{item.due_date ? `Due ${new Date(`${item.due_date}T00:00:00`).toLocaleDateString()}` : "No due date"}</span></td><td>{projects.find((project) => project.id === item.project_id)?.name ?? "Unknown"}</td><td>{members.find((member) => member.id === item.assignee_id)?.name ?? "Unassigned"}</td><td><Badge value={item.priority} /></td><td><Badge value={item.status} /></td><td><Actions onEdit={() => onEdit(item)} onDelete={() => remove.mutate(item.id)} /></td></tr>)}</tbody></table></div>;
}

function Members({ items, onEdit }: { items: Member[]; onEdit: (item: Member) => void }) {
  const remove = useRemove("members");
  if (!items.length) return <Empty text="No people yet. Add someone to assign work." />;
  return <div className="people-list">{items.map((item) => <article className="person-row" key={item.id}><span className="avatar">{item.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><div><h2>{item.name}</h2><p>{item.email}</p></div><span className="role">{item.role}</span><Actions onEdit={() => onEdit(item)} onDelete={() => remove.mutate(item.id)} /></article>)}</div>;
}

function Labels({ items, onEdit }: { items: Label[]; onEdit: (item: Label) => void }) {
  const remove = useRemove("labels");
  if (!items.length) return <Empty text="No labels yet. Add labels to group related tasks." />;
  return <div className="label-list">{items.map((item) => <article className="label-row" key={item.id}><span className="swatch" style={{ background: item.color }} /><strong>{item.name}</strong><code>{item.color}</code><Actions onEdit={() => onEdit(item)} onDelete={() => remove.mutate(item.id)} /></article>)}</div>;
}

function Editor({ dialog, projects, members, labels, onClose }: { dialog: NonNullable<Dialog>; projects: Project[]; members: Member[]; labels: Label[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const item = dialog.item;
  const mutation = useMutation({
    mutationFn: (payload: unknown): Promise<unknown> => item ? api[dialog.kind].update(item.id, payload) : api[dialog.kind].create(payload),
    onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: [dialog.kind] }), queryClient.invalidateQueries({ queryKey: ["summary"] })]); onClose(); },
  });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value: Record<string, unknown> = Object.fromEntries(form.entries());
    if (dialog.kind === "tasks") {
      value.project_id = Number(value.project_id);
      value.assignee_id = value.assignee_id ? Number(value.assignee_id) : null;
      const payload = { ...value, assignee_id: value.assignee_id || null, due_date: value.due_date || null, label_ids: form.getAll("label_ids").map(Number) };
      mutation.mutate(payload);
    } else mutation.mutate(value);
  };
  return <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="dialog" role="dialog" aria-modal="true"><div className="dialog-header"><div><p className="eyebrow">{item ? "Edit" : "Create"}</p><h2>{dialog.kind === "members" ? "Person" : titleCase(dialog.kind.slice(0, -1))}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={20} /></button></div><form onSubmit={submit}>{dialog.kind === "projects" && <ProjectFields item={item as Project | undefined} />}{dialog.kind === "members" && <MemberFields item={item as Member | undefined} />}{dialog.kind === "labels" && <LabelFields item={item as Label | undefined} />}{dialog.kind === "tasks" && <TaskFields item={item as Task | undefined} projects={projects} members={members} labels={labels} />}{mutation.error && <p className="form-error">{mutation.error.message}</p>}<div className="dialog-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : "Save"}</button></div></form></section></div>;
}

function ProjectFields({ item }: { item?: Project }) { return <><Field label="Name"><input name="name" required maxLength={120} defaultValue={item?.name} /></Field><Field label="Description"><textarea name="description" rows={4} defaultValue={item?.description} /></Field><Field label="Status"><select name="status" defaultValue={item?.status ?? "planning"}>{["planning", "active", "completed", "paused"].map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}</select></Field></>; }
function MemberFields({ item }: { item?: Member }) { return <><Field label="Name"><input name="name" required maxLength={120} defaultValue={item?.name} /></Field><Field label="Email"><input name="email" type="email" required defaultValue={item?.email} /></Field><Field label="Role"><input name="role" required maxLength={80} defaultValue={item?.role ?? "Contributor"} /></Field></>; }
function LabelFields({ item }: { item?: Label }) { return <><Field label="Name"><input name="name" required maxLength={60} defaultValue={item?.name} /></Field><Field label="Color"><input name="color" type="color" defaultValue={item?.color ?? "#287271"} /></Field></>; }
function TaskFields({ item, projects, members, labels }: { item?: Task; projects: Project[]; members: Member[]; labels: Label[] }) { return <><Field label="Title"><input name="title" required maxLength={180} defaultValue={item?.title} /></Field><Field label="Description"><textarea name="description" rows={3} defaultValue={item?.description} /></Field><div className="field-grid"><Field label="Project"><select name="project_id" required defaultValue={item?.project_id}>{!item && <option value="">Select project</option>}{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></Field><Field label="Assignee"><select name="assignee_id" defaultValue={item?.assignee_id ?? ""}><option value="">Unassigned</option>{members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></Field><Field label="Status"><select name="status" defaultValue={item?.status ?? "todo"}>{(["todo", "in_progress", "done"] as TaskStatus[]).map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}</select></Field><Field label="Priority"><select name="priority" defaultValue={item?.priority ?? "medium"}>{(["low", "medium", "high"] as Priority[]).map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}</select></Field><Field label="Due date"><input name="due_date" type="date" defaultValue={item?.due_date ?? ""} /></Field></div>{labels.length > 0 && <Field label="Labels"><div className="check-list">{labels.map((label) => <label key={label.id}><input type="checkbox" name="label_ids" value={label.id} defaultChecked={item?.labels.some((current) => current.id === label.id)} /><span className="swatch" style={{ background: label.color }} />{label.name}</label>)}</div></Field>}</>; }

function useRemove(kind: Exclude<View, "overview">) { const queryClient = useQueryClient(); return useMutation({ mutationFn: (id: number) => api[kind].remove(id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: [kind] }); queryClient.invalidateQueries({ queryKey: ["summary"] }); } }); }
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="field"><span>{label}</span>{children}</label>; }
function Badge({ value }: { value: string }) { return <span className={`badge ${value}`}>{titleCase(value)}</span>; }
function StatusDot({ status }: { status: TaskStatus }) { return <span className={`status-dot ${status}`} aria-label={titleCase(status)} />; }
function Actions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) { return <div className="actions"><button className="icon-button" onClick={onEdit} title="Edit" aria-label="Edit"><Pencil size={16} /></button><button className="icon-button danger" onClick={() => confirm("Delete this item?") && onDelete()} title="Delete" aria-label="Delete"><Trash2 size={16} /></button></div>; }
function Empty({ text }: { text: string }) { return <div className="empty"><CircleDot size={30} /><h2>Nothing here yet</h2><p>{text}</p></div>; }

export default App;