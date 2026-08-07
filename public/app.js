const cfg = window.NVT_CONFIG || {};
const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const demoContent = [
  {id:"demo-1",title:"Neon Lifestyle Preview",category:"Lifestyle",description:"একটি legal demo preview content.",preview_url:"https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80"},
  {id:"demo-2",title:"Fashion Night",category:"Fashion",description:"Fashion-themed demo content.",preview_url:"https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80"},
  {id:"demo-3",title:"Studio Portrait",category:"Portrait",description:"Non-explicit portrait demo.",preview_url:"https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"},
  {id:"demo-4",title:"City Creator",category:"Lifestyle",description:"Creative lifestyle demo.",preview_url:"https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80"}
];

let selected = null;
let allContent = demoContent;
const grid = document.getElementById("contentGrid");
const modal = document.getElementById("modal");

function render(items){
allContent = items;
  grid.innerHTML = items.map(x => `
    <article class="card" data-id="${x.id}">
      <div class="thumb">
        <img src="${escapeHtml(x.preview_url)}" alt="">
        <span class="lock">🔒 Locked</span>
      </div>
      <div class="card-body">
        <div class="card-title">${escapeHtml(x.title)}</div>
        <div class="card-meta">${escapeHtml(x.category)} · Preview</div>
      </div>
    </article>`).join("");
  grid.querySelectorAll(".card").forEach(c => c.addEventListener("click",()=>openContent(items.find(x=>x.id===c.dataset.id))));
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

async function loadContent(){
  try{
    const r = await fetch((cfg.API_BASE||"")+"/api/content");
    if(r.ok){ const data=await r.json(); if(Array.isArray(data)&&data.length){render(data);return;} }
  }catch(e){}
  render(demoContent);
}
function openContent(item){
  selected=item;
  document.getElementById("modalImg").src=item.preview_url;
  document.getElementById("modalTitle").textContent=item.title;
  document.getElementById("modalCat").textContent=item.category;
  document.getElementById("modalDesc").textContent=item.description||"";
  document.getElementById("unlockBtn").disabled=false;
  document.getElementById("unlockBtn").textContent="🔓 Unlock with Rewarded Ad";
  modal.classList.remove("hidden");
}
document.getElementById("closeModal").onclick=()=>modal.classList.add("hidden");
document.getElementById("startBtn").onclick=()=>window.scrollTo({top:360,behavior:"smooth"});

async function getUserId(){
  return tg?.initDataUnsafe?.user?.id ? String(tg.initDataUnsafe.user.id) : "web-demo";
}
async function unlock(){
  if(!selected)return;
  const btn=document.getElementById("unlockBtn");
  btn.disabled=true; btn.textContent="Ad loading…";

  const userId=await getUserId();
  const ymid=`${userId}-${selected.id}-${crypto.randomUUID()}`;

  // Demo mode lets you test the UX without an ad account.
  if(cfg.DEMO_MODE){
    setTimeout(()=>completeUnlock(),900);
    return;
  }

  if(!cfg.SDK_URL || !cfg.SDK_FUNCTION){
    alert("Monetag SDK is not configured yet. Add the SDK URL and function name in public/config.js.");
    btn.disabled=false; btn.textContent="🔓 Unlock with Rewarded Ad";
    return;
  }

  try{
    await loadMonetagSdk();
    const showAd=window[cfg.SDK_FUNCTION];
    if(typeof showAd!=="function") throw new Error("Monetag SDK function not found");
    const result=await showAd({ymid,requestVar:"content_unlock"});
    // UI confirmation only. For production, backend verification should be based on Monetag postback.
    await fetch((cfg.API_BASE||"")+"/api/ad-session",{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({ymid,telegram_id:userId,content_id:selected.id})
    }).catch(()=>{});
    if(result && result.reward_event_type==="non_valued"){
      throw new Error("Unpaid event");
    }
    completeUnlock();
  }catch(err){
    console.error(err);
    alert("Ad complete/confirm করা যায়নি। আবার চেষ্টা করুন।");
    btn.disabled=false; btn.textContent="🔓 Unlock with Rewarded Ad";
  }
}
function loadMonetagSdk(){
  return new Promise((resolve,reject)=>{
    if(window[cfg.SDK_FUNCTION]) return resolve();
    const s=document.createElement("script");
    s.src=cfg.SDK_URL;
    s.dataset.zone=cfg.SDK_FUNCTION.replace("show_","");
    s.dataset.sdk=cfg.SDK_FUNCTION;
    s.onload=()=>resolve();s.onerror=reject;document.head.appendChild(s);
  });
}
function completeUnlock(){
  const btn=document.getElementById("unlockBtn");
  btn.textContent="✅ Unlocked";
  btn.disabled=true;
  const img=document.getElementById("modalImg");
  img.style.filter="none";
  setTimeout(()=>alert("Content unlocked. Production version-এ এখানে full content URL দেখানো হবে."),200);
}
document.getElementById("unlockBtn").onclick=unlock;
loadContent();

document.querySelectorAll(".chip").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const text=btn.textContent.trim();

    if(text.includes("Trending")){
      render(allContent);
    }else if(text.includes("Fashion")){
      render(allContent.filter(x=>x.category==="Fashion"));
    }else if(text.includes("Lifestyle")){
      render(allContent.filter(x=>x.category==="Lifestyle"));
    }else if(text.includes("Music")){
      render(allContent.filter(x=>x.category==="Music"));
    }else{
      render(allContent);
    }
  });
});

document.querySelector(".link-btn").addEventListener("click",()=>{
  render(allContent);
});
