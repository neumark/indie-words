// Fills the static markup in App.tsx: ranked lists, the word scatter, and the
// artist beeswarm. Everything is derived from src/data/lyrics.ts in the browser.
// mountPage() returns a cleanup so React StrictMode's double mount is harmless.
import { DATA } from '../data/lyrics';

type Row = (string | number)[];
interface Stat {
  w: string; r: Row; a: number; b: number; pa: number; pb: number;
  lr: number; lo: number; hi: number; ok: boolean;
}
interface WordPt { x: number; y: number; s: Stat }
interface ArtistPt { x: number; y: number; a: Row }

const G = DATA.g, NS = DATA.n, W = DATA.w, A = DATA.a, LN2 = Math.LN2;
const NAME: Record<string, string> = {
  indie: 'Indie', alt: 'Alt rock & emo', rock: 'Mainstream rock', punk: 'Punk', metal: 'Metal',
  pop: 'Pop', rnb: 'R&B & gospel', hiphop: 'Hip hop', country: 'Country',
  electronic: 'Dance & electronic', other: 'Jazz, folk & the rest',
};
const CMPNAME: Record<string, string> = {
  all: 'non-indie', alt: 'alt rock', rock: 'mainstream rock', punk: 'punk', metal: 'metal',
  pop: 'pop', rnb: 'R&B or gospel', hiphop: 'hip hop', country: 'country', electronic: 'dance',
  other: 'jazz, folk or reggae',
};
const fmt = (n: number) => n.toLocaleString('en-US');
const pct = (p: number) => {
  const v = p * 100;
  return (v >= 10 ? v.toFixed(0) : v >= 1 ? v.toFixed(1) : v.toFixed(2)) + '%';
};
const times = (lr: number) => {
  const t = Math.pow(2, Math.abs(lr));
  return (t >= 10 ? t.toFixed(0) : t.toFixed(1)) + '×';
};
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const num = (v: string | number) => v as number;
const str = (v: string | number) => v as string;
const ROW = 54;

export function mountPage(root: HTMLElement): () => void {
  const ac = new AbortController();
  const opt = { signal: ac.signal };
  const $ = <T extends HTMLElement = HTMLElement>(id: string) => root.querySelector<T>('#' + id)!;
  const css = (v: string) => getComputedStyle(root).getPropertyValue(v).trim();
  let cmp = 'all';
  let S: Stat[] = [];
  let selW: string | null = null;
  let selA: string | null = null;
  let scPts: WordPt[] = [];
  let bsPts: ArtistPt[] = [];

  function compute() {
    const idx = cmp === 'all' ? G.map((_, i) => i).slice(1) : [G.indexOf(cmp)];
    const na = NS[0], nb = idx.reduce((s, i) => s + NS[i], 0);
    S = W.map((r) => {
      const a = num(r[1]);
      let b = 0;
      for (const i of idx) b += num(r[1 + i]);
      const pa = (a + 0.5) / (na + 1), pb = (b + 0.5) / (nb + 1), lr = Math.log2(pa / pb);
      const se = Math.sqrt(Math.max(1e-9, 1 / (a + 0.5) - 1 / (na + 1) + 1 / (b + 0.5) - 1 / (nb + 1))) / LN2;
      return { w: str(r[0]), r, a, b, pa, pb, lr, lo: lr - 1.645 * se, hi: lr + 1.645 * se, ok: a + b >= 40 };
    });
  }
  const ranked = () => S.filter((s) => s.ok).sort((x, y) => y.lo - x.lo);
  const rankedLow = () => S.filter((s) => s.ok).sort((x, y) => x.hi - y.hi);

  function listRows(el: HTMLElement, rows: Stat[]) {
    const mx = Math.max(...rows.map((s) => Math.abs(s.lr)));
    el.innerHTML = rows.map((s, i) =>
      `<li><button data-w="${esc(s.w)}"><span class="rk">${i + 1}</span><span class="wd">${esc(s.w)}</span><span><span class="bar" style="display:block;width:${Math.max(3, (Math.abs(s.lr) / mx) * 100)}%"></span></span><span class="val">${times(s.lr)}</span></button></li>`,
    ).join('');
  }
  function renderLists() {
    listRows($('most'), ranked().slice(0, 20));
    listRows($('least'), rankedLow().slice(0, 20));
    root.querySelectorAll('.cmpname').forEach((e) => { e.textContent = CMPNAME[cmp]; });
  }
  function selectWord(w: string | null, scroll?: boolean) {
    const s = S.find((x) => x.w === w);
    if (!s) return;
    selW = s.w;
    $('dword').textContent = s.w;
    $('dsum').textContent = `In ${fmt(s.a)} of ${fmt(NS[0])} indie songs. ` +
      (s.lr >= 0 ? `${times(s.lr)} as likely in indie as in ${CMPNAME[cmp]} songs.`
        : `${times(s.lr)} less likely in indie than in ${CMPNAME[cmp]} songs.`);
    const sh = G.map((g, i) => ({ g, p: num(s.r[1 + i]) / NS[i] })).sort((x, y) => y.p - x.p);
    const mx = sh[0].p || 1;
    $('dbars').innerHTML = sh.map((o) =>
      `<div class="gb${o.g === 'indie' ? ' me' : ''}"><span>${esc(NAME[o.g])}</span><span><span class="bar" style="display:block;width:${Math.max(0.5, (o.p / mx) * 100)}%"></span></span><span class="v">${pct(o.p)}</span></div>`,
    ).join('');
    drawSc();
    if (scroll) {
      $('explorer').scrollIntoView({
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    }
  }

  /* canvas helpers */
  function prep(c: HTMLCanvasElement, h: number): [CanvasRenderingContext2D, number] {
    const w = c.parentElement!.clientWidth, d = window.devicePixelRatio || 1;
    c.width = w * d; c.height = h * d; c.style.height = h + 'px';
    const x = c.getContext('2d')!;
    x.setTransform(d, 0, 0, d, 0, 0);
    x.clearRect(0, 0, w, h);
    return [x, w];
  }
  const tip = $('tip');
  function showTip(wrap: HTMLElement, x: number, y: number, html: string) {
    if (tip.parentElement !== wrap) wrap.appendChild(tip);
    tip.innerHTML = html; tip.hidden = false;
    const w = wrap.clientWidth, tw = tip.offsetWidth;
    tip.style.left = Math.max(0, Math.min(w - tw, x + 12)) + 'px';
    tip.style.top = y + 14 + 'px';
  }
  function nearest<P extends { x: number; y: number }>(pts: P[], x: number, y: number, r: number): P | null {
    let b: P | null = null, bd = r * r;
    for (const p of pts) {
      const d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d < bd) { bd = d; b = p; }
    }
    return b;
  }
  function hook<P extends { x: number; y: number }>(
    c: HTMLCanvasElement, getPts: () => P[], html: (p: P) => string, onPick: (p: P) => void,
  ) {
    const wrap = c.parentElement!;
    const at = (e: MouseEvent): [number, number] => {
      const r = c.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    c.addEventListener('pointermove', (e) => {
      const [x, y] = at(e), p = nearest(getPts(), x, y, 16);
      if (p) { showTip(wrap, p.x, p.y, html(p)); c.style.cursor = 'pointer'; }
      else { tip.hidden = true; c.style.cursor = ''; }
    }, opt);
    c.addEventListener('pointerleave', () => { tip.hidden = true; }, opt);
    c.addEventListener('click', (e) => {
      const [x, y] = at(e), p = nearest(getPts(), x, y, 18);
      if (p) { onPick(p); showTip(wrap, p.x, p.y, html(p)); }
    }, opt);
  }

  /* word scatter */
  function drawSc() {
    const c = $<HTMLCanvasElement>('sc');
    const H = Math.min(560, Math.max(380, c.parentElement!.clientWidth * 0.8));
    const [x, Wd] = prep(c, H);
    const ink = css('--ink'), ink2 = css('--ink-2'), line = css('--line'), pink = css('--pink'),
      paper = css('--paper'), mk = css('--mark'), mkInk = css('--mark-ink');
    const m = { l: 44, r: 10, t: 14, b: 26 }, pts = S.filter((s) => s.ok);
    let lo = Math.floor(Math.min(...pts.map((s) => s.lr))), hi = Math.ceil(Math.max(...pts.map((s) => s.lr)));
    lo = Math.max(lo, -7); hi = Math.min(Math.max(hi, 2), 6);
    const L0 = Math.log10(0.0005);
    const X = (p: number) => m.l + ((Math.log10(Math.max(p, 0.0005)) - L0) / (0 - L0)) * (Wd - m.l - m.r);
    const Y = (v: number) => m.t + ((hi - Math.max(lo, Math.min(hi, v))) / (hi - lo)) * (H - m.t - m.b);
    x.font = '12px "Courier Prime",monospace'; x.textBaseline = 'middle';
    const step = hi - lo > 8 ? 2 : 1;
    for (let v = lo; v <= hi; v += step) {
      x.strokeStyle = v === 0 ? ink : line; x.lineWidth = v === 0 ? 1.5 : 1;
      x.beginPath(); x.moveTo(m.l, Y(v)); x.lineTo(Wd - m.r, Y(v)); x.stroke();
      x.fillStyle = ink2; x.textAlign = 'right';
      x.fillText(v === 0 ? 'even' : v > 0 ? Math.pow(2, v) + '×' : '÷' + Math.pow(2, -v), m.l - 6, Y(v));
    }
    x.textAlign = 'center'; x.textBaseline = 'top';
    for (const p of [0.001, 0.01, 0.1, 1]) {
      x.fillStyle = ink2; x.fillText(+(p * 100).toFixed(1) + '%', Math.min(X(p), Wd - 18), H - m.b + 8);
    }
    x.textAlign = 'left'; x.textBaseline = 'alphabetic'; x.fillStyle = ink2;
    x.fillText('more indie ↑', m.l + 6, m.t + 10);
    scPts = pts.map((s) => ({ x: X(s.pa), y: Y(s.lr), s }));
    x.globalAlpha = 0.42;
    for (const p of scPts) {
      x.fillStyle = p.s.lo > 0 ? pink : ink2;
      x.beginPath(); x.arc(p.x, p.y, 2.4, 0, 7); x.fill();
    }
    x.globalAlpha = 1;
    /* selective labels: the extremes, a few landmarks, and the selected word */
    const lab = [...ranked().slice(0, 9), ...rankedLow().slice(0, 6)];
    const boxes: number[][] = [];
    if (Wd > 520) {
      for (const w of ['love', 'baby', 'the', 'heart', 'sleep', 'town']) {
        const s = pts.find((q) => q.w === w);
        if (s && !lab.includes(s)) lab.push(s);
      }
    }
    const sel = S.find((q) => q.w === selW);
    if (sel) lab.unshift(sel);
    x.font = '500 13px "Bricolage Grotesque",Arial,sans-serif';
    for (const s of lab) {
      const px = X(s.pa), py = Y(s.lr), tw = x.measureText(s.w).width, isS = s === sel;
      let bx = px + 7;
      if (bx + tw > Wd - 2) bx = px - 7 - tw;
      const b = [bx - 2, py - 9, tw + 4, 18];
      if (!isS && boxes.some((o) => b[0] < o[0] + o[2] && o[0] < b[0] + b[2] && b[1] < o[1] + o[3] && o[1] < b[1] + b[3])) continue;
      boxes.push(b);
      if (isS) {
        x.fillStyle = mk; x.fillRect(b[0], b[1], b[2], b[3]);
        x.strokeStyle = ink; x.lineWidth = 2; x.beginPath(); x.arc(px, py, 5, 0, 7); x.stroke();
      } else {
        x.fillStyle = paper; x.globalAlpha = 0.8; x.fillRect(b[0], b[1], b[2], b[3]); x.globalAlpha = 1;
        x.fillStyle = ink; x.beginPath(); x.arc(px, py, 2.6, 0, 7); x.fill();
      }
      x.fillStyle = isS ? mkInk : ink; x.textBaseline = 'middle'; x.fillText(s.w, bx, py + 1);
    }
  }

  /* artist beeswarm: one row per genre */
  function drawBs() {
    const c = $<HTMLCanvasElement>('bs'), H = G.length * ROW + 26;
    const [x, Wd] = prep(c, H);
    const ink = css('--ink'), ink2 = css('--ink-2'), line = css('--line'), pink = css('--pink'),
      mk = css('--mark'), mkInk = css('--mark-ink');
    const lo = -5, hi = 2.5, m = { l: 6, r: 10 };
    const X = (v: number) => m.l + ((Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)) * (Wd - m.l - m.r);
    x.font = '12px "Courier Prime",monospace';
    for (const v of [-4, -2, 0, 2]) {
      x.strokeStyle = v === 0 ? ink : line; x.lineWidth = v === 0 ? 1.5 : 1;
      x.beginPath(); x.moveTo(X(v), 0); x.lineTo(X(v), H - 22); x.stroke();
      x.fillStyle = ink2; x.textAlign = 'center'; x.textBaseline = 'top';
      x.fillText(v === 0 ? 'average artist' : (v > 0 ? '+' : '−') + Math.abs(v) + ' SD', Math.max(48, X(v)), H - 16);
    }
    bsPts = [];
    const dia = 5, half = ROW / 2 - 13;
    G.forEach((g, gi) => {
      const cy = gi * ROW + ROW / 2 + 8, bins: Record<number, number> = {};
      x.fillStyle = g === 'indie' ? pink : ink; x.textAlign = 'left'; x.textBaseline = 'top';
      x.font = (g === 'indie' ? '700 ' : '') + '12.5px "Courier Prime",monospace';
      x.fillText(NAME[g], m.l, gi * ROW + 3);
      x.globalAlpha = g === 'indie' ? 0.7 : 0.5; x.fillStyle = g === 'indie' ? pink : ink2;
      for (const a of A) {
        if (a[1] !== gi) continue;
        const b = Math.round(X(num(a[3])) / dia), k = (bins[b] = (bins[b] || 0) + 1);
        const off = Math.max(-half, Math.min(half, (k % 2 ? -1 : 1) * Math.floor(k / 2) * dia * 0.8));
        const p = { x: b * dia, y: cy + off, a };
        bsPts.push(p);
        x.beginPath(); x.arc(p.x, p.y, 2.1, 0, 7); x.fill();
      }
      x.globalAlpha = 1;
    });
    const p = bsPts.find((q) => q.a[0] === selA);
    if (p && selA) {
      x.fillStyle = mk; x.strokeStyle = ink; x.lineWidth = 2;
      x.beginPath(); x.arc(p.x, p.y, 5.5, 0, 7); x.fill(); x.stroke();
      x.font = '500 13px "Bricolage Grotesque",Arial,sans-serif';
      const tw = x.measureText(selA).width;
      let bx = p.x + 10;
      if (bx + tw > Wd - 2) bx = p.x - 10 - tw;
      x.fillStyle = mk; x.fillRect(bx - 3, p.y - 9, tw + 6, 18);
      x.fillStyle = mkInk; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText(selA, bx, p.y + 1);
    }
  }
  const scores = A.map((a) => num(a[3]));
  function selectArtist(n: string) {
    const a = A.find((q) => str(q[0]).toLowerCase() === n.toLowerCase());
    if (!a) return;
    selA = str(a[0]);
    const below = (scores.filter((v) => v < num(a[3])).length / scores.length) * 100;
    $('ainfo').textContent = `${selA}: filed under ${NAME[G[num(a[1])]]}, ${a[2]} songs. Vocabulary more indie than ${below.toFixed(0)}% of artists.`;
    drawBs();
  }
  function aRows(el: HTMLElement, rows: Row[]) {
    el.innerHTML = rows.map((a, i) =>
      `<li><button data-a="${esc(str(a[0]))}"><span class="rk">${i + 1}</span><span class="wd">${esc(str(a[0]))}</span><span class="tag">${esc(NAME[G[num(a[1])]])}</span></button></li>`,
    ).join('');
  }

  /* boot */
  compute();
  const top = ranked();
  $('nsongs').textContent = fmt(NS.reduce((s, n) => s + n, 0));
  $('nwords').textContent = fmt(W.length);
  $('topword').textContent = top[0].w;
  $('topstat').textContent = `In ${pct(top[0].pa)} of indie songs and ${pct(top[0].pb)} of everything else. That makes it ${times(top[0].lr)} as likely to be sung by an indie band.`;
  const pmx = top[1].lo, pmn = top[40].lo;
  $('poster').innerHTML = top.slice(1, 41).map((s) =>
    `<button data-w="${esc(s.w)}" style="font-size:${(17 + ((s.lo - pmn) / (pmx - pmn)) * 27).toFixed(0)}px">${esc(s.w)}</button>`,
  ).join('');
  $('chips').innerHTML = ['all', ...G.slice(1)].map((g) =>
    `<button class="chip" data-c="${g}" aria-pressed="${g === cmp}">${g === 'all' ? 'Everything else' : esc(NAME[g])}</button>`,
  ).join('');
  $('wlist').innerHTML = W.map((r) => `<option value="${esc(str(r[0]))}">`).join('');
  $('alist').innerHTML = A.map((a) => `<option value="${esc(str(a[0]))}">`).join('');
  aRows($('atop'), A.slice(0, 12));
  aRows($('aother'), A.filter((a) => a[1] !== 0).slice(0, 12));
  renderLists();
  selectWord(top[0].w);
  selectArtist('Neutral Milk Hotel');

  root.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest('button');
    if (!b) return;
    if (b.dataset.w) selectWord(b.dataset.w, true);
    else if (b.dataset.a) {
      selectArtist(b.dataset.a);
      $('bs').scrollIntoView({ block: 'center', behavior: 'auto' });
    } else if (b.dataset.c) {
      cmp = b.dataset.c;
      root.querySelectorAll<HTMLElement>('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.c === cmp)));
      compute(); renderLists(); selectWord(selW);
    }
  }, opt);
  $<HTMLInputElement>('wq').addEventListener('input', (e) => selectWord((e.target as HTMLInputElement).value.trim().toLowerCase()), opt);
  $<HTMLInputElement>('aq').addEventListener('input', (e) => selectArtist((e.target as HTMLInputElement).value.trim()), opt);
  hook($<HTMLCanvasElement>('sc'), () => scPts,
    (p) => `<b>${esc(p.s.w)}</b><br>${pct(p.s.pa)} of indie songs<br>${pct(p.s.pb)} of ${CMPNAME[cmp]} songs`,
    (p) => selectWord(p.s.w));
  hook($<HTMLCanvasElement>('bs'), () => bsPts,
    (p) => `<b>${esc(str(p.a[0]))}</b><br>${esc(NAME[G[num(p.a[1])]])} · ${p.a[2]} songs<br>${num(p.a[3]) > 0 ? '+' : '−'}${Math.abs(num(p.a[3])).toFixed(1)} SD`,
    (p) => selectArtist(str(p.a[0])));

  const redraw = () => { drawSc(); drawBs(); };
  let rt: number | undefined;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = window.setTimeout(redraw, 120); }, opt);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', redraw, opt);
  const mo = new MutationObserver(redraw);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  if (document.fonts?.ready) void document.fonts.ready.then(() => { if (!ac.signal.aborted) redraw(); });

  return () => {
    ac.abort(); mo.disconnect(); clearTimeout(rt);
    root.appendChild(tip); tip.hidden = true;
  };
}
