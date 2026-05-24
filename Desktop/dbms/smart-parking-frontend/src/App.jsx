import React, { useState, useEffect, useCallback } from "react";

// ── Constants ────────────────────────────────────────────────────────────────
const ZONES = ["A", "B", "C", "D"];
const RATE_PER_HOUR = 40;

const INIT_OCC = [
  "A-01","A-02","A-03","A-04","A-05","A-06","A-07","A-08","A-09","A-10",
  "A-11","A-12","A-13","A-14","A-15","A-16","A-17","A-18",
  "B-01","B-02","B-03","B-04","B-05","B-06","B-07","B-08","B-09","B-10",
  "B-11","B-12","B-13","B-14","B-15",
  "C-01","C-02","C-03","C-04","C-05",
];
const INIT_RES = ["A-19", "B-16", "C-06"];

function buildInitSlots() {
  const s = {};
  ZONES.forEach((z) => {
    for (let i = 1; i <= 20; i++) {
      const k = `${z}-${String(i).padStart(2, "0")}`;
      s[k] = INIT_OCC.includes(k) ? "occ" : INIT_RES.includes(k) ? "res" : "avail";
    }
  });
  return s;
}

function durCalc(entryTime) {
  const ms = Date.now() - new Date(entryTime).getTime();
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const str = `${h ? h + "h " : ""}${m}m`;
  const charge = Math.max(1, Math.ceil(ms / 3_600_000)) * RATE_PER_HOUR;
  return { h, m, str, charge };
}

function fmtTime(d) {
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

// ── Badge component ──────────────────────────────────────────────────────────
function Badge({ color, children }) {
  const styles = {
    green: { background: "#EAF3DE", color: "#27500A" },
    red:   { background: "#FCEBEB", color: "#791F1F" },
    amber: { background: "#FAEEDA", color: "#854F0B" },
    blue:  { background: "#E6F1FB", color: "#0C447C" },
    gray:  { background: "#F1EFE8", color: "#5F5E5A" },
  };
  return (
    <span style={{
      ...styles[color],
      padding: "2px 8px",
      borderRadius: 99,
      fontSize: 11,
      fontWeight: 500,
      display: "inline-flex",
      alignItems: "center",
      gap: 3,
    }}>
      {children}
    </span>
  );
}

// ── Button component ─────────────────────────────────────────────────────────
function Btn({ color = "default", onClick, children, small }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: small ? "5px 10px" : "7px 14px",
    borderRadius: 8, fontSize: small ? 12 : 13, fontWeight: 500,
    cursor: "pointer", border: "0.5px solid",
    transition: "all 0.12s",
  };
  const variants = {
    default: { background: "#fff", color: "#1a1a1a", borderColor: "#ccc" },
    green:   { background: "#EAF3DE", color: "#27500A", borderColor: "#C0DD97" },
    red:     { background: "#FCEBEB", color: "#791F1F", borderColor: "#F7C1C1" },
    blue:    { background: "#E6F1FB", color: "#0C447C", borderColor: "#B5D4F4" },
  };
  return (
    <button style={{ ...base, ...variants[color] }} onClick={onClick}>
      {children}
    </button>
  );
}

// ── Modal component ──────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.38)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div style={{
        background: "#fff", borderRadius: 12, border: "0.5px solid #ddd",
        width: 380, padding: 22, boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 500 }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#888" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── FormField component ──────────────────────────────────────────────────────
function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#666", marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "8px 10px", border: "0.5px solid #ccc",
  borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box",
  background: "#fff", color: "#1a1a1a",
};

// ── Toast component ──────────────────────────────────────────────────────────
function Toast({ msg, type, visible }) {
  return (
    <div style={{
      position: "fixed", bottom: 22, right: 22,
      background: "#fff", border: `0.5px solid #ccc`,
      borderLeft: `3px solid ${type === "success" ? "#639922" : "#E24B4A"}`,
      borderRadius: 8, padding: "10px 16px",
      fontSize: 13, fontWeight: 500, zIndex: 200,
      boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
      transform: visible ? "translateY(0)" : "translateY(60px)",
      opacity: visible ? 1 : 0,
      transition: "all 0.22s",
    }}>
      {msg}
    </div>
  );
}

// ── StatCard component ───────────────────────────────────────────────────────
function StatCard({ label, value, sub, valueColor }) {
  return (
    <div style={{ background: "#f5f4f0", borderRadius: 8, padding: "11px 13px" }}>
      <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 500, color: valueColor || "#1a1a1a" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ── BarRow component ─────────────────────────────────────────────────────────
function BarRow({ label, pct, count, barColor = "#3B8BD4" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7, fontSize: 11 }}>
      <span style={{ width: 38, textAlign: "right", color: "#888" }}>{label}</span>
      <div style={{ flex: 1, background: "#eee", borderRadius: 3, height: 14, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: barColor, transition: "width 0.5s ease" }} />
      </div>
      <span style={{ width: 38, fontWeight: 500, color: "#888" }}>{count}</span>
    </div>
  );
}

// ── Table wrapper ─────────────────────────────────────────────────────────────
function TableWrap({ children }) {
  return (
    <div style={{ background: "#fff", border: "0.5px solid #e0e0e0", borderRadius: 8, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        {children}
      </table>
    </div>
  );
}

const thStyle = {
  textAlign: "left", fontSize: 11, fontWeight: 500, color: "#888",
  padding: "7px 10px", borderBottom: "0.5px solid #e0e0e0",
  background: "#f5f4f0",
};
const tdStyle = { padding: "8px 10px", borderBottom: "0.5px solid #e0e0e0", verticalAlign: "middle" };

// ── Entry Modal ───────────────────────────────────────────────────────────────
function EntryModal({ open, onClose, availableSlots, onSubmit }) {
  const [vehicle, setVehicle] = useState("");
  const [type, setType] = useState("Car");
  const [slot, setSlot] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (open) { setVehicle(""); setType("Car"); setName(""); setSlot(availableSlots[0] || ""); }
  }, [open]);

  useEffect(() => { setSlot(availableSlots[0] || ""); }, [availableSlots.length]);

  function handle() {
    const v = vehicle.trim().toUpperCase();
    if (!v) return alert("Enter vehicle number");
    if (!slot) return alert("No slot available");
    onSubmit({ vehicle: v, type, slot, name: name.trim() });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="🚗 Vehicle Entry">
      <FormField label="Vehicle Number *">
        <input style={inputStyle} value={vehicle} placeholder="e.g. KA01AB1234"
          onChange={(e) => setVehicle(e.target.value.toUpperCase())} />
      </FormField>
      <FormField label="Vehicle Type">
        <select style={inputStyle} value={type} onChange={(e) => setType(e.target.value)}>
          {["Car","Bike","SUV","Truck"].map(t => <option key={t}>{t}</option>)}
        </select>
      </FormField>
      <FormField label="Assign Slot *">
        <select style={inputStyle} value={slot} onChange={(e) => setSlot(e.target.value)}>
          {availableSlots.length === 0
            ? <option>No slots available</option>
            : availableSlots.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </FormField>
      <FormField label="Driver / Owner Name">
        <input style={inputStyle} value={name} placeholder="Optional"
          onChange={(e) => setName(e.target.value)} />
      </FormField>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn color="green" onClick={handle}>✓ Confirm Entry</Btn>
      </div>
    </Modal>
  );
}

// ── Exit Modal ────────────────────────────────────────────────────────────────
function ExitModal({ open, onClose, activeEntries, onSubmit, prefill }) {
  const [vehicle, setVehicle] = useState("");
  const [method, setMethod] = useState("UPI");
  const [found, setFound] = useState(null);

  useEffect(() => {
    if (open) { const v = prefill || ""; setVehicle(v); setMethod("UPI"); lookup(v, activeEntries); }
  }, [open]);

  function lookup(v, entries) {
    const e = entries.find(e => e.vehicle === v.trim().toUpperCase());
    setFound(e || null);
  }

  function handleInput(v) {
    setVehicle(v.toUpperCase());
    lookup(v, activeEntries);
  }

  function handle() {
    if (!found) return;
    const d = durCalc(found.entryTime);
    onSubmit({ entry: found, method, charge: d.charge, duration: d.str });
    onClose();
  }

  const dur = found ? durCalc(found.entryTime) : null;

  return (
    <Modal open={open} onClose={onClose} title="🚪 Vehicle Exit">
      <FormField label="Vehicle Number *">
        <input style={inputStyle} value={vehicle} placeholder="e.g. KA01AB1234"
          onChange={(e) => handleInput(e.target.value)} />
      </FormField>

      {found && (
        <>
          <div style={{ background: "#f5f4f0", borderRadius: 8, padding: "10px 12px", fontSize: 12, marginBottom: 10 }}>
            {[["Vehicle", found.vehicle], ["Slot", found.slot], ["Entry time", fmtTime(found.entryTime)], ["Type", found.type]]
              .map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
                  <span style={{ color: "#888" }}>{k}</span>
                  <span style={{ fontWeight: 500 }}>{v}</span>
                </div>
              ))}
          </div>
          <div style={{ background: "#EAF3DE", borderRadius: 8, padding: "10px 12px", fontSize: 12, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
              <span style={{ color: "#666" }}>Duration</span>
              <span style={{ fontWeight: 500 }}>{dur.str}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
              <span style={{ color: "#666" }}>Charge (₹{RATE_PER_HOUR}/hr)</span>
              <span style={{ fontWeight: 500, color: "#27500A" }}>₹{dur.charge}</span>
            </div>
          </div>
          <FormField label="Payment Method">
            <select style={inputStyle} value={method} onChange={(e) => setMethod(e.target.value)}>
              {["UPI","Card","Cash"].map(m => <option key={m}>{m}</option>)}
            </select>
          </FormField>
        </>
      )}

      {!found && vehicle.length >= 6 && (
        <p style={{ color: "#A32D2D", fontSize: 12, padding: "8px 0" }}>⚠ Vehicle not found inside premises.</p>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
        <Btn onClick={onClose}>Cancel</Btn>
        {found && <Btn color="red" onClick={handle}>→ Process Exit & Pay</Btn>}
      </div>
    </Modal>
  );
}

// ── Dashboard page ────────────────────────────────────────────────────────────
function Dashboard({ slots, activeEntries, completedEntries, activity, revenue, onEntry, onExit, onQuickExit }) {
  const occ   = Object.values(slots).filter(v => v === "occ").length;
  const avail = Object.values(slots).filter(v => v === "avail").length;

  const zoneCount = (z) => {
    const keys = Object.keys(slots).filter(k => k.startsWith(z + "-"));
    return keys.filter(k => slots[k] === "occ").length;
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
        <StatCard label="Total Slots" value={80} sub="4 zones" />
        <StatCard label="Available" value={avail} valueColor="#3B6D11" sub={`${Math.round(avail/80*100)}% free`} />
        <StatCard label="Occupied"  value={occ}   valueColor="#A32D2D" sub={`${Math.round(occ/80*100)}% full`} />
        <StatCard label="Revenue Today" value={`₹${revenue.toLocaleString("en-IN")}`} sub="↑ 12% vs yesterday" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div style={{ background: "#fff", border: "0.5px solid #e0e0e0", borderRadius: 8, padding: 13 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 9 }}>Zone occupancy</div>
          {ZONES.map(z => {
            const cnt = zoneCount(z);
            return <BarRow key={z} label={z} pct={Math.round(cnt/20*100)} count={`${cnt}/20`} />;
          })}
        </div>
        <div style={{ background: "#fff", border: "0.5px solid #e0e0e0", borderRadius: 8, padding: 13 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 9 }}>Recent activity</div>
          {activity.slice(0, 5).map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 0", borderBottom: "0.5px solid #eee", fontSize: 12 }}>
              <span style={{ color: "#666" }}>{a.vehicle}</span>
              <Badge color={a.type === "Entered" ? "green" : a.type === "Exited" ? "red" : "amber"}>{a.type}</Badge>
              <span style={{ fontSize: 11, color: "#999" }}>{a.min} min ago</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "#fff", border: "0.5px solid #e0e0e0", borderRadius: 8, padding: 13 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: "#888" }}>Active entries</span>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn small color="green" onClick={onEntry}>↗ New Entry</Btn>
            <Btn small color="red"   onClick={onExit}>↗ Process Exit</Btn>
          </div>
        </div>
        <TableWrap>
          <thead>
            <tr>{["#","Vehicle","Slot","Entry time","Duration","Type","Action"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {activeEntries.length === 0 && (
              <tr><td colSpan={7} style={{ ...tdStyle, textAlign: "center", color: "#aaa", padding: 18 }}>No active vehicles</td></tr>
            )}
            {activeEntries.map(e => {
              const d = durCalc(e.entryTime);
              return (
                <tr key={e.id}>
                  <td style={tdStyle}>{e.id}</td>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>{e.vehicle}</td>
                  <td style={tdStyle}><Badge color="blue">{e.slot}</Badge></td>
                  <td style={tdStyle}>{fmtTime(e.entryTime)}</td>
                  <td style={tdStyle}>{d.str}</td>
                  <td style={tdStyle}>{e.type}</td>
                  <td style={tdStyle}>
                    <Btn small color="red" onClick={() => onQuickExit(e.vehicle)}>Exit</Btn>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      </div>
    </div>
  );
}

// ── Slots page ────────────────────────────────────────────────────────────────
function SlotsPage({ slots, onEntry, onExit }) {
  const slotStyle = (st) => ({
    aspectRatio: 1, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 9, fontWeight: 500, cursor: "pointer", transition: "transform 0.1s", border: "0.5px solid",
    ...(st === "avail" ? { background: "#EAF3DE", color: "#3B6D11", borderColor: "#C0DD97" }
      : st === "occ"  ? { background: "#FCEBEB", color: "#A32D2D", borderColor: "#F7C1C1" }
                       : { background: "#FAEEDA", color: "#854F0B", borderColor: "#FAC775" }),
  });

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 12, fontSize: 12, alignItems: "center", flexWrap: "wrap" }}>
        {[["#EAF3DE","#C0DD97","Available"],["#FCEBEB","#F7C1C1","Occupied"],["#FAEEDA","#FAC775","Reserved"]].map(([bg,bd,lbl]) => (
          <span key={lbl} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 12, height: 12, background: bg, borderRadius: 2, border: `0.5px solid ${bd}`, display: "inline-block" }} />
            {lbl}
          </span>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <Btn small color="green" onClick={onEntry}>↗ New Entry</Btn>
          <Btn small color="red"   onClick={onExit}>↗ Process Exit</Btn>
        </div>
      </div>
      {ZONES.map(z => (
        <div key={z}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 8 }}>Zone {z} ({(ZONES.indexOf(z)*20)+1}–{(ZONES.indexOf(z)+1)*20})</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(10,1fr)", gap: 5, marginBottom: 14 }}>
            {Array.from({ length: 20 }, (_, i) => {
              const k = `${z}-${String(i+1).padStart(2,"0")}`;
              const st = slots[k];
              return <div key={k} style={slotStyle(st)} title={`${k} — ${st==="avail"?"Available":st==="occ"?"Occupied":"Reserved"}`}>{k}</div>;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Entries page ──────────────────────────────────────────────────────────────
function EntriesPage({ activeEntries, completedEntries, onEntry, onExit }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>Entry / Exit log</span>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn small color="green" onClick={onEntry}>↗ New Entry</Btn>
          <Btn small color="red"   onClick={onExit}>↗ Process Exit</Btn>
        </div>
      </div>
      <TableWrap>
        <thead>
          <tr>{["#","Vehicle","Slot","Entry","Exit","Duration","Amount","Status"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {activeEntries.map(e => {
            const d = durCalc(e.entryTime);
            return (
              <tr key={e.id}>
                <td style={tdStyle}>{e.id}</td>
                <td style={tdStyle}>{e.vehicle}</td>
                <td style={tdStyle}><Badge color="blue">{e.slot}</Badge></td>
                <td style={tdStyle}>{fmtTime(e.entryTime)}</td>
                <td style={tdStyle}>—</td>
                <td style={tdStyle}>{d.str}</td>
                <td style={tdStyle}>—</td>
                <td style={tdStyle}><Badge color="green">Inside</Badge></td>
              </tr>
            );
          })}
          {[...completedEntries].reverse().map(e => (
            <tr key={e.id}>
              <td style={tdStyle}>{e.id}</td>
              <td style={tdStyle}>{e.vehicle}</td>
              <td style={tdStyle}><Badge color="blue">{e.slot}</Badge></td>
              <td style={tdStyle}>{e.entryTime}</td>
              <td style={tdStyle}>{e.exitTime}</td>
              <td style={tdStyle}>{e.duration}</td>
              <td style={tdStyle}>₹{e.amount}</td>
              <td style={tdStyle}><Badge color="red">Exited</Badge></td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </div>
  );
}

// ── Payments page ─────────────────────────────────────────────────────────────
function PaymentsPage({ payments, revenue }) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 14 }}>
        <StatCard label="Today" value={`₹${revenue.toLocaleString("en-IN")}`} />
        <StatCard label="This week"  value="₹28,450" />
        <StatCard label="This month" value="₹1,12,300" />
      </div>
      <TableWrap>
        <thead>
          <tr>{["Txn ID","Entry #","Vehicle","Amount","Method","Time","Status"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {[...payments].reverse().map(p => (
            <tr key={p.txn}>
              <td style={tdStyle}>{p.txn}</td>
              <td style={tdStyle}>{p.entry}</td>
              <td style={tdStyle}>{p.vehicle}</td>
              <td style={tdStyle}>₹{p.amount}</td>
              <td style={tdStyle}>{p.method}</td>
              <td style={tdStyle}>{p.time}</td>
              <td style={tdStyle}><Badge color="green">Paid</Badge></td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </div>
  );
}

// ── Bookings page ─────────────────────────────────────────────────────────────
function BookingsPage() {
  const data = [
    { id:"B201", user:"Arjun K.", vehicle:"KA01AB1234", slot:"A-04", date:"Today", time:"2:00–4:00 PM", status:"Pending", color:"amber" },
    { id:"B200", user:"Priya S.", vehicle:"MH09ZZ0099", slot:"C-11", date:"Today", time:"12:00–1:30 PM", status:"Confirmed", color:"green" },
    { id:"B199", user:"Rahul M.", vehicle:"TN01AA5544", slot:"B-06", date:"Yesterday", time:"10:00 AM–12:00 PM", status:"Completed", color:"red" },
  ];
  return (
    <TableWrap>
      <thead>
        <tr>{["#","User","Vehicle","Slot","Date","Time","Status"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
      </thead>
      <tbody>
        {data.map(b => (
          <tr key={b.id}>
            <td style={tdStyle}>{b.id}</td>
            <td style={tdStyle}>{b.user}</td>
            <td style={tdStyle}>{b.vehicle}</td>
            <td style={tdStyle}><Badge color="blue">{b.slot}</Badge></td>
            <td style={tdStyle}>{b.date}</td>
            <td style={tdStyle}>{b.time}</td>
            <td style={tdStyle}><Badge color={b.color}>{b.status}</Badge></td>
          </tr>
        ))}
      </tbody>
    </TableWrap>
  );
}

// ── Users page ────────────────────────────────────────────────────────────────
function UsersPage() {
  const users = [
    { id:"U001", name:"Arjun Kumar",  phone:"9876543210", vehicles:2, visits:34, role:"User",  color:"blue" },
    { id:"U002", name:"Priya Sharma", phone:"9123456780", vehicles:1, visits:12, role:"User",  color:"blue" },
    { id:"U003", name:"Admin Raj",    phone:"9000000001", vehicles:0, visits:0,  role:"Admin", color:"amber" },
  ];
  return (
    <TableWrap>
      <thead>
        <tr>{["ID","Name","Phone","Vehicles","Total Visits","Role"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
      </thead>
      <tbody>
        {users.map(u => (
          <tr key={u.id}>
            <td style={tdStyle}>{u.id}</td>
            <td style={tdStyle}>{u.name}</td>
            <td style={tdStyle}>{u.phone}</td>
            <td style={tdStyle}>{u.vehicles}</td>
            <td style={tdStyle}>{u.visits || "—"}</td>
            <td style={tdStyle}><Badge color={u.color}>{u.role}</Badge></td>
          </tr>
        ))}
      </tbody>
    </TableWrap>
  );
}

// ── Reports page ──────────────────────────────────────────────────────────────
function ReportsPage() {
  const hourly = [["6AM",3],["7AM",8],["8AM",14],["9AM",18],["10AM",12],["11AM",9],["12PM",6]];
  const maxH = Math.max(...hourly.map(h=>h[1]));
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <div style={{ background: "#fff", border: "0.5px solid #e0e0e0", borderRadius: 8, padding: 13 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 9 }}>Hourly entries today</div>
        {hourly.map(([h,c]) => <BarRow key={h} label={h} pct={Math.round(c/maxH*100)} count={c} />)}
      </div>
      <div style={{ background: "#fff", border: "0.5px solid #e0e0e0", borderRadius: 8, padding: 13 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 9 }}>Payment methods</div>
        <BarRow label="UPI"  pct={60} count="60%" barColor="#3B8BD4" />
        <BarRow label="Card" pct={25} count="25%" barColor="#1D9E75" />
        <BarRow label="Cash" pct={15} count="15%" barColor="#BA7517" />
        <div style={{ fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 9, marginTop: 14 }}>Vehicle types</div>
        <BarRow label="Car"  pct={70} count="70%" barColor="#3B8BD4" />
        <BarRow label="Bike" pct={22} count="22%" barColor="#533AB7" />
        <BarRow label="SUV"  pct={8}  count="8%"  barColor="#D85A30" />
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage]               = useState("dash");
  const [slots, setSlots]             = useState(buildInitSlots);
  const [activeEntries, setActive]    = useState([
    { id:1024, vehicle:"KA01AB1234", slot:"A-02", entryTime: new Date(Date.now()-8040000), type:"Car", name:"" },
    { id:1023, vehicle:"MH04XY9988", slot:"B-07", entryTime: new Date(Date.now()-12780000), type:"Car", name:"" },
    { id:1022, vehicle:"TN09PQ1122", slot:"A-11", entryTime: new Date(Date.now()-6480000), type:"Bike", name:"" },
  ]);
  const [completedEntries, setDone]   = useState([
    { id:1021, vehicle:"MH04CD5678", slot:"B-15", entryTime:"08:00", exitTime:"12:45", duration:"4h 45m", amount:190, method:"UPI" },
    { id:1020, vehicle:"TN09EF9012", slot:"C-04", entryTime:"07:30", exitTime:"11:00", duration:"3h 30m", amount:140, method:"Card" },
  ]);
  const [payments, setPayments]       = useState([
    { txn:"TXN8801", entry:1021, vehicle:"MH04CD5678", amount:190, method:"UPI", time:"12:46 PM" },
    { txn:"TXN8800", entry:1020, vehicle:"TN09EF9012", amount:140, method:"Card", time:"11:01 AM" },
  ]);
  const [activity, setActivity]       = useState([
    { vehicle:"KA01AB1234", type:"Entered", min:2 },
    { vehicle:"MH04CD5678", type:"Exited",  min:5 },
    { vehicle:"TN09EF9012", type:"Booked",  min:8 },
  ]);
  const [revenue, setRevenue]         = useState(4820);
  const [entryIdCounter, setEntryId]  = useState(1025);
  const [txnIdCounter, setTxnId]      = useState(8802);
  const [clock, setClock]             = useState("--:--");
  const [entryOpen, setEntryOpen]     = useState(false);
  const [exitOpen, setExitOpen]       = useState(false);
  const [exitPrefill, setExitPrefill] = useState("");
  const [toast, setToast]             = useState({ msg:"", type:"success", visible:false });

  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})), 1000);
    return () => clearInterval(t);
  }, []);

  const showToast = useCallback((msg, type="success") => {
    setToast({ msg, type, visible:true });
    setTimeout(() => setToast(t => ({ ...t, visible:false })), 3000);
  }, []);

  const availableSlots = Object.keys(slots).filter(k => slots[k] === "avail").sort();

  function handleEntry({ vehicle, type, slot, name }) {
    if (activeEntries.find(e => e.vehicle === vehicle)) {
      showToast("Vehicle already inside!", "error"); return;
    }
    const id = entryIdCounter;
    setEntryId(id + 1);
    setSlots(s => ({ ...s, [slot]: "occ" }));
    setActive(a => [...a, { id, vehicle, slot, entryTime: new Date(), type, name }]);
    setActivity(a => [{ vehicle, type:"Entered", min:0 }, ...a.slice(0,9)]);
    showToast(`✓ ${vehicle} entered → ${slot}`);
  }

  function handleExit({ entry, method, charge, duration }) {
    const now = new Date();
    const exitStr = fmtTime(now);
    const entryStr = fmtTime(entry.entryTime);
    const txn = "TXN" + txnIdCounter;
    setTxnId(n => n + 1);
    setSlots(s => ({ ...s, [entry.slot]: "avail" }));
    setActive(a => a.filter(e => e.id !== entry.id));
    setDone(d => [...d, { id:entry.id, vehicle:entry.vehicle, slot:entry.slot, entryTime:entryStr, exitTime:exitStr, duration, amount:charge, method }]);
    setPayments(p => [...p, { txn, entry:entry.id, vehicle:entry.vehicle, amount:charge, method, time:exitStr }]);
    setRevenue(r => r + charge);
    setActivity(a => [{ vehicle:entry.vehicle, type:"Exited", min:0 }, ...a.slice(0,9)]);
    showToast(`✓ ${entry.vehicle} exited — ₹${charge} collected`);
  }

  function quickExit(vehicle) {
    setExitPrefill(vehicle);
    setExitOpen(true);
  }

  const navItems = [
    { id:"dash",     icon:"layout-dashboard", label:"Dashboard" },
    { id:"slots",    icon:"parking",           label:"Slots" },
    { id:"entries",  icon:"car",               label:"Entries" },
    { id:"bookings", icon:"calendar-check",    label:"Bookings" },
    { id:"payments", icon:"credit-card",       label:"Payments" },
    { id:"users",    icon:"users",             label:"Users" },
    { id:"reports",  icon:"chart-bar",         label:"Reports" },
  ];

  const pageTitle = navItems.find(n => n.id === page)?.label || "Dashboard";

  return (
    <div style={{ display:"flex", height:"100vh", fontFamily:"system-ui,sans-serif", fontSize:14, color:"#1a1a1a", background:"#f5f4f0" }}>
      <nav style={{ width:178, background:"#f0efe9", borderRight:"0.5px solid #ddd", display:"flex", flexDirection:"column", padding:"16px 0", flexShrink:0 }}>
        <div style={{ fontSize:11, fontWeight:500, color:"#888", padding:"0 16px 14px", letterSpacing:"0.06em", textTransform:"uppercase" }}>
          Smart Parking
        </div>
        {navItems.map(n => (
          <div key={n.id}
            onClick={() => setPage(n.id)}
            style={{
              display:"flex", alignItems:"center", gap:10, padding:"9px 16px",
              cursor:"pointer", fontSize:13,
              color: page===n.id ? "#1a1a1a" : "#888",
              background: page===n.id ? "#fff" : "transparent",
              borderLeft: `2px solid ${page===n.id ? "#3B8BD4" : "transparent"}`,
              fontWeight: page===n.id ? 500 : 400,
              transition:"all 0.13s",
            }}
          >
            <i className={`ti ti-${n.icon}`} aria-hidden="true" style={{ fontSize:16, width:18 }} />
            {n.label}
          </div>
        ))}
      </nav>

      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>
        <div style={{ padding:"12px 18px", borderBottom:"0.5px solid #ddd", display:"flex", alignItems:"center", justifyContent:"space-between", background:"#fff", flexShrink:0 }}>
          <span style={{ fontSize:15, fontWeight:500 }}>{pageTitle}</span>
          <div style={{ display:"flex", alignItems:"center", gap:10, fontSize:12, color:"#888" }}>
            <span>{clock}</span>
            <Btn small color="green" onClick={() => setEntryOpen(true)}>↗ Entry</Btn>
            <Btn small color="red"   onClick={() => { setExitPrefill(""); setExitOpen(true); }}>↗ Exit</Btn>
          </div>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"16px 18px" }}>
          {page==="dash"     && <Dashboard slots={slots} activeEntries={activeEntries} completedEntries={completedEntries} activity={activity} revenue={revenue} onEntry={()=>setEntryOpen(true)} onExit={()=>{setExitPrefill("");setExitOpen(true);}} onQuickExit={quickExit} />}
          {page==="slots"    && <SlotsPage slots={slots} onEntry={()=>setEntryOpen(true)} onExit={()=>{setExitPrefill("");setExitOpen(true);}} />}
          {page==="entries"  && <EntriesPage activeEntries={activeEntries} completedEntries={completedEntries} onEntry={()=>setEntryOpen(true)} onExit={()=>{setExitPrefill("");setExitOpen(true);}} />}
          {page==="bookings" && <BookingsPage />}
          {page==="payments" && <PaymentsPage payments={payments} revenue={revenue} />}
          {page==="users"    && <UsersPage />}
          {page==="reports"  && <ReportsPage />}
        </div>
      </div>

      <EntryModal
        open={entryOpen}
        onClose={() => setEntryOpen(false)}
        availableSlots={availableSlots}
        onSubmit={handleEntry}
      />
      <ExitModal
        open={exitOpen}
        onClose={() => setExitOpen(false)}
        activeEntries={activeEntries}
        onSubmit={handleExit}
        prefill={exitPrefill}
      />

      <Toast msg={toast.msg} type={toast.type} visible={toast.visible} />
    </div>
  );
}