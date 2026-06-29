const { useState, useEffect, useCallback } = React;
const SUPABASE_URL = "https://mrdmywosqzaqukdfvbzv.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yZG15d29zcXphcXVrZGZ2Ynp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzIzNTksImV4cCI6MjA4OTU0ODM1OX0.D2PKVx9cqyAg-qIpKdtUX9z9AwdjDwNgo6Nsyy4vdNM";
const DASHBOARD_PASSWORD = "kaon2025";
const GOOGLE_CLIENT_ID = "770804220578-liqpktplntk748tha451cddek97uc3m4.apps.googleusercontent.com";

const HEADERS = { "apikey":SUPABASE_KEY, "Authorization":`Bearer ${SUPABASE_KEY}` };

const DEPARTMENTS = [
  { id:"d4", name:"영업본부", sub:"", total:36 },
  { id:"d5", name:"Corporate실", sub:"피플그룹 · 비전그룹", total:27 },
  { id:"d6", name:"PI그룹", sub:"", total:8 },
  { id:"d7", name:"경영지원본부", sub:"재무 · 회계 · IP", total:11 },
  { id:"d8", name:"RM본부 (ESG팀)", sub:"", total:3 },
  { id:"d9", name:"ProjectManage본부", sub:"", total:18 },
];
const G3 = { label:"3차수", date:"7/15~7/16", color:"#059669", bg:"#ECFDF5", border:"#A7F3D0", tag:"#D1FAE5", tagText:"#065F46" };
const G4 = { label:"4차수", date:"7/20~7/21", color:"#D97706", bg:"#FFFBEB", border:"#FDE68A", tag:"#FEF3C7", tagText:"#92400E" };
const G5 = { label:"5차수", date:"7/22~7/23", color:"#DC2626", bg:"#FEF2F2", border:"#FECACA", tag:"#FEE2E2", tagText:"#991B1B" };
const GROUPS = [G3, G4, G5];
const GK = ["g3","g4","g5"];

const parseNotes = (s) => { if(!s)return[]; try{return JSON.parse(s);}catch{return s?[{name:"-",reason:s}]:[];} };

async function fetchRows() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/training_submissions_g345?select=*&order=submitted_at.desc`,{headers:HEADERS});
  if(!res.ok) throw new Error("데이터 조회 실패"); return res.json();
}
async function deleteRow(id) {
  await fetch(`${SUPABASE_URL}/rest/v1/training_submissions_g345?id=eq.${id}`,{method:"DELETE",headers:{...HEADERS,"Content-Type":"application/json"}});
}

function exportCSV(rows) {
  const h = ["부서명","제출자","3차수 인원","3차수 명단","4차수 인원","4차수 명단","5차수 인원","5차수 명단","비고","인원상태","제출일시"];
  const lines = [h.join(","), ...rows.map(r=>{
    const dept=DEPARTMENTS.find(d=>d.id===r.department_id);
    const tot=GK.reduce((s,k)=>s+(r[`${k}_count`]||0),0); const diff=dept?tot-dept.total:0;
    const st=diff===0?"일치":diff>0?`${diff}명 초과`:`${Math.abs(diff)}명 부족`;
    return [`"${r.department_name}"`,`"${r.submitter}"`,
      ...GK.flatMap(k=>[r[`${k}_count`],`"${(r[`${k}_names`]||"").replace(/\n/g," / ")}"`]),
      `"${parseNotes(r.note).map(n=>`${n.name}: ${n.reason}`).join(" | ")}"`,`"${st}"`,
      `"${new Date(r.submitted_at).toLocaleString("ko-KR")}"`].join(",");
  })];
  const blob=new Blob(["\uFEFF"+lines.join("\n")],{type:"text/csv;charset=utf-8;"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="교육배정현황_3-4-5차수.csv"; a.click();
}

async function exportToGoogleSheets(rows) {
  if(GOOGLE_CLIENT_ID==="YOUR_CLIENT_ID.apps.googleusercontent.com") throw new Error("SETUP_REQUIRED");
  await new Promise((res,rej)=>{
    if(window.google?.accounts){res();return;}
    const s=document.createElement("script"); s.src="https://accounts.google.com/gsi/client";
    s.onload=res; s.onerror=()=>rej(new Error("GSI 로드 실패")); document.head.appendChild(s);
  });
  const token=await new Promise((res,rej)=>{
    window.google.accounts.oauth2.initTokenClient({
      client_id:GOOGLE_CLIENT_ID,
      scope:"https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file",
      callback:r=>r.error?rej(new Error(r.error)):res(r.access_token),
    }).requestAccessToken();
  });
  const title=`교육배정현황_3-4-5차수_${new Date().toLocaleDateString("ko-KR")}`;
  const cr=await fetch("https://sheets.googleapis.com/v4/spreadsheets",{
    method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},
    body:JSON.stringify({properties:{title}}),
  });
  const {spreadsheetId}=await cr.json();
  const header=["부서명","제출자","3차수 인원","3차수 명단","4차수 인원","4차수 명단","5차수 인원","5차수 명단","비고","인원상태","제출일시"];
  const values=[header,...rows.map(r=>{
    const dept=DEPARTMENTS.find(d=>d.id===r.department_id);
    const tot=GK.reduce((s,k)=>s+(r[`${k}_count`]||0),0); const diff=dept?tot-dept.total:0;
    const st=diff===0?"일치":diff>0?`${diff}명 초과`:`${Math.abs(diff)}명 부족`;
    return [r.department_name,r.submitter,...GK.flatMap(k=>[r[`${k}_count`],(r[`${k}_names`]||"").replace(/\n/g," / ")]),
      parseNotes(r.note).map(n=>`${n.name}: ${n.reason}`).join(" | "),st,new Date(r.submitted_at).toLocaleString("ko-KR")];
  })];
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=RAW`,{
    method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},
    body:JSON.stringify({values}),
  });
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
}

function PasswordGate({onSuccess}) {
  const [pw,setPw]=useState(""); const [err,setErr]=useState(false); const [shake,setShake]=useState(false);
  const tryLogin=()=>{
    if(pw===DASHBOARD_PASSWORD){onSuccess();return;}
    setErr(true);setShake(true);setTimeout(()=>setShake(false),500);setPw("");
  };
  return (
    <div style={{minHeight:"100vh",background:"#0F172A",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{background:"#1E293B",borderRadius:20,padding:"48px 40px",width:"100%",maxWidth:380,boxShadow:"0 24px 60px rgba(0,0,0,0.4)",transform:shake?"translateX(-6px)":"none",transition:"transform 0.1s"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:36,marginBottom:12}}>🔒</div>
          <h2 style={{margin:"0 0 6px",color:"#F1F5F9",fontSize:20,fontWeight:700}}>관리자 대시보드</h2>
          <p style={{margin:0,color:"#64748B",fontSize:13}}>3·4·5차수 교육 배정 현황</p>
        </div>
        <div style={{marginBottom:16}}>
          <label style={{fontSize:12,fontWeight:600,color:"#94A3B8",display:"block",marginBottom:8}}>비밀번호</label>
          <input type="password" value={pw} onChange={e=>{setPw(e.target.value);setErr(false);}} onKeyDown={e=>e.key==="Enter"&&tryLogin()} placeholder="비밀번호 입력" autoFocus
            style={{width:"100%",boxSizing:"border-box",background:"#0F172A",border:`1.5px solid ${err?"#EF4444":"#334155"}`,borderRadius:10,padding:"12px 14px",fontSize:14,color:"#F1F5F9",outline:"none",fontFamily:"inherit"}}/>
          {err&&<p style={{margin:"8px 0 0",fontSize:12,color:"#EF4444"}}>비밀번호가 올바르지 않습니다.</p>}
        </div>
        <button onClick={tryLogin} style={{width:"100%",padding:13,background:"#059669",color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer"}}>입장하기</button>
      </div>
    </div>
  );
}

function SetupModal({onClose}) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16}}>
      <div style={{background:"#fff",borderRadius:16,padding:"32px 28px",maxWidth:480,width:"100%",boxShadow:"0 24px 60px rgba(0,0,0,0.3)"}}>
        <div style={{fontSize:24,marginBottom:12}}>🛠️</div>
        <h3 style={{margin:"0 0 8px",fontSize:18,fontWeight:700,color:"#0F172A"}}>Google Sheets 연동 설정</h3>
        <p style={{margin:"0 0 20px",fontSize:13,color:"#64748B",lineHeight:1.7}}>Google Sheets로 내보내려면 OAuth 클라이언트 ID 설정이 필요합니다.</p>
        <ol style={{margin:"0 0 20px",padding:"0 0 0 18px",fontSize:13,color:"#334155",lineHeight:2}}>
          <li><a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" style={{color:"#2563EB"}}>Google Cloud Console</a> 접속</li>
          <li>새 프로젝트 생성 → <strong>Google Sheets API</strong> 활성화</li>
          <li>사용자 인증 정보 → OAuth 2.0 클라이언트 ID 생성 (웹 애플리케이션)</li>
          <li>승인된 JS 원본에 <code style={{background:"#F1F5F9",padding:"1px 6px",borderRadius:4}}>https://kaonmarketing2-coder.github.io</code> 추가</li>
          <li>클라이언트 ID를 파일 상단 <code style={{background:"#F1F5F9",padding:"1px 6px",borderRadius:4}}>GOOGLE_CLIENT_ID</code>에 입력</li>
        </ol>
        <button onClick={onClose} style={{width:"100%",padding:"11px",background:"#0F172A",color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer"}}>확인</button>
      </div>
    </div>
  );
}

function Dashboard({onLock}) {
  const [rows,setRows]=useState([]); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
  const [deleting,setDeleting]=useState(null); const [activeTab,setActiveTab]=useState("overview");
  const [gsLoading,setGsLoading]=useState(false); const [gsUrl,setGsUrl]=useState(""); const [gsError,setGsError]=useState("");
  const [showSetup,setShowSetup]=useState(false);

  const load=useCallback(async()=>{setLoading(true);setError("");try{setRows(await fetchRows());}catch(e){setError(e.message);}finally{setLoading(false);}}, []);
  useEffect(()=>{load();},[load]);

  const latestByDept=DEPARTMENTS.map(dept=>({dept,latest:rows.find(r=>r.department_id===dept.id)||null,allRows:rows.filter(r=>r.department_id===dept.id)}));
  const submittedCount=latestByDept.filter(x=>x.latest).length;
  const groupTotals=GK.map(k=>latestByDept.reduce((s,x)=>s+(x.latest?.[`${k}_count`]||0),0));

  const handleDelete=async(id,name)=>{
    if(!window.confirm(`"${name}" 제출 내역을 삭제하시겠습니까?`))return;
    setDeleting(id);await deleteRow(id);await load();setDeleting(null);
  };
  const handleGS=async()=>{
    if(GOOGLE_CLIENT_ID==="YOUR_CLIENT_ID.apps.googleusercontent.com"){setShowSetup(true);return;}
    setGsLoading(true);setGsError("");setGsUrl("");
    try{const url=await exportToGoogleSheets(latestByDept.filter(x=>x.latest).map(x=>x.latest));setGsUrl(url);}
    catch(e){if(e.message==="SETUP_REQUIRED")setShowSetup(true);else setGsError(e.message||"Google Sheets 내보내기 실패");}
    finally{setGsLoading(false);}
  };
  const getStatus=(row,dept)=>{
    const t=GK.reduce((s,k)=>s+(row[`${k}_count`]||0),0);const d=t-dept.total;
    if(d===0)return{text:"인원 일치",color:"#16A34A",bg:"#DCFCE7"};
    if(d>0)return{text:`${d}명 초과`,color:"#DC2626",bg:"#FEF2F2"};
    return{text:`${Math.abs(d)}명 부족`,color:"#D97706",bg:"#FFFBEB"};
  };
  const Btn=(active)=>({padding:"8px 14px",border:active?"none":"1px solid #334155",borderRadius:8,fontSize:12,cursor:"pointer",background:active?"#059669":"#1E293B",color:active?"#fff":"#94A3B8"});

  return (
    <div style={{fontFamily:"'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif",background:"#F1F5F9",minHeight:"100vh",padding:"28px 16px"}}>
      {showSetup&&<SetupModal onClose={()=>setShowSetup(false)}/>}
      <div style={{maxWidth:860,margin:"0 auto"}}>
        <div style={{background:"#0F172A",borderRadius:16,padding:"24px 28px",marginBottom:20,color:"#fff"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
            <div>
              <div style={{fontSize:11,color:"#94A3B8",letterSpacing:1,marginBottom:8}}>ADMIN · 3·4·5차수</div>
              <h1 style={{margin:"0 0 4px",fontSize:20,fontWeight:700,color:"#F1F5F9"}}>교육 배정 현황 대시보드</h1>
              <p style={{margin:0,fontSize:12,color:"#64748B"}}>중복 제출 모두 기록 · 최신 기준 집계</p>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <button onClick={load} style={Btn(false)}>🔄 새로고침</button>
              <button onClick={()=>rows.length&&exportCSV(latestByDept.filter(x=>x.latest).map(x=>x.latest))} disabled={!rows.length} style={Btn(false)}>📥 CSV</button>
              <button onClick={handleGS} disabled={gsLoading||!rows.length} style={Btn(false)}>{gsLoading?"⏳ 내보내는 중...":"📊 Google Sheets"}</button>
              <button onClick={onLock} style={Btn(false)}>🔒 잠금</button>
            </div>
          </div>
          {gsUrl&&<div style={{marginTop:12,padding:"10px 14px",background:"#14532D",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}><span style={{fontSize:12,color:"#86EFAC"}}>✅ Google Sheets 생성 완료</span><a href={gsUrl} target="_blank" rel="noreferrer" style={{fontSize:12,color:"#4ADE80",fontWeight:700,textDecoration:"underline"}}>시트 열기 →</a></div>}
          {gsError&&<div style={{marginTop:12,padding:"10px 14px",background:"#7F1D1D",borderRadius:8,fontSize:12,color:"#FCA5A5"}}>⚠️ {gsError}</div>}

          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginTop:20}}>
            {[{label:"제출 완료",value:`${submittedCount}/${DEPARTMENTS.length}`,sub:"부서",color:"#34D399"},{label:"전체 제출",value:rows.length,sub:"건",color:"#FB923C"},
              {label:"3차수",value:groupTotals[0],sub:"명",color:G3.color},{label:"4차수",value:groupTotals[1],sub:"명",color:G4.color},{label:"5차수",value:groupTotals[2],sub:"명",color:G5.color}
            ].map(c=>(
              <div key={c.label} style={{background:"#1E293B",borderRadius:10,padding:"10px 12px"}}>
                <div style={{fontSize:10,color:"#64748B",marginBottom:4}}>{c.label}</div>
                <div style={{display:"flex",alignItems:"baseline",gap:3}}>
                  <span style={{fontSize:18,fontWeight:700,color:c.color}}>{c.value}</span>
                  <span style={{fontSize:10,color:"#64748B"}}>{c.sub}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop:14,display:"flex",alignItems:"center",gap:10}}>
            <div style={{flex:1,background:"#1E293B",borderRadius:99,height:6,overflow:"hidden"}}>
              <div style={{width:`${(submittedCount/DEPARTMENTS.length)*100}%`,height:"100%",background:"#34D399",borderRadius:99,transition:"width 0.5s"}}/>
            </div>
            <span style={{fontSize:12,color:"#94A3B8",whiteSpace:"nowrap"}}>{Math.round((submittedCount/DEPARTMENTS.length)*100)}%</span>
          </div>
        </div>

        <div style={{display:"flex",gap:4,marginBottom:16,background:"#E2E8F0",borderRadius:10,padding:4}}>
          {[["overview","📋 부서별 현황"],["names","👥 명단 상세"],["history","🕘 전체 이력"]].map(([k,l])=>(
            <button key={k} onClick={()=>setActiveTab(k)} style={{flex:1,padding:"9px 0",border:"none",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600,
              background:activeTab===k?"#fff":"transparent",color:activeTab===k?"#0F172A":"#64748B",boxShadow:activeTab===k?"0 1px 4px rgba(0,0,0,0.1)":"none"}}>{l}</button>
          ))}
        </div>

        {loading&&<div style={{textAlign:"center",padding:"60px 0",color:"#64748B"}}><div style={{fontSize:28,marginBottom:12}}>⏳</div>불러오는 중...</div>}
        {error&&!loading&&<div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:12,padding:"20px",textAlign:"center",color:"#DC2626",fontSize:13}}>⚠️ {error}<button onClick={load} style={{marginLeft:12,padding:"4px 12px",background:"#DC2626",color:"#fff",border:"none",borderRadius:6,fontSize:12,cursor:"pointer"}}>재시도</button></div>}

        {!loading&&!error&&activeTab==="overview"&&(
          <div>
            {latestByDept.map(({dept,latest,allRows})=>{
              const st=latest?getStatus(latest,dept):null;
              return (
                <div key={dept.id} style={{background:"#fff",border:`1.5px solid ${latest?"#E2E8F0":"#FEE2E2"}`,borderRadius:12,marginBottom:12,overflow:"hidden"}}>
                  <div style={{padding:"14px 18px",background:latest?"#F8FAFC":"#FEF2F2",borderBottom:`1px solid ${latest?"#E2E8F0":"#FECACA"}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:"#0F172A"}}>{dept.name}</div>
                      {dept.sub&&<div style={{fontSize:11,color:"#94A3B8",marginTop:1}}>{dept.sub}</div>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      {allRows.length>1&&<span style={{fontSize:11,color:"#F59E0B",background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:99,padding:"2px 8px",fontWeight:600}}>재제출 {allRows.length}건</span>}
                      {st&&<span style={{fontSize:11,fontWeight:600,color:st.color,background:st.bg,borderRadius:99,padding:"2px 8px"}}>{st.text}</span>}
                      <span style={{padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:700,background:latest?"#DCFCE7":"#FEE2E2",color:latest?"#166534":"#DC2626"}}>{latest?"✓ 제출완료":"미제출"}</span>
                    </div>
                  </div>
                  {latest?(
                    <div style={{padding:"14px 18px"}}>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
                        {GROUPS.map((g,i)=>(
                          <div key={g.label} style={{background:g.bg,border:`1px solid ${g.border}`,borderRadius:8,padding:"10px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <div><div style={{fontSize:12,fontWeight:700,color:g.color}}>{g.label}</div><div style={{fontSize:10,color:"#94A3B8"}}>{g.date}</div></div>
                            <div style={{fontSize:18,fontWeight:700,color:g.color}}>{latest[`${GK[i]}_count`]}<span style={{fontSize:11}}>명</span></div>
                          </div>
                        ))}
                      </div>
                      {parseNotes(latest.note).length>0&&(
                        <div style={{padding:"8px 12px",background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:8,marginBottom:8}}>
                          <div style={{fontSize:11,fontWeight:700,color:"#64748B",marginBottom:6}}>📝 비고</div>
                          <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:"3px 12px"}}>
                            {parseNotes(latest.note).map((n,i)=>[<span key={`n${i}`} style={{fontSize:12,fontWeight:700,color:"#334155"}}>{n.name||"—"}</span>,<span key={`r${i}`} style={{fontSize:12,color:"#64748B"}}>{n.reason||"—"}</span>])}
                          </div>
                        </div>
                      )}
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#94A3B8"}}>
                        <span>최신 제출: {latest.submitter} · {new Date(latest.submitted_at).toLocaleString("ko-KR")}</span>
                        <button onClick={()=>handleDelete(latest.id,dept.name)} disabled={deleting===latest.id}
                          style={{fontSize:11,color:"#EF4444",background:"none",border:"1px solid #FECACA",borderRadius:6,padding:"3px 10px",cursor:"pointer"}}>
                          {deleting===latest.id?"삭제 중...":"최신 삭제"}
                        </button>
                      </div>
                    </div>
                  ):<div style={{padding:"14px 18px",fontSize:13,color:"#94A3B8"}}>아직 제출되지 않았습니다.</div>}
                </div>
              );
            })}
          </div>
        )}

        {!loading&&!error&&activeTab==="names"&&(
          <div>
            {GROUPS.map((g,gi)=>(
              <div key={g.label} style={{background:"#fff",border:`1.5px solid ${g.border}`,borderRadius:12,marginBottom:16,overflow:"hidden"}}>
                <div style={{padding:"14px 18px",background:g.bg,borderBottom:`1px solid ${g.border}`}}>
                  <div style={{fontSize:15,fontWeight:700,color:g.color}}>{g.label}</div>
                  <div style={{fontSize:12,color:g.color,opacity:0.8}}>📅 {g.date} · 2일 전일 필수 참석</div>
                </div>
                <div style={{padding:"14px 18px"}}>
                  {latestByDept.filter(x=>x.latest&&x.latest[`${GK[gi]}_count`]>0).map(({dept,latest})=>(
                    <div key={dept.id} style={{marginBottom:14}}>
                      <div style={{fontSize:12,fontWeight:700,color:"#475569",marginBottom:6,display:"flex",justifyContent:"space-between"}}>
                        <span>{dept.name}</span>
                        <span style={{background:g.tag,color:g.tagText,borderRadius:99,fontSize:11,padding:"2px 8px"}}>{latest[`${GK[gi]}_count`]}명</span>
                      </div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                        {(latest[`${GK[gi]}_names`]||"").split("\n").filter(n=>n.trim()).map((n,i)=>(
                          <span key={i} style={{background:"#F1F5F9",color:"#334155",borderRadius:99,fontSize:12,padding:"3px 10px",border:"1px solid #E2E8F0"}}>{n.trim()}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {latestByDept.every(x=>!x.latest||!x.latest[`${GK[gi]}_count`])&&<div style={{color:"#94A3B8",fontSize:13}}>배정 인원이 없습니다.</div>}
                  {latestByDept.some(x=>x.latest&&x.latest[`${GK[gi]}_count`]>0)&&(
                    <div style={{marginTop:14,paddingTop:12,borderTop:"1px solid #E2E8F0",display:"flex",justifyContent:"flex-end",fontSize:13,fontWeight:700,color:g.color}}>
                      총 {groupTotals[gi]}명
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading&&!error&&activeTab==="history"&&(
          <div>
            <div style={{fontSize:13,color:"#64748B",marginBottom:12}}>총 {rows.length}건 · 최신순</div>
            {rows.length===0&&<div style={{background:"#fff",borderRadius:12,padding:"40px",textAlign:"center",color:"#94A3B8",fontSize:13}}>제출 내역이 없습니다.</div>}
            {rows.map((row,i)=>{
              const dept=DEPARTMENTS.find(d=>d.id===row.department_id);
              const st=dept?getStatus(row,dept):null;
              const isLatest=latestByDept.some(x=>x.latest?.id===row.id);
              return (
                <div key={row.id} style={{background:"#fff",border:"1.5px solid #E2E8F0",borderRadius:12,marginBottom:10,overflow:"hidden"}}>
                  <div style={{padding:"12px 16px",background:"#F8FAFC",borderBottom:"1px solid #E2E8F0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:11,color:"#94A3B8",fontWeight:600}}>#{rows.length-i}</span>
                      <span style={{fontSize:13,fontWeight:700,color:"#0F172A"}}>{row.department_name}</span>
                      {isLatest&&<span style={{fontSize:10,background:"#DCFCE7",color:"#166534",borderRadius:99,padding:"2px 7px",fontWeight:700}}>최신</span>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      {st&&<span style={{fontSize:11,color:st.color,background:st.bg,borderRadius:99,padding:"2px 8px",fontWeight:600}}>{st.text}</span>}
                      <span style={{fontSize:11,color:"#94A3B8"}}>{new Date(row.submitted_at).toLocaleString("ko-KR")}</span>
                      <button onClick={()=>handleDelete(row.id,row.department_name)} disabled={deleting===row.id}
                        style={{fontSize:11,color:"#EF4444",background:"none",border:"1px solid #FECACA",borderRadius:6,padding:"3px 8px",cursor:"pointer"}}>{deleting===row.id?"...":"삭제"}</button>
                    </div>
                  </div>
                  <div style={{padding:"12px 16px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                    {GROUPS.map((g,gi)=>(
                      <div key={g.label} style={{background:g.bg,border:`1px solid ${g.border}`,borderRadius:8,padding:"8px 10px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                          <span style={{fontSize:11,fontWeight:700,color:g.color}}>{g.label}</span>
                          <span style={{fontSize:11,color:g.tagText,background:g.tag,borderRadius:99,padding:"1px 6px"}}>{row[`${GK[gi]}_count`]}명</span>
                        </div>
                        <div style={{fontSize:11,color:"#475569",lineHeight:1.7}}>
                          {(row[`${GK[gi]}_names`]||"").split("\n").filter(n=>n.trim()).map((n,j)=><div key={j}>· {n}</div>)}
                          {!row[`${GK[gi]}_count`]&&<span style={{color:"#CBD5E1"}}>미배정</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{padding:"8px 16px",borderTop:"1px solid #E2E8F0",fontSize:11,color:"#94A3B8",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:4}}>
                    <span>제출자: {row.submitter}</span>
                    {parseNotes(row.note).length>0&&<span>📝 {parseNotes(row.note).map((n,i)=><span key={i}><strong>{n.name}</strong>{n.reason?`: ${n.reason}`:""}{i<parseNotes(row.note).length-1?" · ":""}</span>)}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div style={{textAlign:"center",padding:"16px 0 4px",fontSize:11,color:"#94A3B8"}}>Supabase · kaon-mentoring</div>
      </div>
    </div>
  );
}

function App() {
  const [unlocked,setUnlocked]=useState(false);
  return unlocked?<Dashboard onLock={()=>setUnlocked(false)}/>:<PasswordGate onSuccess={()=>setUnlocked(true)}/>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
