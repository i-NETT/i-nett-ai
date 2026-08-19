// Rebuilds the one-click AI Governance Kit archive from the current documents.
// The zip is a committed static asset served at /downloads/Fortify-AI-Governance-Kit.zip
// by the AI Usage Policy page. Re-run whenever any kit document changes:
//
//   npm run build:kit
//
// Zero dependencies: writes a standard DEFLATE zip using only Node built-ins
// (dates are fixed so the output is deterministic and git-diff-friendly).
import { readFileSync, writeFileSync } from 'node:fs';
import { deflateRawSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url))); // repo root (scripts/..)
const dl = join(root, 'public', 'downloads');

// Keep this list in sync with the KIT array in src/pages/ai-usage-policy.astro
const NAMES = [
  'AI-Usage-Policy-Framework.docx',
  'Employee-AI-Acknowledgment-Letter.docx',
  'Vendor-AI-Agreement-Letter.docx',
  'AI-Policy-Rollout-Checklist.docx',
  'AI-Fundamentals-Staff-Quiz.docx',
  'Fortify-AI-Executive-Overview.pdf',
];

// CRC-32 (standard IEEE polynomial, table-based)
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const DOS_TIME = 0;      // 00:00:00
const DOS_DATE = 0x0021; // 1980-01-01 — fixed for deterministic output

const locals = [];
const central = [];
let offset = 0;

for (const name of NAMES) {
  let data;
  try { data = readFileSync(join(dl, name)); }
  catch { console.error(`Missing kit file: ${name}`); process.exit(1); }

  const nameBuf = Buffer.from(name, 'utf8');
  const comp = deflateRawSync(data, { level: 9 });
  const crc = crc32(data);

  const lh = Buffer.alloc(30);
  lh.writeUInt32LE(0x04034b50, 0);   // local file header signature
  lh.writeUInt16LE(20, 4);           // version needed
  lh.writeUInt16LE(0, 6);            // flags
  lh.writeUInt16LE(8, 8);            // method: deflate
  lh.writeUInt16LE(DOS_TIME, 10);
  lh.writeUInt16LE(DOS_DATE, 12);
  lh.writeUInt32LE(crc, 14);
  lh.writeUInt32LE(comp.length, 18);
  lh.writeUInt32LE(data.length, 22);
  lh.writeUInt16LE(nameBuf.length, 26);
  lh.writeUInt16LE(0, 28);           // extra length
  locals.push(lh, nameBuf, comp);

  const ch = Buffer.alloc(46);
  ch.writeUInt32LE(0x02014b50, 0);   // central dir header signature
  ch.writeUInt16LE(20, 4);           // version made by
  ch.writeUInt16LE(20, 6);           // version needed
  ch.writeUInt16LE(0, 8);            // flags
  ch.writeUInt16LE(8, 10);           // method
  ch.writeUInt16LE(DOS_TIME, 12);
  ch.writeUInt16LE(DOS_DATE, 14);
  ch.writeUInt32LE(crc, 16);
  ch.writeUInt32LE(comp.length, 20);
  ch.writeUInt32LE(data.length, 24);
  ch.writeUInt16LE(nameBuf.length, 28);
  ch.writeUInt16LE(0, 30);           // extra length
  ch.writeUInt16LE(0, 32);           // comment length
  ch.writeUInt16LE(0, 34);           // disk number start
  ch.writeUInt16LE(0, 36);           // internal attrs
  ch.writeUInt32LE(0, 38);           // external attrs
  ch.writeUInt32LE(offset, 42);      // local header offset
  central.push(ch, nameBuf);

  offset += lh.length + nameBuf.length + comp.length;
}

const centralBuf = Buffer.concat(central);
const localBuf = Buffer.concat(locals);
const eocd = Buffer.alloc(22);
eocd.writeUInt32LE(0x06054b50, 0);         // end of central dir signature
eocd.writeUInt16LE(0, 4);                  // disk number
eocd.writeUInt16LE(0, 6);                  // disk with central dir
eocd.writeUInt16LE(NAMES.length, 8);       // entries on this disk
eocd.writeUInt16LE(NAMES.length, 10);      // total entries
eocd.writeUInt32LE(centralBuf.length, 12); // central dir size
eocd.writeUInt32LE(localBuf.length, 16);   // central dir offset
eocd.writeUInt16LE(0, 20);                 // comment length

const zip = Buffer.concat([localBuf, centralBuf, eocd]);
const out = join(dl, 'Fortify-AI-Governance-Kit.zip');
writeFileSync(out, zip);
console.log(`Built ${out} (${Math.round(zip.length / 1024)} KB, ${NAMES.length} files)`);
