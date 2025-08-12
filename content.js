(function () {
  // ---------- 1) rows=500 erzwingen, wenn isNavigation gesetzt --------------
  (function ensureRowsOnNavigation() {
    try {
      const url = new URL(location.href);
      if (!url.searchParams.has('isNavigation')) return;

      const currentRows = Number(url.searchParams.get('rows')) || 0;
      if (!currentRows || currentRows < 500) {
        url.searchParams.set('rows', '500');
        // kein History-Eintrag erzeugen
        location.replace(url.toString());
      }
    } catch { /* noop */ }
  })();

  // ---------- 2) Helpers -----------------------------------------------------
  const nf = new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' });

  function getNextData() {
    const el = document.getElementById('__NEXT_DATA__');
    if (!el) return null;
    try { return JSON.parse(el.textContent || '{}'); } catch { return null; }
  }

  // nur PRICE/AMOUNT lesen
  function extractPrices(nd) {
    const ads = nd?.props?.pageProps?.searchResult?.advertSummaryList?.advertSummary;
    if (!Array.isArray(ads)) return [];
    const out = [];
    for (const ad of ads) {
      const attrs = ad?.attributes?.attribute;
      if (!Array.isArray(attrs)) continue;
      const priceAmount = attrs.find(a => a?.name === 'PRICE/AMOUNT')?.values?.[0];
      const n = priceAmount != null ? parseFloat(String(priceAmount)) : null;
      if (Number.isFinite(n) && n > 0) out.push(n);
    }
    return out;
  }

  function calcStats(nums) {
    if (!nums.length) return null;
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
    return { count: nums.length, min, max, avg };
  }

  function ensureBox(anchor) {
    let box = document.getElementById('wh-price-stats');
    if (box) return box;

    box = document.createElement('div');
    box.id = 'wh-price-stats';
    box.style.cssText = `
      display:flex; gap:12px; flex-wrap:wrap; align-items:center;
      padding:12px 14px; margin:12px 0;
      border:1px solid #e5e7eb; border-radius:8px; background:#fafafa;
      font: 14px/1.4 system-ui, -apple-system, Segoe UI, Roboto, Arial;
    `;
    if (anchor?.parentNode) anchor.parentNode.insertBefore(box, anchor);
    else document.body.prepend(box);
    return box;
  }

  function render(stats) {
    const anchor = document.getElementById('skip-to-resultlist');
    const box = ensureBox(anchor);
    if (!stats) {
      box.textContent = 'Preis-Stats: Keine Preise gefunden.';
      return;
    }
    box.innerHTML = `
      <strong>Preis-Stats (${stats.count} Anzeigen):</strong>
      <div style="color:#059669">Tiefspreis: ${nf.format(stats.min)}</div>
      <div style="color:#dc2626">Höchstpreis: ${nf.format(stats.max)}</div>
      <div style="color:#d97706">Durchschnitt: ${nf.format(stats.avg)}</div>
    `;
  }

  function run() {
    const nd = getNextData();
    const prices = extractPrices(nd);
    render(calcStats(prices));
  }

  // ---------- 3) initial & bei SPA-Updates neu rechnen -----------------------
  run();

  const nextEl = document.getElementById('__NEXT_DATA__');
  if (nextEl) {
    const obs = new MutationObserver(() => run());
    obs.observe(nextEl, { characterData: true, childList: true, subtree: true });
  }
})();
