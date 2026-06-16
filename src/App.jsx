import { useState, useEffect } from "react";

const SHEET_ID = "1vyvwNOLLRKmt9GR--MNZPqrfocuorMNj3CaA6PamqBw";
const API_KEY = "AIzaSyD3bfUsLXmPxqO1LwnYR1q479lAS2PeQyc";
const RANGE = "A1:S40";

const WEEKS = [
  "Start","6-12-26","6-19-26","6-26-26","7-3-26","7-10-26","7-17-26",
  "7-24-26","7-31-26","8-7-26","8-14-26","8-21-26","8-28-26","9-4-26","9-11-26","9-18-26"
];

const CATEGORY_META = {
  "Tithe":        { weekly: 40,  type: "monthly-pull",   row: 4  },
  "Missions":     { weekly: 15,  type: "monthly-pull",   row: 6  },
  "Savings":      { weekly: 35,  type: "never-touch",    row: 8  },
  "insurance":    { weekly: 60,  type: "monthly-pull",   row: 10 },
  "Car":          { weekly: 250, type: "monthly-pull",   row: 12 },
  "Subscription": { weekly: 40,  type: "weekly-spend",   row: 14 },
  "Rent":         { weekly: 20,  type: "never-touch",    row: 16 },
  "Out to Eat":   { weekly: 25,  type: "weekly-spend",   row: 18 },
  "Games":        { weekly: 25,  type: "pull-when-want", row: 20 },
  "Blow":         { weekly: 25,  type: "weekly-spend",   row: 22 },
  "Vacation":     { weekly: 20,  type: "never-touch",    row: 24 },
  "Legos":        { weekly: 10,  type: "pull-when-want", row: 26 },
};

const DISPLAY_NAMES = {
  "insurance": "Insurance",
};

const TYPE_COLORS = {
  "weekly-spend":   { bg: "#fef3c7", border: "#f59e0b", badge: "#92400e", badgeBg: "#fde68a" },
  "monthly-pull":   { bg: "#dbeafe", border: "#3b82f6", badge: "#1e3a8a", badgeBg: "#bfdbfe" },
  "never-touch":    { bg: "#d1fae5", border: "#10b981", badge: "#064e3b", badgeBg: "#a7f3d0" },
  "pull-when-want": { bg: "#f3e8ff", border: "#8b5cf6", badge: "#3b0764", badgeBg: "#ddd6fe" },
};

const TYPE_LABELS = {
  "weekly-spend": "Weekly Spend",
  "monthly-pull": "Monthly Pull",
  "never-touch": "Never Touch",
  "pull-when-want": "Pull When Wanted",
};

const COLUMN_MAP = {
  "6-12-26": "E", "6-19-26": "F", "6-26-26": "G",
  "7-3-26": "H",  "7-10-26": "I", "7-17-26": "J",
  "7-24-26": "K", "7-31-26": "L", "8-7-26": "M",
  "8-14-26": "N", "8-21-26": "O", "8-28-26": "P",
  "9-4-26": "Q",  "9-11-26": "R", "9-18-26": "S",
};

function parseVal(v) {
  if (!v) return 0;
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? 0 : n;
}

export default function BudgetDashboard() {
  const [tab, setTab] = useState("overview");
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      const rows = data.values || [];

      const parsed = Object.entries(CATEGORY_META).map(([key, meta]) => {
        const rowIndex = meta.row - 1;
        const row = rows[rowIndex] || [];
        // Columns: A=0(name), B=1(budget), C=2(blank), D=3(Start), E=4(6-12-26)...
        const values = [
          parseVal(row[3]), // Start (col D)
          parseVal(row[4]), // 6-12-26 (col E)
          parseVal(row[5]),
          parseVal(row[6]),
          parseVal(row[7]),
          parseVal(row[8]),
          parseVal(row[9]),
          parseVal(row[10]),
          parseVal(row[11]),
          parseVal(row[12]),
          parseVal(row[13]),
          parseVal(row[14]),
          parseVal(row[15]),
          parseVal(row[16]),
          parseVal(row[17]),
          parseVal(row[18]), // 9-18-26 (col S)
        ];
        return {
          key,
          name: DISPLAY_NAMES[key] || key,
          weekly: meta.weekly,
          type: meta.type,
          row: meta.row,
          values,
        };
      });

      setCategories(parsed);
      setLastUpdated(new Date().toLocaleTimeString());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const weekLabel = WEEKS[selectedWeek];
  const colLetter = COLUMN_MAP[weekLabel] || "?";

  const weekTotals = WEEKS.map((_, wi) =>
    categories.reduce((sum, cat) => sum + (cat.values[wi] || 0), 0)
  );

  const grandTotal = weekTotals.reduce((a, b) => a + b, 0);
  const savingsTotal = categories.find(c => c.key === "Savings")
    ?.values.reduce((a, b) => a + b, 0) || 0;

  const weekData = categories.map(cat => ({
    ...cat,
    thisWeek: cat.values[selectedWeek] || 0,
    total: cat.values.reduce((a, b) => a + b, 0),
  }));

  const tabs = [
    { id: "overview", label: "📊 Overview" },
    { id: "sheet",    label: "📋 Sheet Data" },
    { id: "ref",      label: "🗺️ Reference" },
  ];

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "system-ui", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 32 }}>💜</div>
      <div style={{ fontSize: 16, color: "#6b7280" }}>Loading budget data...</div>
    </div>
  );

  if (error) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "system-ui", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 32 }}>⚠️</div>
      <div style={{ fontSize: 16, color: "#ef4444" }}>Error: {error}</div>
      <button onClick={fetchData} style={{ padding: "8px 16px", background: "#2563eb", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>Retry</button>
    </div>
  );

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 900, margin: "0 auto", padding: 16, background: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)", borderRadius: 12, padding: "20px 24px", marginBottom: 16, color: "white" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>💜 Elijah's Budget Dashboard</div>
            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>6/11/26 – 9/17/26 · $535/week · Live from Google Sheets</div>
          </div>
          <button onClick={fetchData} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, color: "white", padding: "6px 12px", cursor: "pointer", fontSize: 12 }}>
            🔄 Refresh
          </button>
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
          <Stat label="Grand Total" value={`$${grandTotal.toLocaleString()}`} />
          <Stat label="Savings Accumulated" value={`$${savingsTotal.toLocaleString()}`} />
          <Stat label="Weekly Budget" value="$535" />
          <Stat label="Weekly Keep (checking)" value="$95" />
        </div>
        {lastUpdated && <div style={{ fontSize: 11, opacity: 0.6, marginTop: 8 }}>Last updated: {lastUpdated}</div>}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14,
              background: tab === t.id ? "#2563eb" : "white",
              color: tab === t.id ? "white" : "#374151",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === "overview" && (
        <div>
          <div style={{ background: "white", borderRadius: 10, padding: 16, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", marginBottom: 8 }}>SELECT WEEK</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {WEEKS.slice(1).map((w, i) => (
                <button key={w} onClick={() => setSelectedWeek(i + 1)}
                  style={{ padding: "5px 10px", borderRadius: 6, border: "1.5px solid",
                    borderColor: selectedWeek === i+1 ? "#2563eb" : "#e5e7eb",
                    background: selectedWeek === i+1 ? "#eff6ff" : "white",
                    color: selectedWeek === i+1 ? "#1d4ed8" : "#374151",
                    fontWeight: selectedWeek === i+1 ? 700 : 400,
                    fontSize: 13, cursor: "pointer" }}>
                  {w}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: "#1e3a5f", borderRadius: 10, padding: "12px 20px", marginBottom: 16, color: "white", display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
            <div><div style={{ fontSize: 11, opacity: 0.7, textTransform: "uppercase", letterSpacing: 1 }}>Week of</div><div style={{ fontSize: 18, fontWeight: 700 }}>{weekLabel}</div></div>
            <div><div style={{ fontSize: 11, opacity: 0.7 }}>Sheet Column</div><div style={{ fontSize: 18, fontWeight: 700 }}>{colLetter}</div></div>
            <div><div style={{ fontSize: 11, opacity: 0.7 }}>Week Total</div><div style={{ fontSize: 18, fontWeight: 700 }}>${weekTotals[selectedWeek].toLocaleString()}</div></div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
            {weekData.map(cat => {
              const colors = TYPE_COLORS[cat.type];
              return (
                <div key={cat.key} style={{ background: colors.bg, border: `1.5px solid ${colors.border}`, borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{cat.name}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, background: colors.badgeBg, color: colors.badge, padding: "2px 6px", borderRadius: 99 }}>
                      {TYPE_LABELS[cat.type]}
                    </span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#111827" }}>${cat.thisWeek}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Budget: ${cat.weekly}/wk · Total: ${cat.total}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>Cell: {colLetter}{cat.row}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SHEET DATA TAB */}
      {tab === "sheet" && (
        <div style={{ background: "white", borderRadius: 10, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflowX: "auto" }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Live Sheet Data</div>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#1e3a5f", color: "white" }}>
                <th style={{ padding: "8px 10px", textAlign: "left" }}>Category</th>
                <th style={{ padding: "8px 6px", textAlign: "center" }}>Budget</th>
                <th style={{ padding: "8px 6px", textAlign: "center" }}>Row</th>
                {WEEKS.map((w, i) => (
                  <th key={w} style={{ padding: "8px 5px", textAlign: "center", background: i === selectedWeek ? "#2563eb" : "#1e3a5f", minWidth: 52 }}>
                    {w === "Start" ? "Start" : w.slice(0,4)}
                  </th>
                ))}
                <th style={{ padding: "8px 6px", textAlign: "center" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, ri) => {
                const colors = TYPE_COLORS[cat.type];
                const total = cat.values.reduce((a, b) => a + b, 0);
                return (
                  <tr key={cat.key} style={{ background: ri % 2 === 0 ? "#f9fafb" : "white" }}>
                    <td style={{ padding: "7px 10px", fontWeight: 600, borderLeft: `3px solid ${colors.border}` }}>{cat.name}</td>
                    <td style={{ padding: "7px 6px", textAlign: "center", color: "#6b7280" }}>${cat.weekly}</td>
                    <td style={{ padding: "7px 6px", textAlign: "center", color: "#9ca3af", fontFamily: "monospace" }}>{cat.row}</td>
                    {cat.values.map((v, wi) => (
                      <td key={wi} style={{ padding: "7px 5px", textAlign: "center",
                        background: wi === selectedWeek ? "#eff6ff" : "inherit",
                        fontWeight: wi === selectedWeek ? 700 : 400,
                        color: v > 0 ? "#111827" : "#d1d5db" }}>
                        {v > 0 ? `$${v}` : "—"}
                      </td>
                    ))}
                    <td style={{ padding: "7px 6px", textAlign: "center", fontWeight: 700, color: "#1d4ed8" }}>${total}</td>
                  </tr>
                );
              })}
              <tr style={{ background: "#1e3a5f", color: "white", fontWeight: 700 }}>
                <td style={{ padding: "8px 10px" }}>TOTAL</td>
                <td style={{ padding: "8px 6px", textAlign: "center" }}>$565</td>
                <td style={{ padding: "8px 6px", textAlign: "center" }}>34</td>
                {weekTotals.map((t, wi) => (
                  <td key={wi} style={{ padding: "8px 5px", textAlign: "center", background: wi === selectedWeek ? "#2563eb" : "inherit" }}>
                    {t > 0 ? `$${t}` : "—"}
                  </td>
                ))}
                <td style={{ padding: "8px 6px", textAlign: "center" }}>${grandTotal.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
          <div style={{ marginTop: 12, fontSize: 12, color: "#6b7280" }}>
            ⚡ Highlighted column = currently selected week ({weekLabel}, col {colLetter})
          </div>
        </div>
      )}

      {/* REFERENCE TAB */}
      {tab === "ref" && (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ background: "white", borderRadius: 10, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>📅 Sheet Column → Week Map</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 6 }}>
              {Object.entries(COLUMN_MAP).map(([week, col]) => (
                <div key={week} style={{ background: "#f1f5f9", borderRadius: 6, padding: "6px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#2563eb", fontSize: 15 }}>{col}</span>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>{week}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "white", borderRadius: 10, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>🏷️ Category Types</div>
            <div style={{ display: "grid", gap: 8 }}>
              {Object.entries(TYPE_LABELS).map(([type, label]) => {
                const colors = TYPE_COLORS[type];
                const cats = categories.filter(c => c.type === type);
                return (
                  <div key={type} style={{ background: colors.bg, border: `1.5px solid ${colors.border}`, borderRadius: 8, padding: "10px 14px" }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 13, color: "#374151" }}>{cats.map(c => c.name).join(" · ")}</div>
                    {type === "weekly-spend" && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>Keep in checking each week. Total: $95/wk</div>}
                    {type === "monthly-pull" && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>Deducted from sheet silently (CHM 1st, Car 3rd)</div>}
                    {type === "never-touch" && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>Accumulates — never withdrawn</div>}
                    {type === "pull-when-want" && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>Pulled out on demand</div>}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: "white", borderRadius: 10, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>🔗 Quick Links</div>
            <a href="https://docs.google.com/spreadsheets/d/1vyvwNOLLRKmt9GR--MNZPqrfocuorMNj3CaA6PamqBw/edit"
              target="_blank" rel="noreferrer"
              style={{ display: "block", padding: "10px 14px", background: "#eff6ff", border: "1.5px solid #3b82f6", borderRadius: 8, color: "#1d4ed8", fontWeight: 600, textDecoration: "none", fontSize: 14 }}>
              📊 Open Google Sheet →
            </a>
            <a href="https://elijah-budget-roan.vercel.app" target="_blank" rel="noreferrer"
              style={{ display: "block", marginTop: 8, padding: "10px 14px", background: "#f0fdf4", border: "1.5px solid #10b981", borderRadius: 8, color: "#065f46", fontWeight: 600, textDecoration: "none", fontSize: 14 }}>
              🌐 Live Dashboard →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "6px 12px" }}>
      <div style={{ fontSize: 10, opacity: 0.8, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
