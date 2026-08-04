// Fortify AI Readiness & Risk Report — shared renderer.
// Produces the three-page, print-first client report from a scan record.
// Used by /report (web, with screen-only glow) and by the scan flow for
// building the private link + generating the team's PDF.
//
// Geometry, colors, and type scale follow the design handoff exactly. Square
// corners everywhere; US Letter; horizontal inset 0.55in. Glow is layered on
// screen only via CSS classes (see reportCss) and never prints.

export type Peer = { label: string; pct: number };
export type ReportFinding = {
  category: string;      // "ENABLEMENT"
  index: string;         // "FINDING 01"
  headline: string;
  body: string;
  action: string;        // "What to do" — may contain <strong>
  peers: Peer[];         // 3 rows (small / mid / enterprise)
};
export type LockedArea = {
  area: string;          // "SHADOW AI"
  assessment: string;    // "High priority" | "Worth reviewing"
  priority: 'high' | 'normal';
  confidence: number;    // 0-100
};
export type ReportData = {
  scanId: string;
  preparedFor: { name: string; company: string; email: string; phone: string; website: string; industry: string; sizeBand: string };
  date: string;
  exposureScore: number;         // 0-100
  severityBand: string;          // LOW | MODERATE | ELEVATED | SEVERE
  severityNote: string;
  metrics: { label: string; value: string; accent: string; valueColor: string; blurb: string }[];
  findings: ReportFinding[];     // full-detail findings (3 for the client)
  policyFlag?: { label: string; text: string };
  lockedAreas: LockedArea[];
  analystNote: string;
  cta: { headline: string; body: string; url: string; company: string };
  scanInputs: { question: string; answer: string }[];
  preparedBy: { name: string; title: string; contactLine: string };
  disclaimer: string;
};

export type RenderOpts = {
  logoFortify?: string;   // src or data URL (dark-bg lockup)
  logoInett?: string;     // src or data URL (light-bg logo)
  glow?: boolean;         // add glow class hooks (web); print CSS strips them
};

const C = {
  navy: '#0B2440', deepest: '#071523', navy3: '#0A3358',
  ink: '#0C1622', body: '#3C4A57', panel: '#20303D', muted: '#6B7C8B', faint: '#8A97A3', footer: '#9AA8B4',
  cyan: '#12A5DB', link: '#0E7FB0', lightCyan: '#7FD4F2', paleBar: '#9AC9DE',
  white: '#FFFFFF', tint: '#F2F6F9', border: '#DCE4EA', hairline: '#EDF1F4', track: '#E4EAEF',
  red: '#B3261E', amber: '#C77A0A', warnDark: '#FFC46B',
};
const MAST = `linear-gradient(103deg,${C.deepest} 0%,${C.navy} 55%,${C.navy3} 100%)`;
const RULE = `linear-gradient(90deg,${C.navy},${C.cyan})`;

export function esc(s: any): string {
  return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as any)[c]);
}
const mono = "font-family:'IBM Plex Mono',monospace";
const arch = "font-family:'Archivo',sans-serif";

function bandColor(band: string): string {
  return band === 'SEVERE' ? '#FF7A6B' : band === 'ELEVATED' ? C.warnDark : band === 'MODERATE' ? C.lightCyan : '#7BE0A8';
}

function peerRows(peers: Peer[]): string {
  const colors = [C.navy, C.cyan, C.paleBar];
  return peers.slice(0, 3).map((p, i) =>
    `<span style="font-size:7.6pt;color:${C.body};">${esc(p.label)}</span>`
    + `<span style="height:5px;background:${C.track};display:block;"><span style="display:block;height:5px;width:${Math.max(0, Math.min(100, p.pct))}%;background:${colors[i]};"></span></span>`
    + `<span style="${mono};font-size:7.2pt;color:${C.navy};text-align:right;">${p.pct}%</span>`
  ).join('');
}

function findingCard(f: ReportFinding, glow: boolean): string {
  return `<article class="fa-card${glow ? ' fa-glow-card' : ''}" style="border:1px solid ${C.border};border-top:3px solid ${C.navy};padding:0.2in 0.22in;background:${C.white};">
    <div style="display:flex;align-items:baseline;justify-content:space-between;gap:0.2in;margin-bottom:8px;">
      <span style="${mono};font-size:7pt;letter-spacing:0.16em;color:${C.link};">${esc(f.category)}</span>
      <span style="${mono};font-size:7pt;letter-spacing:0.16em;color:${C.footer};">${esc(f.index)}</span>
    </div>
    <h3 style="${arch};font-weight:600;font-size:13pt;line-height:1.25;margin:0 0 7px;color:${C.ink};text-wrap:balance;">${esc(f.headline)}</h3>
    <p style="font-size:8.8pt;line-height:1.5;margin:0 0 0.14in;color:${C.body};text-wrap:pretty;">${esc(f.body)}</p>
    <div style="display:grid;grid-template-columns:1fr 2.15in;gap:0.22in;align-items:start;">
      <div class="${glow ? 'fa-glow-action' : ''}" style="background:${C.tint};border-left:3px solid ${C.cyan};padding:0.13in 0.16in;">
        <span style="${mono};font-size:6.8pt;letter-spacing:0.14em;color:${C.navy};display:block;margin-bottom:4px;">WHAT TO DO</span>
        <span style="font-size:8.6pt;line-height:1.45;color:${C.panel};">${f.action}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        <span style="${mono};font-size:6.4pt;letter-spacing:0.13em;color:${C.muted};">PEERS REPORTING THIS ISSUE</span>
        <div style="display:grid;grid-template-columns:0.82in 1fr 0.3in;align-items:center;gap:7px;">${peerRows(f.peers)}</div>
      </div>
    </div>
  </article>`;
}

function metricTile(m: { label: string; value: string; accent: string; valueColor: string; blurb: string }, glow: boolean): string {
  const high = m.accent === C.red;
  return `<div class="${glow && high ? 'fa-glow-high' : ''}" style="border:1px solid ${C.border};border-left:3px solid ${m.accent};padding:0.13in 0.17in;display:grid;grid-template-columns:1.55in 1fr;align-items:center;gap:0.16in;background:${C.white};">
    <div style="display:flex;flex-direction:column;gap:3px;">
      <span style="${mono};font-size:6.6pt;letter-spacing:0.14em;color:${C.muted};">${esc(m.label)}</span>
      <span style="${arch};font-weight:700;font-size:14pt;color:${m.valueColor};line-height:1;">${esc(m.value)}</span>
    </div>
    <span style="font-size:8.4pt;line-height:1.35;color:${C.body};">${esc(m.blurb)}</span>
  </div>`;
}

function lockedRow(a: LockedArea, last: boolean): string {
  const aColor = a.priority === 'high' ? C.red : C.body;
  const aWeight = a.priority === 'high' ? '500' : '400';
  return `<div style="display:grid;grid-template-columns:1.55in 1fr 0.75in 0.62in;align-items:center;gap:0.16in;padding:0.09in 0.17in;${last ? '' : `border-bottom:1px solid ${C.hairline};`}">
    <span style="${mono};font-size:7pt;letter-spacing:0.11em;color:${C.navy};">${esc(a.area)}</span>
    <span style="font-size:8.4pt;color:${aColor};font-weight:${aWeight};">${esc(a.assessment)}</span>
    <span style="${mono};font-size:7.4pt;color:${C.body};text-align:right;">${a.confidence}%</span>
    <span style="${mono};font-size:6.4pt;letter-spacing:0.12em;color:${C.footer};text-align:right;">LOCKED</span>
  </div>`;
}

function scanInputCell(q: string, ans: string, last: boolean): string {
  return `<div style="display:grid;grid-template-columns:1fr 1.35in;gap:0.1in;align-items:baseline;padding:${last ? '0.07in 0' : '0.095in 0'};${last ? '' : `border-bottom:1px solid ${C.hairline};`}">
    <span style="font-size:8.2pt;color:${C.body};">${esc(q)}</span>
    <span style="font-size:8.2pt;font-weight:500;color:${C.ink};">${esc(ans)}</span>
  </div>`;
}

function footer(company: string, n: number): string {
  return `<footer style="margin-top:auto;padding:0.22in 0.55in 0.3in;display:flex;align-items:center;justify-content:space-between;${mono};font-size:6.6pt;letter-spacing:0.13em;color:${C.footer};white-space:nowrap;">
    <span>i-NETT · FORTIFY AI</span><span>PREPARED FOR ${esc(company.toUpperCase())}</span><span>0${n} / 03</span>
  </footer>`;
}

export function renderReport(d: ReportData, opts: RenderOpts = {}): string {
  const glow = !!opts.glow;
  const fortify = opts.logoFortify || '/assets/brand/fortify-ai-logo.png';
  const inett = opts.logoInett || '/assets/brand/inett-logo.png';
  const scorePct = Math.max(0, Math.min(100, d.exposureScore));
  const company = d.preparedFor.company || '—';

  // ---- Page 1: masthead + contact strip + scorecard + finding 01 + contents ----
  const page1 = `<section class="fa-page" data-p="01" style="display:flex;flex-direction:column;background:${C.white};color:${C.ink};">
    <header class="${glow ? 'fa-glow-mast' : ''}" style="background:${MAST};color:#fff;padding:0.46in 0.55in 0.4in;display:flex;align-items:flex-start;justify-content:space-between;gap:0.4in;">
      <div style="display:flex;align-items:center;gap:0.28in;">
        <img src="${esc(fortify)}" alt="i-NETT Fortify AI" style="height:1.02in;width:auto;display:block;">
        <div style="display:flex;flex-direction:column;gap:7px;border-left:1px solid rgba(255,255,255,0.22);padding-left:0.28in;">
          <div style="${mono};font-size:7.6pt;letter-spacing:0.19em;color:${C.lightCyan};">AI READINESS &amp; RISK REPORT</div>
          <h1 style="${arch};font-weight:700;font-size:25pt;line-height:1.05;letter-spacing:-0.015em;margin:0;">Your Fortify AI<br>Scan Results</h1>
          <div style="font-size:8.6pt;color:rgba(255,255,255,0.66);">Prepared for ${esc(d.preparedFor.name)} · ${esc(company)} · ${esc(d.date)}</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;padding-top:4px;">
        <div style="${mono};font-size:7pt;letter-spacing:0.16em;color:${C.navy};background:${C.lightCyan};padding:4px 9px;">CONFIDENTIAL</div>
        <div style="${mono};font-size:7pt;letter-spacing:0.13em;color:rgba(255,255,255,0.5);">SCAN ${esc(d.scanId)}</div>
      </div>
    </header>

    <div style="display:grid;grid-template-columns:repeat(3,1fr);background:${C.tint};border-bottom:1px solid ${C.border};padding:0.14in 0.55in;">
      <div style="display:flex;flex-direction:column;gap:2px;"><span style="${mono};font-size:6.6pt;letter-spacing:0.15em;color:${C.muted};">CONTACT</span><span style="font-size:8.4pt;color:${C.ink};">${esc(d.preparedFor.email)}</span></div>
      <div style="display:flex;flex-direction:column;gap:2px;"><span style="${mono};font-size:6.6pt;letter-spacing:0.15em;color:${C.muted};">CELL</span><span style="font-size:8.4pt;color:${C.ink};">${esc(d.preparedFor.phone)}</span></div>
      <div style="display:flex;flex-direction:column;gap:2px;"><span style="${mono};font-size:6.6pt;letter-spacing:0.15em;color:${C.muted};">ORGANIZATION</span><span style="font-size:8.4pt;color:${C.ink};">${esc([d.preparedFor.website, d.preparedFor.industry, d.preparedFor.sizeBand].filter(Boolean).join(' · '))}</span></div>
    </div>

    <div style="padding:0.32in 0.55in 0;display:grid;grid-template-columns:2.45in 1fr;gap:0.3in;align-items:stretch;">
      <div class="fa-score${glow ? ' fa-glow-score' : ''}" style="border:1px solid ${C.navy};background:${C.navy};color:#fff;padding:0.2in 0.22in;display:flex;flex-direction:column;gap:10px;">
        <div style="${mono};font-size:7pt;letter-spacing:0.17em;color:${C.lightCyan};">EXPOSURE SCORE</div>
        <div style="display:flex;align-items:baseline;gap:8px;">
          <span style="${arch};font-weight:700;font-size:44pt;line-height:0.85;letter-spacing:-0.03em;">${scorePct}</span>
          <span style="${arch};font-weight:500;font-size:13pt;color:rgba(255,255,255,0.55);">/ 100</span>
        </div>
        <div style="height:6px;background:rgba(255,255,255,0.16);position:relative;"><div class="${glow ? 'fa-glow-bar' : ''}" style="position:absolute;inset:0 auto 0 0;width:${scorePct}%;background:linear-gradient(90deg,${C.cyan},${C.lightCyan});"></div></div>
        <div style="display:flex;justify-content:space-between;${mono};font-size:6.4pt;letter-spacing:0.12em;color:rgba(255,255,255,0.45);"><span>LOW</span><span>MODERATE</span><span>ELEVATED</span><span>SEVERE</span></div>
        <div style="margin-top:auto;padding-top:10px;border-top:1px solid rgba(255,255,255,0.16);display:flex;align-items:center;gap:8px;">
          <span style="${arch};font-weight:600;font-size:10pt;letter-spacing:0.08em;color:${bandColor(d.severityBand)};">${esc(d.severityBand)}</span>
          <span style="font-size:7.8pt;color:rgba(255,255,255,0.6);line-height:1.3;">${esc(d.severityNote)}</span>
        </div>
      </div>
      <div style="display:grid;grid-template-rows:repeat(3,1fr);gap:0.11in;">${d.metrics.map((m) => metricTile(m, glow)).join('')}</div>
    </div>

    <div style="padding:0.3in 0.55in 0;">
      <div style="display:flex;align-items:center;gap:0.16in;border-bottom:2px solid ${C.navy};padding-bottom:7px;">
        <h2 style="${arch};font-weight:700;font-size:12.5pt;letter-spacing:0.02em;margin:0;color:${C.navy};">Your top priorities — and what to do about each</h2>
        <span style="${mono};font-size:6.8pt;letter-spacing:0.14em;color:${C.muted};margin-left:auto;white-space:nowrap;">${d.findings.length} FINDINGS</span>
      </div>
    </div>

    <div style="margin:0.2in 0.55in 0;">${d.findings[0] ? findingCard(d.findings[0], glow) : ''}</div>

    <div style="margin:0.3in 0.55in 0;border-top:1px solid ${C.border};padding-top:0.16in;display:grid;grid-template-columns:repeat(3,1fr);gap:0.24in;">
      <div style="display:flex;flex-direction:column;gap:4px;"><span style="${mono};font-size:6.6pt;letter-spacing:0.14em;color:${C.cyan};">PAGE 02</span><span style="font-size:8.6pt;font-weight:500;color:${C.ink};">Findings 02–03 &amp; the rest of your report</span><span style="font-size:7.8pt;line-height:1.4;color:${C.muted};">Third-party access, cyber insurance, and the areas reviewed in session.</span></div>
      <div style="display:flex;flex-direction:column;gap:4px;"><span style="${mono};font-size:6.6pt;letter-spacing:0.14em;color:${C.cyan};">PAGE 03</span><span style="font-size:8.6pt;font-weight:500;color:${C.ink};">Analyst note, next step &amp; scan inputs</span><span style="font-size:7.8pt;line-height:1.4;color:${C.muted};">Where to start, how to book the review, and every answer this was based on.</span></div>
      <div style="display:flex;flex-direction:column;gap:4px;"><span style="${mono};font-size:6.6pt;letter-spacing:0.14em;color:${C.cyan};">HOW TO READ THIS</span><span style="font-size:8.6pt;font-weight:500;color:${C.ink};">Findings are ordered by priority</span><span style="font-size:7.8pt;line-height:1.4;color:${C.muted};">Each one pairs what we saw with the specific action we recommend.</span></div>
    </div>
    ${footer(company, 1)}
  </section>`;

  // ---- Page 2: findings 02-03 + policy flag + locked-areas table ----
  const lockedRows = d.lockedAreas.map((a, i) => lockedRow(a, i === d.lockedAreas.length - 1)).join('');
  const page2 = `<section class="fa-page" data-p="02" style="display:flex;flex-direction:column;background:${C.white};color:${C.ink};">
    <div style="height:0.16in;background:${RULE};"></div>
    <div style="margin:0.4in 0.55in 0;">${d.findings[1] ? findingCard(d.findings[1], glow) : ''}</div>
    <div style="margin:0.2in 0.55in 0;">${d.findings[2] ? findingCard(d.findings[2], glow) : ''}</div>
    <div style="padding:0.34in 0.55in 0;">
      <div style="display:flex;align-items:center;gap:0.16in;border-bottom:2px solid ${C.navy};padding-bottom:7px;">
        <h2 style="${arch};font-weight:700;font-size:12.5pt;letter-spacing:0.02em;margin:0;color:${C.navy};">The rest of your report</h2>
        <span style="${mono};font-size:6.8pt;letter-spacing:0.14em;color:${C.muted};margin-left:auto;white-space:nowrap;">REVIEWED IN YOUR SESSION</span>
      </div>
      ${d.policyFlag ? `<div style="margin-top:0.16in;border:1px solid ${C.border};border-left:3px solid ${C.amber};padding:0.14in 0.17in;display:grid;grid-template-columns:1.55in 1fr;gap:0.16in;align-items:center;">
        <span style="${mono};font-size:6.8pt;letter-spacing:0.14em;color:${C.muted};">${esc(d.policyFlag.label)}</span>
        <span style="font-size:9pt;line-height:1.4;color:${C.ink};font-weight:500;">${esc(d.policyFlag.text)}</span>
      </div>` : ''}
      <div style="margin-top:0.11in;border:1px solid ${C.border};display:grid;">
        <div style="display:grid;grid-template-columns:1.55in 1fr 0.75in 0.62in;align-items:center;gap:0.16in;padding:0.085in 0.17in;background:${C.tint};border-bottom:1px solid ${C.border};${mono};font-size:6.4pt;letter-spacing:0.13em;color:${C.muted};">
          <span>AREA</span><span>ASSESSMENT</span><span style="text-align:right;">CONFIDENCE</span><span style="text-align:right;">STATUS</span>
        </div>
        ${lockedRows}
      </div>
    </div>
    ${footer(company, 2)}
  </section>`;

  // ---- Page 3: analyst note + CTA + scan inputs + sign-off ----
  const inputs = d.scanInputs;
  const inputCells = inputs.map((q, i) => scanInputCell(q.question, q.answer, i >= inputs.length - 1)).join('') + (inputs.length % 2 === 1 ? '<div style="padding:0.07in 0;"></div>' : '');
  const page3 = `<section class="fa-page" data-p="03" style="display:flex;flex-direction:column;background:${C.white};color:${C.ink};">
    <div style="height:0.16in;background:${RULE};"></div>
    <div class="${glow ? 'fa-glow-note' : ''}" style="margin:0.4in 0.55in 0;background:${MAST};color:#fff;padding:0.3in 0.32in;display:flex;flex-direction:column;gap:11px;">
      <div style="${mono};font-size:7pt;letter-spacing:0.17em;color:${C.lightCyan};">ANALYST NOTE</div>
      <p style="font-size:9.6pt;line-height:1.55;margin:0;color:rgba(255,255,255,0.9);text-wrap:pretty;">${esc(d.analystNote)}</p>
    </div>
    <div style="margin:0.26in 0.55in 0;border:1px solid ${C.navy};display:grid;grid-template-columns:1fr auto;align-items:center;gap:0.3in;padding:0.19in 0.24in;">
      <div style="display:flex;flex-direction:column;gap:5px;">
        <span style="${arch};font-weight:700;font-size:12pt;color:${C.navy};">${esc(d.cta.headline)}</span>
        <span style="font-size:8.6pt;line-height:1.45;color:${C.body};">${esc(d.cta.body)}</span>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;">
        <span style="${mono};font-size:6.6pt;letter-spacing:0.14em;color:${C.muted};">BOOK YOUR SESSION</span>
        <a class="fa-cta" href="${esc(d.cta.url)}" style="${arch};font-weight:600;font-size:11pt;color:#fff;background:${C.navy};padding:8px 16px;text-decoration:none;letter-spacing:0.01em;">i-nett.ai/resources</a>
      </div>
    </div>
    <div style="padding:0.32in 0.55in 0;">
      <div style="display:flex;align-items:center;gap:0.16in;border-bottom:2px solid ${C.navy};padding-bottom:7px;">
        <h2 style="${arch};font-weight:700;font-size:12.5pt;letter-spacing:0.02em;margin:0;color:${C.navy};">Scan inputs</h2>
        <span style="${mono};font-size:6.8pt;letter-spacing:0.14em;color:${C.muted};margin-left:auto;white-space:nowrap;">AS ANSWERED · ${esc(d.date.toUpperCase())}</span>
      </div>
      <div style="margin-top:0.14in;display:grid;grid-template-columns:1fr 1fr;gap:0 0.3in;">${inputCells}</div>
    </div>
    <div style="margin:0.34in 0.55in 0;padding-top:0.2in;border-top:1px solid ${C.border};display:grid;grid-template-columns:1fr auto;align-items:center;gap:0.3in;">
      <div style="display:flex;flex-direction:column;gap:3px;">
        <span style="${mono};font-size:6.6pt;letter-spacing:0.14em;color:${C.muted};">PREPARED AND REVIEWED BY</span>
        <span style="${arch};font-weight:700;font-size:12pt;color:${C.ink};">${esc(d.preparedBy.name)}</span>
        <span style="font-size:8.4pt;color:${C.body};">${esc(d.preparedBy.title)}</span>
        <span style="font-size:8.4pt;color:${C.body};">${esc(d.preparedBy.contactLine)}</span>
      </div>
      <img src="${esc(inett)}" alt="i-NETT" style="height:0.56in;width:auto;display:block;">
    </div>
    <footer style="margin-top:auto;padding:0.2in 0.55in 0.3in;display:flex;flex-direction:column;gap:9px;">
      <p style="font-size:6.9pt;line-height:1.5;margin:0;color:${C.faint};">${esc(d.disclaimer)}</p>
      <div style="display:flex;align-items:center;justify-content:space-between;${mono};font-size:6.6pt;letter-spacing:0.13em;color:${C.footer};white-space:nowrap;">
        <span>i-NETT · FORTIFY AI</span><span>PREPARED FOR ${esc(company.toUpperCase())}</span><span>03 / 03</span>
      </div>
    </footer>
  </section>`;

  return page1 + page2 + page3;
}

// Page geometry, web desk background, screen-only glow, and print rules.
export function reportCss(): string {
  return `
  .fa-report{--pw:8.5in;--ph:11in}
  .fa-page{width:var(--pw);min-height:var(--ph);height:var(--ph);overflow:hidden;position:relative;box-sizing:border-box}
  .fa-report a{color:#0E7FB0;text-decoration:none}
  .fa-report a:hover{color:#0A5C81;text-decoration:underline}
  .fa-report a.fa-cta{color:#fff}
  .fa-report a.fa-cta:hover{color:#fff;text-decoration:none}
  @media screen{
    .fa-desk{background:#0a0f16;min-height:100vh;padding:32px 16px;display:flex;flex-direction:column;align-items:center;gap:28px}
    .fa-page{box-shadow:0 24px 60px rgba(0,0,0,.55);background:#fff}
    .fa-glow-mast{box-shadow:inset 0 -1px 0 rgba(127,212,242,.25), 0 0 60px -12px rgba(18,165,219,.55)}
    .fa-glow-score{box-shadow:0 0 0 1px rgba(127,212,242,.35), 0 0 42px -6px rgba(18,165,219,.6)}
    .fa-glow-bar{box-shadow:0 0 10px 1px rgba(127,212,242,.9)}
    .fa-glow-high{box-shadow:0 0 0 1px rgba(179,38,30,.18), 0 6px 24px -10px rgba(179,38,30,.5)}
    .fa-glow-note{box-shadow:0 0 46px -10px rgba(18,165,219,.5)}
    .fa-glow-card{transition:box-shadow .25s ease}
    .fa-glow-card:hover{box-shadow:0 10px 34px -14px rgba(11,36,64,.45)}
    .fa-glow-action{box-shadow:inset 3px 0 0 rgba(18,165,219,.0), 0 0 22px -12px rgba(18,165,219,.55)}
    /* Scale the fixed page box down on narrow screens rather than reflow */
    @media (max-width:820px){ .fa-desk{padding:16px 8px} .fa-page{transform:scale(calc((100vw - 24px)/8.5/96));transform-origin:top center;margin-bottom:calc((100vw - 24px)/8.5/96 * 11in - 11in)} }
  }
  @media print{
    @page{size:letter;margin:0}
    html,body{margin:0;background:#fff}
    .fa-desk{background:#fff;padding:0;gap:0;display:block}
    .fa-page{box-shadow:none!important;break-after:page;page-break-after:always;margin:0}
    .fa-page:last-child{break-after:auto;page-break-after:auto}
    .fa-no-print{display:none!important}
    [class*="fa-glow"]{box-shadow:none!important}
  }`;
}

// Representative sample (used by /report when no data link is present).
export function sampleReport(): ReportData {
  return {
    scanId: '2026-0730-NWL',
    preparedFor: { name: 'Jordan Blake', company: 'Northwind Legal', email: 'jordan@northwind.example', phone: '858-555-1212', website: 'northwind.example', industry: 'Legal', sizeBand: '26–100 people' },
    date: 'July 30, 2026',
    exposureScore: 66, severityBand: 'ELEVATED', severityNote: 'Action recommended this quarter',
    metrics: [
      { label: 'SHADOW AI', value: 'HIGH', accent: C.red, valueColor: C.red, blurb: 'AI in use on personal accounts with no usage rules' },
      { label: 'COMPLIANCE FLAGS', value: '1', accent: C.amber, valueColor: C.amber, blurb: 'Confidentiality — legal & financial records' },
      { label: 'RECOVERABLE HRS / WK', value: '12–30', accent: C.cyan, valueColor: C.navy, blurb: 'Repetitive work a custom agent could take off your team' },
    ],
    findings: [
      { category: 'ENABLEMENT', index: 'FINDING 01', headline: "Your team is largely self-taught with AI, so it isn't working nearly as effectively for them as it could.", body: 'Self-taught users tend to write weaker prompts and receive poorer-quality responses, which can quietly lead to work being done incorrectly. Across large organizations — including 10,000+ employee enterprises — the majority of users experienced this before structured coaching was in place.', action: 'A prompt coach for every employee raises the quality and consistency of what AI produces. Published results show up to <strong style="font-weight:600;">73% better AI outputs</strong>, roughly <strong style="font-weight:600;">65% lower risk</strong> of a poor result, up to 80% stronger prompts, and about 54% fewer tokens.', peers: [{ label: 'Small business', pct: 74 }, { label: 'Mid-sized', pct: 61 }, { label: 'Enterprise', pct: 44 }] },
      { category: 'THIRD-PARTY ACCESS', index: 'FINDING 02', headline: 'Your vendors touch your data — do you know if they run it through their own AI?', body: 'Your bookkeeper, marketing help, IT contractor, and software vendors all handle your data. Any one of them pasting it into their own AI tools is exposure you inherit but cannot see.', action: 'We map who can reach what, and help you set the expectation — in writing — that your data never goes into anyone’s ungoverned AI.', peers: [{ label: 'Small business', pct: 70 }, { label: 'Mid-sized', pct: 57 }, { label: 'Enterprise', pct: 41 }] },
      { category: 'CYBER INSURANCE', index: 'FINDING 03', headline: 'Even with a clean setup: does your cyber policy actually cover an AI-related incident?', body: 'Many cyber policies written before the last renewal cycle have silent gaps or exclusions for AI-driven data exposure. As a Lloyd’s of London cyber-insurance partner, i-NETT can help you see where you stand — and because our managed security lowers risk, the organizations we manage can qualify for stronger coverage and better pricing.', action: 'We check your posture against how insurers now write AI exclusions, so you know exactly where you stand before you ever need to file.', peers: [{ label: 'Small business', pct: 74 }, { label: 'Mid-sized', pct: 60 }, { label: 'Enterprise', pct: 34 }] },
    ],
    policyFlag: { label: 'EMPLOYEE POLICY', text: "There's no signed AI & data policy your team is actually held to." },
    lockedAreas: [
      { area: 'WORKFLOWS', assessment: 'Worth reviewing', priority: 'normal', confidence: 40 },
      { area: 'SHADOW AI', assessment: 'High priority', priority: 'high', confidence: 90 },
      { area: 'CUSTOM AGENTS', assessment: 'Worth reviewing', priority: 'normal', confidence: 42 },
      { area: 'COMPLIANCE', assessment: 'High priority', priority: 'high', confidence: 90 },
      { area: 'VENDOR AI TERMS', assessment: 'High priority', priority: 'high', confidence: 88 },
    ],
    analystNote: 'Northwind is running real legal work through personal AI accounts with no signed policy — the kind of exposure opposing counsel and insurers look at first. The place to start is moving the team onto governed accounts with a plain-language usage policy, then closing the vendor-AI gap on paper. None of this is a big IT project; a first Fortify AI deployment is usually live within 30 days, and a 30-minute review turns this into that plan.',
    cta: { headline: 'These need to be walked through, not skimmed.', body: 'In a free 30-minute working session we go through each finding, what it means for you, and what to do first.', url: 'https://i-nett.ai/resources', company: 'Northwind Legal' },
    scanInputs: [
      { question: 'Industry', answer: 'Legal' }, { question: 'Signed AI & data policy', answer: 'No signed policy yet' },
      { question: 'Organization size', answer: '26–100 people' }, { question: 'How the team is learning', answer: 'Self-taught' },
      { question: 'AI tools in use', answer: 'ChatGPT, Claude, Copilot' }, { question: 'Sensitive data handled', answer: 'Legal/financial docs, PII' },
      { question: 'How AI is used for work', answer: 'Personal accounts, no rules' }, { question: 'Vendor AI agreements', answer: 'Never asked' },
      { question: 'Repetitive admin per week', answer: '15–40 hrs' }, { question: 'Cyber insurance & AI', answer: 'Not checked for AI' },
      { question: '12-month priority', answer: 'Governance & security first' },
    ],
    preparedBy: { name: 'Nick Dreyfus', title: 'Vice President, Business Development · i-NETT / Fortify AI', contactLine: 'i-nett.ai · (858) 337-2866 · nickd@i-nett.com' },
    disclaimer: 'This report is for general information only and is meant to be reviewed together with the i-NETT team. It is not a formal audit or assessment, and not legal, compliance, security, or insurance advice. Scores and estimates are illustrative and industry-informed; any frameworks named may or may not apply to your organization.',
  };
}

// ---- Link encoding (data lives in the URL hash; never sent to the server) ----
export function encodeReport(d: ReportData): string {
  const json = JSON.stringify(d);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function decodeReport(s: string): ReportData | null {
  try {
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(escape(atob(b64)));
    return JSON.parse(json) as ReportData;
  } catch (e) { return null; }
}
