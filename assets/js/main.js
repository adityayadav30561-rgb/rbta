/* RBTA homepage interactions. Everything here is progressive enhancement:
   the page is complete and readable with JavaScript switched off. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasIO = 'IntersectionObserver' in window;

  /* ---- Navigation: solid on scroll, hide on scroll down, mobile menu ---- */
  const nav = $('#nav'), burger = $('.nav__burger'), menu = $('#menu'), fab = $('.fab');
  let lastY = 0, ticking = false;
  const onScroll = () => {
    const y = scrollY;
    nav.classList.toggle('is-stuck', y > 24);
    const open = burger.getAttribute('aria-expanded') === 'true';
    nav.classList.toggle('is-hidden', !open && y > 700 && y > lastY + 4);
    if (y < lastY - 4) nav.classList.remove('is-hidden');
    if (fab) fab.classList.toggle('is-on', y > innerHeight * 0.7);
    lastY = y; ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.hidden = !open;
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (open) nav.classList.remove('is-hidden');
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); burger.focus(); } });
  matchMedia('(min-width:1041px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* current section in the nav */
  if (hasIO) {
    const links = new Map($$('.nav__links a').map((a) => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.removeAttribute('aria-current'));
      const a = links.get(e.target.id); if (a) a.setAttribute('aria-current', 'true');
    }), { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach((s) => spy.observe(s));
  }

  /* ---- Reveal on scroll ---- */
  const groups = ['.sec-head', '.lede', '.proof-a__grid > div', '.founder-a__fig', '.founder-a__rec li', '.founder-a__pillars li',
    '.pl-a__board', '.pl-a__quote', '.tm-a__card', '.tm-a__dis li', '.fac-b__t', '.bh-a__deva', '.bh-a__head', '.bh-a__stats > div',
    '.bh-a__steps li', '.bh-a__goal', '.pt-a__grid li', '.pt-cta', '.ad-a__pitch > *', '.ad-a__form', '.ft-c__big'];
  const targets = $$(groups.join(',')).filter((el) => !el.closest('.hero-a'));
  targets.forEach((el) => {
    el.setAttribute('data-rv', '');
    const sibs = [...el.parentElement.children].filter((c) => c.hasAttribute('data-rv'));
    el.style.setProperty('--i', Math.min(sibs.indexOf(el), 7));
  });
  if (hasIO && !reduce) {
    const rv = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); rv.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    targets.forEach((el) => rv.observe(el));
  } else targets.forEach((el) => el.classList.add('is-in'));

  /* ---- Scoreboard count-up ---- */
  const counters = $$('[data-count]');
  if (hasIO && !reduce) {
    const co = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return; co.unobserve(e.target);
      const el = e.target, end = +el.dataset.count, suf = el.dataset.suffix || '', t0 = performance.now(), dur = 1400;
      const step = (t) => {
        const p = Math.min((t - t0) / dur, 1), v = Math.round(end * (1 - Math.pow(1 - p, 4)));
        el.textContent = v + suf; if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }), { threshold: 0.6 });
    counters.forEach((c) => co.observe(c));
  }

  /* ---- Pathway: the court grows with the active stage ---- */
  const pw = $('.pw-a');
  if (pw) {
    const cards = $$('.pw-a__card', pw);
    const activate = (card) => {
      cards.forEach((c) => c.classList.toggle('is-active', c === card));
      pw.dataset.stage = card.dataset.stage;
    };
    if (hasIO) {
      const stageIO = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) activate(e.target); }),
        { rootMargin: '-46% 0px -46% 0px' });
      cards.forEach((c) => stageIO.observe(c));
      const draw = new IntersectionObserver((es) => es.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-drawn'); draw.disconnect(); }
      }), { threshold: 0.25 });
      draw.observe($('.pw-a__court', pw));
    } else $('.pw-a__court', pw).classList.add('is-drawn');
    cards.forEach((c) => c.addEventListener('focusin', () => activate(c)));
  }

  /* ---- Players board tabs ---- */
  const tabs = $$('.pl-a__tabs [role=tab]');
  tabs.forEach((tab, i) => {
    tab.tabIndex = i ? -1 : 0;
    tab.addEventListener('click', () => tabs.forEach((t) => {
      const on = t === tab; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls')); if (panel) panel.hidden = !on;
    }));
    tab.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; n.focus(); n.click();
    });
  });

  /* ---- Team strip arrows ---- */
  const strip = $('.tm-a__scroll');
  $$('.tm-a__ctrl button').forEach((b) => b.addEventListener('click', () =>
    strip.scrollBy({ left: +b.dataset.dir * Math.min(strip.clientWidth * 0.8, 920), behavior: reduce ? 'auto' : 'smooth' })));

  /* ---- Ambient video: play only while on screen ---- */
  const vids = $$('video[data-autoplay]');
  if (hasIO && !reduce) {
    const vo = new IntersectionObserver((es) => es.forEach((e) => {
      const v = e.target; if (e.isIntersecting) v.play().catch(() => {}); else v.pause();
    }), { threshold: 0.1 });
    vids.forEach((v) => vo.observe(v));
  }

  /* ---- Film dialog ---- */
  const film = $('#film');
  if (film && film.showModal) {
    const fv = $('video', film);
    $$('[data-film]').forEach((b) => b.addEventListener('click', () => { film.showModal(); fv.play().catch(() => {}); }));
    $('[data-film-close]', film).addEventListener('click', () => film.close());
    film.addEventListener('click', (e) => { if (e.target === film) film.close(); });
    film.addEventListener('close', () => fv.pause());
  }

  /* ---- Enquiry form ---- */
  const form = $('.ad-a__form');
  if (form) {
    const who = () => form.elements.who.value;
    const playerRow = $('[data-for="Player or parent"]', form), hint = $('.ad-a__hint', form);
    const submitLabel = $('button[type=submit]', form).firstChild, program = form.elements.program, age = form.elements.age;
    const labels = { 'Player or parent': 'Request a trial ', 'Sponsor or CSR': 'Send partnership enquiry ', 'Coach': 'Ask about certification ' };
    let programTouched = false;
    const sync = () => { playerRow.hidden = who() !== 'Player or parent'; submitLabel.textContent = labels[who()]; if (playerRow.hidden) hint.textContent = ''; };
    $$('input[name=who]', form).forEach((r) => r.addEventListener('change', sync));
    program.addEventListener('change', () => { programTouched = true; });

    const stageFor = (a) => a <= 6 ? 1 : a <= 9 ? 2 : a <= 12 ? 3 : 4;
    age.addEventListener('input', () => {
      const a = +age.value; if (!a || a < 3) { hint.textContent = ''; return; }
      const opt = program.options[stageFor(a)];
      if (!programTouched) program.selectedIndex = stageFor(a);
      hint.textContent = a > 12
        ? 'Players of ' + a + ' usually join Junior Development or above. We place them after an on-court assessment.'
        : 'At ' + a + ', most players start in ' + opt.text.replace(/ \(.*/, '') + '. We confirm on court at the trial.';
    });

    /* any "Enquire about…" link on the page pre-fills the form */
    $$('[data-program]').forEach((a) => a.addEventListener('click', () => {
      const p = a.dataset.program, i = [...program.options].findIndex((o) => o.text.startsWith(p));
      if (i > 0) { form.elements.who.value = 'Player or parent'; program.selectedIndex = i; programTouched = true; }
      else { form.elements.who.value = /tour/i.test(p) ? 'Player or parent' : 'Sponsor or CSR'; form.elements.msg.value = 'Enquiry: ' + p; }
      sync();
    }));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.elements.name, phone = form.elements.phone;
      const badName = !name.value.trim(), badPhone = phone.value.replace(/\D/g, '').length < 8;
      name.classList.toggle('is-bad', badName); phone.classList.toggle('is-bad', badPhone);
      name.setAttribute('aria-invalid', String(badName)); phone.setAttribute('aria-invalid', String(badPhone));
      if (badName || badPhone) {
        hint.textContent = badName ? 'Please tell us your name.' : 'Please add a phone or WhatsApp number we can reach you on.';
        (badName ? name : phone).focus(); return;
      }
      const lines = ['Hello RBTA, I would like to enquire.', 'Name: ' + name.value.trim(), 'Phone: ' + phone.value.trim(), 'Enquiring as: ' + who()];
      if (who() === 'Player or parent') {
        if (age.value) lines.push("Player's age: " + age.value);
        lines.push('Programme: ' + (program.value || 'Please advise'));
      }
      if (form.elements.msg.value.trim()) lines.push('Note: ' + form.elements.msg.value.trim());
      hint.textContent = 'Thank you, ' + name.value.trim().split(' ')[0] + '. WhatsApp is opening with your enquiry ready to send.';
      window.open('https://api.whatsapp.com/send?phone=916364137755&text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
    });
    sync();
  }
})();
