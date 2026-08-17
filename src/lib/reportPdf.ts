// Fortify AI report -> PDF pipeline (client-side).
//
// Extracted out of AIReadinessScan.astro so the exact same code path that
// emails prospects can also be driven from /report-pdf-test, which is the only
// way to verify a change here without pushing a real lead through HubSpot.
//
// Pipeline: report HTML (lib/report.ts) -> isolated iframe -> html2canvas
// -> per-page bitmap -> jsPDF. See CAPTURE NOTES below for why each guard
// exists; several of them are load-bearing and easy to "clean up" into bugs.

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
  reportCss, internalCoverPage, internalFindingsPage, internalClosingPage, findingCard,
  INTERNAL_PAGE_MARGIN_IN, INTERNAL_CARD_GAP_IN, INTERNAL_CONTENT_TOP_IN, INTERNAL_FOOTER_RESERVE_IN,
  type ReportData, type ReportFinding, type RenderOpts,
} from './report';

const PAGE_W_IN = 8.5;
const PAGE_H_IN = 11;
const CSS_PX_PER_IN = 96;
const CAPTURE_SCALE = 3;

// Per-page capture record, returned alongside the PDF so callers (and the test
// harness) can assert on what actually happened instead of trusting the bytes.
export type CaptureInfo = {
  page: number;
  canvasW: number;
  canvasH: number;
  /** canvasW / canvasH */
  aspect: number;
  /** 8.5/11 — what the page box is */
  targetAspect: number;
  /** How far off-aspect the capture was, as a ratio. 1.0 = perfect. */
  aspectError: number;
  /** Placement on the Letter page, in inches. */
  placed: { x: number; y: number; w: number; h: number };
  /** True when the capture was letterboxed rather than filling the page. */
  letterboxed: boolean;
};

export type PdfResult = { base64: string | null; captures: CaptureInfo[] };

// Per-page overflow audit. .fa-page is a fixed 11in box with overflow:hidden,
// so content that doesn't fit is silently cropped out of the PDF — the
// disclaimer and sign-off block go first, and nothing anywhere reports it.
// This measures each page's real content height against the page box.
export type OverflowInfo = {
  page: number;
  /** data-p attribute, e.g. "03" */
  label: string;
  contentPx: number;
  boxPx: number;
  overflowPx: number;
  clipped: boolean;
  /** Text of the deepest elements that fall past the page edge. */
  lost: string[];
};

export async function auditPageOverflow(html: string): Promise<OverflowInfo[]> {
  const { fdoc, remove } = await renderReportIframe('<div class="fa-report">' + html + '</div>');
  try {
    const pages = Array.from(fdoc.querySelectorAll('.fa-page')) as HTMLElement[];
    return pages.map((p, i) => {
      const boxPx = Math.round(p.getBoundingClientRect().height);
      // Unclamp so scrollHeight reports true content height rather than the
      // fixed box height that overflow:hidden pins it to.
      const prevOverflow = p.style.overflow, prevHeight = p.style.height;
      p.style.overflow = 'visible';
      p.style.height = 'auto';
      const contentPx = p.scrollHeight;
      const pageBottom = p.getBoundingClientRect().top + boxPx;
      const lost: string[] = [];
      p.querySelectorAll('*').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (!r.height || r.top < pageBottom) return;
        if (el.children.length) return; // leaf nodes only, so we don't list wrappers
        const t = (el.textContent || '').trim();
        if (t && lost.indexOf(t) < 0) lost.push(t.slice(0, 70));
      });
      p.style.overflow = prevOverflow;
      p.style.height = prevHeight;
      return {
        page: i + 1,
        label: p.getAttribute('data-p') || String(i + 1),
        contentPx,
        boxPx,
        overflowPx: contentPx - boxPx,
        clipped: contentPx > boxPx,
        lost: lost.slice(0, 8),
      };
    });
  } finally { remove(); }
}

// Renders arbitrary body HTML inside an isolated iframe (its own document, so
// none of the site's global CSS — h1 colors, section/div rules, etc. — can leak
// in and override the report's own styles) with the report's fonts and CSS
// loaded, and waits until it's actually safe to read layout from (fonts +
// images settled). Caller reads/measures/captures, then must call remove().
export async function renderReportIframe(bodyHtml: string): Promise<{ fdoc: Document; win: any; remove: () => void }> {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;left:-99999px;top:0;width:900px;height:1150px;border:0;';
  document.body.appendChild(iframe);
  const fdoc = iframe.contentDocument as Document;
  const fontsHref = "https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap";
  fdoc.open();
  fdoc.write(
    '<!doctype html><html><head><meta charset="utf-8">' +
    // crossorigin is required — without it the browser blocks JS (and
    // html2canvas's internal font resolution) from reading this stylesheet's
    // @font-face rules at all, since it's cross-origin. The capture then
    // silently falls back to a serif system font.
    '<link id="fa-fonts-link" rel="stylesheet" crossorigin="anonymous" href="' + fontsHref + '">' +
    // No text-wrap override here: html2canvas's own text-layout engine
    // mis-measured "balance"/"pretty" wrapping (silently dropped spaces, e.g.
    // "throughpersonalaccounts"), but the actual fix was switching the capture
    // itself to foreignObjectRendering (real browser text layout) — see
    // htmlPagesToPdf. A blanket text-wrap override here fought with
    // intentional white-space:nowrap elsewhere (they share the same underlying
    // CSS longhand) and broke section headers.
    '<style>html,body{margin:0;padding:0;font-family:\'IBM Plex Sans\',sans-serif;}' + reportCss() +
    // text-wrap:balance/pretty are the one place where the rasterizer's line
    // breaking visibly disagrees with the browser's. When html2canvas breaks a
    // balanced heading into more lines than the layout box was measured for,
    // the following paragraph is positioned against the one-line height and
    // prints ON TOP of the heading's second line — the overlap seen on finding
    // cards. Forcing plain greedy wrapping for the capture keeps the two
    // engines in agreement; the web report keeps its nicer wrapping.
    //
    // Scoped to h3/p deliberately. text-wrap is a white-space longhand, so a
    // blanket rule would also clobber the intentional white-space:nowrap on
    // section headers (h2), footers, and the score numerals.
    '.fa-report h3,.fa-report p{text-wrap:wrap!important;}' +
    // The rasterizer re-lays-out inline text but keeps the block boxes at the
    // positions they were serialized with. It also measures text marginally
    // wider than the browser does, so a headline that fits on ONE line in the
    // DOM can wrap to TWO in the capture — and that second line is painted
    // straight through the paragraph underneath it. (Measured on finding 02:
    // h3 is 22.2px / 1 line in the DOM, 2 lines in the PNG.)
    //
    // Reserving two lines of height pins the paragraph's position low enough to
    // absorb that one-line drift. Residual risk: a headline that is genuinely
    // two lines in the DOM and drifts to three still collides. That is not
    // fixable from CSS — it goes away when the PDF is rendered by a real
    // browser engine instead of being screenshotted.
    '.fa-report .fa-card h3{min-height:2.56em;}' + '</style>' +
    '</head><body>' + bodyHtml + '</body></html>'
  );
  fdoc.close();

  await new Promise<void>((res) => {
    if (fdoc.readyState === 'complete') res();
    else iframe.addEventListener('load', () => res(), { once: true });
  });
  // Wait for the Google Fonts stylesheet itself to load (registering its
  // @font-face rules) before checking fonts.ready — otherwise fonts.ready can
  // resolve before the stylesheet has even been parsed, and the capture (or a
  // height measurement) silently uses a serif system font.
  const fontsLink = fdoc.getElementById('fa-fonts-link') as HTMLLinkElement | null;
  if (fontsLink) {
    await new Promise<void>((res) => {
      if ((fontsLink as any).sheet) res();
      else { fontsLink.addEventListener('load', () => res(), { once: true }); fontsLink.addEventListener('error', () => res(), { once: true }); }
    });
  }
  const win = iframe.contentWindow as any;
  if (win.document.fonts) {
    try {
      await Promise.all([
        win.document.fonts.load('700 25pt Archivo'), win.document.fonts.load('600 13pt Archivo'), win.document.fonts.load('500 13pt Archivo'), win.document.fonts.load('400 13pt Archivo'),
        win.document.fonts.load('400 10pt "IBM Plex Sans"'), win.document.fonts.load('500 10pt "IBM Plex Sans"'), win.document.fonts.load('600 10pt "IBM Plex Sans"'),
        win.document.fonts.load('500 10pt "IBM Plex Mono"'), win.document.fonts.load('600 10pt "IBM Plex Mono"'),
      ]);
      await win.document.fonts.ready;
    } catch (e) {}
  }
  const imgs = Array.from(fdoc.querySelectorAll('img'));
  await Promise.all(imgs.map((img: any) => img.complete ? Promise.resolve() : new Promise((res) => { img.onload = res; img.onerror = res; })));
  await new Promise((res) => setTimeout(res, 200));

  // foreignObjectRendering (used for the capture) only paints what's actually
  // within the iframe's rendered viewport — with a fixed 1150px height, every
  // page past the first was outside that viewport and came back blank. Grow the
  // iframe to fit the full stacked document (all .fa-page sections) before
  // returning.
  const fullHeight = Math.max(1150, fdoc.documentElement.scrollHeight, fdoc.body.scrollHeight);
  iframe.style.height = fullHeight + 'px';
  await new Promise((res) => setTimeout(res, 50));

  return { fdoc, win, remove: () => { if (iframe.parentNode) iframe.parentNode.removeChild(iframe); } };
}

// Lays out the internal report by each finding card's ACTUAL rendered height
// rather than a fixed count-per-page — a card's height varies with its "what to
// do" text length and peer rows, so a fixed 2-per-page rule either wastes most
// of a page on short findings or (with overflow:hidden on .fa-page) silently
// clips long ones. Bin-packs by real measured height, then returns the final
// page HTML ready for htmlPagesToPdf.
export async function buildInternalReportPages(d: ReportData, findings: ReportFinding[], opts: RenderOpts): Promise<string> {
  const company = d.preparedFor.company || '—';
  const rest = findings.slice(1);
  if (!rest.length) {
    return internalCoverPage(d, findings[0], findings.length, opts, 2) + internalClosingPage(d, opts, 2, 2);
  }

  const cardsHtml = rest.map((f) => findingCard(f, false));
  const { fdoc, remove } = await renderReportIframe(
    '<div class="fa-report"><div id="fa-measure" style="width:' + (PAGE_W_IN - 2 * INTERNAL_PAGE_MARGIN_IN) + 'in;position:absolute;visibility:hidden;">'
    + cardsHtml.map((c, i) => '<div id="fa-card-' + i + '">' + c + '</div>').join('')
    + '</div></div>'
  );
  const heightsPx = cardsHtml.map((_, i) => {
    const el = fdoc.getElementById('fa-card-' + i);
    return el ? el.getBoundingClientRect().height : 260;
  });
  remove();

  const PAGE_H_PX = PAGE_H_IN * CSS_PX_PER_IN;
  const budgetPx = PAGE_H_PX - (0.16 + INTERNAL_CONTENT_TOP_IN + INTERNAL_FOOTER_RESERVE_IN) * CSS_PX_PER_IN;
  const gapPx = INTERNAL_CARD_GAP_IN * CSS_PX_PER_IN;

  const groups: number[][] = [];
  let cur: number[] = [], curH = 0;
  heightsPx.forEach((h, i) => {
    const addH = h + (cur.length ? gapPx : 0);
    if (cur.length && curH + addH > budgetPx) { groups.push(cur); cur = []; curH = 0; }
    cur.push(i); curH += (cur.length > 1 ? gapPx : 0) + h;
  });
  if (cur.length) groups.push(cur);

  const totalPages = 1 + groups.length + 1;
  const cover = internalCoverPage(d, findings[0], findings.length, opts, totalPages);
  const middle = groups.map((idxs, i) =>
    internalFindingsPage(idxs.map((idx) => cardsHtml[idx]).join(''), company, i + 2, totalPages)
  ).join('');
  const closing = internalClosingPage(d, opts, totalPages, totalPages);
  return cover + middle + closing;
}

// Captures each .fa-page in the given HTML with html2canvas and assembles a
// Letter PDF. PNG (not JPEG) — JPEG's block compression blurs and "grains"
// sharp text edges, which reads as low quality on a text-heavy document.
//
// CAPTURE NOTES
//  - Each page is rendered in its OWN fresh iframe. foreignObjectRendering
//    delegates the paint to the browser's real SVG/text engine instead of
//    html2canvas's hand-rolled text layout (which silently dropped spaces —
//    "throughpersonalaccounts"), but it only reliably captures the FIRST page
//    when multiple pages share one iframe/window context; 2nd+ come back blank.
//  - width/height/windowWidth/windowHeight are pinned to the measured page box.
//    Left to its defaults, html2canvas sizes the clone container from the HOST
//    window and can hand back a canvas at an unrelated aspect ratio.
//  - The image is then FITTED to the page preserving aspect, never stretched to
//    fill it. A previous build called addImage(...,0,0,8.5,11) unconditionally,
//    so an off-aspect capture (observed as extreme as 4.2:1 against the page's
//    0.77:1) was squashed to Letter — which is what made text appear to smear
//    into the graphics. Letterboxing is the wrong-but-safe outcome: a
//    correctly-proportioned page with white margin, never a distorted one.
export async function htmlPagesToPdf(html: string): Promise<PdfResult> {
  const parser = new DOMParser();
  const parsed = parser.parseFromString('<div>' + html + '</div>', 'text/html');
  const pageEls = Array.from(parsed.querySelectorAll('.fa-page'));
  const captures: CaptureInfo[] = [];
  if (!pageEls.length) return { base64: null, captures };

  const targetAspect = PAGE_W_IN / PAGE_H_IN;

  try {
    const doc = new jsPDF({ unit: 'in', format: 'letter', compress: true });
    let added = 0;
    for (let i = 0; i < pageEls.length; i++) {
      const { fdoc, remove } = await renderReportIframe('<div class="fa-report">' + pageEls[i].outerHTML + '</div>');
      let canvas: HTMLCanvasElement | null = null;
      try {
        const pageEl = fdoc.querySelector('.fa-page') as HTMLElement | null;
        if (pageEl) {
          const box = pageEl.getBoundingClientRect();
          const w = Math.round(box.width) || PAGE_W_IN * CSS_PX_PER_IN;
          const h = Math.round(box.height) || PAGE_H_IN * CSS_PX_PER_IN;
          canvas = await html2canvas(pageEl, {
            scale: CAPTURE_SCALE,
            backgroundColor: '#ffffff',
            useCORS: true,
            foreignObjectRendering: true,
            width: w,
            height: h,
            windowWidth: w,
            windowHeight: h,
          });
        }
      } finally { /* canvas data is read below; iframe teardown is deferred */ }

      const imgData = canvas ? canvas.toDataURL('image/png') : null;
      remove();
      if (!canvas || !imgData) continue;

      // Fit-to-page, preserving aspect. Centered, so a mis-sized capture reads
      // as a margin problem rather than a distorted document.
      const aspect = canvas.width / canvas.height;
      let dw = PAGE_W_IN, dh = PAGE_H_IN;
      if (aspect > targetAspect) dh = PAGE_W_IN / aspect;   // too wide -> bars top/bottom
      else if (aspect < targetAspect) dw = PAGE_H_IN * aspect; // too tall -> bars left/right
      const dx = (PAGE_W_IN - dw) / 2;
      const dy = (PAGE_H_IN - dh) / 2;

      captures.push({
        page: i + 1,
        canvasW: canvas.width,
        canvasH: canvas.height,
        aspect: +aspect.toFixed(4),
        targetAspect: +targetAspect.toFixed(4),
        aspectError: +(aspect / targetAspect).toFixed(4),
        placed: { x: +dx.toFixed(3), y: +dy.toFixed(3), w: +dw.toFixed(3), h: +dh.toFixed(3) },
        letterboxed: dx > 0.001 || dy > 0.001,
      });

      if (added > 0) doc.addPage('letter');
      doc.addImage(imgData, 'PNG', dx, dy, dw, dh, undefined, 'FAST');
      added++;
    }
    if (!added) return { base64: null, captures };
    return { base64: doc.output('datauristring').split(',')[1] || null, captures };
  } catch (e) {
    return { base64: null, captures };
  }
}

// Data URIs have no origin, so they can't be cross-origin-tainted — sidesteps
// foreignObjectRendering's stricter same-origin image handling inside the
// detached capture iframe (a plain absolute same-site URL still reads as
// cross-origin from that iframe's blank document context).
export async function imageToDataUri(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) { return url; }
}
