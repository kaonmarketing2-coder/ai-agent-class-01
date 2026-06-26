const { useState, useEffect, useCallback } = React;

const SUPABASE_URL = "https://mrdmywosqzaqukdfvbzv.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yZG15d29zcXphcXVrZGZ2Ynp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzIzNTksImV4cCI6MjA4OTU0ODM1OX0.D2PKVx9cqyAg-qIpKdtUX9z9AwdjDwNgo6Nsyy4vdNM";

// ⚠️ 비밀번호 변경 시 이 값을 수정하세요
const DASHBOARD_PASSWORD = "kaon2025";

const HEADERS = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
};

const DEPARTMENTS = [
  { id: "d1", name: "RM본부/제조관리그룹", sub: "구매·물류·자재", total: 24 },
  { id: "d2", name: "RM본부/원가관리그룹", sub: "", total: 6 },
  { id: "d3", name: "RM본부/품질혁신그룹", sub: "CS·품질관리·QA·제조기술·자동화솔루션", total: 28 },
];

const G1 = { label: "Group 1", date: "7/8~7/9", color: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE", tag: "#DBEAFE", tagText: "#1E40AF" };
const G2 = { label: "Group 2", date: "7/13~7/14", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", tag: "#EDE9FE", tagText: "#5B21B6" };

// ── 비고: 이름/사유 구조 ──────────────────────────────
// JSON 문자열로 저장됨. 기존 plain text도 역호환 파싱.
function parseNote(note) {
  if (!note) return [];
  try {
    const parsed = JSON.parse(note);
    if (Array.isArray(parsed)) {
      return parsed
        .map(it => ({ name: (it && it.name || "").trim(), reason: (it && it.reason || "").trim() }))
        .filter(it => it.name || it.reason);
    }
  } catch (e) { /* 기존 plain text */ }
  return [{ name: "", reason: String(note).trim() }];
}

// CSV/텍스트용: "이름: 사유" 형식, 여러 항목은 " / "로 연결
function noteToText(note) {
  return parseNote(note)
    .map(it => it.name && it.reason ? `${it.name}: ${it.reason}` : (it.name || it.reason))
    .join(" / ");
}

// 화면 표시용: 이름/사유 분리 렌더
function NoteDisplay({ note }) {
  const items = parseNote(note);
  if (!items.length) return null;
  return (
    <div style={{ background: "#F8FAFC", borderRadius: 6, padding: "6px 10px", marginBottom: 8 }}>
      {items.map((it, i) => (
        <div key={i} style={{ fontSize: 12, color: "#64748B", lineHeight: 1.7 }}>
          📝 {it.name && <span style={{ fontWeight: 700, color: "#475569" }}>{it.name}</span>}
          {it.name && it.reason && <span style={{ color: "#94A3B8" }}> · </span>}
          {it.reason}
        </div>
      ))}
    </div>
  );
}

async function fetchSubmissions() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/training_submissions?select=*&order=submitted_at.desc`,
    { headers: HEADERS }
  );
  if (!res.ok) throw new Error("데이터 조회 실패");
  return res.json();
}

async function deleteSubmission(id) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/training_submissions?id=eq.${id}`,
    { method: "DELETE", headers: { ...HEADERS, "Content-Type": "application/json" } }
  );
  return res.ok;
}

function exportCSV(rows) {
  const header = ["부서명", "제출자", "Group1 인원", "Group1 명단", "Group2 인원", "Group2 명단", "비고", "인원 상태", "제출일시"];
  const lines = [
    header.join(","),
    ...rows.map(r => {
      const total = (r.g1_count || 0) + (r.g2_count || 0);
      const dept = DEPARTMENTS.find(d => d.id === r.department_id);
      const diff = dept ? total - dept.total : 0;
      const statusText = diff === 0 ? "일치" : diff > 0 ? `${diff}명 초과` : `${Math.abs(diff)}명 부족`;
      return [
        `"${r.department_name}"`,
        `"${r.submitter}"`,
        r.g1_count,
        `"${(r.g1_names || "").replace(/\n/g, " / ")}"`,
        r.g2_count,
        `"${(r.g2_names || "").replace(/\n/g, " / ")}"`,
        `"${noteToText(r.note)}"`,
        `"${statusText}"`,
        `"${new Date(r.submitted_at).toLocaleString("ko-KR")}"`,
      ].join(",");
    }),
  ];
  const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "교육배정현황.csv"; a.click();
}

// ── 비밀번호 화면 ──────────────────────────────────────
function PasswordGate({ onSuccess }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const tryLogin = () => {
    if (pw === DASHBOARD_PASSWORD) {
      onSuccess();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPw("");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0F172A", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{
        background: "#1E293B", borderRadius: 20, padding: "48px 40px", width: "100%", maxWidth: 380,
        boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
        transform: shake ? "translateX(-6px)" : "none",
        transition: "transform 0.1s",
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
          <h2 style={{ margin: "0 0 6px", color: "#F1F5F9", fontSize: 20, fontWeight: 700 }}>관리자 대시보드</h2>
          <p style={{ margin: 0, color: "#64748B", fontSize: 13 }}>교육 배정 현황 조회 · Group 1+2</p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8", display: "block", marginBottom: 8 }}>비밀번호</label>
          <input
            type="password"
            value={pw}
            onChange={e => { setPw(e.target.value); setError(false); }}
            onKeyDown={e => e.key === "Enter" && tryLogin()}
            placeholder="비밀번호를 입력하세요"
            autoFocus
            style={{
              width: "100%", boxSizing: "border-box",
              background: "#0F172A", border: `1.5px solid ${error ? "#EF4444" : "#334155"}`,
              borderRadius: 10, padding: "12px 14px", fontSize: 14, color: "#F1F5F9",
              outline: "none", fontFamily: "inherit",
            }}
          />
          {error && (
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "#EF4444" }}>비밀번호가 올바르지 않습니다.</p>
          )}
        </div>

        <button onClick={tryLogin}
          style={{ width: "100%", padding: "13px", background: "#2563EB", color: "#fff",
            border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          입장하기
        </button>
      </div>
    </div>
  );
}

// ── 메인 대시보드 ──────────────────────────────────────
function Dashboard({ onLock }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setRows(await fetchSubmissions()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // 부서별 최신 제출 (대표값으로 사용)
  const latestByDept = DEPARTMENTS.map(dept => ({
    dept,
    latest: rows.find(r => r.department_id === dept.id) || null,
    allRows: rows.filter(r => r.department_id === dept.id),
  }));

  const submittedCount = latestByDept.filter(x => x.latest).length;
  const totalG1 = latestByDept.reduce((s, x) => s + (x.latest?.g1_count || 0), 0);
  const totalG2 = latestByDept.reduce((s, x) => s + (x.latest?.g2_count || 0), 0);

  const handleDelete = async (id, deptName) => {
    if (!window.confirm(`"${deptName}" 제출 내역을 삭제하시겠습니까?`)) return;
    setDeleting(id);
    await deleteSubmission(id);
    await load();
    setDeleting(null);
  };

  const getCountStatus = (row, dept) => {
    const total = (row.g1_count || 0) + (row.g2_count || 0);
    const diff = total - dept.total;
    if (diff === 0) return { text: "인원 일치", color: "#16A34A", bg: "#DCFCE7" };
    if (diff > 0) return { text: `${diff}명 초과`, color: "#DC2626", bg: "#FEF2F2" };
    return { text: `${Math.abs(diff)}명 부족`, color: "#D97706", bg: "#FFFBEB" };
  };

  return (
    <div style={{ fontFamily: "'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif",
      background: "#F1F5F9", minHeight: "100vh", padding: "28px 16px" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>

        {/* 헤더 */}
        <div style={{ background: "#0F172A", borderRadius: 16, padding: "24px 28px", marginBottom: 20, color: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "#94A3B8", letterSpacing: 1, marginBottom: 8 }}>ADMIN · GROUP 1·2</div>
              <h1 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: "#F1F5F9" }}>교육 배정 현황 대시보드</h1>
              <p style={{ margin: 0, fontSize: 12, color: "#64748B" }}>전체 제출 이력 포함 · 중복 제출 모두 기록</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={load}
                style={{ padding: "8px 14px", background: "#1E293B", color: "#94A3B8", border: "1px solid #334155", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>
                🔄 새로고침
              </button>
              <button onClick={() => rows.length && exportCSV(latestByDept.filter(x => x.latest).map(x => x.latest))}
                disabled={!rows.length}
                style={{ padding: "8px 14px", background: rows.length ? "#2563EB" : "#1E293B",
                  color: rows.length ? "#fff" : "#475569", border: "none", borderRadius: 8, fontSize: 12,
                  cursor: rows.length ? "pointer" : "not-allowed" }}>
                📥 CSV
              </button>
              <button onClick={onLock}
                style={{ padding: "8px 14px", background: "#1E293B", color: "#64748B", border: "1px solid #334155", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>
                🔒 잠금
              </button>
            </div>
          </div>

          {/* 요약 카드 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 20 }}>
            {[
              { label: "제출 완료", value: `${submittedCount}/${DEPARTMENTS.length}`, sub: "부서", color: "#38BDF8" },
              { label: "전체 제출 수", value: rows.length, sub: "건", color: "#FB923C" },
              { label: "Group 1 배정", value: totalG1, sub: "명", color: "#93C5FD" },
              { label: "Group 2 배정", value: totalG2, sub: "명", color: "#C4B5FD" },
            ].map(card => (
              <div key={card.label} style={{ background: "#1E293B", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: "#64748B", marginBottom: 4 }}>{card.label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontSize: 22, fontWeight: 700, color: card.color }}>{card.value}</span>
                  <span style={{ fontSize: 11, color: "#64748B" }}>{card.sub}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, background: "#1E293B", borderRadius: 99, height: 6, overflow: "hidden" }}>
              <div style={{ width: `${(submittedCount / DEPARTMENTS.length) * 100}%`, height: "100%",
                background: "#38BDF8", borderRadius: 99, transition: "width 0.5s" }} />
            </div>
            <span style={{ fontSize: 12, color: "#94A3B8", whiteSpace: "nowrap" }}>
              {Math.round((submittedCount / DEPARTMENTS.length) * 100)}% 완료
            </span>
          </div>
        </div>

        {/* 탭 */}
        <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "#E2E8F0", borderRadius: 10, padding: 4 }}>
          {[["overview", "📋 부서별 현황"], ["names", "👥 명단 상세"], ["history", "🕘 전체 이력"]].map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              style={{ flex: 1, padding: "9px 0", border: "none", borderRadius: 8, cursor: "pointer",
                fontSize: 13, fontWeight: 600,
                background: activeTab === key ? "#fff" : "transparent",
                color: activeTab === key ? "#0F172A" : "#64748B",
                boxShadow: activeTab === key ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}>
              {label}
            </button>
          ))}
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#64748B", fontSize: 14 }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>⏳</div>데이터를 불러오는 중...
          </div>
        )}
        {error && !loading && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12,
            padding: "20px", textAlign: "center", color: "#DC2626", fontSize: 13 }}>
            ⚠️ {error}
            <button onClick={load} style={{ marginLeft: 12, padding: "4px 12px", background: "#DC2626",
              color: "#fff", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>재시도</button>
          </div>
        )}

        {/* 탭: 부서별 현황 */}
        {!loading && !error && activeTab === "overview" && (
          <div>
            {latestByDept.map(({ dept, latest, allRows }) => {
              const status = latest ? getCountStatus(latest, dept) : null;
              return (
                <div key={dept.id} style={{ background: "#fff",
                  border: `1.5px solid ${latest ? "#E2E8F0" : "#FEE2E2"}`,
                  borderRadius: 12, marginBottom: 12, overflow: "hidden" }}>
                  <div style={{ padding: "14px 18px", background: latest ? "#F8FAFC" : "#FEF2F2",
                    borderBottom: `1px solid ${latest ? "#E2E8F0" : "#FECACA"}`,
                    display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{dept.name}</div>
                      {dept.sub && <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>{dept.sub}</div>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {allRows.length > 1 && (
                        <span style={{ fontSize: 11, color: "#F59E0B", background: "#FFFBEB",
                          border: "1px solid #FDE68A", borderRadius: 99, padding: "2px 8px", fontWeight: 600 }}>
                          재제출 {allRows.length}건
                        </span>
                      )}
                      {status && (
                        <span style={{ fontSize: 11, fontWeight: 600, color: status.color,
                          background: status.bg, borderRadius: 99, padding: "2px 8px" }}>{status.text}</span>
                      )}
                      <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                        background: latest ? "#DCFCE7" : "#FEE2E2",
                        color: latest ? "#166534" : "#DC2626" }}>
                        {latest ? "✓ 제출완료" : "미제출"}
                      </span>
                    </div>
                  </div>

                  {latest ? (
                    <div style={{ padding: "14px 18px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                        {[{ g: G1, count: latest.g1_count }, { g: G2, count: latest.g2_count }].map(({ g, count }) => (
                          <div key={g.label} style={{ background: g.bg, border: `1px solid ${g.border}`,
                            borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: g.color }}>{g.label}</div>
                              <div style={{ fontSize: 11, color: "#94A3B8" }}>{g.date}</div>
                            </div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: g.color }}>{count}<span style={{ fontSize: 12 }}>명</span></div>
                          </div>
                        ))}
                      </div>
                      <NoteDisplay note={latest.note} />
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94A3B8" }}>
                        <span>최신 제출: {latest.submitter} · {new Date(latest.submitted_at).toLocaleString("ko-KR")}</span>
                        <button onClick={() => handleDelete(latest.id, dept.name)}
                          disabled={deleting === latest.id}
                          style={{ fontSize: 11, color: "#EF4444", background: "none", border: "1px solid #FECACA",
                            borderRadius: 6, padding: "3px 10px", cursor: "pointer" }}>
                          {deleting === latest.id ? "삭제 중..." : "최신 삭제"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: "14px 18px", fontSize: 13, color: "#94A3B8" }}>아직 제출되지 않았습니다.</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 탭: 명단 상세 */}
        {!loading && !error && activeTab === "names" && (
          <div>
            {[{ g: G1, key: "g1" }, { g: G2, key: "g2" }].map(({ g, key }) => (
              <div key={g.label} style={{ background: "#fff", border: `1.5px solid ${g.border}`,
                borderRadius: 12, marginBottom: 16, overflow: "hidden" }}>
                <div style={{ padding: "14px 18px", background: g.bg, borderBottom: `1px solid ${g.border}` }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: g.color }}>{g.label}</div>
                  <div style={{ fontSize: 12, color: g.color, opacity: 0.8 }}>📅 {g.date} · 2일 전일 필수 참석</div>
                </div>
                <div style={{ padding: "14px 18px" }}>
                  {latestByDept.filter(x => x.latest && x.latest[`${key}_count`] > 0).map(({ dept, latest }) => {
                    const names = (latest[`${key}_names`] || "").split("\n").filter(n => n.trim());
                    return (
                      <div key={dept.id} style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6,
                          display: "flex", justifyContent: "space-between" }}>
                          <span>{dept.name}</span>
                          <span style={{ background: g.tag, color: g.tagText, borderRadius: 99, fontSize: 11, padding: "2px 8px" }}>
                            {latest[`${key}_count`]}명
                          </span>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {names.map((name, i) => (
                            <span key={i} style={{ background: "#F1F5F9", color: "#334155",
                              borderRadius: 99, fontSize: 12, padding: "3px 10px", border: "1px solid #E2E8F0" }}>
                              {name.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {latestByDept.every(x => !x.latest || !x.latest[`${key}_count`]) && (
                    <div style={{ color: "#94A3B8", fontSize: 13 }}>아직 배정된 인원이 없습니다.</div>
                  )}
                  {latestByDept.some(x => x.latest && x.latest[`${key}_count`] > 0) && (
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #E2E8F0",
                      display: "flex", justifyContent: "flex-end", fontSize: 13, fontWeight: 700, color: g.color }}>
                      총 {latestByDept.reduce((s, x) => s + (x.latest?.[`${key}_count`] || 0), 0)}명
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 탭: 전체 이력 */}
        {!loading && !error && activeTab === "history" && (
          <div>
            <div style={{ fontSize: 13, color: "#64748B", marginBottom: 12, padding: "0 2px" }}>
              총 {rows.length}건의 제출 이력 (최신순) · 같은 부서가 여러 번 제출한 경우 모두 표시됩니다.
            </div>
            {rows.length === 0 && (
              <div style={{ background: "#fff", borderRadius: 12, padding: "40px", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
                아직 제출된 내역이 없습니다.
              </div>
            )}
            {rows.map((row, i) => {
              const dept = DEPARTMENTS.find(d => d.id === row.department_id);
              const status = dept ? getCountStatus(row, dept) : null;
              const isLatest = latestByDept.find(x => x.latest?.id === row.id);
              return (
                <div key={row.id} style={{ background: "#fff", border: "1.5px solid #E2E8F0",
                  borderRadius: 12, marginBottom: 10, overflow: "hidden" }}>
                  <div style={{ padding: "12px 16px", background: "#F8FAFC",
                    borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>#{rows.length - i}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{row.department_name}</span>
                      {isLatest && (
                        <span style={{ fontSize: 10, background: "#DCFCE7", color: "#166534",
                          borderRadius: 99, padding: "2px 7px", fontWeight: 700 }}>최신</span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {status && (
                        <span style={{ fontSize: 11, color: status.color, background: status.bg,
                          borderRadius: 99, padding: "2px 8px", fontWeight: 600 }}>{status.text}</span>
                      )}
                      <span style={{ fontSize: 11, color: "#94A3B8" }}>{new Date(row.submitted_at).toLocaleString("ko-KR")}</span>
                      <button onClick={() => handleDelete(row.id, row.department_name)}
                        disabled={deleting === row.id}
                        style={{ fontSize: 11, color: "#EF4444", background: "none", border: "1px solid #FECACA",
                          borderRadius: 6, padding: "3px 8px", cursor: "pointer" }}>
                        {deleting === row.id ? "..." : "삭제"}
                      </button>
                    </div>
                  </div>
                  <div style={{ padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[{ g: G1, names: row.g1_names, count: row.g1_count }, { g: G2, names: row.g2_names, count: row.g2_count }].map(({ g, names, count }) => (
                      <div key={g.label} style={{ background: g.bg, border: `1px solid ${g.border}`, borderRadius: 8, padding: "8px 12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: g.color }}>{g.label}</span>
                          <span style={{ fontSize: 11, color: g.tagText, background: g.tag, borderRadius: 99, padding: "1px 6px" }}>{count}명</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.7 }}>
                          {(names || "").split("\n").filter(n => n.trim()).map((n, j) => <div key={j}>· {n}</div>)}
                          {!count && <span style={{ color: "#CBD5E1" }}>미배정</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                  {parseNote(row.note).length > 0 && (
                    <div style={{ padding: "0 16px 4px" }}>
                      <NoteDisplay note={row.note} />
                    </div>
                  )}
                  <div style={{ padding: "8px 16px", borderTop: "1px solid #E2E8F0", fontSize: 11, color: "#94A3B8" }}>
                    <span>제출자: {row.submitter}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ textAlign: "center", padding: "16px 0 4px", fontSize: 11, color: "#94A3B8" }}>
          데이터: Supabase · kaon-mentoring
        </div>
      </div>
    </div>
  );
}

// ── 루트: 비밀번호 게이트 + 대시보드 ───────────────────
function App() {
  const [unlocked, setUnlocked] = useState(false);
  return unlocked
    ? <Dashboard onLock={() => setUnlocked(false)} />
    : <PasswordGate onSuccess={() => setUnlocked(true)} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
  