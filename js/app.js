/* MiniMusicLibrary demo site. Data lives in js/data.js (window.MML). */
(function () {
  "use strict";
  const { config, records } = window.MML;
  const $ = (s, el = document) => el.querySelector(s);
  const page = document.body.dataset.page;

  const COND = {
    Sealed: "Factory sealed", M: "Mint", NM: "Near mint", "VG+": "Very good plus",
    VG: "Very good", "G+": "Good plus", G: "Good", "F/P": "Fair / poor", Generic: "Plain or replacement sleeve"
  };
  const COND_ORDER = ["Sealed", "M", "NM", "VG+", "VG", "G+", "G", "F/P", "Generic"];

  const money = n => config.currency + Number(n).toLocaleString("en-US");
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const bySku = sku => records.find(r => r.sku === sku);
  const gradeLabel = r => r.type === "New" ? "New" : `${r.vinyl} / ${r.sleeve}`;

  /* ---------- cart (browser storage, guarded) ---------- */
  const KEY = "mml-cart";
  const readCart = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
  const writeCart = c => { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} updateCount(); };
  const inCart = sku => (readCart().find(i => i.sku === sku) || { qty: 0 }).qty;
  function addToCart(sku) {
    const r = bySku(sku); const c = readCart(); const it = c.find(i => i.sku === sku);
    if (it) { if (it.qty >= r.stock) return false; it.qty++; } else c.push({ sku, qty: 1 });
    writeCart(c); return true;
  }
  function updateCount() {
    const n = readCart().reduce((a, i) => a + i.qty, 0);
    const el = $(".cart-count"); if (!el) return;
    el.textContent = n; el.classList.toggle("has-items", n > 0);
    el.setAttribute("aria-label", n + " items in cart");
  }

  /* ---------- header + footer ---------- */
  function chrome() {
    const cur = p => page === p ? ' aria-current="page"' : "";
    const h = $("#site-header");
    if (h) h.outerHTML = `
      <header class="site-header"><div class="wrap">
        <a class="brand" href="index.html" aria-label="${esc(config.shopName)} home"><img src="images/logo-wordmark.png" alt="${esc(config.shopName)}"></a>
        <nav class="nav" aria-label="Main">
          <a href="records.html"${cur("records")}>Records</a>
          <a href="cafe.html"${cur("cafe")}>Café</a>
          <a href="index.html#visit" class="hide-sm">Visit</a>
          <a href="cart.html" class="cart-link"${cur("cart")}>Cart <span class="cart-count">0</span></a>
        </nav>
      </div></header>`;
    const f = $("#site-footer");
    if (f) f.outerHTML = `
      <footer class="site-footer"><div class="wrap">
        <img src="images/logo-full.png" alt="${esc(config.shopName)}, vinyl coffee shop, Ankara, since 2025">
        <div class="footer-row">
          <span>Records, coffee and a pair of speakers you're allowed to use.</span>
          <span><a href="https://instagram.com/${esc(config.instagram)}">Instagram</a></span>
        </div>
        ${config.demo ? '<div class="footer-row"><span class="demo-flag">Demo site. Record conditions, some prices and the menu are placeholder data.</span></div>' : ""}
      </div></footer>`;
    updateCount();
  }

  /* ---------- card ---------- */
  function card(r) {
    return `<a class="card${r.stock < 1 ? " sold-out" : ""}" href="record.html?sku=${encodeURIComponent(r.sku)}">
      <div class="sleeve"><span class="disc" aria-hidden="true"></span>
        <img src="${esc(r.image)}" alt="Cover of ${esc(r.title)} by ${esc(r.artist)}" loading="lazy" width="900" height="900"></div>
      <div class="card-info">
        <span class="card-artist">${esc(r.artist)}</span>
        <span class="card-title">${esc(r.title)}</span>
        <span class="card-meta">${esc(r.genre)}${r.year ? ", " + r.year : ""} · ${esc(r.format)}</span>
        <div class="card-row"><span class="price">${money(r.price)}</span>
          <span class="grade${r.type === "New" ? " new" : ""}" title="${r.type === "New" ? "New, sealed" : "Vinyl / sleeve condition"}">${esc(gradeLabel(r))}</span></div>
      </div></a>`;
  }

  /* ---------- home ---------- */
  function home() {
    const latest = [...records].sort((a, b) => b.added - a.added).slice(0, 10);
    $("#latest").innerHTML = latest.map(card).join("");
    $("#record-count").textContent = records.length;
    const genres = [...new Set(records.map(r => r.genre))].sort();
    $("#genre-links").innerHTML = genres.map(g =>
      `<a class="text-link" href="records.html?genre=${encodeURIComponent(g)}">${esc(g)}</a>`).join(", ");
  }

  /* ---------- records (browse + filter) ---------- */
  function shop() {
    const params = new URLSearchParams(location.search);
    const state = { q: "", genre: new Set(), type: new Set(), vinyl: new Set(), format: new Set(), max: 0, sort: "added" };
    if (params.get("genre")) state.genre.add(params.get("genre"));
    const maxPrice = Math.max(...records.map(r => r.price));
    const step = 100; const top = Math.ceil(maxPrice / step) * step; state.max = top;

    const groups = [
      ["genre", "Genre", r => r.genre],
      ["type", "New or used", r => r.type],
      ["vinyl", "Vinyl condition", r => r.vinyl],
      ["format", "Format", r => r.format],
    ];
    const order = key => key === "vinyl" ? (a, b) => COND_ORDER.indexOf(a) - COND_ORDER.indexOf(b) : (a, b) => a.localeCompare(b);

    const form = $("#filters");
    form.innerHTML = `
      <label class="sr-only" for="q">Search records</label>
      <input class="search" id="q" type="search" placeholder="Search artist, title, label" autocomplete="off">
      ${groups.map(([key, title, get]) => {
        const vals = [...new Set(records.map(get))].sort(order(key));
        return `<fieldset><legend>${title}</legend>${vals.map(v => `
          <label class="check"><input type="checkbox" name="${key}" value="${esc(v)}"${state[key].has(v) ? " checked" : ""}>
          <span>${esc(key === "vinyl" && v !== "Sealed" ? v + " " + COND[v].toLowerCase() : v)}</span><span class="n" data-count="${key}|${esc(v)}"></span></label>`).join("")}</fieldset>`;
      }).join("")}
      <fieldset><legend>Price</legend>
        <label for="max">Up to <span class="range-out" id="max-out">${money(top)}</span></label>
        <input id="max" type="range" min="${step * 4}" max="${top}" step="${step}" value="${top}">
      </fieldset>`;

    form.addEventListener("input", e => {
      const t = e.target;
      if (t.id === "q") state.q = t.value.trim().toLowerCase();
      else if (t.id === "max") { state.max = +t.value; $("#max-out").textContent = money(state.max); }
      else if (t.name) t.checked ? state[t.name].add(t.value) : state[t.name].delete(t.value);
      render();
    });
    $("#sort").addEventListener("change", e => { state.sort = e.target.value; render(); });
    $(".filters-toggle").addEventListener("click", e => {
      const open = form.classList.toggle("open"); e.currentTarget.setAttribute("aria-expanded", open);
    });

    function matches(r, skip) {
      if (state.q && !`${r.artist} ${r.title} ${r.label} ${r.style}`.toLowerCase().includes(state.q)) return false;
      if (r.price > state.max) return false;
      for (const [key, , get] of groups) if (key !== skip && state[key].size && !state[key].has(get(r))) return false;
      return true;
    }
    const sorters = {
      added: (a, b) => b.added - a.added,
      "price-asc": (a, b) => a.price - b.price,
      "price-desc": (a, b) => b.price - a.price,
      artist: (a, b) => a.artist.localeCompare(b.artist),
      year: (a, b) => (b.year || 0) - (a.year || 0),
    };

    function render() {
      const list = records.filter(r => matches(r)).sort(sorters[state.sort]);
      $("#results").innerHTML = list.length ? list.map(card).join("") : "";
      $("#empty").hidden = list.length > 0;
      $("#result-count").textContent = `${list.length} of ${records.length} records`;
      document.querySelectorAll("[data-count]").forEach(el => {
        const [key, val] = el.dataset.count.split("|");
        const get = groups.find(g => g[0] === key)[2];
        el.textContent = records.filter(r => matches(r, key) && get(r) === val).length;
      });
      const chips = [];
      groups.forEach(([key]) => state[key].forEach(v => chips.push(`<button class="chip" data-k="${key}" data-v="${esc(v)}" aria-label="Remove filter ${esc(v)}">${esc(v)}</button>`)));
      if (state.max < top) chips.push(`<button class="chip" data-k="max" aria-label="Remove price limit">Up to ${money(state.max)}</button>`);
      if (state.q) chips.push(`<button class="chip" data-k="q" aria-label="Clear search">“${esc(state.q)}”</button>`);
      $("#chips").innerHTML = chips.join("") + (chips.length > 1 ? '<button class="clear-all" data-k="all">Clear all</button>' : "");
    }
    const resetBox = (key, v) => { const i = form.querySelector(`input[name="${key}"][value="${CSS.escape(v)}"]`); if (i) i.checked = false; };
    function clearAll() { groups.forEach(([key]) => { state[key].forEach(v => resetBox(key, v)); state[key].clear(); }); state.q = ""; $("#q").value = ""; state.max = top; $("#max").value = top; $("#max-out").textContent = money(top); render(); }
    $("#chips").addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      const k = b.dataset.k;
      if (k === "all") return clearAll();
      else if (k === "max") { state.max = top; $("#max").value = top; $("#max-out").textContent = money(top); }
      else if (k === "q") { state.q = ""; $("#q").value = ""; }
      else { state[k].delete(b.dataset.v); resetBox(k, b.dataset.v); }
      render();
    });
    $("#empty-reset").addEventListener("click", clearAll);
    render();
  }

  /* ---------- single record ---------- */
  function record() {
    const r = bySku(new URLSearchParams(location.search).get("sku"));
    const main = $("#record");
    if (!r) {
      main.innerHTML = `<div class="empty"><h1>We couldn't find that record.</h1><p>It may have sold, or the link is incomplete.</p><a class="btn" href="records.html">Browse all records</a></div>`;
      return;
    }
    document.title = `${r.artist} – ${r.title} | ${config.shopName}`;
    const isNew = r.type === "New";
    const msg = encodeURIComponent(`Hi! I'd like to reserve ${r.artist} – ${r.title} (${r.sku}), ${money(r.price)}.`);
    main.innerHTML = `
      <div class="record-art"><div class="sleeve"><span class="disc" aria-hidden="true"></span>
        <img src="${esc(r.image)}" alt="Cover of ${esc(r.title)} by ${esc(r.artist)}" width="900" height="900"></div></div>
      <div class="record-info">
        <div>
          <div class="crumbs"><a href="records.html">Records</a> / <a href="records.html?genre=${encodeURIComponent(r.genre)}">${esc(r.genre)}</a></div>
          <div class="artist">${esc(r.artist)}</div>
          <h1>${esc(r.title)}</h1>
        </div>
        <p>${esc(r.description)}</p>
        <div class="record-buy">
          <span class="price">${money(r.price)}</span>
          <div class="buy-actions">
            <button class="btn" id="add">Add to cart</button>
            ${config.reserveEnabled ? `<a class="btn ghost" href="https://wa.me/${esc(config.whatsappNumber)}?text=${msg}">Reserve on WhatsApp</a>` : ""}
          </div>
        </div>
        <p class="stock-note" id="stock-note"></p>
        <div class="conditions">
          ${isNew ? `<div><div class="k">Condition</div><div class="v">New</div><div class="d">Factory sealed</div></div>
                     <div><div class="k">Format</div><div class="v">${esc(r.format)}</div><div class="d">${r.stock} in stock</div></div>`
                  : `<div><div class="k">Vinyl</div><div class="v">${esc(r.vinyl)}</div><div class="d">${esc(COND[r.vinyl])}</div></div>
                     <div><div class="k">Sleeve</div><div class="v">${esc(r.sleeve)}</div><div class="d">${esc(COND[r.sleeve])}</div></div>`}
        </div>
        <dl class="specs">
          <dt>Genre</dt><dd>${esc(r.genre)}, ${esc(r.style)}</dd>
          <dt>Format</dt><dd>${esc(r.format)}</dd>
          ${r.label ? `<dt>Label</dt><dd>${esc(r.label)}</dd>` : ""}
          ${r.year ? `<dt>Year</dt><dd>${r.year}</dd>` : ""}
          <dt>Stock code</dt><dd>${esc(r.sku)}</dd>
        </dl>
        <p class="stock-note">You can listen to any record in the shop before you buy it. Ask at the counter.</p>
        ${r.verify && config.demo ? `<p class="verify-note">Demo note: some details for this pressing still need checking against Discogs.</p>` : ""}
      </div>`;

    const btn = $("#add"), note = $("#stock-note"), art = $(".record-art");
    function sync() {
      const left = r.stock - inCart(r.sku);
      if (r.stock < 1) { btn.disabled = true; btn.textContent = "Sold out"; note.textContent = "This one has gone to a new home."; }
      else if (left < 1) { btn.disabled = true; btn.textContent = "In your cart"; note.innerHTML = `${r.stock === 1 ? "There's only one copy, and it's" : "All copies are"} in your cart. <a href="cart.html">Go to cart</a>`; }
      else { btn.disabled = false; btn.textContent = "Add to cart"; note.textContent = isNew ? "" : "One copy. Used records are one of a kind."; }
    }
    btn.addEventListener("click", () => {
      if (addToCart(r.sku)) {
        art.classList.remove("spin"); void art.offsetWidth; art.classList.add("spin");
        toast(`Added to cart`); sync();
      }
    });
    sync();

    const related = records.filter(x => x.genre === r.genre && x.sku !== r.sku).slice(0, 4);
    if (related.length) {
      $("#related").hidden = false;
      $("#related-title").textContent = `More ${r.genre.toLowerCase()} in the bins`;
      $("#related-grid").innerHTML = related.map(card).join("");
    }
  }

  function toast(text) {
    let t = $(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.innerHTML = `${esc(text)} <a href="cart.html">View cart</a>`;
    t.classList.add("show"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 2600);
  }

  /* ---------- cart + demo checkout ---------- */
  function cart() {
    const box = $("#cart");
    function render() {
      const items = readCart().filter(i => bySku(i.sku));
      if (!items.length) {
        box.innerHTML = `<div class="empty"><h2>Your cart is empty.</h2><p>Find something on the wall first.</p><a class="btn" href="records.html">Browse records</a></div>`;
        return;
      }
      const total = items.reduce((a, i) => a + bySku(i.sku).price * i.qty, 0);
      box.innerHTML = `
        <div class="cart-layout">
          <div>${items.map(i => { const r = bySku(i.sku); return `
            <div class="cart-item">
              <img src="${esc(r.image)}" alt="">
              <div><a href="record.html?sku=${encodeURIComponent(r.sku)}"><strong>${esc(r.artist)}</strong></a><br>${esc(r.title)}
                <div class="meta">${esc(r.format)}, ${esc(gradeLabel(r))}</div>
                ${r.stock > 1 ? `<div class="qty"><button data-a="dec" data-s="${r.sku}" aria-label="One less">−</button><span>${i.qty}</span><button data-a="inc" data-s="${r.sku}" aria-label="One more"${i.qty >= r.stock ? " disabled" : ""}>+</button></div>` : ""}
                <div><button class="remove" data-a="rm" data-s="${r.sku}">Remove</button></div>
              </div>
              <span class="price">${money(r.price * i.qty)}</span>
            </div>`; }).join("")}
          </div>
          <aside class="summary" aria-label="Order summary">
            <h2 style="font-size:28px">Checkout</h2>
            <div class="sum-row"><span>Records</span><span>${money(total)}</span></div>
            <form class="form" id="checkout">
              <div class="radio-row" role="radiogroup" aria-label="How you'll get your records">
                <label class="check"><input type="radio" name="how" value="pickup" checked> Pick up in store</label>
                <label class="check"><input type="radio" name="how" value="ship"> Ship to me</label>
              </div>
              <label>Full name <input name="name" required autocomplete="name"></label>
              <label>Phone <input name="phone" required type="tel" autocomplete="tel"></label>
              <label id="addr" hidden>Address <input name="address" autocomplete="street-address"></label>
              <div class="sum-row total"><span>Total</span><span id="total">${money(total)}</span></div>
              <button class="btn" type="submit">Place order</button>
              <p class="stock-note">Demo checkout: no payment is taken. Shipping is calculated when we confirm your order.</p>
            </form>
            <div id="done"></div>
          </aside>
        </div>`;
      const f = $("#checkout");
      f.addEventListener("change", () => { const ship = f.how.value === "ship"; $("#addr").hidden = !ship; f.address.required = ship; });
      f.addEventListener("submit", e => {
        e.preventDefault();
        const lines = items.map(i => { const r = bySku(i.sku); return `${i.qty}× ${r.artist} – ${r.title} (${r.sku})`; }).join("\n");
        const text = encodeURIComponent(`New order from ${f.name.value}\n${lines}\nTotal: ${money(total)}\n${f.how.value === "ship" ? "Ship to: " + f.address.value : "Pick up in store"}`);
        f.hidden = true;
        $("#done").innerHTML = `<div class="confirm" role="status"><h3>Order placed, ${esc(f.name.value.split(" ")[0])}.</h3>
          <p>This is a demo, so nothing was charged and no order was sent. In the live shop, we'd confirm by phone and hold your records ${f.how.value === "ship" ? "until they ship" : "at the counter for 3 days"}.</p>
          ${config.reserveEnabled ? `<a class="btn" href="https://wa.me/${esc(config.whatsappNumber)}?text=${text}">Send order on WhatsApp</a>` : ""}
          <button class="btn ghost" id="clear">Clear cart</button></div>`;
        $("#clear").addEventListener("click", () => { writeCart([]); render(); });
      });
    }
    box.addEventListener("click", e => {
      const b = e.target.closest("button[data-a]"); if (!b) return;
      const c = readCart(); const it = c.find(i => i.sku === b.dataset.s); const r = bySku(b.dataset.s);
      if (b.dataset.a === "rm") c.splice(c.indexOf(it), 1);
      if (b.dataset.a === "inc" && it.qty < r.stock) it.qty++;
      if (b.dataset.a === "dec") { it.qty--; if (it.qty < 1) c.splice(c.indexOf(it), 1); }
      writeCart(c); render();
    });
    render();
  }

  chrome();
  ({ home, records: shop, record, cart }[page] || (() => {}))();
})();
