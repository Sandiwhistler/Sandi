/* SANDI app logic. Products live in products.js. */
(function () {
  "use strict";

  var PRODUCTS = [];
  var INFO = window.SANDI_INFO || {};

  /* Native helpers: use Capacitor plugins inside the app, web fallbacks in a browser */
  var Cap = window.Capacitor;
  var P = (Cap && Cap.Plugins) || {};
  var isNative = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());

  function openUrl(url) {
    if (isNative && P.Browser && /^https:/.test(url)) {
      return P.Browser.open({ url: url, toolbarColor: "#faf4ee", presentationStyle: "popover" });
    }
    window.open(url, "_blank");
  }
  function tap() {
    if (isNative && P.Haptics) P.Haptics.impact({ style: "LIGHT" }).catch(function () {});
  }
  function store(key, value) {
    var json = JSON.stringify(value);
    if (isNative && P.Preferences) return P.Preferences.set({ key: key, value: json });
    try { localStorage.setItem(key, json); } catch (e) {}
    return Promise.resolve();
  }
  function load(key) {
    if (isNative && P.Preferences) {
      return P.Preferences.get({ key: key }).then(function (r) { return r.value ? JSON.parse(r.value) : null; });
    }
    try { return Promise.resolve(JSON.parse(localStorage.getItem(key))); } catch (e) { return Promise.resolve(null); }
  }

  /* Helpers */
  var $ = function (s, el) { return (el || document).querySelector(s); };
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function money(n) { return "$" + (Number(n) % 1 ? Number(n).toFixed(2) : n); }
  function byId(id) { return PRODUCTS.filter(function (p) { return p.id === id; })[0]; }
  function soldOut(p) { return /sold out/i.test(p.tag || ""); }

  var ICON = {
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/></svg>',
    share: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 13v7h14v-7"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>'
  };

  /* Photos in products.json are paths on the website, e.g. assets/img/products/tee.jpg */
  function imageUrl(src) {
    if (!src || /^https?:\/\//.test(src)) return src;
    return (INFO.website || "").replace(/\/$/, "") + "/" + src.replace(/^\//, "");
  }

  function media(p, withHeart) {
    var inner = p.image
      ? '<img src="' + esc(imageUrl(p.image)) + '" alt="' + esc(p.name + ", " + p.colour) + '" loading="lazy">'
      : "";
    var tag = p.tag ? '<span class="media__tag eyebrow">' + esc(p.tag) + "</span>" : "";
    var heart = withHeart
      ? '<button class="heart" type="button" data-save="' + esc(p.id) + '" aria-pressed="' + isSaved(p.id) +
        '" aria-label="Save ' + esc(p.name) + '">' + ICON.heart + "</button>"
      : "";
    return '<div class="media' + (p.image ? "" : " media--placeholder") + '">' + inner + tag + heart + "</div>";
  }

  function card(p) {
    return (
      '<article class="card">' +
        '<div style="position:relative">' +
          '<button class="card__open" type="button" data-open="' + esc(p.id) + '" aria-label="' + esc(p.name) + '">' +
            media(p, false) +
          "</button>" +
          '<button class="heart" type="button" data-save="' + esc(p.id) + '" aria-pressed="' + isSaved(p.id) +
            '" aria-label="Save ' + esc(p.name) + '">' + ICON.heart + "</button>" +
        "</div>" +
        '<h2 class="card__name">' + esc(p.name) + "</h2>" +
        '<p class="card__meta">' + esc(p.colour) + "</p>" +
        '<p class="card__price">' + money(p.price) + "</p>" +
      "</article>"
    );
  }

  /* Saved items */
  var saved = [];
  function isSaved(id) { return saved.indexOf(id) !== -1; }
  function toggleSave(id) {
    tap();
    if (isSaved(id)) saved = saved.filter(function (x) { return x !== id; });
    else { saved.push(id); toast("Saved"); }
    store("saved", saved);
    document.querySelectorAll('[data-save="' + id + '"]').forEach(function (b) {
      b.setAttribute("aria-pressed", isSaved(id));
    });
    updateCount();
    if (current === "saved") render("saved", true);
  }
  function updateCount() {
    var btn = $('[data-tab="saved"]');
    var badge = $(".tabbar__count", btn);
    var n = saved.filter(byId).length;
    if (!n) { if (badge) badge.remove(); return; }
    if (!badge) { badge = document.createElement("span"); badge.className = "tabbar__count"; btn.appendChild(badge); }
    badge.textContent = n;
  }

  /* Views */
  var VIEWS = {
    shop: function () {
      return (
        '<section class="hero">' +
          '<span class="eyebrow">Summer Collection</span>' +
          '<h1 class="display">Made for long summer days</h1>' +
          "<p>Easy, minimal pieces for the beach, the lake and every warm night in between.</p>" +
        "</section>" +
        '<section class="grid" aria-label="Products">' + PRODUCTS.map(card).join("") + "</section>" +
        '<section class="band">' +
          '<span class="eyebrow">Locally made</span>' +
          '<h2 class="display">Easy pieces for sunny days</h2>' +
          "<p>Soft colours, simple shapes and pieces you'll reach for from the first warm day to the last.</p>" +
        "</section>"
      );
    },
    saved: function () {
      var items = saved.map(byId).filter(Boolean);
      if (!items.length) {
        return (
          '<section class="empty">' +
            '<span class="eyebrow">Saved</span>' +
            '<h1 class="display">Nothing saved yet</h1>' +
            "<p>Tap the heart on anything you love and it'll wait for you here.</p>" +
            '<button class="btn" type="button" data-tab-go="shop">Shop the collection</button>' +
          "</section>"
        );
      }
      return (
        '<section class="hero"><span class="eyebrow">Your favourites</span><h1 class="display">Saved</h1></section>' +
        '<section class="grid" aria-label="Saved products">' + items.map(card).join("") + "</section>"
      );
    },
    about: function () {
      return (
        '<section class="hero">' +
          '<span class="eyebrow">About Sandi</span>' +
          '<h1 class="display">Easy pieces for sunny days</h1>' +
          "<p>SANDI is a locally made lifestyle brand built around summer. Made to be lived in, from beach days and lake days to slow evenings in the sun.</p>" +
        "</section>" +
        '<ul class="list eyebrow">' +
          '<li><button type="button" data-link="' + esc(INFO.instagram) + '"><span>Instagram</span>' + ICON.arrow + "</button></li>" +
          '<li><a href="mailto:' + esc(INFO.email) + '"><span>Email us</span>' + ICON.arrow + "</a></li>" +
          '<li><button type="button" data-link="' + esc(INFO.website) + '"><span>Website</span>' + ICON.arrow + "</button></li>" +
          '<li><button type="button" data-link="' + esc(INFO.privacy) + '"><span>Privacy</span>' + ICON.arrow + "</button></li>" +
        "</ul>" +
        '<section class="band">' +
          '<span class="eyebrow">Follow along</span>' +
          '<h2 class="display">@wearesandi</h2>' +
          '<button class="btn" type="button" data-link="' + esc(INFO.instagram) + '">Follow on Instagram</button>' +
        "</section>" +
        '<p class="small">Payments are processed securely by Stripe.<br>© ' + new Date().getFullYear() + " SANDI</p>"
      );
    }
  };

  var current = "shop";
  var view = $("#view");
  function render(name, keepScroll) {
    current = name;
    var y = window.scrollY;
    view.innerHTML = VIEWS[name]();
    document.querySelectorAll("[data-tab]").forEach(function (b) {
      if (b.dataset.tab === name) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });
    if (keepScroll) { window.scrollTo(0, y); return; }
    window.scrollTo(0, 0);
    view.classList.remove("is-entering");
    void view.offsetWidth;
    view.classList.add("is-entering");
  }

  /* Product sheet */
  var sheet = $("#sheet");
  var sheetBody = $("#sheet-body");
  var openId = null;
  var chosenSize = null;
  var lastFocus = null;

  function openProduct(id) {
    var p = byId(id);
    if (!p) return;
    tap();
    openId = id;
    chosenSize = p.sizes && p.sizes.length ? null : "One size";
    lastFocus = document.activeElement;
    sheetBody.innerHTML = detail(p);
    sheet.classList.add("is-open");
    sheet.setAttribute("aria-hidden", "false");
    $(".sheet__panel").scrollTop = 0;
    setTimeout(function () { $(".sheet__close").focus(); }, 50);
  }
  function closeProduct() {
    sheet.classList.remove("is-open");
    sheet.setAttribute("aria-hidden", "true");
    openId = null;
    if (lastFocus) lastFocus.focus();
  }

  function buyLabel(p) {
    if (soldOut(p)) return "Sold out";
    if (!p.checkout) return "Coming soon";
    if (!chosenSize) return "Choose a size";
    return "Buy now · " + money(p.price);
  }

  function detail(p) {
    var sizes = p.sizes && p.sizes.length
      ? '<fieldset class="sizes"><legend class="eyebrow">Size</legend>' +
          p.sizes.map(function (s) {
            return '<button class="size" type="button" data-size="' + esc(s) + '" aria-pressed="false">' + esc(s) + "</button>";
          }).join("") +
        "</fieldset>"
      : "";
    var ready = p.checkout && chosenSize && !soldOut(p);
    return (
      media(p, false) +
      '<div class="detail">' +
        (p.tag ? '<span class="eyebrow" style="color:var(--red)">' + esc(p.tag) + "</span>" : "") +
        '<h2 class="display" id="sheet-title">' + esc(p.name) + "</h2>" +
        '<p class="detail__meta">' + esc(p.colour) + (p.sizes && p.sizes.length ? "" : " · One size") + "</p>" +
        '<p class="detail__price">' + money(p.price) + " " + esc(INFO.currency || "") + "</p>" +
        '<p class="detail__text">' + esc(p.details || "") + "</p>" +
        sizes +
        '<div class="detail__actions">' +
          '<button class="btn btn--solid" type="button" id="buy"' + (ready ? "" : " disabled") + ">" + buyLabel(p) + "</button>" +
          '<button class="icon-btn" type="button" data-save="' + esc(p.id) + '" aria-pressed="' + isSaved(p.id) + '" aria-label="Save">' + ICON.heart + "</button>" +
          '<button class="icon-btn" type="button" id="share" aria-label="Share">' + ICON.share + "</button>" +
        "</div>" +
        '<p class="detail__note">Secure checkout by Stripe. Questions? ' + esc(INFO.email) + "</p>" +
      "</div>"
    );
  }

  function refreshBuy() {
    var p = byId(openId);
    var b = $("#buy");
    if (!p || !b) return;
    b.textContent = buyLabel(p);
    b.disabled = !(p.checkout && chosenSize && !soldOut(p));
  }

  function checkout() {
    var p = byId(openId);
    if (!p || !p.checkout || !chosenSize) return;
    tap();
    var url = p.checkout;
    // Shows the size on the order in your Stripe dashboard (as "client reference ID").
    var ref = (p.id + "_" + chosenSize).replace(/[^A-Za-z0-9_-]/g, "-");
    url += (url.indexOf("?") === -1 ? "?" : "&") + "client_reference_id=" + encodeURIComponent(ref);
    openUrl(url);
  }

  function share() {
    var p = byId(openId);
    if (!p) return;
    var data = { title: p.name + " · SANDI", text: p.name + " from SANDI, made for summer.", url: INFO.website };
    if (isNative && P.Share) return P.Share.share(data).catch(function () {});
    if (navigator.share) return navigator.share(data).catch(function () {});
    toast("Sharing works in the app");
  }

  /* Toast */
  var toastEl = $("#toast");
  var toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-on"); }, 1600);
  }

  /* Events */
  document.addEventListener("click", function (e) {
    var t = e.target.closest("button, a");
    if (!t) { if (e.target.closest("[data-close]")) closeProduct(); return; }
    if (t.dataset.save) { e.stopPropagation(); return toggleSave(t.dataset.save); }
    if (t.dataset.open) return openProduct(t.dataset.open);
    if (t.dataset.tab) { tap(); closeProduct(); return render(t.dataset.tab); }
    if (t.dataset.tabGo) return render(t.dataset.tabGo);
    if (t.dataset.link) return openUrl(t.dataset.link);
    if (t.hasAttribute("data-close")) return closeProduct();
    if (t.dataset.size) {
      tap();
      chosenSize = t.dataset.size;
      sheet.querySelectorAll(".size").forEach(function (b) { b.setAttribute("aria-pressed", b === t); });
      return refreshBuy();
    }
    if (t.id === "buy") return checkout();
    if (t.id === "share") return share();
  });
  document.addEventListener("click", function (e) {
    if (e.target.classList.contains("sheet__backdrop")) closeProduct();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && openId) closeProduct();
  });

  /* Swipe down on the sheet image to close */
  var startY = null;
  sheet.addEventListener("touchstart", function (e) {
    var panel = $(".sheet__panel");
    startY = panel.scrollTop <= 0 ? e.touches[0].clientY : null;
  }, { passive: true });
  sheet.addEventListener("touchend", function (e) {
    if (startY !== null && e.changedTouches[0].clientY - startY > 90) closeProduct();
    startY = null;
  }, { passive: true });

  /* Welcome screen */
  $("#enter").addEventListener("click", function () {
    tap();
    $("#welcome").classList.add("is-gone");
  });

  /* Products: the live list from the website, else the last copy we saw, else the one built into the app */
  function valid(d) {
    return d && Array.isArray(d.products) && d.products.length && d.products.every(function (p) {
      return p && p.id && p.name && p.price != null;
    }) ? d.products : null;
  }
  function fetchLive() {
    var url = INFO.productsUrl + "?t=" + Date.now();
    var req = isNative && P.CapacitorHttp
      ? P.CapacitorHttp.get({ url: url, connectTimeout: 6000, readTimeout: 6000 }).then(function (r) {
          if (r.status !== 200) throw new Error("HTTP " + r.status);
          return typeof r.data === "string" ? JSON.parse(r.data) : r.data;
        })
      : fetch(url, { cache: "no-store" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
    return req.then(function (d) {
      var list = valid(d);
      if (!list) throw new Error("Bad product list");
      store("products", list);
      return list;
    });
  }
  function fetchBundled() {
    return fetch("products.json").then(function (r) { return r.json(); }).then(valid).catch(function () { return null; });
  }
  function setProducts(list) {
    if (!list || JSON.stringify(list) === JSON.stringify(PRODUCTS)) return;
    PRODUCTS = list;
    if (openId && !byId(openId)) closeProduct();
    render(current, true);
    updateCount();
  }

  /* Start */
  Promise.all([load("saved"), load("products").catch(function () { return null; })]).then(function (r) {
    saved = Array.isArray(r[0]) ? r[0] : [];
    var cached = Array.isArray(r[1]) && r[1].length ? r[1] : null;
    return (cached ? Promise.resolve(cached) : fetchBundled()).then(function (list) {
      PRODUCTS = list || [];
      render("shop");
      updateCount();
      if (isNative && P.SplashScreen) P.SplashScreen.hide();
    });
  }).then(function () {
    return fetchLive().then(setProducts);
  }).catch(function () { /* offline: keep what we have */ });

  /* Check for new products whenever the app comes back to the front */
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) fetchLive().then(setProducts).catch(function () {});
  });
})();
