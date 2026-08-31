/* Logos Clay Studio — vanilla JS, без залежностей */
(function () {
  'use strict';

  /* ---------- фото: якщо файла ще немає, показуємо заглушку ----------
     Завдяки цьому сайт працює без картинок, а щойно кинеш файл
     у assets/img/ — фото з'явиться саме, без правок коду.        */
  document.querySelectorAll('.shot img').forEach(function (img) {
    var shot = img.closest('.shot');
    function markEmpty() { shot.classList.add('is-empty'); }
    if (img.complete) {
      if (!img.naturalWidth) markEmpty();
    } else {
      img.addEventListener('error', markEmpty);
      img.addEventListener('load', function () {
        if (!img.naturalWidth) markEmpty();
      });
    }
  });

  /* ---------- рік у футері ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- хедер при скролі ---------- */
  var header = document.getElementById('header');
  function onScroll() { header.classList.toggle('is-stuck', window.scrollY > 12); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- меню ---------- */
  var burger = document.getElementById('burger');
  var menu = document.getElementById('nav');

  function setMenu(open) {
    menu.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
  }

  burger.addEventListener('click', function () {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });

  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });

  /* ---------- поява секцій ---------- */
  var reveals = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }


  /* ---------- інтерактивна чашка в hero ----------
     Десктоп: нахил за курсором + кут/масштаб/зсув від скролу.
     Телефон і «зменшити рух»: відео просто крутиться саме,
     без обчислень на кожен кадр.                                */
  (function () {
    var mug = document.getElementById('mug');
    if (!mug) return;

    var stage = document.getElementById('mugStage');
    var video = document.getElementById('mugVideo');
    var hero = document.querySelector('.hero');

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;

    // відео автозапускається не завжди — на iOS потрібен play() після готовності
    function tryPlay() {
      var pr = video.play();
      if (pr && pr.catch) pr.catch(function () { /* браузер заборонив — лишиться постер */ });
    }
    if (video.readyState >= 2) tryPlay();
    video.addEventListener('loadeddata', function () {
      tryPlay();
      mug.classList.add('is-ready');
    });

    // браузер ставить відео на паузу у прихованій вкладці й не вмикає назад
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && !reduced) tryPlay();
    });

    if (reduced) { video.pause(); return; }
    if (coarse) return;   // на телефоні лишаємо просте автообертання

    var BASE_SCALE = 1.14;          // той самий, що був у CSS — інакше стирається
    var targetX = 0, targetY = 0;   // нахил від курсора
    var curX = 0, curY = 0;
    var scrollAngle = 0, scrollScale = 1, scrollShift = 0;
    var ticking = false;

    function onMove(e) {
      var r = hero.getBoundingClientRect();
      // -1…1 від центру hero
      var nx = (e.clientX - r.left) / r.width * 2 - 1;
      var ny = (e.clientY - r.top) / r.height * 2 - 1;
      targetY = nx * 12;      // поворот навколо вертикалі
      targetX = -ny * 9;      // нахил уперед/назад
      mug.classList.add('is-touched');
      request();
    }

    function onScroll() {
      var r = hero.getBoundingClientRect();
      // 0 угорі екрана → 1 коли hero майже пішов
      var p = Math.min(1, Math.max(0, -r.top / (r.height || 1)));
      scrollAngle = p * 18;
      scrollScale = 1 - p * 0.18;
      scrollShift = p * 60;
      request();
    }

    function request() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(render);
    }

    function render() {
      ticking = false;
      // згладжування: курсор доганяємо поступово, щоб рух був м'яким
      curX += (targetX - curX) * 0.09;
      curY += (targetY - curY) * 0.09;

      stage.style.transform =
        'translate3d(0,' + scrollShift.toFixed(2) + 'px,0) scale(' + scrollScale.toFixed(3) + ')';
      video.style.transform =
        'scale(' + BASE_SCALE + ') ' +
        'rotateX(' + (curX + scrollAngle * 0.35).toFixed(2) + 'deg) ' +
        'rotateY(' + (curY + scrollAngle).toFixed(2) + 'deg)';

      if (Math.abs(targetX - curX) > 0.05 || Math.abs(targetY - curY) > 0.05) request();
    }

    hero.addEventListener('mousemove', onMove, { passive: true });
    hero.addEventListener('mouseleave', function () { targetX = 0; targetY = 0; request(); });
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();

  /* ---------- лайтбокс ---------- */
  var lightbox = document.getElementById('lightbox');
  var lbBody = document.getElementById('lightboxBody');
  var lbCap = document.getElementById('lightboxCap');
  var lbClose = document.getElementById('lightboxClose');
  var lastFocused = null;

  function openLightbox(btn) {
    var shot = btn.querySelector('.shot');
    if (!shot) return;

    lastFocused = btn;
    lbBody.innerHTML = '';
    lbBody.appendChild(shot.cloneNode(true));
    lbCap.textContent = btn.dataset.title || '';

    lightbox.hidden = false;
    requestAnimationFrame(function () { lightbox.classList.add('is-open'); });
    document.body.style.overflow = 'hidden';
    lbClose.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(function () {
      lightbox.hidden = true;
      lbBody.innerHTML = '';
    }, 300);
    if (lastFocused) lastFocused.focus();
  }

  document.querySelectorAll('.work__btn').forEach(function (btn) {
    btn.addEventListener('click', function () { openLightbox(btn); });
  });

  lbClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!lightbox.hidden) { closeLightbox(); return; }
    if (menu.classList.contains('is-open')) { setMenu(false); burger.focus(); }
  });
})();
