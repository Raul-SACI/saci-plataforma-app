import { useState, useEffect } from "react";
import * as XLSX from "xlsx";

const SUPA_URL = "https://qonptlakubiiseoglkdm.supabase.co";
const SUPA_KEY = "sb_publishable_fHe2xHAHL37_RDw4STDRZg_EDv8itlN";
const BUNNY_LIB = "645418";
const BUNNY_CDN = "vz-b64e5e9d-a67.b-cdn.net";
const BUNNY_KEY = "31ebdf0b-51c7-4388-8d3e0f3cdc7f-dad7-49dd";
const bunnyEmbed = (videoId) => `https://iframe.mediadelivery.net/embed/${BUNNY_LIB}/${videoId}?autoplay=false&preload=true`;
const bunnyUpload = async (file, titulo, onProgress) => {
  const createRes = await fetch(`https://video.bunnycdn.com/library/${BUNNY_LIB}/videos`, {
    method:"POST", headers:{"AccessKey":BUNNY_KEY,"Content-Type":"application/json"},
    body: JSON.stringify({title: titulo})
  });
  const {guid} = await createRes.json();
  await new Promise((resolve,reject)=>{
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = e => { if(e.lengthComputable) onProgress(Math.round(e.loaded/e.total*100)); };
    xhr.onload = () => xhr.status===200?resolve():reject();
    xhr.onerror = reject;
    xhr.open("PUT", `https://video.bunnycdn.com/library/${BUNNY_LIB}/videos/${guid}`);
    xhr.setRequestHeader("AccessKey", BUNNY_KEY);
    xhr.send(file);
  });
  return guid;
};

const db = async (path, opts={}) => {
  const res = await fetch(`${SUPA_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, "Content-Type":"application/json", Prefer:"return=representation", ...opts.headers },
    ...opts
  });
  if (!res.ok) { const e = await res.text(); throw new Error(e); }
  const txt = await res.text();
  return txt ? JSON.parse(txt) : [];
};

const NAVY="#0D1B3E", NAVY_MID="#1A2D5A", NAVY_LIGHT="#E8ECF5", RED="#D94F2B", RED_LIGHT="#FAEAE5", BG="#F4F6FB", BORDER="#D0D8EC", TEXT="#0D1B3E", MUTED="#5A6A8A";
const SEMANAS=["Semana 1","Semana 2","Semana 3","Semana 4","Semana 5"];
const PLANES={"1_parcial":"Por parcial (1 módulo)","3_parciales":"3 parciales completos","final":"Solo final"};

const s = {
  card:  {background:"#fff",border:`0.5px solid ${BORDER}`,borderRadius:12,overflow:"hidden"},
  irow:  {display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:"#fff",border:`0.5px solid ${BORDER}`,borderRadius:8},
  badge: (bg,col)=>({fontSize:11,padding:"2px 8px",borderRadius:4,background:bg,color:col,fontWeight:500,whiteSpace:"nowrap"}),
  btn:   (bg,col,bc)=>({fontSize:12,padding:"5px 13px",border:`0.5px solid ${bc||bg}`,borderRadius:6,cursor:"pointer",background:bg,color:col,fontWeight:500}),
  btnSm: {fontSize:11,padding:"3px 9px",border:`0.5px solid ${BORDER}`,borderRadius:4,cursor:"pointer",color:MUTED,background:"#fff"},
  input: {padding:"8px 12px",border:`0.5px solid ${BORDER}`,borderRadius:8,fontSize:13,background:"#fff",color:TEXT,width:"100%",outline:"none"},
  label: {fontSize:12,color:MUTED,marginBottom:4,display:"block"},
  topicHdr:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:NAVY,borderRadius:8,marginBottom:7},
  semanaHdr:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 14px",background:NAVY_LIGHT,borderRadius:8,marginBottom:8,fontSize:13,fontWeight:500,color:NAVY},
};

const PdfIcon=()=><svg width="14" height="14" viewBox="0 0 16 16"><rect x="2" y="1" width="10" height="13" rx="2" fill="none" stroke={RED} strokeWidth="1.2"/><line x1="4.5" y1="5" x2="9.5" y2="5" stroke={RED} strokeWidth="1"/><line x1="4.5" y1="7.5" x2="9.5" y2="7.5" stroke={RED} strokeWidth="1"/></svg>;
const FormIcon=({col=NAVY})=><svg width="14" height="14" viewBox="0 0 16 16"><rect x="1.5" y="2" width="13" height="12" rx="2" fill="none" stroke={col} strokeWidth="1.2"/><line x1="4" y1="6" x2="12" y2="6" stroke={col} strokeWidth="1"/><line x1="4" y1="8.5" x2="10" y2="8.5" stroke={col} strokeWidth="1"/></svg>;
const Spin=()=><div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:40}}><div style={{width:28,height:28,border:`3px solid ${BORDER}`,borderTop:`3px solid ${NAVY}`,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

function Nav({user,onLogout}){
  return <div style={{background:NAVY,padding:"10px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <div style={{width:28,height:28,borderRadius:"50%",background:RED,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <svg width="14" height="14" viewBox="0 0 20 20"><circle cx="10" cy="10" r="4" fill="none" stroke="white" strokeWidth="1.5"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </div>
      <div>
        <div style={{fontSize:12,fontWeight:500,color:"#fff"}}>Sistemas Administrativos <span style={{color:"#f4a68a"}}>y de Control Interno</span></div>
        <div style={{fontSize:10,color:"rgba(255,255,255,0.5)"}}>CPN Raúl Emiliano Díaz Cortés</div>
      </div>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <span style={{fontSize:12,color:"rgba(255,255,255,0.7)"}}>{user.nombre}</span>
      <button style={{fontSize:11,padding:"3px 10px",border:"0.5px solid rgba(255,255,255,0.3)",borderRadius:4,background:"transparent",color:"rgba(255,255,255,0.7)",cursor:"pointer"}} onClick={onLogout}>Salir</button>
    </div>
  </div>;
}

function Tabs({tabs,active,onChange}){
  return <div style={{background:NAVY_MID,display:"flex",overflowX:"auto",padding:"0 16px"}}>
    {tabs.map(t=><button key={t.id} onClick={()=>onChange(t.id)} style={{padding:"10px 13px",fontSize:12,color:active===t.id?"#fff":"rgba(255,255,255,0.5)",background:"transparent",border:"none",borderBottom:active===t.id?`2px solid ${RED}`:"2px solid transparent",cursor:"pointer",whiteSpace:"nowrap",fontWeight:active===t.id?500:400,marginBottom:-1}}>{t.label}</button>)}
  </div>;
}

function Alert({msg,type}){
  if(!msg) return null;
  const ok=type==="ok";
  return <div style={{fontSize:12,color:ok?"#3B6D11":"#a32d2d",background:ok?"#EAF3DE":"#FCEBEB",border:`0.5px solid ${ok?"#97C459":"#f09595"}`,borderRadius:6,padding:"8px 12px",marginBottom:10}}>{msg}</div>;
}

// ── LOGIN ──────────────────────────────────────────────────────────────────────
function Login({onLogin}){
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);

  const submit=async()=>{
    setErr(""); setLoading(true);
    try {
      const rows = await db(`alumnos?email=eq.${encodeURIComponent(email)}&select=*`);
      if(!rows.length){ setErr("Email o contraseña incorrectos."); return; }
      const a=rows[0];
      if(a.password!==pass){ setErr("Email o contraseña incorrectos."); return; }
      if(!a.activo){ setErr("Tu acceso está suspendido. Contactá al docente."); return; }
      const rol = a.email==="admin@saci.com"?"admin":"alumno";
      onLogin({...a,rol});
    } catch { setErr("Error de conexión. Intentá de nuevo."); }
    finally { setLoading(false); }
  };

  return <div style={{minHeight:"100vh",background:BG,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
    <div style={{...s.card,width:"100%",maxWidth:380,padding:32}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:24}}>
        <div style={{width:36,height:36,borderRadius:"50%",background:RED,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg width="18" height="18" viewBox="0 0 20 20"><circle cx="10" cy="10" r="4" fill="none" stroke="white" strokeWidth="1.5"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.9 4.9l1.4 1.4M13.7 13.7l1.4 1.4M4.9 15.1l1.4-1.4M13.7 6.3l1.4-1.4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>
        <div>
          <div style={{fontSize:13,fontWeight:500,color:NAVY}}>Sistemas Administrativos</div>
          <div style={{fontSize:11,color:MUTED}}>y de Control Interno</div>
          <div style={{fontSize:10,color:MUTED}}>CPN Raúl Emiliano Díaz Cortés</div>
        </div>
      </div>
      <div style={{marginBottom:14}}><label style={s.label}>Email</label><input style={s.input} value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@email.com" type="email"/></div>
      <div style={{marginBottom:20}}><label style={s.label}>Contraseña</label><input style={s.input} value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••" type="password" onKeyDown={e=>e.key==="Enter"&&submit()}/></div>
      {err&&<Alert msg={err} type="err"/>}
      <button style={{...s.btn(NAVY,"#fff",NAVY),width:"100%",padding:"10px",fontSize:14,opacity:loading?0.7:1}} onClick={submit} disabled={loading}>{loading?"Ingresando...":"Ingresar"}</button>
    </div>
  </div>;
}

// ── ALUMNO ─────────────────────────────────────────────────────────────────────
function AlumnoApp({user,onLogout}){
  const [tab,setTab]=useState("videos");
  const [vidTab,setVidTab]=useState("clases");
  const [materiales,setMateriales]=useState([]);
  const [evals,setEvals]=useState([]);
  const [pagosInfo,setPagosInfo]=useState(null);
  const [movs,setMovs]=useState([]);
  const [loading,setLoading]=useState(false);

  const [videos, setVideos] = useState({});
  const [vidLoading, setVidLoading] = useState(false);
  const [playingId, setPlayingId] = useState(null);

  useEffect(()=>{ if(tab==="videos") loadVideos(); },[tab]);

  const loadVideos = async () => {
    setVidLoading(true);
    try {
      const rows = await db("videos?select=*&order=orden");
      const grouped = {};
      SEMANAS.forEach(s=>{ grouped[s]={clases:[],adicionales:[]}; });
      rows.forEach(v=>{ if(grouped[v.semana]) grouped[v.semana][v.tipo]?.push(v); });
      setVideos(grouped);
    } catch(e){ console.error(e); }
    setVidLoading(false);
  };


  useEffect(()=>{ if(tab==="evaluaciones") loadEvals(); },[tab]);
  useEffect(()=>{ if(tab==="pagos") loadPagos(); },[tab]);

  const loadMateriales=async()=>{ setLoading(true); try{ const m=await db("materiales?select=*,material_items(*)&order=orden"); setMateriales(m); }catch{} setLoading(false); };
  const loadEvals=async()=>{ setLoading(true); try{ setEvals(await db("evaluaciones?select=*&order=titulo")); }catch{} setLoading(false); };
  const loadPagos=async()=>{ setLoading(true); try{
    const p=await db(`pagos?alumno_id=eq.${user.id}&select=*`);
    const m=await db(`movimientos_pago?alumno_id=eq.${user.id}&select=*&order=created_at`);
    setPagosInfo(p[0]||null); setMovs(m);
  }catch{} setLoading(false); };

  const totalPagado=movs.filter(m=>m.estado==="pagado").reduce((a,m)=>a+m.monto,0);
  const totalPend=movs.filter(m=>m.estado==="pendiente").reduce((a,m)=>a+m.monto,0);

  const adminTabs=[{id:"videos",label:"Videos"},{id:"materiales",label:"Materiales"},{id:"evaluaciones",label:"Evaluaciones"},{id:"pagos",label:"Pagos"}];

  return <div style={{background:BG,minHeight:"100vh"}}>
    <Nav user={user} onLogout={onLogout}/>
    <Tabs tabs={adminTabs} active={tab} onChange={setTab}/>
    <div style={{padding:"20px"}}>

      {tab==="videos"&&<div>
        {playingId && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:1000,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
            <div style={{width:"100%",maxWidth:860,position:"relative"}}>
              <div style={{position:"absolute",top:8,right:8,zIndex:10}}>
                <button style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:18}} onClick={()=>setPlayingId(null)}>✕</button>
              </div>
              <div style={{position:"absolute",top:12,left:14,zIndex:10,fontSize:11,color:"rgba(255,255,255,0.18)",pointerEvents:"none",fontFamily:"monospace"}}>{user.email}</div>
              <div style={{position:"absolute",bottom:48,right:20,zIndex:10,fontSize:11,color:"rgba(255,255,255,0.13)",pointerEvents:"none",fontFamily:"monospace"}}>{user.email}</div>
              <div style={{paddingTop:"56.25%",position:"relative",borderRadius:10,overflow:"hidden"}}>
                <iframe src={bunnyEmbed(playingId)} style={{position:"absolute",inset:0,width:"100%",height:"100%",border:"none"}} allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture" allowFullScreen/>
              </div>
            </div>
          </div>
        )}
        <div style={{display:"flex",gap:8,marginBottom:18}}>
          {["clases","adicionales"].map(v=><button key={v} onClick={()=>setVidTab(v)} style={{fontSize:12,padding:"6px 16px",borderRadius:20,border:`0.5px solid ${vidTab===v?NAVY:BORDER}`,background:vidTab===v?NAVY:"#fff",color:vidTab===v?"#fff":MUTED,cursor:"pointer",fontWeight:vidTab===v?500:400}}>{v==="clases"?"Clases en vivo":"Videos adicionales"}</button>)}
        </div>
        {vidLoading?<Spin/>:SEMANAS.map(sem=>{
          const vids=(videos[sem]||{})[vidTab]||[];
          return <div key={sem} style={{marginBottom:20}}>
            <div style={s.semanaHdr}><span>{sem}</span><span style={{fontSize:11,color:MUTED}}>{vids.length>0?`${vids.length} video${vids.length>1?"s":""}`:"Próximamente"}</span></div>
            {vids.length===0
              ? <div style={{fontSize:13,color:MUTED,padding:"4px 0"}}>Los videos de esta semana aún no están disponibles.</div>
              : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:12}}>
                  {vids.map(v=>(
                    <div key={v.id} style={{...s.card,cursor:"pointer"}} onClick={()=>setPlayingId(v.bunny_video_id)}>
                      <div style={{height:96,background:NAVY_MID,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
                        <img src={`https://${BUNNY_CDN}/${v.bunny_video_id}/thumbnail.jpg`} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:0.7}} onError={e=>e.target.style.display="none"}/>
                        <div style={{position:"relative",width:36,height:36,borderRadius:"50%",background:RED,display:"flex",alignItems:"center",justifyContent:"center"}}>
                          <svg width="12" height="12" viewBox="0 0 16 16"><polygon points="5,3 13,8 5,13" fill="white"/></svg>
                        </div>
                      </div>
                      <div style={{padding:"10px 12px"}}>
                        <div style={{fontSize:13,fontWeight:500,color:TEXT,marginBottom:3}}>{v.titulo}</div>
                        <div style={{fontSize:11,color:MUTED}}>{v.duracion||""}</div>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>;
        })}
      </div>}

      {tab==="materiales"&&<div>
        <div style={{fontSize:14,fontWeight:500,color:TEXT,marginBottom:14}}>Materiales de estudio</div>
        {loading?<Spin/>:materiales.length===0?<div style={{fontSize:13,color:MUTED}}>Sin materiales cargados aún.</div>:materiales.map(u=><div key={u.id} style={{marginBottom:16}}>
          <div style={s.topicHdr}><span style={{fontSize:13,fontWeight:500,color:"#fff"}}>{u.unidad}</span><span style={{fontSize:11,color:"rgba(255,255,255,0.6)"}}>{(u.material_items||[]).length} recursos</span></div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {(u.material_items||[]).map(it=><div key={it.id} style={s.irow}>
              <div style={{width:30,height:30,borderRadius:6,background:it.tipo==="pdf"?RED_LIGHT:NAVY_LIGHT,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{it.tipo==="pdf"?<PdfIcon/>:<FormIcon/>}</div>
              <div style={{flex:1}}><div style={{fontSize:13,color:TEXT}}>{it.nombre}</div><div style={{fontSize:11,color:MUTED}}>{it.sub}</div></div>
              <a href={it.url||"#"} target="_blank" rel="noreferrer" style={{textDecoration:"none"}}><button style={it.tipo==="pdf"?s.btn("#fff",MUTED,BORDER):s.btn(NAVY_LIGHT,NAVY,NAVY)}>{it.tipo==="pdf"?"Ver PDF":"Completar"}</button></a>
            </div>)}
          </div>
        </div>)}
      </div>}

      {tab==="evaluaciones"&&<div>
        <div style={{fontSize:14,fontWeight:500,color:TEXT,marginBottom:14}}>Mis evaluaciones</div>
        {loading?<Spin/>:evals.length===0?<div style={{fontSize:13,color:MUTED}}>Sin evaluaciones cargadas aún.</div>:evals.map(ev=><div key={ev.id} style={{...s.card,padding:"14px 16px",display:"flex",alignItems:"center",gap:14,marginBottom:10}}>
          <div style={{width:40,height:40,borderRadius:8,background:NAVY_LIGHT,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><FormIcon/></div>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,color:TEXT,marginBottom:3}}>{ev.titulo}</div><div style={{fontSize:11,color:MUTED}}>{ev.meta}</div></div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
            {ev.estado==="completada"&&<span style={s.badge(RED_LIGHT,RED)}>Completada</span>}
            {ev.estado==="disponible"&&<><span style={s.badge(NAVY_LIGHT,NAVY)}>Disponible</span><a href={ev.link} target="_blank" rel="noreferrer" style={{textDecoration:"none"}}><button style={s.btn(RED,"#fff",RED)}>Rendir ahora</button></a></>}
            {ev.estado==="no_disponible"&&<span style={s.badge("#eee","#888")}>No disponible</span>}
          </div>
        </div>)}
      </div>}

      {tab==="pagos"&&<div>
        <div style={{fontSize:14,fontWeight:500,color:TEXT,marginBottom:16}}>Mi estado de pagos</div>
        {loading?<Spin/>:<>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:20}}>
            {[["Plan",PLANES[pagosInfo?.plan]||"—",NAVY],["Total pagado","$"+totalPagado.toLocaleString(),"#3B6D11"],["Saldo pendiente","$"+totalPend.toLocaleString(),totalPend>0?RED:"#3B6D11"],["Vencimiento",pagosInfo?.vencimiento||"—",totalPend>0?"#A32D2D":"#3B6D11"]].map(([l,v,c])=><div key={l} style={{background:"#fff",border:`0.5px solid ${BORDER}`,borderRadius:8,padding:"12px 14px"}}><div style={{fontSize:11,color:MUTED,marginBottom:4}}>{l}</div><div style={{fontSize:15,fontWeight:500,color:c}}>{v}</div></div>)}
          </div>
          {totalPend>0&&<div style={{background:"#FAEAE5",border:"0.5px solid #f09595",borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:13,color:"#A32D2D"}}>Tenés un pago pendiente con vencimiento el {pagosInfo?.vencimiento}. Contactá al docente para regularizar.</div>}
          <div style={{fontSize:13,fontWeight:500,color:TEXT,marginBottom:10}}>Historial</div>
          <div style={s.card}>
            {movs.length===0?<div style={{padding:16,fontSize:13,color:MUTED}}>Sin movimientos registrados.</div>:movs.map((m,i)=><div key={m.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderBottom:i<movs.length-1?`0.5px solid ${BORDER}`:"none"}}>
              <div style={{flex:1}}><div style={{fontSize:13,color:TEXT,fontWeight:500}}>{m.descripcion}</div><div style={{fontSize:11,color:MUTED}}>{m.fecha}</div></div>
              <div style={{fontSize:14,fontWeight:500,color:m.estado==="pagado"?"#3B6D11":RED}}>${m.monto.toLocaleString()}</div>
              <span style={m.estado==="pagado"?s.badge("#EAF3DE","#3B6D11"):s.badge(RED_LIGHT,RED)}>{m.estado==="pagado"?"Pagado":"Pendiente"}</span>
            </div>)}
          </div>
        </>}
      </div>}
    </div>
  </div>;
}

// ── ADMIN ──────────────────────────────────────────────────────────────────────
function AdminApp({user,onLogout}){
  const [tab,setTab]=useState("alumnos");
  const [alumnos,setAlumnos]=useState([]);
  const [loading,setLoading]=useState(false);
  const [msg,setMsg]=useState({txt:"",type:""});
  const flash=(txt,type="ok")=>{ setMsg({txt,type}); setTimeout(()=>setMsg({txt:"",type:""}),3500); };

  // alumnos
  const [showNuevo,setShowNuevo]=useState(false);
  const [nuevo,setNuevo]=useState({nombre:"",email:"",password:""});

  // pagos
  const [pagosMap,setPagosMap]=useState({});
  const [movsMap,setMovsMap]=useState({});
  const [selAlumno,setSelAlumno]=useState(null);
  const [nuevoPago,setNuevoPago]=useState({descripcion:"",monto:"",fecha:"",estado:"pendiente"});

  // materiales
  const [materiales,setMateriales]=useState([]);
  const [nuevaUnidad,setNuevaUnidad]=useState("");
  const [nuevoItem,setNuevoItem]=useState({material_id:"",tipo:"pdf",nombre:"",sub:"",url:""});
  const [showItem,setShowItem]=useState(null);

  // evaluaciones
  const [evals,setEvals]=useState([]);
  const [nuevaEval,setNuevaEval]=useState({titulo:"",meta:"",link:"",estado:"no_disponible"});
  const [showEval,setShowEval]=useState(false);

  // recordatorios
  const [rec,setRec]=useState({alumno_id:"",fecha:"",mensaje:""});

  useEffect(()=>{ loadAlumnos(); },[]);
  useEffect(()=>{ if(tab==="pagos") loadPagos(); },[tab]);
  useEffect(()=>{ if(tab==="materiales") loadMateriales(); },[tab]);
  useEffect(()=>{ if(tab==="evaluaciones") loadEvals(); },[tab]);

  const loadAlumnos=async()=>{ setLoading(true); try{ setAlumnos(await db("alumnos?select=*&order=nombre")); }catch(e){ flash(e.message,"err"); } setLoading(false); };
  const loadPagos=async()=>{ setLoading(true); try{
    const ps=await db("pagos?select=*"); const ms=await db("movimientos_pago?select=*&order=created_at");
    const pm={},mm={};
    ps.forEach(p=>pm[p.alumno_id]=p);
    ms.forEach(m=>{ if(!mm[m.alumno_id]) mm[m.alumno_id]=[]; mm[m.alumno_id].push(m); });
    setPagosMap(pm); setMovsMap(mm);
  }catch(e){ flash(e.message,"err"); } setLoading(false); };
  const loadMateriales=async()=>{ setLoading(true); try{ setMateriales(await db("materiales?select=*,material_items(*)&order=orden")); }catch(e){ flash(e.message,"err"); } setLoading(false); };
  const loadEvals=async()=>{ setLoading(true); try{ setEvals(await db("evaluaciones?select=*&order=titulo")); }catch(e){ flash(e.message,"err"); } setLoading(false); };

  const agregarAlumno=async()=>{
    if(!nuevo.nombre||!nuevo.email) return;
    try{
      await db("alumnos",{method:"POST",body:JSON.stringify({...nuevo,activo:true})});
      flash(`Alumno ${nuevo.nombre} agregado.`); setNuevo({nombre:"",email:"",password:""}); setShowNuevo(false); loadAlumnos();
    }catch(e){ flash(e.message,"err"); }
  };

  const toggleAcceso=async(a)=>{
    try{ await db(`alumnos?id=eq.${a.id}`,{method:"PATCH",body:JSON.stringify({activo:!a.activo})}); loadAlumnos(); }
    catch(e){ flash(e.message,"err"); }
  };

  const handleImportExcel=e=>{
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=async ev=>{
      try{
        const wb=XLSX.read(ev.target.result,{type:"binary"});
        const ws=wb.Sheets[wb.SheetNames[0]];
        const rows=XLSX.utils.sheet_to_json(ws,{defval:""});
        if(!rows.length){ flash("El archivo está vacío.","err"); return; }
        const nuevos=rows.map(r=>{
          const keys=Object.keys(r);
          const kN=keys.find(k=>k.toLowerCase().includes("nombre"))||"";
          const kM=keys.find(k=>k.toLowerCase().includes("mail")||k.toLowerCase().includes("email")||k.toLowerCase().includes("correo"))||"";
          const kP=keys.find(k=>k.toLowerCase().includes("contrase")||k.toLowerCase().includes("pass"))||"";
          return {nombre:r[kN]||"",email:r[kM]||"",password:r[kP]||"1234",activo:true};
        }).filter(a=>a.nombre&&a.email);
        if(!nuevos.length){ flash("No se encontraron filas válidas.","err"); return; }
        for(const a of nuevos){ try{ await db("alumnos",{method:"POST",body:JSON.stringify(a)}); }catch{} }
        flash(`${nuevos.length} alumno${nuevos.length>1?"s":""} importado${nuevos.length>1?"s":""}.`); loadAlumnos();
      }catch{ flash("No se pudo leer el archivo.","err"); }
    };
    reader.readAsBinaryString(file); e.target.value="";
  };

  const upsertPago=async(alumnoId,field,value)=>{
    const existing=pagosMap[alumnoId];
    if(existing){ await db(`pagos?id=eq.${existing.id}`,{method:"PATCH",body:JSON.stringify({[field]:value})}); }
    else{ await db("pagos",{method:"POST",body:JSON.stringify({alumno_id:alumnoId,[field]:value})}); }
    loadPagos();
  };

  const agregarMovimiento=async(alumnoId)=>{
    if(!nuevoPago.descripcion||!nuevoPago.monto) return;
    try{
      await db("movimientos_pago",{method:"POST",body:JSON.stringify({...nuevoPago,monto:parseInt(nuevoPago.monto),alumno_id:alumnoId})});
      setNuevoPago({descripcion:"",monto:"",fecha:"",estado:"pendiente"}); loadPagos(); flash("Movimiento registrado.");
    }catch(e){ flash(e.message,"err"); }
  };

  const crearUnidad=async()=>{
    if(!nuevaUnidad) return;
    try{ await db("materiales",{method:"POST",body:JSON.stringify({unidad:nuevaUnidad,orden:materiales.length})}); setNuevaUnidad(""); loadMateriales(); flash("Unidad creada."); }
    catch(e){ flash(e.message,"err"); }
  };

  const eliminarUnidad=async(id)=>{
    try{ await db(`materiales?id=eq.${id}`,{method:"DELETE",headers:{}}); loadMateriales(); flash("Unidad eliminada."); }
    catch(e){ flash(e.message,"err"); }
  };

  const agregarItem=async()=>{
    if(!nuevoItem.nombre||!nuevoItem.material_id) return;
    try{ await db("material_items",{method:"POST",body:JSON.stringify(nuevoItem)}); setNuevoItem({material_id:"",tipo:"pdf",nombre:"",sub:"",url:""}); setShowItem(null); loadMateriales(); flash("Recurso agregado."); }
    catch(e){ flash(e.message,"err"); }
  };

  const eliminarItem=async(id)=>{
    try{ await db(`material_items?id=eq.${id}`,{method:"DELETE",headers:{}}); loadMateriales(); }
    catch(e){ flash(e.message,"err"); }
  };

  const crearEval=async()=>{
    if(!nuevaEval.titulo) return;
    try{ await db("evaluaciones",{method:"POST",body:JSON.stringify(nuevaEval)}); setNuevaEval({titulo:"",meta:"",link:"",estado:"no_disponible"}); setShowEval(false); loadEvals(); flash("Evaluación creada."); }
    catch(e){ flash(e.message,"err"); }
  };

  const toggleEvalEstado=async(ev)=>{
    const next=ev.estado==="disponible"?"no_disponible":"disponible";
    try{ await db(`evaluaciones?id=eq.${ev.id}`,{method:"PATCH",body:JSON.stringify({estado:next})}); loadEvals(); }
    catch(e){ flash(e.message,"err"); }
  };

  const eliminarEval=async(id)=>{
    try{ await db(`evaluaciones?id=eq.${id}`,{method:"DELETE",headers:{}}); loadEvals(); flash("Evaluación eliminada."); }
    catch(e){ flash(e.message,"err"); }
  };

  const programarRec=async()=>{
    if(!rec.fecha||!rec.mensaje) return;
    try{
      if(rec.alumno_id){ await db("recordatorios",{method:"POST",body:JSON.stringify(rec)}); }
      else{ for(const a of alumnos){ await db("recordatorios",{method:"POST",body:JSON.stringify({...rec,alumno_id:a.id})}); } }
      flash("Recordatorio programado."); setRec({alumno_id:"",fecha:"",mensaje:""});
    }catch(e){ flash(e.message,"err"); }
  };

  const [adminVideos, setAdminVideos] = useState({});
  const [adminVidLoading, setAdminVidLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUpload, setShowUpload] = useState(null);
  const [nuevoVideo, setNuevoVideo] = useState({titulo:"",semana:"Semana 1",tipo:"clases",duracion:"",file:null});

  const loadAdminVideos = async () => {
    setAdminVidLoading(true);
    try {
      const rows = await db("videos?select=*&order=orden");
      const grouped = {};
      SEMANAS.forEach(s=>{ grouped[s]={clases:[],adicionales:[]}; });
      rows.forEach(v=>{ if(grouped[v.semana]) grouped[v.semana][v.tipo]?.push(v); });
      setAdminVideos(grouped);
    } catch(e){ console.error(e); }
    setAdminVidLoading(false);
  };

  useEffect(()=>{ if(tab==="videos_admin") loadAdminVideos(); },[tab]);

  const handleSubirVideo = async () => {
    if(!nuevoVideo.file||!nuevoVideo.titulo) return;
    setUploading(true); setUploadProgress(0);
    try {
      const guid = await bunnyUpload(nuevoVideo.file, nuevoVideo.titulo, setUploadProgress);
      await db("videos",{method:"POST",body:JSON.stringify({titulo:nuevoVideo.titulo,semana:nuevoVideo.semana,tipo:nuevoVideo.tipo,bunny_video_id:guid,duracion:nuevoVideo.duracion,orden:0})});
      flash("Video subido correctamente."); setNuevoVideo({titulo:"",semana:"Semana 1",tipo:"clases",duracion:"",file:null}); setShowUpload(null); loadAdminVideos();
    } catch(e){ flash("Error al subir el video: "+e.message,"err"); }
    setUploading(false);
  };

  const eliminarVideo = async (id) => {
    try{ await db(`videos?id=eq.${id}`,{method:"DELETE",headers:{}}); loadAdminVideos(); flash("Video eliminado."); }
    catch(e){ flash(e.message,"err"); }
  };



  return <div style={{background:BG,minHeight:"100vh"}}>
    <Nav user={user} onLogout={onLogout}/>
    <Tabs tabs={adminTabs} active={tab} onChange={setTab}/>
    <div style={{padding:"20px"}}>
      <Alert msg={msg.txt} type={msg.type}/>

      {/* ALUMNOS */}
      {tab==="alumnos"&&<div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10,marginBottom:18}}>
          {[["Activos",alumnos.filter(a=>a.activo).length,"#3B6D11"],["Total",alumnos.length,NAVY],["Suspendidos",alumnos.filter(a=>!a.activo).length,"#A32D2D"]].map(([l,v,c])=><div key={l} style={{background:"#fff",border:`0.5px solid ${BORDER}`,borderRadius:8,padding:"12px 13px"}}><div style={{fontSize:20,fontWeight:500,color:c}}>{v}</div><div style={{fontSize:11,color:MUTED,marginTop:2}}>{l}</div></div>)}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
          <div style={{fontSize:14,fontWeight:500,color:TEXT}}>Alumnos</div>
          <div style={{display:"flex",gap:8}}>
            <label style={{...s.btn(NAVY_LIGHT,NAVY,NAVY),cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
              <svg width="14" height="14" viewBox="0 0 16 16"><rect x="1" y="3" width="14" height="11" rx="2" fill="none" stroke={NAVY} strokeWidth="1.2"/><line x1="1" y1="6.5" x2="15" y2="6.5" stroke={NAVY} strokeWidth="1"/><line x1="5" y1="3" x2="5" y2="14" stroke={NAVY} strokeWidth="1"/><line x1="9" y1="3" x2="9" y2="14" stroke={NAVY} strokeWidth="1"/></svg>
              Importar Excel
              <input type="file" accept=".xlsx,.xls" style={{display:"none"}} onChange={handleImportExcel}/>
            </label>
            <button style={s.btn(RED_LIGHT,RED,"#D94F2B")} onClick={()=>setShowNuevo(!showNuevo)}>+ Nuevo alumno</button>
          </div>
        </div>
        {showNuevo&&<div style={{background:"#fff",border:`0.5px solid ${BORDER}`,borderRadius:8,padding:14,marginBottom:14,display:"flex",flexWrap:"wrap",gap:10}}>
          {[["Nombre","nombre","text"],["Email","email","email"],["Contraseña","password","password"]].map(([l,k,t])=><div key={k} style={{flex:"1 1 150px"}}><label style={s.label}>{l}</label><input style={s.input} type={t} value={nuevo[k]} onChange={e=>setNuevo(n=>({...n,[k]:e.target.value}))} placeholder={l}/></div>)}
          <div style={{display:"flex",alignItems:"flex-end"}}><button style={s.btn(NAVY,"#fff",NAVY)} onClick={agregarAlumno}>Guardar</button></div>
        </div>}
        {loading?<Spin/>:<div style={s.card}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,tableLayout:"fixed"}}>
            <thead><tr style={{background:"#F8F9FD"}}>{["Nombre","Email","Estado","Acciones"].map((h,i)=><th key={h} style={{textAlign:"left",padding:"9px 13px",color:MUTED,fontWeight:400,fontSize:12,borderBottom:`0.5px solid ${BORDER}`,width:i===3?"120px":"auto"}}>{h}</th>)}</tr></thead>
            <tbody>{alumnos.map((a,i)=><tr key={a.id}>
              <td style={{padding:"9px 13px",borderBottom:i<alumnos.length-1?`0.5px solid ${BORDER}`:"none",color:TEXT,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.nombre}</td>
              <td style={{padding:"9px 13px",borderBottom:i<alumnos.length-1?`0.5px solid ${BORDER}`:"none",color:MUTED,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.email}</td>
              <td style={{padding:"9px 13px",borderBottom:i<alumnos.length-1?`0.5px solid ${BORDER}`:"none"}}><span style={a.activo?s.badge("#EAF3DE","#3B6D11"):s.badge("#FCEBEB","#A32D2D")}>{a.activo?"Activo":"Suspendido"}</span></td>
              <td style={{padding:"9px 13px",borderBottom:i<alumnos.length-1?`0.5px solid ${BORDER}`:"none"}}><button style={{...s.btnSm,borderColor:a.activo?"#f09595":BORDER,color:a.activo?"#a32d2d":MUTED}} onClick={()=>toggleAcceso(a)}>{a.activo?"Revocar":"Reactivar"}</button></td>
            </tr>)}</tbody>
          </table>
        </div>}
      </div>}

      {/* PAGOS */}
      {tab==="pagos"&&<div>
        <div style={{fontSize:14,fontWeight:500,color:TEXT,marginBottom:16}}>Gestión de pagos</div>
        {loading?<Spin/>:<div style={{display:"flex",flexWrap:"wrap",gap:12,marginBottom:24}}>
          {alumnos.filter(a=>a.email!=="admin@saci.com").map(a=>{
            const pd=pagosMap[a.id]; const ms=movsMap[a.id]||[];
            const pend=ms.filter(m=>m.estado==="pendiente").reduce((s,m)=>s+m.monto,0);
            return <div key={a.id} style={{...s.card,padding:14,flex:"1 1 300px",cursor:"pointer",outline:selAlumno===a.id?`2px solid ${NAVY}`:"none"}} onClick={()=>setSelAlumno(selAlumno===a.id?null:a.id)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div><div style={{fontSize:13,fontWeight:500,color:TEXT}}>{a.nombre}</div><div style={{fontSize:11,color:MUTED}}>{a.email}</div></div>
                {pend>0?<span style={s.badge(RED_LIGHT,RED)}>Debe ${pend.toLocaleString()}</span>:ms.length>0?<span style={s.badge("#EAF3DE","#3B6D11")}>Al día</span>:null}
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}} onClick={e=>e.stopPropagation()}>
                <div style={{flex:"1 1 130px"}}><label style={s.label}>Plan</label>
                  <select style={{...s.input,fontSize:12}} value={pd?.plan||""} onChange={e=>upsertPago(a.id,"plan",e.target.value)}>
                    <option value="">Seleccionar...</option>
                    {Object.entries(PLANES).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div style={{flex:"1 1 130px"}}><label style={s.label}>Vencimiento</label>
                  <input style={{...s.input,fontSize:12}} type="date" value={pd?.vencimiento||""} onChange={e=>upsertPago(a.id,"vencimiento",e.target.value)}/>
                </div>
              </div>
              {selAlumno===a.id&&<div onClick={e=>e.stopPropagation()}>
                <div style={{fontSize:12,fontWeight:500,color:TEXT,marginBottom:8}}>Movimientos</div>
                {ms.map((m,i)=><div key={m.id} style={{display:"flex",gap:8,alignItems:"center",padding:"7px 0",borderBottom:i<ms.length-1?`0.5px solid ${BORDER}`:"none",fontSize:12}}>
                  <span style={{flex:1,color:TEXT}}>{m.descripcion}</span>
                  <span style={{color:MUTED}}>{m.fecha}</span>
                  <span style={{fontWeight:500,color:m.estado==="pagado"?"#3B6D11":RED}}>${m.monto.toLocaleString()}</span>
                  <span style={m.estado==="pagado"?s.badge("#EAF3DE","#3B6D11"):s.badge(RED_LIGHT,RED)}>{m.estado==="pagado"?"Pagado":"Pendiente"}</span>
                </div>)}
                <div style={{marginTop:12,display:"flex",flexWrap:"wrap",gap:8}}>
                  <input style={{...s.input,flex:"2 1 140px",fontSize:12}} placeholder="Descripción" value={nuevoPago.descripcion} onChange={e=>setNuevoPago(n=>({...n,descripcion:e.target.value}))}/>
                  <input style={{...s.input,flex:"1 1 80px",fontSize:12}} type="number" placeholder="Monto $" value={nuevoPago.monto} onChange={e=>setNuevoPago(n=>({...n,monto:e.target.value}))}/>
                  <input style={{...s.input,flex:"1 1 110px",fontSize:12}} type="date" value={nuevoPago.fecha} onChange={e=>setNuevoPago(n=>({...n,fecha:e.target.value}))}/>
                  <select style={{...s.input,flex:"1 1 100px",fontSize:12}} value={nuevoPago.estado} onChange={e=>setNuevoPago(n=>({...n,estado:e.target.value}))}>
                    <option value="pendiente">Pendiente</option><option value="pagado">Pagado</option>
                  </select>
                  <button style={s.btn(NAVY,"#fff",NAVY)} onClick={()=>agregarMovimiento(a.id)}>Agregar</button>
                </div>
              </div>}
            </div>;
          })}
        </div>}
        <div style={{fontSize:14,fontWeight:500,color:TEXT,marginBottom:12}}>Recordatorio de pago</div>
        <div style={{...s.card,padding:14}}>
          <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
            <div style={{flex:"1 1 160px"}}><label style={s.label}>Alumno</label>
              <select style={s.input} value={rec.alumno_id} onChange={e=>setRec(r=>({...r,alumno_id:e.target.value}))}>
                <option value="">Todos los alumnos</option>
                {alumnos.filter(a=>a.email!=="admin@saci.com").map(a=><option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
            </div>
            <div style={{flex:"1 1 140px"}}><label style={s.label}>Fecha</label><input style={s.input} type="date" value={rec.fecha} onChange={e=>setRec(r=>({...r,fecha:e.target.value}))}/></div>
            <div style={{flex:"2 1 200px"}}><label style={s.label}>Mensaje</label><input style={s.input} placeholder="Ej: Recordá abonar la 2ª cuota" value={rec.mensaje} onChange={e=>setRec(r=>({...r,mensaje:e.target.value}))}/></div>
            <div style={{display:"flex",alignItems:"flex-end"}}><button style={s.btn(RED_LIGHT,RED,"#D94F2B")} onClick={programarRec}>Programar</button></div>
          </div>
        </div>
      </div>}

      {/* VIDEOS ADMIN */}
      {tab==="videos_admin"&&<div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontSize:14,fontWeight:500,color:TEXT}}>Gestión de videos</div>
          <button style={s.btn(RED_LIGHT,RED,"#D94F2B")} onClick={()=>setShowUpload(showUpload?"":"new")}>+ Subir video</button>
        </div>
        {showUpload&&<div style={{...s.card,padding:16,marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:500,color:TEXT,marginBottom:12}}>Subir nuevo video</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:12}}>
            <div style={{flex:"2 1 180px"}}><label style={s.label}>Título</label><input style={s.input} placeholder="Ej: Clase 3 — Control interno" value={nuevoVideo.titulo} onChange={e=>setNuevoVideo(n=>({...n,titulo:e.target.value}))}/></div>
            <div style={{flex:"1 1 120px"}}><label style={s.label}>Semana</label>
              <select style={s.input} value={nuevoVideo.semana} onChange={e=>setNuevoVideo(n=>({...n,semana:e.target.value}))}>
                {SEMANAS.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{flex:"1 1 120px"}}><label style={s.label}>Tipo</label>
              <select style={s.input} value={nuevoVideo.tipo} onChange={e=>setNuevoVideo(n=>({...n,tipo:e.target.value}))}>
                <option value="clases">Clase en vivo</option>
                <option value="adicionales">Video adicional</option>
              </select>
            </div>
            <div style={{flex:"1 1 100px"}}><label style={s.label}>Duración</label><input style={s.input} placeholder="Ej: 1h 24min" value={nuevoVideo.duracion} onChange={e=>setNuevoVideo(n=>({...n,duracion:e.target.value}))}/></div>
          </div>
          <div style={{marginBottom:12}}>
            <label style={s.label}>Archivo de video</label>
            <input type="file" accept="video/*" style={{...s.input,padding:"6px"}} onChange={e=>setNuevoVideo(n=>({...n,file:e.target.files[0]}))}/>
          </div>
          {uploading&&<div style={{marginBottom:12}}>
            <div style={{fontSize:12,color:MUTED,marginBottom:6}}>Subiendo... {uploadProgress}%</div>
            <div style={{height:6,background:BORDER,borderRadius:3}}><div style={{height:6,background:NAVY,borderRadius:3,width:`${uploadProgress}%`,transition:"width 0.3s"}}/></div>
          </div>}
          <div style={{display:"flex",gap:8}}>
            <button style={{...s.btn(NAVY,"#fff",NAVY),opacity:uploading?0.6:1}} onClick={handleSubirVideo} disabled={uploading}>{uploading?"Subiendo...":"Subir a Bunny Stream"}</button>
            <button style={s.btnSm} onClick={()=>setShowUpload(null)}>Cancelar</button>
          </div>
        </div>}
        {adminVidLoading?<Spin/>:["clases","adicionales"].map(tipo=><div key={tipo} style={{marginBottom:20}}>
          <div style={{fontSize:13,fontWeight:500,color:TEXT,marginBottom:10}}>{tipo==="clases"?"Clases en vivo":"Videos adicionales"}</div>
          {SEMANAS.map(sem=>{
            const vids=(adminVideos[sem]||{})[tipo]||[];
            return <div key={sem} style={{marginBottom:10}}>
              <div style={s.semanaHdr}><span>{sem}</span><span style={{fontSize:11,color:MUTED}}>{vids.length} video{vids.length!==1?"s":""}</span></div>
              {vids.length===0?<div style={{fontSize:12,color:MUTED,paddingBottom:4}}>Sin videos cargados.</div>
              :vids.map(v=><div key={v.id} style={{...s.irow,marginBottom:5}}>
                <img src={`https://${BUNNY_CDN}/${v.bunny_video_id}/thumbnail.jpg`} alt="" style={{width:56,height:36,objectFit:"cover",borderRadius:4,background:NAVY_LIGHT,flexShrink:0}} onError={e=>e.target.style.display="none"}/>
                <div style={{flex:1}}><div style={{fontSize:13,color:TEXT,fontWeight:500}}>{v.titulo}</div><div style={{fontSize:11,color:MUTED}}>{v.semana} · {v.duracion||"sin duración"}</div></div>
                <button style={{...s.btnSm,borderColor:"#f09595",color:"#a32d2d"}} onClick={()=>eliminarVideo(v.id)}>Quitar</button>
              </div>)}
            </div>;
          })}
        </div>)}
      </div>}

      {/* MATERIALES */}
      {tab==="materiales"&&<div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontSize:14,fontWeight:500,color:TEXT}}>Gestión de materiales</div>
        </div>
        {loading?<Spin/>:materiales.map(u=><div key={u.id} style={{marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:7}}>
            <span style={{fontSize:13,fontWeight:500,color:TEXT}}>{u.unidad}</span>
            <div style={{display:"flex",gap:5}}>
              <button style={s.btn(NAVY_LIGHT,NAVY,NAVY)} onClick={()=>{ setNuevoItem({material_id:u.id,tipo:"pdf",nombre:"",sub:"",url:""}); setShowItem(u.id); }}>+ Recurso</button>
              <button style={{...s.btnSm,borderColor:"#f09595",color:"#a32d2d"}} onClick={()=>eliminarUnidad(u.id)}>Eliminar</button>
            </div>
          </div>
          {showItem===u.id&&<div style={{background:"#fff",border:`0.5px solid ${BORDER}`,borderRadius:8,padding:12,marginBottom:8,display:"flex",flexWrap:"wrap",gap:8}}>
            <select style={{...s.input,flex:"1 1 100px",fontSize:12}} value={nuevoItem.tipo} onChange={e=>setNuevoItem(n=>({...n,tipo:e.target.value}))}><option value="pdf">PDF</option><option value="form">Formulario</option></select>
            <input style={{...s.input,flex:"2 1 150px",fontSize:12}} placeholder="Nombre" value={nuevoItem.nombre} onChange={e=>setNuevoItem(n=>({...n,nombre:e.target.value}))}/>
            <input style={{...s.input,flex:"1 1 100px",fontSize:12}} placeholder="Descripción (ej: PDF · 24 págs)" value={nuevoItem.sub} onChange={e=>setNuevoItem(n=>({...n,sub:e.target.value}))}/>
            <input style={{...s.input,flex:"2 1 150px",fontSize:12}} placeholder="URL del archivo o formulario" value={nuevoItem.url} onChange={e=>setNuevoItem(n=>({...n,url:e.target.value}))}/>
            <button style={s.btn(NAVY,"#fff",NAVY)} onClick={agregarItem}>Guardar</button>
            <button style={s.btnSm} onClick={()=>setShowItem(null)}>Cancelar</button>
          </div>}
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {(u.material_items||[]).map(it=><div key={it.id} style={s.irow}>
              <div style={{width:28,height:28,borderRadius:6,background:it.tipo==="pdf"?RED_LIGHT:NAVY_LIGHT,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{it.tipo==="pdf"?<PdfIcon/>:<FormIcon/>}</div>
              <span style={{flex:1,fontSize:13,color:TEXT}}>{it.nombre}</span>
              <span style={{fontSize:11,color:MUTED}}>{it.sub}</span>
              <button style={{...s.btnSm,borderColor:"#f09595",color:"#a32d2d"}} onClick={()=>eliminarItem(it.id)}>Quitar</button>
            </div>)}
          </div>
        </div>)}
        <div style={{display:"flex",gap:8,marginTop:8}}>
          <input style={{...s.input}} placeholder="Nombre de la nueva unidad..." value={nuevaUnidad} onChange={e=>setNuevaUnidad(e.target.value)}/>
          <button style={s.btn(RED_LIGHT,RED,"#D94F2B")} onClick={crearUnidad}>+ Unidad</button>
        </div>
      </div>}

      {/* EVALUACIONES */}
      {tab==="evaluaciones"&&<div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontSize:14,fontWeight:500,color:TEXT}}>Evaluaciones</div>
          <button style={s.btn(RED_LIGHT,RED,"#D94F2B")} onClick={()=>setShowEval(!showEval)}>+ Nueva evaluación</button>
        </div>
        {showEval&&<div style={{background:"#fff",border:`0.5px solid ${BORDER}`,borderRadius:8,padding:14,marginBottom:14,display:"flex",flexWrap:"wrap",gap:10}}>
          {[["Título","titulo","text"],["Descripción","meta","text"],["Link Google Forms","link","url"]].map(([l,k,t])=><div key={k} style={{flex:"1 1 150px"}}><label style={s.label}>{l}</label><input style={s.input} type={t} value={nuevaEval[k]} onChange={e=>setNuevaEval(n=>({...n,[k]:e.target.value}))} placeholder={l}/></div>)}
          <div style={{flex:"1 1 120px"}}><label style={s.label}>Estado</label>
            <select style={s.input} value={nuevaEval.estado} onChange={e=>setNuevaEval(n=>({...n,estado:e.target.value}))}>
              <option value="no_disponible">No disponible</option><option value="disponible">Disponible</option>
            </select>
          </div>
          <div style={{display:"flex",alignItems:"flex-end",gap:8}}><button style={s.btn(NAVY,"#fff",NAVY)} onClick={crearEval}>Guardar</button><button style={s.btnSm} onClick={()=>setShowEval(false)}>Cancelar</button></div>
        </div>}
        {loading?<Spin/>:<div style={{display:"flex",flexDirection:"column",gap:6}}>
          {evals.map(ev=><div key={ev.id} style={s.irow}>
            <div style={{width:28,height:28,borderRadius:6,background:NAVY_LIGHT,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><FormIcon/></div>
            <div style={{flex:1}}><div style={{fontSize:13,color:TEXT,fontWeight:500}}>{ev.titulo}</div><div style={{fontSize:11,color:MUTED}}>{ev.link||"Sin link"}</div></div>
            <span style={ev.estado==="disponible"?s.badge(NAVY_LIGHT,NAVY):s.badge("#eee","#888")} onClick={()=>toggleEvalEstado(ev)} title="Clic para cambiar estado" style={{...ev.estado==="disponible"?s.badge(NAVY_LIGHT,NAVY):s.badge("#eee","#888"),cursor:"pointer"}}>{ev.estado==="disponible"?"Activa":"Inactiva"}</span>
            <button style={s.btnSm}>Editar</button>
            <button style={{...s.btnSm,borderColor:"#f09595",color:"#a32d2d"}} onClick={()=>eliminarEval(ev.id)}>Eliminar</button>
          </div>)}
        </div>}
      </div>}
    </div>
  </div>;
}

export default function App(){
  const [user,setUser]=useState(null);
  if(!user) return <Login onLogin={setUser}/>;
  if(user.rol==="admin") return <AdminApp user={user} onLogout={()=>setUser(null)}/>;
  return <AlumnoApp user={user} onLogout={()=>setUser(null)}/>;
}
