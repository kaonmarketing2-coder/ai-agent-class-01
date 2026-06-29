const { useState } = React;

const SUPABASE_URL = "https://mrdmywosqzaqukdfvbzv.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yZG15d29zcXphcXVrZGZ2Ynp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzIzNTksImV4cCI6MjA4OTU0ODM1OX0.D2PKVx9cqyAg-qIpKdtUX9z9AwdjDwNgo6Nsyy4vdNM";

const HEADERS = {
  "Content-Type": "application/json",
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
};

const DEPARTMENTS = [
  { id: "d1", name: "RM본부/제조관리그룹", sub: "구매 · 물류 · 자재", total: 24 },
  { id: "d2", name: "RM본부/원가관리그룹", sub: "", total: 6 },
  { id: "d3", name: "RM본부/품질혁신그룹", sub: "CS · 품질관리 · QA · 제조기술 · 자동화솔루션", total: 28 },
];

const G1 = { label: "1차수", date: "7/8(화) ~ 7/9(수)", color: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE", tag: "#DBEAFE", tagText: "#1E40AF" };
const G2 = { label: "2차수", date: "7/13(월) ~ 7/14(화)", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", tag: "#EDE9FE", tagText: "#5B21B6" };

// ── 비고: 이름/사유 구조 ──────────────────────────────
// 저장은 JSON 문자열로, 기존 plain text도 역호환 파싱
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

function serializeNote(items) {
  const clean = (items || [])
    .map(it => ({ name: (it.name || "").trim(), reason: (it.reason || "").trim() }))
    .filter(it => it.name || it.reason);
  return clean.length ? JSON.stringify(clean) : "";
}

// 항상 새 레코드 INSERT (중복 허용, 모두 기록)
async function insertSubmission(dept, data) {
  const g1Names = data.g1Names.split("\n").filter(n => n.trim());
  const g2Names = data.g2Names.split("\n").filter(n => n.trim());
  const payload = {
    department_id: dept.id,
    department_name: dept.name,
    submitter: data.submitter,
    g1_names: data.g1Names,
    g1_count: g1Names.length,
    g2_names: data.g2Names,
    g2_count: g2Names.length,
    note: serializeNote(data.noteItems),
    submitted_at: new Date().toISOString(),
  };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/training_submissions`, {
    method: "POST",
    headers: { ...HEADERS, "Prefer": "return=representation" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("제출 실패. 잠시 후 다시 시도해주세요.");
  const result = await res.json();
  return result[0]?.id;
}

function NameInput({ value, onChange, placeholder, color }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={4}
      style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #E2E8F0", borderRadius: 8,
        padding: "10px 12px", fontSize: 13, lineHeight: 1.7, color: "#334155", resize: "vertical",
        outline: "none", fontFamily: "inherit", background: "#fff" }}
      onFocus={e => e.target.style.borderColor = color}
      onBlur={e => e.target.style.borderColor = "#E2E8F0"}
    />
  );
}

function DeptForm({ dept, data, onChange, onSubmitSuccess, isSubmitted, onEditRequest }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const g1Count = data.g1Names.split("\n").filter(n => n.trim()).length;
  const g2Count = data.g2Names.split("\n").filter(n => n.trim()).length;
  const total = g1Count + g2Count;
  const diff = total - dept.total;

  // 제출 조건: 제출자 이름만 있으면 됨 (인원 일치 불필요)
  const canSubmit = data.submitter.trim().length > 0;

  // 비고 행 편집 핸들러
  const noteItems = data.noteItems || [];
  const setNoteItems = next => onChange("noteItems", next);
  const onNoteChange = (idx, key, val) => setNoteItems(noteItems.map((it, i) => i === idx ? { ...it, [key]: val } : it));
  const onNoteAdd = () => setNoteItems([...noteItems, { name: "", reason: "" }]);
  const onNoteRemove = idx => setNoteItems(noteItems.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError("");
    try {
      const id = await insertSubmission(dept, data);
      onSubmitSuccess(id);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // 인원 상태 레이블
  const countStatus = () => {
    if (total === 0) return null;
    if (total === dept.total) return { text: "인원 일치", color: "#16A34A", bg: "#DCFCE7" };
    if (diff > 0) return { text: `${diff}명 초과`, color: "#DC2626", bg: "#FEF2F2" };
    return { text: `${Math.abs(diff)}명 부족`, color: "#D97706", bg: "#FFFBEB" };
  };
  const status = countStatus();

  return (
    <div style={{ background: isSubmitted ? "#F0FDF4" : "#fff",
      border: `1.5px solid ${isSubmitted ? "#86EFAC" : "#E2E8F0"}`,
      borderRadius: 14, overflow: "hidden", marginBottom: 16 }}>

      {/* 헤더 */}
      <div style={{ padding: "16px 20px", background: isSubmitted ? "#DCFCE7" : "#F8FAFC",
        borderBottom: `1px solid ${isSubmitted ? "#BBF7D0" : "#E2E8F0"}`,
        display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{dept.name}</div>
          {dept.sub && <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>{dept.sub}</div>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ background: "#E2E8F0", color: "#475569", borderRadius: 99, fontSize: 12, fontWeight: 700, padding: "3px 12px" }}>
            전체 {dept.total}명
          </span>
          {isSubmitted && (
            <span style={{ background: "#22C55E", color: "#fff", borderRadius: 99, fontSize: 11, fontWeight: 700, padding: "3px 12px" }}>
              ✓ 제출완료
            </span>
          )}
        </div>
      </div>

      {isSubmitted ? (
        <div style={{ padding: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            {[{ g: G1, names: data.g1Names, count: g1Count }, { g: G2, names: data.g2Names, count: g2Count }].map(({ g, names, count }) => (
              <div key={g.label} style={{ background: g.bg, border: `1px solid ${g.border}`, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: g.color }}>{g.label}</span>
                  <span style={{ background: g.tag, color: g.tagText, fontSize: 11, fontWeight: 700, borderRadius: 99, padding: "2px 8px" }}>{count}명</span>
                </div>
                <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.8 }}>
                  {names.split("\n").filter(n => n.trim()).length > 0
                    ? names.split("\n").filter(n => n.trim()).map((n, i) => <div key={i}>· {n}</div>)
                    : <span style={{ color: "#CBD5E1" }}>미배정</span>}
                </div>
              </div>
            ))}
          </div>
          {/* 인원 불일치 경고 유지 */}
          {total !== dept.total && total > 0 && (
            <div style={{ fontSize: 12, padding: "7px 12px", borderRadius: 8, marginBottom: 10,
              background: diff > 0 ? "#FEF2F2" : "#FFFBEB",
              color: diff > 0 ? "#DC2626" : "#D97706",
              border: `1px solid ${diff > 0 ? "#FECACA" : "#FDE68A"}` }}>
              ⚠️ 배정 인원({total}명)이 전체 인원({dept.total}명)과 {diff > 0 ? `${diff}명 초과` : `${Math.abs(diff)}명 부족`}합니다.
            </div>
          )}
          {noteItems.filter(it => (it.name || "").trim() || (it.reason || "").trim()).length > 0 && (
            <div style={{ background: "#F1F5F9", borderRadius: 8, padding: "10px 12px", marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>📝 비고</div>
              {noteItems.filter(it => (it.name || "").trim() || (it.reason || "").trim()).map((it, i) => (
                <div key={i} style={{ fontSize: 12, color: "#475569", lineHeight: 1.8 }}>
                  {it.name && <span style={{ fontWeight: 700, color: "#334155" }}>{it.name}</span>}
                  {it.name && it.reason && <span style={{ color: "#94A3B8" }}> · </span>}
                  {it.reason}
                </div>
              ))}
            </div>
          )}
          <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 10 }}>제출자: {data.submitter}</div>
          <button onClick={onEditRequest} style={{ fontSize: 12, color: "#64748B", background: "none",
            border: "1px solid #CBD5E1", borderRadius: 6, padding: "5px 14px", cursor: "pointer" }}>
            재제출하기
          </button>
        </div>
      ) : (
        <div style={{ padding: "20px" }}>
          {/* 제출자 */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>
              제출자 <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <input type="text" placeholder="이름 · 직책 (예: 홍길동 팀장)" value={data.submitter}
              onChange={e => onChange("submitter", e.target.value)}
              style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #E2E8F0", borderRadius: 8,
                padding: "10px 12px", fontSize: 13, outline: "none", color: "#1E293B", fontFamily: "inherit" }} />
          </div>

          <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8,
            padding: "10px 14px", marginBottom: 18, fontSize: 12, color: "#92400E" }}>
            💡 배정된 차수의 교육은 <strong>2일 전일 필수 참석</strong>입니다. 이름을 한 줄에 한 명씩 입력해주세요.
          </div>

          {/* 1차수 / 2차수 입력 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            {[{ g: G1, key: "g1Names", count: g1Count }, { g: G2, key: "g2Names", count: g2Count }].map(({ g, key, count }) => (
              <div key={g.label} style={{ border: `1.5px solid ${g.border}`, borderRadius: 10, overflow: "hidden" }}>
                <div style={{ background: g.bg, padding: "10px 14px", borderBottom: `1px solid ${g.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: g.color }}>{g.label}</span>
                    <span style={{ background: g.tag, color: g.tagText, fontSize: 11, fontWeight: 700, borderRadius: 99, padding: "2px 8px" }}>{count}명</span>
                  </div>
                  <div style={{ fontSize: 11, color: g.color, opacity: 0.8, marginTop: 2 }}>📅 {g.date} · 2일 필수</div>
                </div>
                <div style={{ padding: "10px" }}>
                  <NameInput value={data[key]} onChange={v => onChange(key, v)}
                    placeholder={"홍길동\n김철수\n이영희"} color={g.color} />
                </div>
              </div>
            ))}
          </div>

          {/* 인원 카운터 — 항상 표시, 상태 강조 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end",
            gap: 8, marginBottom: 14, fontSize: 13 }}>
            <span style={{ color: "#64748B" }}>배정 현황:</span>
            <span style={{ fontWeight: 700, color: G1.color }}>{g1Count}명</span>
            <span style={{ color: "#94A3B8" }}>+</span>
            <span style={{ fontWeight: 700, color: G2.color }}>{g2Count}명</span>
            <span style={{ color: "#94A3B8" }}>=</span>
            <span style={{ fontWeight: 700, color: total === dept.total ? "#16A34A" : total > dept.total ? "#DC2626" : "#64748B" }}>
              {total}명
            </span>
            <span style={{ color: "#94A3B8" }}>/</span>
            <span style={{ fontWeight: 700, color: "#0F172A" }}>{dept.total}명</span>
            {status && (
              <span style={{ fontSize: 11, color: status.color, background: status.bg,
                padding: "2px 8px", borderRadius: 99, fontWeight: 600 }}>
                {status.text}
              </span>
            )}
          </div>

          {/* 비고 — 이름/사유 두 칸 구조 */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>
              비고 <span style={{ fontWeight: 400, color: "#94A3B8" }}>(예외 인원의 이름과 사유, 선택)</span>
            </label>

            {noteItems.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 32px", gap: 8, marginBottom: 6,
                fontSize: 11, fontWeight: 700, color: "#94A3B8", padding: "0 2px" }}>
                <span>이름</span><span>사유</span><span />
              </div>
            )}

            {noteItems.map((item, idx) => (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "120px 1fr 32px", gap: 8, marginBottom: 8, alignItems: "center" }}>
                <input type="text" placeholder="이름" value={item.name}
                  onChange={e => onNoteChange(idx, "name", e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #E2E8F0", borderRadius: 8,
                    padding: "9px 10px", fontSize: 13, outline: "none", color: "#1E293B", fontFamily: "inherit" }} />
                <input type="text" placeholder="사유 (예: 휴가, 출장 등)" value={item.reason}
                  onChange={e => onNoteChange(idx, "reason", e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #E2E8F0", borderRadius: 8,
                    padding: "9px 10px", fontSize: 13, outline: "none", color: "#1E293B", fontFamily: "inherit" }} />
                <button onClick={() => onNoteRemove(idx)} title="행 삭제"
                  style={{ width: 32, height: 32, border: "1px solid #FECACA", background: "#FEF2F2", color: "#EF4444",
                    borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: "pointer", lineHeight: 1 }}>−</button>
              </div>
            ))}

            <button onClick={onNoteAdd}
              style={{ marginTop: 2, padding: "8px 14px", border: "1.5px dashed #CBD5E1", background: "#F8FAFC",
                color: "#475569", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              + 항목 추가
            </button>
          </div>

          {error && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8,
              padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#DC2626" }}>
              ⚠️ {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={!canSubmit || loading}
            style={{ width: "100%", padding: "12px", border: "none", borderRadius: 10,
              fontSize: 14, fontWeight: 700, transition: "all 0.2s",
              cursor: canSubmit && !loading ? "pointer" : "not-allowed",
              background: canSubmit && !loading ? "#0F172A" : "#E2E8F0",
              color: canSubmit && !loading ? "#fff" : "#94A3B8" }}>
            {loading ? "저장 중..." : !data.submitter.trim() ? "제출자 이름을 입력해주세요" : "제출하기 →"}
          </button>
        </div>
      )}
    </div>
  );
}

const initData = () => Object.fromEntries(
  DEPARTMENTS.map(d => [d.id, { submitter: "", g1Names: "", g2Names: "", noteItems: [] }])
);

function App() {
  const [formData, setFormData] = useState(initData());
  const [submittedSet, setSubmittedSet] = useState({});

  const update = (deptId, field, value) =>
    setFormData(prev => ({ ...prev, [deptId]: { ...prev[deptId], [field]: value } }));

  const submittedCount = DEPARTMENTS.filter(d => submittedSet[d.id]).length;
  const progress = Math.round((submittedCount / DEPARTMENTS.length) * 100);

  return (
    <div style={{ fontFamily: "'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif",
      background: "#F1F5F9", minHeight: "100vh", padding: "28px 16px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>

        {/* 헤더 */}
        <div style={{ background: "#0F172A", borderRadius: 16, padding: "28px 32px", marginBottom: 20, color: "#fff" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#1E293B",
            borderRadius: 99, padding: "4px 12px", fontSize: 11, color: "#94A3B8", marginBottom: 14, letterSpacing: 1 }}>
            1 · 2차수 대상
          </div>
          <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700, color: "#F1F5F9" }}>교육 참석 차수 배정 제출</h1>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "#94A3B8", lineHeight: 1.7 }}>
            부서 인원을 <strong style={{ color: "#93C5FD" }}>1차수 (7/8~7/9)</strong> 또는{" "}
            <strong style={{ color: "#C4B5FD" }}>2차수 (7/13~7/14)</strong>로 나누어 배정해주세요.<br />
            배정된 차수의 교육은 <strong style={{ color: "#FCA5A5" }}>2일 전일 필수 참석</strong>입니다.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            {[G1, G2].map(g => (
              <div key={g.label} style={{ background: "#1E293B", borderRadius: 10, padding: "12px 16px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: g.color === "#1D4ED8" ? "#93C5FD" : "#C4B5FD", marginBottom: 4 }}>{g.label}</div>
                <div style={{ fontSize: 13, color: "#E2E8F0", fontWeight: 600 }}>{g.date}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>2일 전일 필수 참석</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, background: "#1E293B", borderRadius: 99, height: 6, overflow: "hidden" }}>
              <div style={{ width: `${progress}%`, height: "100%", background: "#38BDF8", borderRadius: 99, transition: "width 0.4s" }} />
            </div>
            <span style={{ fontSize: 12, color: "#94A3B8", whiteSpace: "nowrap" }}>{submittedCount} / {DEPARTMENTS.length} 부서 제출</span>
          </div>
        </div>

        {DEPARTMENTS.map(dept => (
          <DeptForm key={dept.id} dept={dept} data={formData[dept.id]}
            onChange={(field, value) => update(dept.id, field, value)}
            onSubmitSuccess={() => setSubmittedSet(prev => ({ ...prev, [dept.id]: true }))}
            isSubmitted={!!submittedSet[dept.id]}
            onEditRequest={() => setSubmittedSet(prev => { const n = { ...prev }; delete n[dept.id]; return n; })}
          />
        ))}

        {submittedCount === DEPARTMENTS.length && (
          <div style={{ background: "#F0FDF4", border: "1.5px solid #86EFAC", borderRadius: 14, padding: "24px", textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#166534", marginBottom: 4 }}>모든 부서 제출이 완료되었습니다</div>
            <div style={{ fontSize: 13, color: "#4ADE80" }}>결과는 관리자 대시보드에서 확인 가능합니다</div>
          </div>
        )}

        <div style={{ textAlign: "center", padding: "20px 0 4px", fontSize: 11, color: "#94A3B8" }}>문의: 담당자에게 연락주세요</div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
  