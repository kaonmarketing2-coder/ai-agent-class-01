const { useState, useEffect, useCallback } = React;
const SUPABASE_URL = "https://mrdmywosqzaqukdfvbzv.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yZG15d29zcXphcXVrZGZ2Ynp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzIzNTksImV4cCI6MjA4OTU0ODM1OX0.D2PKVx9cqyAg-qIpKdtUX9z9AwdjDwNgo6Nsyy4vdNM";
const DASHBOARD_PASSWORD = "kaon2025";
const TABLE = "curriculum_enrollments";
const HEADERS = { "apikey":SUPABASE_KEY, "Authorization":`Bearer ${SUPABASE_KEY}` };
// (수료 조건 문구에서 시간 기준 표현 제거)

const SESSIONS = [
  { key:"s1", label:"1차시", title:"Claude 제대로 시작하기", date:"7/27(월) 11:00~18:00", hours:6, color:"#4361EE", bg:"#EEF2FF", border:"#C7D2FE", tag:"#E0E7FF", tagText:"#3730A3" },
  { key:"s2", label:"2차시", title:"실무 산출물 직접 만들기", date:"7/28(화) 09:00~15:00", hours:5, color:"#7C3AED", bg:"#F5F3FF", border:"#DDD6FE", tag:"#EDE9FE", tagText:"#5B21B6" },
  { key:"s3", label:"3차시", title:"반복업무 표준화·자동화", date:"7/30(목) 11:00~18:00", hours:6, color:"#059669", bg:"#ECFDF5", border:"#A7F3D0", tag:"#D1FAE5", tagText:"#065F46" },
];
const SKEYS = SESSIONS.map(s=>s.key);

async function fetchRows() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?select=*&order=submitted_at.desc`,{headers:HEADERS});
  if(!res.ok) throw new Error("데이터 조회 실패"); return res.json();
}
async function deleteRow(id) {
  await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${id}`,{method:"DELETE",headers:{...HEADERS,"Content-Type":"application/json"}});
}

function sessionsOf(r){ return SESSIONS.filter(s=>r[s.key]); }
function labelsOf(r){ return sessionsOf(r).map(s=>s.label).join(" · ") || "—"; }

function exportCSV(rows) {
  const h = ["이름","소속/부서","신청 차시","1차시","2차시","3차시","신청 차시 수","비고","접수일시"];
  const lines = [h.join(","), ...rows.map(r=>{
    const cnt = SKEYS.filter(k=>r[k]).length;
    return [
      `"${(r.name||"").replace(/"/g,'""')}"`,
      `"${(r.department||"").replace(/"/g,'""')}"`,
      `"${labelsOf(r)}"`,
      r.s1?"O":"", r.s2?"O":"", r.s3?"O":"",
      cnt,
      `"${(r.note||"").replace(/"/g,'""').replace(/\n/g," ")}"`,
      `"${new Date(r.submitted_at).toLocaleString("ko-KR")}"`,
    ].join(",");
  })];
  const blob=new Blob(["﻿"+lines.join("\n")],{type:"text/csv;charset=utf-8;"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="수강신청현황_가온그룹AI교육.csv"; a.click();
}

function PasswordGate({onSuccess}) {
  const [pw,setPw]=useState(""); const [err,setErr]=useState(false); const [shake,setShake]=useState(false);
  const tryLogin=()=>{ if(pw===DASHBOARD_PASSWORD){onSuccess();return;} setErr(true);setShake(true);setTimeout(()=>setShake(false),500);setPw(""); };
  return (
    <div style={{minHeight:"100vh",background:"#0F172A",display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif"}}>
      <div style={{background:"#1E293B",borderRadius:20,padding:"48px 40px",width:"100%",maxWidth:380,boxShadow:"0 24px 60px rgba(0,0,0,0.4)",transform:shake?"translateX(-6px)":"none",transition:"transform 0.1s"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:36,marginBottom:12}}>🔒</div>
          <h2 style={{margin:"0 0 6px",color:"#F1F5F9",fontSize:20,fontWeight:700}}>수강 신청 현황</h2>
          <p style={{margin:0,color:"#64748B",fontSize:13}}>가온그룹 전사공통 AI 실무교육</p>
        </div>
        <div style={{marginBottom:16}}>
          <label style={{fontSize:12,fontWeight:600,color:"#94A3B8",display:"block",marginBottom:8}}>비밀번호</label>
          <input type="password" value={pw} onChange={e=>{setPw(e.target.value);setErr(false);}} onKeyDown={e=>e.key==="Enter"&&tryLogin()} placeholder="비밀번호 입력" autoFocus
            style={{width:"100%",boxSizing:"border-box",background:"#0F172A",border:`1.5px solid ${err?"#EF4444":"#334155"}`,borderRadius:10,padding:"12px 14px",fontSize:14,color:"#F1F5F9",outline:"none",fontFamily:"inherit"}}/>
          {err&&<p style={{margin:"8px 0 0",fontSize:12,color:"#EF4444"}}>비밀번호가 올바르지 않습니다.</p>}
        </div>
        <button onClick={tryLogin} style={{width:"100%",padding:13,background:"#4361EE",color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer"}}>입장하기</button>
      </div>
    </div>
  );
}

function Dashboard() {
  const [rows,setRows]=useState([]); const [loading,setLoading]=useState(true); const [err,setErr]=useState("");
  const [filter,setFilter]=useState("all"); // all | s1 | s2 | s3

  const load=useCallback(async()=>{
    setLoading(true); setErr("");
    try{ setRows(await fetchRows()); }catch(e){ setErr(e.message); }finally{ setLoading(false); }
  },[]);
  useEffect(()=>{ load(); },[load]);

  const handleDelete=async(r)=>{
    if(!window.confirm(`${r.name}님의 신청 내역을 삭제할까요?`)) return;
    await deleteRow(r.id); load();
  };

  const counts = SESSIONS.map(s=>rows.filter(r=>r[s.key]).length);
  const totalPeople = rows.length;
  const filtered = filter==="all" ? rows : rows.filter(r=>r[filter]);

  const card = { background:"#fff",border:"1px solid #E2E8F0",borderRadius:14,padding:"18px 20px" };

  return (
    <div style={{fontFamily:"'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif",background:"#F1F5F9",minHeight:"100vh",padding:"28px 16px"}}>
      <div style={{maxWidth:960,margin:"0 auto"}}>
        {/* 헤더 */}
        <div style={{background:"#0F172A",borderRadius:16,padding:"24px 28px",marginBottom:18,color:"#fff",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
          <div>
            <h1 style={{margin:"0 0 4px",fontSize:20,fontWeight:800}}>수강 신청 현황 대시보드</h1>
            <p style={{margin:0,fontSize:13,color:"#94A3B8"}}>가온그룹 전사공통 AI 실무교육 · 총 {totalPeople}명 접수</p>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={load} style={{padding:"9px 16px",background:"#1E293B",color:"#E2E8F0",border:"1px solid #334155",borderRadius:9,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>↻ 새로고침</button>
            <button onClick={()=>exportCSV(rows)} disabled={!rows.length} style={{padding:"9px 16px",background:rows.length?"#4361EE":"#334155",color:"#fff",border:"none",borderRadius:9,fontSize:13,fontWeight:700,cursor:rows.length?"pointer":"not-allowed",fontFamily:"inherit"}}>⬇ CSV 내보내기</button>
          </div>
        </div>

        {/* 수료 조건 안내 */}
        <div style={{background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:12,padding:"12px 16px",marginBottom:18,fontSize:12.5,color:"#92400E",lineHeight:1.6}}>
          ⏱️ <strong>수료 조건</strong> — 각 차시 중간 이탈 없이 끝까지 참석 시 수료 인정 (차시별 실질 교육시간 5~6시간, 점심 1시간 제외 · 차시 중복 신청 가능)
        </div>

        {/* 차시별 집계 */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:18}}>
          {SESSIONS.map((s,i)=>(
            <div key={s.key} style={{...card,borderColor:s.border,background:s.bg}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <span style={{fontSize:12,fontWeight:800,color:s.color}}>{s.label}</span>
                <span style={{fontSize:11,color:s.tagText,background:s.tag,borderRadius:99,padding:"2px 8px",fontWeight:700}}>{s.hours}H</span>
              </div>
              <div style={{fontSize:13,fontWeight:700,color:"#0F172A",marginBottom:2}}>{s.title}</div>
              <div style={{fontSize:11,color:"#64748B",marginBottom:10}}>{s.date}</div>
              <div style={{fontSize:28,fontWeight:900,color:s.color,lineHeight:1}}>{counts[i]}<span style={{fontSize:14,fontWeight:700,marginLeft:3}}>명</span></div>
            </div>
          ))}
        </div>

        {/* 필터 */}
        <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
          {[{k:"all",t:`전체 (${totalPeople})`},...SESSIONS.map((s,i)=>({k:s.key,t:`${s.label} (${counts[i]})`,c:s.color}))].map(f=>(
            <button key={f.k} onClick={()=>setFilter(f.k)}
              style={{padding:"7px 14px",borderRadius:99,fontSize:12.5,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                border:`1.5px solid ${filter===f.k?(f.c||"#0F172A"):"#E2E8F0"}`,
                background:filter===f.k?(f.c||"#0F172A"):"#fff",
                color:filter===f.k?"#fff":"#475569"}}>{f.t}</button>
          ))}
        </div>

        {/* 명단 테이블 */}
        <div style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:14,overflow:"hidden"}}>
          {loading?(
            <div style={{padding:"40px",textAlign:"center",color:"#94A3B8",fontSize:13}}>불러오는 중...</div>
          ):err?(
            <div style={{padding:"40px",textAlign:"center",color:"#DC2626",fontSize:13}}>⚠️ {err}</div>
          ):filtered.length===0?(
            <div style={{padding:"40px",textAlign:"center",color:"#94A3B8",fontSize:13}}>접수된 신청이 없습니다.</div>
          ):(
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:720}}>
                <thead>
                  <tr style={{background:"#F8FAFC",borderBottom:"1px solid #E2E8F0"}}>
                    {["이름","소속/부서","신청 차시","비고","접수일시",""].map((h,i)=>(
                      <th key={i} style={{padding:"11px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:"#64748B",whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r=>(
                    <tr key={r.id} style={{borderBottom:"1px solid #F1F5F9"}}>
                      <td style={{padding:"11px 14px",fontWeight:700,color:"#0F172A",whiteSpace:"nowrap"}}>{r.name}</td>
                      <td style={{padding:"11px 14px",color:"#475569",whiteSpace:"nowrap"}}>{r.department||"—"}</td>
                      <td style={{padding:"11px 14px"}}>
                        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                          {sessionsOf(r).map(s=>(
                            <span key={s.key} style={{background:s.tag,color:s.tagText,fontSize:11,fontWeight:700,borderRadius:99,padding:"2px 9px",whiteSpace:"nowrap"}}>{s.label}</span>
                          ))}
                          {sessionsOf(r).length===0&&<span style={{color:"#CBD5E1"}}>—</span>}
                        </div>
                      </td>
                      <td style={{padding:"11px 14px",color:"#64748B",maxWidth:200}}>{r.note||"—"}</td>
                      <td style={{padding:"11px 14px",color:"#94A3B8",whiteSpace:"nowrap",fontSize:12}}>{new Date(r.submitted_at).toLocaleString("ko-KR",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"})}</td>
                      <td style={{padding:"11px 14px",textAlign:"right"}}>
                        <button onClick={()=>handleDelete(r)} style={{fontSize:11,color:"#EF4444",background:"none",border:"1px solid #FECACA",borderRadius:6,padding:"4px 10px",cursor:"pointer",whiteSpace:"nowrap"}}>삭제</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{textAlign:"center",padding:"18px 0 4px",fontSize:12,color:"#94A3B8"}}>가온그룹 전사공통 AI 실무교육 · 한국AI교육진흥원</div>
      </div>
    </div>
  );
}

function App() {
  const [ok,setOk]=useState(false);
  return ok ? <Dashboard/> : <PasswordGate onSuccess={()=>setOk(true)}/>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
