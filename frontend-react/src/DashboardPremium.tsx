import React from "react";
import "./styles.css";

const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:18080/api/v1";

type Finding = { rule: string; points: number; reason: string };
type Analytics = { transactionsTotal:number; alertsTotal:number; openAlerts:number; averageRiskScore:number; averageAmount:number; topCountries:{country:string;count:number}[] };
type Transaction = { transactionId:string; accountId:string; amount:number; currency:string; country:string; riskScore:number; riskLevel:string; processedAt:string };
type Alert = { alertId:string; transactionId:string; accountId:string; riskScore:number; riskLevel:string; status:string; findingsJson:string; createdAt:string };
type Page<T> = { content:T[]; totalElements:number; totalPages?:number };
type Audit = { alertId:string; previousStatus:string; newStatus:string; username:string; changedAt:string };

async function get<T>(path:string) { const r=await fetch(`${API}${path}`); if(!r.ok) throw new Error(`Request failed ${r.status}`); return r.json() as Promise<T>; }
async function patch<T>(path:string,body:unknown) { const token=sessionStorage.getItem("sentinel_auth_token"); const r=await fetch(`${API}${path}`,{method:"PATCH",headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body)}); if(!r.ok) throw new Error(`Request failed ${r.status}`); return r.json() as Promise<T>; }

const parseFindings=(s:string):Finding[]=>{try{const v=JSON.parse(s);return Array.isArray(v)?v:[]}catch{return[]}};
const cls=(value:string)=>`status-badge ${value === "LOW" ? "risk-low" : value === "MEDIUM" ? "risk-medium" : value === "HIGH" ? "risk-high" : value === "OPEN" ? "status-open" : value === "UNDER_REVIEW" ? "status-review" : value === "CONFIRMED_FRAUD" ? "status-fraud" : "status-dismissed"}`;

export default function DashboardPremium() {
  const [loading,setLoading]=React.useState(true); const [error,setError]=React.useState("");
  const [analytics,setAnalytics]=React.useState<Analytics|null>(null); const [transactions,setTransactions]=React.useState<Transaction[]>([]); const [alerts,setAlerts]=React.useState<Alert[]>([]);
  const [txTotal,setTxTotal]=React.useState(0); const [alertTotal,setAlertTotal]=React.useState(0); const [txPage,setTxPage]=React.useState(0); const [alertPage,setAlertPage]=React.useState(0); const [txPages,setTxPages]=React.useState(1); const [alertPages,setAlertPages]=React.useState(1);
  const [account,setAccount]=React.useState(""); const [risk,setRisk]=React.useState(""); const [status,setStatus]=React.useState(""); const [draft,setDraft]=React.useState({account:"",risk:"",status:""});
  const [txSort,setTxSort]=React.useState("processedAt"); const [txDir,setTxDir]=React.useState("desc"); const [alertSort,setAlertSort]=React.useState("createdAt"); const [alertDir,setAlertDir]=React.useState("desc");
  const [selected,setSelected]=React.useState<Alert|null>(null); const [audit,setAudit]=React.useState<Audit[]>([]); const [updating,setUpdating]=React.useState(false);
  const [token,setToken]=React.useState<string|null>(null); const [username,setUsername]=React.useState("analyst"); const [password,setPassword]=React.useState("sentinel"); const [authError,setAuthError]=React.useState("");
  const [activeSection,setActiveSection]=React.useState("Overview");

  React.useEffect(()=>{setToken(sessionStorage.getItem("sentinel_auth_token"))},[]);

  const load=React.useCallback(async(silent=false)=>{ if(!silent)setLoading(true);setError("");try{
    const tx=new URLSearchParams({page:String(txPage),size:"8",sortBy:txSort,sortDir:txDir}); const al=new URLSearchParams({page:String(alertPage),size:"8",sortBy:alertSort,sortDir:alertDir});
    if(account)tx.set("accountId",account),al.set("accountId",account); if(risk)tx.set("riskLevel",risk),al.set("riskLevel",risk); if(status)al.set("status",status);
    const [a,t,p]=await Promise.all([get<Analytics>("/analytics/overview"),get<Page<Transaction>>(`/transactions?${tx}`),get<Page<Alert>>(`/fraud-alerts?${al}`)]);
    setAnalytics(a);setTransactions(t.content);setTxTotal(t.totalElements);setTxPages(Math.max(t.totalPages??Math.ceil(t.totalElements/8),1));setAlerts(p.content);setAlertTotal(p.totalElements);setAlertPages(Math.max(p.totalPages??Math.ceil(p.totalElements/8),1));
  }catch(e){setError(e instanceof Error?e.message:"Unknown error")}finally{if(!silent)setLoading(false)}},[account,risk,status,txPage,txSort,txDir,alertPage,alertSort,alertDir]);

  React.useEffect(()=>{void load()},[load]); React.useEffect(()=>{const id=setInterval(()=>void load(true),15000);return()=>clearInterval(id)},[load]);

  const apply=()=>{setTxPage(0);setAlertPage(0);setAccount(draft.account.trim());setRisk(draft.risk);setStatus(draft.status)};
  const reset=()=>{const v={account:"",risk:"",status:""};setDraft(v);setAccount("");setRisk("");setStatus("");setTxPage(0);setAlertPage(0)};
  const login=async()=>{setAuthError("");try{const r=await fetch(`${API}/auth/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username,password})});if(!r.ok)throw new Error("Invalid credentials");const d=await r.json() as {token:string};sessionStorage.setItem("sentinel_auth_token",d.token);setToken(d.token)}catch(e){setAuthError(e instanceof Error?e.message:"Login failed")}};
  const logout=()=>{sessionStorage.removeItem("sentinel_auth_token");setToken(null)};
  const openAlert=async(a:Alert)=>{setSelected(a);try{setAudit(await get<Audit[]>(`/fraud-alerts/${encodeURIComponent(a.alertId)}/audit`))}catch{setAudit([])}};
  const updateStatus=async(s:string)=>{if(!selected)return;setUpdating(true);try{const u=await patch<Alert>(`/fraud-alerts/${encodeURIComponent(selected.alertId)}/status`,{status:s});setSelected(u);setAlerts(v=>v.map(a=>a.alertId===u.alertId?u:a));setAudit(await get<Audit[]>(`/fraud-alerts/${encodeURIComponent(u.alertId)}/audit`))}catch(e){setError(e instanceof Error?e.message:"Update failed")}finally{setUpdating(false)}};

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">S</div><div><div className="brand-name">Sentinel</div><div className="brand-sub">Risk Intelligence</div></div></div>
      <div className="nav-label">Workspace</div><button className={`nav-item ${activeSection==="Overview"?"active":""}`} onClick={()=>setActiveSection("Overview")}><span className="nav-icon">▦</span>Overview</button><button className={`nav-item ${activeSection==="Transactions"?"active":""}`} onClick={()=>setActiveSection("Transactions")}><span className="nav-icon">⌁</span>Transactions</button><button className={`nav-item ${activeSection==="Fraud Alerts"?"active":""}`} onClick={()=>setActiveSection("Fraud Alerts")}><span className="nav-icon">△</span>Fraud Alerts</button><button className={`nav-item ${activeSection==="Investigations"?"active":""}`} onClick={()=>setActiveSection("Investigations")}><span className="nav-icon">◎</span>Investigations</button>
      <div className="nav-label">System</div><button className="nav-item"><span className="nav-icon">▥</span>Analytics</button><button className="nav-item"><span className="nav-icon">◫</span>Audit Log</button>
      <div className="sidebar-user"><div className="user-row"><div className="avatar">A</div><div><div className="user-name">Analyst</div><div className="user-role">Operations</div></div></div></div>
    </aside>

    <main className="main">
      <header className="topbar"><div className="topbar-title"><h1>{activeSection}</h1><p>Real-time fraud monitoring</p></div><div className="header-actions">
        <div className="status-pill"><span className="status-dot"/>All systems operational</div>
        {token ? <button className="secondary-button" onClick={logout}>Logout</button> : <div className="login-group"><input type="text" value={username} onChange={e=>setUsername(e.target.value)} placeholder="Username"/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password"/><button onClick={()=>void login()}>Login</button></div>}
      </div></header>

      {loading&&<div className="loading-line"/>}
      <div className="content">
        {error&&<div style={{marginBottom:12,padding:"10px 12px",borderRadius:8,background:"#fff1f2",color:"#be123c",fontSize:12}}>{error}</div>}{authError&&<div style={{marginBottom:12,color:"#be123c",fontSize:12}}>{authError}</div>}
        <div className="section-heading"><div><h2>Risk monitoring</h2><p>Live portfolio and alert activity</p></div><button className="secondary-button" onClick={()=>void load(true)}>↻ Refresh</button></div>

        <section className="kpi-grid">
          <article className="kpi-card"><div className="kpi-top"><span className="kpi-label">Transactions</span><span className="kpi-icon">↗</span></div><div className="kpi-value">{analytics?.transactionsTotal.toLocaleString()??"—"}</div><div className="kpi-meta">All processed events</div></article>
          <article className="kpi-card"><div className="kpi-top"><span className="kpi-label">Open alerts</span><span className="kpi-icon">△</span></div><div className="kpi-value">{analytics?.openAlerts.toLocaleString()??"—"}</div><div className="kpi-meta">Requires analyst review</div></article>
          <article className="kpi-card"><div className="kpi-top"><span className="kpi-label">Average risk</span><span className="kpi-icon">◎</span></div><div className="kpi-value">{analytics?analytics.averageRiskScore.toFixed(1):"—"}</div><div className="kpi-meta">Risk score / 100</div></article>
          <article className="kpi-card"><div className="kpi-top"><span className="kpi-label">Average amount</span><span className="kpi-icon">€</span></div><div className="kpi-value">{analytics?Number(analytics.averageAmount).toLocaleString(undefined,{maximumFractionDigits:0}):"—"}</div><div className="kpi-meta">Across all transactions</div></article>
        </section>

        <section className="filter-bar">
          <div className="field"><label>Account</label><input value={draft.account} onChange={e=>setDraft(v=>({...v,account:e.target.value}))} placeholder="Account ID"/></div>
          <div className="field"><label>Risk level</label><select value={draft.risk} onChange={e=>setDraft(v=>({...v,risk:e.target.value}))}><option value="">All levels</option><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select></div>
          <div className="field"><label>Alert status</label><select value={draft.status} onChange={e=>setDraft(v=>({...v,status:e.target.value}))}><option value="">All statuses</option><option>OPEN</option><option>UNDER_REVIEW</option><option>DISMISSED</option><option>CONFIRMED_FRAUD</option></select></div>
          <div className="filter-actions"><button className="secondary-button" onClick={reset}>Reset</button><button className="primary-button" onClick={apply}>Apply filters</button></div>
        </section>

        <section className="workspace-grid">
          <div>
            <article className="panel" style={{marginBottom:16}}><div className="panel-header"><div className="panel-title"><h3>Recent transactions</h3><p>{txTotal.toLocaleString()} matching records</p></div><div className="panel-tools"><select value={txSort} onChange={e=>{setTxSort(e.target.value);setTxPage(0)}}><option value="processedAt">Processed</option><option value="riskScore">Risk score</option><option value="amount">Amount</option></select><select value={txDir} onChange={e=>{setTxDir(e.target.value);setTxPage(0)}}><option value="desc">Newest</option><option value="asc">Oldest</option></select></div></div>
              <div className="table-wrap"><table className="data-table"><thead><tr><th>Transaction</th><th>Account</th><th>Country</th><th>Amount</th><th>Risk</th></tr></thead><tbody>{transactions.map(t=><tr key={t.transactionId}><td className="tx-id">{t.transactionId}</td><td className="account">{t.accountId}</td><td>{t.country}</td><td className="amount">{t.amount.toLocaleString()} {t.currency}</td><td><span className={cls(t.riskLevel)}>{t.riskLevel}</span></td></tr>)}</tbody></table></div>
              <div className="pagination"><span>Page {txPage+1} of {txPages}</span><div className="page-controls"><button disabled={txPage===0} onClick={()=>setTxPage(p=>Math.max(0,p-1))}>‹</button><button disabled={txPage+1>=txPages} onClick={()=>setTxPage(p=>Math.min(txPages-1,p+1))}>›</button></div></div>
            </article>

            <article className="panel"><div className="panel-header"><div className="panel-title"><h3>Fraud alerts</h3><p>{alertTotal.toLocaleString()} matching alerts</p></div><div className="panel-tools"><select value={alertSort} onChange={e=>{setAlertSort(e.target.value);setAlertPage(0)}}><option value="createdAt">Created</option><option value="riskScore">Risk score</option></select><select value={alertDir} onChange={e=>{setAlertDir(e.target.value);setAlertPage(0)}}><option value="desc">Newest</option><option value="asc">Oldest</option></select></div></div>
              <div className="table-wrap"><table className="data-table"><thead><tr><th>Alert</th><th>Account</th><th>Status</th><th>Risk</th><th>Created</th></tr></thead><tbody>{alerts.map(a=><tr key={a.alertId} className={`alert-row ${selected?.alertId===a.alertId?"selected":""}`} onClick={()=>void openAlert(a)}><td className="alert-id">{a.alertId}</td><td className="account">{a.accountId}</td><td><span className={cls(a.status)}>{a.status.replace("_"," ")}</span></td><td><span className={cls(a.riskLevel)}>{a.riskLevel}</span></td><td>{new Date(a.createdAt).toLocaleString()}</td></tr>)}</tbody></table></div>
              <div className="pagination"><span>Page {alertPage+1} of {alertPages}</span><div className="page-controls"><button disabled={alertPage===0} onClick={()=>setAlertPage(p=>Math.max(0,p-1))}>‹</button><button disabled={alertPage+1>=alertPages} onClick={()=>setAlertPage(p=>Math.min(alertPages-1,p+1))}>›</button></div></div>
            </article>
          </div>

          <aside className="panel inspector"><div className="panel-header"><div className="panel-title"><h3>Investigation</h3><p>{selected?selected.alertId:"No alert selected"}</p></div>{selected&&<button className="secondary-button" onClick={()=>setSelected(null)}>Close</button>}</div>
            {selected?<div className="inspector-content"><div className="inspector-hero"><div className="inspector-title"><strong>{selected.alertId}</strong><span className={cls(selected.riskLevel)}>{selected.riskLevel}</span></div><div className="inspector-meta"><div><label>Account</label><span>{selected.accountId}</span></div><div><label>Transaction</label><span>{selected.transactionId}</span></div><div><label>Risk score</label><span>{selected.riskScore}</span></div><div><label>Status</label><span>{selected.status}</span></div></div></div>
              <div className="findings"><h4>Detection findings</h4>{parseFindings(selected.findingsJson).map((f,i)=><div className="finding" key={i}><strong>{f.rule}</strong><p>{f.reason}</p></div>)}{parseFindings(selected.findingsJson).length===0&&<p>No structured findings.</p>}</div>
              <div className="inspector-actions"><button className="primary-button" disabled={!token||updating} onClick={()=>void updateStatus("UNDER_REVIEW")}>Start review</button><button className="secondary-button" disabled={!token||updating} onClick={()=>void updateStatus("DISMISSED")}>Dismiss</button><button className="danger-button" disabled={!token||updating} onClick={()=>void updateStatus("CONFIRMED_FRAUD")}>Confirm fraud</button></div>
              <div className="audit"><h4>Audit trail</h4>{audit.map((a,i)=><div className="audit-entry" key={i}><strong>{a.username}</strong>: {a.previousStatus} → {a.newStatus}<span>{new Date(a.changedAt).toLocaleString()}</span></div>)}{audit.length===0&&<p>No status changes recorded.</p>}</div>
            </div>:<div className="empty-inspector"><div><div style={{fontSize:24,marginBottom:8}}>◉</div><strong>Select an alert</strong><p style={{fontSize:12,lineHeight:1.5}}>Choose a fraud alert to inspect findings and update investigation status.</p></div></div>}
          </aside>
        </section>
      </div>
    </main>
  </div>
}
