/* ═══════════════════════════════════════════════════════════════════
   PÉONIA Studio — поведінка сторінки.
   Нуль залежностей. Усе, що рухається, вимикається під reduced-motion.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── 1. Двомовність ─────────────────────────────────────────────
     Німецька живе в DOM. Кешуємо її при старті — повернення на DE
     це відновлення з кеша, тож німецький словник не потрібен.       */
  var UK = window.PEONIA_UK || {};
  var origin = new Map();

  function cache() {
    $$("[data-i18n]").forEach(function (el) {
      var attrs = (el.getAttribute("data-i18n-attr") || "").split(",")
                    .map(function (a) { return a.trim(); }).filter(Boolean);
      // Переклад тексту переписує весь вміст вузла. Якщо всередині є вкладені
      // теги, вони зникнуть при першому ж перемиканні — ключ має стояти на них.
      if (!attrs.length && el.children.length) {
        console.warn("[i18n] вкладені теги під data-i18n=\"" + el.getAttribute("data-i18n") +
                     "\" будуть втрачені — перенесіть ключ на дочірні елементи", el);
      }
      origin.set(el, attrs.length
        ? { attrs: attrs, vals: attrs.map(function (a) { return el.getAttribute(a); }) }
        : { text: el.textContent });
    });
  }

  function apply(lang) {
    var uk = lang === "uk";
    $$("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var src = origin.get(el);
      if (!src) return;
      if (src.attrs) {
        src.attrs.forEach(function (a, i) {
          el.setAttribute(a, uk && UK[key] ? UK[key] : src.vals[i]);
        });
      } else {
        el.textContent = uk && UK[key] ? UK[key] : src.text;
      }
    });
    document.documentElement.lang = uk ? "uk" : "de";
    var now = $("#lang-now");
    if (now) now.textContent = uk ? "УК" : "DE";   // показуємо поточну мову
    try { localStorage.setItem("peonia-lang", uk ? "uk" : "de"); } catch (e) {}
  }

  cache();
  var wanted = "uk";
  try {
    var q = new URLSearchParams(location.search).get("lang");
    wanted = q === "uk" || q === "ua" ? "uk"
           : q === "de" ? "de"
           : (localStorage.getItem("peonia-lang") || "uk");
  } catch (e) {}
  apply(wanted);

  var toggle = $("#lang-toggle");
  toggle.addEventListener("click", function () {
    apply(document.documentElement.lang === "uk" ? "de" : "uk");
  });

  /* ── 2. Вступ «губка»: сторінка відкривається витиранням ─────── */
  var sponge = $("#sponge");
  function revealHero() {
    $$(".hero__in > *").forEach(function (el, i) {
      el.style.transition = "opacity .8s var(--ease) " + (i * 80) + "ms, transform .8s var(--ease) " + (i * 80) + "ms";
      el.style.opacity = "1";
      el.style.transform = "none";
    });
  }
  function dropSponge(instant) {
    if (!sponge || !sponge.isConnected) return;
    document.body.style.overflow = "";
    revealHero();
    if (instant) { sponge.remove(); return; }
    sponge.classList.add("is-gone");
    setTimeout(function () { if (sponge.isConnected) sponge.remove(); }, 900);
  }

  if (!sponge || calm || document.visibilityState !== "visible") {
    dropSponge(true);
  } else {
    $$(".hero__in > *").forEach(function (el) {
      el.style.opacity = "0";
      el.style.transform = "translateY(20px)";
    });
    document.body.style.overflow = "hidden";

    var cv = $("#sponge-canvas"), ctx = cv.getContext("2d", { willReadFrequently: false });
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;

    function paintLayer() {
      W = cv.width = Math.round(innerWidth * dpr);
      H = cv.height = Math.round(innerHeight * dpr);
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#184F32";
      ctx.fillRect(0, 0, W, H);
      // великі м'які плями — нерівний, живий шар
      for (var b = 0; b < 26; b++) {
        var bx = Math.random() * W, by = Math.random() * H,
            br = (0.12 + Math.random() * 0.3) * Math.max(W, H);
        var g = ctx.createRadialGradient(bx, by, 0, bx, by, br);
        var light = Math.random() > .5;
        g.addColorStop(0, light ? "rgba(58,116,84,.30)" : "rgba(10,48,29,.32)");
        g.addColorStop(1, "rgba(24,79,50,0)");
        ctx.fillStyle = g;
        ctx.fillRect(bx - br, by - br, br * 2, br * 2);
      }
      // зерно — щоб шар читався як фарба, а не як заливка
      var img = ctx.getImageData(0, 0, W, H), d = img.data;
      for (var i = 0; i < d.length; i += 4) {
        var n = (Math.random() - 0.5) * 26;
        d[i] += n; d[i + 1] += n; d[i + 2] += n;
      }
      ctx.putImageData(img, 0, 0);
    }
    paintLayer();

    // ── стирання ──
    var lastX = null, lastY = null, wiping = false;
    var BR = Math.max(W, H) * 0.045;      // радіус губки

    function stamp(x, y) {
      ctx.globalCompositeOperation = "destination-out";
      var g = ctx.createRadialGradient(x, y, 0, x, y, BR);
      g.addColorStop(0, "rgba(0,0,0,1)");
      g.addColorStop(.62, "rgba(0,0,0,1)");
      g.addColorStop(.86, "rgba(0,0,0,.55)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, BR, 0, 6.2832); ctx.fill();
    }

    function wipe(cx, cy) {
      var r = cv.getBoundingClientRect();
      var x = (cx - r.left) / r.width * cv.width;
      var y = (cy - r.top) / r.height * cv.height;
      if (lastX !== null) {                       // без інтерполяції швидкий рух рве слід
        var dx = x - lastX, dy = y - lastY;
        var steps = Math.ceil(Math.hypot(dx, dy) / (BR * 0.18));
        for (var i = 1; i <= steps; i++) stamp(lastX + dx * i / steps, lastY + dy * i / steps);
      }
      stamp(x, y);
      lastX = x; lastY = y;
      if (!wiping) { wiping = true; sponge.classList.add("is-wiping"); }
    }

    sponge.addEventListener("pointermove", function (e) { wipe(e.clientX, e.clientY); });
    sponge.addEventListener("pointerdown", function (e) { lastX = null; wipe(e.clientX, e.clientY); });
    sponge.addEventListener("pointerleave", function () { lastX = null; });
    sponge.addEventListener("touchmove", function (e) { e.preventDefault(); }, { passive: false });

    // ── скільки вже стерто ──
    var probe = document.createElement("canvas");
    probe.width = 80; probe.height = 45;
    var pctx = probe.getContext("2d", { willReadFrequently: true });
    var checking = setInterval(function () {
      if (!sponge.isConnected) { clearInterval(checking); return; }
      pctx.clearRect(0, 0, 80, 45);
      pctx.drawImage(cv, 0, 0, 80, 45);
      var d = pctx.getImageData(0, 0, 80, 45).data, clear = 0;
      for (var i = 3; i < d.length; i += 4) if (d[i] < 40) clear++;
      if (clear / (80 * 45) >= 0.62) { clearInterval(checking); dropSponge(); }
    }, 220);

    $("#sponge-skip").addEventListener("click", function () { clearInterval(checking); dropSponge(); });
    document.addEventListener("keydown", function (e) {
      if (sponge.isConnected && (e.key === "Escape" || e.key === "Enter")) dropSponge();
    });
    setTimeout(function () { if (sponge.isConnected) dropSponge(); }, 25000);
  }

  /* ── 3. Хедер ─────────────────────────────────────────────────── */
  var head = $("#head");
  var onScroll = function () {
    head.classList.toggle("is-stuck", window.scrollY > 40);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ── 4. Мобільне меню ─────────────────────────────────────────── */
  var burger = $("#burger"), nav = $("#nav");
  function closeNav() {
    nav.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("is-locked");
  }
  burger.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("is-locked", open);
  });
  $$("#nav a").forEach(function (a) { a.addEventListener("click", closeNav); });

  /* ── 5. Поява блоків ──────────────────────────────────────────── */
  // Рейки проявляються цілком: картки за правим краєм екрана
  // спостерігач не бачить, тож поодинці вони лишалися б невидимими.
  var REV = ".sec .micro, .d-l, .lead, .isle, .pcard, .rail," +
            ".tri__panel > *, .pierce__t, .pierce__img, .pierce__sub," +
            ".pair__lg, .pair__col > *, .stats li, .quote," +
            ".close__copy > *, .form, .rail__hint";
  if (!calm && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (rows) {
      rows.forEach(function (row) {
        if (!row.isIntersecting) return;
        var el = row.target;
        var sibs = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
        el.style.transitionDelay = Math.min(sibs, 6) * 80 + "ms";
        el.classList.add("is-in");
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    $$(REV).forEach(function (el) {
      if (el.closest(".hero")) return;      // hero веде «Завіса»
      el.setAttribute("data-rev", "");
      io.observe(el);
    });
  }

  /* ── 6. P4 «Розсип»: перетягування рейки ──────────────────────── */
  $$("[data-rail]").forEach(function (rail) {
    var down = false, startX = 0, startL = 0, moved = 0;
    rail.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      down = true; moved = 0;
      startX = e.clientX; startL = rail.scrollLeft;
      rail.setPointerCapture(e.pointerId);
    });
    rail.addEventListener("pointermove", function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) { rail.classList.add("is-drag"); moved = Math.abs(dx); }
      rail.scrollLeft = startL - dx;
    });
    function up(e) {
      if (!down) return;
      down = false;
      try { rail.releasePointerCapture(e.pointerId); } catch (err) {}
      setTimeout(function () { rail.classList.remove("is-drag"); }, 0);
    }
    rail.addEventListener("pointerup", up);
    rail.addEventListener("pointercancel", up);
    rail.addEventListener("click", function (e) {
      if (moved > 6) { e.preventDefault(); e.stopPropagation(); moved = 0; }
    }, true);
  });

  /* ── 6b. Каталог: рухома стрічка + повноекранний перегляд ─────── */
  var wheel = $("#wheel"), track = $("#wheel-track");
  if (wheel && track) {
    var originals = $$(".wcard", track);
    var count = originals.length;
    originals.forEach(function (c) {          // копія набору для безшовної петлі
      var d = c.cloneNode(true);
      d.setAttribute("tabindex", "-1");
      d.setAttribute("aria-hidden", "true");
      track.appendChild(d);
    });
    var cards = $$(".wcard", track);
    var setW = 0, offset = 0, speed = 0.028, paused = false;
    var dragging = false, dragX = 0, dragStart = 0, moved = 0;

    function measure() {
      setW = 0;
      for (var i = 0; i < count; i++) {
        var r = cards[i].getBoundingClientRect();
        setW += r.width;
      }
      var gap = parseFloat(getComputedStyle(track).gap) || 0;
      setW += gap * count;
    }

    // крайні картки найбільші й найвищі, до центру — менші; дуга з провалом усередині
    function shape() {
      var box = wheel.getBoundingClientRect(), mid = box.width / 2;
      var geo = cards.map(function (c) {
        var r = c.getBoundingClientRect();
        // ширина береться з розкладки (offsetWidth), а не з rect —
        // rect уже враховує scale, і висота почала б розганяти сама себе
        return { c: c, w: c.offsetWidth, d: (r.left + r.width / 2) - (box.left + mid) };
      });
      geo.forEach(function (g) {
        var t = Math.min(1, Math.abs(g.d) / mid);
        var ratio = 1.20 + 0.42 * t;            // висота: центр нижчий, край вищий
        var scale = 0.70 + 0.30 * t;
        var rot   = -(g.d / mid) * 24;
        var ty    = (1 - t) * 22;               // центр трохи опущений — дуга
        g.c.style.setProperty("--ph-h", Math.round(g.w * ratio) + "px");
        g.c.style.transform = "translateY(" + ty.toFixed(1) + "px) rotateY(" +
                              rot.toFixed(2) + "deg) scale(" + scale.toFixed(3) + ")";
        g.c.style.zIndex = String(Math.round(t * 10));
        g.c.classList.toggle("is-near", t > 0.55);
      });
    }

    function render() {
      if (setW > 0) {
        if (offset <= -setW) offset += setW;
        if (offset > 0) offset -= setW;
      }
      track.style.transform = "translate3d(" + offset.toFixed(2) + "px,0,0)";
      shape();
    }

    var last = 0;
    function tick(now) {
      var dt = last ? now - last : 16; last = now;
      if (!paused && !dragging && !calm) offset -= speed * dt;
      render();
      requestAnimationFrame(tick);
    }

    measure(); render();
    requestAnimationFrame(tick);
    window.addEventListener("resize", function () { measure(); render(); });

    wheel.addEventListener("pointerenter", function () { paused = true; });
    wheel.addEventListener("pointerleave", function () { paused = false; });
    track.addEventListener("focusin", function () { paused = true; });
    track.addEventListener("focusout", function () { paused = false; });

    track.addEventListener("pointerdown", function (e) {
      dragging = true; moved = 0; dragX = e.clientX; dragStart = offset;
      wheel.classList.add("is-drag");
      track.setPointerCapture(e.pointerId);
    });
    track.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var dx = e.clientX - dragX;
      moved = Math.max(moved, Math.abs(dx));
      offset = dragStart + dx;
      render();
    });
    function endDrag() { dragging = false; wheel.classList.remove("is-drag"); }
    track.addEventListener("pointerup", endDrag);
    track.addEventListener("pointercancel", endDrag);

    cards.forEach(function (c) {
      c.addEventListener("click", function (e) {
        if (moved > 6) { e.preventDefault(); return; }   // це було перетягування
        openView(parseInt(c.dataset.v, 10));
      });
    });
  }

  /* повноекранний перегляд сорту */
  var vview = $("#vview"), vItems = $$(".vview__item"), vIndex = 0, vOpener = null;
  function showV(i) {
    vIndex = (i + vItems.length) % vItems.length;
    vItems.forEach(function (el, k) { el.hidden = k !== vIndex; });
  }
  function openView(i) {
    if (!vview) return;
    vOpener = document.activeElement;
    showV(i);
    vview.hidden = false;
    document.body.style.overflow = "hidden";
    $("#vview-close").focus();
  }
  function closeView() {
    if (!vview || vview.hidden) return;
    vview.hidden = true;
    document.body.style.overflow = "";
    if (vOpener && vOpener.focus) vOpener.focus();
  }
  if (vview) {
    $("#vview-close").addEventListener("click", closeView);
    $("#vview-prev").addEventListener("click", function () { showV(vIndex - 1); });
    $("#vview-next").addEventListener("click", function () { showV(vIndex + 1); });
    vview.addEventListener("click", function (e) { if (e.target === vview) closeView(); });
    document.addEventListener("keydown", function (e) {
      if (vview.hidden) return;
      if (e.key === "Escape") closeView();
      else if (e.key === "ArrowLeft") showV(vIndex - 1);
      else if (e.key === "ArrowRight") showV(vIndex + 1);
      else if (e.key === "Tab") {                       // фокус лишається всередині
        var f = $$("button, a[href]", vview).filter(function (n) {
          return n.offsetParent !== null;
        });
        if (!f.length) return;
        var first = f[0], lastEl = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
        else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ── 7. Лайтбокс ──────────────────────────────────────────────── */
  var lb = $("#lb"), lbImg = $("#lb-img"), lbCap = $("#lb-cap");
  var shots = $$("#gal-track button"), at = 0, opener = null;

  function show(i) {
    at = (i + shots.length) % shots.length;
    var img = $("img", shots[at]);
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    lbCap.textContent = img.alt;
  }
  function openLb(i, from) {
    opener = from;
    show(i);
    lb.hidden = false;
    document.body.classList.add("is-locked");
    $(".lb__x", lb).focus();
  }
  function closeLb() {
    lb.hidden = true;
    document.body.classList.remove("is-locked");
    if (opener) opener.focus();
  }
  shots.forEach(function (b, i) {
    b.addEventListener("click", function () { openLb(i, b); });
  });
  $$("[data-lb-close]").forEach(function (b) { b.addEventListener("click", closeLb); });
  $("#lb-prev").addEventListener("click", function () { show(at - 1); });
  $("#lb-next").addEventListener("click", function () { show(at + 1); });

  document.addEventListener("keydown", function (e) {
    if (!lb.hidden) {
      if (e.key === "Escape") closeLb();
      if (e.key === "ArrowLeft") show(at - 1);
      if (e.key === "ArrowRight") show(at + 1);
      if (e.key === "Tab") {                        // фокус не тікає з діалогу
        var f = $$("button", $(".lb__box"));
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    } else if (e.key === "Escape" && nav.classList.contains("is-open")) {
      closeNav(); burger.focus();
    }
  });

  var swipeX = 0;
  lb.addEventListener("touchstart", function (e) { swipeX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", function (e) {
    var dx = e.changedTouches[0].clientX - swipeX;
    if (Math.abs(dx) > 50) show(at + (dx < 0 ? 1 : -1));
  }, { passive: true });

  /* ── 8. Форма ─────────────────────────────────────────────────────
     Бекенду немає: перевірка клієнтська, відправки не відбувається.
     Щоб увімкнути — див. README.md, розділ «Форма».                  */
  var form = $("#form"), ok = $("#form-ok");
  var MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function mark(id, bad) {
    var field = $("#" + id).closest(".f");
    field.classList.toggle("is-bad", bad);
    $("#" + id).setAttribute("aria-invalid", bad ? "true" : "false");
    return !bad;
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var good = true;
    good = mark("f-name", !$("#f-name").value.trim()) && good;
    good = mark("f-mail", !MAIL.test($("#f-mail").value.trim())) && good;
    good = mark("f-type", !$("#f-type").value) && good;
    if (!good) {
      var bad = $(".f.is-bad input, .f.is-bad select");
      if (bad) bad.focus();
      ok.hidden = true;
      return;
    }
    ok.hidden = false;
    form.reset();
    ok.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "center" });
  });
  ["f-name", "f-mail", "f-type"].forEach(function (id) {
    var el = $("#" + id);
    el.addEventListener("input", function () { el.closest(".f").classList.remove("is-bad"); });
    el.addEventListener("change", function () { el.closest(".f").classList.remove("is-bad"); });
  });

  /* ── 9. Рік у футері ──────────────────────────────────────────── */
  $("#year").textContent = new Date().getFullYear();
})();
