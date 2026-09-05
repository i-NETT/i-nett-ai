// Fortify AI Readiness & Risk Report — CLIENT copy, four Letter pages.
//
// Mirrors the on-screen result: one entry per area, nothing repeated.
//
//   01  Overview: masthead, score, three numbers, time and money to win back,
//       then every area once, best to worst. Priority areas point to page 2.
//   02  The priorities in full: tinted cards, bullets, what to do, how common.
//   03  A note from our team, the next step, why Fortify AI, the next 30 days.
//   04  Scan inputs, how the scoring works, terms used, sign-off, disclaimer.
//
// Plain language throughout. Any short form that has to appear gets an
// asterisk and is defined once in "Terms used in this report" on page 4.
//
// Every page is a fixed 8.5 x 11in box with overflow hidden (see reportCss),
// so each section here is sized to a known budget. Keep additions small and
// re-run /report-pdf-test's overflow audit after changing anything.

import {
  esc, sectionHeader, metricTile, scanInputCell, REPORT_COLORS as C,
  type ReportData, type ReportFinding, type RenderOpts, type Peer,
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
function criticalBar(): string {
  return `<div style="background:#C13030;color:#fff;${mono};font-size:7pt;font-weight:800;letter-spacing:0.16em;padding:3px 0.2in;">CRITICAL: DATA LEAKAGE</div>`;
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

// ---- Area row (page 1): one per area, no repeats ----
type AreaState = 'priority' | 'session' | 'plain';
type AreaRow = { tag: string; score: number; head: string; critical: boolean; state: AreaState };
function areaRow(a: AreaRow): string {
  const b = BAND[bandKey(a.score)];
  const note = a.state === 'priority' ? 'YOUR PRIORITY · WHAT TO DO IS ON PAGE 2'
    : a.state === 'session' ? 'WE GO THROUGH THIS ONE TOGETHER IN YOUR SESSION' : '';
  return `<div style="border:1px solid ${b.line};border-left:4px solid ${b.fill};background:${b.tint};overflow:hidden;">
    ${a.critical ? criticalBar() : ''}
    <div style="display:grid;grid-template-columns:1fr 0.6in;align-items:center;gap:0.14in;padding:0.05in 0.16in;">
      <div style="min-width:0;">
        <div style="${mono};font-size:6.4pt;letter-spacing:0.16em;color:${C.muted};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(a.tag)}${note ? `<span style="color:${C.link};letter-spacing:0.12em;"> &nbsp;&#128274; ${note}</span>` : ''}</div>
        ${a.state === 'priority' ? '' : `<div style="${arch};font-weight:600;font-size:8.2pt;line-height:1.25;color:${C.ink};margin-top:2px;">${esc(a.head)}</div>`}
      </div>
      <div style="text-align:right;">${badge(a.score)}</div>
    </div>
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
    <div style="padding:0.12in 0.2in 0.13in;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:0.2in;margin-bottom:5px;">
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

// ---- Why Fortify AI (page 3) ----
function whyFortify(): string {
  const problems = [
    { t: 'Data leaving', today: 'Staff paste customer files into free tools', fix: 'Every leading model behind one company login, and nothing is kept' },
    { t: 'Weak prompts', today: 'Self-taught teams get uneven answers', fix: 'A prompt coach for every employee, built in' },
    { t: 'Hard to automate', today: 'Agents need a developer and a second platform', fix: 'Agents built with your team, in plain English' },
  ];
  const stats = [
    { n: 'up to 54%', l: 'less AI usage cost' }, { n: 'up to 73%', l: 'better answers' }, { n: 'up to 5 hours', l: 'saved per employee per week' }, { n: '$75', l: 'per user per month, all in' },
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
  <div style="font-size:6.6pt;line-height:1.45;color:${C.faint};margin-top:6px;">Coaching figures are published results of the behavior-science coaching built into Fortify AI. Actual results vary by team, workflow and adoption. Pilot failure and unapproved AI use figures: the 2025 MIT NANDA study.</div>`;
}

// ---- Terms used: every short form marked once, defined once ----
const GLOSSARY: [string, string][] = [
  ['AI', 'Artificial intelligence. Software such as ChatGPT or Copilot that can write, answer questions and do tasks. Used throughout this report.'],
  ['ISO/IEC 42001', 'The international standard for managing AI responsibly.'],
  ['PCI-DSS', 'The payment card industry rules for handling credit and debit card details.'],
  ['HIPAA', 'The United States health privacy law. It covers medical records and patient information.'],
  ['CMMC', 'The cybersecurity rules for companies that do work for the United States Department of Defense.'],
  ['CJIS', 'The security rules for handling criminal justice and law enforcement data.'],
  ['COPPA', 'The United States law on collecting data from children under 13.'],
  ['FERPA', 'The United States law that protects student education records.'],
  ['GDPR', 'The European Union privacy law. It can apply to any business with customers in Europe.'],
  ['CCPA', 'The California privacy law. It gives California residents control over their personal data.'],
  ['PII', 'Personal information such as names, addresses, phone numbers and dates of birth.'],
  ['SOC 2', 'An independent audit standard for how a company protects customer data.'],
  ['NIST', 'The United States standards body whose security guidelines many insurers and regulators follow.'],
  ['MIT', 'The Massachusetts Institute of Technology.'],
];
function termRegex(term: string): RegExp {
  const t = term.replace(/[-/]/g, (c) => '\\' + c).replace(/ /g, '\\s');
  return new RegExp('(^|[^A-Za-z0-9*])(' + t + ')(?![A-Za-z0-9*])', 'g');
}
// Adds the asterisk to every marked term in the text between tags, and
// records which terms were seen so the glossary lists only those.
function markTerms(html: string, used: Set<string>): string {
  return html.replace(/>([^<]+)</g, (_m, text: string) => {
    let s = text;
    GLOSSARY.forEach(([term]) => {
      if (term === 'AI') { if (/\bAI\b/.test(s)) used.add('AI'); return; }
      const re = termRegex(term);
      if (re.test(s)) { used.add(term); s = s.replace(re, '$1$2*'); }
    });
    return '>' + s + '<';
  });
}
function glossary(used: Set<string>): string {
  const rows = GLOSSARY.filter(([k]) => used.has(k));
  if (!rows.length) return '';
  return `<div style="padding:0.18in 0.55in 0;">
    ${sectionHeader('Terms used in this report', 'PLAIN DEFINITIONS')}
    <div style="margin-top:0.1in;display:grid;grid-template-columns:1fr 1fr;gap:5px 0.3in;">
      ${rows.map(([k, v]) => `<div style="display:grid;grid-template-columns:0.95in 1fr;gap:8px;align-items:baseline;font-size:7.6pt;line-height:1.4;color:${C.body};"><span style="${mono};font-size:7pt;font-weight:700;color:${C.ink};">${esc(k)}${k === 'AI' ? '' : '*'}</span><span>${esc(v)}</span></div>`).join('')}
    </div>
  </div>`;
}

export function renderReport(d: ReportData, opts: RenderOpts = {}): string {
  const fortify = opts.logoFortify || '/assets/brand/fortify-ai-logo.png';
  const inett = opts.logoInett || '/assets/brand/inett-logo.png';
  const scorePct = Math.max(0, Math.min(100, d.exposureScore));
  const company = d.preparedFor.company || '—';
  const sb = BAND[bandKey(scorePct)];

  const findings = [...d.findings].sort((x, y) => (x.score ?? 50) - (y.score ?? 50));
  const priorityTags = findings.map((f) => f.category);
  const sessionTags = d.lockedAreas.map((a) => a.area);

  // One row per area: the scorecard, plus any finding area the scorecard
  // does not carry (for example WORKFLOWS or CUSTOM AGENTS).
  const rows: AreaRow[] = (d.scorecard || []).map((s) => ({ tag: s.tag, score: s.score, head: s.head, critical: !!s.critical, state: 'plain' as AreaState }));
  findings.forEach((f) => { if (!rows.find((r) => r.tag === f.category)) rows.push({ tag: f.category, score: f.score ?? 50, head: f.headline, critical: !!f.critical, state: 'plain' }); });
  d.lockedAreas.forEach((a) => { if (!rows.find((r) => r.tag === a.area)) rows.push({ tag: a.area, score: a.score ?? a.confidence, head: a.assessment, critical: !!a.critical, state: 'plain' }); });
  rows.forEach((r) => { r.state = priorityTags.indexOf(r.tag) >= 0 ? 'priority' : sessionTags.indexOf(r.tag) >= 0 ? 'session' : 'plain'; });
  rows.sort((x, y) => x.score - y.score);

  // ---- 01 Overview ----
  const page1 = `<section class="fa-page" data-p="01" style="display:flex;flex-direction:column;background:${C.white};color:${C.ink};">
    <header style="background:${MAST};color:#fff;padding:0.28in 0.55in 0.22in;display:flex;align-items:flex-start;justify-content:space-between;gap:0.4in;">
      <div style="display:flex;align-items:center;gap:0.28in;">
        <img src="${esc(fortify)}" alt="i-NETT Fortify AI" style="height:0.98in;width:auto;display:block;">
        <div style="display:flex;flex-direction:column;gap:7px;border-left:1px solid rgba(255,255,255,0.22);padding-left:0.28in;">
          <div style="${mono};font-size:7.6pt;letter-spacing:0.19em;color:${C.lightCyan};">AI READINESS &amp; RISK REPORT</div>
          <h1 style="${arch};font-weight:700;font-size:24pt;line-height:1.05;letter-spacing:-0.015em;margin:0;">Your Fortify AI<br>Scan Results</h1>
          <div style="font-size:8.6pt;color:rgba(255,255,255,0.66);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:4.4in;">Prepared for ${esc(d.preparedFor.name)} · ${esc(company)} · ${esc(d.date)}</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:9px;padding-top:4px;">
        <span style="display:inline-block;${mono};font-size:7pt;letter-spacing:0.18em;color:${C.lightCyan};border:1px solid rgba(127,212,242,0.5);padding:4px 10px;">CONFIDENTIAL</span>
        <div style="${mono};font-size:7pt;letter-spacing:0.13em;color:rgba(255,255,255,0.5);white-space:nowrap;">SCAN ${esc(d.scanId)}</div>
      </div>
    </header>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);background:${C.tint};border-bottom:1px solid ${C.border};padding:0.07in 0.55in;">
      <div style="display:flex;flex-direction:column;gap:2px;"><span style="${mono};font-size:6.6pt;letter-spacing:0.15em;color:${C.muted};">CONTACT</span><span style="font-size:8.2pt;color:${C.ink};">${esc(d.preparedFor.email)}</span></div>
      <div style="display:flex;flex-direction:column;gap:2px;"><span style="${mono};font-size:6.6pt;letter-spacing:0.15em;color:${C.muted};">CELL</span><span style="font-size:8.2pt;color:${C.ink};">${esc(d.preparedFor.phone)}</span></div>
      <div style="display:flex;flex-direction:column;gap:2px;"><span style="${mono};font-size:6.6pt;letter-spacing:0.15em;color:${C.muted};">ORGANIZATION</span><span style="font-size:8.2pt;color:${C.ink};">${esc([d.preparedFor.website, d.preparedFor.industry, d.preparedFor.sizeBand].filter(Boolean).join(' · '))}</span></div>
    </div>

    <div style="padding:0.18in 0.55in 0;display:grid;grid-template-columns:2.3in 1fr;gap:0.26in;align-items:stretch;">
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
      <div style="display:grid;grid-template-rows:repeat(3,1fr);gap:0.08in;">${d.metrics.map((m) => metricTile(m, false)).join('')}</div>
    </div>

    ${d.recoverable ? `<div style="margin:0.12in 0.55in 0;border:1px solid ${C.border};background:${C.tint};padding:0.07in 0.16in;display:flex;align-items:baseline;justify-content:space-between;gap:0.2in;">
      <div><span style="${mono};font-size:6.6pt;letter-spacing:0.14em;color:${C.link};">TIME AND MONEY YOU COULD WIN BACK</span><div style="font-size:7.6pt;color:${C.muted};margin-top:3px;">${esc(d.recoverable.subText)}</div></div>
      <span style="${arch};font-weight:700;font-size:13pt;color:${C.navy};white-space:nowrap;">${esc(d.recoverable.heroText)}</span>
    </div>` : ''}

    <div style="padding:0.1in 0.55in 0;">
      ${sectionHeader('Where you stand, area by area', 'EVERY AREA ONCE · BEST TO WORST')}
      <div style="margin-top:0.04in;">${keyLine()}</div>
      <div style="margin-top:0.06in;display:grid;gap:3px;">${rows.map((r) => areaRow(r)).join('')}</div>
    </div>
    ${footer(company, 1)}
  </section>`;

  // ---- 02 Priorities ----
  const page2 = `<section class="fa-page" data-p="02" style="display:flex;flex-direction:column;background:${C.white};color:${C.ink};">
    ${rule()}
    <div style="padding:0.24in 0.55in 0;">
      ${sectionHeader('Your priorities, and what to do about each', `${findings.length} AREAS · LOWEST TO HIGHEST`)}
    </div>
    <div style="margin:0.12in 0.55in 0;display:flex;flex-direction:column;gap:0.1in;">${findings.map((f) => clientFindingCard(f)).join('')}</div>
    ${footer(company, 2)}
  </section>`;

  // ---- 03 Our note, next step, why Fortify AI, next 30 days ----
  const page3 = `<section class="fa-page" data-p="03" style="display:flex;flex-direction:column;background:${C.white};color:${C.ink};">
    ${rule()}
    <div style="margin:0.3in 0.55in 0;background:${MAST};color:#fff;padding:0.2in 0.26in;display:flex;flex-direction:column;gap:7px;">
      <div style="${mono};font-size:7pt;letter-spacing:0.17em;color:${C.lightCyan};">A NOTE FROM OUR TEAM</div>
      <p style="font-size:9pt;line-height:1.5;margin:0;color:rgba(255,255,255,0.9);">${esc(d.analystNote)}</p>
    </div>
    ${sessionTags.length ? `<div style="margin:0.14in 0.55in 0;display:flex;align-items:flex-start;gap:8px;background:${C.tint};border-left:3px solid ${C.navy};padding:0.08in 0.15in;">
      <span style="font-size:7.8pt;line-height:1.45;color:${C.panel};">The areas marked &ldquo;together in your session&rdquo; on page 1 are held back to protect ${esc(company)}&rsquo;s privacy and security. We only share an organization&rsquo;s full findings with someone confirmed to be part of it. You receive them in full after our working session.</span>
    </div>` : ''}
    <div style="margin:0.16in 0.55in 0;border:1px solid ${C.navy};background:${C.tint};display:grid;grid-template-columns:1fr auto;align-items:center;gap:0.3in;padding:0.14in 0.2in;">
      <div style="display:flex;flex-direction:column;gap:3px;">
        <span style="${arch};font-weight:700;font-size:11pt;color:${C.navy};">${esc(d.cta.headline)}</span>
        <span style="font-size:8.2pt;line-height:1.4;color:${C.body};">${esc(d.cta.body)}</span>
      </div>
      <a class="fa-cta" href="${esc(d.cta.url)}" style="${arch};font-weight:600;font-size:10pt;color:#fff;background:${C.navy};padding:8px 16px;text-decoration:none;white-space:nowrap;display:inline-block;">Book your 30-minute session →</a>
    </div>
    <div style="padding:0.24in 0.55in 0;">
      ${sectionHeader('Why Fortify AI', 'THE END OF AI RISK. THE START OF AI RESULTS.')}
      ${whyFortify()}
    </div>
    <div style="padding:0.24in 0.55in 0;">
      ${sectionHeader('Your next 30 days', 'WHAT HAPPENS AFTER THE SESSION')}
      <div style="margin-top:0.12in;display:grid;grid-template-columns:repeat(4,1fr);gap:0.12in;">
        ${[
          ['01', 'Working session', 'Your full report, nothing held back, in the first 15 minutes'],
          ['02', 'Set the rules', 'Company accounts, a signed policy, vendor AI terms on paper'],
          ['03', 'Coach', 'Every employee gets the prompt coach, not a training day'],
          ['04', 'Automate', 'The first agent, built with your team, usually live within 30 days'],
        ].map(([n, t, l]) => `<div style="border:1px solid ${C.border};border-top:3px solid ${C.cyan};padding:0.1in 0.12in;background:${C.white};">
          <div style="${mono};font-size:7pt;letter-spacing:0.14em;color:${C.link};">${n}</div>
          <div style="${arch};font-weight:700;font-size:9.2pt;color:${C.navy};margin:3px 0 4px;">${t}</div>
          <div style="font-size:7.6pt;line-height:1.4;color:${C.body};">${l}</div>
        </div>`).join('')}
      </div>
    </div>
    ${footer(company, 3)}
  </section>`;

  // ---- 04 Appendix ----
  const inputs = d.scanInputs;
  const inputCells = inputs.map((q, i) => scanInputCell(q.question, q.answer, i >= inputs.length - 1)).join('') + (inputs.length % 2 === 1 ? '<div style="padding:0.07in 0;"></div>' : '');
  const bandsExplained: [BandKey, string][] = [
    ['red', '75 to 100. Data can leave the organization today. Act now.'],
    ['orange', '60 to 74. A real gap. Fix this quarter.'],
    ['yellow', '35 to 59. Worth fixing in the next few months.'],
    ['gray', '20 to 34. Minor. Keep an eye on it.'],
    ['green', '0 to 19. Strong. Keep doing what you are doing.'],
  ];
  const page4a = `<section class="fa-page" data-p="04" style="display:flex;flex-direction:column;background:${C.white};color:${C.ink};">
    ${rule()}
    <div style="padding:0.3in 0.55in 0;">
      ${sectionHeader('Scan inputs', `AS ANSWERED · ${esc(d.date.toUpperCase())}`)}
      <div style="margin-top:0.12in;display:grid;grid-template-columns:1fr 1fr;gap:0 0.3in;">${inputCells}</div>
    </div>
    <div style="padding:0.22in 0.55in 0;">
      ${sectionHeader('How the scoring works', 'FIVE BANDS · 0 TO 100')}
      <div style="margin-top:0.12in;display:grid;grid-template-columns:1fr 1fr;gap:6px 0.3in;">
        ${bandsExplained.map(([k, t]) => `<div style="display:flex;align-items:center;gap:8px;font-size:8pt;color:${C.body};"><span style="display:inline-block;min-width:0.62in;text-align:center;${mono};font-size:7pt;font-weight:700;color:${BAND[k].text};background:${BAND[k].fill};padding:2px 6px;border-radius:999px;">${BAND[k].label}</span><span>${t}</span></div>`).join('')}
        <div style="grid-column:1 / -1;font-size:8pt;line-height:1.5;color:${C.body};margin-top:4px;">Any organization without company AI accounts, a policy every employee has signed, and AI terms in every vendor contract can have data leave through an AI tool it does not control. Those areas score 75 or higher and carry the CRITICAL: DATA LEAKAGE bar. One file in a free tool is gone for good.</div>
      </div>
    </div>`;
  const page4b = `<div style="margin:0.22in 0.55in 0;padding-top:0.16in;border-top:1px solid ${C.border};display:grid;grid-template-columns:1fr auto;align-items:center;gap:0.3in;">
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

  // Mark every short form, then define the ones that appeared.
  const used = new Set<string>();
  const marked123 = markTerms(page1 + page2 + page3, used);
  const marked4a = markTerms(page4a, used);
  const marked4b = markTerms(page4b, used);
  return marked123 + marked4a + glossary(used) + marked4b;
}
