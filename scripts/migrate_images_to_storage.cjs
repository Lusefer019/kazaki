/**
 * Migrates product images stored as inline base64 (data:...) inside the Supabase `products`
 * table to Supabase Storage (bucket `product-images`) and replaces them with public URLs.
 *
 * Why: a table full of base64 images makes `select *` exceed Supabase's statement timeout,
 * so the storefront cannot load products/images any more.
 *
 * Usage (from the project root, needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env):
 *   node scripts/migrate_images_to_storage.cjs            -> dry run (changes nothing)
 *   node scripts/migrate_images_to_storage.cjs --apply    -> uploads + updates rows
 */
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '..', '.env');
const env = Object.fromEntries(
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);
const URL_BASE = (env.SUPABASE_URL || '').replace(/\/+$/, '');
const KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY;
const BUCKET = 'product-images';
const APPLY = process.argv.includes('--apply');

if (!URL_BASE || !KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

async function retry(fn, tries = 5) {
  let last;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); } catch (e) { last = e; await new Promise((r) => setTimeout(r, 1500 * (i + 1))); }
  }
  throw last;
}

const isData = (v) => typeof v === 'string' && v.startsWith('data:');

async function upload(dataUrl, folder) {
  const m = /^data:([^;,]+)(;base64)?,([\s\S]*)$/.exec(dataUrl);
  if (!m) throw new Error('bad data url');
  const mime = m[1];
  const buf = m[2] ? Buffer.from(m[3], 'base64') : Buffer.from(decodeURIComponent(m[3]));
  const ext = (mime.split('/')[1] || 'jpg').replace('jpeg', 'jpg').replace(/[^a-z0-9]/gi, '') || 'jpg';
  const objectPath = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  await retry(async () => {
    const r = await fetch(`${URL_BASE}/storage/v1/object/${BUCKET}/${objectPath}`, {
      method: 'POST',
      headers: { ...H, 'Content-Type': mime, 'cache-control': '31536000' },
      body: buf,
      signal: AbortSignal.timeout(60000),
    });
    if (!r.ok) throw new Error(`upload ${r.status} ${await r.text()}`);
  });
  return { url: `${URL_BASE}/storage/v1/object/public/${BUCKET}/${objectPath}`, bytes: buf.length };
}

(async () => {
  console.log(APPLY ? '*** APPLY MODE ***' : '*** DRY RUN (no changes) ***');

  const ids = await retry(() =>
    fetch(`${URL_BASE}/rest/v1/products?select=id,title&order=created_at.desc`, { headers: H, signal: AbortSignal.timeout(60000) }).then((r) => r.json())
  );
  if (!Array.isArray(ids)) throw new Error('cannot list products: ' + JSON.stringify(ids).slice(0, 200));
  console.log(`products: ${ids.length}`);

  let candidates = 0, migrated = 0, savedBytes = 0, failed = 0;

  for (const { id, title } of ids) {
    try {
      const rows = await retry(() =>
        fetch(`${URL_BASE}/rest/v1/products?select=id,image,gallery&id=eq.${encodeURIComponent(id)}`, { headers: H, signal: AbortSignal.timeout(90000) }).then((r) => r.json())
      );
      const row = rows[0];
      if (!row) continue;
      const gallery = Array.isArray(row.gallery) ? row.gallery : [];
      const heavy = [row.image, ...gallery].filter(isData);
      if (heavy.length === 0) continue;
      candidates++;
      const size = heavy.reduce((s, v) => s + v.length, 0);
      console.log(`- ${id} "${(title || '').slice(0, 30)}" inline images: ${heavy.length}, ~${Math.round(size / 1024)} KB`);
      if (!APPLY) continue;

      const cache = new Map();
      const toUrl = async (v, folder) => {
        if (!isData(v)) return v;
        if (cache.has(v)) return cache.get(v);
        const up = await upload(v, folder);
        cache.set(v, up.url);
        savedBytes += v.length;
        return up.url;
      };
      const newImage = await toUrl(row.image, 'products');
      const newGallery = [];
      for (const g of gallery) newGallery.push(await toUrl(g, 'products'));

      await retry(async () => {
        const r = await fetch(`${URL_BASE}/rest/v1/products?id=eq.${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: { ...H, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify({ image: newImage, gallery: newGallery }),
          signal: AbortSignal.timeout(60000),
        });
        if (!r.ok) throw new Error(`patch ${r.status} ${await r.text()}`);
      });
      migrated++;
      console.log(`  migrated -> ${newImage}`);
    } catch (e) {
      failed++;
      console.error(`  FAILED ${id}: ${e.message}`);
    }
  }

  console.log('\nSummary:', { candidates, migrated, failed, freedKB: Math.round(savedBytes / 1024) });
  if (!APPLY) console.log('Dry run only. Re-run with --apply to migrate.');
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
