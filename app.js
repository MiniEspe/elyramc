// ElyraMC — the download site's motion: tabs, reveals, the sky, the video showcase and the live
// mock-ups of the in-game menu and HUD.
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ── Tabs: Features and Download, by the URL's hash ───────────────────────────
  const views = { features: $("#view-features"), download: $("#view-download") };
  const tabLinks = $$(".tabs a");
  const pill = $(".tab-pill");

  function movePill() {
    const on = tabLinks.find(a => a.classList.contains("on"));
    if (!on) return;
    pill.style.width = on.offsetWidth + "px";
    pill.style.transform = `translateX(${on.offsetLeft - 4}px)`;
  }

  function show(tab, anchor) {
    if (!views[tab]) tab = "features";
    for (const [name, el] of Object.entries(views)) {
      el.hidden = name !== tab;
      if (name === tab) { el.style.animation = "none"; void el.offsetWidth; el.style.animation = ""; }
    }
    tabLinks.forEach(a => a.classList.toggle("on", a.dataset.tab === tab));
    movePill();
    observeReveals();
    if (anchor) requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth" }));
    else window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  function route() {
    const hash = location.hash.replace("#", "");
    if (hash === "download") return show("download");
    if (!hash || hash === "features") return show("features");
    // An anchor inside the Features view (#showcase, #faq, …).
    if (views.features.querySelector("#" + CSS.escape(hash))) return show("features", hash);
    show("features");
  }

  document.addEventListener("click", e => {
    const a = e.target.closest("a[href^='#']");
    if (!a) return;
    const target = a.getAttribute("href").slice(1);
    e.preventDefault();
    if (location.hash !== "#" + target) history.pushState(null, "", "#" + target);
    route();
  });
  addEventListener("popstate", route);
  addEventListener("resize", movePill);

  // ── Nav glass thickens once the page scrolls ─────────────────────────────────
  const nav = $("#nav");
  addEventListener("scroll", () => nav.classList.toggle("scrolled", scrollY > 20), { passive: true });

  // ── Scroll reveals ───────────────────────────────────────────────────────────
  const revealer = new IntersectionObserver(entries => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      const el = en.target;
      // Siblings arriving together come in one after another.
      const i = $$(".reveal:not(.in)", el.parentElement).indexOf(el);
      el.style.transitionDelay = Math.max(0, i) * 70 + "ms";
      el.classList.add("in");
      revealer.unobserve(el);
      if (el.querySelector("[data-count]") || el.matches(".stat")) countUp(el);
    }
  }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });

  function observeReveals() {
    $$(".reveal:not(.in)").forEach(el => { if (!el.closest("[hidden]")) revealer.observe(el); });
  }

  function countUp(el) {
    const b = el.querySelector("[data-count]");
    if (!b || b.dataset.done) return;
    b.dataset.done = 1;
    const to = +b.dataset.count, start = performance.now(), dur = 1200;
    const tick = now => {
      const t = Math.min(1, (now - start) / dur), k = 1 - Math.pow(1 - t, 3);
      b.textContent = Math.round(to * k);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // ── The sky: motes rising and twinkling ──────────────────────────────────────
  const sky = $("#sky"), ctx = sky.getContext("2d");
  let motes = [], W = 0, H = 0, dpr = 1;
  function sizeSky() {
    dpr = Math.min(2, devicePixelRatio || 1);
    W = sky.width = innerWidth * dpr;
    H = sky.height = innerHeight * dpr;
    const n = Math.round(Math.min(140, innerWidth * innerHeight / 11000));
    motes = Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: (Math.random() < .85 ? 1 : 1.8) * dpr, v: (6 + Math.random() * 18) * dpr,
      tw: .8 + Math.random() * 2.4, ph: Math.random() * 6.3,
      c: Math.random() < .5 ? "147,197,253" : Math.random() < .5 ? "224,231,255" : "196,181,253",
    }));
  }
  sizeSky();
  addEventListener("resize", sizeSky);
  let last = performance.now();
  function drawSky(now) {
    const dt = Math.min(.05, (now - last) / 1000);
    last = now;
    ctx.clearRect(0, 0, W, H);
    const t = now / 1000;
    for (const m of motes) {
      m.y -= m.v * dt;
      m.x += Math.sin(t * .3 + m.ph) * .08 * dpr;
      if (m.y < -4) { m.y = H + 4; m.x = Math.random() * W; }
      const a = .25 + .55 * (.5 + .5 * Math.sin(t * m.tw + m.ph));
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, 6.283);
      ctx.fillStyle = `rgba(${m.c},${a})`;
      ctx.fill();
    }
    if (!reduced) requestAnimationFrame(drawSky);
  }
  requestAnimationFrame(drawSky);

  // ── Showcase: one video behind the text per chapter, loaded only when near ───
  const videos = $$(".showcase-stage .video");
  const chapters = $$(".chapter");
  function load(i) {
    const v = videos[i];
    if (!v || v.dataset.loaded) return;
    v.dataset.loaded = 1;
    if (v.dataset.local) {
      const vid = document.createElement("video");
      vid.src = v.dataset.local;
      vid.muted = true; vid.loop = true; vid.autoplay = true;
      vid.playsInline = true; vid.preload = "metadata"; vid.tabIndex = -1;
      v.appendChild(vid);
      vid.play().catch(() => {});
      return;
    }
    const id = v.dataset.video;
    const f = document.createElement("iframe");
    f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&rel=0&playsinline=1&disablekb=1&modestbranding=1&iv_load_policy=3`;
    f.allow = "autoplay; encrypted-media; picture-in-picture";
    f.title = "ElyraMC showcase";
    f.tabIndex = -1;
    v.appendChild(f);
  }
  function activate(i) {
    videos.forEach((v, k) => v.classList.toggle("on", k === i));
    chapters.forEach((c, k) => c.classList.toggle("on", k === i));
    load(i);
    load(i + 1);
    const lv = videos[i] && videos[i].querySelector("video");
    if (lv) lv.play().catch(() => {});
  }
  const chapterObserver = new IntersectionObserver(entries => {
    for (const en of entries) if (en.isIntersecting) activate(+en.target.dataset.index);
  }, { threshold: 0.55 });
  chapters.forEach(c => chapterObserver.observe(c));
  // Load the first video as the showcase approaches, so it is already playing on arrival.
  new IntersectionObserver((entries, obs) => {
    if (entries.some(e => e.isIntersecting)) { activate(0); obs.disconnect(); }
  }, { rootMargin: "60% 0px" }).observe($("#showcase"));

  // ── The mock menu: it presses Start and plays with its settings ──────────────
  const menu = $("#mockMenu");
  if (menu) {
    const toggles = $$("[data-tgl]", menu);
    const seg = $$("#mmSeg span", menu);
    const slide = $("#mmSlide", menu), slideVal = $("#mmSlideVal", menu);
    const start = $("#mmStart", menu);
    const steps = [
      () => { seg.forEach(s => s.classList.remove("on")); seg[2].classList.add("on"); },
      () => { slide.style.width = "70px"; slideVal.textContent = "5M"; },
      () => { toggles[1].classList.add("on"); },
      () => { menu.classList.add("running"); start.innerHTML = "<span>■</span> Stop"; },
      () => { toggles[1].classList.remove("on"); },
      () => { seg.forEach(s => s.classList.remove("on")); seg[1].classList.add("on"); slide.style.width = "40px"; slideVal.textContent = "2.5M"; },
      () => { menu.classList.remove("running"); start.innerHTML = "<span>▶</span> Start"; },
    ];
    let k = 0;
    setInterval(() => { if (!document.hidden) steps[k++ % steps.length](); }, 1400);
    // The nav highlight walks through the categories now and then.
    const navs = $$(".mm-nav", menu).slice(0, 5);
    let n = 0;
    setInterval(() => {
      if (document.hidden) return;
      n = (n + 1) % navs.length;
      navs.forEach((a, i) => a.classList.toggle("on", i === n));
    }, 3200);
  }

  // ── The mock HUD: money counting up, a profit curve growing, a ticking clock ─
  const fmt = v => v >= 1e6 ? (v / 1e6).toFixed(2) + "M" : v >= 1e3 ? (v / 1e3).toFixed(1) + "k" : Math.round(v) + "";
  const money = $$("[data-money]");
  const line = $(".spark-line"), fill = $(".spark-fill");
  let hudStarted = false;
  function startHud() {
    if (hudStarted) return;
    hudStarted = true;
    const t0 = performance.now();
    const pts = [];
    let v = 0;
    for (let i = 0; i <= 60; i++) { v += 1.4 + Math.sin(i / 4) * 2.2 + (i > 34 && i < 40 ? -5 : 0) + Math.random() * 1.2; pts.push(v); }
    const max = Math.max(...pts), min = Math.min(0, ...pts);
    const xy = (i, val) => [i * 5, 56 - ((val - min) / (max - min)) * 50];
    function frame(now) {
      const t = Math.min(1, (now - t0) / 2600), k = 1 - Math.pow(1 - t, 3);
      money.forEach(b => b.textContent = fmt(+b.dataset.money * k));
      const n = Math.max(2, Math.round(pts.length * k));
      let d = "";
      for (let i = 0; i < n; i++) { const [x, y] = xy(i, pts[i]); d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1); }
      line.setAttribute("d", d);
      const [lx] = xy(n - 1, 0);
      fill.setAttribute("d", d + `L${lx} 60L0 60Z`);
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    // The session and the next break tick like the real thing.
    let session = 42 * 60 + 2, brk = 12 * 60 + 30;
    const clock = s => Math.floor(s / 60) + "m " + String(s % 60).padStart(2, "0") + "s";
    setInterval(() => { $("#hudSession").textContent = clock(++session); $("#hudBreak").textContent = clock(Math.max(0, --brk)); }, 1000);
  }
  const hudCard = $(".hud-card");
  if (hudCard) new IntersectionObserver((e, o) => { if (e.some(x => x.isIntersecting)) { startHud(); o.disconnect(); } }, { threshold: .4 }).observe(hudCard);

  // ── The library ──────────────────────────────────────────────────────────────
  const ICONS = {
    coin: '<circle cx="12" cy="12" r="8"/><path d="M12 8v8M9.5 10.5c0-1.2 1.1-2 2.5-2s2.5.7 2.5 1.8-1 1.5-2.5 1.7-2.5.7-2.5 1.8 1.1 1.7 2.5 1.7 2.5-.8 2.5-2"/>',
    search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
    chart: '<path d="M4 19V5M4 19h16M8 15l3-4 3 2 5-6"/>',
    book: '<path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h10"/>',
    hammer: '<path d="M14 6l4 4M12 8l-8 8 2 2 8-8M13 3l8 8-2 2-8-8z"/>',
    gavel: '<path d="M14 4l6 6M11 7l6 6M4 20l7-7M9 9l6 6"/>',
    cookie: '<circle cx="12" cy="12" r="8"/><circle cx="9" cy="10" r=".8"/><circle cx="14" cy="9" r=".8"/><circle cx="13" cy="14" r=".8"/><circle cx="9" cy="15" r=".8"/>',
    flask: '<path d="M9 3h6M10 3v6L5 19a1.5 1.5 0 0 0 1.3 2h11.4a1.5 1.5 0 0 0 1.3-2L14 9V3"/><path d="M7.5 15h9"/>',
    pick: '<path d="M4 20l8-8M14 4c3 0 6 3 6 6M10 4c4-1 9 3 10 10"/>',
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    leaf: '<path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15"/><path d="M5 19l8-8"/>',
    tree: '<path d="M12 3l6 8h-3l4 6H5l4-6H6z"/><path d="M12 17v4"/>',
    cape: '<path d="M8 3h8l3 18-7-3-7 3z"/><path d="M8 3l4 5 4-5"/>',
    skull: '<path d="M5 11a7 7 0 0 1 14 0v4l-2 1v3H7v-3l-2-1z"/><circle cx="9.5" cy="12" r="1.3"/><circle cx="14.5" cy="12" r="1.3"/>',
    ice: '<path d="M12 3v18M4.5 7.5l15 9M19.5 7.5l-15 9"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  };
  const CAT = { npc: ["NPC", "#10b981,#047857"], bz: ["Bazaar", "#eab308,#a16207"], ah: ["AH", "#f59e0b,#b45309"], ut: ["Utilities", "#a855f7,#6d28d9"], cb: ["Combat", "#64748b,#334155"] };
  const MACROS = [
    ["npc", "NPC Flipper", "Buys on the Bazaar below NPC price and sells to an NPC, crafting up first when that pays more.", "coin"],
    ["npc", "Flip Finder", "Scans every base item and ranks the NPC margins. Feeds the NPC Flipper.", "search"],
    ["bz", "Sell Order Flip", "Flips high-spread Bazaar items with buy and sell orders, never touching an NPC.", "chart"],
    ["bz", "Book Combine Flip", "Buys low-level books, merges them in the anvil and sells the high-level book.", "book"],
    ["bz", "Craft Flip", "Buys ingredients, crafts them and sells the result on the Bazaar or the AH.", "hammer"],
    ["ah", "AH Flipper", "Snipes Auction House flips in real time through CoFL.", "gavel"],
    ["ut", "Auto Booster Cookie", "Buys and eats a Booster Cookie before the active one runs out.", "cookie"],
    ["ut", "Experimentation Table", "Plays the add-ons and Superpairs for every charge and stores the prizes.", "flask"],
    ["ut", "Sand Miner", "Sprints a fixed desert loop in straight lines, breaking the sand it runs over.", "pick"],
    ["ut", "Harp Macro", "Plays every song of Melody's Harp, note by note.", "music"],
    ["ut", "Garden Unlock", "Plays the Unlock the Garden quest from start to finish.", "leaf"],
    ["ut", "Galatea Unlock", "The foraging questline that opens Galatea, up to Foraging XII.", "tree"],
    ["ut", "Auto David's Cloak", "Moonglade Marsh, Chapter I, played to the end — and the cloak.", "cape"],
    ["cb", "Graveyard Zombies", "Clears Graveyard Zombies and Zombie Villagers in the Hub until stopped.", "skull"],
    ["cb", "Glacite Macro", "Glacite Walkers on the Tunnels floor, one hit each on the run.", "ice"],
    ["cb", "Zealot Macro", "The Frozen Scythe at every Zealot in sight; Special Zealots first.", "eye"],
  ];
  const grid = $("#grid");
  if (grid) {
    grid.innerHTML = MACROS.map(([c, name, desc, icon]) => {
      const [label, g] = CAT[c];
      return `<article class="macro reveal" data-c="${c}">
        <span class="tag">${label}</span>
        <div class="mi" style="background:linear-gradient(135deg,${g})"><svg viewBox="0 0 24 24">${ICONS[icon]}</svg></div>
        <h4>${name}</h4><p>${desc}</p></article>`;
    }).join("");
    $$(".macro", grid).forEach(card => card.addEventListener("pointermove", e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", e.clientX - r.left + "px");
      card.style.setProperty("--my", e.clientY - r.top + "px");
    }));
    $$("#filters button").forEach(b => b.addEventListener("click", () => {
      $$("#filters button").forEach(x => x.classList.toggle("on", x === b));
      const f = b.dataset.f;
      $$(".macro", grid).forEach(card => {
        const show = f === "all" || card.dataset.c === f;
        card.classList.toggle("hide", !show);
        if (show) { card.classList.remove("in"); void card.offsetWidth; card.classList.add("in"); }
      });
    }));
  }

  route();
})();

// Count jar downloads as a GoatCounter event (no personal data).
document.querySelectorAll('a[href$=".jar"]').forEach(function (a) {
  a.addEventListener("click", function () {
    if (window.goatcounter && window.goatcounter.count) {
      window.goatcounter.count({ path: "download-jar", title: "Download jar", event: true });
    }
  });
});
