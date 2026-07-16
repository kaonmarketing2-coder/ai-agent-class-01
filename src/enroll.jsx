const { useState, useEffect } = React;
const SUPABASE_URL = "https://mrdmywosqzaqukdfvbzv.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yZG15d29zcXphcXVrZGZ2Ynp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzIzNTksImV4cCI6MjA4OTU0ODM1OX0.D2PKVx9cqyAg-qIpKdtUX9z9AwdjDwNgo6Nsyy4vdNM";
const HEADERS = { "Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":`Bearer ${SUPABASE_KEY}` };
const TABLE = "curriculum_enrollments";

// 각 차시별 실질 교육시간(점심 1시간 제외) 및 커리큘럼 요약
const SESSIONS = [
  {
    key:"s1", label:"1차시",
    title:"Claude 제대로 시작하기",
    subtitle:"LLM 이해 · 프롬프트 설계 · Projects 기초",
    date:"7/27 (월)", time:"11:00 ~ 18:00", note:"점심 1시간 제외", hours:6,
    color:"#4361EE", bg:"#EEF2FF", border:"#C7D2FE", tag:"#E0E7FF", tagText:"#3730A3",
    modules:[
      { h:"1.5H", t:"LLM 작동 원리 · 보안·기밀 기준", d:"토큰·컨텍스트·환각성 이해 / 업로드 가능·불가 자료 구분" },
      { h:"1.5H", t:"프롬프트 설계 · 검증", d:"프롬프트 4원칙(역할·맥락·형식·예시) · 할루시네이션 검증 습관" },
      { h:"1.5H", t:"채팅 기초 실습", d:"본인 업무 문서 1건 입력 → 요약·분석·재질문" },
      { h:"1.5H", t:"Projects 구축", d:"팀 맥락을 담은 전용 프로젝트 1개 생성" },
    ],
  },
  {
    key:"s2", label:"2차시",
    title:"실무 산출물 직접 만들기",
    subtitle:"문서 · 엑셀 · PPT · 업무 도구",
    date:"7/28 (화)", time:"09:00 ~ 15:00", note:"점심 1시간 제외", hours:5,
    color:"#7C3AED", bg:"#F5F3FF", border:"#DDD6FE", tag:"#EDE9FE", tagText:"#5B21B6",
    modules:[
      { h:"1H", t:"Artifacts 워크플로우 시연", d:"보고서·기획안·메일·표를 대화하며 즉석 생성·수정" },
      { h:"2H", t:"문서·엑셀 트랙 실습", d:"실제 보고서·메일 완성 / 데이터 파일 취합·분석·표 생성" },
      { h:"1.5H", t:"업무 도구 제작", d:"코딩 없이 계산기·체크리스트·대시보드 등 도구 1개 제작" },
      { h:"1.5H", t:"기획·발표자료", d:"기획서·발표자료 초안 생성 후 다듬기" },
    ],
  },
  {
    key:"s3", label:"3차시",
    title:"반복업무 표준화·자동화 & 직무 적용",
    subtitle:"Skills · 자동화 · 데이터 분석",
    date:"7/30 (목)", time:"11:00 ~ 18:00", note:"점심 1시간 제외", hours:6,
    color:"#059669", bg:"#ECFDF5", border:"#A7F3D0", tag:"#D1FAE5", tagText:"#065F46",
    modules:[
      { h:"1H", t:"Skills · Agent 개념", d:"반복 작업 절차를 스킬로 정의 · AI Agent 개념 소개" },
      { h:"1H", t:"녹취 → 할일 리스트", d:"회의 녹취 → 액션 아이템·업무분담표 자동 정리" },
      { h:"2H", t:"문서 자동화 · API 대량 처리", d:"양식 템플릿화 일괄 생성 / 수백~수천 건 데이터 일괄 처리" },
      { h:"2H", t:"데이터 분석·대시보드 · 팀 적용", d:"실제 데이터 → 대시보드 제작 / 보안 기준 · 팀 적용 계획 1장" },
    ],
  },
];
const SKEYS = SESSIONS.map(s=>s.key);
const MIN_HOURS = 4.5;

async function insertEnrollment(d) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
    method:"POST", headers:{...HEADERS,"Prefer":"return=representation"},
    body:JSON.stringify({
      name:d.name.trim(), department:d.department.trim(), contact:d.contact.trim(),
      s1:d.s1, s2:d.s2, s3:d.s3, note:d.note.trim(), submitted_at:new Date().toISOString(),
    }),
  });
  if(!res.ok) throw new Error("접수 실패. 잠시 후 다시 시도해주세요.");
  return (await res.json())[0]?.id;
}

async function fetchCounts() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?select=s1,s2,s3`, { headers:HEADERS });
  if(!res.ok) throw new Error("현황 조회 실패");
  const rows = await res.json();
  const c = { s1:0, s2:0, s3:0, people:rows.length };
  rows.forEach(r=>SKEYS.forEach(k=>{ if(r[k]) c[k]++; }));
  return c;
}

function SessionCard({ s, checked, onToggle, count }) {
  return (
    <div onClick={onToggle}
      style={{border:`2px solid ${checked?s.color:"#E2E8F0"}`,borderRadius:14,overflow:"hidden",marginBottom:14,cursor:"pointer",
        background:checked?s.bg:"#fff",transition:"all 0.15s",boxShadow:checked?`0 4px 16px ${s.color}22`:"none"}}>
      <div style={{padding:"16px 20px",background:checked?s.bg:"#F8FAFC",borderBottom:`1px solid ${checked?s.border:"#E2E8F0"}`,
        display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
        <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
          <div style={{width:24,height:24,borderRadius:7,border:`2px solid ${checked?s.color:"#CBD5E1"}`,background:checked?s.color:"#fff",
            display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2,transition:"all 0.15s"}}>
            {checked&&<span style={{color:"#fff",fontSize:15,fontWeight:900,lineHeight:1}}>✓</span>}
          </div>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
              <span style={{fontSize:13,fontWeight:800,color:s.color}}>{s.label}</span>
              <span style={{fontSize:15,fontWeight:700,color:"#0F172A"}}>{s.title}</span>
            </div>
            <div style={{fontSize:12,color:"#64748B"}}>{s.subtitle}</div>
          </div>
        </div>
        {typeof count==="number"&&(
          <span style={{background:s.tag,color:s.tagText,fontSize:11,fontWeight:700,borderRadius:99,padding:"3px 10px",whiteSpace:"nowrap",flexShrink:0}}>
            현재 {count}명
          </span>
        )}
      </div>
      <div style={{padding:"14px 20px"}}>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14,alignItems:"center"}}>
          <span style={{fontSize:13,fontWeight:700,color:"#0F172A",background:"#fff",border:`1px solid ${s.border}`,borderRadius:8,padding:"5px 10px"}}>📅 {s.date}</span>
          <span style={{fontSize:13,fontWeight:700,color:"#0F172A",background:"#fff",border:`1px solid ${s.border}`,borderRadius:8,padding:"5px 10px"}}>⏰ {s.time}</span>
          <span style={{fontSize:12,color:"#94A3B8"}}>{s.note}</span>
          <span style={{fontSize:12,fontWeight:800,color:s.color,marginLeft:"auto"}}>실질 교육 {s.hours}시간</span>
        </div>
        <div style={{display:"grid",gap:6}}>
          {s.modules.map((m,i)=>(
            <div key={i} style={{display:"grid",gridTemplateColumns:"46px 1fr",gap:10,alignItems:"start"}}>
              <span style={{fontSize:11,fontWeight:800,color:s.color,background:s.bg,border:`1px solid ${s.border}`,borderRadius:6,padding:"3px 0",textAlign:"center"}}>{m.h}</span>
              <div style={{fontSize:12.5,color:"#334155",lineHeight:1.55}}>
                <strong style={{color:"#0F172A",fontWeight:700}}>{m.t}</strong>
                <span style={{color:"#94A3B8"}}> — {m.d}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [data, setData] = useState({ name:"", department:"", contact:"", s1:false, s2:false, s3:false, note:"" });
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const loadCounts = () => { fetchCounts().then(setCounts).catch(()=>{}); };
  useEffect(loadCounts, []);

  const set = (k,v) => setData(p=>({...p,[k]:v}));
  const selected = SKEYS.filter(k=>data[k]);
  const canSubmit = data.name.trim().length>0 && selected.length>0;

  const handleSubmit = async () => {
    if(!canSubmit||loading) return;
    setLoading(true); setError("");
    try { await insertEnrollment(data); setDone(true); loadCounts(); }
    catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const wrap = { fontFamily:"'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif",background:"#F1F5F9",minHeight:"100vh",padding:"28px 16px" };

  if(done) {
    const chosen = SESSIONS.filter(s=>data[s.key]);
    const totalH = chosen.reduce((a,s)=>a+s.hours,0);
    return (
      <div style={wrap}>
        <div style={{maxWidth:640,margin:"0 auto"}}>
          <div style={{background:"#fff",border:"1.5px solid #86EFAC",borderRadius:16,padding:"36px 32px",textAlign:"center"}}>
            <div style={{fontSize:44,marginBottom:10}}>✅</div>
            <div style={{fontSize:20,fontWeight:800,color:"#166534",marginBottom:6}}>수강 신청이 접수되었습니다</div>
            <div style={{fontSize:13,color:"#64748B",marginBottom:24}}>{data.name}님 · 신청하신 차시 {chosen.length}개</div>
            <div style={{display:"grid",gap:8,marginBottom:20,textAlign:"left"}}>
              {chosen.map(s=>(
                <div key={s.key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:s.bg,border:`1px solid ${s.border}`,borderRadius:10,padding:"12px 16px"}}>
                  <div>
                    <span style={{fontSize:12,fontWeight:800,color:s.color,marginRight:8}}>{s.label}</span>
                    <span style={{fontSize:13,fontWeight:700,color:"#0F172A"}}>{s.title}</span>
                    <div style={{fontSize:12,color:"#64748B",marginTop:2}}>{s.date} · {s.time} ({s.note})</div>
                  </div>
                  <span style={{fontSize:12,fontWeight:800,color:s.color,whiteSpace:"nowrap"}}>{s.hours}H</span>
                </div>
              ))}
            </div>
            <div style={{background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:10,padding:"12px 16px",fontSize:12.5,color:"#92400E",lineHeight:1.7,marginBottom:24,textAlign:"left"}}>
              ⏱️ <strong>수료 조건 안내</strong> — 신청하신 각 차시는 <strong>최소 {MIN_HOURS}시간 이상 참여·수료</strong>해야 수료로 인정됩니다. (차시별 실질 교육시간 5~6시간)
            </div>
            <button onClick={()=>{ setData({ name:"", department:"", contact:"", s1:false, s2:false, s3:false, note:"" }); setDone(false); window.scrollTo(0,0); }}
              style={{padding:"11px 22px",background:"#0F172A",color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              다른 사람 신청하기
            </button>
          </div>
          <div style={{textAlign:"center",padding:"18px 0 4px",fontSize:12,color:"#94A3B8"}}>가온그룹 전사공통 AI 실무교육 · 한국AI교육진흥원</div>
        </div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={{maxWidth:640,margin:"0 auto"}}>
        {/* 헤더 */}
        <div style={{background:"#0F172A",borderRadius:16,padding:"28px 30px",marginBottom:18,color:"#fff"}}>
          <div style={{display:"inline-flex",alignItems:"center",background:"#1E293B",borderRadius:99,padding:"4px 12px",fontSize:11,color:"#94A3B8",marginBottom:14,letterSpacing:1}}>
            가온그룹 전사공통 AI 실무교육
          </div>
          <h1 style={{margin:"0 0 8px",fontSize:22,fontWeight:800,color:"#F1F5F9"}}>커리큘럼 수강 신청</h1>
          <p style={{margin:"0 0 18px",fontSize:13,color:"#94A3B8",lineHeight:1.7}}>
            아래 3개 차시의 커리큘럼을 확인하고, <strong style={{color:"#E2E8F0"}}>참석을 원하는 차시를 선택</strong>해 신청해주세요.
          </p>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            <span style={{background:"#1E293B",color:"#93C5FD",fontSize:12,fontWeight:600,borderRadius:8,padding:"6px 12px"}}>✔ 차시 중복 신청 가능</span>
            <span style={{background:"#1E293B",color:"#FCD34D",fontSize:12,fontWeight:600,borderRadius:8,padding:"6px 12px"}}>⏱️ 각 차시 최소 {MIN_HOURS}시간 이상 수료</span>
            {counts&&<span style={{background:"#1E293B",color:"#86EFAC",fontSize:12,fontWeight:600,borderRadius:8,padding:"6px 12px"}}>현재 {counts.people}명 접수</span>}
          </div>
        </div>

        {/* 수료 조건 안내 */}
        <div style={{background:"#FFFBEB",border:"1.5px solid #FDE68A",borderRadius:12,padding:"14px 18px",marginBottom:18,fontSize:13,color:"#92400E",lineHeight:1.7}}>
          <strong>📌 수료 조건</strong> — 신청하신 <strong>각 차시별로 최소 {MIN_HOURS}시간 이상 참여·수료</strong>해야 해당 차시가 수료로 인정됩니다.
          차시별 실질 교육시간은 점심시간(1시간)을 제외하고 <strong>5~6시간</strong>입니다. 커리큘럼을 보고 완주 가능한 차시를 선택해주세요.
        </div>

        {/* 신청자 정보 */}
        <div style={{background:"#fff",border:"1.5px solid #E2E8F0",borderRadius:14,padding:"20px",marginBottom:18}}>
          <div style={{fontSize:13,fontWeight:800,color:"#0F172A",marginBottom:14}}>신청자 정보</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:"#475569",display:"block",marginBottom:6}}>이름 <span style={{color:"#EF4444"}}>*</span></label>
              <input type="text" placeholder="홍길동" value={data.name} onChange={e=>set("name",e.target.value)}
                style={{width:"100%",boxSizing:"border-box",border:"1.5px solid #E2E8F0",borderRadius:8,padding:"10px 12px",fontSize:13,outline:"none",color:"#1E293B",fontFamily:"inherit"}}/>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:"#475569",display:"block",marginBottom:6}}>소속 / 부서</label>
              <input type="text" placeholder="예: 해외영업본부" value={data.department} onChange={e=>set("department",e.target.value)}
                style={{width:"100%",boxSizing:"border-box",border:"1.5px solid #E2E8F0",borderRadius:8,padding:"10px 12px",fontSize:13,outline:"none",color:"#1E293B",fontFamily:"inherit"}}/>
            </div>
          </div>
          <div>
            <label style={{fontSize:12,fontWeight:700,color:"#475569",display:"block",marginBottom:6}}>연락처 <span style={{fontSize:11,color:"#94A3B8",fontWeight:400}}>(이메일 또는 휴대폰 · 선택)</span></label>
            <input type="text" placeholder="예: hong@kaon.com / 010-0000-0000" value={data.contact} onChange={e=>set("contact",e.target.value)}
              style={{width:"100%",boxSizing:"border-box",border:"1.5px solid #E2E8F0",borderRadius:8,padding:"10px 12px",fontSize:13,outline:"none",color:"#1E293B",fontFamily:"inherit"}}/>
          </div>
        </div>

        {/* 차시 선택 */}
        <div style={{fontSize:13,fontWeight:800,color:"#0F172A",margin:"0 2px 12px"}}>참석 희망 차시 선택 <span style={{color:"#EF4444"}}>*</span> <span style={{fontSize:11,fontWeight:400,color:"#94A3B8"}}>(1개 이상 · 중복 선택 가능)</span></div>
        {SESSIONS.map(s=>(
          <SessionCard key={s.key} s={s} checked={data[s.key]} onToggle={()=>set(s.key,!data[s.key])} count={counts?counts[s.key]:undefined}/>
        ))}

        {/* 비고 */}
        <div style={{background:"#fff",border:"1.5px solid #E2E8F0",borderRadius:14,padding:"20px",margin:"4px 0 18px"}}>
          <label style={{fontSize:12,fontWeight:800,color:"#0F172A",display:"block",marginBottom:8}}>비고 <span style={{fontSize:11,color:"#94A3B8",fontWeight:400}}>(선택 · 요청사항 등)</span></label>
          <textarea value={data.note} onChange={e=>set("note",e.target.value)} rows={3} placeholder="예: 2차시 일부 시간 외부 일정으로 조정 요청"
            style={{width:"100%",boxSizing:"border-box",border:"1.5px solid #E2E8F0",borderRadius:8,padding:"10px 12px",fontSize:13,lineHeight:1.7,color:"#334155",resize:"vertical",outline:"none",fontFamily:"inherit"}}/>
        </div>

        {/* 선택 요약 + 제출 */}
        <div style={{background:"#fff",border:"1.5px solid #E2E8F0",borderRadius:14,padding:"20px",marginBottom:18}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,flexWrap:"wrap"}}>
            <span style={{fontSize:12,color:"#64748B"}}>선택한 차시:</span>
            {selected.length===0
              ? <span style={{fontSize:12,color:"#CBD5E1"}}>없음</span>
              : SESSIONS.filter(s=>data[s.key]).map(s=>(
                  <span key={s.key} style={{background:s.tag,color:s.tagText,fontSize:12,fontWeight:700,borderRadius:99,padding:"3px 12px"}}>{s.label}</span>
                ))}
          </div>
          {error&&<div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,padding:"10px 14px",marginBottom:12,fontSize:12,color:"#DC2626"}}>⚠️ {error}</div>}
          <button onClick={handleSubmit} disabled={!canSubmit||loading}
            style={{width:"100%",padding:"13px",border:"none",borderRadius:10,fontSize:14,fontWeight:700,fontFamily:"inherit",
              cursor:canSubmit&&!loading?"pointer":"not-allowed",
              background:canSubmit&&!loading?"#0F172A":"#E2E8F0",
              color:canSubmit&&!loading?"#fff":"#94A3B8"}}>
            {loading?"접수 중...":!data.name.trim()?"이름을 입력해주세요":selected.length===0?"참석할 차시를 1개 이상 선택해주세요":"수강 신청 접수하기 →"}
          </button>
        </div>

        <div style={{textAlign:"center",padding:"6px 0 4px",fontSize:12,color:"#94A3B8"}}>가온그룹 전사공통 AI 실무교육 · 한국AI교육진흥원</div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
