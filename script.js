(() => {
  'use strict';

  /* ---------- CONFIG ---------- */
  const CONFIG = {
    // Set to a secure endpoint (e.g. a Google Apps Script web app URL) to enable RSVP delivery.
    RSVP_ENDPOINT: 'https://script.google.com/macros/s/AKfycbyQ9TfS0aXGtpU6CGWkZyF-Nl_wZ_cGFI7gDKoO7P6U1U15qxF8kpWZV4ks7qratkLn/exec',
    // Set to e.g. 'assets/music.mp3' once a music file is supplied. The toggle stays hidden until then.
    MUSIC_SRC: 'assets/music.m4a',
    WEDDING_ISO: '2027-01-14T10:30:00+05:30',
    SHARE: { title: 'Nikhil & Anithamol | Wedding Invitation', text: 'You are invited to the wedding of Nikhil & Anithamol on 14 January 2027.' }
  };

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined';
  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  const body = document.body;
  const opening = $('#opening'), ov = $('#openingVideo'), overlay = $('#openingOverlay');
  let openingDone = false, started = false, fallbackTimer;

  /* ---------- HERO INTRO ---------- */
  if (hasGsap && !reduced) gsap.set('.hn,.hero__grace', { opacity: 0, y: 28 });

  function playHero() {
    if (!hasGsap || reduced) return;
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.to('.hero__grace', { opacity: 1, y: 0, duration: 1 })
      .to('.hn', { opacity: 1, y: 0, duration: 1.3, stagger: 0.28 }, '-=0.5');
    gsap.fromTo('.hero__img', { scale: 1.06 }, { scale: 1, duration: 3, ease: 'power2.out' });
  }

  /* ---------- OPENING ---------- */
  function finishOpening() {
    if (openingDone) return;
    openingDone = true;
    clearTimeout(fallbackTimer);
    const done = () => {
      opening.style.display = 'none';
      body.classList.remove('locked');
      ov.pause();
      if (hasGsap && window.ScrollTrigger) ScrollTrigger.refresh();
      playHero();
    };
    window.scrollTo(0, 0);
    if (hasGsap && !reduced) gsap.to(opening, { opacity: 0, duration: 1.4, ease: 'power2.inOut', onComplete: done });
    else done();
  }

  function startOpening() {
    if (started) return;
    started = true;
    if (hasGsap && !reduced) gsap.to(overlay, { opacity: 0, duration: 0.7, onComplete: () => (overlay.style.display = 'none') });
    else overlay.style.display = 'none';
    ov.play().then(() => {
      fallbackTimer = setTimeout(finishOpening, ((ov.duration || 10) * 1000) + 2000);
    }).catch(finishOpening);
  }

  ov.addEventListener('timeupdate', () => {
    if (ov.duration && ov.currentTime >= ov.duration - 1.1) finishOpening();
  });
  ov.addEventListener('ended', finishOpening);
  ov.addEventListener('error', () => { if (started) finishOpening(); });
  $('#openBtn').addEventListener('click', startOpening);
  $('#skipBtn').addEventListener('click', finishOpening);

  function replayOpening() {
    openingDone = false; started = false;
    window.scrollTo(0, 0);
    body.classList.add('locked');
    ov.pause(); ov.currentTime = 0.1;
    overlay.style.display = ''; overlay.style.opacity = 1;
    opening.style.display = ''; opening.style.opacity = 1;
    if (hasGsap && !reduced) gsap.set('.hn,.hero__grace', { opacity: 0, y: 28 });
  }
  $('#replayBtn').addEventListener('click', replayOpening);

  /* ---------- SCROLL ANIMATIONS ---------- */
  if (hasGsap && window.ScrollTrigger && !reduced) {
    $$('[data-reveal]').forEach(el => {
      gsap.from(el, { opacity: 0, y: 34, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    $$('[data-line]').forEach(el => {
      gsap.from(el, { scaleX: 0, opacity: 0, duration: 1.2, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
    });
    $$('[data-parallax]').forEach(el => {
      gsap.fromTo(el, { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    $$('.frame').forEach(el => {
      gsap.from(el, { clipPath: 'inset(8% 8% 8% 8%)', duration: 1.4, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    });
  }

  /* ---------- VIDEO VISIBILITY ---------- */
  const vids = $$('video[data-autovideo]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        const v = e.target;
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      });
    }, { threshold: 0.35 });
    vids.forEach(v => io.observe(v));
  } else vids.forEach(v => v.play().catch(() => {}));

  /* ---------- COUNTDOWN ---------- */
  const target = new Date(CONFIG.WEDDING_ISO).getTime();
  const pad = n => String(n).padStart(2, '0');
  function tick() {
    let diff = Math.max(0, target - Date.now());
    const d = Math.floor(diff / 864e5); diff %= 864e5;
    const h = Math.floor(diff / 36e5); diff %= 36e5;
    const m = Math.floor(diff / 6e4); const s = Math.floor((diff % 6e4) / 1e3);
    $('#cd-d').textContent = d; $('#cd-h').textContent = pad(h);
    $('#cd-m').textContent = pad(m); $('#cd-s').textContent = pad(s);
    if (target - Date.now() <= 0) { $('#countdown').hidden = true; $('#cd-done').hidden = false; clearInterval(timer); }
  }
  const timer = setInterval(tick, 1000); tick();

  /* ---------- CALENDAR (ICS, times converted from IST to UTC) ---------- */
  $('#calBtn').addEventListener('click', () => {
    const ev = [
      ['Engagement & Mylanchy', '20270111T120000Z', '20270111T150000Z', 'Reception at Church Parish Hall follows.'],
      ['Chanthamcharthal', '20270112T123000Z', '20270112T153000Z', 'Family celebration and blessings.'],
      ['Wedding of Nikhil & Anithamol: Holy Matrimony', '20270114T050000Z', '20270114T080000Z', 'Holy Matrimony. Love never fails.']
    ];
    const esc = t => t.replace(/[,;]/g, m => '\\' + m);
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Nikhil and Anithamol//Wedding//EN', 'CALSCALE:GREGORIAN'];
    ev.forEach((e, i) => lines.push('BEGIN:VEVENT', `UID:nikhil-anithamol-${i}@wedding.invite`, 'DTSTAMP:20261120T000000Z',
      `DTSTART:${e[1]}`, `DTEND:${e[2]}`, `SUMMARY:${esc(e[0])}`, `DESCRIPTION:${esc(e[3])}`, 'END:VEVENT'));
    lines.push('END:VCALENDAR');
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'nikhil-anithamol-wedding.ics';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });

  /* ---------- RSVP ---------- */
  const form = $('#rsvpForm'), status = $('#formStatus');
  const setErr = (k, msg) => { const el = $(`[data-err="${k}"]`); if (el) el.textContent = msg || ''; };
  const attVal = () => (form.querySelector('input[name="attendance"]:checked') || {}).value;

  form.addEventListener('change', () => {
    $('#detailFields').classList.toggle('is-hidden', attVal() === 'No');
  });

  function validate() {
    ['name', 'attendance', 'guests', 'events'].forEach(k => setErr(k));
    let ok = true;
    if (form.name.value.trim().length < 2) { setErr('name', 'Please enter your name.'); ok = false; }
    if (!attVal()) { setErr('attendance', 'Please choose Yes or No.'); ok = false; }
    if (attVal() === 'Yes') {
      const g = Number(form.guests.value);
      if (!Number.isInteger(g) || g < 1 || g > 10) { setErr('guests', 'Enter a number between 1 and 10.'); ok = false; }
      if (!$$('input[name="events"]:checked', form).length) { setErr('events', 'Select at least one event.'); ok = false; }
    }
    return ok;
  }

  async function submitRSVP(data) {
    if (!CONFIG.RSVP_ENDPOINT) return { sent: false, reason: 'no-backend' };
    const res = await fetch(CONFIG.RSVP_ENDPOINT, {
      method: 'POST', redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data)
    });
    const text = await res.text();
    let out;
    try { out = JSON.parse(text); }
    catch (_) { throw new Error('Endpoint did not return JSON. Check that the Apps Script is deployed with access set to "Anyone". Response began: ' + text.slice(0, 80)); }
    if (!out.ok) throw new Error('Endpoint rejected the data: ' + (out.error || 'unknown'));
    return { sent: true };
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    status.textContent = '';
    if (form.website.value) return; // honeypot
    if (!validate()) { status.textContent = 'Please fix the highlighted fields.'; return; }
    const yes = attVal() === 'Yes';
    const data = {
      name: form.name.value.trim(), attendance: attVal(),
      guests: yes ? Number(form.guests.value) : 0,
      events: yes ? $$('input[name="events"]:checked', form).map(i => i.value) : [],
      message: form.message.value.trim(), submittedAt: new Date().toISOString()
    };
    try {
      const r = await submitRSVP(data);
      if (!r.sent) { status.textContent = 'RSVP delivery is not connected yet, so your response has not been sent. Please confirm directly with the families.'; return; }
      status.textContent = 'Thank you. Your RSVP has been received.';
      form.reset(); $('#detailFields').classList.remove('is-hidden');
    } catch (err) {
      console.error('RSVP error:', err);
      status.textContent = 'Your RSVP could not be sent. Please try again in a moment.';
    }
  });

  /* ---------- SHARE ---------- */
  $('#shareBtn').addEventListener('click', async () => {
    const out = $('#shareStatus'); const url = location.href.split('#')[0];
    try {
      if (navigator.share) { await navigator.share({ ...CONFIG.SHARE, url }); return; }
      await navigator.clipboard.writeText(url);
      out.textContent = 'Invitation link copied.';
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      const t = document.createElement('textarea'); t.value = url; document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); out.textContent = 'Invitation link copied.'; } catch (_) { out.textContent = 'Copy this link: ' + url; }
      t.remove();
    }
  });

  $('#toTop').addEventListener('click', e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); });

  /* ---------- MUSIC (starts only after a tap: the opening button or the toggle) ---------- */
  const mBtn = $('#musicBtn'), audio = $('#bgMusic');
  function setMusic(on) {
    if (!CONFIG.MUSIC_SRC) return;
    if (on) {
      audio.play().then(() => paint(true)).catch(() => paint(false));
    } else { audio.pause(); paint(false); }
  }
  function paint(on) {
    mBtn.setAttribute('aria-pressed', String(on));
    mBtn.setAttribute('aria-label', on ? 'Pause music' : 'Play music');
  }
  if (CONFIG.MUSIC_SRC) {
    audio.src = CONFIG.MUSIC_SRC; audio.volume = 0.6; mBtn.hidden = false;
    mBtn.addEventListener('click', () => setMusic(audio.paused));
    $('#openBtn').addEventListener('click', () => setMusic(true));
  }
})();
