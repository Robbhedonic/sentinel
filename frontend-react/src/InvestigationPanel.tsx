import React from "react";

export type Investigation = {
  alertId: string;
  assignedTo: string | null;
  status: string;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InvestigationComment = {
  alertId: string;
  author: string;
  comment: string;
  createdAt: string;
};

const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:18080/api/v1";

async function authorizedRequest<T>(path: string, method: "PUT" | "POST", body: unknown): Promise<T> {
  const token = sessionStorage.getItem("sentinel_auth_token");
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`Request failed ${response.status}`);
  return response.json() as Promise<T>;
}

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${API}${path}`);
  if (!response.ok) throw new Error(`Request failed ${response.status}`);
  return response.json() as Promise<T>;
}

export default function InvestigationPanel({ alertId, canEdit }: { alertId: string; canEdit: boolean }) {
  const [investigation, setInvestigation] = React.useState<Investigation | null>(null);
  const [comments, setComments] = React.useState<InvestigationComment[]>([]);
  const [assignedTo, setAssignedTo] = React.useState("");
  const [status, setStatus] = React.useState("OPEN");
  const [summary, setSummary] = React.useState("");
  const [comment, setComment] = React.useState("");
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    setError("");
    try {
      const [record, commentList] = await Promise.all([
        get<Investigation>(`/investigations/${encodeURIComponent(alertId)}`),
        get<InvestigationComment[]>(`/investigations/${encodeURIComponent(alertId)}/comments`)
      ]);
      setInvestigation(record);
      setComments(commentList);
      setAssignedTo(record.assignedTo ?? "");
      setStatus(record.status);
      setSummary(record.summary ?? "");
    } catch {
      setInvestigation(null);
      setComments([]);
      setAssignedTo("");
      setStatus("OPEN");
      setSummary("");
    }
  }, [alertId]);

  React.useEffect(() => { void load(); }, [load]);

  const save = async () => {
    setError("");
    try {
      const saved = await authorizedRequest<Investigation>(
        `/investigations/${encodeURIComponent(alertId)}`,
        "PUT",
        { assignedTo, status, summary }
      );
      setInvestigation(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save investigation");
    }
  };

  const addComment = async () => {
    if (!comment.trim()) return;
    setError("");
    try {
      await authorizedRequest<InvestigationComment>(
        `/investigations/${encodeURIComponent(alertId)}/comments`,
        "POST",
        { comment }
      );
      setComment("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add comment");
    }
  };

  return (
    <section className="investigation-panel">
      <h4>Investigation</h4>
      {error && <div className="investigation-error">{error}</div>}
      <div className="investigation-grid">
        <label>Assigned to<input value={assignedTo} disabled={!canEdit} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Analyst name" /></label>
        <label>Status<select value={status} disabled={!canEdit} onChange={(e) => setStatus(e.target.value)}><option>OPEN</option><option>IN_REVIEW</option><option>CLOSED</option></select></label>
      </div>
      <label>Summary<textarea value={summary} disabled={!canEdit} onChange={(e) => setSummary(e.target.value)} placeholder="Document findings and next steps" /></label>
      <button className="primary-button" disabled={!canEdit} onClick={() => void save()}>Save investigation</button>

      <div className="comments-section">
        <h4>Comments</h4>
        {comments.map((item, index) => (
          <div className="comment-entry" key={`${item.createdAt}-${index}`}>
            <strong>{item.author}</strong>
            <p>{item.comment}</p>
            <span>{new Date(item.createdAt).toLocaleString()}</span>
          </div>
        ))}
        {comments.length === 0 && <p className="muted-text">No comments yet.</p>}
        <textarea value={comment} disabled={!canEdit} onChange={(e) => setComment(e.target.value)} placeholder="Add investigation comment" />
        <button className="secondary-button" disabled={!canEdit || !comment.trim()} onClick={() => void addComment()}>Add comment</button>
      </div>
    </section>
  );
}
