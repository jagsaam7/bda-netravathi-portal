"use client";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { BLOCKS, getFlats, BLOCK_COLORS } from "@/lib/flats";
import Image from "next/image";

// Build map: "A-001-owner", "A-001-tenant"
function toMap(rows) {
  const m = {};
  rows.forEach(r => { m[`${r.block}-${r.flat_no}-${r.role}`] = r; });
  return m;
}

// Get all members for a flat (owner + tenant)
function flatMembers(members, block, flatNo) {
  return {
    owner:  members[`${block}-${flatNo}-owner`]  || null,
    tenant: members[`${block}-${flatNo}-tenant`] || null,
  };
}

const ROLE_STYLES = {
  owner:  { label:"Owner",  icon:"🏠", color:"#7c3aed", light:"#f5f3ff", badge:"bg-violet-100 text-violet-700 border-violet-200" },
  tenant: { label:"Tenant", icon:"🪪", color:"#0891b2", light:"#ecfeff", badge:"bg-cyan-100 text-cyan-700 border-cyan-200"       },
};

function emptyForm() { return { name:"", mobile:"", dob:"", address:"", photoPreview:null, photoFile:null }; }

export default function PortalClient({ initialMembers, isAdmin }) {
  const [members, setMembers]       = useState(toMap(initialMembers));
  const [block, setBlock]           = useState("A");
  const [modal, setModal]           = useState(null);   // "form" | "view" | "flat"
  const [activeFlat, setActiveFlat] = useState(null);   // "A-001"
  const [activeRole, setActiveRole] = useState("owner");
  const [form, setForm]             = useState(emptyForm());
  const [saving, setSaving]         = useState(false);
  const [hoveredFlat, setHoveredFlat] = useState(null);
  const fileRef = useRef();
  const router  = useRouter();

  const flats = getFlats(block);
  const bc    = BLOCK_COLORS[block];
  const total = flats.length;
  const filled = flats.filter(f => {
    const { owner, tenant } = flatMembers(members, block, f);
    return owner || tenant;
  }).length;

  const refreshMembers = useCallback(async () => {
    const res  = await fetch("/api/members");
    const data = await res.json();
    setMembers(toMap(data));
  }, []);

  // Open the flat overview (shows owner + tenant cards)
  const openFlat = (flatNo) => {
    setActiveFlat(`${block}-${flatNo}`);
    setModal("flat");
  };

  // Open add/edit form for a specific role
  const openForm = (flatKey, role) => {
    const m = members[`${flatKey}-${role}`];
    setActiveFlat(flatKey);
    setActiveRole(role);
    setForm(m
      ? { name:m.name, mobile:m.mobile||"", dob:m.dob||"", address:m.address||"", photoPreview:m.photo_url||null, photoFile:null }
      : emptyForm()
    );
    setModal("form");
  };

  const openView = (flatKey, role) => {
    setActiveFlat(flatKey);
    setActiveRole(role);
    setModal("view");
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm(f => ({ ...f, photoFile: file, photoPreview: URL.createObjectURL(file) }));
  };

  const save = async () => {
    if (!form.name.trim()) return alert("Name is required");
    setSaving(true);
    const [blk, flat_no] = activeFlat.split("-");
    let photo_url = members[`${activeFlat}-${activeRole}`]?.photo_url || null;

    if (form.photoFile) {
      const fd = new FormData();
      fd.append("file", form.photoFile);
      const up = await fetch("/api/upload", { method:"POST", body:fd });
      photo_url = (await up.json()).url;
    }

    await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ block:blk, flat_no, role:activeRole, name:form.name, mobile:form.mobile, dob:form.dob, address:form.address, photo_url }),
    });

    await refreshMembers();
    setSaving(false);
    setModal("flat");
  };

  const deleteMember = async (flatKey, role) => {
    if (!confirm(`Remove ${ROLE_STYLES[role].label} from this flat?`)) return;
    const [blk, flat_no] = flatKey.split("-");
    await fetch("/api/members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ block:blk, flat_no, role }),
    });
    await refreshMembers();
    setModal("flat");
  };

  // Flat status label
  const getFlatStatus = (flatNo) => {
    const { owner, tenant } = flatMembers(members, block, flatNo);
    if (owner && tenant) return { label:"Owner + Tenant", color:"#7c3aed", dot:"bg-purple-400" };
    if (owner)           return { label:"Owner only",     color:"#7c3aed", dot:"bg-violet-400" };
    if (tenant)          return { label:"Tenant only",    color:"#0891b2", dot:"bg-cyan-400"   };
    return null;
  };

  const floors = [
    { label:"Ground Floor", flats: flats.filter(f=>parseInt(f)<100) },
    { label:"1st Floor",    flats: flats.filter(f=>parseInt(f)>=100&&parseInt(f)<200) },
    { label:"2nd Floor",    flats: flats.filter(f=>parseInt(f)>=200&&parseInt(f)<300) },
    { label:"3rd Floor",    flats: flats.filter(f=>parseInt(f)>=300) },
  ];

  const activeFlatNo  = activeFlat?.split("-")[1];
  const activeFlatOwner  = activeFlat ? members[`${activeFlat}-owner`]  : null;
  const activeFlatTenant = activeFlat ? members[`${activeFlat}-tenant`] : null;
  const activeMember = activeFlat && activeRole ? members[`${activeFlat}-${activeRole}`] : null;
  const rs = ROLE_STYLES[activeRole];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero Header ── */}
      <header className="relative overflow-hidden bg-hero-pattern pb-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"/>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"/>

        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="text-5xl animate-float">🏢</div>
              <div>
                <h1 className="text-white font-display font-bold text-xl sm:text-2xl md:text-3xl leading-tight">
                  BDA Netravathi Apartment
                </h1>
                <p className="text-gradient font-bold text-lg sm:text-xl mt-0.5">Flat Members Directory</p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-purple-300 text-xs">Blocks A – H</span>
                  <span className="text-purple-500 text-xs">·</span>
                  <span className="text-xs text-violet-300">🏠 {Object.values(members).filter(m=>m?.role==="owner").length} owners</span>
                  <span className="text-purple-500 text-xs">·</span>
                  <span className="text-xs text-cyan-300">🪪 {Object.values(members).filter(m=>m?.role==="tenant").length} tenants</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              {isAdmin
                ? <>
                    <span className="glass text-gold-400 text-xs font-bold px-3 py-1.5 rounded-full border border-gold-400/30">🔑 Admin</span>
                    <button onClick={() => signOut({ callbackUrl:"/login" })} className="glass text-white/70 text-xs px-3 py-1.5 rounded-full hover:text-white transition">Sign out</button>
                  </>
                : <button onClick={() => router.push("/login")} className="glass text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-white/20 transition">🔑 Admin login</button>
              }
            </div>
          </div>

          {/* Block tabs */}
          <div className="flex gap-2 mt-6 overflow-x-auto pb-1">
            {BLOCKS.map(b => {
              const bc2  = BLOCK_COLORS[b];
              const bFlats = getFlats(b);
              const owners  = bFlats.filter(f=>members[`${b}-${f}-owner`]).length;
              const tenants = bFlats.filter(f=>members[`${b}-${f}-tenant`]).length;
              const active  = b === block;
              return (
                <button key={b} onClick={()=>setBlock(b)}
                  className={`flex-shrink-0 relative px-4 py-2.5 rounded-2xl font-bold text-sm transition-all duration-200 ${active?"text-white shadow-lg scale-105":"glass text-white/70 hover:text-white"}`}
                  style={active?{background:`linear-gradient(135deg,${bc2.hex}cc,${bc2.hex})`,boxShadow:`0 8px 24px ${bc2.hex}60`}:{}}>
                  <div className="text-xs opacity-80">Block</div>
                  <div className="text-xl leading-none">{b}</div>
                  <div className="flex gap-1 mt-0.5 justify-center">
                    {owners>0  && <span className="text-[9px] bg-white/20 px-1 rounded">🏠{owners}</span>}
                    {tenants>0 && <span className="text-[9px] bg-white/20 px-1 rounded">🪪{tenants}</span>}
                  </div>
                  {active && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white"/>}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── Stats bar ── */}
      <div className="max-w-7xl mx-auto px-4 -mt-3 relative z-10">
        <div className="glass-white rounded-2xl p-4 flex items-center gap-6 shadow-lg flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${bc.bg} flex items-center justify-center text-white font-black text-xl shadow-md`}>{block}</div>
            <div>
              <div className="font-bold text-gray-900 text-lg">Block {block}</div>
              <div className="text-gray-500 text-xs">{total} flats total</div>
            </div>
          </div>
          <div className="h-10 w-px bg-gray-200 hidden sm:block"/>
          <div className="flex gap-5">
            <div><div className="text-2xl font-black text-gray-900">{filled}</div><div className="text-xs text-gray-500">Occupied</div></div>
            <div><div className="text-2xl font-black text-violet-600">{flats.filter(f=>members[`${block}-${f}-owner`]).length}</div><div className="text-xs text-gray-500">Owners</div></div>
            <div><div className="text-2xl font-black text-cyan-600">{flats.filter(f=>members[`${block}-${f}-tenant`]).length}</div><div className="text-xs text-gray-500">Tenants</div></div>
            <div><div className="text-2xl font-black text-gray-400">{total-filled}</div><div className="text-xs text-gray-500">Vacant</div></div>
          </div>
          <div className="flex-1 hidden sm:block">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full bg-gradient-to-r ${bc.bg} transition-all duration-700`} style={{width:`${filled/total*100}%`}}/>
            </div>
          </div>
        </div>
      </div>

      {/* ── Flat grid ── */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {floors.map(({ label, flats: fFlats }) => !fFlats.length ? null : (
          <div key={label} className="mb-8 fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-gray-200"/>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest px-3 py-1 rounded-full bg-gray-100">{label}</span>
              <div className="h-px flex-1 bg-gray-200"/>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {fFlats.map(flatNo => {
                const key = `${block}-${flatNo}`;
                const { owner, tenant } = flatMembers(members, block, flatNo);
                const status = getFlatStatus(flatNo);
                const isHov  = hoveredFlat === key;
                const hasBoth = owner && tenant;

                return (
                  <div key={key}
                    className={`relative rounded-2xl p-3 cursor-pointer card-hover border ${status ? "bg-white shadow-sm border-gray-100" : "bg-white border-dashed border-gray-200 hover:border-gray-300"}`}
                    style={isHov && status ? { boxShadow:`0 12px 32px ${bc.hex}25` } : {}}
                    onMouseEnter={()=>setHoveredFlat(key)} onMouseLeave={()=>setHoveredFlat(null)}
                    onClick={() => (status || isAdmin) ? openFlat(flatNo) : null}>

                    {/* Flat number badge */}
                    <div className="absolute top-2 right-2 text-[10px] font-mono text-gray-300 font-bold">{flatNo}</div>

                    {/* Status chip */}
                    {status && (
                      <div className="flex items-center gap-1 mb-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`}/>
                        <span className="text-[10px] text-gray-400 font-semibold">{status.label}</span>
                      </div>
                    )}

                    {/* Photos — stacked or solo */}
                    {hasBoth ? (
                      <div className="relative h-16 mb-2">
                        {/* Owner photo (back) */}
                        <div className="absolute left-0 top-0 w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm"
                          style={{borderColor:"#7c3aed22"}}>
                          <ProfileCircle member={owner} color="#7c3aed" size={48}/>
                        </div>
                        {/* Tenant photo (front) */}
                        <div className="absolute left-7 top-0 w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md"
                          style={{borderColor:"#0891b222"}}>
                          <ProfileCircle member={tenant} color="#0891b2" size={48}/>
                        </div>
                        {/* Role badges */}
                        <div className="absolute bottom-0 left-0 flex gap-1">
                          <span className="text-[9px] bg-violet-100 text-violet-600 px-1 rounded font-bold">🏠</span>
                          <span className="text-[9px] bg-cyan-100 text-cyan-600 px-1 rounded font-bold">🪪</span>
                        </div>
                      </div>
                    ) : owner || tenant ? (
                      <div className="flex flex-col items-center mb-1">
                        <div className="relative">
                          <div className="w-14 h-14 rounded-full overflow-hidden border-2"
                            style={{borderColor: owner?"#7c3aed":"#0891b2", boxShadow:isHov?`0 0 0 3px ${owner?"#7c3aed":"#0891b2"}30`:""}}>
                            <ProfileCircle member={owner||tenant} color={owner?"#7c3aed":"#0891b2"} size={56}/>
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 text-[11px] bg-white rounded-full shadow-sm border border-gray-100 w-5 h-5 flex items-center justify-center">
                            {owner?"🏠":"🪪"}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center mb-2">
                        <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 text-xl bg-gray-50">
                          {isAdmin ? "+" : "—"}
                        </div>
                      </div>
                    )}

                    <div className="text-center">
                      <div className="text-xs font-bold text-gray-700 truncate leading-tight">
                        {owner ? owner.name : tenant ? tenant.name : `Flat ${flatNo}`}
                      </div>
                      {hasBoth && <div className="text-[10px] text-gray-400 truncate">{tenant.name}</div>}
                      {!owner && !tenant && (
                        <div className="text-[10px] text-gray-400">{isAdmin?"Tap to add":"Vacant"}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </main>

      {/* ══════════════════════════════════════════════════
          MODAL: Flat overview (owner + tenant side by side)
      ══════════════════════════════════════════════════ */}
      {modal==="flat" && activeFlat && (
        <Overlay onClose={()=>setModal(null)}>
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            {/* Header */}
            <div className={`bg-gradient-to-r ${bc.bg} px-6 pt-6 pb-8`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white/70 text-xs font-semibold uppercase tracking-widest">Block {activeFlat.split("-")[0]}</div>
                  <h2 className="text-white font-bold text-2xl">Flat {activeFlatNo}</h2>
                </div>
                <button onClick={()=>setModal(null)} className="text-white/60 hover:text-white text-2xl leading-none">×</button>
              </div>
            </div>

            {/* Owner + Tenant cards */}
            <div className="-mt-5 px-5 pb-6 space-y-3">
              {(["owner","tenant"]).map(role => {
                const m   = role==="owner" ? activeFlatOwner : activeFlatTenant;
                const rs2 = ROLE_STYLES[role];
                return (
                  <div key={role} className={`rounded-2xl border p-4 transition-all ${m?"bg-white shadow-sm border-gray-100":"bg-gray-50 border-dashed border-gray-200"}`}>
                    <div className="flex items-center gap-3">
                      {/* Role badge */}
                      <div className="flex flex-col items-center gap-1 min-w-[48px]">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 flex-shrink-0" style={{borderColor:rs2.color}}>
                          {m
                            ? <ProfileCircle member={m} color={rs2.color} size={48}/>
                            : <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-100 text-lg">{isAdmin?"➕":"—"}</div>
                          }
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${rs2.badge}`}>{rs2.icon} {rs2.label}</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        {m ? <>
                          <div className="font-bold text-gray-900 text-sm truncate">{m.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{m.mobile||"No number"}</div>
                        </> : (
                          <div className="text-sm text-gray-400 italic">{role==="owner"?"No owner registered yet":"No tenant — owner occupied"}</div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 flex-shrink-0">
                        {m && (
                          <button onClick={()=>openView(activeFlat, role)}
                            className="text-xs px-3 py-1.5 rounded-xl border font-semibold transition hover:bg-gray-50"
                            style={{borderColor:rs2.color+"60",color:rs2.color}}>View</button>
                        )}
                        {isAdmin && (
                          <button onClick={()=>openForm(activeFlat, role)}
                            className="text-xs px-3 py-1.5 rounded-xl text-white font-semibold transition"
                            style={{background:rs2.color}}>
                            {m?"Edit":"Add"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Overlay>
      )}

      {/* ══════════════════════════════════════════════════
          MODAL: Add / Edit form
      ══════════════════════════════════════════════════ */}
      {modal==="form" && (
        <Overlay onClose={()=>setModal("flat")}>
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 rounded-t-3xl" style={{background:`linear-gradient(135deg,${rs.color}cc,${rs.color})`}}>
              <button onClick={()=>setModal("flat")} className="text-white/60 hover:text-white text-sm mb-2">← Back to flat</button>
              <h2 className="text-white font-bold text-xl">{activeMember?"Edit":"Add"} {rs.icon} {rs.label}</h2>
              <p className="text-white/70 text-sm mt-0.5">Block {activeFlat?.split("-")[0]} · Flat {activeFlatNo}</p>
            </div>

            <div className="p-6 space-y-4">
              {/* Photo */}
              <div className="flex justify-center">
                <div onClick={()=>fileRef.current.click()}
                  className="relative w-24 h-24 rounded-full overflow-hidden cursor-pointer border-4 border-dashed hover:border-solid transition-all group"
                  style={{borderColor:rs.color}}>
                  {form.photoPreview
                    ? <Image src={form.photoPreview} alt="preview" width={96} height={96} className="w-full h-full object-cover" unoptimized={form.photoPreview?.startsWith("blob:")}/>
                    : <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 gap-1">
                        <span className="text-2xl">📷</span>
                        <span className="text-xs text-gray-400">Photo</span>
                      </div>
                  }
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-bold">Change</span>
                  </div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile}/>
              </div>

              {/* Role indicator */}
              <div className="flex justify-center">
                <span className={`text-sm font-bold px-4 py-1.5 rounded-full border ${rs.badge}`}>{rs.icon} Adding as {rs.label}</span>
              </div>

              {[
                {label:"Full Name *",    key:"name",    type:"text", ph:"e.g. Suresh Kumar"},
                {label:"Mobile Number", key:"mobile",  type:"tel",  ph:"+91 98765 43210"},
                {label:"Date of Birth", key:"dob",     type:"date", ph:""},
              ].map(({label,key,type,ph})=>(
                <div key={key}>
                  <label className="text-sm font-semibold text-gray-600 block mb-1">{label}</label>
                  <input type={type} value={form[key]} placeholder={ph}
                    onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none text-sm transition"
                    onFocus={e=>e.target.style.borderColor=rs.color}
                    onBlur={e=>e.target.style.borderColor=""}/>
                </div>
              ))}

              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-1">Permanent Address</label>
                <textarea value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} rows={3}
                  placeholder="Enter full permanent address…"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none text-sm resize-none transition"
                  onFocus={e=>e.target.style.borderColor=rs.color} onBlur={e=>e.target.style.borderColor=""}/>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={save} disabled={saving}
                  className="flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-60 transition"
                  style={{background:`linear-gradient(135deg,${rs.color}cc,${rs.color})`}}>
                  {saving?"Saving…":"Save"}
                </button>
                {activeMember && (
                  <button onClick={()=>deleteMember(activeFlat,activeRole)}
                    className="px-4 py-3 rounded-xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition">
                    Remove
                  </button>
                )}
                <button onClick={()=>setModal("flat")} className="px-4 py-3 rounded-xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition">Cancel</button>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {/* ══════════════════════════════════════════════════
          MODAL: View member detail
      ══════════════════════════════════════════════════ */}
      {modal==="view" && activeMember && (
        <Overlay onClose={()=>setModal("flat")}>
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
            {/* Hero */}
            <div className="pt-8 pb-12 flex flex-col items-center relative" style={{background:`linear-gradient(135deg,${rs.color}cc,${rs.color})`}}>
              <div className="absolute inset-0 opacity-10 shimmer-bg"/>
              <div className="w-28 h-28 rounded-full border-4 border-white/60 overflow-hidden shadow-2xl mb-3">
                <ProfileCircle member={activeMember} color={rs.color} size={112}/>
              </div>
              <h3 className="text-white font-bold text-xl font-display">{activeMember.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">{rs.icon} {rs.label}</span>
                <span className="text-white/60 text-xs">Block {activeFlat?.split("-")[0]} · Flat {activeFlatNo}</span>
              </div>
            </div>

            <div className="-mt-6 mx-4 rounded-2xl bg-white shadow-lg p-4 space-y-3 mb-4">
              <InfoRow icon="📱" label="Mobile" value={activeMember.mobile||"—"} highlight/>
              {isAdmin && <>
                <div className="h-px bg-gray-100"/>
                <InfoRow icon="🎂" label="Date of Birth" value={activeMember.dob ? new Date(activeMember.dob).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"}) : "—"}/>
                <div className="h-px bg-gray-100"/>
                <InfoRow icon="🏠" label="Permanent Address" value={activeMember.address||"—"} multiline/>
              </>}
            </div>

            <div className="px-4 pb-4 flex gap-3">
              {isAdmin && (
                <button onClick={()=>openForm(activeFlat,activeRole)}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold"
                  style={{background:`linear-gradient(135deg,${rs.color}cc,${rs.color})`}}>Edit</button>
              )}
              <button onClick={()=>setModal("flat")} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition">Back</button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}

/* ── Reusable sub-components ── */

function ProfileCircle({ member, color, size }) {
  if (!member) return null;
  if (member.photo_url) {
    return <Image src={member.photo_url} alt={member.name} width={size} height={size} className="w-full h-full object-cover"/>;
  }
  return (
    <div className="w-full h-full flex items-center justify-center text-white font-black"
      style={{background:`linear-gradient(135deg,${color}cc,${color})`,fontSize:size*0.35}}>
      {member.name[0].toUpperCase()}
    </div>
  );
}

function InfoRow({ icon, label, value, highlight, multiline }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-xl mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</div>
        <div className={`text-sm mt-0.5 ${highlight?"font-bold text-gray-900":"text-gray-700"} ${multiline?"":"truncate"}`}>{value}</div>
      </div>
    </div>
  );
}

function Overlay({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      {children}
    </div>
  );
}
