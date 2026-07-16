const { useState } = React;
const SUPABASE_URL = "https://mrdmywosqzaqukdfvbzv.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yZG15d29zcXphcXVrZGZ2Ynp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzIzNTksImV4cCI6MjA4OTU0ODM1OX0.D2PKVx9cqyAg-qIpKdtUX9z9AwdjDwNgo6Nsyy4vdNM";
const HEADERS = { "Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":`Bearer ${SUPABASE_KEY}` };
const TABLE = "curriculum_enrollments";
const MAXW = 760;

// 각 차시별 실질 교육시간(점심 1시간 제외) 및 커리큘럼 상세 (제안서 원본 반영)
const SESSIONS = [
  {
    key:"s1", label:"1차시",
    title:"Claude 제대로 시작하기",
    subtitle:"LLM 이해 · 프롬프트 설계 · Projects 기초",
    date:"7/27 (월)", time:"11:00 ~ 18:00", note:"점심 1시간 제외", hours:6,
    color:"#4361EE", bg:"#EEF2FF", border:"#C7D2FE", tag:"#E0E7FF", tagText:"#3730A3",
    rows:[
      { h:"1.5H", role:"이론", sub:"LLM·보안 기초", c:"LLM 작동 원리(토큰·컨텍스트·환각성)를 비전공자 눈높이로 설명, 회사 자료 중 업로드 가능한 것과 안 되는 것을 명확히 구분하는 보안·기밀 기준 안내" },
      { h:"1.5H", role:"이론·실습", sub:"프롬프트 설계", c:"프롬프트 4원칙(역할·맥락·형식·예시)과 재질문을 통한 결과 개선, 할루시네이션 검증 습관 — 근거·교차 확인·수치 재점검" },
      { h:"1.5H", role:"실습 1", sub:"채팅 기초", c:"채팅 구성 익히기, 본인 업무 문서 1건 입력 → 요약·분석·재질문 실습" },
      { h:"1.5H", role:"실습 2", sub:"Projects 구축", c:"Claude Projects에 본인 팀 맥락(소개·용어·룰·양식)을 입력한 전용 프로젝트 1개 생성 [과제] 생성한 프로젝트를 실제 업무 1건에 적용해 2차시 지참" },
    ],
  },
  {
    key:"s2", label:"2차시",
    title:"실무 산출물 직접 만들기",
    subtitle:"문서 · 엑셀 · PPT · 업무 도구",
    date:"7/28 (화)", time:"09:00 ~ 15:00", note:"점심 1시간 제외", hours:5,
    color:"#7C3AED", bg:"#F5F3FF", border:"#DDD6FE", tag:"#EDE9FE", tagText:"#5B21B6",
    rows:[
      { h:"1H", role:"시연", sub:"Artifacts 워크플로우", c:"Artifacts로 보고서·기획안·메일·표를 대화하며 즉석 생성·수정하는 워크플로우 시연" },
      { h:"2H", role:"실습 1", sub:"문서·엑셀 트랙", c:"[문서·메일 트랙] 본인 실제 업무 보고서 또는 메일 초안 1건을 Artifacts로 완성 · [엑셀 트랙] 실제 데이터 파일 업로드 → 취합·정리·분석·표 생성" },
      { h:"1.5H", role:"실습 2", sub:"업무 도구 제작", c:"코딩 없이 계산기·체크리스트·간단 대시보드 등 \"작동하는 업무 도구\" 1개를 Artifacts로 제작" },
      { h:"1.5H", role:"실습 3", sub:"기획·발표자료", c:"기획서·발표자료 초안을 생성 후 다듬기 [과제] 이번 주 실제 업무 산출물 1건을 AI로 제작해 3차시 지참" },
    ],
  },
  {
    key:"s3", label:"3차시",
    title:"반복업무 표준화·자동화 입문 & 직무 적용",
    subtitle:"Skills · 자동화 · 데이터 분석",
    date:"7/30 (목)", time:"11:00 ~ 18:00", note:"점심 1시간 제외", hours:6,
    color:"#059669", bg:"#ECFDF5", border:"#A7F3D0", tag:"#D1FAE5", tagText:"#065F46",
    rows:[
      { h:"1H", role:"이론·시연", sub:"Skills · Agent 개념", c:"Claude Skills 개념: 반복 작업 절차를 스킬로 정의해 일관되게 처리하는 원리, AI Agent 개념 소개(팀 중심) — 직무별 심화 설계는 후속 심화 과정에서 다룰 것을 명확히 안내" },
      { h:"1H", role:"PART 1", sub:"녹취 → 할일 리스트", c:"회의 녹음·통화 녹취 파일(STT 변환본)을 업로드해 참석자·논의주제·결정사항·담당자별 액션 아이템(할일 리스트)을 자동 정리, 부서 간 업무분담표로 즉시 변환하는 실습. 실제 회의 녹취를 소재로 진행" },
      { h:"1H", role:"PART 2", sub:"문서 자동화", c:"반복 작성되는 품질 리포트·점검 일지·거래처 공문 등의 양식을 템플릿화하여 데이터만 갈아끼우면 완성되는 문서 자동화 구조 설계, 여러 건을 한 번에 일괄 생성하는 실습" },
      { h:"1H", role:"PART 3", sub:"API 대량 데이터 처리", c:"API 연동 개념 이해 — 외부 시스템·대용량 데이터를 코드 몇 줄로 불러와 수백~수천 건 단위의 데이터를 일괄 처리·가공하는 원리 실습, 반복적인 대량 데이터 취합 업무 자동화 시연" },
      { h:"1H", role:"PART 4", sub:"데이터 분석·대시보드", c:"본인 부서의 실제 데이터(생산·품질·발주 등)를 업로드해 핵심 지표 분석과 인터랙티브 대시보드를 직접 완성, 경영진 보고에 바로 활용 가능한 시각화 산출물 제작" },
      { h:"1H", role:"정리", sub:"보안 기준 · 팀 적용", c:"보안·기밀 기준과 결과 검증 프로세스 — 자동화 시 입력 가능한 정보 범위 최종 정리, 개인별 \"팀 적용 계획 1장\" 작성·공유, 팀 공유 프롬프트 라이브러리 구축 시작" },
    ],
  },
];
const SKEYS = SESSIONS.map(s=>s.key);

async function insertEnrollment(d) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
    method:"POST", headers:{...HEADERS,"Prefer":"return=representation"},
    body:JSON.stringify({
      name:d.name.trim(), department:d.department.trim(), contact:"",
      s1:d.s1, s2:d.s2, s3:d.s3, note:d.note.trim(), submitted_at:new Date().toISOString(),
    }),
  });
  if(!res.ok) throw new Error("접수 실패. 잠시 후 다시 시도해주세요.");
  return (await res.json())[0]?.id;
}

// 커리큘럼 표 반응형 스타일 (제안서 track 테이블 스타일 반영)
function Styles() {
  return (
    <style>{`
      .cur-table{border:1px solid #E2E8F0;border-radius:10px;overflow:hidden;background:#fff}
      .cur-r{display:grid;grid-template-columns:56px 148px 1fr;border-top:1px solid #F1F5F9}
      .cur-r:first-child{border-top:none}
      .cur-r>div{padding:11px 13px}
      .cur-t{font-weight:800;font-size:12px;display:flex;align-items:flex-start}
      .cur-m{font-weight:700;font-size:12.5px;color:#0F172A;border-left:1px solid #F1F5F9;border-right:1px solid #F1F5F9;line-height:1.45}
      .cur-m small{display:block;font-size:11px;font-weight:500;color:#94A3B8;margin-top:2px}
      .cur-c{font-size:12.5px;color:#475569;line-height:1.65}
      @media(max-width:560px){
        .cur-r{grid-template-columns:1fr}
        .cur-r>div{padding:9px 13px}
        .cur-t{border-bottom:0}
        .cur-m{border-left:none;border-right:none;border-top:1px solid #F1F5F9;padding-top:8px}
        .cur-c{border-top:1px solid #F1F5F9;padding-top:8px}
      }
    `}</style>
  );
}

function SessionCard({ s, checked, onToggle }) {
  return (
    <div style={{border:`2px solid ${checked?s.color:"#E2E8F0"}`,borderRadius:14,overflow:"hidden",marginBottom:14,
      background:checked?s.bg:"#fff",transition:"all 0.15s",boxShadow:checked?`0 4px 16px ${s.color}22`:"none"}}>
      {/* 헤더 (클릭 시 선택 토글) */}
      <div onClick={onToggle} style={{padding:"16px 20px",background:checked?s.bg:"#F8FAFC",borderBottom:`1px solid ${checked?s.border:"#E2E8F0"}`,
        display:"flex",gap:14,alignItems:"flex-start",cursor:"pointer"}}>
        <div style={{width:24,height:24,borderRadius:7,border:`2px solid ${checked?s.color:"#CBD5E1"}`,background:checked?s.color:"#fff",
          display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2,transition:"all 0.15s"}}>
          {checked&&<span style={{color:"#fff",fontSize:15,fontWeight:900,lineHeight:1}}>✓</span>}
        </div>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
            <span style={{fontSize:13,fontWeight:800,color:s.color}}>{s.label}</span>
            <span style={{fontSize:15.5,fontWeight:700,color:"#0F172A"}}>{s.title}</span>
          </div>
          <div style={{fontSize:12,color:"#64748B"}}>{s.subtitle}</div>
        </div>
      </div>

      <div style={{padding:"14px 20px"}}>
        {/* 일정 */}
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:12,alignItems:"center"}}>
          <span style={{fontSize:13,fontWeight:700,color:"#0F172A",background:"#fff",border:`1px solid ${s.border}`,borderRadius:8,padding:"5px 10px"}}>📅 {s.date}</span>
          <span style={{fontSize:13,fontWeight:700,color:"#0F172A",background:"#fff",border:`1px solid ${s.border}`,borderRadius:8,padding:"5px 10px"}}>⏰ {s.time}</span>
          <span style={{fontSize:12,color:"#94A3B8"}}>{s.note}</span>
          <span style={{fontSize:12,fontWeight:800,color:s.color,marginLeft:"auto"}}>실질 교육 {s.hours}시간</span>
        </div>

        {/* 커리큘럼 상세 표 */}
        <div className="cur-table">
          {s.rows.map((m,i)=>(
            <div className="cur-r" key={i}>
              <div className="cur-t" style={{color:s.color,background:s.bg}}>{m.h}</div>
              <div className="cur-m">{m.role}<small>{m.sub}</small></div>
              <div className="cur-c">{m.c}</div>
            </div>
          ))}
        </div>

        {/* 선택 버튼 */}
        <button onClick={onToggle}
          style={{marginTop:14,width:"100%",padding:"11px",border:`1.5px solid ${checked?s.color:"#CBD5E1"}`,borderRadius:10,
            background:checked?s.color:"#fff",color:checked?"#fff":"#475569",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>
          {checked?"✓ 이 차시 신청 선택됨 (해제하려면 클릭)":"이 차시 신청하기"}
        </button>
      </div>
    </div>
  );
}

function App() {
  const [data, setData] = useState({ name:"", department:"", s1:false, s2:false, s3:false, note:"" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const set = (k,v) => setData(p=>({...p,[k]:v}));
  const selected = SKEYS.filter(k=>data[k]);
  const canSubmit = data.name.trim().length>0 && data.department.trim().length>0 && selected.length>0;

  const handleSubmit = async () => {
    if(!canSubmit||loading) return;
    setLoading(true); setError("");
    try { await insertEnrollment(data); setDone(true); window.scrollTo(0,0); }
    catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const btnLabel = loading ? "접수 중..."
    : !data.name.trim() ? "이름을 입력해주세요"
    : !data.department.trim() ? "소속/부서를 입력해주세요"
    : selected.length===0 ? "참석할 차시를 1개 이상 선택해주세요"
    : "수강 신청 접수하기 →";

  const wrap = { fontFamily:"'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif",background:"#F1F5F9",minHeight:"100vh",padding:"28px 16px" };

  if(done) {
    const chosen = SESSIONS.filter(s=>data[s.key]);
    return (
      <div style={wrap}>
        <Styles/>
        <div style={{maxWidth:640,margin:"0 auto"}}>
          <div style={{background:"#fff",border:"1.5px solid #86EFAC",borderRadius:16,padding:"36px 32px",textAlign:"center"}}>
            <div style={{fontSize:44,marginBottom:10}}>✅</div>
            <div style={{fontSize:20,fontWeight:800,color:"#166534",marginBottom:6}}>수강 신청이 접수되었습니다</div>
            <div style={{fontSize:13,color:"#64748B",marginBottom:24}}>{data.department} · {data.name}님 · 신청 차시 {chosen.length}개</div>
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
              ⏱️ <strong>수료 조건 안내</strong> — 신청하신 각 차시는 <strong>중간 이탈 없이 끝까지 참석</strong>해주세요. (차시별 실질 교육시간 5~6시간, 점심 1시간 제외)
            </div>
            <button onClick={()=>{ setData({ name:"", department:"", s1:false, s2:false, s3:false, note:"" }); setDone(false); window.scrollTo(0,0); }}
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
      <Styles/>
      <div style={{maxWidth:MAXW,margin:"0 auto"}}>
        {/* 헤더 */}
        <div style={{background:"#0F172A",borderRadius:16,padding:"28px 30px",marginBottom:18,color:"#fff"}}>
          <div style={{display:"inline-flex",alignItems:"center",background:"#1E293B",borderRadius:99,padding:"4px 12px",fontSize:11,color:"#94A3B8",marginBottom:14,letterSpacing:1}}>
            가온그룹 전사공통 AI 실무교육
          </div>
          <h1 style={{margin:"0 0 8px",fontSize:22,fontWeight:800,color:"#F1F5F9"}}>커리큘럼 수강 신청</h1>
          <p style={{margin:"0 0 18px",fontSize:13,color:"#94A3B8",lineHeight:1.7}}>
            아래 3개 차시의 커리큘럼을 확인하고, <strong style={{color:"#E2E8F0"}}>참석을 원하는 차시를 선택</strong>해 신청해주세요. (중복 신청 가능)
          </p>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            <span style={{background:"#1E293B",color:"#93C5FD",fontSize:12,fontWeight:600,borderRadius:8,padding:"6px 12px"}}>✔ 차시 중복 신청 가능</span>
            <span style={{background:"#1E293B",color:"#FCD34D",fontSize:12,fontWeight:600,borderRadius:8,padding:"6px 12px"}}>⏱️ 중간 이탈 없이 참석</span>
          </div>
        </div>

        {/* 수료 조건 안내 */}
        <div style={{background:"#FFFBEB",border:"1.5px solid #FDE68A",borderRadius:12,padding:"14px 18px",marginBottom:18,fontSize:13,color:"#92400E",lineHeight:1.7}}>
          <strong>📌 수료 조건</strong> — 차시별 실질 교육시간은 점심시간(1시간)을 제외하고 <strong>5~6시간</strong>입니다. 중간 이탈 없이 참석 가능한 차시를 선택해주세요.
        </div>

        {/* 신청자 정보 */}
        <div style={{background:"#fff",border:"1.5px solid #E2E8F0",borderRadius:14,padding:"20px",marginBottom:18}}>
          <div style={{fontSize:13,fontWeight:800,color:"#0F172A",marginBottom:14}}>신청자 정보</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:"#475569",display:"block",marginBottom:6}}>이름 <span style={{color:"#EF4444"}}>*</span></label>
              <input type="text" placeholder="홍길동" value={data.name} onChange={e=>set("name",e.target.value)}
                style={{width:"100%",boxSizing:"border-box",border:"1.5px solid #E2E8F0",borderRadius:8,padding:"10px 12px",fontSize:13,outline:"none",color:"#1E293B",fontFamily:"inherit"}}/>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:"#475569",display:"block",marginBottom:6}}>소속 / 부서 <span style={{color:"#EF4444"}}>*</span></label>
              <input type="text" placeholder="예: 해외영업본부" value={data.department} onChange={e=>set("department",e.target.value)}
                style={{width:"100%",boxSizing:"border-box",border:"1.5px solid #E2E8F0",borderRadius:8,padding:"10px 12px",fontSize:13,outline:"none",color:"#1E293B",fontFamily:"inherit"}}/>
            </div>
          </div>
        </div>

        {/* 차시 선택 */}
        <div style={{fontSize:13,fontWeight:800,color:"#0F172A",margin:"0 2px 12px"}}>참석 희망 차시 선택 <span style={{color:"#EF4444"}}>*</span> <span style={{fontSize:11,fontWeight:400,color:"#94A3B8"}}>(1개 이상 · 중복 선택 가능)</span></div>
        {SESSIONS.map(s=>(
          <SessionCard key={s.key} s={s} checked={data[s.key]} onToggle={()=>set(s.key,!data[s.key])}/>
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
            {btnLabel}
          </button>
        </div>

        <div style={{textAlign:"center",padding:"6px 0 4px",fontSize:12,color:"#94A3B8"}}>가온그룹 전사공통 AI 실무교육 · 한국AI교육진흥원</div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
