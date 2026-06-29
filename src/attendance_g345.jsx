const { useState } = React;
const SUPABASE_URL = "https://mrdmywosqzaqukdfvbzv.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yZG15d29zcXphcXVrZGZ2Ynp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzIzNTksImV4cCI6MjA4OTU0ODM1OX0.D2PKVx9cqyAg-qIpKdtUX9z9AwdjDwNgo6Nsyy4vdNM";
const HEADERS = { "Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":`Bearer ${SUPABASE_KEY}` };

const DEPARTMENTS = [
  { id:"d4", name:"영업본부", sub:"", total:38 },
  { id:"d5", name:"Corporate실", sub:"피플그룹 · 비전그룹", total:28 },
  { id:"d6", name:"PI그룹", sub:"", total:8 },
  { id:"d7", name:"경영지원본부", sub:"재무 · 회계 · IP · ESG팀", total:14 },
  { id:"d9", name:"ProjectManage본부", sub:"", total:18 },
];

const G3 = { label:"3차수", date:"7/15(화) ~ 7/16(수)", color:"#059669", bg:"#ECFDF5", border:"#A7F3D0", tag:"#D1FAE5", tagText:"#065F46" };
const G4 = { label:"4차수", date:"7/20(일) ~ 7/21(월)", color:"#D97706", bg:"#FFFBEB", border:"#FDE68A", tag:"#FEF3C7", tagText:"#92400E" };
const G5 = { label:"5차수", date:"7/22(화) ~ 7/23(수)", color:"#DC2626", bg:"#FEF2F2", border:"#FECACA", tag:"#FEE2E2", tagText:"#991B1B" };
const GROUPS = [G3, G4, G5];
const GROUP_KEYS = ["g3Names","g4Names","g5Names"];

const newNoteRow = () => ({ id:Date.now()+Math.random(), name:"", reason:"" });
const initData = () => Object.fromEntries(DEPARTMENTS.map(d=>[d.id,{ submitter:"", g3Names:"", g4Names:"", g5Names:"", noteItems:[] }]));
const serializeNotes = (items) => { const f=items.filter(n=>n.name.trim()||n.reason.trim()); return f.length?JSON.stringify(f.map(n=>({name:n.name.trim(),reason:n.reason.trim()}))):""; };
const parseNotes = (s) => { if(!s)return[]; try{return JSON.parse(s);}catch{return s?[{name:"-",reason:s}]:[];} };

async function insertSubmission(dept, data) {
  const counts = GROUP_KEYS.map(k => data[k].split("\n").filter(n=>n.trim()).length);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/training_submissions_g345`,{
    method:"POST", headers:{...HEADERS,"Prefer":"return=representation"},
    body:JSON.stringify({
      department_id:dept.id, department_name:dept.name, submitter:data.submitter,
      g3_names:data.g3Names, g3_count:counts[0],
      g4_names:data.g4Names, g4_count:counts[1],
      g5_names:data.g5Names, g5_count:counts[2],
      note:serializeNotes(data.noteItems), submitted_at:new Date().toISOString(),
    }),
  });
  if(!res.ok) throw new Error("제출 실패. 잠시 후 다시 시도해주세요.");
  return (await res.json())[0]?.id;
}

function NoteTable({ items, onChange }) {
  const add = () => onChange([...items, newNoteRow()]);
  const remove = (id) => onChange(items.filter(r=>r.id!==id));
  const update = (id,field,value) => onChange(items.map(r=>r.id===id?{...r,[field]:value}:r));
  const inp = { width:"100%", boxSizing:"border-box", border:"1px solid #E2E8F0", borderRadius:6, padding:"7px 10px", fontSize:13, color:"#334155", outline:"none", fontFamily:"inherit", background:"#fff" };
  return (
    <div>
      {items.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 2fr 32px",gap:6,marginBottom:4}}>
          <div style={{fontSize:11,fontWeight:700,color:"#64748B"}}>이름</div>
          <div style={{fontSize:11,fontWeight:700,color:"#64748B"}}>사유</div>
          <div/>
        </div>
      )}
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {items.map(row=>(
          <div key={row.id} style={{display:"grid",gridTemplateColumns:"1fr 2fr 32px",gap:6,alignItems:"center"}}>
            <input type="text" placeholder="홍길동" value={row.name} onChange={e=>update(row.id,"name",e.target.value)} style={inp}
              onFocus={e=>e.target.style.borderColor="#94A3B8"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/>
            <input type="text" placeholder="예: 7/15 외부 출장으로 4차수 변경 요청" value={row.reason} onChange={e=>update(row.id,"reason",e.target.value)} style={inp}
              onFocus={e=>e.target.style.borderColor="#94A3B8"} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/>
            <button onClick={()=>remove(row.id)} style={{width:32,height:32,borderRadius:6,border:"1px solid #FECACA",background:"#FEF2F2",color:"#EF4444",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>−</button>
          </div>
        ))}
      </div>
      <button onClick={add} style={{marginTop:items.length>0?8:0,display:"flex",alignItems:"center",gap:6,padding:"7px 14px",background:"#F8FAFC",border:"1.5px dashed #CBD5E1",borderRadius:8,fontSize:12,color:"#64748B",cursor:"pointer",width:"100%",justifyContent:"center",fontWeight:600}}>
        <span style={{fontSize:16,lineHeight:1}}>+</span> 항목 추가
      </button>
    </div>
  );
}

function NameInput({ value, onChange, placeholder, color }) {
  return (
    <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={4}
      style={{width:"100%",boxSizing:"border-box",border:"1.5px solid #E2E8F0",borderRadius:8,padding:"10px 12px",fontSize:13,lineHeight:1.7,color:"#334155",resize:"vertical",outline:"none",fontFamily:"inherit",background:"#fff"}}
      onFocus={e=>e.target.style.borderColor=color} onBlur={e=>e.target.style.borderColor="#E2E8F0"}/>
  );
}

function DeptForm({ dept, data, onChange, onSubmitSuccess, isSubmitted, onEditRequest }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const counts = GROUP_KEYS.map(k=>data[k].split("\n").filter(n=>n.trim()).length);
  const total = counts.reduce((a,b)=>a+b,0);
  const diff = total - dept.total;
  const canSubmit = data.submitter.trim().length>0;

  const getStatus = () => {
    if(total===0) return null;
    if(diff===0) return {text:"인원 일치",color:"#16A34A",bg:"#DCFCE7"};
    if(diff>0) return {text:`${diff}명 초과`,color:"#DC2626",bg:"#FEF2F2"};
    return {text:`${Math.abs(diff)}명 부족`,color:"#D97706",bg:"#FFFBEB"};
  };
  const status = getStatus();

  const handleSubmit = async () => {
    if(!canSubmit||loading) return;
    setLoading(true); setError("");
    try { await insertSubmission(dept, data); onSubmitSuccess(); }
    catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{background:isSubmitted?"#F0FDF4":"#fff",border:`1.5px solid ${isSubmitted?"#86EFAC":"#E2E8F0"}`,borderRadius:14,overflow:"hidden",marginBottom:16}}>
      <div style={{padding:"16px 20px",background:isSubmitted?"#DCFCE7":"#F8FAFC",borderBottom:`1px solid ${isSubmitted?"#BBF7D0":"#E2E8F0"}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:15,fontWeight:700,color:"#0F172A"}}>{dept.name}</div>
          {dept.sub&&<div style={{fontSize:12,color:"#94A3B8",marginTop:2}}>{dept.sub}</div>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{background:"#E2E8F0",color:"#475569",borderRadius:99,fontSize:12,fontWeight:700,padding:"3px 12px"}}>전체 {dept.total}명</span>
          {isSubmitted&&<span style={{background:"#22C55E",color:"#fff",borderRadius:99,fontSize:11,fontWeight:700,padding:"3px 12px"}}>✓ 제출완료</span>}
        </div>
      </div>

      {isSubmitted?(
        <div style={{padding:"20px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
            {GROUPS.map((g,i)=>(
              <div key={g.label} style={{background:g.bg,border:`1px solid ${g.border}`,borderRadius:10,padding:"12px 14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <span style={{fontSize:12,fontWeight:700,color:g.color}}>{g.label}</span>
                  <span style={{background:g.tag,color:g.tagText,fontSize:11,fontWeight:700,borderRadius:99,padding:"2px 8px"}}>{counts[i]}명</span>
                </div>
                <div style={{fontSize:12,color:"#475569",lineHeight:1.8}}>
                  {data[GROUP_KEYS[i]].split("\n").filter(n=>n.trim()).length>0
                    ?data[GROUP_KEYS[i]].split("\n").filter(n=>n.trim()).map((n,j)=><div key={j}>· {n}</div>)
                    :<span style={{color:"#CBD5E1"}}>미배정</span>}
                </div>
              </div>
            ))}
          </div>
          {total>0&&total!==dept.total&&(
            <div style={{fontSize:12,padding:"7px 12px",borderRadius:8,marginBottom:12,background:diff>0?"#FEF2F2":"#FFFBEB",color:diff>0?"#DC2626":"#D97706",border:`1px solid ${diff>0?"#FECACA":"#FDE68A"}`}}>
              ⚠️ 배정 인원({total}명)이 전체 인원({dept.total}명)과 {diff>0?`${diff}명 초과`:`${Math.abs(diff)}명 부족`}합니다.
            </div>
          )}
          {data.noteItems.filter(n=>n.name||n.reason).length>0&&(
            <div style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:8,padding:"10px 14px",marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:700,color:"#64748B",marginBottom:8}}>비고</div>
              <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:"3px 12px"}}>
                {parseNotes(serializeNotes(data.noteItems)).map((n,i)=>[
                  <span key={`n${i}`} style={{fontSize:12,fontWeight:700,color:"#334155"}}>{n.name||"—"}</span>,
                  <span key={`r${i}`} style={{fontSize:12,color:"#64748B"}}>{n.reason||"—"}</span>
                ])}
              </div>
            </div>
          )}
          <div style={{fontSize:12,color:"#94A3B8",marginBottom:10}}>제출자: {data.submitter}</div>
          <button onClick={onEditRequest} style={{fontSize:12,color:"#64748B",background:"none",border:"1px solid #CBD5E1",borderRadius:6,padding:"5px 14px",cursor:"pointer"}}>재제출하기</button>
        </div>
      ):(
        <div style={{padding:"20px"}}>
          <div style={{marginBottom:18}}>
            <label style={{fontSize:12,fontWeight:700,color:"#475569",display:"block",marginBottom:6}}>제출자 <span style={{color:"#EF4444"}}>*</span></label>
            <input type="text" placeholder="이름 · 직책 (예: 홍길동 팀장)" value={data.submitter} onChange={e=>onChange("submitter",e.target.value)}
              style={{width:"100%",boxSizing:"border-box",border:"1.5px solid #E2E8F0",borderRadius:8,padding:"10px 12px",fontSize:13,outline:"none",color:"#1E293B",fontFamily:"inherit"}}/>
          </div>
          <div style={{background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:8,padding:"10px 14px",marginBottom:18,fontSize:12,color:"#92400E"}}>
            💡 배정된 차수의 교육은 <strong>2일 전일 필수 참석</strong>입니다. 이름을 한 줄에 한 명씩 입력해주세요.
          </div>

          {/* 3개 차수 입력 */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
            {GROUPS.map((g,i)=>(
              <div key={g.label} style={{border:`1.5px solid ${g.border}`,borderRadius:10,overflow:"hidden"}}>
                <div style={{background:g.bg,padding:"10px 12px",borderBottom:`1px solid ${g.border}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:12,fontWeight:700,color:g.color}}>{g.label}</span>
                    <span style={{background:g.tag,color:g.tagText,fontSize:11,fontWeight:700,borderRadius:99,padding:"2px 6px"}}>{counts[i]}명</span>
                  </div>
                  <div style={{fontSize:10,color:g.color,opacity:0.8,marginTop:2}}>📅 {g.date}</div>
                </div>
                <div style={{padding:"8px"}}>
                  <NameInput value={data[GROUP_KEYS[i]]} onChange={v=>onChange(GROUP_KEYS[i],v)} placeholder={"홍길동\n김철수"} color={g.color}/>
                </div>
              </div>
            ))}
          </div>

          {/* 카운터 */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:8,marginBottom:20,fontSize:13}}>
            <span style={{color:"#64748B"}}>배정 현황:</span>
            {counts.map((c,i)=>[
              i>0&&<span key={`plus${i}`} style={{color:"#94A3B8"}}>+</span>,
              <span key={`c${i}`} style={{fontWeight:700,color:GROUPS[i].color}}>{c}명</span>
            ])}
            <span style={{color:"#94A3B8"}}>=</span>
            <span style={{fontWeight:700,color:total===dept.total?"#16A34A":total>dept.total?"#DC2626":"#64748B"}}>{total}명</span>
            <span style={{color:"#94A3B8"}}>/</span>
            <span style={{fontWeight:700,color:"#0F172A"}}>{dept.total}명</span>
            {status&&<span style={{fontSize:11,color:status.color,background:status.bg,padding:"2px 8px",borderRadius:99,fontWeight:600}}>{status.text}</span>}
          </div>

          {/* 비고 */}
          <div style={{marginBottom:20}}>
            <label style={{fontSize:12,fontWeight:700,color:"#475569",display:"block",marginBottom:8}}>
              비고 <span style={{fontSize:11,color:"#94A3B8",fontWeight:400}}>(선택 · 예외 사유 등)</span>
            </label>
            <NoteTable items={data.noteItems} onChange={items=>onChange("noteItems",items)}/>
          </div>

          {error&&<div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:12,color:"#DC2626"}}>⚠️ {error}</div>}
          <button onClick={handleSubmit} disabled={!canSubmit||loading}
            style={{width:"100%",padding:"12px",border:"none",borderRadius:10,fontSize:14,fontWeight:700,transition:"all 0.2s",
              cursor:canSubmit&&!loading?"pointer":"not-allowed",
              background:canSubmit&&!loading?"#0F172A":"#E2E8F0",
              color:canSubmit&&!loading?"#fff":"#94A3B8"}}>
            {loading?"저장 중...":!data.submitter.trim()?"제출자 이름을 입력해주세요":"제출하기 →"}
          </button>
        </div>
      )}
    </div>
  );
}

function App() {
  const [formData, setFormData] = useState(initData());
  const [submittedSet, setSubmittedSet] = useState({});
  const update = (id,field,value) => setFormData(p=>({...p,[id]:{...p[id],[field]:value}}));
  const submittedCount = DEPARTMENTS.filter(d=>submittedSet[d.id]).length;
  const progress = Math.round((submittedCount/DEPARTMENTS.length)*100);

  return (
    <div style={{fontFamily:"'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif",background:"#F1F5F9",minHeight:"100vh",padding:"28px 16px"}}>
      <div style={{maxWidth:820,margin:"0 auto"}}>
        <div style={{background:"#0F172A",borderRadius:16,padding:"28px 32px",marginBottom:20,color:"#fff"}}>
          <div style={{display:"inline-flex",alignItems:"center",background:"#1E293B",borderRadius:99,padding:"4px 12px",fontSize:11,color:"#94A3B8",marginBottom:14,letterSpacing:1}}>
            3 · 4 · 5차수 대상
          </div>
          <h1 style={{margin:"0 0 8px",fontSize:22,fontWeight:700,color:"#F1F5F9"}}>교육 참석 차수 배정 제출</h1>
          <p style={{margin:"0 0 20px",fontSize:13,color:"#94A3B8",lineHeight:1.7}}>
            부서 인원을 아래 세 차수 중 하나에 배정해주세요. 배정된 차수의 교육은 <strong style={{color:"#FCA5A5"}}>2일 전일 필수 참석</strong>입니다.
          </p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
            {GROUPS.map(g=>(
              <div key={g.label} style={{background:"#1E293B",borderRadius:10,padding:"12px 14px"}}>
                <div style={{fontSize:12,fontWeight:700,color:g.color,marginBottom:4}}>{g.label}</div>
                <div style={{fontSize:12,color:"#E2E8F0",fontWeight:600}}>{g.date}</div>
                <div style={{fontSize:11,color:"#64748B",marginTop:2}}>2일 전일 필수</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{flex:1,background:"#1E293B",borderRadius:99,height:6,overflow:"hidden"}}>
              <div style={{width:`${progress}%`,height:"100%",background:"#34D399",borderRadius:99,transition:"width 0.4s"}}/>
            </div>
            <span style={{fontSize:12,color:"#94A3B8",whiteSpace:"nowrap"}}>{submittedCount} / {DEPARTMENTS.length} 부서 제출</span>
          </div>
        </div>

        {DEPARTMENTS.map(dept=>(
          <DeptForm key={dept.id} dept={dept} data={formData[dept.id]}
            onChange={(field,value)=>update(dept.id,field,value)}
            onSubmitSuccess={()=>setSubmittedSet(p=>({...p,[dept.id]:true}))}
            isSubmitted={!!submittedSet[dept.id]}
            onEditRequest={()=>setSubmittedSet(p=>{const n={...p};delete n[dept.id];return n;})}/>
        ))}

        {submittedCount===DEPARTMENTS.length&&(
          <div style={{background:"#F0FDF4",border:"1.5px solid #86EFAC",borderRadius:14,padding:"24px",textAlign:"center"}}>
            <div style={{fontSize:28,marginBottom:8}}>✅</div>
            <div style={{fontSize:16,fontWeight:700,color:"#166534",marginBottom:4}}>모든 부서 제출이 완료되었습니다</div>
            <div style={{fontSize:13,color:"#4ADE80"}}>결과는 관리자 대시보드에서 확인 가능합니다</div>
          </div>
        )}
        <div style={{textAlign:"center",padding:"20px 0 4px",fontSize:11,color:"#94A3B8"}}>문의: 담당자에게 연락주세요</div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
