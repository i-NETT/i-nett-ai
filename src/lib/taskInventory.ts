// Task-based recoverable-hours model for the AI Readiness Scan.
//
// Replaces the old "how many hours of admin per week?" guess (which no CEO can
// answer) with a concrete inventory of automatable tasks. The prospect ticks
// what their team still does by hand; we multiply each task's conservative
// per-person hours by how many people do that kind of work, cap the result so
// it can't exceed a believable share of a team's capacity, and price it at a
// fully-loaded, source-backed hourly rate.
//
// Everything here is deliberately conservative — see METHODOLOGY_NOTE. The
// report frames the output as "up to $X" and notes actual recoverable value is
// typically higher.

export type TaskArea = 'finance' | 'hr' | 'sales' | 'service' | 'ops' | 'docs' | 'marketing';

export type AutomatableTask = {
  id: string;
  label: string;
  area: TaskArea;
  hrsLow: number;   // conservative per-person hours/week, low end
  hrsHigh: number;  // conservative per-person hours/week, high end
  // If set, this task is surfaced (floated to the top) for these scan industry
  // labels. Base tasks (no verticals) apply to everyone.
  verticals?: string[];
};

export const AREA_LABEL: Record<TaskArea, string> = {
  finance: 'Finance & accounting',
  hr: 'HR & recruiting',
  sales: 'Sales',
  service: 'Customer service',
  ops: 'Operations',
  docs: 'Documents & data entry',
  marketing: 'Marketing',
};

// Base inventory — applies to every vertical. Ranges are intentionally low; the
// point is a number a CFO can't dismiss, not the biggest number possible.
export const BASE_TASKS: AutomatableTask[] = [
  { id: 'ap',        area: 'finance',   label: 'Processing supplier invoices (AP)',        hrsLow: 3, hrsHigh: 6 },
  { id: 'ar',        area: 'finance',   label: 'Chasing overdue invoices (AR)',            hrsLow: 2, hrsHigh: 4 },
  { id: 'expenses',  area: 'finance',   label: 'Expense reports & receipt coding',         hrsLow: 1, hrsHigh: 3 },
  { id: 'recon',     area: 'finance',   label: 'Month-end reconciliation prep',            hrsLow: 2, hrsHigh: 5 },
  { id: 'resumes',   area: 'hr',        label: 'Screening resumes & shortlisting',         hrsLow: 3, hrsHigh: 6 },
  { id: 'onboard',   area: 'hr',        label: 'Onboarding paperwork & checklists',        hrsLow: 1, hrsHigh: 3 },
  { id: 'hrqs',      area: 'hr',        label: 'Answering repeat policy / HR questions',   hrsLow: 1, hrsHigh: 3 },
  { id: 'crm',       area: 'sales',     label: 'CRM data entry & call logging',            hrsLow: 3, hrsHigh: 6 },
  { id: 'quotes',    area: 'sales',     label: 'Building quotes & proposals',              hrsLow: 2, hrsHigh: 5 },
  { id: 'leadres',   area: 'sales',     label: 'Lead research & qualification',            hrsLow: 2, hrsHigh: 5 },
  { id: 'followup',  area: 'sales',     label: 'Writing follow-up emails',                 hrsLow: 2, hrsHigh: 4 },
  { id: 'custqs',    area: 'service',   label: 'Answering the same customer questions',    hrsLow: 3, hrsHigh: 6 },
  { id: 'triage',    area: 'service',   label: 'Ticket triage & routing',                  hrsLow: 2, hrsHigh: 4 },
  { id: 'copypaste', area: 'ops',       label: 'Copy-pasting data between systems',        hrsLow: 3, hrsHigh: 6 },
  { id: 'reports',   area: 'ops',       label: 'Compiling recurring reports',              hrsLow: 2, hrsHigh: 5 },
  { id: 'schedule',  area: 'ops',       label: 'Scheduling & calendar coordination',       hrsLow: 1, hrsHigh: 3 },
  { id: 'notes',     area: 'ops',       label: 'Meeting notes & action items',             hrsLow: 2, hrsHigh: 4 },
  { id: 'summarize', area: 'docs',      label: 'Reading / summarizing long documents',     hrsLow: 2, hrsHigh: 5 },
  { id: 'rekey',     area: 'docs',      label: 'Re-keying data from PDFs & forms',         hrsLow: 2, hrsHigh: 5 },
  { id: 'content',   area: 'marketing', label: 'Drafting content (social / blog / email)', hrsLow: 2, hrsHigh: 5 },
];

// Vertical overlay — surfaced first for the matching industry, in ADDITION to
// the base list. Industry strings match the scan's `industry` answer verbatim.
export const VERTICAL_TASKS: AutomatableTask[] = [
  { id: 'priorauth', area: 'ops',     label: 'Prior-auth / insurance verification', hrsLow: 3, hrsHigh: 7, verticals: ['Healthcare / Medical'] },
  { id: 'claims',    area: 'finance', label: 'Claims & EOB processing',             hrsLow: 3, hrsHigh: 6, verticals: ['Healthcare / Medical'] },
  { id: 'apptrem',   area: 'ops',     label: 'Appointment scheduling & reminders',  hrsLow: 2, hrsHigh: 5, verticals: ['Healthcare / Medical'] },
  { id: 'charts',    area: 'docs',    label: 'Chart / clinical note summarization', hrsLow: 2, hrsHigh: 5, verticals: ['Healthcare / Medical'] },
  { id: 'intake',    area: 'ops',     label: 'Patient intake forms & data entry',   hrsLow: 2, hrsHigh: 4, verticals: ['Healthcare / Medical'] },
  { id: 'docreview', area: 'docs',    label: 'Document review & summarization',     hrsLow: 3, hrsHigh: 7, verticals: ['Legal'] },
  { id: 'contracts', area: 'docs',    label: 'Contract abstraction & key terms',    hrsLow: 2, hrsHigh: 6, verticals: ['Legal'] },
  { id: 'conflicts', area: 'ops',     label: 'Client intake & conflict checks',     hrsLow: 2, hrsHigh: 4, verticals: ['Legal'] },
  { id: 'docketing', area: 'ops',     label: 'Deadline / docketing management',     hrsLow: 1, hrsHigh: 4, verticals: ['Legal'] },
  { id: 'kyc',        area: 'finance', label: 'KYC / client onboarding documents',  hrsLow: 2, hrsHigh: 5, verticals: ['Financial services'] },
  { id: 'statements', area: 'finance', label: 'Statement & report preparation',     hrsLow: 2, hrsHigh: 5, verticals: ['Financial services'] },
  { id: 'fscompliance', area: 'ops',   label: 'Compliance & regulatory reporting',  hrsLow: 2, hrsHigh: 5, verticals: ['Financial services'] },
];

// Fully-loaded hourly cost by scan industry. Values mirror the site's public
// ROI calculator (INDUSTRY_PRESETS in site.ts) so a prospect who runs both
// tools never sees two different dollar figures — with Legal dropped from $95
// (attorney-only) to $78 (blended across paralegals/admin, which is what a
// whole-department multiplier actually implies). Corroborated against BLS
// Employer Costs for Employee Compensation, March 2026.
export const INDUSTRY_RATE: Record<string, number> = {
  'Healthcare / Medical': 52,
  'Legal': 78,
  'Financial services': 68,
  'Professional services': 72,
  'Manufacturing': 42,
  'Retail / E-commerce': 32,
  'Real estate': 48,
  'Education / Schools': 38,
  'Nonprofit': 38,
  'Government / Public sector': 60,
  'Technology': 72,
  'Other': 55,
};
export const DEFAULT_RATE = 55;
export const WORK_WEEKS = 50;      // 52 minus ~2 weeks PTO — matches the ROI calculator
export const CAP_FRACTION = 0.35;  // recovered hours can't exceed this share of a team's capacity

export function rateFor(industry: string): number {
  return INDUSTRY_RATE[industry] ?? DEFAULT_RATE;
}

// Tasks to show, vertical matches first, then the base list — de-duplicated by
// id so a vertical task that overlaps the base list isn't shown twice.
export function tasksForIndustry(industry: string): AutomatableTask[] {
  const overlay = VERTICAL_TASKS.filter((t) => (t.verticals || []).includes(industry));
  const seen = new Set(overlay.map((t) => t.id));
  return [...overlay, ...BASE_TASKS.filter((t) => !seen.has(t.id))];
}

export type AreaBreakdown = { area: TaskArea; people: number; low: number; high: number; capped: boolean };
export type RecoverableResult = {
  weeklyLow: number;
  weeklyHigh: number;
  annualLow: number;
  annualHigh: number;
  rate: number;
  byArea: AreaBreakdown[];
  byTask: TaskBreakdown[];
  anyCapped: boolean;
};

// Per-task hours for the "where your team's week goes" itemized list. Within a
// capped area the per-task hours are scaled down proportionally so they still
// sum to the (capped) area total — otherwise the line items wouldn't add up to
// the headline number.
export type TaskBreakdown = { id: string; label: string; area: TaskArea; low: number; high: number };

// selectedIds: task ids the prospect ticked.
// peopleByArea: how many people spend time on that area's work (their answer).
// Hours are capped PER AREA at CAP_FRACTION of that team's capacity so the
// number can never claim, say, 60% of an accounting department is pure
// busywork — which would be instantly discrediting.
export function computeRecoverable(
  selectedIds: string[],
  peopleByArea: Partial<Record<TaskArea, number>>,
  industry: string,
): RecoverableResult {
  const all = [...BASE_TASKS, ...VERTICAL_TASKS];
  const picked = all.filter((t) => selectedIds.includes(t.id));
  const rate = rateFor(industry);

  const areas = Array.from(new Set(picked.map((t) => t.area))) as TaskArea[];
  const byTask: TaskBreakdown[] = [];
  const byArea: AreaBreakdown[] = areas.map((area) => {
    const people = Math.max(1, Math.round(peopleByArea[area] || 1));
    const areaTasks = picked.filter((t) => t.area === area);
    const rawLow = areaTasks.reduce((s, t) => s + t.hrsLow, 0) * people;
    const rawHigh = areaTasks.reduce((s, t) => s + t.hrsHigh, 0) * people;
    const cap = CAP_FRACTION * people * 40;
    const low = Math.min(rawLow, cap);
    const high = Math.min(rawHigh, cap);
    // Distribute the (possibly capped) area total back across its tasks so the
    // itemized list still sums to the headline.
    const scaleLow = rawLow > 0 ? low / rawLow : 0;
    const scaleHigh = rawHigh > 0 ? high / rawHigh : 0;
    areaTasks.forEach((t) => byTask.push({
      id: t.id, label: t.label, area,
      low: Math.round(t.hrsLow * people * scaleLow),
      high: Math.round(t.hrsHigh * people * scaleHigh),
    }));
    return { area, people, low, high, capped: rawHigh > cap };
  });
  byTask.sort((a, b) => b.high - a.high);

  const weeklyLow = Math.round(byArea.reduce((s, a) => s + a.low, 0));
  const weeklyHigh = Math.round(byArea.reduce((s, a) => s + a.high, 0));
  return {
    weeklyLow,
    weeklyHigh,
    annualLow: Math.round(weeklyLow * rate * WORK_WEEKS),
    annualHigh: Math.round(weeklyHigh * rate * WORK_WEEKS),
    rate,
    byArea,
    byTask,
    anyCapped: byArea.some((a) => a.capped),
  };
}

// ---------------------------------------------------------------------------
// Headcount estimation. Nobody wants to type how many people touch AP or CRM
// entry, so the scan pre-fills every area from the organization's size and
// industry and lets the prospect adjust. The shares are the fraction of ALL
// staff who spend meaningful time on that kind of work (not department size),
// so they overlap across areas on purpose. They are rough industry averages,
// stated as such on the page; the point is to be close, not exact.

// Midpoint headcount for each scan size answer.
export const SIZE_MIDPOINT: Record<string, number> = {
  'Just me': 1,
  '2-10': 6,
  '11-25': 18,
  '26-100': 60,
  '101-250': 170,
  '250-500': 375,
  '500-999': 750,
  '1,000-2,500': 1750,
  '2,500-10,000': 6000,
  '10,000+': 15000,
};

type Shares = Record<TaskArea, number>;
const DEFAULT_SHARE: Shares = { finance: 0.06, hr: 0.04, sales: 0.15, service: 0.15, ops: 0.20, docs: 0.25, marketing: 0.05 };
export const AREA_SHARE: Record<string, Shares> = {
  'Healthcare / Medical':       { finance: 0.06, hr: 0.04, sales: 0.04, service: 0.18, ops: 0.25, docs: 0.30, marketing: 0.03 },
  'Legal':                      { finance: 0.06, hr: 0.03, sales: 0.06, service: 0.10, ops: 0.15, docs: 0.45, marketing: 0.04 },
  'Financial services':         { finance: 0.15, hr: 0.04, sales: 0.20, service: 0.15, ops: 0.18, docs: 0.30, marketing: 0.05 },
  'Professional services':      { finance: 0.07, hr: 0.04, sales: 0.15, service: 0.12, ops: 0.18, docs: 0.30, marketing: 0.06 },
  'Manufacturing':              { finance: 0.05, hr: 0.03, sales: 0.08, service: 0.08, ops: 0.30, docs: 0.15, marketing: 0.03 },
  'Retail / E-commerce':        { finance: 0.04, hr: 0.03, sales: 0.30, service: 0.30, ops: 0.20, docs: 0.10, marketing: 0.06 },
  'Real estate':                { finance: 0.06, hr: 0.03, sales: 0.35, service: 0.15, ops: 0.18, docs: 0.25, marketing: 0.08 },
  'Education / Schools':        { finance: 0.05, hr: 0.05, sales: 0.02, service: 0.15, ops: 0.25, docs: 0.30, marketing: 0.04 },
  'Nonprofit':                  { finance: 0.08, hr: 0.05, sales: 0.10, service: 0.15, ops: 0.25, docs: 0.25, marketing: 0.08 },
  'Government / Public sector': { finance: 0.06, hr: 0.06, sales: 0.01, service: 0.25, ops: 0.25, docs: 0.35, marketing: 0.03 },
  'Technology':                 { finance: 0.05, hr: 0.05, sales: 0.20, service: 0.15, ops: 0.15, docs: 0.15, marketing: 0.08 },
};

// Estimated people per area for a given industry and size answer. Always at
// least 1 so the multiplier never zeroes out a task the prospect ticked.
export function estimateHeadcount(industry: string, sizeAnswer: string): Record<TaskArea, number> {
  const total = SIZE_MIDPOINT[sizeAnswer] ?? 25;
  const shares = AREA_SHARE[industry] ?? DEFAULT_SHARE;
  const out = {} as Record<TaskArea, number>;
  (Object.keys(shares) as TaskArea[]).forEach((area) => {
    out[area] = Math.max(1, Math.round(total * shares[area]));
  });
  return out;
}

export const ESTIMATE_NOTE =
  'Pre-filled from industry averages for an organization of your size and sector. These are estimates, not exact figures. Adjust anything that looks off, or just continue.';

// One-line source note printed on the web result and the PDF, so the math has a
// citation on the document a CEO forwards to their CFO or attorney.
export const METHODOLOGY_NOTE =
  'Estimates use low, per-task hour ranges multiplied by the number of people who do that work, capped at '
  + Math.round(CAP_FRACTION * 100) + '% of each team’s time, at an hourly cost that includes wages, benefits and payroll tax, '
  + 'based on United States Bureau of Labor Statistics employer cost data (March 2026) and i-NETT industry data, '
  + 'over ' + WORK_WEEKS + ' working weeks. Figures are on purpose low. The real value is usually higher.';
