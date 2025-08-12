function fetchPrices() {
  const priceElements = document.querySelectorAll('span[data-testid^="search-result-entry-price-"]');
  const prices = [];

  priceElements.forEach((element) => {
    const priceText = element.getAttribute('aria-label');
    const price = parseFloat(priceText.replace('€', '').trim());
    prices.push(price);
  });

  return prices;
}

function calculateAndShowResults(prices) {
  if (prices.length === 0) {
    return;
  }

  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const avgPrice = prices.reduce((acc, price) => acc + price, 0) / prices.length;

  const resultElement = document.getElementById('skip-to-resultlist');
  if (resultElement) {
    const minPriceElement = `<div style="color: green;">Minimalpreis: €${minPrice}</div>`;
    const maxPriceElement = `<div style="color: red;">Maximalpreis: €${maxPrice}</div>`;
    const avgPriceElement = `<div style="color: orange;">Durchschnittspreis: €${avgPrice.toFixed(2)}</div>`;
    
    resultElement.innerHTML = minPriceElement + maxPriceElement + avgPriceElement + resultElement.innerHTML;
  }
}

function main() {
  const prices = fetchPrices();
  calculateAndShowResults(prices);
}

main();
