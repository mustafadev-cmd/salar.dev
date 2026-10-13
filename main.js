/* ===== Site configuration — fill these in; empty values are hidden/disabled honestly ===== */
const CONFIG = {
  email: "",          // e.g. "hello@yourdomain.com"
  github: "",         // full URL
  linkedin: "",       // full URL
  formEndpoint: ""    // e.g. a Formspree URL that accepts JSON POST
};
const PROJECTS = [
  { title: "Project name", desc: "Short description of the problem solved and what you built. (Placeholder)", stack: ["Stack", "Goes", "Here"], url: "", image: "" },
  { title: "Project name", desc: "Short description of the problem solved and what you built. (Placeholder)", stack: ["Stack", "Goes", "Here"], url: "", image: "" },
  { title: "Project name", desc: "Short description of the problem solved and what you built. (Placeholder)", stack: ["Stack", "Goes", "Here"], url: "", image: "" }
];

/* ===== Cinematic scroll sequence ===== */
(() => {
  const N = 297;
  const hero = document.getElementById("home");
  const canvas = document.getElementById("seq");
  const ctx = canvas.getContext("2d", { alpha: false });
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const set = innerWidth <= 820 ? "m" : "d";
  const url = i => `frames/${set}/${String(i + 1).padStart(3, "0")}.webp`;
  const FOCUS_X = 0.56;                       // keep Salar framed when the viewport is narrower than 16:9
  const blobs = new Array(N);                 // compressed frames (≈14 MB total)
  const bitmaps = new Map();                  // decoded window only — avoids ~2 GB of raw pixels
  const pending = new Set();
  let cur = 0, target = 0, shown = -1, running = false, vw = 0, vh = 0;

  const els = {
    a: document.getElementById("copyA"), b: document.getElementById("copyB"),
    cue: document.getElementById("cue"), bar: document.getElementById("bar"),
    veil: document.getElementById("veil"), nav: document.getElementById("nav")
  };

  function size() {
    const dpr = Math.min(devicePixelRatio || 1, set === "m" ? 2 : 2);
    vw = innerWidth; vh = innerHeight;
    canvas.width = Math.round(vw * dpr); canvas.height = Math.round(vh * dpr);
    shown = -1; request();
  }

  async function load(i) {
    if (blobs[i] || pending.has(i)) return;
    pending.add(i);
    try { const r = await fetch(url(i)); if (r.ok) blobs[i] = await r.blob(); } catch (e) { /* retried by pump */ }
    pending.delete(i); pump(); request();
  }
  function pump() {                           // closest-to-viewer-first loading, 6 parallel
    const c = Math.round(cur * (N - 1));
    while (pending.size < 6) {
      let best = -1, bd = 1e9;
      for (let i = 0; i < N; i++) {
        if (blobs[i] || pending.has(i)) continue;
        const d = i >= c - 2 ? i - c : (c - i) * 3;
        if (d < bd) { bd = d; best = i; }
      }
      if (best < 0) return;
      load(best);
    }
  }
  async function decode(i) {
    if (bitmaps.has(i) || !blobs[i]) return;
    bitmaps.set(i, null);
    try { bitmaps.set(i, await createImageBitmap(blobs[i])); request(); } catch (e) { bitmaps.delete(i); }
  }
  function window_(c) {
    for (let k = -3; k <= 14; k++) { const i = c + k; if (i >= 0 && i < N) decode(i); }
    for (const [i, b] of bitmaps) if (Math.abs(i - c) > 30) { b && b.close(); bitmaps.delete(i); }
  }
  function nearest(c) {
    for (let d = 0; d < 40; d++) for (const i of [c - d, c + d]) { const b = bitmaps.get(i); if (b) return i; }
    return -1;
  }
  function draw(c) {
    const i = nearest(c); if (i < 0 || i === shown) return;
    const b = bitmaps.get(i), cw = canvas.width, ch = canvas.height;
    const portrait = ch > cw * 1.1;
    // Desktop: cover. Portrait: scene scaled to ~72% of viewport height (uniform, never stretched), panning slightly with progress.
    const s = portrait ? Math.max(ch * 0.72 / b.height, cw / b.width) : Math.max(cw / b.width, ch / b.height);
    const dw = b.width * s, dh = b.height * s;
    const fx = portrait ? 0.56 - 0.10 * cur : FOCUS_X;
    if (portrait) { ctx.fillStyle = "#14121a"; ctx.fillRect(0, 0, cw, ch); }
    ctx.drawImage(b, -(dw - cw) * fx, portrait ? ch * 0.07 : -(dh - ch) * 0.5, dw, dh);
    shown = i;
  }

  function progress() {
    const r = hero.getBoundingClientRect(), span = hero.offsetHeight - innerHeight;
    return Math.min(1, Math.max(0, -r.top / span));
  }
  function ui(p) {
    els.a.classList.toggle("hide", p > 0.12);
    els.b.classList.toggle("show", p > 0.74 && p < 0.92);
    els.cue.style.opacity = p > 0.03 ? 0 : 1;
    els.bar.style.transform = `scaleX(${p})`;
    els.veil.style.opacity = Math.max(0, (p - 0.9) / 0.1);
  }
  function frame() {
    running = false;
    target = reduce ? 0 : progress();
    cur += (target - cur) * 0.16;
    if (Math.abs(target - cur) < 0.0003) cur = target;
    const c = Math.round(cur * (N - 1));
    window_(c); pump(); draw(c); ui(cur);
    if (cur !== target || shown !== c) request();
  }
  function request() { if (!running) { running = true; requestAnimationFrame(frame); } }

  size();
  addEventListener("resize", size, { passive: true });
  addEventListener("scroll", () => { request(); els.nav.classList.toggle("solid", scrollY > 40); }, { passive: true });
  for (let i = 0; i < 12; i++) load(i);       // opening frames first
  pump(); request();
})();

/* ===== Navigation ===== */
(() => {
  const burger = document.getElementById("burger"), menu = document.getElementById("menu");
  const close = () => { menu.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); burger.setAttribute("aria-label", "Open menu"); document.body.style.overflow = ""; };
  burger.addEventListener("click", () => {
    const o = menu.classList.toggle("open");
    burger.setAttribute("aria-expanded", o); burger.setAttribute("aria-label", o ? "Close menu" : "Open menu");
    document.body.style.overflow = o ? "hidden" : "";
  });
  menu.querySelectorAll("a").forEach(a => a.addEventListener("click", close));
  addEventListener("keydown", e => e.key === "Escape" && close());
})();

/* ===== Projects, contact, footer ===== */
(() => {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  document.getElementById("projects-list").innerHTML = PROJECTS.map(p => `
    <article class="proj">
      <div class="shot">${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.title)} screenshot" loading="lazy">` : "Screenshot placeholder"}</div>
      <div class="in"><h3>${esc(p.title)}</h3><p>${esc(p.desc)}</p>
      <div class="tags">${p.stack.map(t => `<span>${esc(t)}</span>`).join("")}</div>
      ${p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener">View live project →</a>` : ""}</div>
    </article>`).join("");

  const links = [];
  if (CONFIG.email) links.push(`<a href="mailto:${esc(CONFIG.email)}">${esc(CONFIG.email)}</a>`);
  const soc = [];
  if (CONFIG.github) soc.push(`<a href="${esc(CONFIG.github)}" target="_blank" rel="noopener">GitHub</a>`);
  if (CONFIG.linkedin) soc.push(`<a href="${esc(CONFIG.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>`);
  document.getElementById("contact-links").innerHTML = links.concat(soc).join("");
  document.getElementById("social").innerHTML = soc.join("");
  document.getElementById("yr").textContent = new Date().getFullYear();

  const form = document.getElementById("form"), status = document.getElementById("status");
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const f = new FormData(form), d = Object.fromEntries(f);
    let ok = true;
    form.querySelectorAll("input,textarea").forEach(el => {
      const bad = !el.checkValidity() || !el.value.trim();
      el.setAttribute("aria-invalid", bad); if (bad) ok = false;
    });
    if (!ok) { status.textContent = "Please complete every field with a valid email and a short message."; return; }
    if (CONFIG.formEndpoint) {
      status.textContent = "Sending…";
      try {
        const r = await fetch(CONFIG.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(d) });
        if (!r.ok) throw 0;
        form.reset(); status.textContent = "Thanks — your message was sent.";
      } catch { status.textContent = "Sorry, sending failed. Please try again later."; }
    } else if (CONFIG.email) {
      location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent("Project enquiry from " + d.name)}&body=${encodeURIComponent(d.message + "\n\n" + d.name + " <" + d.email + ">")}`;
      status.textContent = "Opening your email app…";
    } else {
      status.textContent = "Setup needed: this form isn't connected yet. Set CONFIG.formEndpoint or CONFIG.email in main.js.";
    }
  });
})();
