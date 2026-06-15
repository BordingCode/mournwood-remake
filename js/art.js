// Manifest-gated art loader. The UI builds via innerHTML, so these helpers return
// HTML strings. Any slot NOT listed in assets/manifest.json makes ZERO network
// requests and shows its typographic/emoji fallback — so partial art always ships
// safely (drop a .webp in AND add its path to the manifest to light it up).

let manifest = new Set();

export async function loadArtManifest() {
  try {
    const res = await fetch('assets/manifest.json', { cache: 'no-cache' });
    if (res.ok) { const list = await res.json(); if (Array.isArray(list)) manifest = new Set(list); }
  } catch (_) { /* no manifest → all fallbacks, zero 404s */ }
}

export const hasArt = (src) => manifest.has(src);

// An <img> layered ON TOP of a fallback. The image is opaque and covers the slot,
// so when it loads it hides the fallback; if it 404s it removes itself and the
// fallback shows through. Only attempted when the slot is in the manifest.
export function artLayer(src, fallbackHtml = '') {
  if (src && manifest.has(src)) {
    return `<img class="artimg" src="${src}" alt="" loading="lazy" onerror="this.remove()">${fallbackHtml}`;
  }
  return fallbackHtml;
}

// Apply a background image only if present + it actually loads (no broken-bg flash).
export function bgImage(elm, src) {
  if (!elm || !src || !manifest.has(src)) return;
  const img = new Image();
  img.onload = () => { elm.style.setProperty('--bgart', `url("${src}")`); elm.classList.add('has-bgart'); };
  img.src = src;
}

// Slot path helpers (keep all callers in sync on naming).
export const enemyArt   = (id) => `assets/enemies/${id}.svg`;
export const cardArt    = (id) => `assets/cards/${id}.svg`;
export const hunterArt  = (id) => `assets/portraits/${id}.svg`;
export const houndArt    = () => `assets/portraits/hound.svg`;
