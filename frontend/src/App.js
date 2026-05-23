
import { useState, useEffect } from "react";
const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ─── Fake DB ────────────────────────────────────────────────────────────────
const INITIAL_REPORTS = [
  {
    id: "R-1001",
    title: "Suspicious vehicle parked near school",
    category: "Suspicious Activity",
    description: "A dark van has been parked outside Springfield Elementary for 3 days with no movement.",
    location: "12th Ave & Oak St, Springfield",
    lat: 28.61,
    lng: 77.21,
    radius: 1.5,
    media: "image",
    status: "verified",
    submittedBy: "citizen1",
    submittedAt: "2026-05-21T09:30:00",
    verifiedAt: "2026-05-21T11:00:00",
    alertIssued: true,
    updates: [
      { time: "2026-05-21T09:30:00", text: "Report submitted by citizen." },
      { time: "2026-05-21T11:00:00", text: "Verified by authorities. Alert issued to 1.5km radius." },
      { time: "2026-05-22T14:00:00", text: "Vehicle identified. Investigation ongoing." },
    ],
  },
  {
    id: "R-1002",
    title: "Vandalism at City Park",
    category: "Vandalism",
    description: "Graffiti and broken benches near the fountain area.",
    location: "City Central Park, Sector 4",
    lat: 28.63,
    lng: 77.22,
    radius: 0.5,
    media: "video",
    status: "investigating",
    submittedBy: "citizen1",
    submittedAt: "2026-05-22T16:45:00",
    verifiedAt: "2026-05-22T18:00:00",
    alertIssued: true,
    updates: [
      { time: "2026-05-22T16:45:00", text: "Report submitted by citizen." },
      { time: "2026-05-22T18:00:00", text: "Verified. Local patrol dispatched." },
    ],
  },
  {
    id: "R-1003",
    title: "Street fight outside metro station",
    category: "Violence",
    description: "Group of 5-6 individuals fighting near Exit 2 of the metro.",
    location: "Central Metro, Exit 2",
    lat: 28.59,
    lng: 77.20,
    radius: 1.0,
    media: "video",
    status: "pending",
    submittedBy: "citizen2",
    submittedAt: "2026-05-23T08:10:00",
    alertIssued: false,
    updates: [
      { time: "2026-05-23T08:10:00", text: "Report submitted. Awaiting authority review." },
    ],
  },
];

const CATEGORIES = ["Suspicious Activity", "Vandalism", "Violence", "Theft", "Drug Activity", "Traffic Incident", "Other"];

const STATUS_CONFIG = {
  pending: { label: "Pending Review", color: "#f59e0b", bg: "#fef3c7", icon: "⏳" },
  investigating: { label: "Under Investigation", color: "#3b82f6", bg: "#dbeafe", icon: "🔍" },
  verified: { label: "Verified & Alert Issued", color: "#8b5cf6", bg: "#ede9fe", icon: "📢" },
  resolved: { label: "Resolved", color: "#10b981", bg: "#d1fae5", icon: "✅" },
  rejected: { label: "Rejected", color: "#ef4444", bg: "#fee2e2", icon: "❌" },
};

const USERS = {
  citizen1: { name: "Aman Sharma", role: "citizen", id: "CIT-8821", location: "Springfield", avatar: "AS" },
  citizen2: { name: "Priya Nair", role: "citizen", id: "CIT-4432", location: "Central Zone", avatar: "PN" },
  auth1: { name: "Inspector Verma", role: "authority", badge: "IPS-2201", dept: "City Police HQ", avatar: "IV" },
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const G = {
  bg: "#0a0f1e",
  surface: "#111827",
  surface2: "#1a2235",
  border: "#1f2d45",
  accent: "#00d4ff",
  accentDim: "rgba(0,212,255,0.12)",
  accentGlow: "rgba(0,212,255,0.3)",
  warn: "#f97316",
  warnDim: "rgba(249,115,22,0.12)",
  danger: "#ef4444",
  success: "#10b981",
  text: "#e2e8f0",
  muted: "#64748b",
  white: "#ffffff",
};

const css = {
  app: {
    minHeight: "100vh",
    background: G.bg,
    fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
    color: G.text,
    position: "relative",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 32px",
    height: 64,
    background: "rgba(10,15,30,0.95)",
    borderBottom: `1px solid ${G.border}`,
    backdropFilter: "blur(12px)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 20,
    fontWeight: 800,
    letterSpacing: "-0.5px",
    color: G.white,
  },
  badge: (color = G.accent) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "3px 10px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
    background: color === G.accent ? G.accentDim : "rgba(249,115,22,0.12)",
    color: color,
    border: `1px solid ${color === G.accent ? "rgba(0,212,255,0.3)" : "rgba(249,115,22,0.3)"}`,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  }),
  btn: (variant = "primary") => ({
    padding: variant === "sm" ? "6px 14px" : "10px 20px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: variant === "sm" ? 12 : 14,
    transition: "all 0.2s",
    ...(variant === "primary" || variant === "sm"
      ? { background: G.accent, color: "#000" }
      : variant === "ghost"
      ? { background: "transparent", color: G.muted, border: `1px solid ${G.border}` }
      : variant === "danger"
      ? { background: G.danger, color: "#fff" }
      : variant === "warn"
      ? { background: G.warn, color: "#fff" }
      : { background: G.surface2, color: G.text, border: `1px solid ${G.border}` }),
  }),
  card: {
    background: G.surface,
    border: `1px solid ${G.border}`,
    borderRadius: 16,
    padding: 24,
  },
  input: {
    width: "100%",
    background: G.surface2,
    border: `1px solid ${G.border}`,
    borderRadius: 10,
    padding: "10px 14px",
    color: G.text,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: G.muted,
    textTransform: "uppercase",
    letterSpacing: "0.6px",
    marginBottom: 8,
  },
  avatar: (color = G.accent) => ({
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: color === G.accent ? G.accentDim : "rgba(249,115,22,0.15)",
    border: `2px solid ${color === G.accent ? "rgba(0,212,255,0.4)" : "rgba(249,115,22,0.4)"}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    color: color,
  }),
};

// ─── StatusPill ─────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
      background: s.bg, color: s.color,
    }}>
      {s.icon} {s.label}
    </span>
  );
}

// ─── Login Screen ────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [tab, setTab] = useState("citizen");
  const [creds, setCreds] = useState({ id: "", name: "", pass: "" });

  const handleLogin = () => {
    onLogin(creds.id, creds.pass, tab);
  };

  return (
    <div style={{
      minHeight: "100vh", background: G.bg, display: "flex",
      alignItems: "center", justifyContent: "center",
      backgroundImage: "radial-gradient(ellipse at 20% 50%, rgba(0,212,255,0.05) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(249,115,22,0.05) 0%, transparent 50%)",
    }}>
      <div style={{ width: 420, padding: 16 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🛡️</div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: G.white, margin: 0, letterSpacing: "-1px" }}>
            Civic<span style={{ color: G.accent }}>Alert</span>
          </h1>
          <p style={{ color: G.muted, margin: "8px 0 0", fontSize: 14 }}>
            Community Safety & Crime Reporting Platform
          </p>
        </div>

        {/* Tab */}
        <div style={{ display: "flex", background: G.surface2, borderRadius: 12, padding: 4, marginBottom: 28, border: `1px solid ${G.border}` }}>
          {["citizen", "authority"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: "10px 0", borderRadius: 9, border: "none",
              background: tab === t ? (t === "citizen" ? G.accent : G.warn) : "transparent",
              color: tab === t ? (t === "citizen" ? "#000" : "#fff") : G.muted,
              fontWeight: 700, fontSize: 13, cursor: "pointer", textTransform: "capitalize",
              transition: "all 0.2s",
            }}>
              {t === "citizen" ? "👤 Citizen" : "🏛️ Authority"}
            </button>
          ))}
        </div>

        {/* Form */}
        <div style={css.card}>
          <div style={{ marginBottom: 18 }}>
            <label style={css.label}>{tab === "citizen" ? "Citizen ID / Aadhaar" : "Badge Number"}</label>
            <input style={css.input} placeholder={tab === "citizen" ? "e.g. XXXX-XXXX-XXXX" : "e.g. IPS-2201"}
              value={creds.id} onChange={e => setCreds({ ...creds, id: e.target.value })} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={css.label}>Full Name</label>
            <input style={css.input} placeholder="Your registered name"
              value={creds.name} onChange={e => setCreds({ ...creds, name: e.target.value })} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={css.label}>Password</label>
            <input style={css.input} type="password" placeholder="••••••••"
              value={creds.pass} onChange={e => setCreds({ ...creds, pass: e.target.value })} />
          </div>
          <button onClick={handleLogin} style={{
            ...css.btn("primary"),
            width: "100%",
            background: tab === "citizen" ? G.accent : G.warn,
            color: tab === "citizen" ? "#000" : "#fff",
            padding: "13px 0", fontSize: 15, borderRadius: 10,
          }}>
            {tab === "citizen" ? "Sign In as Citizen →" : "Sign In as Authority →"}
          </button>
          <p style={{ textAlign: "center", fontSize: 12, color: G.muted, marginTop: 16, marginBottom: 0 }}>
            Demo: click Sign In to enter the platform
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── CITIZEN PORTAL ──────────────────────────────────────────────────────────
function CitizenPortal({ user, reports, onSubmit, onLogout }) {
  const [view, setView] = useState("dashboard");
  const [selected, setSelected] = useState(null);
  const myReports = reports.filter(r => r.submitted_by === user.id);
  const alerts = reports.filter(r => r.alertIssued);

  return (
    <div style={{ minHeight: "100vh", background: G.bg }}>
      {/* Nav */}
      <nav style={css.nav}>
        <div style={css.logo}>🛡️ Civic<span style={{ color: G.accent }}>Alert</span></div>
        <div style={{ display: "flex", gap: 8 }}>
          {["dashboard", "report", "my-reports", "alerts"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              background: view === v ? G.accentDim : "transparent",
              color: view === v ? G.accent : G.muted,
              fontWeight: 600, fontSize: 13, textTransform: "capitalize",
              borderBottom: view === v ? `2px solid ${G.accent}` : "2px solid transparent",
            }}>
              {v === "dashboard" ? "🏠 Home" : v === "report" ? "📤 Report" : v === "my-reports" ? "📋 My Reports" : "🔔 Alerts"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={css.avatar(G.accent)}>{user.avatar}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: G.white }}>{user.name}</div>
            <div style={{ fontSize: 11, color: G.muted }}>{user.id}</div>
          </div>
          <button onClick={onLogout} style={{ ...css.btn("ghost"), fontSize: 12, padding: "5px 12px" }}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        {view === "dashboard" && <CitizenDashboard myReports={myReports} alerts={alerts} onViewReport={r => { setSelected(r); setView("detail"); }} onNavigate={setView} />}
        {view === "report" && <ReportForm onSubmit={data => { onSubmit(data, user.id); setView("my-reports"); }} />}
        {view === "my-reports" && <MyReports reports={myReports} onViewReport={r => { setSelected(r); setView("detail"); }} />}
        {view === "alerts" && <AlertsFeed alerts={alerts} />}
        {view === "detail" && selected && <ReportDetail report={selected} onBack={() => setView("my-reports")} />}
      </div>
    </div>
  );
}

function CitizenDashboard({ myReports, alerts, onViewReport, onNavigate }) {
  const stats = [
    { label: "My Reports", value: myReports.length, icon: "📋", color: G.accent },
    { label: "Active Alerts", value: alerts.length, icon: "🔔", color: G.warn },
    { label: "Resolved", value: myReports.filter(r => r.status === "resolved").length, icon: "✅", color: G.success },
    { label: "Pending", value: myReports.filter(r => r.status === "pending").length, icon: "⏳", color: "#f59e0b" },
  ];

  return (
    <div>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: G.white, marginBottom: 6 }}>Welcome back 👋</h2>
      <p style={{ color: G.muted, marginBottom: 32, fontSize: 14 }}>Stay safe. Stay informed. Report what you see.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 32 }}>
        {stats.map(s => (
          <div key={s.label} style={{ ...css.card, borderColor: `${s.color}30` }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: G.muted }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Active alerts banner */}
      {alerts.length > 0 && (
        <div style={{
          ...css.card, borderColor: `${G.warn}40`, background: G.warnDim,
          marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 32 }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 700, color: G.warn, fontSize: 15 }}>{alerts.length} Active Alert{alerts.length > 1 ? "s" : ""} in Your Area</div>
              <div style={{ color: G.muted, fontSize: 13 }}>Authorities have verified incidents near you. Stay cautious.</div>
            </div>
          </div>
          <button onClick={() => onNavigate("alerts")} style={{ ...css.btn("warn"), whiteSpace: "nowrap" }}>View Alerts</button>
        </div>
      )}

      {/* Recent reports */}
      <h3 style={{ fontSize: 16, fontWeight: 700, color: G.white, marginBottom: 16 }}>My Recent Reports</h3>
      {myReports.length === 0 ? (
        <div style={{ ...css.card, textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <div style={{ color: G.muted }}>No reports yet. Be the eyes of your community.</div>
          <button onClick={() => onNavigate("report")} style={{ ...css.btn("primary"), marginTop: 16 }}>Submit First Report</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {myReports.slice(0, 3).map(r => (
            <ReportCard key={r.id} report={r} onClick={() => onViewReport(r)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportCard({ report: r, onClick, showActions, onStatusChange }) {
  return (
    <div onClick={onClick} style={{
      ...css.card, cursor: "pointer", display: "flex",
      alignItems: "center", justifyContent: "space-between",
      transition: "border-color 0.2s, transform 0.1s",
      "&:hover": { borderColor: G.accent },
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = G.accent; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.transform = "none"; }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: G.accent, fontWeight: 700 }}>{r.id}</span>
          <span style={{ fontSize: 11, color: G.muted }}>•</span>
          <span style={{ fontSize: 11, color: G.muted }}>{timeAgo(r.submittedAt)}</span>
          {r.alertIssued && <span style={{ fontSize: 10, background: "rgba(249,115,22,0.15)", color: G.warn, padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>ALERT ISSUED</span>}
        </div>
        <div style={{ fontWeight: 700, fontSize: 15, color: G.white, marginBottom: 4 }}>{r.title}</div>
        <div style={{ fontSize: 12, color: G.muted }}>📍 {r.location}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, marginLeft: 20 }}>
        <StatusPill status={r.status} />
        <span style={{ fontSize: 11, color: G.muted, background: G.surface2, padding: "3px 10px", borderRadius: 8 }}>{r.category}</span>
      </div>
    </div>
  );
}

function ReportForm({ onSubmit }) {
  const [form, setForm] = useState({
    title: "", category: CATEGORIES[0], description: "", location: "", media: "none",
  });
  const [submitted, setSubmitted] = useState(false);

  const handle = () => {
    if (!form.title || !form.description || !form.location) return;
    onSubmit(form);
    setSubmitted(true);
  };

  if (submitted) return (
    <div style={{ textAlign: "center", padding: 80 }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
      <h2 style={{ color: G.white }}>Report Submitted!</h2>
      <p style={{ color: G.muted }}>Authorities have been notified. You'll receive updates as the investigation progresses.</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: G.white, marginBottom: 6 }}>File a Report</h2>
      <p style={{ color: G.muted, marginBottom: 28, fontSize: 14 }}>All submissions are reviewed by authorities. False reports may result in penalties.</p>

      <div style={css.card}>
        {[
          { key: "title", label: "Incident Title", placeholder: "Brief description of what you observed" },
          { key: "location", label: "Location", placeholder: "Street address, landmark, or area" },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 20 }}>
            <label style={css.label}>{f.label}</label>
            <input style={css.input} placeholder={f.placeholder}
              value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
          </div>
        ))}

        <div style={{ marginBottom: 20 }}>
          <label style={css.label}>Category</label>
          <select style={{ ...css.input }} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={css.label}>Description</label>
          <textarea style={{ ...css.input, minHeight: 120, resize: "vertical" }} placeholder="Describe what you saw in detail. Time, number of people, vehicles involved..."
            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>

        <div style={{ marginBottom: 28 }}>
          <label style={css.label}>Attach Evidence</label>
          <div style={{ display: "flex", gap: 10 }}>
            {["none", "image", "video", "text"].map(m => (
              <button key={m} onClick={() => setForm({ ...form, media: m })} style={{
                padding: "8px 18px", borderRadius: 8, border: `1px solid ${form.media === m ? G.accent : G.border}`,
                background: form.media === m ? G.accentDim : "transparent",
                color: form.media === m ? G.accent : G.muted,
                cursor: "pointer", fontSize: 13, fontWeight: 600,
              }}>
                {m === "none" ? "No File" : m === "image" ? "📷 Image" : m === "video" ? "🎬 Video" : "📄 Text"}
              </button>
            ))}
          </div>
          {form.media !== "none" && (
            <div style={{
              marginTop: 12, border: `2px dashed ${G.border}`, borderRadius: 10,
              padding: 28, textAlign: "center", color: G.muted, fontSize: 13, cursor: "pointer",
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>☁️</div>
              Click to upload or drag & drop your {form.media}
            </div>
          )}
        </div>

        <button onClick={handle} style={{ ...css.btn("primary"), width: "100%", padding: "13px 0", fontSize: 15, borderRadius: 10 }}>
          Submit Report →
        </button>

        <p style={{ fontSize: 12, color: G.muted, textAlign: "center", marginTop: 14, marginBottom: 0 }}>
          🔒 Your identity is protected. Reports are reviewed confidentially.
        </p>
      </div>
    </div>
  );
}

function MyReports({ reports, onViewReport }) {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: G.white, marginBottom: 24 }}>My Reports ({reports.length})</h2>
      {reports.length === 0 ? (
        <div style={{ ...css.card, textAlign: "center", padding: 60 }}>
          <div style={{ color: G.muted }}>No reports filed yet.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {reports.map(r => <ReportCard key={r.id} report={r} onClick={() => onViewReport(r)} />)}
        </div>
      )}
    </div>
  );
}

function ReportDetail({ report: r, onBack, isAuthority, onStatusChange }) {
  const [newStatus, setNewStatus] = useState(r.status);
  const [note, setNote] = useState("");
  const [radius, setRadius] = useState(r.radius || 1);

  return (
    <div>
      <button onClick={onBack} style={{ ...css.btn("ghost"), marginBottom: 24, fontSize: 13 }}>← Back</button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
        {/* Main */}
        <div>
          <div style={css.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <span style={css.badge()}>{r.id}</span>
                  <span style={{ ...css.badge(), background: "rgba(255,255,255,0.05)", color: G.muted, border: `1px solid ${G.border}` }}>{r.category}</span>
                  {r.alertIssued && <span style={css.badge(G.warn)}>⚠️ Alert Issued</span>}
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: G.white, margin: 0 }}>{r.title}</h2>
              </div>
              <StatusPill status={r.status} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              {[
                { l: "Location", v: r.location },
                { l: "Submitted", v: fmtDate(r.submittedAt) },
                { l: "Evidence", v: r.media === "none" ? "None" : r.media },
                { l: "Alert Radius", v: r.alertIssued ? `${r.radius} km` : "N/A" },
              ].map(i => (
                <div key={i.l} style={{ background: G.surface2, borderRadius: 10, padding: "12px 16px" }}>
                  <div style={css.label}>{i.l}</div>
                  <div style={{ fontSize: 14, color: G.white, fontWeight: 600 }}>{i.v}</div>
                </div>
              ))}
            </div>

            <div>
              <div style={css.label}>Description</div>
              <p style={{ color: G.text, lineHeight: 1.7, fontSize: 14, margin: 0 }}>{r.description}</p>
            </div>
          </div>

          {/* Authority action */}
          {isAuthority && (
            <div style={{ ...css.card, marginTop: 16, borderColor: `${G.warn}40` }}>
              <div style={{ fontWeight: 700, color: G.white, marginBottom: 16 }}>🏛️ Authority Actions</div>
              <div style={{ marginBottom: 14 }}>
                <label style={css.label}>Update Status</label>
                <select style={css.input} value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              {(newStatus === "verified" || r.status === "verified") && (
                <div style={{ marginBottom: 14 }}>
                  <label style={css.label}>Alert Radius (km)</label>
                  <input type="range" min="0.5" max="10" step="0.5" value={radius}
                    onChange={e => setRadius(+e.target.value)}
                    style={{ width: "100%", accentColor: G.warn }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: G.muted, marginTop: 4 }}>
                    <span>0.5 km</span><span style={{ color: G.warn, fontWeight: 700 }}>{radius} km selected</span><span>10 km</span>
                  </div>
                </div>
              )}
              <div style={{ marginBottom: 14 }}>
                <label style={css.label}>Add Update Note</label>
                <textarea style={{ ...css.input, minHeight: 80 }} placeholder="e.g. Patrol dispatched to the area..."
                  value={note} onChange={e => setNote(e.target.value)} />
              </div>
              <button onClick={() => onStatusChange && onStatusChange(r.id, newStatus, note, radius)} style={{ ...css.btn("warn"), width: "100%" }}>
                Update Report & Issue Alert
              </button>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div style={css.card}>
          <div style={{ fontWeight: 700, color: G.white, marginBottom: 20 }}>📋 Activity Timeline</div>
          <div style={{ position: "relative" }}>
            {r.updates.map((u, i) => (
              <div key={i} style={{ display: "flex", gap: 14, marginBottom: 20, position: "relative" }}>
                <div style={{
                  width: 10, height: 10, borderRadius: "50%", background: i === 0 ? G.accent : G.border,
                  border: `2px solid ${i === 0 ? G.accent : G.muted}`,
                  flexShrink: 0, marginTop: 4,
                  boxShadow: i === 0 ? `0 0 10px ${G.accentGlow}` : "none",
                }} />
                <div>
                  <div style={{ fontSize: 13, color: G.text, lineHeight: 1.5 }}>{u.text}</div>
                  <div style={{ fontSize: 11, color: G.muted, marginTop: 4 }}>{fmtDate(u.time)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertsFeed({ alerts }) {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: G.white, marginBottom: 8 }}>🔔 Active Alerts in Your Area</h2>
      <p style={{ color: G.muted, marginBottom: 24, fontSize: 14 }}>These alerts have been verified by local authorities. Exercise caution.</p>
      {alerts.map(a => (
        <div key={a.id} style={{
          ...css.card, borderColor: `${G.warn}40`, background: G.warnDim,
          marginBottom: 14,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <span style={css.badge(G.warn)}>⚠️ {a.category}</span>
                <span style={{ fontSize: 12, color: G.muted }}>{timeAgo(a.verifiedAt || a.submittedAt)}</span>
              </div>
              <h3 style={{ color: G.white, margin: "0 0 6px", fontSize: 16 }}>{a.title}</h3>
              <div style={{ fontSize: 13, color: G.muted }}>📍 {a.location} — Alert radius: {a.radius} km</div>
            </div>
            <StatusPill status={a.status} />
          </div>
          <p style={{ fontSize: 13, color: G.text, margin: "14px 0 0", lineHeight: 1.6 }}>{a.description}</p>
        </div>
      ))}
    </div>
  );
}

// ─── AUTHORITY PORTAL ─────────────────────────────────────────────────────────
function AuthorityPortal({ user, reports, onStatusChange, onLogout }) {
  const [view, setView] = useState("dashboard");
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? reports : reports.filter(r => r.status === filter);

  return (
    <div style={{ minHeight: "100vh", background: G.bg }}>
      <nav style={{ ...css.nav, borderBottomColor: `${G.warn}40` }}>
        <div style={{ ...css.logo }}>
          🛡️ Civic<span style={{ color: G.warn }}>Alert</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: G.warn, background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)", padding: "3px 10px", borderRadius: 20, marginLeft: 8 }}>AUTHORITY</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[["dashboard", "📊 Dashboard"], ["reports", "📋 All Reports"], ["alerts", "📢 Issued Alerts"]].map(([v, l]) => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              background: view === v ? "rgba(249,115,22,0.12)" : "transparent",
              color: view === v ? G.warn : G.muted, fontWeight: 600, fontSize: 13,
              borderBottom: view === v ? `2px solid ${G.warn}` : "2px solid transparent",
            }}>{l}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={css.avatar(G.warn)}>{user.avatar}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: G.white }}>{user.name}</div>
            <div style={{ fontSize: 11, color: G.muted }}>{user.badge} · {user.dept}</div>
          </div>
          <button onClick={onLogout} style={{ ...css.btn("ghost"), fontSize: 12, padding: "5px 12px" }}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {view === "dashboard" && <AuthDashboard reports={reports} onViewReport={r => { setSelected(r); setView("detail"); }} />}
        {view === "reports" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: G.white, margin: 0 }}>All Reports ({filtered.length})</h2>
              <div style={{ display: "flex", gap: 8 }}>
                {["all", "pending", "investigating", "verified", "resolved"].map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    padding: "6px 14px", borderRadius: 8, border: `1px solid ${filter === f ? G.warn : G.border}`,
                    background: filter === f ? "rgba(249,115,22,0.12)" : "transparent",
                    color: filter === f ? G.warn : G.muted, fontWeight: 600, fontSize: 12, cursor: "pointer", textTransform: "capitalize",
                  }}>{f}</button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filtered.map(r => (
                <ReportCard key={r.id} report={r} onClick={() => { setSelected(r); setView("detail"); }} />
              ))}
            </div>
          </div>
        )}
        {view === "alerts" && <AlertsFeed alerts={reports.filter(r => r.alertIssued)} />}
        {view === "detail" && selected && (
          <ReportDetail report={selected} onBack={() => setView("reports")} isAuthority
            onStatusChange={(id, status, note, radius) => {
              onStatusChange(id, status, note, radius);
              setView("reports");
            }} />
        )}
      </div>
    </div>
  );
}

function AuthDashboard({ reports, onViewReport }) {
  const byStatus = Object.fromEntries(Object.keys(STATUS_CONFIG).map(k => [k, reports.filter(r => r.status === k).length]));
  const pending = reports.filter(r => r.status === "pending");

  return (
    <div>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: G.white, marginBottom: 6 }}>Command Dashboard</h2>
      <p style={{ color: G.muted, marginBottom: 32, fontSize: 14 }}>Overview of all incoming citizen reports.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, marginBottom: 32 }}>
        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
          <div key={k} style={{ ...css.card, borderColor: `${v.color}40`, textAlign: "center" }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{v.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: v.color }}>{byStatus[k] || 0}</div>
            <div style={{ fontSize: 11, color: G.muted, marginTop: 4, lineHeight: 1.4 }}>{v.label}</div>
          </div>
        ))}
      </div>

      {pending.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: G.white, margin: 0 }}>⏳ Awaiting Review</h3>
            <span style={{ background: G.danger, color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10 }}>{pending.length} NEW</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {pending.map(r => <ReportCard key={r.id} report={r} onClick={() => onViewReport(r)} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Root App ────────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) fetchReports();
  }, [token]);

  const fetchReports = async () => {
    try {
      const res = await fetch(`${API}/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setReports(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = (id, status, note, radius) => {
    setReports(prev => prev.map(r => {
      if (r.id !== id) return r;
      return {
        ...r,
        status,
        radius: radius || r.radius,
        alertIssued: status === "verified" || r.alertIssued,
        verifiedAt: status === "verified" ? new Date().toISOString() : r.verifiedAt,
        updates: [...r.updates, {
          time: new Date().toISOString(),
          text: note || `Status updated to: ${STATUS_CONFIG[status]?.label}`,
        }],
      };
    }));
  };
const handleSubmit = async (data) => {
    try {
      const res = await fetch(`${API}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      const newReport = await res.json();
      setReports(prev => [...prev, newReport]);
    } catch (err) {
      alert('Failed to submit report.');
    }
  };
  const handleLogin = async (govId, password, role) => {
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gov_id: govId, password })
      });
      const data = await res.json();
      if (data.error) return alert(data.error);
      setToken(data.token);
      setCurrentUser(data.user);
    } catch (err) {
      alert('Login failed. Is the server running?');
    }
  };

const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    setReports([]);
  };
  const user = currentUser;

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  if (user.role === "citizen") return (
    <CitizenPortal user={user} reports={reports} onSubmit={handleSubmit} onLogout={handleLogout} />
  );

  return (
    <AuthorityPortal user={user} reports={reports} onStatusChange={handleStatusChange} onLogout={handleLogout} />
  );
}