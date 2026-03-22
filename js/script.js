/* ── Toast notification ── */
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('active');
  clearTimeout(showToast._tid);
  showToast._tid = setTimeout(() => t.classList.remove('active'), 4000);
}

/* ── API: use window.apiFetch from config.js only (single source, no recursion) ── */
function apiFetch(path, options) {
  var fn = window.apiFetch;
  if (typeof fn === 'function' && fn !== apiFetch) return fn(path, options);
  var base = (typeof window.getApiBase === 'function' ? window.getApiBase() : (window.API_BASE_URL || 'https://whisperme0-production.up.railway.app')).replace(/\/$/, '');
  var url = base + (path.startsWith('/') ? path : '/' + path);
  return fetch(url, options || {}).then(function (res) {
    return res.json().catch(function () { return {}; }).then(function (data) {
      return { ok: res.ok, status: res.status, data: data };
    });
  }).catch(function (err) {
    console.error('API fetch error:', err);
    return { ok: false, status: 0, data: { error: err.message || 'Network error' } };
  });
}

/* ── Email validation helper ── */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

(function () {
  // ── Build waveform bars
  function makeWave(el, count, maxH, colors, durBase, animated) {
    if (!el) return;
    el.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const b = document.createElement('div');
      const h = Math.max(4, Math.round(Math.sin((i / count) * Math.PI * 2.5 + 1) * maxH * 0.5 + maxH * 0.4 + Math.random() * maxH * 0.2));
      b.style.cssText = `width:3px;border-radius:2px;height:${h}px;background:${Array.isArray(colors) ? colors[i % colors.length] : colors};`;
      if (animated) {
        const style = b.style;
        style.setProperty('--fpdur', (durBase + Math.random() * 0.6) + 's');
        style.setProperty('--fpdel', (i * 0.05) + 's');
        style.setProperty('--fph', h + 'px');
        b.classList.add('aps-fp-bar');
      }
      el.appendChild(b);
    }
  }

  // ── Build S1 waveform
  const s1Wave = document.getElementById('apsS1Wave');
  if (s1Wave) {
    const heights = [10, 16, 24, 20, 30, 22, 14, 28, 18, 24, 20, 16, 28, 22, 14, 20, 26, 18, 12, 22, 28, 16, 22, 10];
    heights.forEach((h, i) => {
      const b = document.createElement('div');
      b.className = 'aps-s1-bar';
      b.style.setProperty('--dur', (1.0 + Math.random() * 0.5) + 's');
      b.style.setProperty('--del', (i * 0.06) + 's');
      b.style.setProperty('--h', h + 'px');
      s1Wave.appendChild(b);
    });
  }

  // ── Build S2 waveform
  const s2Wave = document.getElementById('apsS2Wave');
  if (s2Wave) {
    for (let i = 0; i < 28; i++) {
      const h = Math.max(4, Math.round(14 + Math.random() * 16));
      const b = document.createElement('div');
      b.className = 'aps-s2-bar';
      b.style.setProperty('--dur2', (0.5 + Math.random() * 0.4) + 's');
      b.style.setProperty('--del2', (i * 0.04) + 's');
      b.style.setProperty('--h2', h + 'px');
      s2Wave.appendChild(b);
    }
  }

  // ── Build feed (screen 4)
  const feed4 = document.getElementById('apsFeed4');
  const feedData = [
    { av: 'M', avStyle: 'background:linear-gradient(135deg,#F2C4CE,#D4607A);color:white;', name: 'Maya R.', mood: '💜 Healing', moodColor: 'rgba(139,92,246,0.25)', moodText: '#c4b0f5', color: '#D4607A', likes: '84', cmts: '12' },
    { av: 'A', avStyle: 'background:rgba(255,255,255,0.09);border:1px solid rgba(255,255,255,0.12);color:rgba(245,239,228,0.5);', name: 'Anonymous', mood: '🌙 Reflective', moodColor: 'rgba(201,160,58,0.2)', moodText: '#d4b96a', color: '#8B5CF6', likes: '231', cmts: '28' },
    { av: 'J', avStyle: 'background:linear-gradient(135deg,#B8D4C8,#4A8C6F);color:white;', name: 'James L.', mood: '🔥 Bold', moodColor: 'rgba(232,132,106,0.22)', moodText: '#e8a07a', color: '#E8846A', likes: '47', cmts: '6' },
    { av: 'S', avStyle: 'background:linear-gradient(135deg,#9ABDE0,#4A7FB5);color:white;', name: 'Sofia K.', mood: '✨ Grateful', moodColor: 'rgba(255,213,79,0.18)', moodText: '#f0d070', color: '#60A5FA', likes: '128', cmts: '19' },
  ];
  if (feed4) {
    feedData.forEach((d, idx) => {
      const div = document.createElement('div');
      div.className = 'aps-feed-post';
      div.style.animationDelay = (idx * 0.12) + 's';
      const wid = 'aps-fp-wave-' + idx;
      div.innerHTML = `
          <div class="aps-fp-top">
            <div class="aps-fp-av" style="${d.avStyle}">${d.av}</div>
            <div class="aps-fp-meta">
              <span class="aps-fp-name">${d.name}</span>
            </div>
            <span class="aps-fp-mood" style="background:${d.moodColor};color:${d.moodText};">${d.mood}</span>
          </div>
          <div class="aps-fp-wave" id="${wid}"></div>
          <div class="aps-fp-actions">
            <span class="aps-fp-act">♥ ${d.likes}</span>
            <span class="aps-fp-act">💬 ${d.cmts}</span>
            <span class="aps-fp-act">↩ Reply</span>
          </div>
        `;
      feed4.appendChild(div);
      // Build waveform bars
      const wEl = document.getElementById(wid);
      for (let i = 0; i < 36; i++) {
        const h = Math.max(3, Math.round(Math.sin((i / 36) * Math.PI * 2.2) * 9 + 14 + Math.random() * 8));
        const b = document.createElement('div');
        b.className = 'aps-fp-bar';
        b.style.setProperty('--fpdur', (0.7 + Math.random() * 0.7) + 's');
        b.style.setProperty('--fpdel', (i * 0.035) + 's');
        b.style.setProperty('--fph', h + 'px');
        b.style.background = `linear-gradient(to top, ${d.color}99, ${d.color})`;
        wEl.appendChild(b);
      }
    });
  }

  // ── Screen 5 waveforms
  const s5orig = document.getElementById('apsS5OrigWave');
  if (s5orig) {
    for (let i = 0; i < 26; i++) {
      const h = Math.max(3, Math.round(10 + Math.random() * 10));
      const b = document.createElement('div');
      b.className = 'aps-s5-orig-bar';
      b.style.setProperty('--fpdur', (1.0 + Math.random() * 0.5) + 's');
      b.style.setProperty('--fpdel', (i * 0.05) + 's');
      b.style.setProperty('--fph', h + 'px');
      s5orig.appendChild(b);
    }
  }
  const s5reply = document.getElementById('apsS5ReplyWave');
  if (s5reply) {
    for (let i = 0; i < 24; i++) {
      const h = Math.max(4, Math.round(10 + Math.random() * 16));
      const b = document.createElement('div');
      b.className = 'aps-s5-reply-bar';
      b.style.setProperty('--dur2', (0.5 + Math.random() * 0.4) + 's');
      b.style.setProperty('--del2', (i * 0.05) + 's');
      b.style.setProperty('--h2', h + 'px');
      s5reply.appendChild(b);
    }
  }

  // ── Screen 6 waveform
  const s6wave = document.getElementById('apsS6Wave');
  if (s6wave) {
    for (let i = 0; i < 30; i++) {
      const h = Math.max(3, Math.round(6 + Math.random() * 14));
      const b = document.createElement('div');
      b.className = 'aps-s6-wbar';
      b.style.setProperty('--fpdur', (0.6 + Math.random() * 0.5) + 's');
      b.style.setProperty('--fpdel', (i * 0.04) + 's');
      b.style.setProperty('--fph', h + 'px');
      s6wave.appendChild(b);
    }
  }

  // ── Caption typewriter
  const captionEl = document.getElementById('aps-caption-txt');
  const captionText = "Sometimes you just need to say it out loud...";
  let captionIdx = 0, captionTimer;
  function typeCaption() {
    if (!captionEl) return;
    if (captionIdx < captionText.length) {
      captionEl.innerHTML = captionText.slice(0, captionIdx + 1) + '<span class="aps-cursor"></span>';
      captionIdx++;
      captionTimer = setTimeout(typeCaption, 60 + Math.random() * 40);
    }
  }

  // ── Timer counter
  let timerVal = 12, timerInterval;
  function startTimer() {
    clearInterval(timerInterval);
    timerVal = 12;
    const el = document.getElementById('apsTimer');
    timerInterval = setInterval(() => {
      timerVal++;
      if (el) el.textContent = '0:' + String(timerVal).padStart(2, '0');
      if (timerVal >= 59) clearInterval(timerInterval);
    }, 1000);
  }

  // ── Phone glow colors per step
  const glowColors = {
    1: 'radial-gradient(ellipse, rgba(212,96,122,0.35), rgba(139,92,246,0.2), transparent)',
    2: 'radial-gradient(ellipse, rgba(212,96,122,0.4), rgba(232,132,106,0.15), transparent)',
    3: 'radial-gradient(ellipse, rgba(201,133,58,0.3), rgba(212,96,122,0.15), transparent)',
    4: 'radial-gradient(ellipse, rgba(122,158,135,0.3), rgba(96,165,250,0.15), transparent)',
    5: 'radial-gradient(ellipse, rgba(139,92,246,0.35), rgba(212,96,122,0.15), transparent)',
    6: 'radial-gradient(ellipse, rgba(232,132,106,0.35), rgba(201,133,58,0.15), transparent)',
  };

  // ── Progress bar state
  let apsProgressInterval = null;
  let apsProgressVal = 0;
  const APS_STEP_DURATION = 4500;

  function apsStartProgress(step) {
    clearInterval(apsProgressInterval);
    const el = document.getElementById('aps-prog-' + step);
    if (!el) return;
    apsProgressVal = 0;
    el.style.width = '0%';
    const start = Date.now();
    apsProgressInterval = setInterval(() => {
      const elapsed = Date.now() - start;
      apsProgressVal = Math.min(100, (elapsed / APS_STEP_DURATION) * 100);
      el.style.width = apsProgressVal + '%';
      if (apsProgressVal >= 100) {
        clearInterval(apsProgressInterval);
        // Auto advance
        const next = step < 6 ? step + 1 : 1;
        apsGoTo(next);
      }
    }, 50);
  }

  // ── Main navigation
  let apsCurrent = 1;
  window.apsGoTo = function (step) {
    if (typeof step !== 'number') return;
    // Clear old
    document.querySelectorAll('.aps-step').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.aps-step-progress').forEach(p => p.style.width = '0%');
    document.querySelectorAll('.aps-screen').forEach(s => s.classList.remove('visible'));
    clearInterval(timerInterval);
    clearTimeout(captionTimer);

    // Set new
    const stepEl = document.querySelector('.aps-step[data-step="' + step + '"]');
    const screenEl = document.getElementById('aps-s' + step);
    if (stepEl) stepEl.classList.add('active');
    if (screenEl) screenEl.classList.add('visible');

    // Glow
    const glow = document.getElementById('apsPhoneGlow');
    if (glow) { glow.style.background = glowColors[step]; glow.style.opacity = '1'; }

    // Step-specific actions
    if (step === 2) startTimer();
    if (step === 3) { captionIdx = 0; setTimeout(typeCaption, 400); }

    apsCurrent = step;
    apsStartProgress(step);
  };

  // ── Mood tag clicks
  document.querySelectorAll('.aps-mood-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      document.querySelectorAll('.aps-mood-tag').forEach(t => t.classList.remove('selected'));
      tag.classList.add('selected');
    });
  });

  // ── Start auto-play on first visible
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        apsGoTo(1);
        obs.disconnect();
      }
    });
  }, { threshold: 0.3 });
  const phoneEl = document.getElementById('apsPhone');
  if (phoneEl) obs.observe(phoneEl);

})();

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

/* ── WHY WHISPERME JS ── */
(function initHeroWhisperFeed() {
  const stack = document.getElementById('heroWhisperStack');
  if (!stack) return;

  const stackShell = stack.closest('.hmw-shell');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const whispers = [
    { name: 'Anonymous', location: 'Private • Global', mood: 'Night', timeAgo: '2m ago', duration: '0:31', caption: 'I overthink everything at night...', likes: 96, replies: 7, listeners: 44, size: 'large', tone: 'violet', bars: [10, 14, 18, 24, 28, 24, 18, 14, 12, 18, 22, 16] },
    { name: 'Anaya Kapoor', location: 'Bangalore, India', mood: 'Open', timeAgo: '4m ago', duration: '0:28', caption: 'Kabhi kabhi bas baat karni hoti hai...', likes: 118, replies: 12, listeners: 53, size: 'medium', tone: 'cyan', bars: [12, 16, 20, 24, 22, 18, 14, 12, 14, 18, 20, 16] },
    { name: 'Sofia Ruiz', location: 'Barcelona, Spain', mood: 'Bold', timeAgo: '7m ago', duration: '0:35', caption: 'How I changed my mind about AI...', likes: 96, replies: 7, listeners: 44, size: 'large', tone: 'sky', bars: [11, 14, 17, 23, 27, 23, 17, 14, 12, 16, 21, 15] },
    { name: 'Mason Lee', location: 'Austin, US', mood: 'Soft', timeAgo: '11m ago', duration: '0:27', caption: 'Some days I sound calm. I am not.', likes: 84, replies: 6, listeners: 31, size: 'small', tone: 'amber', bars: [9, 12, 15, 19, 22, 19, 16, 13, 10, 13, 16, 12] },
    { name: 'Anonymous', location: 'Private • India', mood: 'Heavy', timeAgo: '13m ago', duration: '0:42', caption: 'I am tired of pretending I have it all together...', likes: 141, replies: 16, listeners: 67, size: 'large', tone: 'pink', bars: [10, 13, 18, 22, 26, 21, 17, 13, 12, 16, 19, 14] },
    { name: 'Rhea Saini', location: 'Delhi, India', mood: 'Honest', timeAgo: '18m ago', duration: '0:24', caption: 'Aaj bas kisi ne pooch liya hota, tu theek hai?', likes: 102, replies: 9, listeners: 46, size: 'medium', tone: 'violet', bars: [8, 11, 16, 20, 24, 21, 17, 13, 11, 14, 18, 13] },
    { name: 'Noah Carter', location: 'Seattle, US', mood: 'Reflective', timeAgo: '24m ago', duration: '0:37', caption: 'I miss who I was before I started hiding everything...', likes: 127, replies: 11, listeners: 52, size: 'medium', tone: 'cyan', bars: [11, 14, 18, 21, 25, 20, 17, 13, 12, 15, 18, 14] },
    { name: 'Lina Park', location: 'Seoul, Global', mood: 'Light', timeAgo: '31m ago', duration: '0:29', caption: 'It feels lighter when a voice says the truth out loud.', likes: 74, replies: 5, listeners: 29, size: 'small', tone: 'sky', bars: [9, 12, 16, 21, 24, 19, 15, 12, 10, 14, 18, 13] },
    { name: 'Anonymous', location: 'Private • Global', mood: 'Quiet', timeAgo: '46m ago', duration: '0:33', caption: 'I keep saving drafts of things I never send...', likes: 89, replies: 8, listeners: 37, size: 'medium', tone: 'pink', bars: [10, 14, 18, 23, 27, 23, 18, 14, 12, 17, 21, 15] },
    { name: 'Kabir Mehta', location: 'Mumbai, India', mood: 'Restless', timeAgo: '1h ago', duration: '0:39', caption: 'Raat ko sab thoughts aur zyada loud ho jaate hain...', likes: 134, replies: 13, listeners: 61, size: 'large', tone: 'violet', bars: [11, 15, 19, 24, 28, 24, 19, 15, 13, 17, 22, 16] },
  ];
  const palettes = {
    violet: {
      accent: 'rgba(230, 223, 255, 0.9)',
      soft: 'rgba(139, 92, 246, 0.09)',
      waveStart: 'rgba(167, 190, 255, 0.8)',
      waveMid: 'rgba(96, 165, 250, 0.84)',
      waveEnd: 'rgba(94, 234, 212, 0.8)',
    },
    cyan: {
      accent: 'rgba(216, 244, 255, 0.9)',
      soft: 'rgba(34, 211, 238, 0.08)',
      waveStart: 'rgba(130, 197, 255, 0.8)',
      waveMid: 'rgba(82, 216, 255, 0.84)',
      waveEnd: 'rgba(94, 234, 212, 0.78)',
    },
    pink: {
      accent: 'rgba(255, 226, 236, 0.9)',
      soft: 'rgba(244, 114, 182, 0.08)',
      waveStart: 'rgba(251, 146, 196, 0.78)',
      waveMid: 'rgba(147, 197, 253, 0.82)',
      waveEnd: 'rgba(110, 231, 183, 0.76)',
    },
    amber: {
      accent: 'rgba(255, 239, 214, 0.9)',
      soft: 'rgba(245, 158, 11, 0.08)',
      waveStart: 'rgba(251, 191, 36, 0.78)',
      waveMid: 'rgba(125, 211, 252, 0.8)',
      waveEnd: 'rgba(94, 234, 212, 0.76)',
    },
    sky: {
      accent: 'rgba(224, 236, 255, 0.9)',
      soft: 'rgba(96, 165, 250, 0.08)',
      waveStart: 'rgba(147, 197, 253, 0.8)',
      waveMid: 'rgba(110, 168, 255, 0.84)',
      waveEnd: 'rgba(125, 211, 252, 0.78)',
    }
  };
  const roleAdjust = {
    active: 0,
    back1: -1,
    back2: -3,
    back3: -5,
    incoming: 0,
    exit: -6
  };
  let currentIndex = 3;
  let cardPool = [];
  let cycleTimer = null;
  let recycleTimer = null;
  let resizeTimer = null;
  let paused = false;
  let animating = false;

  function whisperAt(index) {
    const len = whispers.length;
    return whispers[((index % len) + len) % len];
  }

  function getSlots() {
    if (window.matchMedia('(max-width: 560px)').matches) {
      return {
        active: { y: 156, scale: 1, rotate: '0deg', opacity: 1, blur: '0px', z: 5 },
        back1: { y: 108, scale: 0.988, rotate: '-0.65deg', opacity: 0.68, blur: '0.12px', z: 4 },
        back2: { y: 64, scale: 0.976, rotate: '0.45deg', opacity: 0.4, blur: '0.8px', z: 3 },
        back3: { y: 22, scale: 0.966, rotate: '-0.32deg', opacity: 0.22, blur: '1.5px', z: 2 },
        incoming: { y: 246, scale: 0.986, rotate: '0.3deg', opacity: 0, blur: '0px', z: 6 },
        exit: { y: -42, scale: 0.952, rotate: '-0.4deg', opacity: 0, blur: '1.8px', z: 1 },
      };
    }

    return {
      active: { y: 204, scale: 1, rotate: '0deg', opacity: 1, blur: '0px', z: 5 },
      back1: { y: 148, scale: 0.988, rotate: '-0.72deg', opacity: 0.68, blur: '0.12px', z: 4 },
      back2: { y: 96, scale: 0.976, rotate: '0.48deg', opacity: 0.42, blur: '0.75px', z: 3 },
      back3: { y: 46, scale: 0.966, rotate: '-0.36deg', opacity: 0.22, blur: '1.4px', z: 2 },
      incoming: { y: 302, scale: 0.986, rotate: '0.35deg', opacity: 0, blur: '0px', z: 6 },
      exit: { y: -42, scale: 0.952, rotate: '-0.42deg', opacity: 0, blur: '1.8px', z: 1 },
    };
  }

  function computeWidth(size, role) {
    const base = size === 'small' ? 88 : size === 'medium' ? 92 : 95;
    return Math.max(80, base + (roleAdjust[role] || 0)) + '%';
  }

  function getInitials(name) {
    return String(name || 'Whisper')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(function (part) { return part.charAt(0).toUpperCase(); })
      .join('') || 'WM';
  }

  function createCard() {
    const card = document.createElement('article');
    card.className = 'hmw-card';
    card.innerHTML = '<div class="hmw-card-head"><div class="hmw-author"><div class="hmw-avatar"></div><div class="hmw-author-meta"><div class="hmw-author-name"></div><div class="hmw-author-sub"></div></div></div><span class="hmw-mood-pill"></span></div><p class="hmw-card-copy"></p><div class="hmw-wave-row"><span class="hmw-play" aria-hidden="true"></span><div class="hmw-wave-track"><div class="hmw-wave"></div></div><span class="hmw-card-time"></span></div><div class="hmw-card-footer"><span class="hmw-stat hmw-stat-heart"><span class="hmw-stat-icon">&#9829;</span><span class="hmw-like-count"></span></span><span class="hmw-stat hmw-stat-replies"><span class="hmw-stat-icon">&#9675;</span><span class="hmw-reply-count"></span></span><span class="hmw-stat hmw-stat-listening"><span class="hmw-live-dot"></span><span class="hmw-listener-count"></span> listening</span></div>';
    return card;
  }

  function buildWaveHeights(bars) {
    const source = Array.isArray(bars) && bars.length ? bars : [10, 12, 14, 18, 20, 18, 14, 12];
    const targetCount = window.matchMedia('(max-width: 560px)').matches ? 25 : 31;
    const result = [];

    function normalizeHeight(value) {
      return Math.max(4, Math.min(18, Math.round(value * 0.7))) + 'px';
    }

    if (source.length === 1) {
      for (let i = 0; i < targetCount; i += 1) {
        result.push(normalizeHeight(source[0]));
      }
      return result;
    }

    for (let i = 0; i < targetCount; i += 1) {
      const position = (i / (targetCount - 1)) * (source.length - 1);
      const lowerIndex = Math.floor(position);
      const upperIndex = Math.min(source.length - 1, lowerIndex + 1);
      const progress = position - lowerIndex;
      const blended = source[lowerIndex] + ((source[upperIndex] - source[lowerIndex]) * progress);
      result.push(normalizeHeight(blended));
    }

    return result;
  }

  function populateWave(waveEl, bars) {
    waveEl.innerHTML = '';
    const heights = buildWaveHeights(bars);
    waveEl.style.setProperty('--wave-bars', String(heights.length));
    heights.forEach(function (height, index) {
      const bar = document.createElement('span');
      bar.className = 'hmw-wave-bar';
      bar.style.setProperty('--wave-height', height);
      bar.style.setProperty('--wave-delay', (index * 0.08) + 's');
      waveEl.appendChild(bar);
    });
  }

  function updateCard(card, whisper) {
    const palette = palettes[whisper.tone] || palettes.violet;
    const avatar = card.querySelector('.hmw-avatar');
    const name = card.querySelector('.hmw-author-name');
    const sub = card.querySelector('.hmw-author-sub');
    const pill = card.querySelector('.hmw-mood-pill');
    const time = card.querySelector('.hmw-card-time');
    const copy = card.querySelector('.hmw-card-copy');
    const wave = card.querySelector('.hmw-wave');
    const likes = card.querySelector('.hmw-like-count');
    const replies = card.querySelector('.hmw-reply-count');
    const listeners = card.querySelector('.hmw-listener-count');

    card.__whisper = whisper;
    card.dataset.size = whisper.size;
    avatar.textContent = getInitials(whisper.name);
    name.textContent = whisper.name;
    sub.textContent = whisper.location + ' • ' + whisper.timeAgo;
    pill.textContent = whisper.mood;
    time.textContent = whisper.duration;
    copy.textContent = whisper.caption;
    likes.textContent = whisper.likes;
    replies.textContent = whisper.replies;
    listeners.textContent = whisper.listeners;
    card.style.setProperty('--whisper-accent', palette.accent);
    card.style.setProperty('--whisper-accent-soft', palette.soft);
    card.style.setProperty('--whisper-wave-start', palette.waveStart);
    card.style.setProperty('--whisper-wave-mid', palette.waveMid);
    card.style.setProperty('--whisper-wave-end', palette.waveEnd);
    card.style.setProperty('--whisper-avatar-start', palette.waveStart);
    card.style.setProperty('--whisper-avatar-end', palette.waveMid);
    populateWave(wave, whisper.bars);
  }

  function applySlot(card, role, instant) {
    const slots = getSlots();
    const slot = slots[role];
    if (!slot) return;

    if (instant) card.classList.add('no-transition');
    else card.classList.remove('no-transition');

    card.style.setProperty('--stack-y', slot.y + 'px');
    card.style.setProperty('--stack-scale', String(slot.scale));
    card.style.setProperty('--stack-hover-scale', String(role === 'active' ? slot.scale + 0.02 : slot.scale + 0.012));
    card.style.setProperty('--stack-rotate', slot.rotate);
    card.style.setProperty('--stack-opacity', String(slot.opacity));
    card.style.setProperty('--stack-blur', slot.blur);
    card.style.setProperty('--stack-z', String(slot.z));
    card.style.setProperty('--card-width', computeWidth(card.dataset.size, role));
    card.style.setProperty('--float-delay', (role === 'active' ? 0 : role === 'back1' ? 0.6 : role === 'back2' ? 1.1 : 1.6) + 's');
    card.classList.toggle('is-active', role === 'active');
    card.classList.toggle('is-muted', role === 'back3' || role === 'exit');
  }

  function syncCurrentState(instant) {
    const roles = ['active', 'back1', 'back2', 'back3', 'incoming'];
    cardPool.forEach(function (card, index) {
      applySlot(card, roles[index], instant);
    });
    if (instant) {
      cardPool.forEach(function (card) {
        card.getBoundingClientRect();
        card.classList.remove('no-transition');
      });
    }
  }

  function clearTimers() {
    clearTimeout(cycleTimer);
    clearTimeout(recycleTimer);
    cycleTimer = null;
    recycleTimer = null;
  }

  function scheduleNext(delay) {
    clearTimeout(cycleTimer);
    if (prefersReducedMotion.matches || paused || document.hidden) return;
    cycleTimer = setTimeout(runCycle, delay || 2000);
  }

  function runCycle() {
    if (animating || prefersReducedMotion.matches || paused || document.hidden) {
      scheduleNext(2000);
      return;
    }

    animating = true;
    scheduleNext(2000);

    const active = cardPool[0];
    const back1 = cardPool[1];
    const back2 = cardPool[2];
    const back3 = cardPool[3];
    const incoming = cardPool[4];

    applySlot(incoming, 'active', false);
    applySlot(active, 'back1', false);
    applySlot(back1, 'back2', false);
    applySlot(back2, 'back3', false);
    applySlot(back3, 'exit', false);

    currentIndex = (currentIndex + 1) % whispers.length;

    recycleTimer = setTimeout(function () {
      updateCard(back3, whisperAt(currentIndex + 1));
      applySlot(back3, 'incoming', true);
      back3.getBoundingClientRect();
      back3.classList.remove('no-transition');
      cardPool = [incoming, active, back1, back2, back3];
      animating = false;
    }, 940);
  }

  function setPaused(nextValue) {
    paused = nextValue;
    if (paused) {
      clearTimeout(cycleTimer);
      return;
    }
    if (!animating) scheduleNext(1600);
  }

  function handleResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      cardPool.forEach(function (card) {
        if (card && card.__whisper) updateCard(card, card.__whisper);
      });
      syncCurrentState(true);
    }, 120);
  }

  cardPool = [createCard(), createCard(), createCard(), createCard(), createCard()];

  updateCard(cardPool[0], whisperAt(currentIndex));
  updateCard(cardPool[1], whisperAt(currentIndex - 1));
  updateCard(cardPool[2], whisperAt(currentIndex - 2));
  updateCard(cardPool[3], whisperAt(currentIndex - 3));
  updateCard(cardPool[4], whisperAt(currentIndex + 1));

  cardPool.forEach(function (card) {
    stack.appendChild(card);
  });

  syncCurrentState(true);

  if (stackShell) {
    stackShell.addEventListener('pointerenter', function () { setPaused(true); });
    stackShell.addEventListener('pointerleave', function () { setPaused(false); });
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) setPaused(true);
    else setPaused(false);
  });

  if (typeof prefersReducedMotion.addEventListener === 'function') {
    prefersReducedMotion.addEventListener('change', function () {
      if (prefersReducedMotion.matches) clearTimers();
      else if (!animating) scheduleNext(1600);
    });
  }

  window.addEventListener('resize', handleResize, { passive: true });
  if (!prefersReducedMotion.matches) scheduleNext(2000);
})();

(function initWW() {
  // Build waveform for card 1
  const wvEl = document.getElementById('wwWave1');
  if (wvEl) {
    const hs = [8, 14, 24, 40, 56, 48, 34, 22, 14, 20, 34, 50, 62, 54, 38, 22, 16, 24, 40, 56, 64, 56, 40, 24, 16, 22, 38, 54, 48, 32, 20, 12, 10, 18, 30, 44];
    hs.forEach((h, i) => {
      const b = document.createElement('div');
      b.className = 'ww-wv-bar';
      b.style.setProperty('--wb-h', h + 'px');
      b.style.setProperty('--wb-dur', (1.1 + Math.random() * 0.8) + 's');
      b.style.setProperty('--wb-del', (i * 0.04) + 's');
      wvEl.appendChild(b);
    });
  }

  // Scroll reveal for ww-cards
  const cards = document.querySelectorAll('.ww-card');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  cards.forEach(card => {
    card.style.animationPlayState = 'paused';
    observer.observe(card);
  });
})();

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

/* Build TVV waveform */
(function () {
  function buildTvvWave() {
    const el = document.getElementById('tvvWaveform');
    if (!el || el.dataset.built) return;
    el.dataset.built = 'yes';
    const heights = [8, 14, 24, 40, 56, 48, 34, 20, 12, 18, 32, 50, 62, 54, 38, 22, 14, 20, 36, 54, 66, 58, 42, 26, 16, 12, 22, 38, 54, 46, 32, 18, 10, 16, 28, 44, 58, 50, 36, 20];
    heights.forEach((h, i) => {
      const b = document.createElement('div'); b.className = 'tvv-wv-bar';
      b.style.setProperty('--h', h + 'px');
      b.style.setProperty('--dur', (1.1 + Math.random() * 0.8) + 's');
      b.style.setProperty('--del', (i * 0.04) + 's');
      el.appendChild(b);
    });
  }
  // Build on page load and also when home page section enters view
  if (document.readyState === 'complete') buildTvvWave();
  else document.addEventListener('DOMContentLoaded', buildTvvWave);
  // Also try after a delay in case DOM isn't ready
  setTimeout(buildTvvWave, 500);
})();

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

/* Build How-It-Works visuals */
function buildHiwVisuals() {
  // Recording waveform
  const rw = document.getElementById('hiw-rec-wave');
  if (rw && !rw.dataset.built) {
    rw.dataset.built = 'yes';
    [8, 14, 22, 36, 50, 44, 30, 18, 12, 22, 38, 54, 46, 30, 16, 10, 18, 32, 48, 56, 44, 28].forEach((h, i) => {
      const b = document.createElement('div'); b.className = 'v-rec-bar';
      b.style.setProperty('--h', h + 'px');
      b.style.setProperty('--dur', (1.1 + Math.random() * 0.7) + 's');
      b.style.setProperty('--del', (i * 0.05) + 's');
      rw.appendChild(b);
    });
  }
  // Share waveforms
  [[8, 12, 18, 24, 18, 12, 8, 10, 16, 20, 14, 8], [6, 10, 16, 22, 16, 10, 6, 8, 14, 18]].forEach((hs, wi) => {
    const el = document.getElementById('hiw-share-wave' + (wi + 1));
    if (el && !el.dataset.built) {
      el.dataset.built = 'yes';
      hs.forEach(h => {
        const b = document.createElement('div'); b.className = 'v-share-bar';
        b.style.height = h + 'px'; el.appendChild(b);
      });
    }
  });
  // Avatar speaking wave
  const aw = document.getElementById('hiw-av-wave1');
  if (aw && !aw.dataset.built) {
    aw.dataset.built = 'yes';
    [3, 6, 8, 6, 3, 5, 7, 5].forEach((h, i) => {
      const b = document.createElement('div'); b.className = 'v-connect-av-bar';
      b.style.setProperty('--h', h + 'px');
      b.style.setProperty('--dur', (0.6 + Math.random() * 0.4) + 's');
      b.style.setProperty('--del', (i * 0.07) + 's');
      aw.appendChild(b);
    });
  }
}
// Hook into showPage
const _origShowPage = showPage;
function showPage(name) {
  _origShowPage(name);
  if (name === 'how-it-works') setTimeout(buildHiwVisuals, 120);
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

/* ── APP PREVIEW TAB SWITCHER ── */
const APV_TABS = ['feed', 'rooms', 'explore', 'chat', 'circles'];
function switchApvTab(tab) {
  APV_TABS.forEach(t => {
    const btn = document.getElementById('apvTab' + t.charAt(0).toUpperCase() + t.slice(1));
    const content = document.getElementById('apvTabContent-' + t);
    if (btn) btn.className = 'apv-tab-btn ' + (t === tab ? 'on' : 'off');
    if (content) {
      content.classList.toggle('active', t === tab);
    }
  });
  if (tab === 'feed') buildApvFeed();
  if (tab === 'rooms') buildApvRoomWaves();
  if (tab === 'chat') buildApvChat();
}

/* Build voice feed cards */
const APV_FEED_DATA = [
  { name: 'Maya R.', letter: 'M', bg: 'linear-gradient(135deg,#F2C4CE,#D4607A)', anon: false, mood: '💜 Healing', dur: '0:47', waves: [8, 14, 22, 36, 50, 44, 30, 18, 12, 22, 38, 54, 46, 30, 16, 10, 18, 32] },
  { name: 'Anonymous', letter: '?', bg: 'rgba(255,255,255,0.1)', anon: true, mood: '🌙 Reflective', dur: '1:12', waves: [10, 18, 28, 42, 54, 46, 32, 20, 14, 24, 40, 56, 48, 32, 18, 12, 22, 36] },
  { name: 'James L.', letter: 'J', bg: 'linear-gradient(135deg,#B8D4C8,#4A8C6F)', anon: false, mood: '🔥 Bold', dur: '0:38', waves: [6, 12, 20, 32, 46, 40, 26, 16, 10, 18, 32, 48, 42, 26, 14, 8, 16, 28] },
  { name: 'Sofia K.', letter: 'S', bg: 'linear-gradient(135deg,#93C5FD,#3B82F6)', anon: false, mood: '✨ Grateful', dur: '1:05', waves: [12, 20, 30, 44, 58, 50, 36, 22, 14, 26, 42, 58, 50, 34, 18, 10, 20, 34] },
];
let apvPlayingId = null;
function buildApvFeed() {
  const scroll = document.getElementById('apvFeedScroll');
  if (!scroll || scroll.dataset.built) return;
  scroll.dataset.built = 'yes';
  APV_FEED_DATA.forEach((post, idx) => {
    const card = document.createElement('div');
    card.className = 'apv-vcard';
    card.style.setProperty('--card-glow', 'linear-gradient(135deg,rgba(212,96,122,0.05),transparent)');
    card.id = 'apv-vcard-' + idx;
    card.innerHTML = `
      <div class="apv-vcard-top">
        <div class="apv-vav" style="background:${post.bg};color:${post.anon ? 'rgba(245,239,228,0.5)' : 'white'};">${post.anon ? '🫧' : post.letter}</div>
        <div><div class="apv-vname">${post.name}</div></div>
        <div class="apv-vmood" style="background:rgba(212,96,122,0.1);color:var(--petal);border:1px solid rgba(212,96,122,0.2);">${post.mood}</div>
      </div>
      <div class="apv-vwave" id="apv-vwave-${idx}"></div>
      <div class="apv-vcard-bottom">
        <button class="apv-vplay" id="apv-vplay-${idx}" onclick="apvTogglePlay(${idx},event)">▶</button>
        <span class="apv-vdur">${post.dur}</span>
        <div class="apv-vreacts"><span class="apv-vreact">❤️ ${12 + idx * 7}</span><span class="apv-vreact">💬 ${3 + idx * 2}</span></div>
      </div>
      ${post.anon ? '<div class="apv-vanon">Shared anonymously</div>' : ''}
    `;
    // Build wave bars
    scroll.appendChild(card);
    const waveEl = document.getElementById('apv-vwave-' + idx);
    post.waves.forEach((h, i) => {
      const b = document.createElement('div'); b.className = 'apv-vbar';
      b.style.height = h + 'px';
      b.style.setProperty('--h', h + 'px');
      b.style.setProperty('--dur', (0.7 + Math.random() * 0.5) + 's');
      b.style.setProperty('--del', (i * 0.04) + 's');
      waveEl.appendChild(b);
    });
  });
}
let apvPlayIntervals = {};
function apvTogglePlay(idx, e) {
  e.stopPropagation();
  const card = document.getElementById('apv-vcard-' + idx);
  const btn = document.getElementById('apv-vplay-' + idx);
  if (apvPlayingId === idx) {
    clearInterval(apvPlayIntervals[idx]);
    card.classList.remove('playing');
    btn.textContent = '▶';
    apvPlayingId = null;
  } else {
    if (apvPlayingId !== null) {
      const prevCard = document.getElementById('apv-vcard-' + apvPlayingId);
      const prevBtn = document.getElementById('apv-vplay-' + apvPlayingId);
      if (prevCard) prevCard.classList.remove('playing');
      if (prevBtn) prevBtn.textContent = '▶';
      clearInterval(apvPlayIntervals[apvPlayingId]);
    }
    card.classList.add('playing');
    btn.textContent = '⏸';
    apvPlayingId = idx;
    setTimeout(() => {
      card.classList.remove('playing');
      btn.textContent = '▶';
      apvPlayingId = null;
    }, 5000);
  }
}

/* Room waveforms */
function buildApvRoomWaves() {
  [[8, 14, 22, 36, 50, 44, 30, 18, 12], [10, 18, 30, 46, 38, 24, 14, 22, 36], [6, 12, 20, 32, 44, 36, 22, 14, 20]].forEach((hs, ri) => {
    const el = document.getElementById('apv-rwave-' + (ri + 1));
    if (!el || el.dataset.built) return;
    el.dataset.built = 'yes';
    const colors = ['linear-gradient(to top,#FF4757,rgba(255,71,87,0.4))', 'linear-gradient(to top,var(--sage),rgba(122,158,135,0.4))', 'linear-gradient(to top,var(--amber),rgba(201,133,58,0.4))'];
    hs.forEach((h, i) => {
      const b = document.createElement('div'); b.className = 'apv-room-bar';
      b.style.setProperty('--h', h + 'px');
      b.style.setProperty('--dur', (0.6 + Math.random() * 0.5) + 's');
      b.style.setProperty('--del', (i * 0.06) + 's');
      b.style.height = h + 'px';
      b.style.background = colors[ri];
      el.appendChild(b);
    });
  });
}

/* Chat messages */
const APV_CHAT_MSGS = [
  { mine: false, bg: 'linear-gradient(135deg,#F2C4CE,#D4607A)', letter: 'M', bubbleBg: 'rgba(255,255,255,0.06)', waves: [6, 10, 16, 22, 18, 12, 8, 10, 16, 20], dur: '0:23' },
  { mine: true, bg: '', letter: '', bubbleBg: '', waves: [8, 12, 18, 24, 20, 14, 10, 12, 18, 22], dur: '0:31' },
  { mine: false, bg: 'linear-gradient(135deg,#F2C4CE,#D4607A)', letter: 'M', bubbleBg: 'rgba(255,255,255,0.06)', waves: [5, 9, 15, 21, 17, 11, 7, 9, 15, 19], dur: '0:18' },
  { mine: true, bg: '', letter: '', bubbleBg: '', waves: [7, 11, 17, 23, 19, 13, 9, 11, 17, 21], dur: '0:44' },
];
function buildApvChat() {
  const container = document.getElementById('apvChatMsgs');
  if (!container || container.dataset.built) return;
  container.dataset.built = 'yes';
  APV_CHAT_MSGS.forEach((msg, mi) => {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'apv-chat-msg' + (msg.mine ? ' mine' : '');
    const bubble = document.createElement('div'); bubble.className = 'apv-chat-bubble';
    bubble.style.background = msg.mine ? '' : 'rgba(255,255,255,0.06)';
    bubble.style.border = msg.mine ? '' : '1px solid rgba(255,255,255,0.08)';
    const waveDiv = document.createElement('div'); waveDiv.className = 'apv-chat-wave';
    msg.waves.forEach((h, i) => {
      const b = document.createElement('div'); b.className = 'apv-chat-bar';
      b.style.setProperty('--h', h + 'px');
      b.style.setProperty('--dur', (0.7 + Math.random() * 0.5) + 's');
      b.style.setProperty('--del', (i * 0.05) + 's');
      b.style.height = h + 'px';
      b.style.background = msg.mine ? 'rgba(255,255,255,0.7)' : 'linear-gradient(to top,var(--rose),rgba(242,196,206,0.5))';
      waveDiv.appendChild(b);
    });
    const durDiv = document.createElement('div'); durDiv.className = 'apv-chat-dur'; durDiv.textContent = msg.dur;
    bubble.appendChild(waveDiv); bubble.appendChild(durDiv);
    if (!msg.mine) {
      const av = document.createElement('div'); av.className = 'apv-chat-msg-av';
      av.style.background = msg.bg; av.style.color = 'white'; av.textContent = msg.letter;
      msgDiv.appendChild(av);
    }
    msgDiv.appendChild(bubble);
    container.appendChild(msgDiv);
  });
}

// Initialize feed on first load of this page (DOM ready safety)
function onDOMReady() {
  try {
    const navLogoImg = document.querySelector('.nav-logo-mark img');
    if (navLogoImg && navLogoImg.src && navLogoImg.src.startsWith('data:image/')) {
      navLogoImg.src = 'assets/logo-mark.svg';
    }
    var apvFeed = document.getElementById('apvFeedScroll');
    if (document.getElementById('page-app-preview') && apvFeed && !apvFeed.dataset.built) {
      buildApvFeed();
    }
  } catch (e) {
    console.error('[WM] DOM ready init error:', e);
  }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', onDOMReady);
} else {
  onDOMReady();
}

const perfLite = (() => {
  const lowCores = (navigator.hardwareConcurrency || 8) <= 4;
  const lowMemory = (navigator.deviceMemory || 8) <= 4;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const smallScreen = window.matchMedia('(max-width: 1024px)').matches;
  return lowCores || lowMemory || reduceMotion || smallScreen;
})();

const isMobilePerf = (() => {
  const touchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const narrowScreen = window.matchMedia('(max-width: 768px)').matches;
  return touchDevice || narrowScreen;
})();

if (perfLite) {
  document.documentElement.classList.add('perf-lite');
}
if (isMobilePerf) {
  document.documentElement.classList.add('mobile-perf');
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

/* ── CURSOR ── */
const cursor = document.getElementById('cursor');
const ring = document.getElementById('cursorRing');
const enableCustomCursor = false;
if (cursor && ring && enableCustomCursor) {
  document.documentElement.classList.remove('no-custom-cursor');
  let mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
  function animateCursor() {
    cursor.style.left = mx + 'px'; cursor.style.top = my + 'px';
    rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
    ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  document.querySelectorAll('a, button, input, .bento, .testi-card, .voice-card, .screen-preview-card').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.width = '20px'; cursor.style.height = '20px';
      ring.style.width = '60px'; ring.style.height = '60px'; ring.style.opacity = '0.2';
    });
    el.addEventListener('mouseleave', () => {
      cursor.style.width = '12px'; cursor.style.height = '12px';
      ring.style.width = '40px'; ring.style.height = '40px'; ring.style.opacity = '0.4';
    });
  });
} else {
  document.documentElement.classList.add('no-custom-cursor');
  if (cursor) cursor.style.display = 'none';
  if (ring) ring.style.display = 'none';
}

/* ── NAV + SCROLL SMOOTHNESS ── */
const nav = document.getElementById('nav');
const siteHeader = document.getElementById('siteHeader');
let navTicking = false;
let scrollEndTimer = null;
window.addEventListener('scroll', function () {
  try {
    if (navTicking || !nav) return;
    navTicking = true;
    requestAnimationFrame(function () {
      try {
        const scrolled = window.scrollY > 30;
        if (nav) nav.classList.toggle('scrolled', scrolled);
        if (siteHeader) siteHeader.classList.toggle('scrolled', scrolled);
      } finally {
        navTicking = false;
      }
    });
    document.documentElement.classList.add('scroll-active');
    clearTimeout(scrollEndTimer);
    scrollEndTimer = setTimeout(function () {
      document.documentElement.classList.remove('scroll-active');
    }, 150);
  } catch (e) {
    navTicking = false;
  }
}, { passive: true });

/* ── BENTO WAVEFORM ── */
const wbento = document.getElementById('waveform-bento');
const heights = [8, 14, 22, 34, 46, 58, 50, 38, 24, 16, 10, 18, 30, 44, 56, 48, 34, 20, 12, 8, 14, 24, 38, 52, 60, 50, 36, 22, 14, 8, 12, 20, 32, 46, 54, 44, 32, 20, 12, 8];
heights.forEach((h, i) => {
  const b = document.createElement('div'); b.className = 'wv-bar';
  b.style.setProperty('--h', h + 'px');
  b.style.animationDelay = (i * 0.06) + 's';
  b.style.animationDuration = (1.2 + Math.random() * 1) + 's';
  wbento.appendChild(b);
});

/* ── THREADS VISUAL ── */
const threadColors = ['#E8C5A0', '#B8D4C8', '#D4C5E2'];
const threadLetters = ['M', 'J', 'S'];
const threadsVis = document.getElementById('threads-vis');
for (let i = 0; i < 3; i++) {
  const div = document.createElement('div'); div.className = 'thread-item';
  const av = document.createElement('div'); av.className = 'thread-avatar';
  av.style.background = threadColors[i]; av.style.color = '#1C1A18'; av.style.fontSize = '0.65rem';
  av.style.fontWeight = '800'; av.style.display = 'flex'; av.style.alignItems = 'center'; av.style.justifyContent = 'center';
  av.textContent = threadLetters[i];
  const wave = document.createElement('div'); wave.className = 'thread-wave';
  for (let j = 0; j < 10 + i * 4; j++) {
    const b = document.createElement('div'); b.className = 'tw-bar';
    b.style.height = (4 + Math.random() * 12) + 'px'; wave.appendChild(b);
  }
  div.appendChild(av); div.appendChild(wave);
  threadsVis.appendChild(div);
}

/* ── HERO WAVEFORM ── */
(function buildHeroWave() {
  const el = document.getElementById('heroWaveform');
  if (!el) return;
  const heights = [6, 10, 18, 28, 38, 44, 36, 24, 16, 10, 14, 22, 34, 48, 42, 30, 18, 12, 8, 14, 24, 38, 52, 44, 28, 16, 10, 18, 32, 46, 40, 26, 14, 8, 12, 20, 30, 44, 38, 24];
  const durs = [1.2, 1.4, 1.1, 1.6, 1.3, 1.5, 1.2, 1.4, 1.1, 1.3, 1.6, 1.2, 1.4, 1.1, 1.5, 1.3, 1.2, 1.4, 1.1, 1.6, 1.3, 1.5, 1.2, 1.4, 1.1, 1.3, 1.6, 1.2, 1.4, 1.1, 1.5, 1.3, 1.2, 1.4, 1.1, 1.6, 1.3, 1.5, 1.2, 1.4];
  heights.forEach((h, i) => {
    const b = document.createElement('div');
    b.className = 'hero-wv-bar';
    b.style.setProperty('--h', h + 'px');
    b.style.setProperty('--dur', durs[i % durs.length] + 's');
    b.style.setProperty('--del', (i * 0.05) + 's');
    el.appendChild(b);
  });
})();

/* ── HERO WAVEFORM (redesign) ── */
(function buildHeroWaveRedesign() {
  const el = document.getElementById('heroWaveRedesign');
  if (!el) return;
  const heights = [8, 14, 22, 34, 48, 56, 44, 30, 18, 10, 16, 26, 40, 54, 46, 32, 20, 12, 8, 18, 30, 44, 58, 50, 36, 22, 14, 8, 12, 22, 36, 50, 42, 28, 16, 10, 14, 24, 38, 52, 46, 32, 20, 12, 8];
  heights.forEach((h, i) => {
    const b = document.createElement('div');
    b.className = 'hw-bar';
    b.style.setProperty('--hw-h', h + 'px');
    b.style.setProperty('--hw-dur', (1.1 + Math.random() * 0.8) + 's');
    b.style.setProperty('--hw-del', (i * 0.06) + 's');
    el.appendChild(b);
  });
})();

/* ── HERO TICKER ── */
(function buildHeroTicker() {
  const el = document.getElementById('heroTicker');
  if (!el) return;
  const quotes = [
    { av: 'M', bg: '#E8C5A0', color: '#6B3A2A', text: '"Finally heard, not judged."' },
    { av: 'J', bg: '#B8D4C8', color: '#2A4E3F', text: '"Real connection through voice."' },
    { av: 'S', bg: '#D4C5E2', color: '#4A3060', text: '"Safe space for my thoughts."' },
    { av: 'R', bg: '#F2C4CE', color: '#6B2A3A', text: '"My voice finally matters here."' },
    { av: 'A', bg: '#F5D5A0', color: '#6B3A2A', text: '"WhisperMe changed everything."' },
  ];
  const doubled = [...quotes, ...quotes];
  doubled.forEach(q => {
    const chip = document.createElement('div');
    chip.className = 'hero-tick-chip';
    chip.innerHTML = `<div class="hero-tick-av" style="background:${q.bg};color:${q.color};">${q.av}</div>${q.text}`;
    el.appendChild(chip);
  });
})();

/* ── HERO SIGNUP (guard against duplicate listeners) ── */
const heroInput = document.getElementById('heroEmailInput');
if (heroInput && !heroInput.dataset.wmBound) {
  heroInput.dataset.wmBound = '1';
  heroInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') heroSignup(); });
}

// ── HERO RIGHT: auto-rotating modes (Record → Thread → Explore → Live)
(function heroRightAutoModes() {
  const area = document.getElementById('heroInteractionArea');
  if (!area) return;

  const modeIds = ['heroModeRecord', 'heroModeThread', 'heroModeExplore', 'heroModeLive'];
  const inputs = modeIds
    .map(id => document.getElementById(id))
    .filter(Boolean);
  if (!inputs.length) return;

  let idx = 0;
  let hovered = false;
  let timer = null;
  const modeRotateInterval = perfLite ? 9000 : 5200;

  function setMode(i) {
    inputs.forEach((inp, j) => {
      if (!inp) return;
      inp.checked = (j === i);
    });
  }

  function startLoop() {
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      if (hovered) return;
      idx = (idx + 1) % inputs.length;
      setMode(idx);
    }, modeRotateInterval);
  }

  area.addEventListener('mouseenter', () => { hovered = true; });
  area.addEventListener('mouseleave', () => { hovered = false; });

  // Restart loop when user manually changes mode via cards
  inputs.forEach((inp, i) => {
    inp.addEventListener('change', () => {
      if (!inp.checked) return;
      idx = i;
      startLoop();
    });
  });

  setMode(0);
  startLoop();
})();

/* ── V11 HOME PAGE JS ── */
// Build phone feed waveforms
(function buildH11Waves() {
  const configs = [
    { id: 'h11w1', hs: [8, 14, 22, 36, 50, 44, 30, 18, 12, 22, 38, 54, 46, 30, 16, 10, 18, 32, 48, 56, 44, 28, 14] },
    { id: 'h11w2', hs: [12, 20, 32, 48, 60, 50, 36, 22, 14, 24, 40, 58, 50, 34, 18, 10, 20, 36, 52, 62, 50, 32, 18] },
    { id: 'h11w3', hs: [6, 12, 20, 34, 46, 38, 24, 16, 10, 18, 30, 44, 52, 40, 26, 14, 8, 16, 28, 42, 56, 44, 28] },
  ];
  configs.forEach(cfg => {
    const el = document.getElementById(cfg.id);
    if (!el) return;
    cfg.hs.forEach((h, i) => {
      const b = document.createElement('div');
      b.className = 'h11-fi-bar';
      b.style.setProperty('--fw-h', h * 0.4 + 'px');
      b.style.setProperty('--fw-dur', (1.1 + Math.random() * 0.7) + 's');
      b.style.setProperty('--fw-del', (i * 0.05) + 's');
      el.appendChild(b);
    });
  });
})();

// Build preview card waveform
(function buildH11PcWave() {
  const el = document.getElementById('h11PcWave1');
  if (!el) return;
  const hs = [8, 14, 24, 40, 56, 48, 34, 20, 12, 18, 32, 50, 62, 54, 38, 22, 14, 20, 36, 54, 66, 58, 42, 26, 16, 12, 22, 38, 54, 46, 32, 18, 10, 16, 28, 44];
  hs.forEach((h, i) => {
    const b = document.createElement('div');
    b.className = 'h11-pcw-bar';
    b.style.setProperty('--pw-h', h + 'px');
    b.style.setProperty('--pw-dur', (1.1 + Math.random() * 0.8) + 's');
    b.style.setProperty('--pw-del', (i * 0.04) + 's');
    el.appendChild(b);
  });
})();

// Build USP marquee
(function buildH11USP() {
  const el = document.getElementById('h11UspInner');
  if (!el) return;
  const items = [
    { icon: '🫧', bg: 'rgba(139,92,246,0.1)', title: 'Anonymous & Safe Sharing', desc: 'Your voice, your choice, fully optional.' },
    { icon: '🔴', bg: 'rgba(255,71,87,0.1)', title: 'Live & Private Rooms', desc: 'Join instantly, public or invite-only.' },
    { icon: '🫂', bg: 'rgba(122,158,135,0.1)', title: 'Micro-Community Circles', desc: 'Belong to meaningful small communities.' },
    { icon: '✨', bg: 'rgba(96,165,250,0.1)', title: 'AI-Powered Explore Feed', desc: 'Discover voices that resonate with you.' },
    { icon: '🌙', bg: 'rgba(201,133,58,0.1)', title: 'Mood-Based Discovery', desc: 'Share exactly how you feel right now.' },
    { icon: '🧵', bg: 'rgba(212,96,122,0.08)', title: 'Voice Threads', desc: 'Reply voice-to-voice, build conversation.' },
    { icon: '📊', bg: 'rgba(122,158,135,0.08)', title: 'Voice Analytics', desc: 'See who\'s resonating with your voice.' },
  ];
  const doubled = [...items, ...items];
  doubled.forEach(item => {
    const div = document.createElement('div');
    div.className = 'h11-usp-card';
    div.innerHTML = `
      <div class="h11-usp-icon" style="background:${item.bg};">${item.icon}</div>
      <div class="h11-usp-text">
        <div class="h11-usp-title">${item.title}</div>
        <div class="h11-usp-desc">${item.desc}</div>
      </div>
    `;
    el.appendChild(div);
  });
})();

// V11 mood chip selection
function h11SelectMood(el) {
  el.closest('.h11-mood-row').querySelectorAll('.h11-mood-chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
}

/* ── PAGE SWITCHING ── */
const PAGES = ['home', 'features', 'how-it-works', 'stories', 'app-preview', 'join-beta', 'community', 'about', 'blog', 'careers', 'press', 'privacy-policy', 'terms-of-service', 'cookie-policy', 'accessibility'];

function openMobileMenu() {
  const overlay = document.getElementById('mobileNavOverlay');
  if (!overlay) return;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
  const overlay = document.getElementById('mobileNavOverlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function toggleMobileMenu() {
  const overlay = document.getElementById('mobileNavOverlay');
  if (!overlay) return;
  if (overlay.classList.contains('open')) closeMobileMenu();
  else openMobileMenu();
}

function handleMobileNavOverlay(e) {
  if (!e) return;
  if (e.target && e.target.id === 'mobileNavOverlay') closeMobileMenu();
}

function showPage(name) {
  if (!PAGES.includes(name)) return;
  PAGES.forEach(p => {
    const el = document.getElementById('page-' + p);
    if (el) el.style.display = 'none';
  });
  const target = document.getElementById('page-' + name);
  if (target) {
    target.style.display = 'block';
    // Re-trigger page animation
    target.style.animation = 'none';
    target.offsetHeight; // reflow
    target.style.animation = '';
    // Re-trigger reveals inside this page
    target.querySelectorAll('.reveal').forEach(el => {
      el.classList.remove('in');
      setTimeout(() => el.classList.add('in'), 80);
    });
  }
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
  // Update nav active state
  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.dataset.page === name);
  });
  // Update nav scroll style immediately
  const nav = document.getElementById('nav');
  const siteHeader = document.getElementById('siteHeader');
  if (name === 'home') {
    nav.classList.remove('scrolled');
    if (siteHeader) siteHeader.classList.remove('scrolled');
  } else {
    nav.classList.add('scrolled');
    if (siteHeader) siteHeader.classList.add('scrolled');
  }
  // Rebuild app preview cards if needed
  if (name === 'app-preview') {
    rebuildSpCards();
  }
  if (name === 'features') {
    setTimeout(buildNfWaveforms, 100);
  }
  if (name === 'app-preview') {
    setTimeout(() => {
      buildApvFeed();
      buildApvRoomWaves();
    }, 100);
  }
  closeMobileMenu();
}

function rebuildSpCards() {
  const spCards = document.getElementById('sp-cards-inner');
  if (spCards && spCards.children.length === 0) {
    FEED_DATA.slice(0, 3).forEach(post => {
      const c = document.createElement('div'); c.className = 'sp-card';
      c.innerHTML = `
        <div class="sp-card-row">
          <div class="sp-av" style="background:${post.anon ? 'rgba(255,255,255,0.07)' : post.bg};"></div>
          <span class="sp-name">${post.anon ? 'Anonymous' : post.name}</span>
          <span class="sp-label">${post.mood}</span>
        </div>
        <div class="sp-wave" id="spwave2-${post.id}"></div>
      `;
      post.waves.slice(0, 16).forEach(h => {
        const b = document.createElement('div'); b.className = 'sp-bar'; b.style.height = (h / 60 * 14) + 'px'; c.querySelector('.sp-wave').appendChild(b);
      });
      spCards.appendChild(c);
    });
  }
}

/* ── MARQUEE ── */
const marqueeItems = ['Voice-First Community', 'Emotional Connection', 'Real Conversations', 'Authentic Voices', 'Safe Expression', 'Deep Listening', 'Human Connection', 'Voice Threads'];
const buildMarquee = (id) => {
  const el = document.getElementById(id);
  if (!el) return;
  const doubled = [...marqueeItems, ...marqueeItems];
  doubled.forEach((item, i) => {
    const div = document.createElement('div'); div.className = 'logo-item';
    if (i > 0) { const dot = document.createElement('span'); dot.className = 'logo-dot'; div.appendChild(dot); }
    const span = document.createElement('span'); span.textContent = item; div.appendChild(span);
    el.appendChild(div);
  });
};
buildMarquee('marquee1'); buildMarquee('marquee2');
buildMarquee('heroMarquee1'); buildMarquee('heroMarquee2');

/* ── SCROLL REVEAL ── */
const reveals = document.querySelectorAll('.reveal');
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
}, { threshold: 0.1 });
reveals.forEach(el => io.observe(el));

/* ── LANDING SIGNUP (guard against duplicate listeners) ── */
if (!window._wmSignupBound) {
  window._wmSignupBound = true;
  var emailInp = document.getElementById('emailInput');
  var h11Inp = document.getElementById('h11EmailInput');
  if (emailInp) emailInp.addEventListener('keydown', function (e) { if (e.key === 'Enter') h11HandleSignup(e); });
  if (h11Inp) h11Inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') h11HandleSignup(e); });
}

/* ─────────────────────────────────────────
   APP OVERLAY SYSTEM
   ───────────────────────────────────────── */
const FEED_AUDIO_BASE = 'audio/';
const FEED_DATA = [
  { id: 1, letter: 'M', bg: 'linear-gradient(135deg,#F2C4CE,#D4607A)', name: 'Maya Rivera', handle: '@mayavoices', mood: '💙 Open', time: '2 min ago', dur: '0:47', audio: 'quiet-joy.mp3', likes: 84, replies: 12, waves: [12, 20, 34, 52, 44, 28, 38, 50, 42, 30, 18, 24, 40, 56, 48, 32, 20, 14, 22, 36, 50, 44, 28, 16, 10], anon: false, saved: false },
  { id: 2, letter: '?', bg: 'rgba(255,255,255,0.07)', name: 'Anonymous', handle: '', mood: '🌙 Reflective', time: '15 min ago', dur: '1:12', audio: 'late-night-thoughts.mp3', likes: 231, replies: 28, waves: [8, 16, 28, 44, 36, 52, 40, 24, 18, 30, 46, 38, 22, 14, 10, 20, 34, 48, 56, 42, 28, 16, 10, 8, 18], anon: true, saved: true },
  { id: 3, letter: 'J', bg: 'linear-gradient(135deg,#B8D4C8,#4A8C6F)', name: 'James K.', handle: '@jkspeaks', mood: '🔥 Bold', time: '32 min ago', dur: '0:38', audio: 'unfiltered-moment.mp3', likes: 47, replies: 6, waves: [20, 32, 48, 60, 44, 36, 50, 42, 28, 22, 34, 52, 46, 30, 18, 14, 24, 40, 54, 48, 32, 20, 12, 10, 16], anon: false, saved: false },
  { id: 4, letter: 'S', bg: 'linear-gradient(135deg,#D4C5E2,#7C5CBF)', name: 'Sofia T.', handle: '@sofiatalk', mood: '🌱 Calm', time: '1 hr ago', dur: '1:05', audio: 'city-at-rest.mp3', likes: 168, replies: 19, waves: [6, 12, 22, 38, 50, 42, 30, 20, 14, 26, 40, 54, 46, 28, 16, 10, 18, 32, 48, 56, 44, 30, 18, 12, 8], anon: false, saved: false },
];

const THREAD_REPLIES = [
  { letter: 'J', bg: 'linear-gradient(135deg,#B8D4C8,#4A8C6F)', name: 'James K.', mood: '🔥 Bold', time: '5 min ago', dur: '0:28', audio: 'honest-doubt.mp3', waves: [8, 14, 22, 36, 44, 34, 22, 14, 20, 34, 44, 36, 22, 14, 8, 12, 24, 38, 46, 38, 24, 14, 8], reactions: ['🙌 24', '💙 18', '🫶 9'] },
  { letter: 'S', bg: 'linear-gradient(135deg,#D4C5E2,#7C5CBF)', name: 'Sofia T.', mood: '🌱 Calm', time: '8 min ago', dur: '0:42', audio: 'quiet-joy.mp3', waves: [12, 20, 32, 46, 54, 40, 28, 18, 14, 22, 36, 50, 42, 28, 16, 10, 20, 34, 50, 44, 30, 18, 10], reactions: ['💜 31', '✨ 14'] },
  { letter: 'R', bg: 'linear-gradient(135deg,#F5D5A0,#C9853A)', name: 'Rafael A.', mood: '⭐ Hopeful', time: '12 min ago', dur: '0:55', audio: 'vulnerable-truth.mp3', waves: [10, 18, 28, 42, 54, 46, 30, 20, 16, 28, 44, 52, 38, 24, 14, 10, 18, 32, 46, 54, 40, 26, 14], reactions: ['❤ 22', '🔥 11'] },
];

let currentScreen = 'feed';
let isRecording = false;
let recordInterval = null;
let recordSeconds = 0;
let activePlayId = null;
let playIntervals = {};
let feedAudio = null;
let threadAudio = null;
let threadActiveIdx = -1;

function openApp(screen) {
  document.getElementById('appOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
  switchScreen(screen || 'feed');
  updateAppTime();
}
function closeApp() {
  if (feedAudio) { feedAudio.pause(); feedAudio.currentTime = 0; feedAudio = null; }
  if (threadAudio) { threadAudio.pause(); threadAudio.currentTime = 0; threadAudio = null; }
  if (activePlayId) stopPlay(activePlayId);
  if (threadActiveIdx >= 0) {
    const r = THREAD_REPLIES[threadActiveIdx];
    const btn = document.getElementById('tr-play-' + threadActiveIdx);
    const durEl = document.getElementById('tr-dur-' + threadActiveIdx);
    if (btn) btn.textContent = '▶';
    if (durEl && r) durEl.textContent = r.dur;
    threadActiveIdx = -1;
  }
  document.getElementById('appOverlay').classList.remove('active');
  document.body.style.overflow = '';
}
function handleOverlayClick(e) {
  if (e.target === document.getElementById('appOverlay')) closeApp();
}

function switchScreen(name) {
  // Hide auth bottom nav for auth screen
  const bottomNav = document.getElementById('appBottomNav');
  bottomNav.style.display = (name === 'auth') ? 'none' : 'flex';

  document.querySelectorAll('.app-screen').forEach(s => s.classList.remove('active'));
  const screen = document.getElementById('screen-' + name);
  if (screen) screen.classList.add('active');

  document.querySelectorAll('.app-nav-btn').forEach(b => b.classList.remove('active'));
  const navBtnMap = { feed: 'navFeed', notif: 'navNotif', profile: 'navProfile' };
  if (navBtnMap[name]) document.getElementById(navBtnMap[name])?.classList.add('active');

  currentScreen = name;

  if (name === 'feed') buildFeed();
  if (name === 'thread') buildThread();
  if (name === 'profile') buildProfile();
  if (name === 'notif') buildNotifWaves();
}

function updateAppTime() {
  const now = new Date();
  const h = now.getHours() % 12 || 12;
  const m = String(now.getMinutes()).padStart(2, '0');
  document.getElementById('appTime').textContent = `${h}:${m}`;
}

/* Build waveform bars for a container */
function buildWave(container, heights, className, delay) {
  container.innerHTML = '';
  heights.forEach((h, i) => {
    const b = document.createElement('div');
    b.className = className;
    b.style.height = h + 'px';
    if (delay) b.style.animationDelay = (i * 0.05) + 's';
    container.appendChild(b);
  });
}

/* Feed */
function buildFeed() {
  const scroll = document.getElementById('feedScroll');
  if (scroll.dataset.built) return;
  scroll.dataset.built = 'yes';
  scroll.innerHTML = '';
  FEED_DATA.forEach(post => {
    scroll.appendChild(createVoiceCard(post, false));
  });
}

function createVoiceCard(post, isThread) {
  const card = document.createElement('div');
  card.className = 'voice-card';
  card.innerHTML = `
    <div class="vc-header">
      <div class="vc-avatar ${post.anon ? 'anon' : ''}" style="background:${post.anon ? 'rgba(255,255,255,0.07)' : post.bg}; color:white; font-size:0.8rem; font-weight:800;">
        <div class="vc-avatar-ring"></div>
        ${post.anon ? '🫧' : post.letter}
      </div>
      <div class="vc-user-info">
        <div class="vc-name">
          ${post.anon ? 'Anonymous Voice' : post.name}
          ${post.anon ? `<span class="vc-anon-badge">🫧 Anon</span>` : `<span class="vc-mood-badge">${post.mood}</span>`}
        </div>
        <div class="vc-time">${post.time}</div>
      </div>
      <div class="vc-options">⋯</div>
    </div>
    <div class="vc-waveform" id="wave-${post.id}">
      <div class="vc-waveform-progress" id="prog-${post.id}"></div>
    </div>
    <div class="vc-controls">
      <button class="vc-play-btn" id="play-${post.id}" onclick="togglePlay(${post.id}, event)">▶</button>
      <span class="vc-duration">${post.dur}</span>
      <div class="vc-time-bar"><div class="vc-time-fill" id="fill-${post.id}"></div></div>
      <span class="vc-speed">1×</span>
    </div>
    <div class="vc-actions">
      <button class="vc-action-btn ${post.saved ? 'liked' : ''}" id="like-${post.id}" onclick="toggleLike(${post.id}, event)">
        <svg viewBox="0 0 24 24" fill="${post.saved ? 'var(--rose)' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"></path></svg>
        <span id="likes-${post.id}">${post.likes}</span>
      </button>
      <button class="vc-action-btn" onclick="openThread(${post.id}, event)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path></svg>
        Reply
      </button>
      <button class="vc-action-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"></path></svg>
        Save
      </button>
      <button class="vc-action-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
      </button>
      <div class="vc-thread-count">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path></svg>
        ${post.replies}
      </div>
    </div>
  `;
  // Build waveform
  const waveContainer = card.querySelector(`#wave-${post.id}`);
  post.waves.forEach((h, i) => {
    const b = document.createElement('div');
    b.className = 'vc-wave-bar';
    b.style.height = h + 'px';
    b.dataset.idx = i;
    waveContainer.insertBefore(b, waveContainer.firstChild);
  });
  return card;
}

let likedPosts = new Set([2]);
function toggleLike(id, e) {
  e.stopPropagation();
  const btn = document.getElementById(`like-${id}`);
  const likesEl = document.getElementById(`likes-${id}`);
  const post = FEED_DATA.find(p => p.id === id);
  if (likedPosts.has(id)) {
    likedPosts.delete(id);
    btn.classList.remove('liked');
    if (post) { post.likes--; likesEl.textContent = post.likes; }
  } else {
    likedPosts.add(id);
    btn.classList.add('liked');
    if (post) { post.likes++; likesEl.textContent = post.likes; }
    // Heart burst micro
    btn.style.transform = 'scale(1.3)';
    setTimeout(() => btn.style.transform = '', 200);
  }
}

function togglePlay(id, e) {
  if (e) e.stopPropagation();
  if (activePlayId === id) {
    stopPlay(id);
  } else {
    if (activePlayId) stopPlay(activePlayId);
    startPlay(id);
  }
}

function formatFeedTime(sec) {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m + ':' + (s < 10 ? '0' : '') + s;
}

function startPlay(id) {
  const post = FEED_DATA.find(p => p.id === id);
  if (!post || !post.audio) return;

  if (feedAudio) {
    feedAudio.pause();
    feedAudio.currentTime = 0;
    feedAudio = null;
  }
  if (threadAudio) {
    threadAudio.pause();
    threadAudio.currentTime = 0;
    threadAudio = null;
    const prevBtn = document.getElementById('tr-play-' + threadActiveIdx);
    const prevDur = document.getElementById('tr-dur-' + threadActiveIdx);
    if (prevBtn && THREAD_REPLIES[threadActiveIdx]) prevBtn.textContent = '▶';
    if (prevDur && THREAD_REPLIES[threadActiveIdx]) prevDur.textContent = THREAD_REPLIES[threadActiveIdx].dur;
    threadActiveIdx = -1;
  }
  if (activePlayId && activePlayId !== id) stopPlay(activePlayId);

  activePlayId = id;
  const playBtn = document.getElementById(`play-${id}`);
  const fill = document.getElementById(`fill-${id}`);
  const prog = document.getElementById(`prog-${id}`);
  const waveContainer = document.getElementById(`wave-${id}`);
  const durEl = document.querySelector(`#wave-${id}`)?.closest('.voice-card')?.querySelector('.vc-duration');
  const ring = waveContainer?.parentElement?.querySelector('.vc-avatar-ring');

  if (playBtn) playBtn.textContent = '⏸';
  if (ring) ring.classList.add('playing');

  const bars = waveContainer ? Array.from(waveContainer.querySelectorAll('.vc-wave-bar')) : [];
  feedAudio = new Audio(new URL(FEED_AUDIO_BASE + post.audio, window.location.href).href);

  function updateUI() {
    if (!feedAudio) return;
    const cur = feedAudio.currentTime;
    const tot = feedAudio.duration;
    const pct = isFinite(tot) && tot > 0 ? (cur / tot) * 100 : 0;
    if (fill) fill.style.width = pct + '%';
    if (prog) prog.style.width = pct + '%';
    if (durEl) {
      durEl.textContent = isFinite(tot) && tot > 0 ? formatFeedTime(cur) + ' / ' + formatFeedTime(tot) : formatFeedTime(cur);
    }
    const playedIdx = Math.floor((pct / 100) * bars.length);
    bars.forEach((b, i) => {
      b.classList.remove('played', 'active');
      if (i < playedIdx - 1) b.classList.add('played');
      else if (i === playedIdx) b.classList.add('active');
    });
  }

  feedAudio.addEventListener('timeupdate', updateUI);
  feedAudio.addEventListener('loadedmetadata', updateUI);
  feedAudio.addEventListener('ended', () => stopPlay(id));
  feedAudio.addEventListener('error', () => stopPlay(id));
  feedAudio.play().catch(() => stopPlay(id));
  updateUI();
}

function stopPlay(id) {
  if (playIntervals[id]) clearInterval(playIntervals[id]);
  delete playIntervals[id];
  if (activePlayId === id && feedAudio) {
    feedAudio.pause();
    feedAudio.currentTime = 0;
    feedAudio = null;
  }
  if (activePlayId === id) activePlayId = null;
  const playBtn = document.getElementById(`play-${id}`);
  if (playBtn) playBtn.textContent = '▶';
  const waveContainer = document.getElementById(`wave-${id}`);
  if (waveContainer) {
    waveContainer.querySelectorAll('.vc-wave-bar').forEach(b => b.classList.remove('active', 'played'));
    const ring = waveContainer.parentElement?.querySelector('.vc-avatar-ring');
    if (ring) ring.classList.remove('playing');
  }
  const fill = document.getElementById(`fill-${id}`);
  const prog = document.getElementById(`prog-${id}`);
  if (fill) fill.style.width = '0%';
  if (prog) prog.style.width = '0%';
  const post = FEED_DATA.find(p => p.id === id);
  const durEl = document.querySelector(`#wave-${id}`)?.closest('.voice-card')?.querySelector('.vc-duration');
  if (durEl && post) durEl.textContent = post.dur;
}

let threadPostId = 1;
function openThread(id, e) {
  if (e) e.stopPropagation();
  threadPostId = id;
  switchScreen('thread');
}

/* Thread */
function buildThread() {
  const origEl = document.getElementById('threadOriginal');
  const repliesEl = document.getElementById('threadReplies');
  const post = FEED_DATA.find(p => p.id === threadPostId) || FEED_DATA[0];

  origEl.innerHTML = '';
  origEl.appendChild(createVoiceCard(post, true));

  repliesEl.innerHTML = '';
  THREAD_REPLIES.forEach((r, i) => {
    const replyWrap = document.createElement('div');
    replyWrap.className = 'thread-reply';
    replyWrap.style.animationDelay = (i * 0.1) + 's';
    replyWrap.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:0;">
        <div class="vc-avatar" style="background:${r.bg};color:white;font-size:0.72rem;font-weight:800;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${r.letter}</div>
        ${i < THREAD_REPLIES.length - 1 ? '<div style="flex:1;width:1px;background:rgba(255,255,255,0.06);margin:4px 0;min-height:40px;"></div>' : ''}
      </div>
      <div class="thread-reply-card">
        <div class="vc-header" style="margin-bottom:8px;">
          <div class="vc-user-info">
            <div class="vc-name">${r.name} <span class="vc-mood-badge">${r.mood}</span></div>
            <div class="vc-time">${r.time}</div>
          </div>
        </div>
        <div class="vc-waveform" style="height:32px;" id="tr-wave-${i}"></div>
        <div class="vc-controls" style="margin:8px 0 6px;">
          <button class="vc-play-btn" id="tr-play-${i}" style="width:28px;height:28px;font-size:0.6rem;" onclick="toggleThreadPlay(${i}, event)">▶</button>
          <span class="vc-duration" id="tr-dur-${i}">${r.dur}</span>
        </div>
        <div class="thread-reactions">
          ${r.reactions.map(rx => `<button class="reaction-btn">${rx}</button>`).join('')}
        </div>
      </div>
    `;
    // Wave bars
    const wc = replyWrap.querySelector(`#tr-wave-${i}`);
    r.waves.forEach(h => {
      const b = document.createElement('div'); b.className = 'vc-wave-bar'; b.style.height = h + 'px'; wc.appendChild(b);
    });
    repliesEl.appendChild(replyWrap);
  });
}

function toggleThreadPlay(idx, e) {
  if (e) e.stopPropagation();
  const r = THREAD_REPLIES[idx];
  if (!r || !r.audio) return;
  if (threadActiveIdx === idx && threadAudio) {
    threadAudio.pause();
    threadAudio.currentTime = 0;
    threadAudio = null;
    threadActiveIdx = -1;
    const btn = document.getElementById(`tr-play-${idx}`);
    const durEl = document.getElementById(`tr-dur-${idx}`);
    if (btn) btn.textContent = '▶';
    if (durEl) durEl.textContent = r.dur;
    return;
  }
  if (threadAudio) {
    threadAudio.pause();
    threadAudio.currentTime = 0;
    const prevBtn = document.getElementById(`tr-play-${threadActiveIdx}`);
    const prevDur = document.getElementById(`tr-dur-${threadActiveIdx}`);
    if (prevBtn) prevBtn.textContent = '▶';
    if (prevDur && THREAD_REPLIES[threadActiveIdx]) prevDur.textContent = THREAD_REPLIES[threadActiveIdx].dur;
  }
  if (feedAudio) {
    feedAudio.pause();
    feedAudio.currentTime = 0;
    feedAudio = null;
    if (activePlayId) stopPlay(activePlayId);
  }
  threadActiveIdx = idx;
  threadAudio = new Audio(new URL(FEED_AUDIO_BASE + r.audio, window.location.href).href);
  const btn = document.getElementById(`tr-play-${idx}`);
  const durEl = document.getElementById(`tr-dur-${idx}`);
  if (btn) btn.textContent = '⏸';
  function upd() {
    if (!threadAudio) return;
    const cur = threadAudio.currentTime;
    const tot = threadAudio.duration;
    if (durEl) durEl.textContent = isFinite(tot) && tot > 0 ? formatFeedTime(cur) + ' / ' + formatFeedTime(tot) : formatFeedTime(cur);
  }
  threadAudio.addEventListener('timeupdate', upd);
  threadAudio.addEventListener('loadedmetadata', upd);
  threadAudio.addEventListener('ended', () => {
    threadAudio = null;
    threadActiveIdx = -1;
    if (btn) btn.textContent = '▶';
    if (durEl) durEl.textContent = r.dur;
  });
  threadAudio.addEventListener('error', () => { threadAudio = null; threadActiveIdx = -1; if (btn) btn.textContent = '▶'; if (durEl) durEl.textContent = r.dur; });
  threadAudio.play().catch(() => { threadAudio = null; threadActiveIdx = -1; if (btn) btn.textContent = '▶'; if (durEl) durEl.textContent = r.dur; });
  upd();
}

/* Profile */
function buildProfile() {
  const grid = document.getElementById('profilePostsGrid');
  if (grid.dataset.built) return;
  grid.dataset.built = 'yes';
  const wavesets = [
    [12, 20, 30, 44, 38, 24, 18, 28, 40, 52, 44, 28, 16],
    [8, 16, 26, 38, 50, 42, 28, 20, 14, 22, 36, 48, 40],
    [18, 28, 40, 52, 44, 32, 20, 14, 24, 38, 52, 44, 28],
    [10, 18, 30, 44, 38, 24, 16, 12, 22, 36, 50, 42, 26],
    [14, 24, 36, 50, 44, 30, 18, 14, 20, 34, 48, 40, 24],
    [8, 14, 22, 34, 46, 38, 26, 16, 10, 20, 32, 44, 36],
  ];
  wavesets.forEach((ws, i) => {
    const card = document.createElement('div');
    card.className = 'profile-post-card';
    const waveEl = document.createElement('div'); waveEl.className = 'ppcard-wave';
    ws.forEach(h => {
      const b = document.createElement('div'); b.className = 'ppcard-wave-bar'; b.style.height = h + 'px'; waveEl.appendChild(b);
    });
    const dur = ['0:47', '1:12', '0:38', '1:05', '0:52', '0:44'][i];
    card.innerHTML = '';
    card.appendChild(waveEl);
    card.innerHTML += `<div class="ppcard-info">${dur} · ${[2, 7, 3, 1, 4, 2][i]} days ago</div>`;
    card.innerHTML += `<div class="ppcard-likes">♡ ${[84, 231, 47, 168, 93, 56][i]}</div>`;
    card.onclick = () => openThread(1);
    grid.appendChild(card);
  });
}

/* Notif waves */
function buildNotifWaves() {
  const el = document.getElementById('notifWave1');
  if (el && !el.dataset.built) {
    el.dataset.built = 'yes';
    [8, 14, 22, 30, 24, 16, 10, 18, 28, 36, 28, 18, 10].forEach(h => {
      const b = document.createElement('div'); b.className = 'notif-mini-bar'; b.style.height = h + 'px'; el.appendChild(b);
    });
  }
}

/* Record Modal */
function openRecord() {
  document.getElementById('recordModal').classList.add('active');
  document.body.style.overflow = 'hidden';
  buildRecordWave();
}
function closeRecord() {
  document.getElementById('recordModal').classList.remove('active', 'recording');
  document.body.style.overflow = '';
  stopRecording();
}
function buildRecordWave() {
  const el = document.getElementById('recordWaveform');
  if (el.dataset.built) return;
  el.dataset.built = 'yes';
  const hs = [8, 14, 22, 36, 50, 42, 30, 20, 14, 22, 36, 50, 44, 28, 16, 10, 18, 30, 44, 54, 46, 30, 18, 12, 8, 14, 24, 38, 52, 44, 28];
  hs.forEach((h, i) => {
    const b = document.createElement('div'); b.className = 'rec-wave-bar';
    b.style.setProperty('--h', h + 'px');
    b.style.height = '4px';
    b.style.animationDelay = (i * 0.06) + 's';
    b.style.animationDuration = (0.8 + Math.random() * 0.6) + 's';
    el.appendChild(b);
  });
}
function toggleRecord() {
  isRecording = !isRecording;
  const modal = document.getElementById('recordModal');
  const btn = document.getElementById('recMainBtn');
  modal.classList.toggle('recording', isRecording);
  btn.classList.toggle('recording', isRecording);
  btn.textContent = isRecording ? '⏹' : '🎤';
  if (isRecording) {
    recordSeconds = 0;
    recordInterval = setInterval(() => {
      recordSeconds++;
      const m = Math.floor(recordSeconds / 60);
      const s = String(recordSeconds % 60).padStart(2, '0');
      document.getElementById('recordTimer').textContent = `${m}:${s}`;
      if (recordSeconds >= 90) { isRecording = false; stopRecording(); }
    }, 1000);
  } else {
    stopRecording();
  }
}
function stopRecording() {
  if (recordInterval) clearInterval(recordInterval);
  recordInterval = null;
  isRecording = false;
  const modal = document.getElementById('recordModal');
  const btn = document.getElementById('recMainBtn');
  modal.classList.remove('recording');
  if (btn) { btn.classList.remove('recording'); btn.textContent = '🎤'; }
}

function selectFormMood(el) {
  document.querySelectorAll('.form-mood-chip').forEach(c => {
    c.style.borderColor = 'var(--border)';
    c.style.background = 'var(--warm)';
    c.style.color = 'var(--mist)';
  });
  el.style.borderColor = 'var(--rose)';
  el.style.background = 'rgba(212,96,122,0.08)';
  el.style.color = 'var(--rose)';
}

function switchAuthTab(tab) {
  document.getElementById('signupTab').classList.toggle('active', tab === 'signup');
  document.getElementById('signinTab').classList.toggle('active', tab === 'signin');
  document.getElementById('authFormSignup').style.display = tab === 'signup' ? 'flex' : 'none';
  document.getElementById('authFormSignin').style.display = tab === 'signin' ? 'flex' : 'none';
}
function selectMood(el) {
  document.querySelectorAll('.auth-mood-chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
}

/* Build new features page waveforms */
function buildNfWaveforms() {
  // ── FV Hero wave bars ──
  const fvHeroWaves = document.getElementById('fvHeroWaves');
  if (fvHeroWaves && !fvHeroWaves.dataset.built) {
    fvHeroWaves.dataset.built = 'yes';
    for (let i = 0; i < 120; i++) {
      const b = document.createElement('div'); b.className = 'fv-hw-bar';
      const h = 10 + Math.random() * 80;
      b.style.setProperty('--h', h + 'px');
      b.style.setProperty('--dur', (1.5 + Math.random() * 2) + 's');
      b.style.setProperty('--del', (Math.random() * 2) + 's');
      b.style.height = h + 'px';
      fvHeroWaves.appendChild(b);
    }
  }
  // ── FV Voice card wave (strip 01) ──
  const fvw1 = document.getElementById('fvWave1');
  if (fvw1 && !fvw1.dataset.built) {
    fvw1.dataset.built = 'yes';
    [4, 8, 14, 20, 28, 22, 16, 10, 6, 12, 20, 30, 24, 16, 8, 5, 10, 18, 26, 20, 14, 8, 4, 10, 18, 28, 22, 14, 8, 4].forEach((h, i) => {
      const b = document.createElement('div'); b.className = 'fv-vc-bar';
      b.style.setProperty('--h', h + 'px');
      b.style.setProperty('--dur', (1 + Math.random() * 0.8) + 's');
      b.style.setProperty('--del', (i * 0.04) + 's');
      b.style.height = h + 'px';
      fvw1.appendChild(b);
    });
  }
  // ── FV Thread card waves ──
  const threadSets = {
    fvThread1: { hs: [6, 10, 16, 20, 16, 10, 6, 8, 14, 18, 12, 8], color: 'var(--rose)' },
    fvThread2: { hs: [4, 8, 12, 16, 12, 8, 4, 6, 10, 14, 10, 6], color: 'var(--sage)' },
    fvThread3: { hs: [3, 6, 10, 12, 10, 6, 4, 8, 12, 10, 6, 4], color: '#8B5CF6' },
  };
  Object.entries(threadSets).forEach(([id, { hs, color }]) => {
    const el = document.getElementById(id);
    if (el && !el.dataset.built) {
      el.dataset.built = 'yes';
      hs.forEach((h, i) => {
        const b = document.createElement('div'); b.className = 'fv-tc-bar';
        b.style.setProperty('--h', h + 'px');
        b.style.setProperty('--dur', (1 + Math.random() * 0.7) + 's');
        b.style.setProperty('--del', (i * 0.06) + 's');
        b.style.background = color; b.style.height = h + 'px';
        el.appendChild(b);
      });
    }
  });
  // ── FV Preview card waves ──
  const prevSets = {
    fvPrev1: { hs: [4, 8, 14, 22, 30, 24, 16, 10, 6, 12, 22, 32, 26, 18, 10, 6, 12, 20, 28, 22, 14, 8, 4], color: 'rgba(212,96,122,0.8)' },
    fvPrev2: { hs: [6, 10, 18, 28, 36, 28, 18, 10, 6, 14, 24, 34, 28, 18, 8, 5, 12, 22, 32, 26, 16, 8, 5], color: 'rgba(139,92,246,0.8)' },
    fvPrev3: { hs: [4, 8, 12, 18, 24, 18, 12, 8, 4, 10, 18, 26, 20, 12, 6, 4, 8, 16, 22, 16, 10, 6, 4], color: 'rgba(96,165,250,0.8)' },
  };
  Object.entries(prevSets).forEach(([id, { hs, color }]) => {
    const el = document.getElementById(id);
    if (el && !el.dataset.built) {
      el.dataset.built = 'yes';
      hs.forEach((h, i) => {
        const b = document.createElement('div'); b.className = 'fv-pc-bar';
        b.style.setProperty('--h', h + 'px');
        b.style.setProperty('--dur', (0.9 + Math.random() * 0.8) + 's');
        b.style.setProperty('--del', (i * 0.04) + 's');
        b.style.background = color; b.style.height = h + 'px';
        el.appendChild(b);
      });
    }
  });

  const w1 = document.getElementById('nf-wave-1');
  if (w1 && !w1.dataset.built) {
    w1.dataset.built = 'yes';
    const heights = [8, 14, 22, 36, 50, 44, 30, 18, 12, 22, 38, 54, 46, 30, 16, 10, 18, 32, 48, 56, 44, 28, 14, 10, 18, 30, 44, 52, 38, 22];
    heights.forEach((h, i) => {
      const b = document.createElement('div'); b.className = 'nf-wv-bar';
      b.style.setProperty('--h', h + 'px');
      b.style.setProperty('--dur', (1.2 + Math.random() * 0.8) + 's');
      b.style.setProperty('--del', (i * 0.04) + 's');
      w1.appendChild(b);
    });
  }
  const threadHeights = [[6, 10, 14, 18, 14, 10, 6, 8, 12, 16], [8, 12, 16, 12, 8, 6, 10, 14], [4, 8, 12, 10, 6, 4, 8, 12]];
  ['nf-thread-1', 'nf-thread-2', 'nf-thread-3'].forEach((id, ti) => {
    const el = document.getElementById(id);
    if (el && !el.dataset.built) {
      el.dataset.built = 'yes';
      threadHeights[ti].forEach(h => {
        const b = document.createElement('div'); b.className = 'nf-thread-bar';
        b.style.height = h + 'px'; el.appendChild(b);
      });
    }
  });
  const v2vH1 = [6, 10, 16, 22, 18, 12, 8, 10, 16, 20];
  const v2vH2 = [8, 14, 20, 14, 8, 6, 12, 18, 22, 16];
  ['nf-v2v-w1', 'nf-v2v-w2'].forEach((id, wi) => {
    const el = document.getElementById(id);
    if (el && !el.dataset.built) {
      el.dataset.built = 'yes';
      const hs = wi === 0 ? v2vH1 : v2vH2;
      hs.forEach((h, i) => {
        const b = document.createElement('div'); b.className = 'nf-v2v-bar';
        b.style.setProperty('--h', h + 'px');
        b.style.setProperty('--dur', (1.2 + Math.random() * 0.7) + 's');
        b.style.setProperty('--del', (i * 0.06) + 's');
        b.style.background = wi === 0
          ? 'linear-gradient(to top, var(--rose), var(--petal))'
          : 'linear-gradient(to top, var(--sage), #B8D4C8)';
        el.appendChild(b);
      });
    }
  });
  const t2v = document.getElementById('nf-t2v-wave');
  if (t2v && !t2v.dataset.built) {
    t2v.dataset.built = 'yes';
    [6, 10, 16, 22, 18, 12, 8, 14, 20, 16, 10, 6].forEach((h, i) => {
      const b = document.createElement('div'); b.className = 'nf-t2v-bar';
      b.style.setProperty('--h', h + 'px');
      b.style.setProperty('--dur', (1.3 + Math.random() * 0.6) + 's');
      b.style.setProperty('--del', (i * 0.05) + 's');
      t2v.appendChild(b);
    });
  }
}

/* Live time */
setInterval(updateAppTime, perfLite ? 60000 : 30000);

/* ══ AUTH MODAL JS ══ */
function openAuthModal(tab) {
  if (tab === 'early') {
    showPage('join-beta');
    return;
  }
  closeMobileMenu();
  var overlay = document.getElementById('authModalOverlay');
  if (overlay) overlay.classList.add('active');
  switchAmTab(tab || 'signin');
  if (!window.matchMedia('(max-width: 440px)').matches) document.body.style.overflow = 'hidden';
}
function closeAuthModal() {
  var el = document.getElementById('authModalOverlay');
  if (el) el.classList.remove('active');
  document.body.style.overflow = '';
}
function handleAuthOverlayClick(e) {
  if (e.target === document.getElementById('authModalOverlay')) closeAuthModal();
}
function switchAmTab(tab) {
  const map = { signin: 'Signin', signup: 'Signup', early: 'Early' };
  Object.keys(map).forEach(t => {
    const tabEl = document.getElementById('amTab' + map[t]);
    const panelEl = document.getElementById('amPanel' + map[t]);
    if (tabEl) tabEl.classList.toggle('active', t === tab);
    if (panelEl) panelEl.classList.toggle('active', t === tab);
  });
  if (tab === 'signup') {
    showSignupStep(1);
  }
}
function showSignupStep(step) {
  var s1 = document.getElementById('amSignupStep1');
  var s2 = document.getElementById('amSignupStep2');
  var d1 = document.getElementById('amStepDot1');
  var d2 = document.getElementById('amStepDot2');
  if (!s1 || !s2) return;
  if (step === 1) {
    s1.style.display = '';
    s2.style.display = 'none';
    if (d1) d1.classList.add('active');
    if (d2) d2.classList.remove('active');
  } else {
    s1.style.display = 'none';
    s2.style.display = '';
    if (d1) d1.classList.remove('active');
    if (d2) d2.classList.add('active');
  }
}
function amSignupNextStep() {
  var emailEl = document.getElementById('amSignupEmail');
  var pwEl = document.getElementById('amSignupPw');
  var email = emailEl ? emailEl.value.trim() : '';
  var password = pwEl ? pwEl.value : '';
  if (!email || !password) { showToast('⚠️ Email and password required.'); return; }
  if (password.length < 6) { showToast('⚠️ Password must be at least 6 characters.'); return; }
  showSignupStep(2);
}
function amSignupPrevStep() {
  showSignupStep(1);
}
function selectAmMood(el) {
  el.closest('.am-mood-row').querySelectorAll('.am-mood-chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
}
function toggleAmPw(inputId, btn) {
  const inp = document.getElementById(inputId);
  const isHidden = inp.type === 'password';
  inp.type = isHidden ? 'text' : 'password';
  btn.innerHTML = isHidden
    ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
    : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
  btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
}
function updatePwStrength(val) {
  const bars = [1, 2, 3, 4].map(i => document.getElementById('amSb' + i));
  const len = val.length;
  const hasUpper = /[A-Z]/.test(val);
  const hasNum = /[0-9]/.test(val);
  const hasSpecial = /[^A-Za-z0-9]/.test(val);
  let score = 0;
  if (len >= 6) score++;
  if (len >= 10) score++;
  if (hasUpper || hasNum) score++;
  if (hasSpecial && len >= 8) score++;
  const cls = score <= 1 ? 'weak' : score <= 2 ? 'medium' : 'strong';
  bars.forEach((b, i) => {
    b.className = 'am-strength-bar';
    if (i < score) b.classList.add(cls);
  });
}
function handleAmSignin() {
  var emailEl = document.getElementById('amSigninEmail');
  var pwEl = document.getElementById('amSigninPw');
  var email = emailEl ? emailEl.value.trim() : '';
  var password = pwEl ? pwEl.value : '';
  if (!email || !password) { showToast('⚠️ Email and password required.'); return; }

  var submitBtn = document.querySelector('#amPanelSignin .am-submit');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.querySelector('span').textContent = 'Signing in…'; }

  window._getSupabaseClient().then(function (sb) {
    if (!sb) { showToast('⚠️ Auth not configured.'); if (submitBtn) { submitBtn.disabled = false; submitBtn.querySelector('span').textContent = 'Sign In'; } return; }
    sb.auth.signInWithPassword({ email: email, password: password }).then(function (result) {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.querySelector('span').textContent = 'Sign In'; }
      if (result.error) { showToast('❌ ' + (result.error.message || 'Sign in failed.')); return; }
      var token = result.data.session && result.data.session.access_token;
      if (token) { apiFetch('/api/auth/track-login', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token } }).catch(function () { }); }
      closeAuthModal();
      updateNavUser(email, '');
      showToast('👋 Welcome back!');
    }).catch(function (err) {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.querySelector('span').textContent = 'Sign In'; }
      showToast('❌ ' + (err.message || 'Sign in failed. Please try again.'));
    });
  }).catch(function () {
    showToast('⚠️ Cannot connect to auth service.');
    if (submitBtn) { submitBtn.disabled = false; submitBtn.querySelector('span').textContent = 'Sign In'; }
  });
}
function handleAmSignup() {
  var nameEl = document.getElementById('amSignupName');
  var displayEl = document.getElementById('amSignupDisplayName');
  var emailEl = document.getElementById('amSignupEmail');
  var pwEl = document.getElementById('amSignupPw');

  var hpEl = document.getElementById('a_password_desktop');
  if (hpEl && hpEl.value) {
    if (typeof window.showRegistrationSuccess === 'function') {
      window.showRegistrationSuccess(emailEl ? emailEl.value : '', false);
    }
    return;
  }

  var email = emailEl ? emailEl.value.trim() : '';
  var password = pwEl ? pwEl.value : '';
  var name = nameEl ? nameEl.value.trim() : '';
  var displayName = displayEl ? displayEl.value.trim() : name;
  var moodEl = document.querySelector('#amPanelSignup .am-mood-chip.selected');
  var mood = moodEl ? moodEl.textContent.trim() : '';

  if (!email || !password) { showToast('⚠️ Email and password required.'); return; }
  if (password.length < 6) { showToast('⚠️ Password must be at least 6 characters.'); return; }

  var submitBtn = document.querySelector('#amPanelSignup .am-submit');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.querySelector('span').textContent = 'Creating…'; }

  var payload = { email: email, password: password, display_name: displayName, full_name: name, mood: mood };
  apiFetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(function (res) {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.querySelector('span').textContent = 'Create Account'; }
    if (!res.ok) {
      var msg = (res.data && res.data.error) || 'Sign up failed.';
      showToast('❌ ' + msg);
      return;
    }
    var data = res.data || {};
    var token = data.access_token || (data.session && data.session.access_token);
    if (token) {
      // Update UI immediately — don't wait for Supabase client or setSession
      closeAuthModal();
      if (typeof updateNavUser === 'function') updateNavUser(email, displayName || name);
      if (typeof showRegistrationSuccess === 'function') showRegistrationSuccess(email, false);
      // Run session sync and on-signup in background (non-blocking)
      window._getSupabaseClient().then(function (sb) {
        if (sb && data.session) sb.auth.setSession({ access_token: data.session.access_token, refresh_token: data.session.refresh_token || '' }).catch(function () { });
        apiFetch('/api/auth/on-signup', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify({ display_name: displayName }) }).catch(function () { });
      }).catch(function () { });
    } else {
      if (typeof showVerificationPending === 'function') {
        showVerificationPending(email);
      } else {
        showToast('✉️ Please check your email inbox to verify your account!');
        closeAuthModal();
      }
    }
  }).catch(function (err) {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.querySelector('span').textContent = 'Create Account'; }
    var msg = (err && err.message) || 'Sign up failed. Please try again.';
    if (msg.toLowerCase().includes('429') || msg.toLowerCase().includes('rate')) msg = 'Too many attempts. Please wait a few minutes.';
    showToast('❌ ' + msg);
  });
}
/* ── JOIN BETA / EARLY ACCESS SUBMISSION ── */
function h11HandleSignup(e) {
  if (e) e.preventDefault();
  var fromH11 = e && e.target && e.target.closest && e.target.closest('#h11FormCard');
  var nameEl = fromH11 ? document.getElementById('h11NameInput') : (document.getElementById('join-beta')?.querySelector('#nameInput') || document.getElementById('nameInput'));
  var emailEl = fromH11 ? document.getElementById('h11EmailInput') : (document.getElementById('join-beta')?.querySelector('#emailInput') || document.getElementById('emailInput'));
  var btn = fromH11 ? document.querySelector('.h11-submit-btn') : (document.getElementById('join-beta')?.querySelector('.form-submit') || document.querySelector('.form-submit'));
  var aPasswordEl = fromH11 ? document.getElementById('h11_a_password') : document.querySelector('#join-beta [name="a_password"]') || document.querySelector('[name="a_password"]');
  var moodEl = fromH11 ? document.querySelector('#h11FormCard .h11-mood-chip.selected') : document.querySelector('#join-beta .form-mood-chip.selected');
  var aPassword = aPasswordEl ? aPasswordEl.value : '';
  var name = nameEl ? nameEl.value.trim() : '';
  var email = emailEl ? emailEl.value.trim() : '';
  var mood = moodEl ? moodEl.textContent.trim() : '';

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !EMAIL_RE.test(email)) {
    showToast('⚠️ Please enter a valid email address.');
    if (emailEl) { emailEl.focus(); emailEl.style.borderColor = '#D4607A'; setTimeout(function () { emailEl.style.borderColor = ''; }, 1500); }
    return;
  }

  if (btn) { btn.disabled = true; btn.innerHTML = 'Joining...'; }

  async function doWaitlist(retriesLeft) {
    try {
      var res = await apiFetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, name: name, mood: mood || undefined, a_password: aPassword }),
      });
      if (!res.ok) {
        var msg = (res.data && res.data.error) || 'Something went wrong. Please try again.';
        if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('duplicate')) msg = 'This email is already on the waitlist! 🎉';
        // Network error (status 0) — auto-retry instead of showing "Failed to fetch"
        var isNetworkError = res.status === 0 || (msg && /failed to fetch|network|connection/i.test(msg));
        if (isNetworkError && retriesLeft > 0) {
          showToast('⚠️ Connection slow. Retrying in 5 sec…');
          if (btn) { btn.innerHTML = 'Retrying…'; }
          setTimeout(function () { doWaitlist(retriesLeft - 1); }, 5000);
          return;
        }
        if (isNetworkError) msg = 'Connection failed. Try WiFi or tap again—server may be waking up.';
        showToast('❌ ' + msg);
        if (btn) { btn.disabled = false; btn.innerHTML = 'Get Early Access 🎙️'; }
        return;
      }
      if (btn) { btn.innerHTML = '✓ You\'re on the list!'; btn.style.background = 'linear-gradient(135deg,#7A9E87,#4A8C6F)'; }
      showToast('🎉 You\'re on the waitlist! Your voice will be heard.');
      if (nameEl) nameEl.value = '';
      if (emailEl) emailEl.value = '';
    } catch (err) {
      if (retriesLeft > 0) {
        showToast('⚠️ Retrying in 5 sec…');
        if (btn) { btn.innerHTML = 'Retrying…'; }
        setTimeout(function () { doWaitlist(retriesLeft - 1); }, 5000);
      } else {
        var msg = /localhost|127\.0\.0\.1/.test(location.hostname)
          ? 'Connection error. Is the backend running?'
          : 'Connection failed. Try WiFi or tap again.';
        showToast('❌ ' + msg);
        if (btn) { btn.disabled = false; btn.innerHTML = 'Get Early Access 🎙️'; }
      }
    }
  }
  doWaitlist(2);
}

function heroSignup() {
  var input = document.getElementById('heroEmailInput');
  var val = input ? input.value.trim() : '';
  var target = document.getElementById('emailInput');
  if (target && val) target.value = val;
  showPage('join-beta');
}

function handleSignup(e) { h11HandleSignup(e); }
function handleAmEarlyAccess() { showPage('join-beta'); }

/* ── Safety wrappers: prevent UI freeze on errors ── */
(function wrapCriticalFunctions() {
  function safeWrap(fn, name) {
    if (!fn) return fn;
    return function () {
      try {
        if (window._wmLog) window._wmLog(name, arguments.length ? Array.prototype.slice.call(arguments) : '');
        return fn.apply(this, arguments);
      } catch (e) {
        console.error('[WM]', name, 'error:', e);
        if (typeof showToast === 'function') showToast('Something went wrong. Please try again.');
      }
    };
  }
  openAuthModal = safeWrap(openAuthModal, 'openAuthModal');
  closeAuthModal = safeWrap(closeAuthModal, 'closeAuthModal');
  showPage = safeWrap(showPage, 'showPage');
  toggleMobileMenu = safeWrap(toggleMobileMenu, 'toggleMobileMenu');
  closeApp = safeWrap(closeApp, 'closeApp');
  handleAmSignin = safeWrap(handleAmSignin, 'handleAmSignin');
  handleAmSignup = safeWrap(handleAmSignup, 'handleAmSignup');
  h11HandleSignup = safeWrap(h11HandleSignup, 'h11HandleSignup');
  heroSignup = safeWrap(heroSignup, 'heroSignup');
  openMobileMenu = safeWrap(openMobileMenu, 'openMobileMenu');
  handleMobileNavOverlay = safeWrap(handleMobileNavOverlay, 'handleMobileNavOverlay');
})();

/* Also close modals on ESC (guard against duplicate listeners) */
if (!window._wmEscapeBound) {
  window._wmEscapeBound = true;
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      try {
        if (document.getElementById('regSuccessOverlay')) { if (typeof closeRegSuccessOverlay === 'function') closeRegSuccessOverlay(); return; }
        var fp = document.getElementById('forgotPasswordOverlay');
        var sp = document.getElementById('setNewPasswordOverlay');
        if (fp && fp.classList.contains('active')) { if (typeof closeForgotPasswordModal === 'function') closeForgotPasswordModal(); return; }
        if (sp && sp.classList.contains('active')) { if (typeof closeSetNewPasswordModal === 'function') closeSetNewPasswordModal(); return; }
        if (typeof closeAuthModal === 'function') closeAuthModal();
        if (typeof closeApp === 'function') closeApp();
        if (typeof closeMobileMenu === 'function') closeMobileMenu();
        if (typeof closeRecord === 'function') closeRecord();
      } catch (err) {
        console.error('[WM] Escape handler error:', err);
      }
    }
  });
}

/* // HERO PARALLAX: dark ambient depth */
(function heroAmbientParallax() {
  const hero = document.getElementById('cream-hero');
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  if (!hero || perfLite || !finePointer) return;

  function setFromEvent(e) {
    const r = hero.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    hero.style.setProperty('--mx', x.toFixed(2));
    hero.style.setProperty('--my', y.toFixed(2));
  }

  hero.addEventListener('pointermove', setFromEvent, { passive: true });
  hero.addEventListener('pointerleave', () => {
    hero.style.setProperty('--mx', '50');
    hero.style.setProperty('--my', '50');
  });
})();

/* ── HERO 3D PARALLAX — Apple-style depth tracking ── */
(function hero3dParallax() {
  const scene = document.getElementById('hero3dScene');
  const layerBack = document.getElementById('hero3dLayerBack');
  const layerMid = document.getElementById('hero3dLayerMid');
  const layerFront = document.getElementById('hero3dLayerFront');
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  if (!scene || !layerBack || !layerMid || !layerFront) return;
  if (isMobilePerf || !finePointer) return;

  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;
  let rafId = null;
  let active = false;

  function lerp(a, b, t) { return a + (b - a) * t; }

  function animate() {
    currentX = lerp(currentX, targetX, 0.06);
    currentY = lerp(currentY, targetY, 0.06);

    // Back layer — subtle movement (opposite direction for depth)
    const bx = currentX * -8;
    const by = currentY * -6;
    layerBack.style.transform =
      'translate3d(' + bx.toFixed(2) + 'px, ' + by.toFixed(2) + 'px, 0)';

    // Mid layer — medium movement
    const mx = currentX * -15;
    const my = currentY * -12;
    layerMid.style.transform =
      'translate3d(' + mx.toFixed(2) + 'px, ' + my.toFixed(2) + 'px, 0)';

    // Front layer — strong movement
    const fx = currentX * -25;
    const fy = currentY * -20;
    layerFront.style.transform =
      'translate3d(' + fx.toFixed(2) + 'px, ' + fy.toFixed(2) + 'px, 0)';

    if (Math.abs(targetX - currentX) > 0.01 || Math.abs(targetY - currentY) > 0.01) {
      rafId = requestAnimationFrame(animate);
    } else {
      active = false;
    }
  }

  function startAnimation() {
    if (!active) {
      active = true;
      rafId = requestAnimationFrame(animate);
    }
  }

  const heroSection = document.getElementById('hero-v11');
  if (!heroSection) return;

  heroSection.addEventListener('pointermove', function (e) {
    var rect = heroSection.getBoundingClientRect();
    targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    startAnimation();
  }, { passive: true });

  heroSection.addEventListener('pointerleave', function () {
    targetX = 0;
    targetY = 0;
    startAnimation();
  });
})();
