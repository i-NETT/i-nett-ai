// Fortify AI Readiness & Risk Report — CLIENT copy, four Letter pages.
//
// Mirrors the on-screen result exactly: the colour-banded scorecard with the
// CRITICAL: DATA LEAKAGE bars, tinted finding cards with bullets and the
// "how common is this" bars, the locked areas with their scores, the analyst
// note and next step, and a "Why Fortify AI" page that carries the product
// story in tiles and figures rather than prose.
//
//   01  Overview: masthead, score, three metrics, the scorecard, recoverable capacity
//   02  Findings: the three findings in full
//   03  The rest of the report (locked areas), analyst note, next step, why Fortify AI
//   04  Appendix: scan inputs, how the scoring works, methodology, sign-off
//
// Every page is a fixed 8.5 x 11in box with overflow hidden (see reportCss),
// so each section here is sized to a known budget. Keep additions small and
// re-run /report-pdf-test's overflow audit after changing anything.

import {
  esc, sectionHeader, metricTile, scanInputCell, REPORT_COLORS as C,
  type ReportData, type ReportFinding, type RenderOpts, type LockedArea, type Peer,
} from './report';

const MAST = `linear-gradient(103deg,${C.deepest} 0%,${C.navy} 55%,${C.navy3} 100%)`;
const RULE = `linear-gradient(90deg,${C.navy},${C.cyan})`;
const mono = "font-family:'IBM Plex Mono',monospace";
const arch = "font-family:'Archivo',sans-serif";
const TOTAL = 4;

// Five-band palette, identical to the scan page.
const BAND = {
  red:    { fill: '#C13030', text: '#FFFFFF', tint: 'rgba(193,48,48,0.09)',  line: 'rgba(193,48,48,0.55)',  label: 'High' },
  orange: { fill: '#C25A0C', text: '#FFFFFF', tint: 'rgba(194,90,12,0.09)',  line: 'rgba(194,90,12,0.55)',  label: 'Elevated' },
  yellow: { fill: '#D9A400', text: '#1A1400', tint: 'rgba(217,164,0,0.11)',  line: 'rgba(217,164,0,0.6)',   label: 'Worth fixing' },
  gray:   { fill: '#7A8594', text: '#FFFFFF', tint: 'rgba(122,133,148,0.09)', line: 'rgba(122,133,148,0.5)', label: 'Minor' },
  green:  { fill: '#0F8B5F', text: '#FFFFFF', tint: 'rgba(15,139,95,0.09)',  line: 'rgba(15,139,95,0.5)',   label: 'Strong' },
};
type BandKey = keyof typeof BAND;
export function bandKey(score: number): BandKey {
  return score >= 75 ? 'red' : score >= 60 ? 'orange' : score >= 35 ? 'yellow' : score >= 20 ? 'gray' : 'green';
}
function badge(score: number): string {
  const b = BAND[bandKey(score)];
  return `<span style="display:inline-block;min-width:0.42in;text-align:center;${mono};font-size:8.4pt;font-weight:700;color:${b.text};background:${b.fill};padding:3px 8px;border-radius:999px;white-space:nowrap;">${score}</span>`;
}
function criticalChip(): string {
  return `<span style="display:inline-block;${mono};font-size:6.2pt;font-weight:700;letter-spacing:0.14em;color:#fff;background:#C13030;padding:2px 7px;margin-left:6px;vertical-align:middle;">CRITICAL: DATA LEAKAGE</span>`;
}
function criticalBar(): string {
  return `<div style="background:#C13030;color:#fff;${mono};font-size:7pt;font-weight:800;letter-spacing:0.16em;padding:5px 0.2in;">CRITICAL: DATA LEAKAGE</div>`;
}
function keyLine(): string {
  const items: [BandKey, string][] = [['green', '0-19 strong'], ['gray', '20-34 minor'], ['yellow', '35-59 worth fixing'], ['orange', '60-74 elevated'], ['red', '75-100 high']];
  return `<div style="display:flex;flex-wrap:wrap;gap:6px 14px;${mono};font-size:6.6pt;letter-spacing:0.06em;color:${C.muted};">`
    + items.map(([k, t]) => `<span style="display:inline-flex;align-items:center;gap:5px;"><i style="width:9px;height:9px;border-radius:2px;background:${BAND[k].fill};display:inline-block;"></i>${t}</span>`).join('')
    + `</div>`;
}

function footer(company: string, n: number): string {
  return `<footer style="margin-top:auto;padding:0.2in 0.55in 0.3in;display:flex;align-items:center;justify-content:space-between;gap:0.2in;${mono};font-size:6.6pt;letter-spacing:0.13em;color:${C.footer};white-space:nowrap;">
    <span style="flex:0 0 auto;">i-NETT · FORTIFY AI</span><span style="overflow:hidden;text-overflow:ellipsis;min-width:0;flex:0 1 auto;">PREPARED FOR ${esc(company.toUpperCase())}</span><span style="flex:0 0 auto;">${String(n).padStart(2, '0')} / ${String(TOTAL).padStart(2, '0')}</span>
  </footer>`;
}
function rule(): string { return `<div style="height:0.16in;background:${RULE};"></div>`; }

// ---- Scorecard row (page 1) ----
function scoreRow(s: { tag: string; score: number; head: string; critical?: boolean }, worst: boolean): string {
  const b = BAND[bandKey(s.score)];
  return `<div style="display:grid;grid-template-columns:1fr 0.6in;align-items:center;gap:0.14in;padding:0.08in 0.16in;border:1px solid ${b.line};border-left:4px solid ${b.fill};background:${b.tint};">
    <div style="min-width:0;">
      <div style="${mono};font-size:6.4pt;letter-spacing:0.16em;color:${C.muted};white-space:nowrap;">${esc(s.tag)}${worst ? ' · START HERE' : ''}${s.critical ? criticalChip() : ''}</div>
      <div style="${arch};font-weight:600;font-size:8.8pt;line-height:1.3;color:${C.ink};margin-top:2px;">${esc(s.head)}</div>
    </div>
    <div style="text-align:right;">${badge(s.score)}</div>
  </div>`;
}

// ---- Finding card (page 2): tinted, badge top-right, bulleted detail ----
function peerBars(peers: Peer[]): string {
  const colors = [C.navy, C.cyan, C.paleBar];
  return peers.slice(0, 3).map((p, i) =>
    `<div style="display:flex;flex-direction:column;gap:3px;min-width:0;">
      <div style="display:flex;justify-content:space-between;${mono};font-size:6.4pt;color:${C.body};"><span>${esc(p.label)}</span><span style="font-weight:700;color:${colors[i] === C.paleBar ? C.navy : colors[i]};">${p.pct}%</span></div>
      <span style="height:5px;background:${C.track};border-radius:3px;display:block;overflow:hidden;"><span style="display:block;height:100%;width:${Math.max(0, Math.min(100, p.pct))}%;background:${colors[i]};border-radius:3px;"></span></span>
    </div>`).join('');
}
function bullets(body: string): string {
  const parts = body.split(/(?<=[.!?])\s+(?=[A-Z“"])/).map((s) => s.trim()).filter(Boolean);
  return `<ul style="list-style:none;margin:0 0 0.12in;padding:0;display:grid;gap:4px;">`
    + parts.map((p) => `<li style="position:relative;padding-left:12px;font-size:8.4pt;line-height:1.45;color:${C.body};"><span style="position:absolute;left:1px;top:0.5em;width:4px;height:4px;border-radius:50%;background:${C.navy};opacity:0.6;"></span>${esc(p)}</li>`).join('')
    + `</ul>`;
}
export function clientFindingCard(f: ReportFinding): string {
  const score = f.score ?? 50;
  const b = BAND[bandKey(score)];
  return `<article class="fa-card" style="border:1px solid ${b.line};border-left:4px solid ${b.fill};background:${b.tint};overflow:hidden;">
    ${f.critical ? criticalBar() : ''}
    <div style="padding:0.16in 0.2in 0.18in;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:0.2in;margin-bottom:6px;">
        <span><span style="${mono};font-size:7pt;letter-spacing:0.18em;color:${C.link};">${esc(f.category)}</span> <span style="${mono};font-size:6.6pt;letter-spacing:0.14em;color:${C.footer};margin-left:6px;">${esc(f.index)}</span></span>
        ${badge(score)}
      </div>
      <h3 style="${arch};font-weight:600;font-size:12pt;line-height:1.28;margin:0 0 6px;color:${C.ink};">${esc(f.headline)}</h3>
      ${bullets(f.body)}
      <div style="background:rgba(255,255,255,0.8);border-left:3px solid ${C.cyan};padding:0.1in 0.14in;margin-bottom:0.12in;">
        <span style="${mono};font-size:6.4pt;letter-spacing:0.15em;color:${C.navy};">WHAT TO DO</span>
        <div style="font-size:8.4pt;line-height:1.5;color:${C.panel};margin-top:3px;">${f.action}</div>
      </div>
      <div style="${mono};font-size:6.2pt;letter-spacing:0.13em;color:${C.muted};margin-bottom:5px;">HOW COMMON IS THIS GAP? YOU ARE NOT BEHIND, BUT IT NEEDS ATTENTION.</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.18in;">${peerBars(f.peers)}</div>
    </div>
  </article>`;
}

// ---- Locked row (page 3) ----
function lockedRowC(a: LockedArea, last: boolean): string {
  const score = a.score ?? a.confidence;
  const b = BAND[bandKey(score)];
  return `<div style="display:grid;grid-template-columns:1.5in 1fr 0.6in 0.7in;align-items:center;gap:0.14in;padding:0.08in 0.16in;background:${b.tint};border-left:4px solid ${b.fill};${last ? '' : `border-bottom:1px solid ${C.hairline};`}">
    <span style="${mono};font-size:6.8pt;letter-spacing:0.12em;color:${C.navy};font-weight:600;white-space:nowrap;">${esc(a.area)}</span>
    <span style="font-size:8pt;color:${C.body};">${esc(a.assessment)}${a.critical ? criticalChip() : ''}</span>
    <span style="text-align:right;">${badge(score)}</span>
    <span style="${mono};font-size:6.2pt;letter-spacing:0.12em;color:${C.footer};text-align:right;">REDACTED</span>
  </div>`;
}

// ---- Why Fortify AI (page 3 fill) ----
function whyFortify(): string {
  const problems = [
    { t: 'Data exposure', today: 'Staff paste customer files into free tools', fix: 'Every leading model behind one governed login, zero data retention' },
    { t: 'Weak prompts', today: 'Self-taught teams get uneven, unreliable answers', fix: 'A prompt coach for every employee, built in' },
    { t: 'Hard to automate', today: 'Agents need a developer and a second platform', fix: 'Agents built with your team, in plain English' },
  ];
  const stats = [
    { n: 'up to 54%', l: 'fewer tokens' }, { n: 'up to 73%', l: 'better answers' }, { n: 'up to 5 hrs', l: 'saved per employee per week' }, { n: '$75', l: 'per user per month, all in' },
  ];
  const badges = ['HIPAA', 'GDPR', 'CCPA', 'SOC 2 Type II in process', 'ISO/IEC 42001 aligned', 'NIST aligned', "Lloyd's of London partner"];
  return `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.12in;margin-top:0.14in;">
    ${problems.map((p) => `<div style="border:1px solid ${C.border};padding:0.12in 0.14in;background:${C.white};">
      <div style="${arch};font-weight:700;font-size:9.4pt;color:${C.navy};margin-bottom:5px;">${p.t}</div>
      <div style="font-size:7.6pt;line-height:1.4;color:${C.red};margin-bottom:3px;">&#10005; ${esc(p.today)}</div>
      <div style="font-size:7.6pt;line-height:1.4;color:${C.ink};">&#10003; ${esc(p.fix)}</div>
    </div>`).join('')}
  </div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.12in;margin-top:0.12in;">
    ${stats.map((s) => `<div style="background:${MAST};color:#fff;padding:0.11in 0.14in;">
      <div style="${arch};font-weight:700;font-size:14pt;line-height:1;color:${C.lightCyan};">${s.n}</div>
      <div style="font-size:7pt;line-height:1.35;color:rgba(255,255,255,0.72);margin-top:4px;">${s.l}</div>
    </div>`).join('')}
  </div>
  <div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:0.1in;">
    ${badges.map((b) => `<span style="${mono};font-size:6.4pt;letter-spacing:0.08em;color:${C.navy};border:1px solid ${C.border};background:${C.tint};padding:3px 8px;">${esc(b)}</span>`).join('')}
  </div>
  <div style="font-size:6.6pt;line-height:1.45;color:${C.faint};margin-top:6px;">Coaching figures are demonstrated results of the behavioral-science coaching technology built into Fortify AI; actual results vary by team, workflow and adoption. Pilot failure and shadow-AI figures: MIT NANDA, 2025.</div>`;
}

export function renderReport(d: ReportData, opts: RenderOpts = {}): string {
  const fortify = opts.logoFortify || '/assets/brand/fortify-ai-logo.png';
  const inett = opts.logoInett || '/assets/brand/inett-logo.png';
  const scorePct = Math.max(0, Math.min(100, d.exposureScore));
  const company = d.preparedFor.company || '—';
  const sb = BAND[bandKey(scorePct)];

  const scorecard = [...(d.scorecard || [])].sort((x, y) => x.score - y.score);
  const worst = scorecard.slice(-3).map((s) => s.tag);
  const findings = [...d.findings].sort((x, y) => (x.score ?? 50) - (y.score ?? 50));
  const locked = [...d.lockedAreas].sort((x, y) => (x.score ?? x.confidence) - (y.score ?? y.confidence));

  // ---- 01 Overview ----
  const page1 = `<section class="fa-page" data-p="01" style="display:flex;flex-direction:column;background:${C.white};color:${C.ink};">
    <header style="background:${MAST};color:#fff;padding:0.42in 0.55in 0.36in;display:flex;align-items:flex-start;justify-content:space-between;gap:0.4in;">
      <div style="display:flex;align-items:center;gap:0.28in;">
        <img src="${esc(fortify)}" alt="i-NETT Fortify AI" style="height:0.98in;width:auto;display:block;">
        <div style="display:flex;flex-direction:column;gap:7px;border-left:1px solid rgba(255,255,255,0.22);padding-left:0.28in;">
          <div style="${mono};font-size:7.6pt;letter-spacing:0.19em;color:${C.lightCyan};">AI READINESS &amp; RISK REPORT</div>
          <h1 style="${arch};font-weight:700;font-size:24pt;line-height:1.05;letter-spacing:-0.015em;margin:0;">Your Fortify AI<br>Scan Results</h1>
          <div style="font-size:8.6pt;color:rgba(255,255,255,0.66);">Prepared for ${esc(d.preparedFor.name)} · ${esc(company)} · ${esc(d.date)}</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:9px;padding-top:4px;">
        <span style="display:inline-block;${mono};font-size:7pt;letter-spacing:0.18em;color:${C.lightCyan};border:1px solid rgba(127,212,242,0.5);padding:4px 10px;">CONFIDENTIAL</span>
        <div style="${mono};font-size:7pt;letter-spacing:0.13em;color:rgba(255,255,255,0.5);white-space:nowrap;">SCAN ${esc(d.scanId)}</div>
      </div>
    </header>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);background:${C.tint};border-bottom:1px solid ${C.border};padding:0.12in 0.55in;">
      <div style="display:flex;flex-direction:column;gap:2px;"><span style="${mono};font-size:6.6pt;letter-spacing:0.15em;color:${C.muted};">CONTACT</span><span style="font-size:8.2pt;color:${C.ink};">${esc(d.preparedFor.email)}</span></div>
      <div style="display:flex;flex-direction:column;gap:2px;"><span style="${mono};font-size:6.6pt;letter-spacing:0.15em;color:${C.muted};">CELL</span><span style="font-size:8.2pt;color:${C.ink};">${esc(d.preparedFor.phone)}</span></div>
      <div style="display:flex;flex-direction:column;gap:2px;"><span style="${mono};font-size:6.6pt;letter-spacing:0.15em;color:${C.muted};">ORGANIZATION</span><span style="font-size:8.2pt;color:${C.ink};">${esc([d.preparedFor.website, d.preparedFor.industry, d.preparedFor.sizeBand].filter(Boolean).join(' · '))}</span></div>
    </div>

    <div style="padding:0.26in 0.55in 0;display:grid;grid-template-columns:2.3in 1fr;gap:0.26in;align-items:stretch;">
      <div style="border:1px solid ${C.navy};background:${C.navy};color:#fff;padding:0.18in 0.2in;display:flex;flex-direction:column;gap:8px;">
        <div style="${mono};font-size:7pt;letter-spacing:0.17em;color:${C.lightCyan};">EXPOSURE SCORE</div>
        <div style="display:flex;align-items:baseline;gap:8px;white-space:nowrap;">
          <span style="${arch};font-weight:700;font-size:44pt;line-height:0.85;letter-spacing:-0.035em;color:${scorePct >= 75 ? '#FF7A6B' : scorePct >= 60 ? '#FFB36B' : '#fff'};">${scorePct}</span>
          <span style="${arch};font-weight:500;font-size:12pt;color:rgba(255,255,255,0.5);">/ 100</span>
        </div>
        <div style="height:7px;background:rgba(255,255,255,0.14);border-radius:3.5px;position:relative;overflow:hidden;"><div style="position:absolute;inset:0 auto 0 0;width:${scorePct}%;background:${sb.fill};border-radius:3.5px;"></div></div>
        <div style="display:flex;justify-content:space-between;${mono};font-size:6.2pt;letter-spacing:0.1em;color:rgba(255,255,255,0.42);"><span>LOW</span><span>MODERATE</span><span>ELEVATED</span><span>SEVERE</span></div>
        <div style="margin-top:auto;padding-top:9px;border-top:1px solid rgba(255,255,255,0.16);display:flex;align-items:center;gap:8px;">
          <span style="display:inline-block;${arch};font-weight:700;font-size:7.6pt;letter-spacing:0.09em;color:#fff;background:${sb.fill};padding:3px 9px;">${esc(d.severityBand)}</span>
          <span style="font-size:7.6pt;color:rgba(255,255,255,0.62);line-height:1.35;">${esc(d.severityNote)}</span>
        </div>
      </div>
      <div style="display:grid;grid-template-rows:repeat(3,1fr);gap:0.1in;">${d.metrics.map((m) => metricTile(m, false)).join('')}</div>
    </div>

    <div style="padding:0.24in 0.55in 0;">
      ${sectionHeader('Your scorecard', 'EVERY AREA WE ASSESSED · BEST TO WORST')}
      <div style="margin-top:0.1in;">${keyLine()}</div>
      <div style="margin-top:0.1in;display:grid;gap:5px;">${scorecard.map((s) => scoreRow(s, worst.indexOf(s.tag) >= 0)).join('')}</div>
    </div>

    ${d.recoverable ? `<div style="margin:0.2in 0.55in 0;border-top:1px solid ${C.border};padding-top:0.12in;display:flex;align-items:baseline;justify-content:space-between;gap:0.2in;">
      <div><span style="${mono};font-size:6.6pt;letter-spacing:0.14em;color:${C.link};">RECOVERABLE CAPACITY</span><div style="font-size:7.6pt;color:${C.muted};margin-top:3px;">${esc(d.recoverable.subText)}</div></div>
      <span style="${arch};font-weight:700;font-size:13pt;color:${C.navy};white-space:nowrap;">${esc(d.recoverable.heroText)}</span>
    </div>` : ''}
    ${footer(company, 1)}
  </section>`;

  // ---- 02 Findings ----
  const page2 = `<section class="fa-page" data-p="02" style="display:flex;flex-direction:column;background:${C.white};color:${C.ink};">
    ${rule()}
    <div style="padding:0.3in 0.55in 0;">
      ${sectionHeader('Your top priorities, and what to do about each', `${findings.length} FINDINGS · LOWEST TO HIGHEST`)}
    </div>
    <div style="margin:0.16in 0.55in 0;display:flex;flex-direction:column;gap:0.14in;">${findings.map((f) => clientFindingCard(f)).join('')}</div>
    ${footer(company, 2)}
  </section>`;

  // ---- 03 The rest, analyst note, next step, why Fortify AI ----
  const page3 = `<section class="fa-page" data-p="03" style="display:flex;flex-direction:column;background:${C.white};color:${C.ink};">
    ${rule()}
    <div style="padding:0.3in 0.55in 0;">
      ${sectionHeader('The rest of your report', 'REVIEWED IN YOUR SESSION')}
      <div style="margin-top:0.1in;display:flex;align-items:flex-start;gap:8px;background:${C.tint};border-left:3px solid ${C.navy};padding:0.08in 0.15in;">
        <span style="font-size:7.8pt;line-height:1.45;color:${C.panel};">Redacted to protect ${esc(company)}&rsquo;s privacy and security. We only share an organization&rsquo;s full findings with someone confirmed to be part of it. You receive these in full, unredacted, after our working session.</span>
      </div>
      <div style="margin-top:0.1in;border:1px solid ${C.border};display:grid;">
        <div style="display:grid;grid-template-columns:1.5in 1fr 0.6in 0.7in;gap:0.14in;padding:0.07in 0.16in;background:${C.tint};border-bottom:1px solid ${C.border};${mono};font-size:6.2pt;letter-spacing:0.13em;color:${C.muted};"><span>AREA</span><span>ASSESSMENT</span><span style="text-align:right;">SCORE</span><span style="text-align:right;">STATUS</span></div>
        ${locked.map((a, i) => lockedRowC(a, i === locked.length - 1)).join('')}
      </div>
    </div>
    <div style="margin:0.2in 0.55in 0;background:${MAST};color:#fff;padding:0.2in 0.26in;display:flex;flex-direction:column;gap:7px;">
      <div style="${mono};font-size:7pt;letter-spacing:0.17em;color:${C.lightCyan};">ANALYST NOTE</div>
      <p style="font-size:8.8pt;line-height:1.5;margin:0;color:rgba(255,255,255,0.9);">${esc(d.analystNote)}</p>
    </div>
    <div style="margin:0.16in 0.55in 0;border:1px solid ${C.navy};background:${C.tint};display:grid;grid-template-columns:1fr auto;align-items:center;gap:0.3in;padding:0.14in 0.2in;">
      <div style="display:flex;flex-direction:column;gap:3px;">
        <span style="${arch};font-weight:700;font-size:11pt;color:${C.navy};">${esc(d.cta.headline)}</span>
        <span style="font-size:8.2pt;line-height:1.4;color:${C.body};">${esc(d.cta.body)}</span>
      </div>
      <a class="fa-cta" href="${esc(d.cta.url)}" style="${arch};font-weight:600;font-size:10pt;color:#fff;background:${C.navy};padding:8px 16px;text-decoration:none;white-space:nowrap;display:inline-block;">Book your 30-minute session →</a>
    </div>
    <div style="padding:0.22in 0.55in 0;">
      ${sectionHeader('Why Fortify AI', 'THE END OF AI RISK. THE START OF AI RESULTS.')}
      ${whyFortify()}
    </div>
    ${footer(company, 3)}
  </section>`;

  // ---- 04 Appendix ----
  const inputs = d.scanInputs;
  const inputCells = inputs.map((q, i) => scanInputCell(q.question, q.answer, i >= inputs.length - 1)).join('') + (inputs.length % 2 === 1 ? '<div style="padding:0.07in 0;"></div>' : '');
  const bandsExplained: [BandKey, string][] = [
    ['red', '75 to 100. Data can leave the organization today. Act now.'],
    ['orange', '60 to 74. A real gap. Address this quarter.'],
    ['yellow', '35 to 59. Worth fixing in the next few months.'],
    ['gray', '20 to 34. Minor. Keep an eye on it.'],
    ['green', '0 to 19. Strong. Keep doing what you are doing.'],
  ];
  const page4 = `<section class="fa-page" data-p="04" style="display:flex;flex-direction:column;background:${C.white};color:${C.ink};">
    ${rule()}
    <div style="padding:0.3in 0.55in 0;">
      ${sectionHeader('Scan inputs', `AS ANSWERED · ${esc(d.date.toUpperCase())}`)}
      <div style="margin-top:0.12in;display:grid;grid-template-columns:1fr 1fr;gap:0 0.3in;">${inputCells}</div>
    </div>
    <div style="padding:0.26in 0.55in 0;">
      ${sectionHeader('How the scoring works', 'FIVE BANDS · 0 TO 100')}
      <div style="margin-top:0.12in;display:grid;grid-template-columns:1fr 1fr;gap:6px 0.3in;">
        ${bandsExplained.map(([k, t]) => `<div style="display:flex;align-items:center;gap:8px;font-size:8pt;color:${C.body};"><span style="display:inline-block;min-width:0.62in;text-align:center;${mono};font-size:7pt;font-weight:700;color:${BAND[k].text};background:${BAND[k].fill};padding:2px 6px;border-radius:999px;">${BAND[k].label.toUpperCase()}</span><span>${esc(t)}</span></div>`).join('')}
        <div style="grid-column:1 / -1;font-size:8pt;line-height:1.5;color:${C.body};margin-top:4px;">Any organization without governed AI accounts, a policy every employee has signed, and AI terms in every vendor contract is exposed to data leakage and scores no lower than 85 overall. One file in an ungoverned model is a permanent loss. Headcounts used for the recoverable-capacity estimate are industry averages for your size and sector unless you adjusted them.</div>
      </div>
    </div>
    <div style="padding:0.26in 0.55in 0;">
      ${sectionHeader('Your next 30 days', 'WHAT HAPPENS AFTER THE SESSION')}
      <div style="margin-top:0.12in;display:grid;grid-template-columns:repeat(4,1fr);gap:0.12in;">
        ${[
          ['01', 'Working session', 'Your full report, unredacted, in the first 15 minutes'],
          ['02', 'Govern', 'Company accounts, a signed policy, vendor AI terms on paper'],
          ['03', 'Coach', 'Every employee gets the prompt coach, not a training day'],
          ['04', 'Automate', 'The first agent, built with your team, usually live within 30 days'],
        ].map(([n, t, l]) => `<div style="border:1px solid ${C.border};border-top:3px solid ${C.cyan};padding:0.1in 0.12in;background:${C.white};">
          <div style="${mono};font-size:7pt;letter-spacing:0.14em;color:${C.link};">${n}</div>
          <div style="${arch};font-weight:700;font-size:9.2pt;color:${C.navy};margin:3px 0 4px;">${t}</div>
          <div style="font-size:7.6pt;line-height:1.4;color:${C.body};">${l}</div>
        </div>`).join('')}
      </div>
    </div>
    <div style="margin:0.26in 0.55in 0;padding-top:0.18in;border-top:1px solid ${C.border};display:grid;grid-template-columns:1fr auto;align-items:center;gap:0.3in;">
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
      <div style="display:flex;align-items:center;justify-content:space-between;gap:0.2in;${mono};font-size:6.6pt;letter-spacing:0.13em;color:${C.footer};white-space:nowrap;">
        <span style="flex:0 0 auto;">i-NETT · FORTIFY AI</span><span style="overflow:hidden;text-overflow:ellipsis;min-width:0;flex:0 1 auto;">PREPARED FOR ${esc(company.toUpperCase())}</span><span style="flex:0 0 auto;">04 / 04</span>
      </div>
    </footer>
  </section>`;

  return page1 + page2 + page3 + page4;
}
