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
