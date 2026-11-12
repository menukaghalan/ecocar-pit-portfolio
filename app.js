/* =====================================================================
   SDV interactive deck: behaviour (v5)
   v5 adds: redesigned target dossiers (target rail + four sections).
   v7 adds: company screen, how the thinking changed, business models, personas.
   v4 adds: fixes from the 30 Oct review: funnel logic, one number per
   position, market reasoning, score sensitivity, growth-slide framing.
   v3 adds: executive summary, shortlist funnel + weight sensitivity,
   target dossiers, research plan, reading mode, focus management.
   Content comes from data.js; icons and logo sizes from assets.js.
   v2 adds: source citations, fact-check ledger, Before/With SDV era,
   value-chain lenses + drag-to-rotate, growth-chart measures,
   company finder (/), speaker notes (N).
   ===================================================================== */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const P = window.PALETTE;
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SVGNS = 'http://www.w3.org/2000/svg';
  const STAGE_W = 1600, STAGE_H = 900;
  // v15: ?export=1 renders one slide per 1600 × 900 page for the PDF (no top bar or dock)
  const EXPORT = new URLSearchParams(location.search).has('export');
  if (EXPORT) document.documentElement.classList.add('export');

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const icon = (n) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[n] || ''}"/></svg>`;
  const cv = (c) => `--c:${P[c].m};--cs:${P[c].s};--cl:${P[c].l}`;
  const svgEl = (tag, attrs = {}) => {
    const e = document.createElementNS(SVGNS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  };
  const layerById = (id) => LAYERS.find((l) => l.id === id);
  // shortlisted candidates are numbered by final rank; the screened-out one shows ✕ everywhere
  const candOf = (n) => CANDIDATES.find((c) => c.n === n);
  const candMark = (n) => (candOf(n).screened ? '✕' : String(n));
  const candStatus = (n) => (candOf(n).screened ? 'shortlisted, then screened out in Round 1' : `Round 1 target #${n}; ${candOf(n).now.toLowerCase()}`);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ------------------------------------------------------------------ CITATIONS
  // [^id] in data.js text -> numbered link to SOURCES[id]; numbering = SOURCES order.
  const SRC_IDS = Object.keys(SOURCES);
  const srcNum = (id) => SRC_IDS.indexOf(id) + 1;
  function citeHtml(id) {
    const s = SOURCES[id];
    if (!s) return '';
    const href = s.url ? ` href="${esc(s.url)}" target="_blank" rel="noopener"` : ' role="note" tabindex="0"';
    return `<sup class="cite" data-s="${id}"><a${href} aria-label="Source ${srcNum(id)}: ${esc(s.pub)}">${srcNum(id)}</a></sup>`;
  }
  const CITE_RE = /\[\^([\w-]+)\]/g;
  const rich = (t) => esc(t).replace(CITE_RE, (_, id) => citeHtml(id));
  const plain = (t) => String(t).replace(CITE_RE, '');
  function hydrateCites(scope = document) {
    $$('sup.cite:not([data-done])', scope).forEach((sup) => {
      sup.dataset.done = '1';
      if (!sup.firstChild) sup.outerHTML = citeHtml(sup.dataset.s).replace('<sup class="cite"', '<sup class="cite" data-done="1"');
    });
  }
  const KIND = { primary: 'Primary source', analyst: 'Analyst / research firm', survey: 'Vendor survey', press: 'Press report', team: 'Team assessment' };

  // ------------------------------------------------------------------ LOGO CHIPS
  const NAMES = { nvidia: 'NVIDIA', qualcomm: 'Qualcomm', nxp: 'NXP', qnx: 'QNX', vector: 'Vector', android: 'Android Automotive',
    mobileye: 'Mobileye', tesla: 'Tesla', 'tesla-t': 'Tesla', rivian: 'Rivian', harman: 'Harman', onstar: 'OnStar', motive: 'Motive',
    att: 'AT&T', aws: 'AWS', azure: 'Microsoft Azure', gcloud: 'Google Cloud', infineon: 'Infineon', renesas: 'Renesas', bosch: 'Bosch',
    aptiv: 'Aptiv', zf: 'ZF', windriver: 'Wind River', excelfore: 'Excelfore', gm: 'GM', verizon: 'Verizon', tomtom: 'TomTom',
    plaxidityx: 'PlaxidityX', dspace: 'dSPACE', applied: 'Applied Intuition', synopsys: 'Synopsys', hertz: 'Hertz', uber: 'Uber',
    lyft: 'Lyft', waymo: 'Waymo', ford: 'Ford', toyota: 'Toyota', vw: 'Volkswagen', bmw: 'BMW', hyundai: 'Hyundai', honda: 'Honda', nio: 'NIO', byd: 'BYD' };
  const logoSrc = (id) => `logos/${id}.${id === 'applied' ? 'png' : 'svg'}`;

  // canonical company name for a chip spec (used by the finder and highlight)
  function specName(spec) {
    if (spec[0] === '~') return null;
    let n;
    if (spec[0] === '=') n = spec.slice(1);
    else {
      const [id, txt] = spec.split('|');
      n = id === 'gm' && txt ? `${txt} (GM)` : (txt || NAMES[id] || id);
      if (id === 'onstar') n = 'OnStar (GM)';
    }
    return n.replace(/\s*\((Aumovio|Trend Micro|Rivian–VW)\)$/, '');
  }
  const specKey = (spec) => { const n = specName(spec); return n ? n.toLowerCase() : ''; };

  function chip(spec, size = 'sm') {
    const key = esc(specKey(spec));
    if (spec[0] === '=') return `<span class="chip txt" data-n="${key}">${esc(spec.slice(1))}</span>`;
    if (spec[0] === '~') return `<span class="chip muted">${esc(spec.slice(1))}</span>`;
    const [id, txt] = spec.split('|');
    const k = size === 'lg' ? 78 : 54, max = size === 'lg' ? 27 : 18;
    const h = Math.min((LOGO_H[id] || 0.3) * k, max).toFixed(1);
    const name = NAMES[id] || id;
    return `<span class="chip" data-n="${key}"><img src="${logoSrc(id)}" alt="${esc(txt ? '' : name)}" style="height:${h}px" draggable="false">${txt ? `<span>${esc(txt)}</span>` : ''}</span>`;
  }
  const chips = (list, size) => `<div class="chips${size === 'lg' ? ' lg' : ''}">${list.map((s) => chip(s, size)).join('')}</div>`;

  function meter(level) {
    let bars = '';
    for (let i = 1; i <= 3; i++) bars += `<i class="${i <= level ? 'on' : ''}"></i>`;
    return `<span class="meter">${bars}<span>${COMP_LABEL[level]}</span></span>`;
  }
  const pocket = (p) => `<span class="pocket${p.star ? ' star' : ''}${p.none ? ' none' : ''}${p.screened ? ' screened' : ''}">${esc(p.text)}${p.target ? `<em class="tgt" title="${p.target === 'lead' ? 'W1, first to test' : 'W2, conditional'}">${p.target === 'lead' ? 'W1' : 'W2'}</em>` : ''}${p.screened ? `<em class="scr" title="${p.label === 'dropped' ? 'A Round 1 target, dropped after the company screen' : 'Screened out as a stand-alone wedge'}">${p.label || 'screened out'}</em>` : ''}</span>`;

  function hydrateIcons(scope = document) {
    $$('[data-icon]', scope).forEach((el) => { if (!el.firstChild) el.innerHTML = icon(el.dataset.icon); });
  }

  // segmented control: buttons + sliding thumb
  function segCtl(el, onChange) {
    const thumb = $('.seg-thumb', el);
    const btns = $$('button', el);
    const isTabs = el.getAttribute('role') === 'tablist';
    const stateAttr = isTabs ? 'aria-selected' : 'aria-checked';
    const sync = () => btns.forEach((x) => { const on = x.classList.contains('on'); x.setAttribute(stateAttr, String(on)); x.tabIndex = on ? 0 : -1; });
    // arrow keys move the selection (radio group / tab list pattern)
    el.addEventListener('keydown', (e) => {
      const i = btns.indexOf(document.activeElement);
      if (i < 0) return;
      let j = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % btns.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + btns.length) % btns.length;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = btns.length - 1;
      if (j < 0) return;
      e.preventDefault(); e.stopPropagation();
      btns[j].focus(); btns[j].click();
    });
    const place = () => {
      const on = btns.find((b) => b.classList.contains('on')) || btns[0];
      thumb.style.left = on.offsetLeft + 'px';
      thumb.style.width = on.offsetWidth + 'px';
    };
    btns.forEach((b) => b.addEventListener('click', () => {
      if (b.classList.contains('on')) return;
      btns.forEach((x) => x.classList.toggle('on', x === b));
      sync(); place();
      onChange(b);
    }));
    sync();
    requestAnimationFrame(place);
    document.fonts && document.fonts.ready.then(place);
    return { place, set(val, attr) { const b = btns.find((x) => x.dataset[attr] === val); if (b) b.click(); } };
  }

  // ------------------------------------------------------------------ TOOLTIP
  const tip = $('#tip');
  function showTip(html, x, y) {
    tip.innerHTML = html;
    tip.classList.add('show');
    const r = tip.getBoundingClientRect();
    let tx = x + 16, ty = y + 16;
    if (tx + r.width > innerWidth - 10) tx = x - r.width - 16;
    if (ty + r.height > innerHeight - 10) ty = y - r.height - 16;
    tip.style.left = tx + 'px';
    tip.style.top = ty + 'px';
  }
  const hideTip = () => tip.classList.remove('show');

  // citation hover / click (delegated)
  document.addEventListener('pointerover', (e) => {
    const c = e.target.closest && e.target.closest('.cite');
    if (!c) return;
    const s = SOURCES[c.dataset.s]; if (!s) return;
    const r = c.getBoundingClientRect();
    showTip(`<span class="tip-k">[${srcNum(c.dataset.s)}] ${esc(KIND[s.kind] || '')}</span><b>${esc(s.pub)}</b>${esc(s.title)}<br><span class="tip-d">${esc(s.date)}${s.url ? ' · click to open ↗' : ''}</span>`, r.right, r.bottom);
  });
  document.addEventListener('pointerout', (e) => { if (e.target.closest && e.target.closest('.cite')) hideTip(); });
  document.addEventListener('focusin', (e) => {
    const c = e.target.closest && e.target.closest('.cite');
    if (!c) return;
    const s = SOURCES[c.dataset.s]; if (!s) return;
    const r = c.getBoundingClientRect();
    showTip(`<span class="tip-k">[${srcNum(c.dataset.s)}] ${esc(KIND[s.kind] || '')}</span><b>${esc(s.pub)}</b>${esc(s.title)}<br><span class="tip-d">${esc(s.date)}${s.url ? ' · Enter to open ↗' : ''}</span>`, r.right, r.bottom);
  });
  document.addEventListener('focusout', (e) => { if (e.target.closest && e.target.closest('.cite')) hideTip(); });
  // a citation inside a clickable card opens its source, not the card
  document.addEventListener('click', (e) => {
    const c = e.target.closest && e.target.closest('.cite');
    if (!c) return;
    e.stopPropagation();
    if (!c.querySelector('a[href]')) e.preventDefault();
  }, true);

  // ------------------------------------------------------------------ STAGE FIT
  let scale = 1, stageW = STAGE_W;
  // v14: the stage keeps its 900 height but grows wider (up to 2240) on wide windows, so a
  // 16:10 or 21:9 window is filled instead of showing empty bands. Slide CSS reflows with
  // --sw (stage width), --k (how much the 1480 content width grew) and --dx (half the growth).
  const STAGE_W_MAX = 2240, SIDE = 20;
  function fit() {
    const top = EXPORT ? 0 : 52, bot = EXPORT ? 0 : 66; // v12: room for the dock, which now stays visible
    const vw = innerWidth, vh = innerHeight;
    const availH = Math.max(200, vh - top - bot);
    scale = Math.min(vw / STAGE_W, availH / STAGE_H);
    stageW = Math.round(clamp((vw - 2 * SIDE) / scale, STAGE_W, STAGE_W_MAX));
    root.style.setProperty('--sw', stageW + 'px');
    root.style.setProperty('--k', ((stageW - 120) / 1480).toFixed(4));
    root.style.setProperty('--dx', (stageW - STAGE_W) / 2 + 'px');
    document.body.classList.toggle('wide', stageW >= 1900);
    root.style.setProperty('--s', scale);
    root.style.setProperty('--cx', vw / 2 + 'px');
    root.style.setProperty('--cy', top + availH / 2 + 'px');
    cover.resize();
  }
  function toStage(stage, x, y) {
    const r = stage.getBoundingClientRect();
    return { x: (x - r.left) / scale, y: (y - r.top) / scale };
  }

  // ------------------------------------------------------------------ COUNT-UP
  function countUp(el, delay = 450) {
    cancelAnimationFrame(el._raf);
    clearTimeout(el._to);
    const to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0);
    const pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    if (REDUCE) { el.textContent = pre + to.toFixed(dec) + suf; return; }
    el.textContent = pre + (0).toFixed(dec) + suf;
    el._to = setTimeout(() => {
      const t0 = performance.now(), dur = 1600;
      const step = (t) => {
        const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
        el.textContent = pre + (to * e).toFixed(dec) + suf;
        if (k < 1) el._raf = requestAnimationFrame(step);
      };
      el._raf = requestAnimationFrame(step);
    }, delay);
  }

  // ------------------------------------------------------------------ TILT CARDS
  function bindTilt(scope = document) {
    $$('.tilt', scope).forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--ry', (px - 0.5) * 8 + 'deg');
        card.style.setProperty('--rx', (0.5 - py) * 8 + 'deg');
        card.style.setProperty('--px', px * 100 + '%');
        card.style.setProperty('--py', py * 100 + '%');
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--ry', '0deg');
        card.style.setProperty('--rx', '0deg');
      });
    });
  }

  // highlight a company's chip inside a container (finder jump)
  function flashChip(scope, key) {
    if (!key) return;
    $$(`.chip[data-n="${CSS.escape(key)}"]`, scope).forEach((c) => {
      c.classList.remove('hl'); void c.offsetWidth; c.classList.add('hl');
    });
  }

  // =================================================================== COVER
  const cover = (() => {
    const canvas = $('#coverCanvas');
    const ctx = canvas.getContext('2d');
    const carPath = new Path2D(ICONS.car);
    const RING_SP = [0.34, 0.25, 0.19, 0.14];
    const bodies = LAYERS.map((l, i) => ({ l, ring: i % 4, a: (i >= 4 ? Math.PI : 0) + (i % 4) * 1.3, sp: RING_SP[i % 4] }));
    const stars = Array.from({ length: 180 }, () => ({ x: Math.random() * STAGE_W_MAX, y: Math.random() * STAGE_H, r: Math.random() * 1.3 + 0.2, p: Math.random() * 6.28, v: Math.random() * 0.12 + 0.03 }));
    const rings = [112, 182, 252, 322];
    let raf = 0, running = false, mx = 0, my = 0, last = 0, dpr = 1;

    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(stageW * scale * dpr);
      canvas.height = Math.round(STAGE_H * scale * dpr);
      if (!running) draw(performance.now());
    }
    function draw(t) {
      const k = scale * dpr;
      ctx.setTransform(k, 0, 0, k, 0, 0);
      ctx.clearRect(0, 0, stageW, STAGE_H);
      const time = t / 1000;
      for (const s of stars) {
        s.x -= s.v; if (s.x < 0) s.x = stageW;
        ctx.globalAlpha = 0.25 + 0.35 * Math.sin(time * 1.4 + s.p) ** 2;
        ctx.fillStyle = '#c7d2fe';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
      const cx = stageW - 450 + mx * 26, cy = 470 + my * 18, tilt = -0.22, squash = 0.4;
      const cosT = Math.cos(tilt), sinT = Math.sin(tilt);
      const proj = (r, a) => {
        const ex = Math.cos(a) * r, ey = Math.sin(a) * r * squash;
        return { x: cx + ex * cosT - ey * sinT, y: cy + ex * sinT + ey * cosT, z: Math.sin(a) };
      };
      rings.forEach((r, i) => {
        ctx.save();
        ctx.translate(cx, cy); ctx.rotate(tilt);
        ctx.beginPath(); ctx.ellipse(0, 0, r, r * squash, 0, 0, 6.283);
        ctx.setLineDash([2, 9]); ctx.lineDashOffset = -time * (10 + i * 4);
        ctx.strokeStyle = `rgba(165,180,252,${0.42 - i * 0.07})`; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.restore();
      });
      const pos = bodies.map((b) => {
        const a = b.a + time * b.sp * (REDUCE ? 0 : 1);
        return { b, a, p: proj(rings[b.ring], a) };
      });
      const drawBody = ({ b, a, p }) => {
        const c = P[b.l.colour], depth = (p.z + 1) / 2;
        for (let j = 16; j > 0; j--) {
          const q = proj(rings[b.ring], a - j * 0.035);
          ctx.globalAlpha = (1 - j / 16) * 0.5 * (0.4 + depth * 0.6);
          ctx.fillStyle = c.m;
          ctx.beginPath(); ctx.arc(q.x, q.y, 2.2 * (1 - j / 20), 0, 6.283); ctx.fill();
        }
        const r = 6 + depth * 6;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 4);
        g.addColorStop(0, c.l); g.addColorStop(0.25, c.m + 'aa'); g.addColorStop(1, c.m + '00');
        ctx.globalAlpha = 0.5 + depth * 0.5;
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r * 4, 0, 6.283); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.55, 0, 6.283); ctx.fill();
        // v15: only the V&V body is labelled (it is our story), so no label can sit on the hub
        if (b.l.id === 8 && depth > 0.2) {
          ctx.globalAlpha = Math.min(1, (depth - 0.2) * 2.2);
          ctx.font = '700 17px Inter, sans-serif'; ctx.fillStyle = '#f5d0fe';
          const lab = 'Integration & V&V · our focus', tw = ctx.measureText(lab).width;
          // flip the label to the left of the body when it would run off the stage
          if (p.x + r + 10 + tw > stageW - 24) ctx.fillText(lab, p.x - r - 10 - tw, p.y + 6); else ctx.fillText(lab, p.x + r + 10, p.y + 6);
        }
        ctx.globalAlpha = 1;
      };
      pos.forEach(({ b, p }) => {
        ctx.strokeStyle = P[b.l.colour].m; ctx.globalAlpha = 0.12; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(p.x, p.y); ctx.stroke();
      });
      ctx.globalAlpha = 1;
      pos.filter((o) => o.p.z < 0).forEach(drawBody);
      const pulse = 1 + Math.sin(time * 1.6) * 0.06;
      let g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 170 * pulse);
      g.addColorStop(0, 'rgba(99,102,241,.55)'); g.addColorStop(0.4, 'rgba(59,130,246,.18)'); g.addColorStop(1, 'rgba(59,130,246,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 170 * pulse, 0, 6.283); ctx.fill();
      g = ctx.createRadialGradient(cx - 20, cy - 24, 4, cx, cy, 66);
      g.addColorStop(0, '#3b5bdb'); g.addColorStop(1, '#0b1533');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 64, 0, 6.283); ctx.fill();
      ctx.strokeStyle = 'rgba(165,180,252,.6)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.save(); ctx.translate(cx - 30, cy - 34); ctx.scale(2.5, 2.5); ctx.fillStyle = '#fff'; ctx.fill(carPath); ctx.restore();
      pos.filter((o) => o.p.z >= 0).forEach(drawBody);
      // the hub label is drawn last, below the circle, so no orbiting body can cover it
      ctx.globalAlpha = 1; ctx.font = '700 15px Inter, sans-serif'; ctx.fillStyle = '#c7d2fe'; ctx.textAlign = 'center';
      ctx.fillText('THE AUTOMAKER (OEM)', cx, cy + 92); ctx.textAlign = 'left';
    }
    function loop(t) {
      if (!running) return;
      if (t - last > 15) { draw(t); last = t; }
      raf = requestAnimationFrame(loop);
    }
    return {
      resize,
      start() { if (running) return; running = true; raf = requestAnimationFrame(loop); },
      stop() { running = false; cancelAnimationFrame(raf); },
      mouse(x, y) { mx = x; my = y; },
    };
  })();

  // =================================================================== WHY: ECU merge
  const ecus = (() => {
    const box = $('#ecus');
    const items = [];
    for (let i = 0; i < 17; i++) { const e = document.createElement('i'); box.appendChild(e); items.push(e); }
    let state = 0, timer = 0;
    const keep = [0, 3, 6, 8, 11, 13, 16];
    function layout() {
      items.forEach((e, i) => {
        if (state === 0) { e.style.left = i * 20 + 'px'; e.style.opacity = 1; e.style.transform = 'scale(.75)'; }
        else {
          const slot = keep.findIndex((k) => k >= i);
          const s = keep.includes(i) ? keep.indexOf(i) : Math.max(0, slot);
          e.style.left = s * 50 + 'px';
          e.style.opacity = keep.includes(i) ? 1 : 0;
          e.style.transform = keep.includes(i) ? 'scale(1.3)' : 'scale(.4)';
        }
      });
    }
    layout();
    return {
      start() { clearInterval(timer); state = 0; layout(); timer = setInterval(() => { state ^= 1; layout(); }, 2600); },
      stop() { clearInterval(timer); },
    };
  })();

  // =================================================================== ECOSYSTEM
  const eco = (() => {
    const stage = $('#eco');
    const svg = $('#ecoSvg');
    const html = $('#ecoHtml');
    const narr = $('#narr');
    const drawer = $('#drawer');
    const H = HUB, R = H.r + 28;
    const flowEls = {};
    const actorEls = {};
    const state = { hover: null, pinned: null, shift: 0, playing: false, playTimer: 0, era: 'after' };

    const actor = (id) => ACTORS.find((a) => a.id === id);
    const hubPt = (ang) => ({ x: H.x + R * Math.cos(ang * Math.PI / 180), y: H.y - R * Math.sin(ang * Math.PI / 180) });
    const hubToward = (p) => { const a = Math.atan2(H.y - p.y, p.x - H.x) * 180 / Math.PI; return hubPt(a); };
    const actorPt = (a, dy = 0) => ({ x: a.side === 'L' ? a.x + 180 : a.x - 180, y: a.y + dy });
    function endpoints(f) {
      const resolve = (end) => {
        if (typeof end === 'object') return end;
        if (end === 'hub') return null;
        return actorPt(actor(end), f.dy || 0);
      };
      let a = resolve(f.from), b = resolve(f.to);
      if (!a) a = f.ang != null ? hubPt(f.ang) : hubToward(b);
      if (!b) b = f.ang != null ? hubPt(f.ang) : hubToward(a);
      return [a, b];
    }
    function pathD(f, a, b) {
      if (f.curve) return `M${a.x},${a.y} C${a.x - 10},${a.y + 90} ${b.x + 40},${b.y - 90} ${b.x},${b.y}`;
      return `M${a.x},${a.y} L${b.x},${b.y}`;
    }
    const actorsOf = (f) => {
      const s = new Set(f.a || []);
      [f.from, f.to].forEach((e) => { if (typeof e === 'string') s.add(e); });
      if (f.type === 'rules') s.add('reg');
      return s;
    };

    function build() {
      const defs = svgEl('defs');
      const mk = (id, color) => {
        const m = svgEl('marker', { id, viewBox: '0 0 10 10', refX: 8.5, refY: 5, markerWidth: 9, markerHeight: 9, orient: 'auto-start-reverse', markerUnits: 'userSpaceOnUse' });
        m.appendChild(svgEl('path', { d: 'M0,0 L10,5 L0,10 z', fill: color }));
        defs.appendChild(m);
      };
      mk('ah-goods', '#8091ab'); mk('ah-shift', '#f97316'); mk('ah-data', '#a78bfa'); mk('ah-rules', '#64748b');
      const clip = svgEl('clipPath', { id: 'ecoClip' });
      clip.appendChild(svgEl('rect', { x: 0, y: 150, width: 1600, height: 660 }));
      defs.appendChild(clip);
      const rg = svgEl('radialGradient', { id: 'hubGlow' });
      rg.appendChild(svgEl('stop', { offset: '0%', 'stop-color': '#3b82f6', 'stop-opacity': '.16' }));
      rg.appendChild(svgEl('stop', { offset: '100%', 'stop-color': '#3b82f6', 'stop-opacity': '0' }));
      defs.appendChild(rg);
      svg.appendChild(defs);

      const bg = svgEl('g', { 'clip-path': 'url(#ecoClip)' });
      bg.appendChild(svgEl('circle', { cx: H.x, cy: H.y, r: 300, fill: 'url(#hubGlow)' }));
      bg.appendChild(svgEl('ellipse', { class: 'orbit', cx: H.x, cy: H.y, rx: 585, ry: 530 }));
      bg.appendChild(svgEl('ellipse', { class: 'orbit o2', cx: H.x, cy: H.y, rx: 360, ry: 312 }));
      svg.appendChild(bg);

      const gFlows = svgEl('g');
      const gParts = svgEl('g');
      svg.appendChild(gFlows); svg.appendChild(gParts);

      FLOWS.forEach((f) => {
        const [a, b] = endpoints(f);
        const kind = f.shift ? 'shift' : f.type;
        const nw = f.isNew ? ' is-new' : '';
        const path = svgEl('path', {
          d: pathD(f, a, b),
          class: `flow dimmable t-${f.type}${f.shift ? ' shift' : ''}${nw}`,
          'marker-end': `url(#ah-${kind})`,
        });
        gFlows.appendChild(path);
        const len = path.getTotalLength();
        const samples = [];
        for (let i = 0; i <= 100; i++) { const q = path.getPointAtLength((len * i) / 100); samples.push([q.x, q.y]); }
        const g = svgEl('g', { class: 'dimmable' + nw });
        gParts.appendChild(g);
        const parts = [];
        const add = (cls, dir, n, speed, r) => {
          for (let i = 0; i < n; i++) {
            const halo = svgEl('circle', { r: r * 2.4, class: `part halo ${cls}` });
            const dot = svgEl('circle', { r, class: `part ${cls}` });
            g.appendChild(halo); g.appendChild(dot);
            parts.push({ halo, dot, dir, phase: i / n, speed });
          }
        };
        const pcls = f.shift ? 'p-shift' : `p-${f.type}`;
        add(pcls, 1, Math.max(1, Math.round(len / 85)), 62, f.shift ? 3.2 : 2.6);
        if (f.money) add('p-money', -1, Math.max(1, Math.round(len / 150)), 40, 3.4);

        let label = null;
        if (f.label) {
          label = document.createElement('div');
          label.className = `fl dimmable${f.inline ? ' inline' : ''}${f.shift && f.inline ? ' sh' : ''}${nw}`;
          const sn = f.shift && !f.shiftNote ? `<span class="sn">${f.shift}</span>` : '';
          let inner = '';
          if (f.type === 'rules') inner = `<span class="rl">${esc(f.label)}</span>`;
          else {
            inner = `<span class="lbl">${sn}${esc(f.label)}</span>`;
            if (f.money) inner += `<span class="m">${esc(f.money)}</span>`;
            if (f.shiftNote) inner += `<span class="shn"><span class="sn">${f.shift}</span>${esc(f.shiftNote)}</span>`;
            if (f.back) inner += `<span class="bk">${esc(f.back)}</span>`;
          }
          label.innerHTML = inner;
          let lp;
          if (f.inline) lp = { x: a.x, y: (a.y + b.y) / 2 };
          else { const q = path.getPointAtLength(len * (f.t ?? 0.5)); lp = { x: q.x, y: q.y }; }
          if (f.dy && f.ang != null) lp.y += f.dy;
          label.style.left = lp.x + 'px';
          label.style.top = lp.y + 'px';
          html.appendChild(label);
        }
        flowEls[f.id] = { f, path, g, label, samples, len, parts, actors: actorsOf(f) };
      });

      const reg = document.createElement('div');
      reg.className = 'reg rv'; reg.style.setProperty('--d', 3); reg.tabIndex = 0; reg.dataset.node = 'reg';
      reg.innerHTML = `<span class="disc">${icon('gavel')}</span><div><div class="r-t">${esc(REGULATORS.title)}<span>${esc(REGULATORS.sub)}</span></div>
        <div class="r-l">${REGULATORS.list.map(esc).join(' · ')}</div></div>`;
      html.appendChild(reg);
      actorEls.reg = reg;

      const hub = document.createElement('div');
      hub.className = 'hub'; hub.tabIndex = 0; hub.dataset.node = 'hub';
      hub.style.left = H.x - H.r + 'px'; hub.style.top = H.y - H.r + 'px';
      let ring = '';
      H.oems.forEach((id, k) => {
        const ang = -90 + k * 36;
        ring += `<span class="oem" data-n="${esc((NAMES[id] || id).toLowerCase())}" style="transform:rotate(${ang}deg) translate(${H.r}px) rotate(${-ang}deg)"><img src="${logoSrc(id)}" alt="${esc(NAMES[id] || id)}" draggable="false"></span>`;
      });
      hub.innerHTML = `<div class="ring">${ring}</div><div class="hub-in"><div class="car">${icon('car')}</div><div class="hk">THE HUB</div>
        <div class="ht">Automakers</div><div class="ho">(OEMs)</div><div class="hs" id="hubSub">vehicle margin +<br>recurring software revenue</div></div>`;
      html.appendChild(hub);
      actorEls.hub = hub;

      ACTORS.forEach((a, i) => {
        const el = document.createElement('div');
        el.className = `actor rv${a.focus ? ' focus' : ''}`;
        el.style.cssText = `${cv(a.colour)};left:${a.x - 180}px;top:${a.y - 48}px;--d:${3 + (i % 5) * 0.6}`;
        el.tabIndex = 0; el.dataset.node = a.id;
        el.innerHTML = `${a.focus ? '<span class="badge">★ OUR FOCUS AREA</span>' : ''}<span class="disc">${icon(a.icon)}</span>
          <div><div class="a-t">${esc(a.title)}</div><div class="a-s">${esc(a.sub)}</div>${chips(a.logos)}</div>`;
        html.appendChild(el);
        actorEls[a.id] = el;
      });

      const sb = $('#shiftBtns');
      SHIFTS.forEach((s) => {
        const b = document.createElement('button');
        b.className = 'shb'; b.dataset.shift = s.n;
        b.innerHTML = `<span class="sn">${s.n}</span>${esc(s.title)}`;
        b.addEventListener('click', () => { stopPlay(); setShift(state.shift === s.n ? 0 : s.n); });
        sb.appendChild(b);
      });

      segCtl($('#eraCtl'), (b) => setEra(b.dataset.era));
      bind();
      setNarr();
    }

    // ---- era: before / with SDV
    function setEra(era) {
      state.era = era;
      const before = era === 'before';
      if (before) { stopPlay(); state.shift = 0; $$('.shb').forEach((b) => b.classList.remove('on')); closeDrawer(true); }
      stage.classList.toggle('era-before', before);
      for (const id in flowEls) {
        const fe = flowEls[id];
        if (fe.f.shift) fe.path.setAttribute('marker-end', `url(#ah-${before ? fe.f.type : 'shift'})`);
      }
      const hs = $('#hubSub');
      hs.classList.remove('swap'); void hs.offsetWidth; hs.classList.add('swap');
      hs.innerHTML = before ? 'vehicle margin,<br>paid once at the sale' : 'vehicle margin +<br>recurring software revenue';
      apply(); setNarr();
    }

    // ---- focus logic
    function apply() {
      let nodes = null, flows = null;
      const pick = state.hover || state.pinned;
      const live = (fe) => !(state.era === 'before' && fe.f.isNew);
      if (pick && pick !== 'hub') {
        flows = new Set(); nodes = new Set([pick, 'hub']);
        for (const id in flowEls) {
          const fe = flowEls[id];
          if (live(fe) && fe.actors.has(pick)) { flows.add(id); fe.actors.forEach((x) => nodes.add(x)); }
        }
      } else if (!pick && state.shift) {
        const s = SHIFTS[state.shift - 1];
        flows = new Set(s.flows); nodes = new Set([...s.actors, 'hub']);
      }
      stage.classList.toggle('focusing', !!flows);
      for (const id in flowEls) {
        const fe = flowEls[id], on = !!flows && flows.has(id);
        [fe.path, fe.g, fe.label].forEach((e) => e && e.classList.toggle('on', on));
        fe.boost = on ? 1.8 : 1;
      }
      for (const id in actorEls) actorEls[id].classList.toggle('on', !!nodes && nodes.has(id));
    }

    function setShift(n) {
      if (state.era === 'before') return;
      state.shift = n;
      $$('.shb').forEach((b) => b.classList.toggle('on', +b.dataset.shift === n));
      if (n) closeDrawer(true);
      apply(); setNarr();
    }
    function setNarr() {
      if (state.era === 'before') {
        narr.className = 'narr show era';
        narr.innerHTML = `<h4>${esc(ERA_TEXT.before.title)}</h4><p>${esc(ERA_TEXT.before.text)}</p>`;
        return;
      }
      if (!state.shift) {
        narr.className = 'narr hint';
        narr.innerHTML = 'Hover an actor to trace its flows · click it for detail · or play the four SDV shifts below';
        return;
      }
      const s = SHIFTS[state.shift - 1];
      narr.className = 'narr show' + (state.playing ? ' playing' : '');
      narr.innerHTML = `<h4><span class="sn">${s.n}</span>${esc(s.title)}</h4><p>${rich(s.text)}</p><div class="prog"><i></i></div>`;
    }
    function play() {
      if (state.playing) { stopPlay(); return; }
      if (state.era === 'before') return;
      state.playing = true;
      $('#playShifts').innerHTML = `<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg><span>Pause</span>`;
      let n = 0;
      const next = () => {
        n++;
        if (n > SHIFTS.length) { stopPlay(); setShift(0); return; }
        setShift(n);
        state.playTimer = setTimeout(next, 5500);
      };
      next();
    }
    function stopPlay() {
      state.playing = false;
      clearTimeout(state.playTimer);
      $('#playShifts').innerHTML = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg><span>Play</span>`;
      narr.classList.remove('playing');
    }

    // ---- drawer
    function openDrawer(id, hlKey) {
      stopPlay(); state.shift = 0; $$('.shb').forEach((b) => b.classList.remove('on')); setNarr();
      state.pinned = id;
      let colour, ic, title, sub, logos, gives, gets, sdv, layers = [];
      const before = state.era === 'before';
      if (id === 'hub') {
        colour = 'Ltwo'; ic = 'car'; title = H.title; sub = 'The hub of the ecosystem';
        logos = H.oems.slice(); gives = H.gives; gets = before ? H.getsBefore : H.gets; sdv = H.sdv; layers = [1, 2, 3, 4, 5, 6];
      } else if (id === 'reg') {
        colour = 'Ltwo'; ic = 'gavel'; title = REGULATORS.title; sub = REGULATORS.sub;
        logos = REGULATORS.list.map((x) => '=' + x); gives = 'Rules, type approval and recalls.'; gets = null; sdv = REGULATORS.detail; layers = [7];
      } else {
        const a = actor(id);
        colour = a.colour; ic = a.icon; title = a.title; sub = a.sub; logos = a.logos; gives = a.gives; gets = a.gets; sdv = a.sdv; layers = a.layers;
      }
      const side = id === 'reg' || (actor(id) && actor(id).side === 'R') ? 'left' : 'right';
      drawer.className = `drawer ${side}`;
      drawer.style.cssText = cv(colour);
      drawer.innerHTML = `<button class="x" aria-label="Close">×</button>
        <div class="dr-ico">${icon(ic)}</div>
        <div class="dr-t">${esc(title)}</div><div class="dr-s">${esc(sub)}</div>
        ${chips(logos)}
        <div class="dr-sec"><div class="mini-kicker">What they bring</div><p>${rich(gives)}</p></div>
        ${gets ? `<div class="dr-sec"><div class="mini-kicker" style="color:var(--money)">$ How they get paid</div><p>${rich(gets)}</p></div>` : ''}
        <div class="dr-sec sdv"><div class="mini-kicker">${id === 'reg' ? 'Why it matters' : 'What SDVs change'}</div><p>${rich(sdv)}</p></div>
        <div class="dr-sec"><div class="mini-kicker">Value-chain layers · open deep dive</div><div class="dr-links">
          ${layers.map((n) => { const l = layerById(n); return `<button class="lchip" data-layer="${n}" style="${cv(l.colour)}"><b>${l.num}</b>${esc(l.short)}<span class="go">→</span></button>`; }).join('')}
        </div></div>`;
      requestAnimationFrame(() => drawer.classList.add('open'));
      drawer.setAttribute('aria-hidden', 'false');
      drawer.setAttribute('role', 'region'); drawer.setAttribute('aria-label', title);
      if (document.activeElement && document.activeElement.closest && document.activeElement.closest('[data-node]')) {
        drawerReturn = document.activeElement;
        setTimeout(() => { const x = $('.x', drawer); if (x) x.focus(); }, 60);
      }
      $('.x', drawer).addEventListener('click', () => closeDrawer());
      $$('.lchip', drawer).forEach((b) => b.addEventListener('click', () => {
        closeDrawer(); goId('s-vc');
        setTimeout(() => dive.open(+b.dataset.layer), 650);
      }));
      if (hlKey) setTimeout(() => flashChip(drawer, hlKey), 350);
      apply();
    }
    let drawerReturn = null;
    function closeDrawer(silent) {
      if (!state.pinned && !drawer.classList.contains('open')) return;
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
      state.pinned = null;
      if (drawerReturn && drawer.contains(document.activeElement)) { drawerReturn.focus(); }
      drawerReturn = null;
      if (!silent) apply();
    }

    function bind() {
      $$('[data-node]', html).forEach((el) => {
        const id = el.dataset.node;
        el.addEventListener('pointerenter', () => { state.hover = id; apply(); });
        el.addEventListener('pointerleave', () => { state.hover = null; apply(); });
        el.addEventListener('click', (e) => { e.stopPropagation(); state.pinned === id ? closeDrawer() : openDrawer(id); });
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrawer(id); } });
      });
      drawer.addEventListener('click', (e) => e.stopPropagation());
      stage.addEventListener('click', (e) => { if (!e.target.closest('.eco-bar')) closeDrawer(); });
      $$('.eco-bar .tog').forEach((b) => b.addEventListener('click', () => {
        b.classList.toggle('on');
        stage.classList.toggle('hide-' + b.dataset.tog, !b.classList.contains('on'));
      }));
      $('#playShifts').addEventListener('click', play);
    }

    let raf = 0, running = false, t0 = 0;
    function frame(t) {
      if (!running) return;
      const dt = Math.min(0.05, (t - (t0 || t)) / 1000); t0 = t;
      for (const id in flowEls) {
        const fe = flowEls[id], s = fe.samples, boost = fe.boost || 1;
        for (const p of fe.parts) {
          p.phase = (p.phase + (dt * p.speed * boost) / fe.len) % 1;
          const u = p.dir > 0 ? p.phase : 1 - p.phase;
          const fi = u * 100, i = Math.floor(fi), k = fi - i;
          const a = s[i], b = s[Math.min(100, i + 1)];
          const x = a[0] + (b[0] - a[0]) * k, y = a[1] + (b[1] - a[1]) * k;
          const alpha = Math.min(1, p.phase * 6, (1 - p.phase) * 6);
          p.dot.setAttribute('cx', x); p.dot.setAttribute('cy', y); p.dot.setAttribute('opacity', alpha);
          p.halo.setAttribute('cx', x); p.halo.setAttribute('cy', y); p.halo.setAttribute('opacity', alpha * 0.3);
        }
      }
      raf = requestAnimationFrame(frame);
    }

    return {
      build,
      open: openDrawer,
      enter() { $('#eraCtl') && segPlace('#eraCtl'); if (REDUCE) { running = true; frame(performance.now()); running = false; return; } running = true; t0 = 0; raf = requestAnimationFrame(frame); },
      leave() { running = false; cancelAnimationFrame(raf); stopPlay(); },
      escape() {
        if (state.pinned) { closeDrawer(); return true; }
        if (state.shift) { stopPlay(); setShift(0); return true; }
        return false;
      },
    };
  })();

  // re-measure a segmented control once its slide is visible
  function segPlace(sel) {
    const el = $(sel); if (!el) return;
    const on = $('button.on', el), th = $('.seg-thumb', el);
    if (on && th) { th.style.left = on.offsetLeft + 'px'; th.style.width = on.offsetWidth + 'px'; }
  }

  // =================================================================== VALUE CHAIN (the car + lenses)
  const vc = (() => {
    const stage = $('#vc');
    const rig = $('#rig');
    const camG = $('#cam');
    const cvs = $('#carFx');
    const ctx = cvs.getContext('2d');
    const lead = $('#leaders');
    const calls = $('#callouts');
    const legend = $('#lensLegend');
    const where = $('#where');
    const labelBox = $('#carLabels');

    // Physical order, top to bottom, so rows and parts line up and connectors do not cross.
    const ORDER = [6, 5, 4, 3, 2, 1, 7, 8];
    const BUILD = [1, 2, 3, 4, 5, 6, 7, 8];   // silicon up to services, then the two that wrap around
    const GROUND = 682, WHEELS = [[345, 626], [725, 626]];
    const SHIELD_D = 'M180 652 C168 610 172 574 206 552 C250 530 318 518 352 512 C392 472 440 434 498 424 C556 412 628 412 680 426 C734 440 782 476 818 502 C850 514 872 530 876 558 C884 590 882 628 870 656 C864 672 848 678 826 678 L214 678 C196 678 186 668 180 652 Z';
    const FLOW_D = {
      top: 'M206 604 C208 590 216 578 238 568 C272 554 322 540 372 528 C410 498 450 472 506 458 C556 448 616 446 668 454 C716 462 768 494 804 518 C826 526 844 534 850 548 C857 570 857 604 846 630',
      low: 'M206 604 C204 622 212 636 226 642 L277 642 A70 70 0 1 1 413 642 L657 642 A70 70 0 1 1 793 642 L818 642 C832 642 842 638 846 630',
      busF: 'M493 566 C460 562 440 548 400 546 C360 544 320 545 296 552 C282 556 270 564 262 572',
      busR: 'M577 566 C610 562 632 550 670 548 C710 546 750 545 776 552 C790 556 802 564 808 572',
      cloudFin: 'M528 298 C540 342 590 378 630 420',
      finChip: 'M632 498 C612 514 580 528 556 546',
      finCloud: 'M650 406 C640 360 606 326 566 298',
      harness: 'M528 738 C528 700 542 672 544 640',
    };
    const ECUS = [[299, 560], [432, 508], [650, 508], [771, 560], [261, 586], [809, 586]];
    const SENSORS = [[208, 612], [458, 486], [510, 449], [398, 522], [826, 533], [852, 600]];

    // label left edge and centre line, connector start where the label is far from its row
    const LABEL = { 6: [440, 313], 5: [704, 384], 4: [738, 458], 3: [246, 410], 2: [592, 530], 1: [472, 618], 7: [744, 676], 8: [716, 786] };
    const ANCHOR = { 3: [826, 533], 1: [832, 586] };
    const SPOT = { 1: [535, 574], 2: [541, 512], 3: [510, 449], 4: [596, 528], 5: [645, 436], 6: [502, 250], 7: [530, 408], 8: [540, 790] };
    const CAM = { 1: [535, 545, 1.14], 2: [541, 520, 1.34], 3: [530, 520, 1.03], 4: [560, 450, 1.03], 5: [640, 450, 1.24], 6: [510, 330, 1.12], 7: [530, 520, 1], 8: [585, 690, 1.18] };
    const HOME = [530, 500, 1], C0 = [530, 500];
    const WHERE = {
      6: ['Off the car', 'In the cloud', 'The data platforms and backend services the vehicle talks to.'],
      5: ['On the roof', 'Antenna and telematics unit', 'They keep the car connected to the cellular network.'],
      4: ['At every controller', 'Over the air, then everywhere', 'A package goes from cloud to antenna, then out to each controller.'],
      3: ['Around the body', 'Cameras, radar and lidar', 'The sensors that feed driver assistance and automated driving.'],
      2: ['On the central computer', 'Software, not a box', 'OS, hypervisor and middleware, running on the computer below them.'],
      1: ['Through the floor', 'Central computer and zones', 'One central computer and zonal controllers, joined by a backbone.'],
      7: ['Around everything', 'A boundary, not a part', 'It covers every connection into and out of the vehicle.'],
      8: ['Before launch', 'On the test bench', 'HIL rigs and virtual ECUs prove the car works before it ships.'],
    };
    const INTRO = ['Read it top to bottom', 'Every layer, where it lives', 'Hover a label or a row, or take the tour. Click for the deep dive.'];
    const EXPLODED = ['Exploded view', 'The same car, pulled apart', 'Each layer lines up with its row. Features flow up, money flows down.'];
    const LINKED = { 4: [1, 5, 6], 2: [1], 5: [6], 6: [5] };

    // lens colour per layer
    const HEAT = { 3: '#dc2626', 2: '#f59e0b', 1: '#16a34a' };
    const CAPC = { once: '#6366f1', mixed: '#14b8a6', recurring: '#f43f5e', spans: '#a855f7' };
    const LENSES = {
      layers: { legend: () => '<span class="ll-t">Layers</span>One colour per layer, used for the value chain throughout. ★ marks where W1 and W2 sit.' },
      competition: {
        tint: (l) => HEAT[l.comp],
        legend: () => `<span class="ll-t">Competition</span>Colours on the car: <i style="--k:${HEAT[3]}"></i>Crowded <i style="--k:${HEAT[2]}"></i>Contested <em>Team ratings; the bars on each row show the same</em>`,
      },
      capture: {
        tint: (l) => CAPC[l.capture],
        legend: () => `<span class="ll-t">Value capture</span>Colours on the car: <i style="--k:${CAPC.once}"></i>Once per vehicle <i style="--k:${CAPC.mixed}"></i>Per vehicle + upgrades <i style="--k:${CAPC.recurring}"></i>Every month`,
      },
      pockets: {
        dim: (l) => !l.pocket.star || l.pocket.screened,
        legend: () => '<span class="ll-t">Open pockets</span><span class="ll-star">★</span>Where&nbsp;<b class="ll-b">W1</b>&nbsp;and&nbsp;<b class="ll-b">W2</b>&nbsp;sit&nbsp;·&nbsp;✕&nbsp;dropped',
      },
    };

    const parts = {}, rows = {}, labels = {}, base = {}, pulse = {}, dots = {}, slabEls = {};
    let exEls = [];
    const tint = {}, layerC = {}, lv = {}, flows = {};
    let lens = 'layers', hot = null, hotSrc = null, entered = false, exploded = false, built = false;
    let running = false, raf = 0, last = 0, time = 0;
    let camT = 0, leaveT = 0, tourT = 0, touring = false, lensTimers = [];
    let carOnly = [], exOnly = [], lastE = 0;
    let rowsLeft = 970;
    const rowY = {};

    // camera + world state
    const cam = { x: HOME[0], y: HOME[1], z: HOME[2] };
    let camTo = HOME;
    let mx = 0, my = 0, pmx = 0, pmy = 0;
    let speed = 0, speedTo = 0, roadA = 0, roadOff = 0, spin = 0;
    const ex = {}, exV = {}, exAt = {};
    let E = 0, exTarget = 0;

    // the build sequence
    let boot = null;
    let otaT0 = 0, scanT0 = -3, threatT = 6, lidarT = 0, gleamT0 = -20;
    const fx = { pool: [], rings: [], ripples: [], scan: null };
    let hexes = [], shieldP = null, dpr = 1, lastScale = 0, wheelEls = [];

    // ---------------------------------------------------------------- build
    function sample(d, n = 90) {
      const p = svgEl('path', { d }), L = p.getTotalLength(), pts = [];
      for (let i = 0; i <= n; i++) { const q = p.getPointAtLength(L * i / n); pts.push([q.x, q.y]); }
      return pts;
    }
    const at = (pts, t) => {
      const f = clamp(t, 0, 1) * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), k = f - i;
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
    };

    function buildWheels() {
      const box = $('#wheels');
      WHEELS.forEach(([cx, cy], w) => {
        let blades = '';
        for (let i = 0; i < 10; i++) blades += `<path class="blade" transform="rotate(${i * 36})" d="M0 -9 C7 -19 11 -29 9 -39"/>`;
        const g = svgEl('g', { transform: `translate(${cx} ${cy})` });
        g.innerHTML = `<g class="wheel-in" style="animation-delay:${w * 90}ms"><circle class="tire" r="56"/><circle class="tire-w" r="50"/><circle class="rim-b" r="42"/><circle class="disc" r="27"/><path class="caliper" d="M26.5 -15 A30 30 0 0 1 29.5 8"/><g class="spin">${blades}</g><circle class="blur-ring" r="27"/><circle class="hub" r="6"/></g>`;
        box.appendChild(g);
        wheelEls.push({ spin: $('.spin', g), blur: $('.blur-ring', g) });
      });
    }

    function buildSlabs() {
      const box = $('#exSlabs');
      [6, 5, 4, 3, 2, 1].forEach((id) => {
        const y = rowY[id], s = svgEl('path', { class: 'ex-slab', d: `M252 ${y - 25} L888 ${y - 25} L858 ${y + 25} L222 ${y + 25} Z` });
        s.dataset.layer = id; s.style.pointerEvents = 'none';
        box.appendChild(s); slabEls[id] = s;
      });
      box.appendChild(svgEl('path', { class: 'ex-spine', stroke: '#c7d2fe', d: `M246 ${rowY[6] - 24} V${rowY[1] + 24}` }));
      box.appendChild(svgEl('path', { class: 'ex-spine', stroke: '#4ade80', d: `M274 ${rowY[6] - 24} V${rowY[1] + 24}` }));
    }

    function build() {
      Object.entries(FLOW_D).forEach(([k, d]) => { flows[k] = sample(d); });
      shieldP = new Path2D(SHIELD_D);
      buildHexes();
      buildWheels();

      ORDER.forEach((id, k) => {
        const l = layerById(id);
        const row = document.createElement('div');
        row.dataset.layer = id; row.tabIndex = 0;
        row.style.cssText = `${cv(l.colour)};--d:${k}`;
        const capl = `<span class="capl" style="--k:${CAPC[l.capture]}">${esc(CAPTURE_LABEL[l.capture])}</span>`;
        if (l.pillar) {
          row.className = 'co pill';
          row.innerHTML = `<div><span class="pn">${esc(l.short)}</span><span class="ps">${rich(l.callStat)}</span></div><div class="rt">${pocket(l.pocket)}</div>`;
        } else {
          row.className = 'co';
          row.innerHTML = `<div class="l1"><div class="chips">${l.callLogos.map((s) => chip(s)).join('')}</div><div class="r1">${pocket(l.pocket)}</div></div>
            <div class="l2"><div class="st">${rich(l.callStat)}</div><div class="r2">${meter(l.comp)}${capl}</div></div>`;
        }
        calls.appendChild(row);
        rows[id] = row;

        const m = P[l.colour].m;
        const b = svgEl('path', { class: 'base', stroke: m, pathLength: 1 });
        const q = svgEl('path', { class: 'pulse', stroke: '#fff', pathLength: 1 });
        const c = svgEl('circle', { r: 3.5, fill: m });
        q.style.setProperty('--ld', `${-k * .4}s`);
        lead.append(b, q, c);
        base[id] = b; pulse[id] = q; dots[id] = c;

        const lab = document.createElement('div');
        lab.className = 'cp'; lab.dataset.layer = id;
        lab.innerHTML = `<b>${l.num}</b>${esc(l.short)}<em></em>`;
        labelBox.appendChild(lab);
        labels[id] = lab;

        parts[id] = $(`#carSvg .part[data-layer="${id}"]`);
        const halos = $$('.halo', parts[id]);
        if (halos.length) {
          const g = svgEl('radialGradient', { id: `halo${id}` });
          g.innerHTML = '<stop offset="0" style="stop-color:var(--c)" stop-opacity=".9"/><stop offset=".45" style="stop-color:var(--c)" stop-opacity=".3"/><stop offset="1" style="stop-color:var(--c)" stop-opacity="0"/>';
          parts[id].prepend(g);
          halos.forEach((c) => c.setAttribute('fill', `url(#halo${id})`));
        }
        layerC[id] = m;
        setTint(id, null);
        lv[id] = 1; ex[id] = 0; exV[id] = 0; exAt[id] = 0;
      });

      exEls = $$('#carSvg .ex').map((el) => ({
        el, id: +el.closest('.part').dataset.layer,
        ax: +el.dataset.ax, ay: +el.dataset.ay,
        tx: el.dataset.tx ? +el.dataset.tx : +el.dataset.ax,
        es: el.dataset.es ? +el.dataset.es : 1,
      }));
      carOnly = $$('#carSvg .car-only');
      exOnly = $$('#carSvg .ex-only');
      exOnly.forEach((el) => { el.style.display = 'none'; el.style.opacity = 0; });

      ORDER.forEach((id) => {
        [parts[id], labels[id], rows[id]].forEach((el) => {
          const src = el === rows[id] ? 'row' : 'part';
          el.addEventListener('pointerenter', () => { clearTimeout(leaveT); if (boot) return; stopTour(); setHot(id, src); });
          el.addEventListener('pointerleave', () => { clearTimeout(leaveT); leaveT = setTimeout(() => { if (!touring) setHot(null); }, 90); });
          el.addEventListener('click', (e) => { if (e.target.closest('.cite a')) return; e.stopPropagation(); stopTour(); dive.open(id); });
          el.addEventListener('keydown', (e) => { if (e.key === 'Enter') dive.open(id); });
          el.addEventListener('focusin', () => { if (!boot && el.matches(':focus-visible')) setHot(id, 'row'); });
          el.addEventListener('focusout', () => { if (!touring) setHot(null); });
        });
      });

      stage.addEventListener('pointermove', (e) => {
        const p = toStage(stage, e.clientX, e.clientY);
        pmx = p.x / STAGE_W - 0.5; pmy = p.y / STAGE_H - 0.5;
      });
      stage.addEventListener('pointerleave', () => { pmx = 0; pmy = 0; });
      // a click on the car while it builds skips to the finished state
      stage.addEventListener('pointerdown', () => { if (boot && boot.t > .4) finishBoot(); });

      segCtl($('#lensCtl'), (b) => setLens(b.dataset.lens));
      $('#tExplode').addEventListener('click', (e) => { if (boot) finishBoot(); setExploded(!exploded); e.currentTarget.classList.toggle('on', exploded); });
      $('#tTour').addEventListener('click', () => { if (boot) finishBoot(); touring ? (stopTour(), setHot(null)) : startTour(); });
      $('#tReplay').addEventListener('click', () => { stopTour(); setHot(null); if (exploded) { exploded = false; exTarget = 0; $('#tExplode').classList.remove('on'); stage.classList.remove('exploded'); ORDER.forEach((id) => { ex[id] = 0; exV[id] = 0; }); } startBoot(); });
      setLens('layers');
      setWhere(null);
      built = true;
    }

    // ---------------------------------------------------------------- tints, lenses, focus
    function setTint(id, c) {
      const l = layerById(id), m = c || P[l.colour].m, cl = c || P[l.colour].l;
      [parts[id], labels[id], slabEls[id]].forEach((el) => { if (el) { el.style.setProperty('--c', m); el.style.setProperty('--cl', cl); } });
      base[id].setAttribute('stroke', m); dots[id].setAttribute('fill', m);
      tint[id] = m;
    }

    function setLens(name) {
      lens = name;
      const L = LENSES[name];
      stage.dataset.lens = name;
      lensTimers.forEach(clearTimeout); lensTimers = [];
      if (built && !REDUCE && !boot) fx.scan = { t0: time, dur: .85, soft: true };
      ORDER.forEach((id) => {
        const l = layerById(id), dim = !!(L.dim && L.dim(l));
        // the new colour lands as the sweep passes this part
        const delay = REDUCE || !built || boot ? 0 : clamp((SPOT[id][0] - 180) / 700, 0, 1) * 850;
        const apply = () => setTint(id, L.tint ? L.tint(l) : null);
        if (delay) lensTimers.push(setTimeout(apply, delay)); else apply();
        parts[id].classList.toggle('dim', dim);
        labels[id].classList.toggle('dim', dim && !l.pocket.screened);
        rows[id].classList.toggle('dim', dim);
        base[id].classList.toggle('dim', dim); pulse[id].classList.toggle('dim', dim); dots[id].classList.toggle('dim', dim);
        // v15: the W1 and W2 stars show in every lens; "out" marks only in the Open pockets lens
        const em = $('em', labels[id]), t = l.pocket.target ? (l.pocket.target === 'lead' ? '★ W1' : '★ W2') : name === 'pockets' && l.pocket.screened ? '✕ OUT' : '';
        em.textContent = t; em.classList.toggle('on', !!t); em.classList.toggle('scr', !!l.pocket.screened && name === 'pockets');
      });
      legend.classList.remove('in'); void legend.offsetWidth;
      legend.innerHTML = L.legend();
      legend.classList.add('in');
      // v15: a lens change also pulls the eye to the rows on the right, where the reading is
      if (built && !boot) { calls.classList.remove('lens-in'); void calls.offsetWidth; calls.classList.add('lens-in'); }
    }

    function setWhere(id) {
      const w = id ? WHERE[id] : exploded ? EXPLODED : INTRO;
      where.classList.toggle('on', !!id);
      if (id) { where.style.setProperty('--c', tint[id]); where.style.setProperty('--cl', P[layerById(id).colour].l); }
      else { where.style.removeProperty('--c'); where.style.removeProperty('--cl'); }
      where.innerHTML = `<small>${esc(w[0])}</small><strong>${esc(w[1])}</strong><span>${esc(w[2])}</span>`;
    }

    function setHot(id, src) {
      if (hot === id) return;
      hot = id; hotSrc = src;
      stage.classList.toggle('focusing', !!id);
      stage.classList.toggle('hot-8', id === 8);
      const lensDim = (n) => { const L = LENSES[lens]; return !!(L.dim && L.dim(layerById(n))); };
      ORDER.forEach((n) => {
        const on = n === id, link = !!id && (LINKED[id] || []).includes(n);
        [parts[n], labels[n], rows[n], base[n], pulse[n]].forEach((e) => e.classList.toggle('hot', on));
        if (slabEls[n]) slabEls[n].classList.toggle('hot', on);
        parts[n].classList.toggle('linked', link); labels[n].classList.toggle('linked', link);
        const d = id ? !on : lensDim(n);
        rows[n].classList.toggle('dim', d); base[n].classList.toggle('dim', d); pulse[n].classList.toggle('dim', d); dots[n].classList.toggle('dim', d);
      });
      setWhere(id);
      clearTimeout(camT);
      // a part under the pointer must not fly away from it, so only rows and the tour move the camera
      if (id && src !== 'part' && !exploded) camT = setTimeout(() => { camTo = CAM[id]; }, touring ? 0 : 170);
      else camTo = HOME;
      if (id === 4) otaT0 = time;
      if (id === 8) scanT0 = time;
      if (id === 7) threatT = time;
    }

    function setExploded(on) {
      exploded = on; exTarget = on ? 1 : 0;
      stage.classList.toggle('exploded', on);
      camTo = HOME; clearTimeout(camT);
      const seq = on ? ORDER : [...ORDER].reverse();
      seq.forEach((id, i) => { exAt[id] = time + (REDUCE ? 0 : i * .06); });
      setWhere(hot);
    }

    // ---------------------------------------------------------------- tour
    function startTour() {
      if (exploded) { setExploded(false); $('#tExplode').classList.remove('on'); }
      touring = true;
      const btn = $('#tTour'); btn.classList.add('on'); $('span', btn).textContent = 'Stop';
      let i = 0;
      const step = () => {
        if (i >= BUILD.length) { stopTour(); setHot(null); return; }
        const id = BUILD[i++]; setHot(id, 'tour');
        tourT = setTimeout(step, id === 4 ? 6200 : 3600);
      };
      step();
    }
    function stopTour() {
      if (!touring) return;
      touring = false; clearTimeout(tourT);
      const btn = $('#tTour'); btn.classList.remove('on'); $('span', btn).textContent = 'Tour the car';
    }

    // ---------------------------------------------------------------- the build sequence
    const LAYER_AT = { 1: 2.25, 2: 2.8, 3: 3.3, 4: 3.8, 5: 4.3, 6: 4.8, 7: 5.3, 8: 5.9 };
    function setBootVisual(on) {
      stage.classList.toggle('booting', on);
      ['shell-on', 'wheels-on', 'lights-on', 'bench-on'].forEach((c) => stage.classList.toggle(c, !on));
      ORDER.forEach((id) => {
        [parts[id], labels[id], rows[id], base[id], pulse[id]].forEach((e) => e.classList.toggle('off', on));
        parts[id].classList.remove('drawing');
        dots[id].style.opacity = on ? 0 : '';
      });
      where.classList.toggle('off', on);
      if (on) { $('#ln1').style.strokeDashoffset = 1; $('#ln2').style.strokeDashoffset = 1; }
      else { $('#ln1').style.strokeDashoffset = 0; $('#ln2').style.strokeDashoffset = 0; }
    }
    function revealLayer(id) {
      parts[id].classList.remove('off');
      labels[id].classList.remove('off');
      if (id === 7) { parts[7].classList.add('drawing'); setTimeout(() => parts[7].classList.remove('drawing'), 1100); }
      if (id === 8) stage.classList.add('bench-on');
      base[id].classList.remove('off'); dots[id].style.opacity = '';
      setTimeout(() => {
        if (!boot && !rows[id].classList.contains('off')) return;
        rows[id].classList.remove('off'); pulse[id].classList.remove('off');
        rows[id].classList.remove('flash'); void rows[id].offsetWidth; rows[id].classList.add('flash');
      }, 240);
      if (REDUCE) return;
      const c = tint[id], [x, y] = SPOT[id];
      fx.rings.push({ x, y, t0: time, dur: .9, r0: 8, r1: id === 1 ? 300 : 90, c, w: id === 1 ? 3 : 2 });
      if (id === 1) burst(x, y, c, 46, 240);
      if (id === 3) SENSORS.forEach(([sx, sy]) => fx.rings.push({ x: sx, y: sy, t0: time, dur: .7, r0: 3, r1: 42, c, w: 1.6 }));
      if (id === 6) for (let i = 0; i < 70; i++) { const q = at(flows.finCloud, Math.random()); fx.pool.push({ kind: 'seek', sx: q[0] + (Math.random() - .5) * 40, sy: q[1], ex: 410 + Math.random() * 190, ey: 212 + Math.random() * 82, t0: time + Math.random() * .25, dur: .55 + Math.random() * .3, c, r: 5 }); }
      if (id === 7) fx.ripples.push({ x: 530, y: 560, t0: time, dur: 1.2, c, big: true });
      if (id === 8) { scanT0 = time; }
    }
    function startBoot() {
      if (REDUCE) { setBootVisual(false); return; }
      boot = { t: 0, done: {} };
      fx.pool.length = 0; fx.rings.length = 0; fx.ripples.length = 0;
      speed = 0; speedTo = 0; roadA = 0; spin = 0;
      setBootVisual(true);
    }
    function stepBoot(dt) {
      boot.t += dt;
      const t = boot.t, d = boot.done;
      const once = (k, when, fn) => { if (!d[k] && t >= when) { d[k] = 1; fn(); } };
      roadA = Math.max(roadA, clamp(t / 1.2, 0, 1) * .55);
      // two laser pens leave the nose together, one over the roof and one along the sills
      const pen = clamp((t - .25) / 1.3, 0, 1), e = 1 - Math.pow(1 - pen, 2.2);
      $('#ln1').style.strokeDashoffset = (1 - e).toFixed(4);
      $('#ln2').style.strokeDashoffset = (1 - e).toFixed(4);
      if (pen > 0 && pen < 1) {
        [flows.top, flows.low].forEach((f) => {
          const q = at(f, e);
          drawSprite('#dbeafe', q[0], q[1], 34, 1);
          if (Math.random() < .9) fx.pool.push({ kind: 'spark', x: q[0], y: q[1], vx: (Math.random() - .5) * 120, vy: (Math.random() - .3) * 110, t0: time, dur: .4 + Math.random() * .45, c: '#a5b4fc', r: 7 });
        });
      }
      once('shell', 1.45, () => stage.classList.add('shell-on'));
      once('wheels', 1.72, () => stage.classList.add('wheels-on'));
      once('lights', 2.02, () => {
        stage.classList.add('lights-on');
        fx.rings.push({ x: 256, y: 568, t0: time, dur: .5, r0: 4, r1: 70, c: '#eaf2ff', w: 2 });
        fx.rings.push({ x: 828, y: 534, t0: time, dur: .5, r0: 4, r1: 46, c: '#fb7185', w: 2 });
      });
      BUILD.forEach((id) => once('L' + id, LAYER_AT[id], () => revealLayer(id)));
      once('where', 6.3, () => where.classList.remove('off'));
      once('go', 6.45, () => { speedTo = 1; gleamT0 = time; });
      once('end', 6.8, () => { boot = null; roadA = 1; stage.classList.remove('booting'); });
    }
    function finishBoot() {
      if (!boot) return;
      boot = null;
      setBootVisual(false);
      ORDER.forEach((id) => rows[id].classList.remove('flash'));
      fx.pool.length = 0; fx.rings.length = 0;
      speedTo = 1; roadA = 1;
    }

    // ---------------------------------------------------------------- canvas helpers
    const sprites = {};
    function sprite(c) {
      if (sprites[c]) return sprites[c];
      const s = document.createElement('canvas'); s.width = s.height = 64;
      const g = s.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      r.addColorStop(0, '#fff'); r.addColorStop(.16, c); r.addColorStop(.44, c + '55'); r.addColorStop(1, c + '00');
      g.fillStyle = r; g.fillRect(0, 0, 64, 64);
      return (sprites[c] = s);
    }
    function drawSprite(c, x, y, r, a) { ctx.globalAlpha = a; ctx.drawImage(sprite(c), x - r, y - r, r * 2, r * 2); }
    function burst(x, y, c, n, v) {
      for (let i = 0; i < n; i++) { const th = Math.random() * 6.283, s = v * (.3 + Math.random()); fx.pool.push({ kind: 'spark', x, y, vx: Math.cos(th) * s, vy: Math.sin(th) * s * .7, t0: time, dur: .5 + Math.random() * .6, c, r: 8 }); }
    }
    function buildHexes() {
      const R = 11, w = R * 1.732, h = R * 1.5, probe = document.createElement('canvas').getContext('2d');
      for (let y = 396, j = 0; y < 686; y += h, j++) for (let x = 170 + (j % 2 ? w / 2 : 0); x < 890; x += w) if (probe.isPointInPath(shieldP, x, y)) hexes.push([x, y]);
      hexes.R = R;
    }
    const posOf = (id) => { const e = ex[id] || 0, [x, y] = SPOT[id]; return [x, y + (rowY[id] - y) * e]; };

    function resizeFx() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cvs.width = Math.round(STAGE_W * scale * dpr);
      cvs.height = Math.round(STAGE_H * scale * dpr);
      lastScale = scale;
    }

    // ---------------------------------------------------------------- the frame
    function stepCamera(dt) {
      const k = 1 - Math.pow(.0016, dt);
      cam.x += (camTo[0] - cam.x) * k; cam.y += (camTo[1] - cam.y) * k; cam.z += (camTo[2] - cam.z) * k;
      const m = 1 - Math.pow(.02, dt);
      mx += (pmx - mx) * m; my += (pmy - my) * m;
    }
    const toScreen = (x, y) => [C0[0] + (x - cam.x) * cam.z - mx * 10, C0[1] + (y - cam.y) * cam.z - my * 7];

    function stepExplode(dt) {
      let sum = 0;
      ORDER.forEach((id) => {
        const target = time >= exAt[id] ? exTarget : 1 - exTarget;
        if (REDUCE) ex[id] = exTarget;
        else for (let left = dt; left > 0; left -= 1 / 240) { const h = Math.min(left, 1 / 240), f = (target - ex[id]) * 92 - exV[id] * 13.5; exV[id] += f * h; ex[id] += exV[id] * h; }
        sum += clamp(ex[id], 0, 1);
      });
      E = sum / ORDER.length;
    }

    function applyTransforms(dt) {
      const [sx, sy] = toScreen(0, 0);
      camG.setAttribute('transform', `matrix(${cam.z.toFixed(4)} 0 0 ${cam.z.toFixed(4)} ${sx.toFixed(2)} ${sy.toFixed(2)})`);

      exEls.forEach((p) => {
        const e = ex[p.id], ty = rowY[p.id], s = 1 + (p.es - 1) * e;
        const x = p.ax + (p.tx - p.ax) * e, y = p.ay + (ty - p.ay) * e;
        p.el.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${s.toFixed(3)}) translate(${-p.ax} ${-p.ay})`);
      });

      if (Math.abs(E - lastE) > .002) {
        const a = clamp(1 - E * 1.5, 0, 1).toFixed(3), b = clamp(E * 1.6 - .25, 0, 1).toFixed(3);
        carOnly.forEach((el) => { el.style.opacity = E > .002 ? a : ''; });
        exOnly.forEach((el) => { el.style.opacity = b; el.style.display = +b > 0 ? '' : 'none'; });
        $('#shell').style.opacity = hot ? '' : (E > .01 ? clamp(1 - E * .94, .05, 1).toFixed(3) : '');
        lastE = E;
      }
      // suspension: the car breathes while it drives
      const bob = speed * (1 - E) * Math.sin(time * 5.2) * .7;
      $('#carRoot').setAttribute('transform', `translate(0 ${bob.toFixed(2)})`);
      const depth = (1 - E);
      parts[6].setAttribute('transform', `translate(${(mx * -12 * depth).toFixed(2)} ${(my * -7 * depth).toFixed(2)})`);
      parts[8].setAttribute('transform', `translate(${(mx * 7 * depth).toFixed(2)} ${(my * 4 * depth).toFixed(2)})`);

      spin -= speed * dt * 300;
      const blur = clamp(speed * .32, 0, .32);
      wheelEls.forEach((w) => { w.spin.setAttribute('transform', `rotate(${spin.toFixed(1)})`); w.blur.style.opacity = (blur * .55).toFixed(3); });

      const g = (time - gleamT0) / 1.5;
      if (g >= 0 && g <= 1) $('#gleam').setAttribute('x', (200 + g * 1000).toFixed(1));
      if (time - gleamT0 > 11 && !boot) gleamT0 = time;

      ORDER.forEach((id) => {
        const e = clamp(ex[id], -.1, 1.1), w = labels[id].offsetWidth;
        const [lx, ly] = LABEL[id];
        const tx = 878 - w, ty = id === 7 ? rowY[7] : id === 8 ? rowY[8] : rowY[id];
        const [px, py] = toScreen(lx + (tx - lx) * e, ly + (ty - ly) * e);
        labels[id].style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px)`;
      });
    }

    function drawLeaders() {
      ORDER.forEach((id) => {
        const e = clamp(ex[id], 0, 1), ry = rowY[id], rx = rowsLeft - (hot === id ? 8 : 0);
        const lab = labels[id], w = lab.offsetWidth, [lx, ly] = LABEL[id];
        const tx = 878, ty = rowY[id];
        const a0 = ANCHOR[id] || [lx + w, ly];
        const [ax, ay] = toScreen(a0[0] + (tx - a0[0]) * e, a0[1] + (ty - a0[1]) * e);
        const k = Math.max(16, (rx - ax) * .55);
        const d = `M${ax.toFixed(1)},${ay.toFixed(1)} C${(ax + k).toFixed(1)},${ay.toFixed(1)} ${(rx - k).toFixed(1)},${ry} ${rx},${ry}`;
        base[id].setAttribute('d', d); pulse[id].setAttribute('d', d);
        dots[id].setAttribute('cx', ax.toFixed(1)); dots[id].setAttribute('cy', ay.toFixed(1));
      });
    }

    // ---------------------------------------------------------------- everything that moves fast
    function drawRoad(dt) {
      roadOff += speed * dt * 320;
      const a = roadA * (1 - E);
      if (a < .01) return;
      ctx.globalCompositeOperation = 'lighter';
      // perspective floor lines slide under the car
      ctx.lineWidth = 1;
      const grad = ctx.createLinearGradient(0, GROUND, 0, 734);
      grad.addColorStop(0, `rgba(147,167,220,${.22 * a})`); grad.addColorStop(1, 'rgba(147,167,220,0)');
      ctx.strokeStyle = grad; ctx.globalAlpha = 1;
      ctx.beginPath();
      const span = 64, o = roadOff % span;
      for (let i = -14; i < 15; i++) { const x = 530 + i * span + o; ctx.moveTo(x, GROUND + 1); ctx.lineTo(530 + (x - 530) * 1.9, 734); }
      ctx.stroke();
      // ground line
      const gl = ctx.createLinearGradient(170, 0, 900, 0);
      gl.addColorStop(0, 'rgba(165,180,252,0)'); gl.addColorStop(.2, `rgba(165,180,252,${.5 * a})`); gl.addColorStop(.8, `rgba(165,180,252,${.5 * a})`); gl.addColorStop(1, 'rgba(165,180,252,0)');
      ctx.fillStyle = gl; ctx.fillRect(170, GROUND, 730, 1.4);
      // lane dashes, nearer is faster
      [[700, 2, .3, 54, 46, .75], [716, 3.4, .42, 86, 74, 1.25]].forEach(([y, h, al, len, gap, par]) => {
        ctx.fillStyle = `rgba(199,210,254,${al * a * (.35 + speed * .65)})`;
        const per = len + gap, off = (roadOff * par) % per;
        for (let x = 130 - per + off; x < 930; x += per) ctx.fillRect(x, y, len, h);
      });
      // speed streaks low behind the car
      if (speed > .05) {
        for (let i = 0; i < 12; i++) {
          const y = 648 + ((i * 37) % 34), v = .7 + ((i * 13) % 7) / 6, len = 40 + ((i * 53) % 110);
          const x = 150 + ((roadOff * v * 1.7 + i * 173) % 800);
          const g = ctx.createLinearGradient(x, 0, x - len, 0);
          g.addColorStop(0, `rgba(199,210,254,${.2 * a * speed})`); g.addColorStop(1, 'rgba(199,210,254,0)');
          ctx.fillStyle = g; ctx.fillRect(x - len, y, len, 1.3);
        }
      }
    }

    function trail(pts, t, c, a, n = 6, r = 9) {
      for (let i = 0; i < n; i++) { const q = at(pts, t - i * .018); drawSprite(c, q[0], q[1], r * (1 - i / (n + 1)), a * (1 - i / n)); }
    }
    function fxLevel(id) {
      const target = hot ? (hot === id ? 1.7 : (LINKED[hot] || []).includes(id) ? .55 : .06) : 1;
      lv[id] += (target - lv[id]) * .1;
      const l = LENSES[lens]; const dim = l.dim && l.dim(layerById(id)) ? .2 : 1;
      return lv[id] * dim * (1 - E) * (parts[id].classList.contains('off') ? 0 : 1);
    }

    function drawFlows(dt) {
      ctx.globalCompositeOperation = 'lighter';
      // 01: traffic on the backbone, both directions
      let a = fxLevel(1);
      if (a > .02) {
        const c = tint[1];
        for (let i = 0; i < 3; i++) {
          const p = (time * .42 + i / 3) % 1, b = (time * .34 + i / 3 + .2) % 1;
          trail(flows.busF, p, c, a * .95); trail(flows.busR, p, c, a * .95);
          drawSprite('#ffffff', ...at(flows.busF, 1 - b), 7, a * .5); drawSprite('#ffffff', ...at(flows.busR, 1 - b), 7, a * .5);
        }
        drawSprite(c, 535, 574, 68 + Math.sin(time * 3) * 7, a * .22);
      }
      // 02: the plates tick over
      a = fxLevel(2);
      if (a > .02) for (let i = 0; i < 3; i++) { const y = 532 - i * 14, p = (time * .5 + i * .28) % 1; drawSprite(tint[2], 513 + p * 54, y, 7, a * .9 * Math.sin(p * 3.14)); }
      // 03: lidar rings on the road, radar arcs off both bumpers, a sweep on the puck
      a = fxLevel(3);
      if (a > .02) {
        const c = tint[3];
        ctx.strokeStyle = c;
        for (let i = 0; i < 3; i++) {
          const p = ((time / 3.2) + i / 3) % 1;
          ctx.globalAlpha = a * (1 - p) * .55; ctx.lineWidth = 1.3;
          ctx.beginPath(); ctx.ellipse(510, GROUND + 2, 60 + p * 390, 6 + p * 40, 0, 0, 6.283); ctx.stroke();
        }
        [[208, 612, Math.PI], [852, 600, 0]].forEach(([x, y, th]) => {
          for (let i = 0; i < 3; i++) {
            const p = ((time / 1.7) + i / 3) % 1, r = 8 + p * (th ? 56 : 40);
            ctx.globalAlpha = a * (1 - p) * .9; ctx.lineWidth = 1.7;
            ctx.beginPath(); ctx.arc(x, y, r, th - .5, th + .5); ctx.stroke();
          }
        });
        const sw = time * 2.6;
        drawSprite(c, 510 + Math.cos(sw) * 17, 448 + Math.sin(sw) * 3.5, 8, a);
        // the lidar reads back a point cloud along the road
        for (let i = 0; i < 26; i++) {
          const q = (i * 97.13 + Math.floor(time * 2.2 + i * .13) * 41.7) % 1, side = i % 2 ? 1 : -1, xx = 510 + side * (340 + ((i * 53) % 90) * (q + .2));
          if (xx > 178 && xx < 900) drawSprite(c, xx, GROUND + 6 + ((i * 11) % 28), 2.6, a * .65);
        }
      }
      // 04: one package, cloud to antenna to computer to every controller
      a = fxLevel(4);
      if (a > .02) {
        const c = tint[4], p = ((time - otaT0) % 6) / 6;
        const pkg = (x, y, s = 6) => { drawSprite(c, x, y, s * 3.4, a); ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = Math.min(1, a); ctx.fillStyle = '#fff'; ctx.fillRect(x - s * .7, y - s * .7, s * 1.4, s * 1.4); ctx.fillStyle = c; ctx.fillRect(x - s * .45, y - s * .45, s * .9, s * .9); ctx.restore(); };
        if (p < .22) pkg(...at(flows.cloudFin, p / .22));
        else if (p >= .24 && p < .36) pkg(...at(flows.finChip, (p - .24) / .12));
        else if (p >= .37 && p < .5) { const t = (p - .37) / .13; pkg(...at(flows.busF, t), 5); pkg(...at(flows.busR, t), 5); }
        if (p >= .5 && p < .68) {
          const t = (p - .5) / .18;
          ctx.strokeStyle = c; ctx.lineWidth = 2;
          ECUS.forEach(([x, y]) => { ctx.globalAlpha = a * (1 - t); ctx.beginPath(); ctx.arc(x, y, 8 + t * 22, 0, 6.283); ctx.stroke(); drawSprite(c, x, y, 18, a * (1 - t) * .9); });
        }
      }
      // 05 + 06: telemetry leaves through the roof for the cloud
      a = Math.max(fxLevel(5), fxLevel(6));
      if (a > .02) for (let i = 0; i < 4; i++) trail(flows.finCloud, (time * .3 + i / 4) % 1, tint[6], a * .9, 5, 7);
      // 08: bench signals up the harness
      a = fxLevel(8);
      if (a > .02) for (let i = 0; i < 2; i++) trail(flows.harness, (time * .5 + i / 2) % 1, tint[8], a, 4, 7);

      // 08: a scan passes through the car, and everything it touches answers
      const s = time - scanT0;
      const scanEvery = hot === 8 ? 3 : 8.5;
      if (!boot && s > scanEvery) scanT0 = time;
      if (s >= 0 && s < 2 && !(parts[8].classList.contains('off'))) {
        const t = s / 2, x = 180 + t * 710, al = fxLevel(8) ? Math.min(1, lv[8] + .35) * (1 - E) : 0;
        if (al > .02) {
          ctx.save(); ctx.clip(shieldP);
          const g = ctx.createLinearGradient(x - 90, 0, x + 6, 0), c = tint[8];
          g.addColorStop(0, c + '00'); g.addColorStop(.85, c + '38'); g.addColorStop(1, '#ffffffb0');
          ctx.fillStyle = g; ctx.globalAlpha = al; ctx.fillRect(x - 90, 395, 96, 290);
          ctx.restore();
          [...SENSORS, ...ECUS].forEach(([px, py]) => { const d = Math.abs(px - x); if (d < 46) drawSprite(c, px, py, 20, al * (1 - d / 46)); });
        }
      }
      // lens sweep: a clean band carries the new colour across the car
      if (fx.scan) {
        const t = (time - fx.scan.t0) / fx.scan.dur;
        if (t >= 1) fx.scan = null;
        else {
          const x = 180 + t * 720;
          const g = ctx.createLinearGradient(x - 70, 0, x + 70, 0);
          g.addColorStop(0, '#ffffff00'); g.addColorStop(.5, '#ffffff55'); g.addColorStop(1, '#ffffff00');
          ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(x - 70, 180, 140, 680);
        }
      }
    }

    function drawHexRipples() {
      if (parts[7].classList.contains('off') && !fx.ripples.length) return;
      const a7 = fxLevel(7);
      // attacks arrive from outside, and the boundary lights up where they land
      if (!boot && !parts[7].classList.contains('off') && E < .3 && a7 > .02 && time > threatT) {
        const th = 3.6 + Math.random() * 2.3, tx = 530 + Math.cos(th) * 300, ty = 560 + Math.sin(th) * 150;
        fx.pool.push({ kind: 'threat', sx: tx + Math.cos(th) * 170, sy: ty + Math.sin(th) * 110, ex: tx, ey: ty, t0: time, dur: .5, c: '#fb7185', r: 9 });
        threatT = time + (hot === 7 ? .55 : 4 + Math.random() * 3);
      }
      fx.ripples = fx.ripples.filter((r) => time - r.t0 < r.dur);
      if (!fx.ripples.length) return;
      ctx.globalCompositeOperation = 'lighter';
      const R = hexes.R;
      fx.ripples.forEach((r) => {
        const t = (time - r.t0) / r.dur, rad = t * (r.big ? 520 : 170), band = r.big ? 54 : 30;
        ctx.strokeStyle = r.c; ctx.lineWidth = 1.1; ctx.globalAlpha = (1 - t) * .85;
        ctx.beginPath();
        hexes.forEach(([x, y]) => {
          const d = Math.hypot(x - r.x, (y - r.y) * 1.2);
          if (Math.abs(d - rad) > band) return;
          for (let k = 0; k < 6; k++) { const an = .5236 + k * 1.0472, hx = x + Math.cos(an) * R, hy = y + Math.sin(an) * R; k ? ctx.lineTo(hx, hy) : ctx.moveTo(hx, hy); }
          ctx.closePath();
        });
        ctx.stroke();
      });
    }

    function drawPool(dt) {
      ctx.globalCompositeOperation = 'lighter';
      fx.rings = fx.rings.filter((r) => time - r.t0 < r.dur);
      fx.rings.forEach((r) => {
        const t = (time - r.t0) / r.dur, e = 1 - Math.pow(1 - t, 3);
        ctx.strokeStyle = r.c; ctx.lineWidth = r.w * (1 - t) + .4; ctx.globalAlpha = 1 - t;
        ctx.beginPath(); ctx.arc(r.x, r.y, r.r0 + (r.r1 - r.r0) * e, 0, 6.283); ctx.stroke();
      });
      if (fx.pool.length > 500) fx.pool.splice(0, fx.pool.length - 500);
      fx.pool = fx.pool.filter((p) => {
        const t = (time - p.t0) / p.dur;
        if (t >= 1) {
          if (p.kind === 'threat') { fx.ripples.push({ x: p.ex, y: p.ey, t0: time, dur: .7, c: tint[7] }); fx.rings.push({ x: p.ex, y: p.ey, t0: time, dur: .4, r0: 3, r1: 26, c: '#ffffff', w: 2 }); }
          return false;
        }
        if (t < 0) return true;
        if (p.kind === 'spark') { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 90 * dt; drawSprite(p.c, p.x, p.y, p.r * (1 - t * .6), (1 - t) * .95); }
        else if (p.kind === 'seek') { const e = t * t * (3 - 2 * t); drawSprite(p.c, p.sx + (p.ex - p.sx) * e, p.sy + (p.ey - p.sy) * e, p.r, Math.sin(t * 3.14)); }
        else if (p.kind === 'threat') { const x = p.sx + (p.ex - p.sx) * t, y = p.sy + (p.ey - p.sy) * t; drawSprite(p.c, x, y, p.r, .4 + t * .6); }
        else if (p.kind === 'coin') {
          ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = Math.sin(t * 3.14) * p.a; ctx.fillStyle = '#86efac'; ctx.font = '800 17px var(--display), sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('$', p.x + Math.sin(t * 6 + p.ph) * 5, p.y - t * 62); ctx.restore();
        }
        return true;
      });
    }

    // the lenses change what moves, not only the colour
    let coinAt = {}, pingAt = 0;
    const COIN_EVERY = { recurring: .55, mixed: 1.9, once: 5.2, spans: 3 };
    const SWARM = { 3: 13, 2: 6, 1: 2 };
    function drawLensFx() {
      if (lens === 'competition') {
        ctx.globalCompositeOperation = 'lighter';
        ORDER.forEach((id) => {
          const l = layerById(id), [x, y] = posOf(id), n = SWARM[l.comp] || 0, R = id === 6 ? 96 : id === 7 ? 54 : 46;
          const f = hot && hot !== id ? .15 : 1;
          for (let i = 0; i < n; i++) {
            const a = time * (.5 + (i % 5) * .13) * (i % 2 ? 1 : -1) + i * 2.4, r = R * (.75 + ((i * 37) % 10) / 22);
            drawSprite(tint[id], x + Math.cos(a) * r, y + Math.sin(a) * r * .55, 5.5, .85 * f);
          }
        });
      } else if (lens === 'capture') {
        ORDER.forEach((id) => {
          const l = layerById(id);
          if (!coinAt[id] || time > coinAt[id]) {
            const [x, y] = posOf(id);
            fx.pool.push({ kind: 'coin', x: x + (Math.random() - .5) * 26, y: y - 8, t0: time, dur: 1.5, ph: Math.random() * 6, a: hot && hot !== id ? .2 : 1 });
            coinAt[id] = time + COIN_EVERY[l.capture] * (.85 + Math.random() * .3);
          }
        });
      } else if (lens === 'pockets' && time > pingAt) {
        ORDER.forEach((id) => { const l = layerById(id); if (l.pocket.target) { const [x, y] = posOf(id); fx.rings.push({ x, y, t0: time, dur: 1.5, r0: 10, r1: 92, c: '#fcd34d', w: 2.4 }); } });
        pingAt = time + 1.9;
      }
    }

    function drawSpine() {
      if (E < .35) return;
      ctx.globalCompositeOperation = 'lighter';
      const top = rowY[6] - 24, bot = rowY[1] + 24, a = clamp((E - .35) / .5, 0, 1);
      for (let i = 0; i < 5; i++) {
        const p = (time * .16 + i / 5) % 1;
        drawSprite('#c7d2fe', 246, bot - (bot - top) * p, 7, a * Math.sin(p * 3.14));
        const q = (time * .13 + i / 5) % 1;
        ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = a * Math.sin(q * 3.14); ctx.fillStyle = '#86efac'; ctx.font = '800 14px var(--display), sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('$', 274, top + (bot - top) * q + 5); ctx.restore();
      }
    }

    function drawFx(dt) {
      if (scale !== lastScale) resizeFx();
      const k = scale * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      const [sx, sy] = toScreen(0, 0);
      ctx.setTransform(k * cam.z, 0, 0, k * cam.z, k * sx, k * sy);
      drawRoad(dt);
      if (boot) stepBoot(dt);
      drawFlows(dt);
      drawHexRipples();
      drawLensFx();
      drawSpine();
      drawPool(dt);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }

    function measureRows() {
      rowsLeft = calls.offsetLeft;
      ORDER.forEach((id) => { rowY[id] = calls.offsetTop + rows[id].offsetTop + rows[id].offsetHeight / 2; });
    }

    function frame(now) {
      if (!running) return;
      const dt = last ? Math.min(.12, (now - last) / 1000) : .016;
      last = now; time += dt;
      speed += (speedTarget() - speed) * (1 - Math.pow(.25, dt));
      stepCamera(dt);
      stepExplode(dt);
      applyTransforms(dt);
      drawLeaders();
      if (REDUCE) { if (scale !== lastScale) resizeFx(); } else drawFx(dt);
      raf = requestAnimationFrame(frame);
    }
    const speedTarget = () => (REDUCE ? 0 : speedTo * (exploded ? 0 : hot ? .32 : 1));

    return {
      build,
      remeasure: measureRows,
      enter() {
        segPlace('#lensCtl');
        measureRows();
        if (!$('#exSlabs').firstChild) { buildSlabs(); ORDER.forEach((id) => setTint(id, tint[id] === P[layerById(id).colour].m ? null : tint[id])); }
        resizeFx();
        running = true; last = 0;
        raf = requestAnimationFrame(frame);
        if (entered) return;
        entered = true;
        // v15: open on the finished drawing; the build is an optional replay (↻ button)
        if (REDUCE) { speedTo = 0; roadA = 1; setBootVisual(false); } else { startBoot(); finishBoot(); }
      },
      leave() {
        running = false; cancelAnimationFrame(raf);
        if (boot) finishBoot();
        stopTour(); clearTimeout(camT); clearTimeout(leaveT); setHot(null);
      },
    };
  })();

  // =================================================================== DEEP DIVE
  const dive = (() => {
    const wrap = $('#dive');
    const stage = $('#diveStage');
    let cur = 0;
    const tiles = [
      ['trend', 'What winning looks like', 'winning'],
      ['castle', 'Moats & growth drivers', 'moats'],
      ['target', 'Critical, and where competition is low', 'critical'],
      ['alert', 'Engineering pain points', 'pain'],
    ];
    function render(id, hlKey) {
      const l = layerById(id);
      cur = id;
      const nav = LAYERS.map((x) => `<button class="dn${x.id === id ? ' cur' : ''}" data-l="${x.id}" style="${cv(x.colour)}" title="${esc(x.name)}"><i></i>${x.num}<span>${esc(x.short)}</span></button>`).join('');
      const tileHtml = tiles.map(([ic, h, key], k) => {
        let body = `<ul>${l[key].map((b) => `<li>${rich(b)}</li>`).join('')}</ul>`;
        if (key === 'winning') body += `<div class="kpi"><b>KPIs</b>${esc(l.kpis)}</div>`;
        if (key === 'critical' && l.critPocket) body += pocket(l.critPocket);
        if (key === 'pain' && LAYER_FIT[l.id]) body += `<div class="kpi"><b>Where our skills fit</b>${esc(LAYER_FIT[l.id])}</div>`;
        return `<section class="tile" style="--d:${k}"><div class="tile-h"><span>${icon(ic)}</span><h4>${esc(h)}</h4></div>${body}</section>`;
      }).join('');
      const capRow = `<div class="dv-tags">${meter(l.comp)}<span class="dv-cap">${esc(CAPTURE_LABEL[l.capture])}</span></div>`;
      stage.innerHTML = `<div class="dv" style="${cv(l.colour)}">
        <div class="dv-left">
          <div class="dv-big">${l.num}</div>
          <div class="dv-ico">${icon(l.icon)}</div>
          <div class="dv-k">${esc(l.kicker)}</div>
          <div class="dv-name">${esc(l.name)}</div>
          <div class="dv-scope">${esc(l.scope)}</div>
          ${capRow}
          <div class="dv-stat">${esc(l.stat)}</div>
          <div class="dv-statcap">${rich(l.statcap)}</div>
          <div class="dv-who">WHO PLAYS</div>
          ${chips(l.logos, 'lg')}
        </div>
        <nav class="dv-nav">${nav}<div class="arrows">
          <button data-step="-1" aria-label="Previous layer"><svg viewBox="0 0 24 24"><path d="M15.4 7.4 14 6l-6 6 6 6 1.4-1.4L10.8 12z"/></svg></button>
          <button data-step="1" aria-label="Next layer"><svg viewBox="0 0 24 24"><path d="M8.6 16.6 10 18l6-6-6-6-1.4 1.4 4.6 4.6z"/></svg></button></div></nav>
        <button class="x" aria-label="Close deep dive">×</button>
        <div class="dv-right">${tileHtml}</div>
      </div>`;
      $$('.dn', stage).forEach((b) => b.addEventListener('click', () => render(+b.dataset.l)));
      $$('[data-step]', stage).forEach((b) => b.addEventListener('click', () => step(+b.dataset.step)));
      $('.x', stage).addEventListener('click', close);
      requestAnimationFrame(() => requestAnimationFrame(() => $$('.tile', stage).forEach((t) => t.classList.add('in'))));
      if (!REDUCE) {
        const st = $('.dv-stat', stage);
        st.animate([{ opacity: 0, transform: 'translateY(16px) scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 700, easing: 'cubic-bezier(.2,.8,.2,1)', delay: 150, fill: 'backwards' });
        $('.dv-left', stage).animate([{ filter: 'brightness(1.4)' }, { filter: 'none' }], { duration: 600 });
      }
      if (hlKey) setTimeout(() => flashChip(stage, hlKey), 300);
    }
    function step(d) { const n = ((cur - 1 + d + LAYERS.length) % LAYERS.length) + 1; render(n); }
    function open(id, hlKey) {
      const was = wrap.classList.contains('open');
      render(id, hlKey); wrap.classList.add('open'); wrap.setAttribute('aria-hidden', 'false'); hideTip();
      if (!was) modal.open(wrap, () => $('.x', stage));
    }
    function close() { if (!wrap.classList.contains('open')) return; wrap.classList.remove('open'); wrap.setAttribute('aria-hidden', 'true'); modal.close(wrap); }
    wrap.addEventListener('click', (e) => { if (e.target === wrap) close(); });
    return { open, close, step, isOpen: () => wrap.classList.contains('open') };
  })();

  // =================================================================== GROWTH CHART (3 measures)
  const pools = (() => {
    const box = $('#pools');
    const axis = $('#poolAxis');
    const ROW = 96;
    const MODES = {
      size: { max: 62, ticks: [0, 10, 20, 30, 40, 50, 60], fmt: (v) => `$${v}B`, unit: '2035 market size, $B · every pool ends in 2035',
        val: (p) => p.to, a: (p) => p.from, label: (p) => `${p.approx ? '~' : ''}$${p.to}B`, sub: (p) => `${(p.to / p.from).toFixed(1)}×`,
        legend: '<span><i class="lg-from"></i>Start of period (2025 or 2030)</span><span><i class="lg-to"></i>2035</span>',
        note: 'ADAS/AD and OS & middleware run 2025–35; compute units 2030–35. All four layers are rated crowded; our wedges are evidence work beside these pools, not rivals in them. McKinsey has no comparable pool for telematics, data or OTA.' },
      mult: { max: 7.5, ticks: [0, 1, 2, 3, 4, 5, 6, 7], fmt: (v) => `${v}×`, unit: 'Growth multiple over the period',
        val: (p) => p.to / p.from, a: () => 0, label: (p) => `${(p.to / p.from).toFixed(1)}×`, sub: (p) => p.years,
        legend: '<span><i class="lg-to"></i>End value ÷ start value</span>',
        note: 'Multiples use McKinsey’s rounded endpoints, so they are approximate. Compare within a period: compute units over 5 years, the others over 10.' },
      cagr: { max: 36, ticks: [0, 5, 10, 15, 20, 25, 30, 35], fmt: (v) => `${v}%`, unit: 'Growth rate, % per year',
        val: (p) => p.cagr, a: () => 0, label: (p) => `${p.cagr.toFixed(1)}%`, sub: (p) => (p.computed ? 'computed' : 'McKinsey'),
        legend: '<span><i class="lg-to"></i>Rate stated by McKinsey</span><span><i class="lg-calc"></i>Computed from rounded endpoints</span>',
        note: 'Compute-unit rates are derived from $5B→$17B and $4B→$13B over 2030–35. ADAS (19.4%) and OS (16.2%) are McKinsey’s stated 2025–35 rates.' },
    };
    let mode = 'size';
    const rowsEl = [];

    function build() {
      POOLS.forEach((p, k) => {
        const l = layerById(p.layer);
        const row = document.createElement('div');
        row.className = 'pool';
        row.style.top = k * ROW + 'px';
        row.innerHTML = `<div class="pool-n">${esc(p.name)}<small><i style="--c:${P[p.colour].m}"></i>Layer ${l.num} · ${esc(p.years)} · <span class="pool-comp">${esc(COMP_LABEL[l.comp].toLowerCase())}</span></small></div>
          <div class="track" style="--d:${k}"><div class="gls"></div>
            <span class="v-from"></span><span class="bar"></span><span class="dot-from"></span><span class="dot-to"></span>
            <span class="v-to"></span></div>`;
        row.addEventListener('pointermove', (e) => showTip(`<b>${esc(p.name)}</b>${p.approx ? '~' : ''}$${p.from}B → ${p.approx ? '~' : ''}$${p.to}B, ${esc(p.years)}<br>${(p.to / p.from).toFixed(1)}× · ${p.cagr.toFixed(1)}%/yr ${p.computed ? '(computed)' : '(McKinsey)'}<br>Layer ${l.num} ${esc(l.short)} · <span style="color:var(--faint)">click for the deep dive</span>`, e.clientX, e.clientY));
        row.addEventListener('pointerleave', hideTip);
        row.addEventListener('click', () => dive.open(p.layer));
        box.appendChild(row);
        rowsEl.push({ row, p });
      });
      box.style.height = POOLS.length * ROW + 'px';
      segCtl($('#poolCtl'), (b) => setMode(b.dataset.m));
      setMode('size');
    }
    function setMode(m) {
      mode = m;
      const M = MODES[m];
      $('#chartUnit').textContent = M.unit;
      $('#chartLegend').innerHTML = M.legend;
      $('#chartNote').textContent = M.note;
      box.dataset.mode = m;
      axis.innerHTML = M.ticks.map((v) => `<span style="left:${(v / M.max) * 100}%">${M.fmt(v)}</span>`).join('');
      const grid = M.ticks.map((v) => `<i class="gl" style="left:${(v / M.max) * 100}%"></i>`).join('');
      const ranked = rowsEl.slice().sort((x, y) => M.val(y.p) - M.val(x.p));
      ranked.forEach(({ row, p }, rank) => {
        row.style.top = rank * ROW + 'px';
        const tr = $('.track', row);
        tr.style.setProperty('--a', (M.a(p) / M.max) * 100 + '%');
        tr.style.setProperty('--b', (M.val(p) / M.max) * 100 + '%');
        $('.gls', row).innerHTML = grid;
        $('.v-from', row).textContent = m === 'size' ? `${p.approx ? '~' : ''}$${p.from}B` : '';
        $('.v-to', row).innerHTML = `${esc(M.label(p))}<small>${esc(M.sub(p))}</small>`;
        tr.classList.toggle('calc', m === 'cagr' && !!p.computed);
      });
    }
    return { build, ready() { setTimeout(() => box.classList.add('ready'), REDUCE ? 0 : 2600); } };
  })();

  // =================================================================== WHITESPACE
  const ws = (() => {
    const stage = $('#ws');
    const dotsBox = $('#dots');
    const links = $('#wsLinks');
    const PW = 820, PH = 510, OX = 60 + 74, OY = 190 + 20;
    const dotEls = {};
    function build() {
      DOTS.forEach((d, k) => {
        const el = document.createElement('div');
        el.className = `wd${d.cand ? ' is-cand' : ''}${d.left ? ' left' : ''}`;
        el.style.cssText = `${cv(d.colour)};left:${d.x * PW}px;top:${(1 - d.y) * PH}px;--d:${k}`;
        el.innerHTML = `<i>${d.cand ? candMark(d.cand) : ''}</i><span>${esc(d.label)}</span>`;
        const l = layerById(d.layer);
        el.tabIndex = 0; el.setAttribute('role', 'button');
        el.setAttribute('aria-label', `${d.label}: layer ${l.num} ${l.short}, ${COMP_LABEL[l.comp].toLowerCase()}${d.cand ? `, ${candStatus(d.cand)}` : ''}. Opens the layer deep dive.`);
        const tipHtml = (how) => `<b>${esc(d.label)}</b>Layer ${l.num} · ${esc(l.short)} · ${esc(COMP_LABEL[l.comp].toLowerCase())}${d.cand ? `<br><span style="color:var(--gold-l)">★ Shortlisted · ${esc(candStatus(d.cand))}</span>` : ''}<br><span style="color:var(--faint)">Team placement · ${how} for the layer deep dive</span>`;
        el.addEventListener('focus', () => { const r = el.getBoundingClientRect(); showTip(tipHtml('Enter'), r.right, r.bottom); if (d.cand) hotCand(d.cand); });
        el.addEventListener('blur', () => { hideTip(); if (d.cand) hotCand(null); });
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dive.open(d.layer); } });
        el.addEventListener('pointermove', (e) => showTip(tipHtml('click'), e.clientX, e.clientY));
        el.addEventListener('pointerleave', () => { hideTip(); if (d.cand) hotCand(null); });
        el.addEventListener('pointerenter', () => { if (d.cand) hotCand(d.cand); });
        el.addEventListener('click', () => dive.open(d.layer));
        dotsBox.appendChild(el);
        if (d.cand) dotEls[d.cand] = { el, d };
      });
      const box = $('#cands');
      CANDIDATES.forEach((c, k) => {
        const el = document.createElement('article');
        el.className = 'cand'; el.tabIndex = 0;
        el.dataset.n = c.n;
        el.style.cssText = `${cv(c.colour)};--d:${k}`;
        el.classList.toggle('screened', !!c.screened);
        const badge = c.target ? `<span class="c-out r">Round 1 #${c.target}</span>` : c.screened ? '<span class="c-out s">Screened out in Round 1</span>' : '';
        el.innerHTML = `<span class="cn">${candMark(c.n)}</span><h4>${esc(c.title)}</h4><span class="ctag">${esc(c.tag)}</span>${badge}
          <p>${rich(c.text)}</p><div class="per c-now">${esc(c.now)}</div>`;
        el.classList.toggle('old-out', !!c.out);
        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', `${c.title}. ${c.target ? 'Round 1 target ' + c.target : c.screened ? 'Screened out' : ''}. ${c.now}. Opens its dossier.`);
        el.addEventListener('pointerenter', () => hotCand(c.n));
        el.addEventListener('pointerleave', () => hotCand(null));
        el.addEventListener('focus', () => hotCand(c.n));
        el.addEventListener('blur', () => hotCand(null));
        const openIt = () => dossier.show(c.id, true);
        el.addEventListener('click', openIt);
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openIt(); } });
        box.appendChild(el);
      });
      $('.q-ws').addEventListener('pointerenter', () => $('#matrix').classList.add('ws-only'));
      $('.q-ws').addEventListener('pointerleave', () => $('#matrix').classList.remove('ws-only'));
    }
    function hotCand(n) {
      links.innerHTML = '';
      $$('.cand', stage).forEach((c) => c.classList.toggle('hot', +c.dataset.n === n));
      Object.values(dotEls).forEach(({ el, d }) => el.classList.toggle('hot', d.cand === n));
      if (!n) return;
      const { d } = dotEls[n];
      const card = $(`.cand[data-n="${n}"]`, stage);
      const r = card.getBoundingClientRect();
      const a = toStage(stage, r.left, r.top + r.height / 2);
      a.x -= links.offsetLeft; // v14: the links layer may be shifted on a wide stage
      const bx = OX + d.x * PW, by = OY + (1 - d.y) * PH;
      links.appendChild(svgEl('path', { d: `M${a.x - 2},${a.y} C${a.x - 120},${a.y} ${bx + 160},${by} ${bx + 20},${by}`, stroke: P[candOf(n).colour].l }));
    }
    return { build, leave() { hotCand(null); } };
  })();

  // =================================================================== EVIDENCE AUDIT SLIDE
  const fc = (() => {
    const list = $('#fcList');
    const COLORS = { verified: '#22c55e', corrected: '#f59e0b', forecast: '#a78bfa', estimate: '#38bdf8', hypothesis: '#94a3b8' };
    let filter = 'all', tab = 'claims', segApi = null;
    const counts = {};
    CLAIMS.forEach((c) => { counts[c.status] = (counts[c.status] || 0) + 1; });
    const nVC = (counts.verified || 0) + (counts.corrected || 0);
    const nFlag = CLAIMS.length - nVC;
    const nPend = CLAIMS.filter((c) => c.pending).length;
    const nSrc = SRC_IDS.filter((id) => !SOURCES[id].post).length;

    function build() {
      $('#fcTotal').textContent = CLAIMS.length;
      // v15: totals that add up (37 + 6 = 43); the hand checks are a subset, shown separately
      $('#fcSub').textContent = `Checked against ${nSrc} sources. ${nVC} verified or corrected, ${nFlag} labelled as forecasts, estimates or team hypotheses. ${HAND_CHECKS.done} of ${HAND_CHECKS.total} points that needed a person to open the source were checked by hand on ${HAND_CHECKS.date}.`;
      $('#fcSplit').innerHTML = `<span><b>${nVC}</b> verified or corrected</span><span><b>${nFlag}</b> labelled as estimates</span><span class="sub"><b>${HAND_CHECKS.done} of ${HAND_CHECKS.total}</b> hand checks done</span>`;
      $('#fcBar').innerHTML = Object.keys(STATUS).map((k) => counts[k] ? `<i style="flex:${counts[k]};background:${COLORS[k]}" title="${esc(STATUS[k].label)}: ${counts[k]}"></i>` : '').join('');
      const f = $('#fcFilters');
      const btn = (k, label, n, desc) => `<button class="fcf${k === filter ? ' on' : ''}" data-f="${k}" style="--k:${COLORS[k] || '#e2e8f0'}" aria-pressed="${k === filter}"><i></i><span><b>${esc(label)}</b><small>${esc(desc)}</small></span><em>${n}</em></button>`;
      f.innerHTML = btn('all', 'All claims', CLAIMS.length, 'Everything audited') +
        Object.keys(STATUS).map((k) => counts[k] ? btn(k, STATUS[k].label, counts[k], STATUS[k].desc) : '').join('');
      $$('.fcf', f).forEach((b) => b.addEventListener('click', () => {
        filter = b.dataset.f;
        $$('.fcf', f).forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
        if (tab !== 'claims') segApi.set('claims', 'tab');
        render();
      }));
      segApi = segCtl($('#fcTabs'), (b) => { tab = b.dataset.tab; list.setAttribute('aria-labelledby', b.id); render(); });
      render();
    }
    function srcLink(id) {
      const s = SOURCES[id]; if (!s) return '';
      const body = `<b>[${srcNum(id)}]</b> ${esc(s.pub)} · ${esc(s.date)}`;
      return s.url ? `<a class="fc-src" href="${esc(s.url)}" target="_blank" rel="noopener">${body} ↗</a>` : `<span class="fc-src">${body}</span>`;
    }
    function render() {
      list.classList.remove('in'); void list.offsetWidth;
      if (tab === 'claims') {
        const items = CLAIMS.filter((c) => filter === 'all' || c.status === filter);
        list.innerHTML = items.map((c, i) => `<div class="fcr" style="--k:${COLORS[c.status]};--i:${Math.min(i, 14)}">
            <span class="fcr-b">${esc(STATUS[c.status].label)}</span>
            <div class="fcr-m"><span class="fcr-s">${esc(c.slide)}</span><p>${esc(c.claim)}</p>${c.hand ? `<span class="fcr-h${/^Could not/.test(c.hand) ? ' no' : ''}">${esc(c.hand)}</span>` : ''}</div>
            ${srcLink(c.src)}</div>`).join('');
      } else if (tab === 'sources') {
        list.innerHTML = SRC_IDS.map((id, i) => {
          const s = SOURCES[id];
          return `<div class="fcs" style="--i:${Math.min(i, 14)}"><span class="fcs-n k-${s.kind}">${srcNum(id)}</span>
            <div class="fcr-m"><span class="fcr-s">${esc(KIND[s.kind])} · ${esc(s.date)}</span><p><b>${esc(s.pub)}</b>: ${esc(s.title)}</p></div>
            ${s.url ? `<a class="fc-src" href="${esc(s.url)}" target="_blank" rel="noopener">Open ↗</a>` : '<span class="fc-src">Team document</span>'}</div>`;
        }).join('');
      } else if (tab === 'open') {
        const hc = CLAIMS.filter((c) => c.hand);
        list.innerHTML = `<p class="fc-intro">These sources were paywalled or quoted second-hand during the audit, so a teammate opened each one by hand on ${esc(HAND_CHECKS.date)}. ${esc(HAND_CHECKS.links)}</p>` +
          hc.map((c, i) => `<div class="fco${/^Could not/.test(c.hand) ? ' no' : ''}" style="--i:${Math.min(i, 14)}"><span class="fco-n">${/^Could not/.test(c.hand) ? '–' : '✓'}</span><p><b>${esc(c.claim)}</b><br>${esc(c.hand.replace(/^Checked by hand: /, ''))}</p></div>`).join('');
      } else {
        list.innerHTML = GLOSSARY.map(([t, d], i) => `<div class="fcg" style="--i:${Math.min(i, 14)}"><b>${esc(t)}</b><p>${esc(d)}</p></div>`).join('');
      }
      list.scrollTop = 0;
      list.classList.add('in');
    }
    return { build, enter() { segPlace('#fcTabs'); }, counts: { nVC, nFlag, nPend, nSrc } };
  })();

  // =================================================================== COMPANY FINDER
  const finder = (() => {
    const wrap = $('#finder');
    const input = $('#finderInput');
    const out = $('#finderList');
    const index = new Map();
    let sel = 0, results = [];
    function add(spec, role) {
      const name = specName(spec);
      if (!name) return;
      const key = name.toLowerCase();
      if (!index.has(key)) {
        const id = spec[0] === '=' ? null : spec.split('|')[0];
        index.set(key, { name, key, logo: id, roles: [] });
      }
      const e = index.get(key);
      if (!e.roles.some((r) => r.kind === role.kind && r.id === role.id)) e.roles.push(role);
    }
    function build() {
      LAYERS.forEach((l) => [...(l.callLogos || []), ...l.logos].forEach((s) => add(s, { kind: 'layer', id: l.id, label: `${l.num} ${l.short}`, colour: l.colour })));
      ACTORS.forEach((a) => a.logos.forEach((s) => add(s, { kind: 'actor', id: a.id, label: a.title, colour: a.colour })));
      HUB.oems.forEach((o) => add(o, { kind: 'actor', id: 'hub', label: 'OEM hub', colour: 'Ltwo' }));
      input.addEventListener('input', () => { sel = 0; render(); });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') { sel = Math.min(results.length - 1, sel + 1); mark(); e.preventDefault(); }
        else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); mark(); e.preventDefault(); }
        else if (e.key === 'Enter') { const r = results[sel]; if (r) jump(r, r.roles[0]); e.preventDefault(); }
        else if (e.key === 'Escape') { close(); e.preventDefault(); }
      });
      wrap.addEventListener('click', (e) => { if (e.target === wrap) close(); });
    }
    function render() {
      const q = input.value.trim().toLowerCase();
      results = [...index.values()].filter((e) => !q || e.key.includes(q))
        .sort((a, b) => (q && a.key.startsWith(q) ? -1 : 0) - (q && b.key.startsWith(q) ? -1 : 0) || b.roles.length - a.roles.length || a.name.localeCompare(b.name));
      if (!results.length) { out.innerHTML = `<div class="fd-empty">No company matches “${esc(input.value)}”.</div>`; return; }
      out.innerHTML = results.map((e, i) => `<div class="fd-row${i === sel ? ' sel' : ''}" data-i="${i}" role="option" aria-selected="${i === sel}">
          <span class="fd-logo">${e.logo ? `<img src="${logoSrc(e.logo)}" alt="">` : `<b>${esc(e.name[0])}</b>`}</span>
          <span class="fd-name">${esc(e.name)}<small>${e.roles.length} role${e.roles.length > 1 ? 's' : ''}</small></span>
          <span class="fd-roles">${e.roles.map((r, j) => `<button class="fd-role" data-j="${j}" style="${cv(r.colour)}">${r.kind === 'layer' ? '<i class="lay"></i>' : '<i class="eco"></i>'}${esc(r.label)}</button>`).join('')}</span>
        </div>`).join('');
      $$('.fd-row', out).forEach((row) => {
        const e = results[+row.dataset.i];
        $$('.fd-role', row).forEach((b) => b.addEventListener('click', () => jump(e, e.roles[+b.dataset.j])));
        row.addEventListener('pointerenter', () => { sel = +row.dataset.i; mark(); });
      });
    }
    function mark() {
      $$('.fd-row', out).forEach((r, i) => r.classList.toggle('sel', i === sel));
      const s = $('.fd-row.sel', out); if (s) s.scrollIntoView({ block: 'nearest' });
    }
    function jump(e, role) {
      close();
      if (mode.is('read')) { reader.jumpTo(role.kind === 'layer' ? `r-layer-${role.id}` : `r-actor-${role.id}`); return; }
      if (role.kind === 'layer') {
        const wait = slides[cur].id === 's-vc' ? 0 : 650;
        goId('s-vc'); setTimeout(() => dive.open(role.id, e.key), wait);
      } else {
        const wait = slides[cur].id === 's-eco' ? 0 : 650;
        goId('s-eco'); setTimeout(() => eco.open(role.id, e.key), wait);
      }
    }
    function open() {
      dive.close();
      wrap.classList.add('open'); wrap.setAttribute('aria-hidden', 'false');
      input.value = ''; sel = 0; render();
      modal.open(wrap, () => input);
    }
    function close() { if (!wrap.classList.contains('open')) return; wrap.classList.remove('open'); wrap.setAttribute('aria-hidden', 'true'); modal.close(wrap); }
    return { build, open, close, isOpen: () => wrap.classList.contains('open') };
  })();

  // =================================================================== SPEAKER NOTES
  const notes = (() => {
    const el = $('#notes');
    let on = false;
    function update() {
      $('#notesSlide').textContent = `${cur + 1} · ${slides[cur] ? slides[cur].dataset.title : ''}`;
      $('#notesText').textContent = (slides[cur] && NOTES[slides[cur].id]) || '';
    }
    function toggle(v) {
      on = v ?? !on;
      el.classList.toggle('open', on);
      el.setAttribute('aria-hidden', String(!on));
      $('#btnNotes').classList.toggle('on', on);
      if (on) update();
    }
    return { toggle, update, isOpen: () => on };
  })();

  // =================================================================== NAVIGATION
  const slides = $$('.slide');
  let cur = -1;
  const slideIndex = (id) => slides.findIndex((x) => x.id === id);
  const goId = (id) => go(slideIndex(id));
  const HOOKS = {
    's-cover': { enter: () => cover.start(), leave: () => cover.stop() },
    's-why': { enter: () => ecus.start(), leave: () => ecus.stop() },
    's-eco': { enter: () => eco.enter(), leave: () => eco.leave() },
    's-vc': { enter: () => vc.enter(), leave: () => vc.leave() },
    's-grow': { enter: () => { segPlace('#poolCtl'); pools.ready(); } },
    's-ws': { leave: () => ws.leave() },
    's-funnel': { enter: () => screen.enter() },
    's-evolve': { enter: () => evolve.enter(), leave: () => evolve.leave() },
    's-dossier': { enter: () => dossier.enter() },
    's-wedges': { enter: () => wedgeSlide.enter() },
    's-fc': { enter: () => fc.enter() },
  };
  const hooks = {};
  slides.forEach((sl, i) => { if (HOOKS[sl.id]) hooks[i] = HOOKS[sl.id]; });

  // v12: chapters (data-ch on each slide) group the dock and menu, and label every slide
  const chOf = (s) => CHAPTERS.find((c) => c.id === s.dataset.ch) || CHAPTERS[0];
  const chLabel = (c) => (c.n === '' ? c.name : c.n === 'A' ? c.name : `${c.n} · ${c.short || c.name}`);
  function buildChrome() {
    const segs = $('#segs'), list = $('#menuList');
    let lastCh = null;
    slides.forEach((s, i) => {
      const c = chOf(s);
      const first = c.id !== lastCh;
      lastCh = c.id;
      const b = document.createElement('button');
      b.className = 'seg' + (first && i ? ' ch-start' : '') + (c.id === 'appx' ? ' appx' : '');
      b.setAttribute('aria-label', `Go to slide ${i + 1}: ${s.dataset.title} (${c.name})`);
      b.innerHTML = `<span>${i + 1} · ${esc(s.dataset.title)}<small>${esc(chLabel(c))}</small></span>`;
      b.addEventListener('click', () => go(i));
      segs.appendChild(b);
      if (first && c.id !== 'intro') {
        const h = document.createElement('li');
        h.className = 'menu-ch';
        h.innerHTML = `<b>${esc(chLabel(c))}</b>${c.code ? `<small>${esc(c.code)}</small>` : ''}`;
        list.appendChild(h);
      }
      const li = document.createElement('li');
      li.innerHTML = `<button style="--i:${i}">${esc(s.dataset.title)}</button>`;
      li.firstChild.addEventListener('click', () => { menu(false); go(i); });
      list.appendChild(li);
      // chapter tag in front of each slide's kicker
      const k = $('.head .kicker', s);
      if (k && c.id !== 'intro') {
        const t = document.createElement('span');
        t.className = 'chap' + (c.id === 'appx' ? ' appx' : '');
        t.innerHTML = c.id === 'appx' ? 'Appendix' : `Chapter ${c.n} · ${esc(c.short || c.name)}${c.code ? ` <i>${esc(c.code)}</i>` : ''}`;
        k.prepend(t);
      }
    });
  }

  function go(i) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    if (i === cur) return;
    const prev = cur;
    if (prev >= 0 && hooks[prev] && hooks[prev].leave) hooks[prev].leave();
    hideTip();
    slides.forEach((s, k) => { s.classList.toggle('is-active', k === i); s.classList.toggle('back', k < i); s.inert = k !== i; s.setAttribute('aria-hidden', String(k !== i)); });
    document.body.classList.toggle('calm', slides[i].id !== 's-cover');
    cur = i;
    $$('.seg').forEach((s, k) => { s.classList.toggle('cur', k === i); s.classList.toggle('done', k < i); });
    $$('#menuList button').forEach((b, k) => b.classList.toggle('cur', k === i));
    const nx = slides[i + 1];
    $('#count').innerHTML = `${i + 1} / ${slides.length}${nx ? `<span class="nx">Next: ${esc(nx.dataset.title)}</span>` : ''}`;
    const ch = chOf(slides[i]);
    $('#nowTitle').textContent = i ? `${ch.id === 'intro' ? '' : chLabel(ch) + ' — '}${slides[i].dataset.title}` : '';
    $$('[data-count]', slides[i]).forEach((el) => countUp(el));
    if (hooks[i] && hooks[i].enter) hooks[i].enter();
    notes.update();
    if (!mode.is('read') && location.hash !== '#' + i) history.replaceState(null, '', location.pathname + location.search + '#' + i);
  }
  const next = () => go(cur + 1), prev = () => go(cur - 1);

  function menu(open) {
    const m = $('#menu');
    const o = open ?? !m.classList.contains('open');
    if (o === m.classList.contains('open')) return;
    m.classList.toggle('open', o);
    m.setAttribute('aria-hidden', String(!o));
    if (o) modal.open(m, () => $('#menuList button.cur') || $('#menuList button')); else modal.close(m);
  }
  function toggleFull() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.();
  }

  // ------------------------------------------------------------------ INPUT
  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (document.querySelector('dialog[open]')) return;
    if (finder.isOpen()) return; // the finder input handles its own keys
    if (e.target.matches && e.target.matches('input, textarea, select')) return;
    if (mode.is('read')) {
      if (k === '/') { finder.open(); e.preventDefault(); }
      else if (k === 'Escape' && notes.isOpen()) notes.toggle(false);
      return;
    }
    // Space on a focused card (tabindex, not a native control) activates it like a button,
    // unless the card already handled the key itself
    if (k === ' ' && !e.defaultPrevented && e.target.matches && e.target.matches('[tabindex]:not(button):not(a):not(input):not(.fc-list):not(.do-panel):not(.slide)')) {
      e.preventDefault();
      e.target.click();
      return;
    }
    if (dive.isOpen()) {
      if (k === 'Escape') dive.close();
      else if (k === 'ArrowRight' || k === 'ArrowDown') dive.step(1);
      else if (k === 'ArrowLeft' || k === 'ArrowUp') dive.step(-1);
      else if (k === '/') finder.open();
      else return;
      e.preventDefault(); return;
    }
    if ($('#menu').classList.contains('open')) {
      if (k === 'Escape' || k === 'o' || k === 'O') { menu(false); e.preventDefault(); }
      return;
    }
    const onControl = e.target.closest && e.target.closest('button, a, [tabindex], [role="slider"], input');
    if (k === 'ArrowRight' || k === 'PageDown' || (k === ' ' && !onControl)) { next(); e.preventDefault(); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { prev(); e.preventDefault(); }
    else if (k === 'Home') go(0);
    else if (k === 'End') go(slides.length - 1);
    else if (k === 'o' || k === 'O') menu(true);
    else if (k === 'f' || k === 'F') toggleFull();
    else if (k === 'n' || k === 'N') notes.toggle();
    else if (k === '/') { finder.open(); e.preventDefault(); }
    else if (k === 'Escape') { if (notes.isOpen()) notes.toggle(false); else if (slides[cur].id === 's-eco') eco.escape(); }
    else if (/^[1-9]$/.test(k) && +k <= slides.length) go(+k - 1);
  });

  let touch = null;
  document.addEventListener('touchstart', (e) => { touch = { x: e.touches[0].clientX, y: e.touches[0].clientY, inScene: !!e.target.closest('#rig, .fc-list') }; }, { passive: true });
  document.addEventListener('touchend', (e) => {
    if (!touch || dive.isOpen() || touch.inScene) { touch = null; return; }
    const dx = e.changedTouches[0].clientX - touch.x, dy = e.changedTouches[0].clientY - touch.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) dx < 0 ? next() : prev();
    touch = null;
  });

  document.addEventListener('pointermove', (e) => {
    root.style.setProperty('--mx', e.clientX + 'px');
    root.style.setProperty('--my', e.clientY + 'px');
    if (cur === 0) cover.mouse(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5);
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cover.stop();
    else if (cur === 0) cover.start();
  });

  $('#prev').addEventListener('click', prev);
  $('#next').addEventListener('click', next);
  $('#btnMenu').addEventListener('click', () => menu());
  $('#btnFull').addEventListener('click', toggleFull);
  $('#btnFind').addEventListener('click', () => finder.open());
  $('#btnNotes').addEventListener('click', () => notes.toggle());
  $('#verPill').addEventListener('click', () => (mode.is('read') ? reader.jumpTo('r-audit') : goId('s-fc')));
  $('#menu').addEventListener('click', (e) => { if (e.target.id === 'menu') menu(false); });
  $$('[data-go]').forEach((b) => b.addEventListener('click', () => go(+b.dataset.go)));
  $$('[data-goid]').forEach((b) => b.addEventListener('click', () => goId(b.dataset.goid)));
  window.addEventListener('resize', () => { fit(); vc.remeasure(); ['#eraCtl', '#lensCtl', '#poolCtl', '#fcTabs', '#dpViews'].forEach(segPlace); mode.auto(); });
  window.addEventListener('hashchange', () => { if (mode.is('read')) return; const n = parseInt(location.hash.slice(1), 10); if (!isNaN(n)) go(n); });

  // =================================================================== v3 · MODAL FOCUS MANAGEMENT
  // Open dialogs make everything else inert (no focus, no clicks), take focus,
  // and give it back to the control that opened them when they close.
  const modal = (() => {
    const stack = [];
    const regions = () => ['.chrome-top', '#deck', '.dock', '#reader', '#notes', '#dive', '#menu', '#finder'].map((q) => $(q)).filter(Boolean);
    function apply() {
      const top = stack[stack.length - 1];
      regions().forEach((r) => { r.inert = !!top && r !== top.el; });
    }
    return {
      open(el, target) {
        if (stack.some((x) => x.el === el)) return;
        stack.push({ el, ret: document.activeElement });
        apply();
        setTimeout(() => { const t = (target && target()) || el; if (t && t.focus) t.focus({ preventScroll: true }); }, 50);
      },
      close(el) {
        const i = stack.findIndex((x) => x.el === el);
        if (i < 0) return;
        const [entry] = stack.splice(i, 1);
        apply();
        if (entry.ret && document.contains(entry.ret) && !entry.ret.closest('[inert]')) entry.ret.focus({ preventScroll: true });
      },
    };
  })();

  // =================================================================== v3 · DOCK (auto-hides while presenting)
  const dock = (() => {
    const d = $('.dock');
    let t = 0;
    // v12: the dock stays visible so a reviewer reading alone always sees where they are and what comes next
    const AUTO_HIDE = false;
    function show() {
      d.classList.remove('hide');
      clearTimeout(t);
      if (AUTO_HIDE) t = setTimeout(() => {
        if (mode.is('read') || d.matches(':hover') || d.contains(document.activeElement)) return;
        d.classList.add('hide');
      }, 2800);
    }
    return {
      init() {
        document.addEventListener('pointermove', (e) => { if (e.clientY > innerHeight - 140 || e.movementY > 0) show(); }, { passive: true });
        document.addEventListener('keydown', show);
        document.addEventListener('touchstart', show, { passive: true });
        d.addEventListener('focusin', show);
        show();
      },
      show,
    };
  })();

  // =================================================================== v3 · COVER TEXT + IDENTITY
  function coverText() {
    const who = [TEAM.name, TEAM.university].filter(Boolean).join(' · ');
    const tl = $('#teamLine');
    if (who) { tl.textContent = who; tl.hidden = false; document.title = `${TEAM.name || 'SDV'} · SDV Value Chain Portfolio`; }
    $('#coverSub').textContent = EXEC.sub;
    // v15: one submission name and one as-of date, in one place
    $('#coverAsOf').textContent = `${TEAM.submission} · as of ${TEAM.updated}`;
    $('#verText').textContent = 'Evidence audit';
  }

  // feasibility math shared by the slides and the reading view
  function feas(p, w) {
    const W = SCREEN.criteria.reduce((a, c) => a + (w ? w[c.id] : c.w), 0) || 1;
    return SCREEN.criteria.reduce((a, c) => a + (w ? w[c.id] : c.w) * p.s[c.id], 0) / W;
  }
  const screenPos = (id) => SCREEN.positions.find((p) => p.id === id);
  const TEAM_W = Object.fromEntries(SCREEN.criteria.map((c) => [c.id, c.w]));
  const SHORTLISTED = new Set(CANDIDATES.map((c) => c.id));
  function ranking(weights = TEAM_W, positions = SCREEN.positions) {
    return positions.map((p) => { const f = feas(p, weights); return { p, f, pr: f * p.market }; }).sort((a, b) => b.pr - a.pr);
  }
  const top3Key = (r) => r.slice(0, 3).map((x) => x.p.id).sort().join();

  // How fragile is the ranking? Weights: each criterion ±10 points. Scores: each criterion score ±1
  // (kept within 1–5) and each market score ±0.5, one change at a time. The scores are the
  // uncalibrated draft, so the second test matters more.
  function sensitivity(weights = TEAM_W) {
    const base = ranking(weights), key = top3Key(base), top1 = base[0].p.id;
    const w = { total: 0, same3: 0, sameTop: 0 };
    SCREEN.criteria.forEach((c) => [-10, 10].forEach((d) => {
      const r = ranking({ ...weights, [c.id]: Math.max(0, weights[c.id] + d) });
      w.total++; if (top3Key(r) === key) w.same3++; if (r[0].p.id === top1) w.sameTop++;
    }));
    const s = { total: 0, same3: 0, sameTop: 0, swaps: [], newTops: new Set() };
    const trial = (label, positions) => {
      const r = ranking(weights, positions);
      s.total++; if (top3Key(r) === key) s.same3++;
      if (r[0].p.id === top1) s.sameTop++; else { s.swaps.push(label); s.newTops.add(r[0].p.id); }
    };
    SCREEN.positions.forEach((p, i) => {
      const swap = (q) => SCREEN.positions.map((x, j) => (j === i ? q : x));
      SCREEN.criteria.forEach((c) => [-1, 1].forEach((d) => {
        const v = p.s[c.id] + d;
        if (v >= 1 && v <= 5) trial(`${p.short} ${c.label.toLowerCase()} ${d > 0 ? '+1' : '−1'}`, swap({ ...p, s: { ...p.s, [c.id]: v } }));
      }));
      [-0.5, 0.5].forEach((d) => {
        const v = p.market + d;
        if (v >= 1 && v <= 5) trial(`${p.short} market ${d > 0 ? '+0.5' : '−0.5'}`, swap({ ...p, market: v }));
      });
    });
    return { base, w, s };
  }
  const orList = (a) => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} or ${a[a.length - 1]}`);
  function sensitivityHtml(sv) {
    const { base, w, s } = sv, top = base[0].p, second = base[1].p;
    const weights = `<span><b>Weights:</b> across ${w.total} single-weight changes of ±10 points, the top three hold in ${w.same3} and ${esc(top.short)} stays #1 in ${w.sameTop}.</span>`;
    let scores = `<span><b>Scores:</b> across ${s.total} single-score changes (±1 on a criterion, ±0.5 on market), the top three hold in ${s.same3}`;
    if (!s.swaps.length) scores += ` and ${esc(top.short)} stays #1 in all of them.`;
    else {
      const swapsTwo = s.newTops.size === 1 && s.newTops.has(second.id);
      scores += `. #1 is the close call (${base[0].pr.toFixed(1)} vs ${base[1].pr.toFixed(1)}): ${esc(orList(s.swaps))} would ${swapsTwo ? `put ${esc(second.short)} first` : 'change it'}.`;
    }
    return weights + scores + '</span>';
  }
  const marketWhy = (p) => `Criticality ${p.crit[0].toLowerCase()}: ${p.crit[1]}. Competition ${p.comp[0].toLowerCase()}: ${p.comp[1]}.`;
  const CONF = { High: 3, Medium: 2, Low: 1, 'Screened out': 0 };
  function confMeter(level) {
    const n = CONF[level] ?? 0;
    return `<span class="conf conf-${n}" title="Confidence: ${esc(level)}"><i class="${n >= 1 ? 'on' : ''}"></i><i class="${n >= 2 ? 'on' : ''}"></i><i class="${n >= 3 ? 'on' : ''}"></i><b>${esc(level)}</b></span>`;
  }

  // =================================================================== v3 · EXECUTIVE SUMMARY SLIDE
  const execSlide = {
    build() {
      $('#exBottom').textContent = EXEC.bottomLine;
      $('#exTargets').innerHTML = WEDGES.list.map((w, k) => `<button class="ext rv${w.id === 'w2' ? ' weak' : ''}" style="${cv(w.colour)};--d:${4 + k}" data-wedge="${w.id}">
          <span class="ext-n">${esc(w.code)}</span>
          <span class="ext-m"><b>${esc(w.name)}</b><small>${esc(w.short)}</small></span>
          <span class="ext-tag">${esc(w.id === 'w2' ? 'Weakest' : w.tag)}</span></button>`).join('')
        + `<p class="ext-out rv" style="--d:7">Of our first targets, real companies dropped zonal and OTA and narrowed HIL into W2. <button type="button" class="ext-link" id="exEvolve">How we narrowed →</button></p>`;
      $('#exEvolve').addEventListener('click', () => goId('s-evolve'));
      $$('#exTargets [data-wedge]').forEach((b) => b.addEventListener('click', () => wedgeSlide.show(b.dataset.wedge)));
      $('#exRisk').innerHTML = `<div class="mini-kicker">Biggest risk</div><p>${esc(EXEC.risk)}</p><button type="button" class="ext-link" id="exRiskGo">Our risks and what we do about them →</button>`;
      $('#exRiskGo').addEventListener('click', () => goId('s-gaps'));
      $('#exFoot').textContent = EXEC.howToRead;
    },
  };

  // =================================================================== v3 · FUNNEL + WEIGHT SENSITIVITY
  const screen = (() => {
    const w = {};
    const ROW = 48;
    const rowEls = {};
    const tgtIds = ['hil', 'zonal', 'ota']; // the Round 1 targets
    function build() {
      $('#funnel').innerHTML = FUNNEL.map((f, i) => `<li class="fn st-${f.stage.replace(/\W/g, '')}" style="--i:${i}">
          <span class="fn-n">${esc(String(f.n))}</span><span class="fn-l">${esc(f.label)}</span><span class="fn-note">${esc(f.note)}</span><span class="fn-st">${esc(f.stage)}</span></li>`).join('');
      SCREEN.criteria.forEach((c) => { w[c.id] = c.w; });
      $('#weights').innerHTML = `<div class="w-h"><span>Criterion weight</span><span>share</span></div>` + SCREEN.criteria.map((c) => `
        <label class="wt" data-c="${c.id}"><span class="wt-l">${esc(c.label)}</span>
          <input type="range" min="0" max="40" step="5" value="${c.w}" data-c="${c.id}" aria-label="${esc(c.label)} weight" aria-describedby="wd-${c.id}">
          <output id="wo-${c.id}">${c.w}%</output><span class="wt-d" id="wd-${c.id}">A 5 means: ${esc(c.five)}</span></label>`).join('');
      $$('#weights input').forEach((inp) => inp.addEventListener('input', () => { w[inp.dataset.c] = +inp.value; update(); }));
      $('#wReset').addEventListener('click', () => { SCREEN.criteria.forEach((c) => { w[c.id] = c.w; $(`#weights input[data-c="${c.id}"]`).value = c.w; }); update(); });
      const box = $('#ranks');
      box.style.height = SCREEN.positions.length * ROW + 'px';
      SCREEN.positions.forEach((p) => {
        const l = layerById(p.layer);
        const short = SHORTLISTED.has(p.id);
        const r = document.createElement('div');
        r.className = 'rk' + (short ? ' was-short' : '');
        r.setAttribute('role', 'listitem');
        r.tabIndex = 0;
        r.style.cssText = cv(l.colour);
        r.setAttribute('aria-label', `${p.name}${short ? ', shortlisted in B-2.3.1' : ''}. ${SCREEN.criteria.map((c) => `${c.label} ${p.s[c.id]}`).join(', ')}. Market attractiveness ${p.market.toFixed(1)}. ${marketWhy(p)}`);
        r.innerHTML = `<span class="rk-n"></span><span class="rk-name"><i></i>${esc(p.name)}${short ? '<em aria-hidden="true">★</em>' : ''}</span>
          <span class="rk-f"><span class="rk-bar"><i class="f"></i></span><b class="fv"></b></span><span class="rk-x">× ${p.market.toFixed(1)}</span>
          <span class="rk-p"><span class="rk-bar p"><i class="pv-bar"></i></span><b class="pv"></b></span>`;
        const tipHtml = () => `<b>${esc(p.name)}</b>${short ? '<span style="color:var(--gold-l)">★ Shortlisted in B-2.3.1</span><br>' : ''}${SCREEN.criteria.map((c) => `${esc(c.label)} ${p.s[c.id]}`).join(' · ')}
          <span class="tip-mk">Market attractiveness ${p.market.toFixed(1)}/5</span><span class="tip-mr"><em>Criticality: ${esc(p.crit[0])}</em>${esc(p.crit[1])}</span><span class="tip-mr"><em>Competition: ${esc(p.comp[0])}</em>${esc(p.comp[1])}</span>`;
        r.addEventListener('pointermove', (e) => showTip(tipHtml(), e.clientX, e.clientY));
        r.addEventListener('pointerleave', hideTip);
        r.addEventListener('focus', () => { const b = r.getBoundingClientRect(); showTip(tipHtml(), b.left + 320, b.bottom); });
        r.addEventListener('blur', hideTip);
        box.appendChild(r);
        rowEls[p.id] = r;
      });
      $('#scNote').innerHTML = `<span class="ll-star">★</span> shortlisted in B-2.3.1 · Market (1–5) = team judgement of criticality to launch or approval and how open the competition is; hover or focus a row for the reasoning · Draft scores, to calibrate as a team${citeHtml('b133')}`;
      update();
    }
    function update() {
      const W = SCREEN.criteria.reduce((a, c) => a + w[c.id], 0) || 1;
      SCREEN.criteria.forEach((c) => { $(`#wo-${c.id}`).textContent = `${Math.round((w[c.id] / W) * 100)}%`; });
      const r = ranking({ ...w });
      const changed = SCREEN.criteria.some((c) => c.w !== w[c.id]);
      r.forEach((x, k) => {
        const el = rowEls[x.p.id];
        el.style.top = k * ROW + 'px';
        el.classList.toggle('top3', k < 3);
        $('.rk-n', el).textContent = k + 1;
        $('.f', el).style.width = (x.f / 5) * 100 + '%';
        $('.fv', el).textContent = x.f.toFixed(2);
        $('.pv-bar', el).style.width = (x.pr / 25) * 100 + '%';
        $('.pv', el).textContent = x.pr.toFixed(1);
      });
      const sameSet = top3Key(r) === tgtIds.slice().sort().join();
      $('#ranks').dataset.state = changed ? 'custom' : 'team';
      const lead = changed ? (sameSet ? 'With your weights the same three Round 1 targets still lead. ' : '<b class="warn">With your weights the top three change.</b> ') : '';
      let rob = $('#robust');
      if (!rob) { rob = document.createElement('p'); rob.id = 'robust'; rob.className = 'robust'; rob.setAttribute('aria-live', 'polite'); $('#scNote').before(rob); }
      rob.innerHTML = (lead ? `<span>${lead}</span>` : '') + sensitivityHtml(sensitivity(w));
    }
    return { build, enter() {} };
  })();

  // =================================================================== v3 · TARGET DOSSIERS
  const dossier = (() => {
    const tabs = $('#doTabs'), panel = $('#doPanel');
    const head = $('#dpHead'), views = $('#dpViews'), body = $('#dpBody'), kill = $('#dpKill');
    let curId = DOSSIERS[0].id, curView = 'case';
    const VIEWS = ['case', 'who', 'evidence', 'test'];
    const isOld = (d) => !d.focus;
    // rank among all seven scored positions, from the same ranking the funnel slide uses
    const priorityRank = (id) => ranking().findIndex((x) => x.p.id === id) + 1;
    // sentence-case a fragment, leaving names such as dSPACE alone
    const cap = (s) => (/^[a-z][a-z]/.test(s) ? s[0].toUpperCase() + s.slice(1) : s);
    const li = (arr, cls) => `<ul class="${cls}">${arr.map((t) => `<li>${rich(t)}</li>`).join('')}</ul>`;
    // "dS-1 Product manager; …" becomes a list, with persona codes as small tags
    const people = (t) => `<ul class="ds-people">${t.split(/;\s*/).map((x) => {
      const m = x.match(/^((?:dS|AI|ME)-\d)\s+(.*)$/);
      return `<li>${m ? `<i>${m[1]}</i>${esc(m[2])}` : esc(cap(x))}</li>`;
    }).join('')}</ul>`;
    const ROLES = [
      ['users', 'Users', 'use it daily'],
      ['budget', 'Budget owners', 'decide and pay'],
      ['gate', 'Gatekeepers', 'can block adoption'],
      ['influence', 'Influencers', 'shape the choice'],
    ];
    function build() {
      const tab = (d) => {
        const old = isOld(d);
        return `<button role="tab" id="dt-${d.id}" aria-controls="doPanel" class="dt${d.screened ? ' scr' : ''}${old ? ' old' : ''}" data-id="${d.id}" style="${cv(d.colour)}">
          <span class="dt-n">${d.screened ? '✕' : old ? '#' + d.rank : d.rank}</span>
          <span class="dt-m"><b>${esc(d.title).replace('off-highway', 'off&#8209;highway')}</b>
            <span class="dt-s">${old ? `<small>${esc(d.was.status)}</small>` : `<em>${d.r2[0][1]}/25</em><small>${esc(d.r2[0][0])}</small>${confMeter(d.confidence.level)}`}</span></span></button>`;
      };
      tabs.innerHTML = `<div class="do-rail-h" role="presentation">W1 and W2, from the company screen</div>${DOSSIERS.filter((d) => d.focus).map(tab).join('')}
        <div class="do-rail-h old" role="presentation">Earlier targets, kept on record</div>${DOSSIERS.filter(isOld).map(tab).join('')}`;
      $$('.dt', tabs).forEach((b) => b.addEventListener('click', () => select(b.dataset.id)));
      tabs.addEventListener('keydown', (e) => {
        const bs = $$('.dt', tabs), i = bs.indexOf(document.activeElement);
        if (i < 0) return;
        let j = -1;
        if (e.key === 'ArrowDown') j = (i + 1) % bs.length; else if (e.key === 'ArrowUp') j = (i - 1 + bs.length) % bs.length;
        else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = bs.length - 1;
        if (j < 0) return;
        e.preventDefault(); e.stopPropagation(); bs[j].focus(); select(bs[j].dataset.id);
      });
      segCtl(views, (b) => setView(b.dataset.view));
      select(curId);
    }
    function headHtml(d) {
      const l = layerById(d.layer);
      if (d.focus) {
        return `<span class="dp-rank">${d.rank}</span>
        <div class="dp-t"><span class="dp-layer">Layer ${l.num} · ${esc(l.short)}<b class="dp-role">${esc(d.role)}</b></span><h3>${esc(d.title)}</h3><p class="dp-hook"><em>Hypothesis</em>${esc(d.hook)}</p></div>
        <div class="dp-score r2s" role="group" aria-label="Company screen scores">${d.r2.map(([n, s, k, t]) => `<div class="res-${k}"><small>${esc(n)}</small><b>${s}</b><span>${esc(t)}</span></div>`).join('')}</div>`;
      }
      const p = screenPos(d.id), f = feas(p);
      return `<span class="dp-rank">${d.screened ? '✕' : '#' + d.rank}</span>
        <div class="dp-t"><span class="dp-layer">Layer ${l.num} · ${esc(l.short)}<span class="dp-round1">Round 1 · 5 Oct</span></span><h3>${esc(d.title)}</h3><p class="dp-hook">${d.screened ? '' : '<em>Hypothesis</em>'}${esc(d.hook)}</p></div>
        <div class="dp-score" role="group" aria-label="Scores">
          <div><small>Feasibility</small><b>${f.toFixed(2)}</b><span>team fit, of 5</span></div><i aria-hidden="true">×</i>
          <div title="${esc(marketWhy(p))}"><small>Market</small><b>${p.market.toFixed(1)}</b><span>criticality ${esc(p.crit[0].toLowerCase())}<br>competition ${esc(p.comp[0].toLowerCase())}</span></div><i aria-hidden="true">=</i>
          <div class="pri"><small>Priority</small><b>${(f * p.market).toFixed(1)}</b><span>${priorityRank(d.id)} of ${SCREEN.positions.length} positions</span></div>
        </div>`;
    }
    const confidence = (d) => `<div class="ds-conf"><small>Evidence confidence</small>${confMeter(d.confidence.level)}<p>${esc(d.confidence.why)}</p></div>`;
    function viewHtml(d, v) {
      if (v === 'who') {
        return `<div class="ds-who">
          <div class="ds-roles">${ROLES.map(([k, t, s]) => `<section><h4>${t}<small>${s}</small></h4>${people(d[k === 'influence' ? 'influence' : k])}</section>`).join('')}</div>
          <div class="ds-yn"><section class="y"><h4>They say yes to</h4><p>${esc(d.yes)}</p></section><section class="n"><h4>They say no if</h4><p>${esc(d.no)}</p></section></div>
        </div>`;
      }
      if (v === 'evidence') {
        return `<div class="ds-ev">
          <section class="for"><h4>Evidence for</h4>${li(d.forE, 'for')}</section>
          <section class="against"><h4>Evidence against</h4>${li(d.against, 'against')}</section>
          ${confidence(d)}
        </div>`;
      }
      if (v === 'test') {
        const at = d.first.indexOf(':');
        const qs = d.first.slice(at + 1).trim().split(/(?<=\?)\s+/);
        return `<div class="ds-test">
          <section class="first"><h4>First test</h4><strong>${esc(d.first.slice(0, at))}</strong><ol>${qs.map((q) => `<li>${esc(q)}</li>`).join('')}</ol></section>
          <section><h4>Open commercial questions</h4>${li(d.biz, 'cq')}${d.focus ? '' : `<div class="ds-saidkill"><h4>We said we would drop it if</h4>${li(d.kill, 'cq')}</div>`}</section>
        </div>`;
      }
      return `<div class="ds-case">
        <section><h4>The pain</h4><p>${rich(d.problem)}</p></section>
        <section><h4>Our edge</h4><p>${rich(d.edge)}</p></section>
        <section class="wk"><h4>What they use today</h4><ul>${d.workaround.split(/;\s*|,\s+/).map((w) => `<li>${esc(cap(w))}</li>`).join('')}</ul></section>
      </div>`;
    }
    function screenedHtml(d) {
      return `<div class="ds-scr">
        <section><h4>The need</h4><p>${rich(d.problem)}</p></section>
        <section><h4>Why it was screened out</h4><p>${rich(d.edge)}</p></section>
        <section class="for"><h4>Evidence it matters</h4>${li(d.forE, 'for')}</section>
        <section class="against"><h4>Why we are not the team for it</h4>${li(d.against, 'against')}</section>
      </div>`;
    }
    function renderBody(d) {
      body.innerHTML = d.screened ? screenedHtml(d) : viewHtml(d, curView);
      body.classList.remove('in'); void body.offsetWidth; body.classList.add('in');
    }
    function setView(v) {
      if (!VIEWS.includes(v)) return;
      curView = v;
      body.setAttribute('aria-labelledby', `ds-${v}`);
      renderBody(DOSSIERS.find((x) => x.id === curId));
    }
    function select(id) {
      curId = id;
      const d = DOSSIERS.find((x) => x.id === id);
      $$('.dt', tabs).forEach((b) => { const on = b.dataset.id === id; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
      panel.setAttribute('aria-labelledby', `dt-${id}`);
      panel.style.cssText = cv(d.colour);
      panel.classList.toggle('scr', !!d.screened);
      head.innerHTML = headHtml(d);
      views.hidden = !!d.screened;
      kill.hidden = false;
      kill.classList.toggle('changed', !d.focus);
      kill.innerHTML = d.focus ? `<h4>We drop it if</h4>${li(d.kill, 'kl')}`
        : `<h4>What changed in Round 2: ${esc(d.was.status.toLowerCase())}</h4><div><p>${esc(d.was.text)}</p>${d.was.reopen ? `<p class="reopen">${esc(d.was.reopen)}</p>` : ''}</div>`;
      renderBody(d);
      if (!d.screened) segPlace('#dpViews');
    }
    function show(id, navigate) {
      if (mode.is('read')) { reader.jumpTo(`r-dossier-${id}`); return; }
      const onSlide = slides[cur].id === 's-dossier';
      if (navigate && !onSlide) { goId('s-dossier'); setTimeout(() => select(id), 120); } else select(id);
    }
    return { build, show, enter() { segPlace('#dpViews'); } };
  })();

  // =================================================================== v7 · HELPERS
  const r2Pair = (posId, coId) => ROUND2.pairs[`${posId}.${coId}`];
  const r2Total = (pair) => pair.s.reduce((a, b) => a + b, 0);
  const RES_ORDER = { pass: 0, cond: 1, near: 2, fail: 3 };

  // =================================================================== v7 · BUSINESS MODELS SLIDE
  const bmcSlide = {
    build() {
      const TAG = { core: 'Core', growth: 'Growth', future: 'Future bet' };
      $('#bmGrid').innerHTML = BMCS.map((b, k) => `
        <article class="bmc rv" style="--k:${b.colour};--d:${3 + k}">
          <header><span class="bmc-logo">${chip(b.logo, 'lg')}</span><span class="bmc-role">${esc(b.role)}</span></header>
          <p class="bmc-what">${esc(b.what)}${citeHtml(b.src)}</p>
          <div class="bmc-stats">${b.stats.map(([v, t]) => `<div><b>${esc(v)}</b><span>${esc(t)}</span></div>`).join('')}</div>
          <h4>How it makes money</h4>
          <ul class="bmc-money">${b.money.map(([g, t]) => `<li class="g-${g}"><i title="${TAG[g]}"></i>${esc(t)}</li>`).join('')}</ul>
          <h4>What protects it</h4>
          <p>${esc(b.moat)}</p>
          <div class="bmc-lesson"><h4>What it taught us</h4><p>${esc(b.lesson)}</p></div>
          <footer><a class="bmc-pdf" href="${esc(b.file)}" target="_blank" rel="noopener">Open the full canvas ↗ <small>PDF · ${b.nsrc} sources on page 2</small></a></footer>
        </article>`).join('');
      $('#bmFoot').innerHTML = `<span class="bmc-key"><i class="g-core"></i>Core business<i class="g-growth"></i>Growing<i class="g-future"></i>Future bet</span> The brief asks for two companies; we built three. Chapter 3 tests our ideas against these same three.`;
    },
  };

  // =================================================================== v7 · ROUND 2 COMPANY SCREEN
  const round2 = (() => {
    let sel = 'adas.ds';
    function cell(pos, co) {
      const key = `${pos.id}.${co.id}`, p = r2Pair(pos.id, co.id), t = r2Total(p);
      return `<button class="r2c res-${p.res}" type="button" data-key="${key}" style="--i:${ROUND2.positions.indexOf(pos) * 3 + ROUND2.companies.indexOf(co)}" aria-label="${esc(pos.name)} with ${esc(co.name)}: ${t} of 25, ${esc(p.label)}">
        <b>${t}</b><span class="r2c-l">${esc(p.cell || p.label.split(':')[0])}</span>
        <span class="r2c-bars" aria-hidden="true">${p.s.map((v) => `<i style="--v:${v}"></i>`).join('')}</span></button>`;
    }
    function panel() {
      const [posId, coId] = sel.split('.');
      const pos = ROUND2.positions.find((x) => x.id === posId), co = ROUND2.companies.find((x) => x.id === coId), p = r2Pair(posId, coId), t = r2Total(p);
      $('#r2Panel').innerHTML = `<header><div><small>${esc(co.name)}</small><h3>${esc(pos.name)}</h3></div><div class="r2p-t res-${p.res}"><b>${t}</b><span>of 25</span></div></header>
        <div class="r2p-res"><span class="res res-${p.res}">${esc(p.label)}</span></div>
        <p class="r2p-dec">${esc(p.decide)}</p>
        <ul class="r2p-crit">${ROUND2.criteria.map((c, i) => `<li><span class="r2p-l">${esc(c.label)}</span><span class="r2p-b"><i style="--v:${p.s[i]}"></i></span><b>${p.s[i]}</b><p>${esc(p.why[i])}</p></li>`).join('')}</ul>
        ${p.margin ? `<p class="r2p-m"><b>How firm is it?</b> ${esc(p.margin)}</p>` : ''}`;
      $$('.r2c', $('#r2Matrix')).forEach((b) => { const on = b.dataset.key === sel; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
    }
    function build() {
      $('#r2Matrix').innerHTML = `<div class="r2h"></div>${ROUND2.companies.map((c) => `<div class="r2h co"><span>${chip(c.logo, 'lg')}</span><small>${esc(c.tag)}</small></div>`).join('')}
        ${ROUND2.positions.map((pos) => `<div class="r2r" style="${cv(pos.colour)}"><b>${esc(pos.name)}</b><small>${esc(pos.sub)}</small></div>${ROUND2.companies.map((co) => cell(pos, co)).join('')}`).join('')}`;
      $$('.r2c', $('#r2Matrix')).forEach((b) => b.addEventListener('click', () => { sel = b.dataset.key; panel(); }));
      $('#r2Foot').innerHTML = `<b>How a pair passes.</b> ${esc(ROUND2.rule)}${citeHtml('b133v2')}`;
      panel();
    }
    return { build };
  })();

  // =================================================================== v7 · HOW OUR THINKING CHANGED
  const evolve = (() => {
    const W = 900, ROW = 54, TOP = 42, FROM_R = 318, TO_L = 582;
    let cur = 'adas', walk = null, built = false, onSlide = false;
    const order = () => ranking().map((x, i) => ({ id: x.p.id, rank: i + 1, p: x.p, pr: x.pr }));
    const yAt = (i) => TOP + ROW * i + (ROW - 8) / 2;
    const KIND_C = { lead: '#fcd34d', second: '#e879f9', ext: '#67e8f9', out: '#64748b' };
    function select(id, fromWalk) {
      cur = id;
      if (!fromWalk) stopWalk();
      $$('.ev-n', $('#evTrace')).forEach((n) => { const on = n.dataset.id === id; n.classList.toggle('on', on); n.setAttribute('aria-selected', String(on)); });
      $$('.ev-l', $('#evLines')).forEach((l) => l.classList.toggle('on', l.dataset.id === id));
      const line = $(`.ev-l[data-id="${id}"]`, $('#evLines'));
      const pulse = $('#evPulse');
      if (pulse) pulse.innerHTML = '';
      if (line && pulse && !REDUCE && onSlide) {
        pulse.innerHTML = `<animateMotion dur="1.9s" repeatCount="indefinite" path="${line.getAttribute('d')}"/>`;
        pulse.setAttribute('fill', line.getAttribute('stroke') === KIND_C.out ? '#94a3b8' : line.getAttribute('stroke'));
        try { pulse.firstChild.beginElement(); } catch (e) { /* SMIL not started yet */ }
      }
      const s = EVOLUTION.stories[id], end = EVOLUTION.ends.find((e) => e.from === id), o = order().find((x) => x.id === id);
      const box = $('#evStory');
      box.className = `ev-story k-${end.kind}`;
      box.innerHTML = `<header><span class="evs-tag">${esc(end.tag)}</span><h3>${esc(end.title)}</h3></header>
        <div class="evs-row"><h5>What we thought <small>Round 1, #${o.rank} of 7</small></h5><p>${esc(s.thought)}</p></div>
        <div class="evs-row"><h5>What we learned</h5><p>${esc(s.learned)}</p></div>
        <div class="evs-row act"><h5>What we do now</h5><p>${esc(s.now)}</p></div>
        <p class="evs-cav">${esc(s.caveat)}</p>`;
    }
    function stopWalk() { if (walk) { clearInterval(walk); walk = null; } const b = $('#evWalk'); if (b) { b.classList.remove('on'); b.textContent = 'Walk through it'; } }
    function startWalk() {
      const ids = EVOLUTION.ends.map((e) => e.from); let i = 0;
      select(ids[0], true);
      $('#evWalk').classList.add('on'); $('#evWalk').textContent = 'Stop';
      walk = setInterval(() => { i += 1; if (i >= ids.length) { stopWalk(); return; } select(ids[i], true); }, 5200);
    }
    function build() {
      if (built) return; built = true;
      const o = order();
      $('#evTime').innerHTML = EVOLUTION.timeline.map((t) => `<li class="${t.on ? 'done' : ''}"><b>${esc(t.d)}</b><span>${esc(t.t)}</span></li>`).join('');
      $('#evFrom').innerHTML = o.map((x) => `<button class="ev-n" type="button" role="option" data-id="${x.id}" style="top:${yAt(o.indexOf(x)) - 23}px;${cv(layerById(x.p.layer).colour)};--i:${o.indexOf(x)}">
        <span class="ev-rk">${x.rank}</span><span class="ev-nm">${esc(x.p.name)}</span><span class="ev-pr">${x.pr.toFixed(1)}</span></button>`).join('');
      $('#evTo').innerHTML = EVOLUTION.ends.map((e, i) => `<button class="ev-n end k-${e.kind}" type="button" data-id="${e.from}" style="top:${yAt(i) - 23}px;--i:${i}"><span class="ev-nm">${esc(e.title)}</span><span class="ev-tg">${esc(e.tag)}</span></button>`).join('');
      const lines = $('#evLines');
      EVOLUTION.ends.forEach((e, i) => {
        const fi = o.findIndex((x) => x.id === e.from);
        const y1 = yAt(fi), y2 = yAt(i), mx = (FROM_R + TO_L) / 2;
        const p = svgEl('path', { d: `M${FROM_R},${y1} C${mx},${y1} ${mx},${y2} ${TO_L},${y2}`, stroke: KIND_C[e.kind], pathLength: 1, class: `ev-l k-${e.kind}`, 'data-id': e.from, style: `--i:${i}` });
        lines.appendChild(p);
      });
      lines.appendChild(svgEl('circle', { id: 'evPulse', r: 5, fill: KIND_C.lead }));
      $$('.ev-n', $('#evTrace')).forEach((n) => {
        n.addEventListener('click', () => select(n.dataset.id));
        n.addEventListener('pointerenter', () => select(n.dataset.id));
        n.addEventListener('focus', () => select(n.dataset.id));
      });
      $('#evWalk').addEventListener('click', () => { if (walk) stopWalk(); else startWalk(); });
      // v12: only the four reasons stay on the slide; what stayed the same and what we still
      // don't know live in the reading view and on the Risks & gaps slide
      $('#evWhy').innerHTML = EVOLUTION.why.map((w, i) => `<div tabindex="0" data-tip="${esc(w.d)}"><b>${i + 1}</b><span><strong>${esc(w.t)}.</strong> ${esc(EVOLUTION.whyShort ? EVOLUTION.whyShort[i] : w.d)}</span></div>`).join('');
      select('adas', true);
    }
    return { build, enter() { onSlide = true; select(cur, true); }, leave() { onSlide = false; stopWalk(); const p = $('#evPulse'); if (p) p.innerHTML = ''; } };
  })();

  // =================================================================== v7 · PERSONAS
  const personaSlide = (() => {
    const CO = { ds: ['dSPACE', '#4fd1c5'], ai: ['Applied Intuition', '#f6ad55'], me: ['Mobileye (near-miss)', '#b794f4'] };
    function open(p) {
      const d = $('#peDlg');
      $('img', d).src = p.img; $('img', d).alt = `Full persona card: ${p.name}, a fictional archetype`;
      $('a', d).href = p.img;
      $('.pe-dlg-t', d).innerHTML = `<b>${esc(p.code)} · ${esc(p.name)}</b><span class="arch">Archetype</span><small>A fictional persona built from public job postings; the quote is imagined. Scroll to read the whole card.</small>`;
      d.showModal();
      d.scrollTop = 0;
    }
    function build() {
      // v15: the persona slide merged into "Who we will interview"; only the dialog is built here
      const d = document.createElement('dialog');
      d.id = 'peDlg'; d.className = 'pe-dlg'; d.setAttribute('aria-label', 'Full persona card');
      d.innerHTML = '<div class="pe-dlg-h"><div class="pe-dlg-t"></div><a target="_blank" rel="noopener">Open full size ↗</a><button type="button" class="tog">Close</button></div><img alt="">';
      document.body.appendChild(d);
      $('button', d).addEventListener('click', () => d.close());
      d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
    }
    function buildOld() {
      $('#peLegend').innerHTML = Object.values(CO).map(([n, c]) => `<span><i style="background:${c}"></i>${esc(n)}</span>`).join('');
      $('#peGrid').innerHTML = PERSONAS.map((p, k) => `<button type="button" class="pc rv${p.near ? ' near' : ''}" data-i="${k}" style="--k:${CO[p.co][1]};--d:${3 + k * .6}">
        <span class="pc-av">${esc(p.ini)}<small>${esc(p.code)}</small></span>
        <span class="pc-m"><b>${esc(p.name)}</b><span>${esc(p.title)} · ${esc(p.company)}</span></span>
        <span class="pc-tags"><em class="${p.prime ? 'prime' : ''}">${esc(p.tag)}</em><i>Interview #${p.rank}</i></span>
        <span class="pc-role">${esc(p.role)}</span>
        <small class="pc-qtag">Imagined quote</small><q>${esc(p.quote)}</q></button>`).join('');
      $$('.pc', $('#peGrid')).forEach((b) => b.addEventListener('click', () => open(PERSONAS[+b.dataset.i])));
      $('#peIns').innerHTML = PERSONA_INSIGHTS.map((x) => `<div><b>${esc(x.t)}</b><span>${esc(x.d)}</span></div>`).join('');
      const d = document.createElement('dialog');
      d.id = 'peDlg'; d.className = 'pe-dlg'; d.setAttribute('aria-label', 'Full persona card');
      d.innerHTML = '<img alt=""><div class="pe-dlg-b"><a target="_blank" rel="noopener">Open full size ↗</a><button type="button" class="tog">Close</button></div>';
      document.body.appendChild(d);
      $('button', d).addEventListener('click', () => d.close());
      d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
    }
    return { build, open };
  })();

  // =================================================================== v8 · WEDGE HYPOTHESES (B-2.3.4)
  const wedgeSlide = (() => {
    const W = WEDGES;
    let sel = 'all', view = 'wedge';
    const G = { D: 'Desirability', F: 'Feasibility', V: 'Viability' };
    const col = { w1: 3, w2: 4, w3: 5 };
    const fmt = (n) => String(Math.round(n * 100) / 100);
    function totals() {
      const max = { D: 0, F: 0, V: 0 };
      const out = W.list.map(() => ({ D: 0, F: 0, V: 0 }));
      W.dfv.forEach((r) => {
        max[r[0]] += 5 * r[2];
        W.list.forEach((w, i) => { out[i][r[0]] += r[col[w.id]] * r[2]; });
      });
      const fvMax = max.F + max.V;
      out.forEach((t) => { t.T = t.D + t.F + t.V; t.pos = (t.D / max.D + (t.F + t.V) / fvMax) / 2; });
      return { max, out, T: max.D + fvMax };
    }
    const scoreTable = (cls = 'wd-tb') => `<table class="${cls}"><thead><tr><th>Criterion (weight)</th>${W.list.map((w) => `<th class="n">${w.code}</th>`).join('')}<th>Basis</th></tr></thead><tbody>${
      ['D', 'F', 'V'].map((g) => `<tr class="wd-g"><td colspan="5">${G[g]}</td></tr>${W.dfv.filter((r) => r[0] === g).map((r) => `<tr><td>${esc(r[1])} <small>${r[2]}</small></td><td class="n">${r[3]}</td><td class="n">${r[4]}</td><td class="n">${r[5]}</td><td class="b">${esc(r[6])}</td></tr>`).join('')}`).join('')
    }</tbody></table>`;
    const resultTable = (cls = 'wd-tb') => {
      const t = totals();
      const row = (l, k) => `<tr><td>${l}</td>${t.out.map((x) => `<td class="n">${fmt(x[k])}</td>`).join('')}<td class="n">${fmt(t.max[k])}</td></tr>`;
      return `<table class="${cls} wd-res"><thead><tr><th>Result</th>${W.list.map((w) => `<th class="n">${w.code}</th>`).join('')}<th class="n">Max</th></tr></thead><tbody>${row('Desirability', 'D')}${row('Feasibility', 'F')}${row('Viability', 'V')}
        <tr class="wd-tot"><td>Total</td>${t.out.map((x) => `<td class="n">${fmt(x.T)}</td>`).join('')}<td class="n">${fmt(t.T)}</td></tr>
        <tr><td>Position in range</td>${t.out.map((x) => `<td class="n">${Math.round(x.pos * 100)}%</td>`).join('')}<td class="n">Middle: 45–70%</td></tr></tbody></table>`;
    };
    const marketTable = (w, cls = 'wd-tb') => `<table class="${cls}"><thead><tr><th>Level</th><th>Arithmetic</th><th class="n">${w.marketHead[0]}</th><th class="n">${w.marketHead[1]}</th></tr></thead><tbody>${w.market.map((m) => `<tr><td><b>${esc(m[0])}</b></td><td>${rich(m[1])}</td><td class="n">${esc(m[2])}</td><td class="n">${esc(m[3])}</td></tr>`).join('')}</tbody></table>`;
    const planTable = (w, cls = 'wd-tb') => `<table class="${cls}"><thead><tr><th>Hypothesis</th><th>Type</th><th>Test</th><th>Fails if</th><th>Evidence source</th></tr></thead><tbody>${w.plan.map((p) => `<tr><td><b>${esc(p[0])}</b></td><td>${esc(p[1])}</td><td>${esc(p[2])}</td><td>${esc(p[3])}</td><td>${esc(p[4] || '')}</td></tr>`).join('')}</tbody></table>`;
    const painTable = (w, cls = 'wd-tb') => `<table class="${cls}"><thead><tr><th>Persona</th><th>Their pain</th><th>How this wedge answers it</th></tr></thead><tbody>${w.pains.map((p) => `<tr><td><b>${esc(p[0])}</b></td><td>${esc(p[1])}</td><td>${esc(p[2])}</td></tr>`).join('')}</tbody></table>`;
    const card = (w) => [['End user', w.user], ['Pain', w.pain], ['Our narrow first foothold', w.wedge], ['Input', w.input], ['Output', w.output], ['What changes for the user', w.change], ['Workaround today', w.workaround], ['Budget owner', w.owner]];
    // v15: the default view puts all three wedges side by side, so the slide makes its point
    // (and names the weakest) without a click; each column opens that wedge's full canvas.
    function allHtml() {
      const t = totals();
      const cols = W.list.map((w, i) => {
        const cv = WEDGE_CV[w.id], weak = w.id === 'w2';
        const bars = [['D', 'Desirability'], ['F', 'Feasibility'], ['V', 'Viability']].map(([k, g]) => {
          const p = Math.round((t.out[i][k] / t.max[k]) * 100);
          return `<span class="wa-b" title="${g}: ${p}% of the maximum desk score"><em>${k}</em><i><u style="width:${p}%"></u></i><b>${p}%</b></span>`;
        }).join('');
        return `<button type="button" class="wa-c${weak ? ' weak' : ''}" data-w="${w.id}" style="--k:var(--${w.colour}-m)">
          <header><i>${esc(w.code)}</i><span><b>${esc(w.name)}</b><small>${esc(weak ? 'Weakest today' : w.tag)}</small></span></header>
          <p class="wa-vp">${esc(w.vp)}</p>
          <div class="wa-r"><small>First interview question</small><p>${esc(w.ask)}</p></div>
          <div class="wa-r kill"><small>We drop it if</small><p>${esc(cv.D[2])}</p></div>
          <div class="wa-r"><small>Who pays</small><p>${esc(w.payer)}</p></div>
          <div class="wa-bars"><small>Desk scores before interviews</small>${bars}</div>
          <span class="wa-go">Full canvas and test plan →</span></button>`;
      }).join('');
      return `<div class="wa">${cols}</div><p class="wa-weak"><b>Weakest</b> ${esc(W.weakestShort)}</p>`;
    }
    function body() {
      if (sel === 'all') return allHtml();
      if (sel === 'dfv') {
        const t = totals();
        const bars = W.list.map((w, i) => `<div class="dfv-w" style="--k:var(--${w.colour}-m)"><span class="dfv-n"><b>${w.code}</b>${esc(w.name)}</span>${['D', 'F', 'V'].map((g) => { const p = Math.round((t.out[i][g] / t.max[g]) * 100); return `<span class="dfv-b"><i style="width:${p}%"></i><em>${G[g]} ${p}%</em></span>`; }).join('')}<strong>${Math.round(t.out[i].pos * 100)}%<small>overall</small></strong></div>`).join('');
        return `<div class="wd-h"><div><b>DFV scoring</b><span>Which wedge looks strongest before interviews</span></div></div>
          <div class="dfv-vis">${bars}</div><p class="wd-note dfv-how">${esc(SCORE_HOW.dfv)}${citeHtml('w-dfv')}</p><p class="wd-weak">${esc(W.weakest)}</p>
          <details class="dfv-det"><summary>Show all 14 criteria and scores</summary><div class="wd-dfv"><div class="wd-dfv-l">${scoreTable()}</div><div class="wd-dfv-r">${resultTable()}<p class="wd-note">${rich(W.dfvNote)}</p></div></div></details>`;
      }
      const w = W.list.find((x) => x.id === sel);
      const views = [['wedge', 'Overview'], ['personas', 'Who has it'], ['market', 'Market & assumptions'], ['test', 'Full test plan']];
      let v = '';
      if (view === 'wedge') {
        // v14: the wedge as a picture. Hypothesis; a four-step flow (who, pain, offer, market);
        // then desirability, feasibility and viability as three test cards: assume, test, drop.
        const t = totals(), i = W.list.indexOf(w), cv = WEDGE_CV[w.id];
        const sam = w.market.find((m) => /SAM/.test(m[0])) || w.market[w.market.length - 1];
        const COLS = [['Desirability', 'D', 'Do they want it?'], ['Feasibility', 'F', 'Can we build it?'], ['Viability', 'V', 'Will someone pay?']];
        const col = ([g, k, q]) => {
          const pct = Math.round((t.out[i][k] / t.max[k]) * 100), [a, test, kill] = cv[k], weak = w.weakCol === g;
          const m = w.plan.filter((p) => p[1] === g).length - 1;
          return `<section class="tc${weak ? ' weak' : ''}"><header><i>${k}</i><span><b>${g}</b><small>${q}</small></span>${weak ? '<em title="The assumption with the least evidence behind it. This is about confidence, not the desk score.">Least tested</em>' : ''}</header>
            <div class="tc-m" title="Desk score before any interview: ${pct}% of the maximum"><i style="width:${pct}%"></i><span>${pct}% desk score${weak ? ' · untested' : ''}</span></div>
            <ol><li><small>We assume</small>${esc(a)}</li><li><small>Studio 2 test</small>${esc(test)}</li><li class="kill"><small>Drop it if</small>${esc(kill)}</li></ol>
            ${m > 0 ? `<button type="button" class="tc-more" data-v="test">+${m} more test${m > 1 ? 's' : ''} in the full plan</button>` : ''}</section>`;
        };
        v = `<p class="wv-hyp"><b>We believe</b> ${esc(w.hyp.replace(/^We believe /, ''))}</p>
          <p class="wv-links"><span><b>Our vehicle</b> ${esc(w.vehicle)}</span><span><b>Who pays</b> ${esc(w.payer)}</span>${w.promise ? `<span><b>Promise</b> ${esc(w.promise.replace(/^Promise to test by /, 'to test by '))}</span>` : ''}</p>
          <div class="wv-flow">
            <div><small>Who has it</small><p>${esc(cv.who)}</p></div>
            <div><small>Their pain today</small><p>${esc(cv.pain)}</p></div>
            <div><small>What we would offer</small><p>${esc(cv.offer)}</p><em>${esc(cv.start)}</em></div>
            <div class="mk"><small>Market direction · ${esc(sam[0])}</small><p><b>${esc(sam[2])}</b><span>→</span><b>${esc(sam[3])}</b></p><em>${esc(w.marketHead[0])} → ${esc(w.marketHead[1])}, top-down, our assumptions. <button type="button" data-v="market">How we sized it</button></em></div>
          </div>
          <div class="wv-tests">${COLS.map(col).join('')}</div>
          <p class="wv-foot"><b>Weakest link</b> ${esc(w.weak)}. <button type="button" data-w="dfv">How the desk scores were made →</button></p>`;
      }
      if (view === 'personas') v = `${painTable(w)}<p class="wd-note"><b>Personas:</b> ${esc(w.personas)}.</p><p class="wd-note">${esc(w.origin)}</p>`;
      if (view === 'market') v = `<p class="wd-weak"><b>Weakest technical assumption:</b> ${esc(w.weakTech)}</p>${marketTable(w)}<p class="wd-note">${rich(w.marketNote)}</p><h5 class="wd-sub">What is still missing</h5><ul class="wd-list">${w.missing.map((m) => `<li>${esc(m)}</li>`).join('')}</ul><h5 class="wd-sub">Technical assumptions</h5><ul class="wd-list">${w.assume.map((a) => `<li>${rich(a)}</li>`).join('')}</ul>`;
      if (view === 'test') v = `${planTable(w)}<p class="wd-note"><b>Personas:</b> ${esc(w.personas)}.</p><p class="wd-weak"><b>Weakest link:</b> ${esc(w.weak)}.</p>`;
      return `<div class="wd-h"><div><b>${esc(w.code)}. ${esc(w.name)}</b><span>${esc(w.tag)} · Low confidence · ${esc(w.from)}</span></div>
        <div class="seg-lite" role="tablist" aria-label="Wedge sections">${views.map(([id, t]) => `<button type="button" role="tab" aria-selected="${view === id}" class="${view === id ? 'on' : ''}" data-v="${id}">${t}</button>`).join('')}</div></div><div class="wd-b">${v}</div>`;
    }
    function render() {
      const items = [['all', '1–3', 'All three', 'Side by side', 'Lsix'], ...W.list.map((w) => [w.id, w.code, w.name, w.id === 'w2' ? 'Weakest today' : w.tag, w.colour]), ['dfv', 'DFV', 'How we scored them', '14 criteria', 'Lfive']];
      $('#wdTabs').innerHTML = items.map(([id, c, n, t, k]) => `<button type="button" role="tab" aria-selected="${sel === id}" class="wd-t${sel === id ? ' on' : ''}" data-w="${id}" style="--k:var(--${k}-m)"><i>${c}</i><span><b>${esc(n)}</b><small>${esc(t)}</small></span></button>`).join('') + `<p class="wd-rn">${esc(W.intro)}</p>`;
      $('#wdPanel').innerHTML = body();
      hydrateCites();
      $('#wdPanel').scrollTop = 0;
    }
    function build() {
      render();
      $('#wdTabs').addEventListener('click', (e) => { const b = e.target.closest('[data-w]'); if (b) { sel = b.dataset.w; view = 'wedge'; render(); } });
      $('#wdPanel').addEventListener('click', (e) => {
        const bw = e.target.closest('[data-w]'); if (bw) { sel = bw.dataset.w; view = 'wedge'; render(); return; }
        const b = e.target.closest('[data-v]'); if (b) { view = b.dataset.v; render(); }
      });
    }
    function readerHtml(sec) {
      const t = 'r-table';
      return sec('r-wedges', 'B-2.3.4 · Candidate wedge hypotheses', 'Three wedges, each with a test that could kill it',
        `<p>${esc(W.focus)} ${esc(W.intro)}</p>${W.list.map((w) => `<article class="r-wd" id="r-wedge-${w.id}" style="--k:var(--${w.colour}-m)"><h3>${esc(w.code)}. ${esc(w.name)} <em>${esc(w.tag)} · Confidence: Low</em></h3>
          <p><b>Problem.</b> ${esc(w.problem)}</p><p class="r-wd-h">${esc(w.hyp)}</p><p class="r-dim">${esc(w.origin)}</p>
          <div class="r-scroll"><table class="${t}"><tbody>${card(w).map(([k, x]) => `<tr><th scope="row">${k}</th><td>${esc(x)}</td></tr>`).join('')}<tr><th scope="row">Part of EcoCAR it addresses</th><td>Driverless Mobility (GM). ${esc(w.fit)}</td></tr></tbody></table></div>
          <h4>Persona pains this wedge answers</h4><div class="r-scroll">${painTable(w, t)}</div>
          <p class="r-weak"><b>Weakest technical assumption:</b> ${esc(w.weakTech)}</p>
          <h4>Early top-down market proxy</h4><div class="r-scroll">${marketTable(w, t)}</div><p class="r-dim">${rich(w.marketNote)}</p>
          <h4>What is still missing</h4><ul>${w.missing.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>
          <h4>Technical assumptions</h4><ul>${w.assume.map((a) => `<li>${rich(a)}</li>`).join('')}</ul>
          <h4>Studio 2 validation plan</h4><div class="r-scroll">${planTable(w, t)}</div>
          <p class="r-note"><b>Personas:</b> ${esc(w.personas)}. <b>Weakest link:</b> ${esc(w.weak)}.</p></article>`).join('')}
         <h3>DFV scoring</h3><div class="r-scroll">${scoreTable(t)}</div><div class="r-scroll">${resultTable(t)}</div><p class="r-note">${rich(W.dfvNote)} ${esc(W.weakest)}</p>`,
        'Who has the problem, what we would offer, how big it could be, and how Studio 2 tests it. We describe our approach in general terms and keep the method private.');
    }
    const pct = () => totals().out.map((x) => Math.round(x.pos * 100));
    function show(id) { sel = id; view = 'wedge'; render(); goId('s-wedges'); }
    return { build, enter: render, readerHtml, pct, show };
  })();

  // =================================================================== v12 · CONTENTS, OUTREACH, SOCIETY, RISKS, ASKS
  // Replaces the v10 reviewer guide and the v3 risks + plan slide. The scorecard
  // map is kept, one click away, in a dialog on the contents slide.
  const extra = (() => {
    const slides = () => [...document.querySelectorAll('#deck > .slide')];
    const no = (id) => slides().findIndex((s) => s.id === id) + 1;
    const nm = (id) => { const s = document.getElementById(id); return s ? s.dataset.title : id; };
    const rid = (id) => (id === 's-fc' ? 'r-audit' : id.replace(/^s-/, 'r-'));
    const inCh = (cid) => slides().filter((s) => s.dataset.ch === cid);
    const chName = (cid) => { const c = CHAPTERS.find((x) => x.id === cid); return c.n === 'A' ? c.name : `${c.n} · ${c.short || c.name}`; };
    const chRange = (ids) => { const ns = ids.map((id) => CHAPTERS.find((c) => c.id === id).n); return ns.length > 1 ? `Chapters ${ns[0]}–${ns[ns.length - 1]}` : `Chapter ${ns[0]}`; };
    const pipeRows = () => PIPELINE.rows.slice().sort((a, b) => (a.n === 'Parked') - (b.n === 'Parked'));
    const ST = { 'In progress': 'on', Parked: 'park', 'Not started': 'new' };

    const guide = (link) => `<div class="gd">${GUIDE.groups.map((g) => `<section class="gd-g"><h5>${esc(g.cat)}</h5>${g.rows.map((r) => `<div class="gd-r"><span class="gd-q">${esc(r.q)}</span><span class="gd-w">${r.where.map(([id, x]) => link(id, x)).join('')}</span></div>`).join('')}</section>`).join('')}</div>`;
    const pipeTable = (cls) => `<table class="${cls}"><thead><tr><th class="n">#</th><th>Persona</th><th>Who we look for</th><th class="n">Wedges</th><th>Channel</th><th>Status and next step</th></tr></thead><tbody>${pipeRows().map((r, i) => `<tr><td class="n">${i + 1}</td><td><b>${esc(r.p)}</b></td><td>${esc(r.who)}</td><td class="n">${esc(r.w)}</td><td>${esc(r.ch)} <span class="pl-k k-${r.kind.toLowerCase()}">${esc(r.kind)}</span></td><td><span class="pl-st st-${ST[r.n] || 'on'}">${esc(r.n)}</span> ${esc(r.next)}</td></tr>`).join('')}</tbody></table>`;
    const socTable = (cls) => `<table class="${cls}"><thead><tr><th></th><th>What could go wrong</th><th>What we do about it</th><th>Still open</th></tr></thead><tbody>${SOCIETY.rows.map((r) => `<tr><td><b>${esc(r[0])}</b></td><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td></tr>`).join('')}</tbody></table>`;
    const gapTable = (cls) => `<table class="${cls}"><thead><tr><th>Area</th><th>Gap</th><th>Action</th><th class="n">By</th></tr></thead><tbody>${GAPS.map((g) => `<tr><td><b>${esc(g[0])}</b></td><td>${esc(g[1])}</td><td>${esc(g[2])}</td><td class="n">${esc(g[3])}</td></tr>`).join('')}</tbody></table>`;
    const indep = PIPELINE.rows.filter((r) => r.kind !== 'Sponsor').length;

    function scorecard() {
      let d = $('#scDlg');
      if (!d) {
        d = document.createElement('dialog');
        d.id = 'scDlg'; d.className = 'sc-dlg'; d.setAttribute('aria-labelledby', 'scDlgH');
        d.innerHTML = `<header><div><small>Check-In 1 scorecard</small><h3 id="scDlgH">Where each scorecard question is answered</h3></div><button type="button" class="tog" data-close>Close</button></header>`
          + guide((id, x) => `<button type="button" data-gs="${id}"><em>${no(id)}</em>${esc(nm(id))}${x ? `<small>${esc(x)}</small>` : ''}</button>`)
          + `<p class="sc-note">You do not need this to follow the portfolio: the chapters already answer these questions in order. It is here for reviewers checking coverage.</p>`;
        document.body.appendChild(d);
        d.addEventListener('click', (e) => {
          if (e.target === d || e.target.closest('[data-close]')) { d.close(); return; }
          const b = e.target.closest('[data-gs]'); if (b) { d.close(); goId(b.dataset.gs); }
        });
      }
      d.showModal();
    }

    function build() {
      // contents: one card per chapter
      $('#mpGrid').innerHTML = CHAPTERS.filter((c) => typeof c.n === 'number').map((c, k) => `<article class="mp-ch rv" style="--d:${3 + k}">
          <header><b>${c.n}</b><span>${esc(c.name)}</span>${c.code ? `<i>${esc(c.code)}</i>` : ''}</header>
          <p>${esc(c.q)}</p>
          <ol>${inCh(c.id).map((s) => `<li><button type="button" data-gs="${s.id}"><em>${no(s.id)}</em>${esc(s.dataset.title)}</button></li>`).join('')}</ol></article>`).join('');
      $('#mpCheck').innerHTML = `<div class="mp-ci"><span class="mp-k">Check-In 1 asks for</span>${CHECKIN.map((x) => `<button type="button" data-gs="${inCh(x.ch[0])[0].id}"><b>${esc(x.code)}</b><span>${esc(x.t)}</span><small>${chRange(x.ch)}</small></button>`).join('')}</div>
        <p class="mp-terms"><span>Key terms</span>${KEY_TERMS.map(([t, d]) => `<b>${esc(t)}</b> ${esc(d)}`).join(' · ')}. Full glossary in the evidence audit.</p>
        <div class="mp-tools"><button type="button" class="tog" id="mpScore">Scorecard map</button><span class="mp-appx">Appendix: ${inCh('appx').map((s) => `<button type="button" data-gs="${s.id}">${esc(s.dataset.title)}</button>`).join(' · ')}</span></div>`;
      $('#s-map').addEventListener('click', (e) => { const b = e.target.closest('[data-gs]'); if (b) goId(b.dataset.gs); });
      $('#mpScore').addEventListener('click', scorecard);

      // outreach plan
      $('#plBody').innerHTML = `${pipeTable('wd-tb x-tb pl-tb')}
        <div class="pl-sum"><div><b>~10</b><span>${esc(PIPELINE.aimShort)}</span></div><div><b>${indep} of ${PIPELINE.rows.length}</b><span>channels use independent outreach (one alongside a sponsor contact), so at least half of our interviews can come from independent outreach, as Studio 2 requires</span></div></div>
        <div class="pl-rules"><p><b>How we reach out</b> ${PIPELINE.rules.map(esc).join(' · ')}</p><p><b>How we interview</b> ${PLAN.rules.map(esc).join(' · ')}</p></div>`;

      // innovation in society: one card per area
      $('#soBody').innerHTML = SOCIETY.rows.map((r, k) => `<article class="so-c rv" style="--d:${3 + k}"><h4>${esc(r[0])}</h4>
          <h5>Could go wrong</h5><p>${esc(r[1])}</p><h5 class="do">What we do</h5><p class="do">${esc(r[2])}</p><h5 class="op">Still open</h5><p class="op">${esc(r[3])}</p></article>`).join('')
        + `<p class="so-note rv" style="--d:9">${esc(SOCIETY.note)}</p>`;

      // risks & gaps
      $('#riskCards').innerHTML = RISKS.map((r, k) => `<article class="rg rv" style="--d:${3 + k}"><div class="rg-k">${esc(r.k)}</div><div class="rg-n">${esc(r.n)}</div><p>${esc(r.t)}</p>
          <div class="rg-do"><h5>What we do</h5><p>${esc(r.act)}</p><span class="rg-by">By ${esc(r.by)}</span></div></article>`).join('');
      $('#gpBody').innerHTML = `<h5>Smaller gaps we are closing</h5>${gapTable('wd-tb x-tb')}`;

      // questions for reviewers
      $('#askList').innerHTML = ASKS.map((q, k) => `<li class="rv" style="--d:${3 + k}"><b>${k + 1}</b><span>${esc(q)}</span></li>`).join('');
      $('#askEnd').innerHTML = `<span>That is the end of the main story. The appendix has the detail behind it:</span>${inCh('appx').map((s) => `<button type="button" class="tog" data-gs="${s.id}">${esc(s.dataset.title)}</button>`).join('')}`;
      $('#askEnd').addEventListener('click', (e) => { const b = e.target.closest('[data-gs]'); if (b) goId(b.dataset.gs); });
    }

    function readerMap(sec) {
      return sec('r-map', 'Contents', 'Five chapters, in the order of the Studio 1 brief',
        `<ol class="r-chs">${CHAPTERS.filter((c) => typeof c.n === 'number').map((c) => `<li><b>${c.n}. ${esc(c.name)}</b>${c.code ? ` <small>${esc(c.code)}</small>` : ''}<span>${esc(c.q)}</span><span class="r-dim">${inCh(c.id).map((s) => `<a href="#${rid(s.id)}">${esc(s.dataset.title)}</a>`).join(' · ')}</span></li>`).join('')}</ol>
         <p class="r-note"><b>Check-In 1:</b> ${CHECKIN.map((x) => `${esc(x.code)} ${esc(x.t)} (${chRange(x.ch).toLowerCase()})`).join('; ')}. Appendix: ${inCh('appx').map((s) => `<a href="#${rid(s.id)}">${esc(s.dataset.title)}</a>`).join(' · ')}.</p>
         <details class="r-score"><summary>Scorecard map: where each Check-In question is answered</summary>${guide((id, x) => `<a href="#${rid(id)}">${esc(nm(id))}</a>${x ? ` <small>(${esc(x)})</small>` : ''} `)}</details>`);
    }
    function readerRest(sec) {
      return sec('r-pipeline', 'Chapter 5 · Next steps · Outreach pipeline', 'Who we will interview first, and how we reach them',
          `<div class="r-scroll">${pipeTable('r-table')}</div><p class="r-note"><b>Aim:</b> ${esc(PIPELINE.aim)} ${esc(PIPELINE.note)}</p><p><b>How we reach out:</b> ${PIPELINE.rules.map(esc).join(' · ')}.</p><p><b>How we interview:</b> ${PLAN.rules.map(esc).join(' · ')}.</p><p class="r-note">${esc(PLAN.after)}</p>`)
        + sec('r-society', 'Chapter 5 · Next steps · Innovation in society', 'What could go wrong for people, and what we do about it',
          `<div class="r-scroll">${socTable('r-table')}</div><p class="r-note">${esc(SOCIETY.note)}</p>`)
        + sec('r-gaps', 'Chapter 5 · Next steps · Our gaps', 'What could prove us wrong, and what we do about it',
          `<div class="r-cards c4">${RISKS.map((r) => `<article><h4>${esc(r.k)}</h4><b class="r-big">${esc(r.n)}</b><p>${esc(r.t)}</p><p class="r-dim"><b>What we do:</b> ${esc(r.act)} <b>By ${esc(r.by)}.</b></p></article>`).join('')}</div>
           <h3>Smaller gaps we are closing</h3><div class="r-scroll">${gapTable('r-table')}</div>
           <h3>What we still don’t know</h3><ul>${EVOLUTION.unknown.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`)
        + sec('r-asks', 'Chapter 5 · Next steps · Questions for reviewers', 'Where your advice would change what we do next',
          `<ol class="r-asks">${ASKS.map((q) => `<li>${esc(q)}</li>`).join('')}</ol>`);
    }
    return { build, readerMap, readerRest, scorecard };
  })();

  // =================================================================== v13 · ORGANIZER VALUE CHAIN, FATES, WHERE NUMBERS COME FROM
  const v13 = (() => {
    const ZK = { covered: 'z-cov', adjacent: 'z-adj', discovery: 'z-disc' };
    const wd = (id) => WEDGES.list.find((w) => w.id === id);
    const wChip = (id) => { const w = wd(id); return `<span class="ch-w" style="--k:var(--${w.colour}-m)">${w.code}</span>`; };

    // v15: the main slide shows three rows (Does, Example challenge, Where we sit) and no layer codes;
    // the appendix crosswalk shows all six rows with our L01–L08 layers under each stage.
    function chain(sel = '#chBody', full = false) {
      const C = CHAIN, S = C.stages;
      const rowsShown = full ? C.rows : C.rows.filter(([k]) => (C.mainRows || C.rows.map((r) => r[0])).includes(k));
      const disc = S.filter((s) => s.zone === 'discovery');
      let h = `<div class="ch-grid${full ? ' full' : ' main'}">
        <div class="ch-zone" style="grid-row:1;grid-column:${disc[0].n + 1} / ${disc[disc.length - 1].n + 2}"><span>EcoCAR discovery zone</span></div>
        <div class="ch-corner" style="grid-row:2;grid-column:1">${full ? '<small>Click a row name to focus on it</small>' : ''}</div>`
        + S.map((st) => `<div class="ch-head ${ZK[st.zone]}" style="grid-row:2;grid-column:${st.n + 1}"><b>${st.n}. ${esc(st.name)}</b>${full ? `<span class="ch-ours">${st.ours.length ? st.ours.map((n) => `<i>L0${n}</i>`).join('') : '<i class="none">not one of our layers</i>'}</span>` : ''}</div>`).join('');
      rowsShown.forEach(([k, label], r) => {
        h += `<button type="button" class="ch-rl${k === 'us' ? ' us' : ''}" style="grid-row:${r + 3};grid-column:1" data-row="${k}">${esc(label)}</button>`
          + S.map((st) => {
            let inner = `<span>${rich(st[k])}</span>`;
            if (k === 'us') inner = `${(st.w || []).map(wChip).join('')}${st.drop ? '<span class="ch-x">Dropped</span>' : ''}${inner}`;
            return `<div class="ch-c ${ZK[st.zone]}${k === 'us' ? ' us' : ''}" style="grid-row:${r + 3};grid-column:${st.n + 1}" data-row="${k}">${inner}</div>`;
          }).join('');
      });
      h += `</div><div class="ch-legend">${Object.entries(C.zones).map(([z, t]) => `<span><i class="${ZK[z]}"></i>${esc(t)}</span>`).join('')}<span class="ch-src">Format and zones from the organizers’ example; content is our research.${full ? '' : ' All six rows, mapped to our layers, are in the appendix.'}</span></div>`;
      const box = $(sel);
      box.innerHTML = h;
      box.addEventListener('click', (e) => {
        const b = e.target.closest('.ch-rl'); if (!b) return;
        const on = b.classList.contains('on');
        $$('.ch-rl', box).forEach((x) => x.classList.toggle('on', !on && x === b));
        $('.ch-grid', box).classList.toggle('focus', !on);
        $$('.ch-c', box).forEach((c) => c.classList.toggle('hot', !on && c.dataset.row === b.dataset.row));
      });
    }

    function fates() {
      // dots: what happened to each Round 1 pick, and where W1 and W3 grew from
      $$('#dots .wd').forEach((el, k) => {
        const d = DOTS[k];
        if (d.cand) {
          const c = CANDIDATES.find((x) => x.n === d.cand), f = CAND_FATE[c.id];
          el.classList.add('fate-' + f.k);
          el.insertAdjacentHTML('beforeend', `<em class="wd-fate">${esc(f.tag)}</em>`);
        }
        if (d.label === 'L2+ ADAS stacks') { el.classList.add('fate-grew'); el.insertAdjacentHTML('beforeend', '<em class="wd-fate">W1 and W3 grew from a narrow niche here</em>'); }
      });
      // cards: one reason each; SBOM gets the two-round explanation
      $$('#cands .cand').forEach((el) => {
        const c = CANDIDATES.find((x) => x.n === +el.dataset.n), f = CAND_FATE[c.id];
        el.classList.add('fate-' + f.k);
        const now = $('.c-now', el);
        now.innerHTML = `<b class="fate-tag">${esc(f.tag)}</b>${c.id === 'sbom' ? ' Real need, weak fit, in both rounds:' : ' ' + esc(f.why)}`;
        if (c.id === 'sbom') now.insertAdjacentHTML('afterend', `<div class="sb-why">${SBOM_WHY.steps.map(([w, t, d]) => `<div><small>${esc(w)}</small><b>${esc(t)}</b><p>${esc(d)}</p></div>`).join('')}</div><p class="sb-keep">${esc(SBOM_WHY.keep)}</p>`);
      });
    }

    function scoreNotes() {
      const H = SCORE_HOW.round2;
      $('#r2Foot').innerHTML = `<div class="r2-how"><b class="r2-h">${esc(H.head)}</b><p>${esc(H.intro)}</p>
        <ol><li class="lbl">Bars in each cell, left to right:</li>${H.q.map(([k, q], i) => `<li><em>${i + 1}</em><b>${esc(k)}</b> ${esc(q)}</li>`).join('')}</ol>
        <p class="r2-rule"><b>Pass</b> = at least 17 of 25, with Fit and Access each at least 3. Differentiation of 2 or less makes a pass conditional.${citeHtml('b133v2')}</p></div>`;
      $('#scNote').innerHTML = `<span class="ll-star">★</span> shortlisted on the map. <b>${esc(SCORE_HOW.round1.split('. ')[0])}.</b> ${esc(SCORE_HOW.round1.split('. ').slice(1).join('. '))}${citeHtml('b133')}`;
    }

    function bmcStages() {
      $$('#bmGrid .bmc').forEach((el, k) => {
        const b = BMCS[k], on = BMC_STAGES[b.id] || [];
        $('.bmc-what', el).insertAdjacentHTML('afterend', `<div class="bmc-st"><span>Where it plays</span><ol>${CHAIN.stages.map((st) => `<li class="${on.includes(st.n) ? 'on' : ''}${st.zone === 'discovery' ? ' dz' : ''}" title="${esc(st.n + '. ' + st.name)}">${st.n}</li>`).join('')}</ol><em>${on.map((n) => esc(CHAIN.stages[n - 1].name)).join(' · ')}</em></div>`);
      });
    }

    function pipeBar() {
      const box = $('#plBody .pl-sum > div:last-child');
      if (!box) return;
      const kinds = [['Sponsor', 'sponsor'], ['Both', 'both'], ['Independent', 'independent']].map(([k, c]) => [k, c, PIPELINE.rows.filter((r) => r.kind === k).length]);
      box.classList.add('pl-mix');
      box.innerHTML = `<div class="pl-bar">${kinds.map(([k, c, n]) => `<i class="k-${c}" style="flex:${n}">${n} ${k.toLowerCase()}</i>`).join('')}</div><span>Channels for our 7 personas. 5 of 7 use independent outreach, so at least half of our interviews can come from it, as Studio 2 requires.</span>`;
    }

    function build() { chain(); chain('#chxBody', true); fates(); scoreNotes(); bmcStages(); pipeBar(); }

    function readerChain(sec) {
      const S = CHAIN.stages;
      return sec('r-chain', 'Value chain · the organizers’ format', 'All three wedges sit inside the EcoCAR discovery zone',
        `<div class="r-scroll"><table class="r-table r-chain"><thead><tr><th></th>${S.map((st) => `<th class="${ZK[st.zone]}">${st.n}. ${esc(st.name)}<small>${st.zone === 'discovery' ? 'Discovery zone' : st.zone === 'adjacent' ? 'Adjacent' : 'OEM has it covered'}${st.ours.length ? ' · our layers ' + st.ours.map((n) => 'L0' + n).join(', ') : ''}</small></th>`).join('')}</tr></thead>
         <tbody>${CHAIN.rows.map(([k, l]) => `<tr><th scope="row">${esc(l)}</th>${S.map((st) => `<td>${k === 'us' ? (st.w || []).map((id) => `<b>${wd(id).code}</b> `).join('') : ''}${rich(st[k])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
         <p class="r-note">Format and zones from the organizers’ example; content is our research. The positions we dropped (zonal migration, OTA, SBOM) all sat outside the discovery zone.</p>`,
        'The organizers’ seven-stage value chain, filled in with our research.');
    }
    function readerSbom() {
      return `<div class="r-sbom"><h3>${esc(SBOM_WHY.title)}</h3><p>${rich(SBOM_WHY.need)}</p><ol>${SBOM_WHY.steps.map(([w, t, d]) => `<li><b>${esc(w)}: ${esc(t)}.</b> ${esc(d)}</li>`).join('')}</ol><p>${esc(SBOM_WHY.keep)}</p></div>`;
    }
    return { build, readerChain, readerSbom };
  })();

  // =================================================================== v14 · CALMER LATE SLIDES
  // Outreach as a contact sequence, society as five guardrail cards, risks on one
  // timeline, questions linked to their evidence, and lighter appendix notes.
  const v14 = (() => {
    const wd = (id) => WEDGES.list.find((w) => w.id === id);
    const wChips = (s) => s.split(/,\s*/).map((c) => { const w = WEDGES.list.find((x) => x.code === c.trim()); return w ? `<i class="v-w" style="--k:var(--${w.colour}-m)">${w.code}</i>` : ''; }).join('');
    const nm = (id) => { const e = document.getElementById(id); return e ? e.dataset.title : id; };
    const PATHS = {
      shield: 'M12 2 4 5v6c0 5.2 3.4 9.6 8 11 4.6-1.4 8-5.8 8-11V5zm-1.2 14.2-3.5-3.5 1.4-1.4 2.1 2.1 4.9-4.9 1.4 1.4z',
      lock: 'M7 10V7a5 5 0 0 1 10 0v3h1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1zm2 0h6V7a3 3 0 0 0-6 0z',
      eye: 'M12 5C6 5 2 12 2 12s4 7 10 7 10-7 10-7-4-7-10-7zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm0-2a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
      people: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM1 21v-2c0-3 4-5 8-5s8 2 8 5v2zm17 0v-2c0-1.6-.6-2.9-1.7-3.9C19.6 15.4 23 16.8 23 19v2z',
      leaf: 'M21 3C10 3 4 8 4 15.5c0 1.6.4 3 1 4.2L3 21.6 4.4 23l2-2c1.2.6 2.6 1 4.1 1C17 22 22 16 21 3zM8.5 18.5c1.5-4.2 4.4-7.5 8.5-9.5-3 2.8-5 6-6.2 9.8z',
    };
    const svg = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${PATHS[k]}"/></svg>`;
    const ST = { 'In progress': 'on', Parked: 'park', 'Not started': 'new' };

    function rulesDialog() {
      let d = $('#poDlg');
      if (!d) {
        d = document.createElement('dialog');
        d.id = 'poDlg'; d.className = 'sc-dlg po-dlg'; d.setAttribute('aria-labelledby', 'poDlgH');
        d.innerHTML = `<header><div><small>Outreach plan</small><h3 id="poDlgH">How we reach out, and how we interview</h3></div><button type="button" class="tog" data-close>Close</button></header>
          <div class="po-rl"><section><h5>Reaching out</h5><ul>${PIPELINE.rules.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></section>
          <section><h5>In the interview</h5><ul>${PLAN.rules.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></section></div>`;
        document.body.appendChild(d);
        d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('[data-close]')) d.close(); });
      }
      d.showModal();
    }

    function pipeline() {
      const rows = PIPELINE.rows.slice().sort((a, b) => (a.n === 'Parked') - (b.n === 'Parked'));
      const kinds = [['Sponsor', 'sponsor'], ['Both', 'both'], ['Independent', 'independent']].map(([k, c]) => [k, c, PIPELINE.rows.filter((r) => r.kind === k).length]);
      const indep = PIPELINE.rows.filter((r) => r.kind !== 'Sponsor').length;
      const maxC = Math.max(...PIPELINE.convs.map((c) => c[1]));
      const box = $('#plBody');
      box.className = 'po rv';
      box.innerHTML = `<ol class="po-track">${rows.map((r, i) => `<li class="po-c st-${ST[r.n] || 'on'} rv" style="--d:${3 + i * 0.5}">
          <header><em>${i + 1}</em><b>${esc(r.p)}</b><span class="pl-st st-${ST[r.n] || 'on'}">${esc(r.n)}</span></header>
          <p>${esc(r.who)}</p><div class="po-w">${wChips(r.w)}</div>
          <div class="po-ch"><span class="pl-k k-${r.kind.toLowerCase()}">${esc(r.kind)}</span><span>${esc(r.ch)}</span></div>
          <footer>${esc(r.next)}</footer></li>`).join('')}</ol>
        <div class="po-sum">
          <div class="po-t"><b>~10</b><span>people to interview. Many speak to two wedges, so we expect about this many conversations per wedge:</span>
            <div class="po-cv">${PIPELINE.convs.map(([id, n]) => { const w = wd(id); return `<span style="--k:var(--${w.colour}-m)"><em>${w.code}</em><i><u style="width:${(n / maxC) * 100}%"></u></i><b>${n}</b></span>`; }).join('')}</div></div>
          <div class="po-t"><b>${indep} of ${PIPELINE.rows.length}</b><span>personas we can reach through independent outreach, so at least half of our interviews can come from it, as Studio 2 requires</span>
            <div class="pl-bar">${kinds.map(([k, c, n]) => `<i class="k-${c}" style="flex:${n}">${n} ${k.toLowerCase()}</i>`).join('')}</div></div>
          <div class="po-t po-go"><b>15 Dec</b><span>licence and data access confirmed, and a named Applied Intuition contact</span><button type="button" class="tog" id="poRules">How we reach out and interview</button></div>
        </div>`;
      $('#poRules').addEventListener('click', rulesDialog);
    }

    function society() {
      const box = $('#soBody');
      box.className = 'so2';
      box.innerHTML = SOCIETY.cards.map((c, k) => `<article class="so2-c rv" style="--d:${3 + k}">
          <header><span class="so2-i">${svg(c.icon)}</span><h4>${esc(c.k)}</h4></header>
          <p class="so2-r"><small>Could go wrong</small>${esc(c.risk)}</p>
          <div class="so2-g"><small>What we do</small><ul>${c.guard.map((g) => `<li>${esc(g)}</li>`).join('')}</ul></div>
          <p class="so2-o"><small>Still open</small>${esc(c.open)}</p></article>`).join('')
        + `<p class="so2-note rv" style="--d:9">${esc(SOCIETY.note)}</p>`;
    }

    function gaps() {
      const RC = ['#f87171', '#fbbf24', '#22d3ee', '#a78bfa'];
      $('#riskCards').innerHTML = RISKS.map((r, k) => `<article class="rg2 rv" style="--d:${3 + k};--rc:${RC[k]}"><div class="rg-k">${esc(r.k)}</div><div class="rg-n">${esc(r.n)}</div><p>${esc(r.t)}</p></article>`).join('');
      $('#gpBody').innerHTML = `<h5>What we do about it, and by when <small>(stops in date order, not to scale)</small></h5>
        <ol class="tl">${GAP_TIMELINE.map((st) => `<li${st.r.length + st.g.length > 2 ? ' class="tl-wide"' : ''}><b class="tl-d">${esc(st.when)}</b><i class="tl-dot"></i>
          ${st.r.map((i) => `<div class="tl-a" style="--rc:${RC[i]}"><small>${esc(RISKS[i].k)}</small>${esc(RISKS[i].act)}</div>`).join('')}
          ${st.g.map((i) => `<div class="tl-a gap" title="${esc(GAPS[i][1])}"><small>${esc(GAPS[i][0])}</small>${esc(GAPS[i][2])}</div>`).join('')}</li>`).join('')}</ol>`;
    }

    function asks() {
      const list = $('#askList');
      list.innerHTML = ASKS.map((q, k) => { const [tag, id] = ASK_TAGS[k]; return `<li class="rv" style="--d:${3 + k}"><b>${k + 1}</b><span>${esc(q)}</span><button type="button" class="ask-tag" data-gs="${id}"><em>${esc(tag)}</em>${esc(nm(id))} →</button></li>`; }).join('');
      list.addEventListener('click', (e) => { const b = e.target.closest('[data-gs]'); if (b) goId(b.dataset.gs); });
    }

    function appendix() {
      // Round 1 scoring: chevron notes and weight descriptions become tooltips; the method note folds away
      $$('#funnel .fn').forEach((li) => { const n = $('.fn-note', li); if (n) li.title = n.textContent; });
      $$('#weights .wt').forEach((l) => { const d = $('.wt-d', l); if (d) l.title = d.textContent; });
      const sc = $('#scNote');
      if (sc && !sc.querySelector('details')) sc.innerHTML = `<details class="v14-how"><summary>Where these numbers come from</summary><div>${sc.innerHTML}</div></details>`;
      // evidence audit: shorter subtitle (the counts are on the left)
      // v15: the audit subtitle is set by fc.build (counts that add up)
    }

    function build() { pipeline(); society(); gaps(); asks(); appendix(); }
    return { build };
  })();

  // =================================================================== v15 · REVIEW FIXES
  // Contents as chapter cards with their Check-In codes; one growth callout; a static
  // company-screen legend with the sponsor check; personas merged into the interview plan;
  // risks with their dated actions; and progress since 10 Nov.
  const v15 = (() => {
    const wd = (id) => WEDGES.list.find((w) => w.id === id);
    const wChips = (s) => s.split(/,\s*/).map((c) => { const w = WEDGES.list.find((x) => x.code === c.trim()); return w ? `<i class="v-w" style="--k:var(--${w.colour}-m)">${w.code}</i>` : ''; }).join('');
    const sl = () => [...document.querySelectorAll('#deck > .slide')];
    const no = (id) => sl().findIndex((s) => s.id === id) + 1;
    const inCh = (cid) => sl().filter((s) => s.dataset.ch === cid);

    function contents() {
      const ck = (cid) => CHECKIN.filter((x) => x.ch.includes(cid)).map((x) => `<em title="${esc(x.t)}">Check-In ${esc(x.code)}</em>`).join('');
      $('#mpGrid').innerHTML = CHAPTERS.filter((c) => typeof c.n === 'number').map((c, k) => `<article class="mp-ch rv" style="--d:${3 + k}">
          <header><b>${c.n}</b><span>${esc(c.name)}</span></header>
          <div class="mp-tags">${c.code ? `<i>Brief ${esc(c.code)}</i>` : ''}${ck(c.id)}</div>
          <p>${esc(c.q)}</p>
          <ol>${inCh(c.id).map((s) => `<li><button type="button" data-gs="${s.id}"><em>${no(s.id)}</em>${esc(s.dataset.title)}</button></li>`).join('')}</ol></article>`).join('');
      $('#mpCheck').innerHTML = `<div class="mp-tools"><span class="mp-appx">Appendix: ${inCh('appx').map((s) => `<button type="button" data-gs="${s.id}">${esc(s.dataset.title)}</button>`).join(' · ')}</span>
        <button type="button" class="tog" id="mpGloss">Glossary of terms</button><button type="button" class="tog" id="mpScore2">Scorecard map</button></div>`;
      $('#mpScore2').addEventListener('click', () => extra.scorecard());
      $('#mpGloss').addEventListener('click', () => { goId('s-fc'); setTimeout(() => { const b = $('#tab-glossary'); if (b) b.click(); }, 150); });
    }

    function grow() {
      const g = GROW_CALLOUT;
      $('#growCallout').innerHTML = `<div class="cap-big"><span data-count="11.4" data-dec="1" data-suffix="%">${esc(g.big)}</span><small>${esc(g.unit)}</small></div>
        <h3>${esc(g.head)}${citeHtml('mck')}</h3><p>${esc(g.body)}</p>`;
    }

    function screenLegend() {
      const H = SCORE_HOW.round2;
      $('#r2Foot').innerHTML = `<div class="r2-key"><span class="r2-k1"><b>Each cell</b> = five team scores, 1–5 each, from public evidence (bars, left to right):</span>
          ${H.q.map(([k], i) => `<span><em>${i + 1}</em>${esc(k)}</span>`).join('')}
          <span class="r2-k2"><b>Pass</b> = 17+ of 25, with Fit and Access at least 3${citeHtml('b133v2')}</span></div>
        <p class="r2-sponsor">${esc(ROUND2.sponsorCheck)}</p>`;
      // label the five bars on the first cell only, so the reader learns the code once
      const first = $('#r2Matrix .r2c');
      if (first && !first.querySelector('.r2c-lab')) first.insertAdjacentHTML('beforeend', `<span class="r2c-lab" aria-hidden="true">${ROUND2.criteria.map((c) => `<i>${esc(c.short)}</i>`).join('')}</span>`);
    }

    function interview() {
      const ST = (n) => (/match/.test(n) ? 'found' : n === 'Parked' ? 'park' : n === 'Not started' ? 'new' : 'on');
      const P = Object.fromEntries(PERSONAS.map((p) => [p.code, p]));
      const indep = PIPELINE.rows.filter((r) => r.kind !== 'Sponsor').length;
      const kinds = [['Sponsor', 'sponsor'], ['Both', 'both'], ['Independent', 'independent']].map(([k, c]) => [k, c, PIPELINE.rows.filter((r) => r.kind === k).length]);
      const maxC = Math.max(...PIPELINE.convs.map((c) => c[1]));
      const F = PIPELINE.found;
      const box = $('#plBody');
      box.className = 'iv rv';
      box.innerHTML = `<ol class="iv-track">${PIPELINE.rows.map((r, i) => {
          const p = P[r.p];
          return `<li class="iv-c st-${ST(r.n)} rv" style="--d:${3 + i * 0.4}">
          <button type="button" class="iv-b" ${p ? `data-p="${esc(r.p)}"` : 'disabled'} aria-label="${esc(r.p)}: ${esc(r.who)}${p ? '. Open the full persona' : ''}">
            <header><em>${i + 1}</em><span class="iv-code">${esc(r.p)}</span><span class="arch">${p ? 'Archetype' : 'To draft'}</span></header>
            ${p ? `<b class="iv-n">${esc(p.name)}</b>` : '<b class="iv-n">Persona to draft</b>'}
            <p class="iv-who">${esc(r.who)}</p>
            <div class="iv-w">${wChips(r.w)}</div>
            <div class="iv-st"><span class="pl-st st-${ST(r.n)}">${esc(r.n)}</span>${r.found ? `<span class="iv-dots" title="${r.found} real ${r.found > 1 ? 'people' : 'person'} matched; names kept private">${'<i></i>'.repeat(r.found)}</span>` : ''}</div>
            <div class="iv-ch"><span class="pl-k k-${r.kind.toLowerCase()}">${esc(r.kind)}</span></div>
            <p class="iv-chx">${esc(r.ch)}</p>
            <footer><small>Next</small>${esc(r.next)}</footer>
          </button></li>`;
        }).join('')}</ol>
        <div class="iv-sum">
          <div class="po-t"><b>${F.people} real people</b><span>matched to ${F.personas} of our ${F.of} written personas on ${esc(F.date.replace(' 2026', ''))}. Names stay in our private tracker; no one contacted yet.</span></div>
          <div class="po-t"><b>~10</b><span>interviews. Many people speak to two wedges, so about this many conversations per wedge:</span>
            <div class="po-cv">${PIPELINE.convs.map(([id, n]) => { const w = wd(id); return `<span style="--k:var(--${w.colour}-m)"><em>${w.code}</em><i><u style="width:${(n / maxC) * 100}%"></u></i><b>${n}</b></span>`; }).join('')}</div></div>
          <div class="po-t"><b>${indep} of ${PIPELINE.rows.length}</b><span>reachable without a sponsor, so at least half of our interviews can be independent, as Studio 2 requires</span>
            <div class="pl-bar">${kinds.map(([k, c, n]) => `<i class="k-${c}" style="flex:${n}">${n} ${k.toLowerCase()}</i>`).join('')}</div></div>
          <div class="po-t po-go"><b>15 Dec</b><span>licence access confirmed and a named Applied Intuition contact</span><button type="button" class="tog" id="poRules">How we reach out and interview</button></div>
        </div>`;
      box.addEventListener('click', (e) => { const b = e.target.closest('[data-p]'); if (b) personaSlide.open(P[b.dataset.p]); });
      $('#poRules').addEventListener('click', () => { const d = $('#poDlg'); if (d) d.showModal(); else v14rules(); });
    }
    // the outreach-rules dialog from v14, built on demand
    function v14rules() {
      const d = document.createElement('dialog');
      d.id = 'poDlg'; d.className = 'sc-dlg po-dlg'; d.setAttribute('aria-labelledby', 'poDlgH');
      d.innerHTML = `<header><div><small>Who we will interview</small><h3 id="poDlgH">How we reach out, and how we interview</h3></div><button type="button" class="tog" data-close>Close</button></header>
        <div class="po-rl"><section><h5>Reaching out</h5><ul>${PIPELINE.rules.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></section>
        <section><h5>In the interview</h5><ul>${PLAN.rules.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></section></div>`;
      document.body.appendChild(d);
      d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('[data-close]')) d.close(); });
      d.showModal();
    }

    function gaps() {
      const RC = ['#f87171', '#fbbf24', '#22d3ee', '#a78bfa'];
      $('#riskCards').innerHTML = RISKS.map((r, k) => `<article class="rg3 rv" style="--d:${3 + k};--rc:${RC[k]}"><div class="rg-k">${esc(r.k)}</div><div class="rg-n">${esc(r.n)}</div><p>${esc(r.t)}</p>
          <div class="rg-act"><small>What we do · by ${esc(r.by)}</small><p>${esc(r.act)}</p></div></article>`).join('');
      $('#gpBody').innerHTML = `<div class="rg-line"><h5>Done since 10 Nov</h5><ul>${DONE.map(([k, t, d]) => `<li class="done"><b>${esc(k)}</b>${esc(t)}<em>${esc(d)}</em></li>`).join('')}</ul></div>
        <div class="rg-line"><h5>Smaller gaps we are closing</h5><ul>${GAPS.map(([k, , a, d]) => `<li><b>${esc(k)}</b>${esc(a)}<em>${esc(d)}</em></li>`).join('')}</ul></div>`;
    }

    function society() {
      const n = $('.so2-note'); if (n) n.innerHTML = `<b>${esc(SOCIETY.summary)}</b> ${esc(SOCIETY.note)}`;
    }

    function dossierAlt() {
      // W1's dossier: what today's tools show, what they miss, and what W1 adds (general terms)
      const add = () => {
        const wk = $('#dpBody .ds-case .wk');
        if (!wk || wk.dataset.v15) return;
        wk.dataset.v15 = '1';
        wk.innerHTML = `<h4>What they use today, and what it misses</h4><table class="alt"><thead><tr><th>Today</th><th>Shows</th><th>Misses</th></tr></thead><tbody>${ALTERNATIVES.map(([a, b, c]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td><td>${esc(c)}</td></tr>`).join('')}</tbody></table><p class="alt-add">${esc(ALT_ADDS)}</p>`;
      };
      new MutationObserver(() => { if ($('#doPanel').getAttribute('aria-labelledby') === 'dt-ml') add(); }).observe($('#dpBody'), { childList: true });
      add();
    }

    function titles() {
      // long action titles drop to a smaller size so they stay on one or two lines
      $$('.head .title').forEach((t) => t.classList.toggle('long', t.textContent.trim().length > 48));
    }
    function build() { contents(); grow(); screenLegend(); interview(); gaps(); society(); dossierAlt(); titles(); }
    return { build };
  })();

  // =================================================================== v3 · READING MODE
  // A responsive, scrolling document generated from the same data: works on
  // phones and small laptops, prints to PDF, and needs no 1600×900 stage.
  const reader = (() => {
    const root = $('#reader');
    let built = false;
    const sec = (id, kicker, title, body, sub = '') => `<section class="r-sec" id="${id}" aria-labelledby="${id}-h">
        <div class="r-k">${kicker}</div><h2 id="${id}-h">${title}</h2>${sub ? `<p class="r-sub">${sub}</p>` : ''}${body}</section>`;
    const ul = (arr, cls = '') => `<ul class="${cls}">${arr.map((t) => `<li>${rich(t)}</li>`).join('')}</ul>`;
    function build() {
      const who = [TEAM.name, TEAM.university].filter(Boolean).join(' · ');
      const toc = [['r-exec', 'Summary'], ['r-map', 'Contents'], ['r-why', '1 Market'], ['r-eco', 'Ecosystem'], ['r-chain', 'Value chain map'], ['r-vc', 'Value chain'], ['r-grow', 'Growth'], ['r-bmc', '2 Business models'], ['r-ws', '3 Round 1'], ['r-round2', 'Company screen'], ['r-evolve', 'How we narrowed'], ['r-people', 'Personas'], ['r-wedges', '4 Wedges'], ['r-pipeline', '5 Outreach'], ['r-society', 'Society'], ['r-gaps', 'Risks & gaps'], ['r-asks', 'Questions'], ['r-funnel', 'Appendix'], ['r-audit', 'Evidence']];
      const tg = DOSSIERS.filter((d) => d.focus);
      let h = `<nav class="r-toc" aria-label="Contents">${toc.map(([id, t]) => `<a href="#${id}" data-r="${id}">${t}</a>`).join('')}</nav><div class="r-wrap">`;

      // cover
      h += `<header class="r-cover" id="r-top"><div class="r-k">${esc(TEAM.program)} · ${esc(TEAM.track)} · Check-In 1 (B-1.3.1 to B-1.3.3) · Studio 1 (B-2.3.1 to B-2.3.4)</div>${who ? `<div class="r-team">${esc(who)}</div>` : ''}
        <h1>${esc(EXEC.thesis)}</h1><p class="r-lead">${esc(EXEC.sub)}</p>
        <div class="r-stats"><div><b>8</b>value-chain layers mapped</div><div><b>15</b>company tests: 5 ideas × 3 companies</div><div class="hl"><b>3</b>wedges to test in Studio 2</div></div>
        <p class="r-map"><b>How it is organized:</b> five chapters that follow the Studio 1 brief, then an appendix. <a href="#r-map">See the contents and the Check-In map</a>.</p>
        <p class="r-asof">${esc(TEAM.submission)} · as of ${esc(TEAM.updated)} <button class="r-present" type="button">Present fullscreen ▸</button></p></header>`;


      // executive summary
      h += sec('r-exec', 'Executive summary', 'Our opening is the evidence work every OEM must finish before launch',
        `<p class="r-bl">${esc(EXEC.bottomLine)}</p><div class="r-facts">${EXEC.facts.map((f) => `<div><b>${esc(f.v)}</b><span>${rich(f.t)}</span></div>`).join('')}</div>
         <h3>Three wedges for customer discovery</h3><ol class="r-targets">${WEDGES.list.map((w, k) => `<li style="${cv(w.colour)}"><a href="#r-wedge-${w.id}"><b>${esc(w.code)} · ${esc(w.name)}</b></a><span>${esc(w.tag)} · ${esc(w.from)} · DFV ${wedgeSlide.pct()[k]}% · confidence low</span></li>`).join('')}</ol>
         <p class="r-note"><b>Weakest:</b> ${esc(WEDGES.weakestShort)} Our first screen pointed to HIL, zonal and OTA; testing them against real companies dropped zonal and OTA and narrowed HIL. <a href="#r-evolve">How we narrowed.</a></p><p class="r-note">${esc(EXEC.howToRead)}</p>
         <h3>First claim we test for each wedge</h3><ol>${EXEC.tests.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>`);

      // why
      h += sec('r-why', 'Why the market is changing', 'Why companies are betting on SDVs',
        `<div class="r-cards c4">
          <article><h4>Recurring revenue</h4><b class="r-big">$3.1B</b><p>GM guides ~$3.1B of OnStar revenue for 2026${citeHtml('gm-q1')} and targets ~70% gross margins on OnStar and Super Cruise${citeHtml('gm-q3l')}.</p></article>
          <article><h4>Cheaper hardware</h4><b class="r-big">17 → 7</b><p>Rivian’s Gen 2 R1 cut ECUs from 17 to 7${citeHtml('rivian')}.</p></article>
          <article><h4>Cheaper recalls</h4><b class="r-big">29.3M</b><p>vehicles in 891 US recalls in 2025${citeHtml('nhtsa')}. OTA fixes could save US OEMs $1.5B by 2028 (2023 forecast)${citeHtml('abi')}.</p></article>
          <article><h4>Faster development</h4><b class="r-big">18–24 mo</b><p>Chinese rivals target 18–24-month cycles, about half the Western norm${citeHtml('spg-china')}.</p></article></div>`,
        `Automotive software and electronics: $519B by 2035, growing 4.5% a year against ~1% for vehicles${citeHtml('mck')}.`);

      // ecosystem
      const supply = ACTORS.filter((a) => a.side === 'L'), demand = ACTORS.filter((a) => a.side === 'R');
      const actorCard = (a) => `<article class="r-actor" id="r-actor-${a.id}" style="${cv(a.colour)}"><h4>${esc(a.title)}${a.focus ? ' <em>our focus area</em>' : ''}</h4><p class="r-dim">${esc(a.sub)}</p>${chips(a.logos)}
          <dl><dt>Brings</dt><dd>${rich(a.gives)}</dd><dt>Gets paid</dt><dd>${rich(a.gets)}</dd><dt>What SDVs change</dt><dd>${rich(a.sdv)}</dd></dl></article>`;
      const flowRows = FLOWS.filter((f) => f.label && f.type !== 'rules').map((f) => {
        const nm = (e) => (typeof e === 'object' ? (f.a || []).map((x) => (ACTORS.find((a) => a.id === x) || {}).title).join(' → ') : e === 'hub' ? 'Automakers' : (ACTORS.find((a) => a.id === e) || {}).title);
        const from = typeof f.from === 'object' ? (ACTORS.find((a) => a.id === f.a[0]) || {}).title : nm(f.from);
        const to = typeof f.to === 'object' ? (ACTORS.find((a) => a.id === f.a[1]) || {}).title : nm(f.to);
        return `<tr><td>${esc(from)} → ${esc(to)}</td><td>${esc(f.label)}</td><td>${f.money ? esc(f.money) : '—'}</td><td>${f.back ? esc(f.back) : f.type === 'data' ? 'data' : '—'}</td><td>${f.shift ? `<span class="r-shift">${f.shift}</span>` : ''}${f.isNew ? ' new with SDVs' : ''}</td></tr>`;
      }).join('');
      h += sec('r-eco', 'Ecosystem', 'The OEM is still the hub, but SDVs add a second revenue loop after the sale',
        `<article class="r-actor r-hub" id="r-actor-hub" style="${cv('Ltwo')}"><h4>Automakers (OEMs): the hub</h4>${chips(HUB.oems)}<dl><dt>Brings</dt><dd>${rich(HUB.gives)}</dd><dt>Gets paid</dt><dd>Before SDVs: ${esc(HUB.getsBefore)} With SDVs: ${esc(HUB.gets)}</dd><dt>Risk</dt><dd>${rich(HUB.sdv)}</dd></dl></article>
         <article class="r-actor" id="r-actor-reg" style="${cv('Ltwo')}"><h4>${esc(REGULATORS.title)}</h4><p class="r-dim">${esc(REGULATORS.list.join(' · '))}</p><p>${rich(REGULATORS.detail)}</p></article>
         <h3>Supply side</h3><div class="r-cards c2">${supply.map(actorCard).join('')}</div>
         <h3>Demand side</h3><div class="r-cards c2">${demand.map(actorCard).join('')}</div>
         <h3>What SDVs change</h3><ol class="r-shifts">${SHIFTS.map((s) => `<li><b>${esc(s.title)}.</b> ${rich(s.text)}</li>`).join('')}</ol>
         <p class="r-note"><b>Before SDVs:</b> ${esc(ERA_TEXT.before.text)}</p>
         <h3>Flows</h3><div class="r-scroll"><table class="r-table"><thead><tr><th>From → to</th><th>Product or service</th><th>Paid back</th><th>Data</th><th>SDV shift</th></tr></thead><tbody>${flowRows}</tbody></table></div>`);

      // value chain (the 2D view)
      const order = [6, 5, 4, 3, 2, 1, 8, 7];
      h += sec('r-vc', 'Value chain', 'Six layers from silicon to paid services, and two that run through all of them',
        `<div class="r-layers">${order.map((id) => {
          const l = layerById(id);
          return `<article class="r-layer" id="r-layer-${id}" style="${cv(l.colour)}">
            <header><span class="r-num">${l.num}</span><div><h4>${esc(l.name)}</h4><p class="r-dim">${esc(l.scope)}</p></div></header>
            <div class="r-lrow">${meter(l.comp)}<span class="r-cap">${esc(CAPTURE_LABEL[l.capture])}</span>${pocket(l.pocket)}</div>
            <p class="r-stat"><b>${esc(l.stat)}</b> ${rich(l.statcap)}</p>${chips(l.logos)}
            <details><summary>The brief’s four questions</summary>
              <h5>What winning looks like</h5>${ul(l.winning)}<p class="r-dim"><b>KPIs:</b> ${esc(l.kpis)}</p>
              <h5>Moats &amp; growth drivers</h5>${ul(l.moats)}
              <h5>Critical, and where competition is low</h5>${ul(l.critical)}${l.critPocket ? pocket(l.critPocket) : ''}
              <h5>Engineering pain points</h5>${ul(l.pain)}${LAYER_FIT[l.id] ? `<p class="r-dim"><b>Where our skills fit:</b> ${esc(LAYER_FIT[l.id])}</p>` : ''}</details></article>`;
        }).join('')}</div>`,
        'Competition ratings and open pockets are team hypotheses. W1 and W2 mark where two of our wedges sit (W3 sits with W1 in the ADAS layer); dropped marks earlier targets.');

      // growth
      h += sec('r-grow', 'Value capture', 'Where the money grows',
        `<div class="r-pools">${POOLS.slice().sort((a, b) => b.to - a.to).map((p) => `<div class="r-pool"><span class="r-pn">${esc(p.name)} <small>${esc(p.years)} · ${esc(COMP_LABEL[layerById(p.layer).comp].toLowerCase())}</small></span>
            <span class="r-pt"><i style="left:${(p.from / 55) * 100}%;width:${((p.to - p.from) / 55) * 100}%"></i></span><span class="r-pv">${p.approx ? '~' : ''}$${p.from}B → <b>${p.approx ? '~' : ''}$${p.to}B</b> · ${p.cagr.toFixed(1)}%/yr${p.computed ? ' (computed)' : ''}</span></div>`).join('')}</div>
         <p class="r-note">Every pool ends in 2035, so end values compare like with like; start years differ (2025 or 2030). Source: McKinsey${citeHtml('mck')}. All four sit in layers we rate crowded; our wedges are evidence work beside them, not rivals in them. McKinsey gives no comparable pool for telematics, data or OTA.</p>
         <div class="r-cards c2">
          <article><h4>Every month: telematics, data &amp; cloud</h4><p>Smaller, but still growing: GM guides OnStar to ~$3.1B in 2026, +15%${citeHtml('gm-q1')}; Samsara’s ARR is up 30% a year${citeHtml('samsara')}.</p></article>
          <article><h4>Integration and V&amp;V: 11.4%/yr</h4><p>The fastest-growing of McKinsey’s top-level auto software segments, growing 11.4% a year through 2035${citeHtml('mck')}. Split by function instead, ADAS software grows faster, in a crowded layer. All three of our wedges are validation work.</p></article></div>`,
        'The biggest pools are per-vehicle software and compute, in crowded layers; recurring services are smaller but growing.');

      // whitespace
      const quad = (fx) => DOTS.filter(fx).map((d) => `<li style="${cv(d.colour)}">${d.cand ? `<b>${candMark(d.cand)}</b> ` : ''}${esc(d.label)}</li>`).join('');
      h += sec('r-ws', 'Round 1 · Cross-layer synthesis', 'Round 1 pointed to four whitespace pockets',
        `<div class="r-quads"><div class="ws"><h4>Engineering whitespace</h4><small>critical, fragmented</small><ul>${quad((d) => d.y >= 0.5 && d.x < 0.5)}</ul></div>
          <div><h4>Crowded core</h4><small>critical, crowded</small><ul>${quad((d) => d.y >= 0.5 && d.x >= 0.5)}</ul></div>
          <div><h4>Unproven</h4><small>less critical, fragmented</small><ul>${quad((d) => d.y < 0.5 && d.x < 0.5)}</ul></div>
          <div><h4>Commodity</h4><small>less critical, crowded</small><ul>${quad((d) => d.y < 0.5 && d.x >= 0.5)}</ul></div></div>
         <div class="r-cards c2">${CANDIDATES.map((c) => `<article style="${cv(c.colour)}" class="${c.screened ? 'r-scr' : ''}"><h4>${c.screened ? '✕' : c.n + '.'} ${esc(c.title)} ${c.target ? `<em>Round 1 target #${c.target}</em>` : c.screened ? '<em>screened out in Round 1</em>' : ''}</h4><p>${rich(c.text)}</p><p class="r-dim"><b>Personas:</b> ${esc(c.personas)}</p><p><b>${esc(c.now)}</b></p></article>`).join('')}</div>`,
        'Placed by criticality to launch and competitive intensity: team assessments, not measurements.');

      // funnel + scores
      h += sec('r-funnel', 'Round 1 · 5 Oct · How the shortlist was produced', 'From seven open pockets to three targets',
        `<ol class="r-funnel">${FUNNEL.map((f) => `<li><b>${esc(String(f.n))}</b> ${esc(f.label)} <small>${esc(f.stage)} · ${esc(f.note)}</small></li>`).join('')}</ol>
         <div class="r-scroll"><table class="r-table"><thead><tr><th>Position</th>${SCREEN.criteria.map((c) => `<th>${esc(c.label)}<small>${c.w}%</small></th>`).join('')}<th>Feasibility</th><th>Market</th><th>Priority</th></tr></thead>
         <tbody>${ranking().map(({ p, f, pr }, i) => `<tr class="${i < 3 ? 'top' : ''}"><td>${i + 1}. ${esc(p.name)}${SHORTLISTED.has(p.id) ? ' ★' : ''}</td>${SCREEN.criteria.map((c) => `<td>${p.s[c.id]}</td>`).join('')}<td><b>${f.toFixed(2)}</b></td><td>${p.market.toFixed(1)}</td><td><b>${pr.toFixed(1)}</b></td></tr>`).join('')}</tbody></table></div>
         <p class="r-note">★ shortlisted in B-2.3.1. All seven open pockets were re-scored, so the shortlist could be overturned. ${rich(SCREEN.note)} ${esc(SCREEN.capabilities)}</p>
         <h3>How market attractiveness was judged</h3><p>${esc(SCREEN.marketNote)}</p>
         <div class="r-scroll"><table class="r-table r-market"><thead><tr><th>Position</th><th>Criticality to launch or approval</th><th>Competition</th><th>Market</th></tr></thead>
         <tbody>${ranking().map(({ p }) => `<tr><td>${esc(p.name)}</td><td><b>${esc(p.crit[0])}</b>: ${esc(p.crit[1])}</td><td><b>${esc(p.comp[0])}</b>: ${esc(p.comp[1])}</td><td>${p.market.toFixed(1)}</td></tr>`).join('')}</tbody></table></div>
         <h3>How sensitive is the ranking?</h3><p class="r-robust">${sensitivityHtml(sensitivity())}</p>`,
        'Priority = team feasibility (skill, assets, prototype, access, edge) × market attractiveness from the B-2.3.1 map.');

      // v7: business models, company screen, how the thinking changed
      h += sec('r-bmc', 'B-2.3.2 · Incumbent business models', 'How three incumbents make money',
        `<div class="r-cards c3">${BMCS.map((b) => `<article><h4>${esc(b.name)} <em>${esc(b.result)}</em></h4><p class="r-dim">${esc(b.what)}${citeHtml(b.src)}</p>
            <p>${b.stats.map(([v, t]) => `<b>${esc(v)}</b> ${esc(t)}`).join(' · ')}</p>
            <h5>How it makes money</h5>${ul(b.money.map(([g, t]) => `${t} (${({ core: 'core', growth: 'growth', future: 'future bet' })[g]})`))}
            <h5>What protects it</h5><p>${esc(b.moat)}</p><p class="r-dim">${esc(b.watch)}</p>
            <h5>What it taught us</h5><p>${esc(b.lesson)}</p><p><a href="${esc(b.file)}">Full canvas (PDF, ${b.nsrc} cited sources)</a></p></article>`).join('')}</div>
         <p class="r-note">${esc(BMC_NOTE)}</p>`,
        'Three companies at different stages of the value chain, and what each one taught us about where a student team could fit.');

      const co = ROUND2.companies;
      h += sec('r-round2', 'Round 2 · 26 Oct · Feasibility against real companies', 'Tested against real companies, 3 of 15 company tests pass',
        `<div class="r-scroll"><table class="r-table"><thead><tr><th>Position</th>${co.map((c) => `<th>${esc(c.name)}</th>`).join('')}</tr></thead>
         <tbody>${ROUND2.positions.map((p) => `<tr><td><b>${esc(p.name)}</b><br><small>${esc(p.sub)}</small></td>${co.map((c) => { const x = r2Pair(p.id, c.id); return `<td><b>${r2Total(x)}</b> of 25<br><small>${esc(x.label)}</small></td>`; }).join('')}</tr>`).join('')}</tbody></table></div>
         <p class="r-note">${esc(ROUND2.rule)} ${esc(ROUND2.notes)}${citeHtml('b133v2')}</p>
         <h3>All 15 company tests, and what decides each</h3>
         <div class="r-scroll"><table class="r-table"><thead><tr><th>Company test</th>${ROUND2.criteria.map((c) => `<th>${esc(c.short)}</th>`).join('')}<th>Total</th><th>What decides it</th></tr></thead>
         <tbody>${ROUND2.positions.flatMap((p) => co.map((c) => ({ p, c, x: r2Pair(p.id, c.id) }))).sort((a, b) => r2Total(b.x) - r2Total(a.x)).map(({ p, c, x }) => `<tr><td>${esc(p.name)} × ${esc(c.name)}</td>${x.s.map((v) => `<td>${v}</td>`).join('')}<td><b>${r2Total(x)}</b></td><td>${esc(x.decide)}${x.margin ? ` ${esc(x.margin)}` : ''}</td></tr>`).join('')}</tbody></table></div>`,
        'Can we do the work, can we reach them, and what can we add that they lack?');

      const evo = ranking().map((x, i) => ({ id: x.p.id, rank: i + 1, name: x.p.name }));
      h += sec('r-evolve', 'How our thinking changed', 'New evidence changed our answer',
        `<ol class="r-time">${EVOLUTION.timeline.map((t) => `<li><b>${esc(t.d)}</b> ${esc(t.t)}</li>`).join('')}</ol>
         <div class="r-scroll"><table class="r-table"><thead><tr><th>Round 1 · 5 Oct</th><th>After Round 2 · 26 Oct</th><th>What we learned</th></tr></thead>
         <tbody>${evo.map((o) => { const e = EVOLUTION.ends.find((x) => x.from === o.id), s = EVOLUTION.stories[o.id]; return `<tr><td>#${o.rank} ${esc(o.name)}</td><td><b>${esc(e.tag)}</b>: ${esc(e.title)}</td><td>${esc(s.learned)} <small>${esc(s.caveat)}</small></td></tr>`; }).join('')}</tbody></table></div>
         <h3>Why the reasoning changed</h3><ol>${EVOLUTION.why.map((w) => `<li><b>${esc(w.t)}.</b> ${esc(w.d)}</li>`).join('')}</ol>
         <div class="r-cards c2"><article><h4>What stayed the same</h4>${ul(EVOLUTION.stayed)}</article><article><h4>What we still don’t know</h4>${ul(EVOLUTION.unknown)}</article></div>
         <p class="r-note">${esc(EVOLUTION.caution)}</p>`,
        'We kept the first answer on the record. It was reasonable on what we knew on 5 Oct, and here is what moved us.');

      // dossiers
      h += sec('r-dossier', 'B-2.3.3 · Company-screen dossiers', 'Where W1 and W2 came from',
        DOSSIERS.map((d, di) => {
          const p = d.focus ? null : screenPos(d.id);
          const first = !d.focus && DOSSIERS[di - 1].focus ? '<h3 class="r-oldh">Earlier targets, kept on record</h3><p class="r-dim">Round 1 dossiers as written on 5 Oct, each with what changed.</p>' : '';
          return `${first}<article class="r-dos${d.screened ? ' r-scr' : ''}" id="r-dossier-${d.id}" style="${cv(d.colour)}">
            <h3>${d.focus ? esc(d.role) : d.screened ? 'Screened out in Round 1' : 'Round 1 #' + d.rank} · ${esc(d.title)}</h3>
            <p class="r-dim">${d.focus ? d.r2.map(([n, s, , t]) => `${esc(n)} ${s}/25 (${esc(t)})`).join(' · ') : `Feasibility ${feas(p).toFixed(2)}/5 × market ${p.market.toFixed(1)} = priority ${(feas(p) * p.market).toFixed(1)}`} · evidence confidence: <b>${esc(d.confidence.level)}</b>. ${esc(d.confidence.why)}</p>
            ${d.was ? `<p class="r-changed"><b>What changed in Round 2: ${esc(d.was.status.toLowerCase())}.</b> ${esc(d.was.text)} ${esc(d.was.reopen)}</p>` : ''}
            <p>${rich(d.problem)}</p><p><b>${d.screened ? 'Why screened out' : 'Our edge'}:</b> ${rich(d.edge)}</p>
            ${d.screened ? '' : `<dl class="r-who"><dt>Users</dt><dd>${esc(d.users)}</dd><dt>Budget owners</dt><dd>${esc(d.budget)}</dd><dt>Gatekeepers</dt><dd>${esc(d.gate)}</dd><dt>Influencers</dt><dd>${esc(d.influence)}</dd><dt>Workaround today</dt><dd>${esc(d.workaround)}</dd></dl>`}
            <div class="r-ev"><div><h5 class="for">Evidence for</h5>${ul(d.forE)}</div><div><h5 class="against">Evidence against</h5>${ul(d.against)}</div></div>
            ${d.screened ? '' : `<div class="r-ev"><div><h5>First test</h5><p>${esc(d.first)}</p><h5>We drop it if</h5>${ul(d.kill)}</div><div><h5>Open commercial questions</h5>${ul(d.biz)}</div></div>`}
          </article>`;
        }).join(''),
        'Confidence rubric: High needs external interviews and primary data, so nothing can be above Low before Studio 2 interviews.');

      h += sec('r-people', 'B-2.3.3 · Engineering personas', 'Six personas: fictional archetypes of the engineers we will interview',
        `<div class="r-cards c2">${PERSONAS.map((p) => `<article><h4>${esc(p.name)} <em>${esc(p.code)} · ${esc(p.title)} · ${esc(p.company)}</em></h4><p><b>${esc(p.tag)}, interview #${p.rank}.</b> ${esc(p.role)}</p><p class="r-persona-q">“${esc(p.quote)}” <small>(imagined quote)</small></p><p><a href="${esc(p.img)}">Full persona card</a></p></article>`).join('')}</div>
         <p class="r-note">Every persona is a fictional archetype, not a real person, and every quote is illustrative. These replace the P1–P8 persona codes from Round 1. ${esc(PERSONA_INSIGHTS.map((x) => x.t + ': ' + x.d).join(' '))}${citeHtml('b133v2')}</p>`,
        'Ranked by who decides and who we can reach first.');

      h += wedgeSlide.readerHtml(sec);

      h += extra.readerRest(sec);

      // audit
      const COLORS = { verified: '#22c55e', corrected: '#f59e0b', forecast: '#a78bfa', estimate: '#38bdf8', hypothesis: '#94a3b8' };
      const cnt = fc.counts;
      h += sec('r-audit', 'Method & evidence appendix', 'Every material claim, audited and classified',
        `<p>${CLAIMS.length} market claims audited against ${cnt.nSrc} sources on ${esc(TEAM.asOf)}: <b>${cnt.nVC}</b> verified or corrected and <b>${cnt.nFlag}</b> labelled as forecasts, estimates or team hypotheses (${cnt.nVC + cnt.nFlag} in all). ${HAND_CHECKS.done} of the ${HAND_CHECKS.total} points that needed a person to open the source were checked by hand on ${esc(HAND_CHECKS.date)}; the ninth, the ${esc(HAND_CHECKS.open)}, could not be. ${esc(HAND_CHECKS.links)} <a href="fact-check-report.html">Full audit report</a>. The 26 Oct company screen and the BMCs have their own source lists and were not part of this audit.</p>
         <h3>Checked by hand</h3><ul>${CLAIMS.filter((c) => c.hand).map((c) => `<li><b>${esc(c.claim)}.</b> ${esc(c.hand)}</li>`).join('')}</ul>
         <h3>Claims</h3><div class="r-claims">${CLAIMS.map((c) => { const s = SOURCES[c.src]; return `<div class="r-claim" style="--k:${COLORS[c.status]}"><span class="r-badge">${esc(STATUS[c.status].label)}</span><div><small>${esc(c.slide)}</small><p>${esc(c.claim)}</p>${c.hand ? `<p class="r-pend">${esc(c.hand)}</p>` : ''}<p class="r-src">[${srcNum(c.src)}] ${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.pub)}</a>` : esc(s.pub)} · ${esc(s.date)}</p></div></div>`; }).join('')}</div>
         <h3>Sources</h3><ol class="r-sources">${SRC_IDS.map((id) => { const s = SOURCES[id]; return `<li id="r-src-${id}"><b>${esc(s.pub)}</b>, ${esc(s.title)} (${esc(s.date)}; ${esc(KIND[s.kind])})${s.url ? `. <a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url.replace(/^https?:\/\//, '').slice(0, 70))}${s.url.length > 78 ? '…' : ''}</a>` : ''}</li>`; }).join('')}</ol>
         <h3>Glossary</h3><dl class="r-gloss">${GLOSSARY.map(([t, d]) => `<dt>${esc(t)}</dt><dd>${esc(d)}</dd>`).join('')}</dl>`);

      const vers = VERSION.showOlder ? `Versions: <b>v${VERSION.n}</b> (this)${VERSION.older.map(([t, u]) => ` · <a href="${esc(u)}">${t}</a>`).join('')}. ` : '';
      h += `<footer class="r-foot"><p>${vers}Logos are trademarks of their owners, shown for identification only. Public sources only; no OEM data (B-1.2).</p></footer></div>`;
      h += v13.readerChain(sec);
      root.innerHTML = h;
      { const ws = $('#r-ws', root); if (ws) ws.insertAdjacentHTML('beforeend', v13.readerSbom()); }
      // v12: same chapter order and labels as the slides
      const wrap = $('.r-wrap', root), foot = $('.r-foot', root);
      const map = $('#r-map', root);
      if (!map) { const tmp = document.createElement('div'); tmp.innerHTML = extra.readerMap(sec); wrap.insertBefore(tmp.firstElementChild, $('#r-why', root)); }
      const R_ORDER = ['r-exec', 'r-map', 'r-why', 'r-eco', 'r-chain', 'r-vc', 'r-grow', 'r-bmc', 'r-ws', 'r-round2', 'r-evolve', 'r-people', 'r-wedges', 'r-pipeline', 'r-society', 'r-gaps', 'r-asks', 'r-funnel', 'r-dossier', 'r-audit'];
      R_ORDER.forEach((id) => { const el = document.getElementById(id); if (el) wrap.insertBefore(el, foot); });
      R_ORDER.forEach((id) => {
        const el = document.getElementById(id), sl = document.getElementById(id === 'r-audit' ? 's-fc' : id.replace(/^r-/, 's-'));
        if (!el || !sl) return;
        const c = chOf(sl);
        if (c.id === 'intro') return;
        $('.r-k', el).textContent = c.id === 'appx' ? `Appendix · ${sl.dataset.title}` : `Chapter ${c.n} · ${c.short || c.name} · ${sl.dataset.title}`;
      });
      hydrateCites(root);
      // printing (and ?print=1 for PDF export) expands every layer's details
      const openAll = () => $$('details', root).forEach((d) => { d.open = true; });
      if (new URLSearchParams(location.search).get('print')) openAll();
      window.addEventListener('beforeprint', () => { if (EXPORT) return; if (!mode.is('read')) mode.set('read'); openAll(); });
      $('.r-present', root).addEventListener('click', () => mode.set('present', true));
      // highlight the current section in the contents bar
      const links = $$('.r-toc a', root);
      const io = new IntersectionObserver((ents) => ents.forEach((en) => {
        if (en.isIntersecting) links.forEach((a) => a.classList.toggle('on', a.dataset.r === en.target.id));
      }), { rootMargin: '-30% 0px -60% 0px' });
      $$('.r-sec', root).forEach((s) => io.observe(s));
      built = true;
    }
    return {
      show() { if (!built) build(); },
      jumpTo(id) {
        if (!mode.is('read')) mode.set('read', true);
        const el = document.getElementById(id); if (!el) return;
        const det = el.querySelector('details'); if (det) det.open = true;
        el.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'start' });
        el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
      },
    };
  })();

  // =================================================================== v3 · MODE (present ↔ read)
  const mode = (() => {
    let m = 'present', userSet = false;
    const KEY = 'sdv-portfolio-mode';
    const tooSmall = () => innerWidth < 900 || Math.min(innerWidth / STAGE_W, (innerHeight - 70) / STAGE_H) < 0.66;
    function set(v, user) {
      if (user) { userSet = true; try { localStorage.setItem(KEY, v); } catch (e) { /* storage unavailable */ } }
      if (v === m && document.body.classList.contains('mode-' + v)) return;
      const prevMode = m;
      m = v;
      const read = v === 'read';
      document.documentElement.classList.toggle('mode-read', read);
      document.body.classList.toggle('mode-read', read);
      document.body.classList.toggle('mode-present', !read);
      $('#reader').hidden = !read;
      $('#deck').hidden = read;
      $('.dock').hidden = read;
      $('#modeLabel').textContent = read ? 'Present' : 'Read';
      $('#btnMode').setAttribute('aria-pressed', String(read));
      $('#btnMode').title = read ? 'Switch to the full-screen presentation' : 'Switch to the scrolling reading view';
      const switched = prevMode !== v;
      if (read) {
        if (switched && hooks[cur] && hooks[cur].leave) hooks[cur].leave();
        reader.show();
        if (switched) window.scrollTo(0, 0);
      } else {
        fit();
        if (switched && hooks[cur] && hooks[cur].enter) hooks[cur].enter();
        requestAnimationFrame(() => ['#eraCtl', '#lensCtl', '#poolCtl', '#fcTabs', '#dpViews'].forEach(segPlace));
      }
    }
    return {
      is: (v) => m === v,
      set,
      init() {
        const q = new URLSearchParams(location.search).get('mode');
        let saved = null;
        try { saved = localStorage.getItem(KEY); } catch (e) { /* storage unavailable */ }
        if (EXPORT) { userSet = true; set('present'); }
        else if (q === 'read' || q === 'present') { userSet = true; set(q); }
        else if (saved === 'read' || saved === 'present') { userSet = true; set(saved); }
        else set(tooSmall() ? 'read' : 'present');
        $('#btnMode').addEventListener('click', () => set(m === 'read' ? 'present' : 'read', true));
        // deep links into the reading view (#r-vc, #r-dossier-hil …)
        const h = location.hash.slice(1);
        if (/^r-/.test(h)) { if (m !== 'read') set('read'); setTimeout(() => { const el = document.getElementById(h); if (el) { const det = el.querySelector('details'); if (det) det.open = true; el.scrollIntoView({ block: 'start' }); } }, 80); }
      },
      auto() { if (!userSet) set(tooSmall() ? 'read' : 'present'); },
    };
  })();

  // ------------------------------------------------------------------ INIT
  hydrateIcons();
  eco.build();
  vc.build();
  pools.build();
  ws.build();
  fc.build();
  execSlide.build();
  screen.build();
  dossier.build();
  bmcSlide.build();
  round2.build();
  evolve.build();
  personaSlide.build();
  wedgeSlide.build();
  extra.build();
  v13.build();
  v14.build();
  v15.build();
  coverText();
  finder.build();
  buildChrome();
  hydrateCites();
  bindTilt();
  fit();
  const start = parseInt(location.hash.slice(1), 10);
  go(isNaN(start) ? 0 : start);
  mode.init();
  dock.init();

  // ?dive=N opens a layer deep dive on load
  const qd = new URLSearchParams(location.search).get('dive');
  if (qd) setTimeout(() => dive.open(+qd), 300);
})();
