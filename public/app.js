const cfg = window.NVT_CONFIG || {};
const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
}

const demoContent = [
  {
    id:"demo-1",
    title:"Neon Lifestyle Preview",
    category:"Lifestyle",
    description:"একটি legal demo preview content.",
    preview_url:"https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80"
  },
  {
    id:"demo-2",
    title:"Fashion Night",
    category:"Fashion",
    description:"Fashion-themed demo content.",
    preview_url:"https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80"
  },
  {
    id:"demo-3",
    title:"Studio Portrait",
    category:"Portrait",
    description:"Non-explicit portrait demo.",
    preview_url:"https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"
  },
  {
    id:"demo-4",
    title:"City Creator",
    category:"Lifestyle",
    description:"Creative lifestyle demo.",
    preview_url:"https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80"
  },
  {
    id:"demo-5",
    title:"Music Studio",
    category:"Music",
    description:"Music-themed demo content.",
    preview_url:"https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=80"
  }
];

let selected = null;
let masterContent = [...demoContent];
let history = JSON.parse(localStorage.getItem("nvt_history") || "[]");

const grid = document.getElementById("contentGrid");
const modal = document.getElementById("modal");

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#039;"
  }[m]));
}

function render(items) {
  if (!items.length) {
    grid.innerHTML = `
      <div class="card">
        <div class="card-body">
          <div class="card-title">কোনো content পাওয়া যায়নি</div>
          <div class="card-meta">অন্য category চেষ্টা করুন</div>
        </div>
      </div>`;
    return;
  }

  grid.innerHTML = items.map(x => `
    <article class="card" data-id="${escapeHtml(x.id)}">
      <div class="thumb">
        <img src="${escapeHtml(x.preview_url)}" alt="">
        <span class="lock">🔒 Locked</span>
        <button class="favorite-btn" type="button"
          aria-label="Favorite"
          style="position:absolute;right:10px;top:10px;border:0;border-radius:50%;padding:9px;background:rgba(0,0,0,.65);color:#fff;font-size:20px;z-index:2;"
        >♡</button>
      </div>
      <div class="card-body">
        <div class="card-title">${escapeHtml(x.title)}</div>
        <div class="card-meta">${escapeHtml(x.category)} · Preview</div>
      </div>
    </article>
  `).join("");

  grid.querySelectorAll(".card[data-id]").forEach(card => {
    card.addEventListener("click", () => {
      const item = masterContent.find(x => x.id === card.dataset.id);
      if (item) openContent(item);
    });
  });
}

async function loadContent() {
  try {
    const r = await fetch((cfg.API_BASE || "") + "/api/content", {
      cache: "no-store"
    });

    if (r.ok) {
      const data = await r.json();

      if (Array.isArray(data) && data.length) {
        masterContent = data;
        render(masterContent);
        return;
      }
    }
  } catch (e) {
    console.log("API unavailable, using demo content");
  }

  masterContent = [...demoContent];
  render(masterContent);
}

function openContent(item) {
  selected = item;

  document.getElementById("modalImg").src = item.preview_url;
  document.getElementById("modalTitle").textContent = item.title;
  document.getElementById("modalCat").textContent = item.category;
  document.getElementById("modalDesc").textContent = item.description || "";

  const btn = document.getElementById("unlockBtn");
  btn.disabled = false;
  btn.textContent = "🔓 Unlock with Rewarded Ad";

  modal.classList.remove("hidden");
}

document.getElementById("closeModal").onclick = () => {
  modal.classList.add("hidden");
};

document.getElementById("startBtn").onclick = () => {
  document.querySelector(".grid")?.scrollIntoView({
    behavior:"smooth",
    block:"start"
  });
};

async function getUserId() {
  return tg?.initDataUnsafe?.user?.id
    ? String(tg.initDataUnsafe.user.id)
    : "web-demo";
}

async function unlock() {
  if (!selected) return;

  const btn = document.getElementById("unlockBtn");

  btn.disabled = true;
  btn.textContent = "Ad loading…";

  const userId = await getUserId();
  const ymid = `${userId}-${selected.id}-${crypto.randomUUID()}`;

  if (cfg.DEMO_MODE) {
    setTimeout(() => completeUnlock(), 900);
    return;
  }

  if (!cfg.SDK_URL || !cfg.SDK_FUNCTION) {
    alert("Monetag SDK is not configured yet.");
    btn.disabled = false;
    btn.textContent = "🔓 Unlock with Rewarded Ad";
    return;
  }

  try {
    await loadMonetagSdk();

    const showAd = window[cfg.SDK_FUNCTION];

    if (typeof showAd !== "function") {
      throw new Error("Monetag SDK function not found");
    }

    const result = await showAd({
      ymid,
      requestVar:"content_unlock"
    });

    await fetch((cfg.API_BASE || "") + "/api/ad-session", {
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify({
        ymid,
        telegram_id:userId,
        content_id:selected.id
      })
    }).catch(() => {});

    if (result && result.reward_event_type === "non_valued") {
      throw new Error("Unpaid event");
    }

    completeUnlock();

  } catch (err) {
    console.error(err);
    alert("Ad complete/confirm করা যায়নি। আবার চেষ্টা করুন।");
    btn.disabled = false;
    btn.textContent = "🔓 Unlock with Rewarded Ad";
  }
}

function loadMonetagSdk() {
  return new Promise((resolve, reject) => {
    if (window[cfg.SDK_FUNCTION]) {
      resolve();
      return;
    }

    const s = document.createElement("script");

    s.src = cfg.SDK_URL;
    s.dataset.zone = cfg.SDK_FUNCTION.replace("show_", "");
    s.dataset.sdk = cfg.SDK_FUNCTION;

    s.onload = resolve;
    s.onerror = reject;

    document.head.appendChild(s);
  });
}

function completeUnlock() {
  const btn = document.getElementById("unlockBtn");

  btn.textContent = "✅ Unlocked";
  btn.disabled = true;

  const img = document.getElementById("modalImg");
  img.style.filter = "none";

  if (selected) {
    history = [
      selected,
      ...history.filter(x => x.id !== selected.id)
    ].slice(0, 20);

    localStorage.setItem("nvt_history", JSON.stringify(history));
  }

  setTimeout(() => {
    alert("Content unlocked successfully!");
  }, 200);
}

document.getElementById("unlockBtn").onclick = unlock;


/* =========================
   CATEGORY BUTTONS
========================= */

document.querySelectorAll(".chip").forEach(btn => {
  btn.addEventListener("click", () => {
    const text = btn.textContent.trim();

    if (text.includes("Trending")) {
      render(masterContent);

    } else if (text.includes("Fashion")) {
      render(masterContent.filter(x =>
        String(x.category).toLowerCase() === "fashion"
      ));

    } else if (text.includes("Music")) {
      render(masterContent.filter(x =>
        String(x.category).toLowerCase() === "music"
      ));

    } else if (text.includes("Lifestyle")) {
      render(masterContent.filter(x =>
        String(x.category).toLowerCase() === "lifestyle"
      ));

    } else {
      render(masterContent);
    }

    document.getElementById("contentGrid")?.scrollIntoView({
      behavior:"smooth",
      block:"start"
    });
  });
});


/* =========================
   VIEW ALL + REFRESH
========================= */

const linkButtons = document.querySelectorAll(".link-btn");

if (linkButtons[0]) {
  linkButtons[0].addEventListener("click", () => {
    render(masterContent);

    document.getElementById("contentGrid")?.scrollIntoView({
      behavior:"smooth",
      block:"start"
    });
  });
}

if (linkButtons[1]) {
  linkButtons[1].addEventListener("click", async () => {
    await loadContent();
  });
}


/* =========================
   BOTTOM NAVIGATION
========================= */

const bottomButtons = document.querySelectorAll(".bottom-nav button");

if (bottomButtons[0]) {
  bottomButtons[0].addEventListener("click", () => {
    window.scrollTo({
      top:0,
      behavior:"smooth"
    });
  });
}

if (bottomButtons[1]) {
  bottomButtons[1].addEventListener("click", () => {
    document.querySelector(".chips")?.scrollIntoView({
      behavior:"smooth",
      block:"center"
    });
  });
}

if (bottomButtons[2]) {
  bottomButtons[2].addEventListener("click", () => {
    if (selected) {
      openContent(selected);
    } else if (masterContent.length) {
      openContent(masterContent[0]);
    }
  });
}

if (bottomButtons[3]) {
  bottomButtons[3].addEventListener("click", () => {
    if (history.length) {
      render(history);

      document.getElementById("contentGrid")?.scrollIntoView({
        behavior:"smooth",
        block:"start"
      });
    } else {
      alert("History এখনো খালি।");
    }
  });
}


/* =========================
   LOAD
========================= */

loadContent();

/* Mobile menu */
(() => {
  const menuBtn = document.getElementById("profileBtn");
  if (!menuBtn) return;

  const menu = document.createElement("div");
  menu.id = "mobileMenu";
  menu.innerHTML = `
    <button data-target="home">🏠 Home</button>
    <button data-target="categories">◈ Categories</button>
    <button data-target="unlock">🔓 Unlock</button>
    <button data-target="history">◷ History</button>
  `;

  Object.assign(menu.style, {
    position: "fixed",
    top: "76px",
    right: "18px",
    zIndex: "9999",
    display: "none",
    padding: "10px",
    borderRadius: "16px",
    background: "rgba(18,16,35,.97)",
    border: "1px solid rgba(180,100,255,.35)",
    boxShadow: "0 12px 35px rgba(0,0,0,.45)"
  });

  menu.querySelectorAll("button").forEach(btn => {
    Object.assign(btn.style, {
      display: "block",
      width: "150px",
      padding: "12px 14px",
      margin: "3px 0",
      border: "0",
      borderRadius: "10px",
      background: "transparent",
      color: "#fff",
      textAlign: "left",
      fontSize: "15px"
    });

    btn.onclick = () => {
      const target = btn.dataset.target;
      menu.style.display = "none";

      if (target === "home") {
        window.scrollTo({top: 0, behavior: "smooth"});
      } else if (target === "categories") {
        document.querySelector(".section-head")?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      } else if (target === "unlock") {
        document.querySelector(".bottom-nav button:nth-child(3)")?.click();
        window.scrollTo({top: document.body.scrollHeight, behavior: "smooth"});
      } else if (target === "history") {
        document.querySelector(".bottom-nav button:nth-child(4)")?.click();
      }
    };
  });

  document.body.appendChild(menu);

  menuBtn.onclick = (e) => {
    e.stopPropagation();
    menu.style.display = menu.style.display === "none" ? "block" : "none";
  };

  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && e.target !== menuBtn) {
      menu.style.display = "none";
    }
  });
})();

/* Search */
(() => {
  const input = document.getElementById("searchInput");
  if (!input) return;

  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();

    if (!q) {
      render(masterContent);
      return;
    }

    const results = masterContent.filter(item =>
      String(item.title || "").toLowerCase().includes(q) ||
      String(item.description || "").toLowerCase().includes(q) ||
      String(item.category || "").toLowerCase().includes(q)
    );

    render(results);
  });
})();

/* Favorites */
(() => {
  const favKey = "nvt_favorites";
  let favorites = JSON.parse(localStorage.getItem(favKey) || "[]");

  function isFavorite(id) {
    return favorites.some(x => x.id === id);
  }

  function saveFavorites() {
    localStorage.setItem(favKey, JSON.stringify(favorites));
  }

  function toggleFavorite(item) {
    if (isFavorite(item.id)) {
      favorites = favorites.filter(x => x.id !== item.id);
    } else {
      favorites.push(item);
    }
    saveFavorites();
    render(masterContent);
  }

  const oldOpenContent = window.openContent;

  document.addEventListener("click", e => {
    const card = e.target.closest(".card[data-id]");
    if (!card) return;

    const item = masterContent.find(x => x.id === card.dataset.id);
    if (!item) return;

    if (e.target.closest(".favorite-btn")) {
      e.stopPropagation();
      toggleFavorite(item);
    }
  });

  const favBtn = document.getElementById("favoritesBtn");

  if (favBtn) {
    favBtn.addEventListener("click", () => {
      const items = favorites.filter(f =>
        masterContent.some(x => x.id === f.id)
      );

      render(items);

      document.getElementById("contentGrid")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  }
})();
