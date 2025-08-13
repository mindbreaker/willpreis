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

  function getDataFromNextJson() {
    const el = document.getElementById('__NEXT_DATA__');
    if (!el) return [];
    try {
      return JSON.parse(el.textContent || '{}').props.pageProps.searchResult.advertSummaryList.advertSummary.map(ad => {
        const priceAmount = ad.attributes?.attribute?.find(a => a.name === 'PRICE/AMOUNT')?.values?.[0] || 0;
        return {
          id: ad.id,
          price: priceAmount != null ? parseFloat(priceAmount) : 0
        };
      });
    } catch {
      return [];
    }
  }

  // get id and price from HTML
  function getDataFromHtml() {
    const elements = document.querySelectorAll('[data-testid^="search-result-entry-price-"]');
    return Array.from(elements).map(el => {
      // convert german decimal
      const price = el.textContent === 'zu verschenken' ? 0 : parseFloat(el.textContent.replace('€', '').replace('.', '').replace(',', '.').trim());
      return { id: el.dataset.testid.replace('search-result-entry-price-', ''), price };
    });
  }

  // remove duplicates and get just price
  function extractPrices(ads) {
    const seen = new Set();
    return ads.reduce((acc, ad) => {
      if ((ad.price || ad.price === 0) && !seen.has(ad.id)) {
        seen.add(ad.id);
        acc.push(ad.price);
      }
      return acc;
    }, []);
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
      display:flex; gap:12px; flex-wrap:wrap; align-items:center;color:var(--wh-color-typo-main-foreground);
      padding:12px 14px; margin:12px 0;
      border:1px solid var(--wh-color-basic-outline); border-radius:8px; background:var(--wh-color-basic-background);
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

  function run(useNextJson) {
    // const data = getDataFromNextJson().concat(getDataFromHtml());
    const data = useNextJson ? getDataFromNextJson() : getDataFromHtml();
    const prices = extractPrices(data);
    render(calcStats(prices));
  }

  // ---------- 3) initial & bei SPA-Updates neu rechnen -----------------------
  run(true);

  const nextEl = document.getElementById('__NEXT_DATA__');
  if (nextEl) {
    const obs = new MutationObserver(() => run(true));
    obs.observe(nextEl, { characterData: true, childList: true, subtree: true });
  }

  // ---------- 4) Observe title, because it updates when searching new or filtering
  const titleEl = document.getElementById('result-list-title');
  if (titleEl) {
    const obs = new MutationObserver(() => run());
    obs.observe(titleEl, { attributes: true });
  }
})();