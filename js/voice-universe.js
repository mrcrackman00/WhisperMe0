/**
 * Voice Universe — constellation of voice nodes
 * Lightweight, optimized for performance
 */
(function() {
  var AUDIO_BASE = 'audio/';
  var NODES = [
    { id: 0, x: 18, y: 25, mood: 'Late Night Thoughts', caption: 'Those 2am ideas that feel too raw for daylight.', color: 'var(--violet)', audio: 'late-night-thoughts.mp3' },
    { id: 1, x: 82, y: 18, mood: 'Creative Spark', caption: 'When inspiration hits and you need to capture it.', color: 'var(--rose)', audio: 'creative-spark.mp3' },
    { id: 2, x: 50, y: 45, mood: 'Calm Reflection', caption: 'A moment of quiet clarity in the noise.', color: 'var(--sage)', audio: 'city-at-rest.mp3' },
    { id: 3, x: 25, y: 68, mood: 'Random Idea', caption: 'Half-formed thoughts that might become something.', color: 'var(--amber)', audio: 'random-idea.mp3' },
    { id: 4, x: 75, y: 72, mood: 'Unfiltered Moment', caption: 'Raw emotion, no edits, just you.', color: 'var(--coral)', audio: 'unfiltered-moment.mp3' },
    { id: 5, x: 12, y: 48, mood: 'Honest Doubt', caption: 'Questions you\'re not sure you should ask.', color: 'var(--sky)', audio: 'honest-doubt.mp3' },
    { id: 6, x: 88, y: 55, mood: 'Quiet Joy', caption: 'Small wins that deserve to be shared.', color: 'var(--rose)', audio: 'quiet-joy.mp3' },
    { id: 7, x: 50, y: 82, mood: 'Vulnerable Truth', caption: 'What you\'d only say when you feel safe.', color: 'var(--violet)', audio: 'vulnerable-truth.mp3' }
  ];

  var CONNECTIONS = [[0,2],[1,2],[2,3],[2,4],[2,7],[3,4],[5,0],[6,1],[4,7]];

  var canvasWrap = document.getElementById('vuCanvasWrap');
  var nodesEl = document.getElementById('vuNodes');
  var connEl = document.getElementById('vuConnections');
  var mobileInner = document.getElementById('vuMobileInner');
  var mobileScroll = document.getElementById('vuMobileScroll');
  var cardOverlay = document.getElementById('vuCardOverlay');
  var card = document.getElementById('vuCard');
  var cardClose = document.getElementById('vuCardClose');
  var cardPlay = document.getElementById('vuCardPlay');
  var cardCaption = document.getElementById('vuCardCaption');
  var cardWave = document.getElementById('vuCardWave');
  var cardTime = document.getElementById('vuCardTime');
  var cardMood = document.getElementById('vuCardMood');
  var cardProgress = document.getElementById('vuCardProgress');

  if (!nodesEl) return;

  function formatTime(sec) {
    if (!isFinite(sec) || sec < 0) return '0:00';
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  var isMobile = function() { return window.innerWidth <= 768; };
  var playingNode = null;
  var playTimer = null;
  var audioCtx = null;
  var currentAudio = null;
  var preloadAudio = null;

  function createWaveBars() {
    var html = '';
    for (var i = 0; i < 6; i++) html += '<span></span>';
    return html;
  }

  function createNode(data) {
    var div = document.createElement('div');
    div.className = 'vu-node';
    div.dataset.id = data.id;
    div.dataset.color = data.color || 'var(--rose)';
    div.style.left = data.x + '%';
    div.style.top = data.y + '%';
    div.style.transform = 'translate(-50%, -50%)';
    div.style.setProperty('--node-color', data.color || 'var(--rose)');
    div.innerHTML = '<div class="vu-node-bubble"><div class="vu-node-wave">' + createWaveBars() + '</div></div><span class="vu-node-label">' + data.mood + '</span>';
    div.addEventListener('click', function(e) {
      e.stopPropagation();
      showCard(data);
    });
    return div;
  }

  function setProgress(pct) {
    if (cardProgress) cardProgress.style.width = (pct * 100) + '%';
  }

  function audioUrl(path) {
    return new URL(path, window.location.href).href;
  }

  function showCard(data) {
    cardCaption.textContent = data.caption;
    if (cardMood) cardMood.textContent = data.mood || '';
    playingNode = data;
    setProgress(0);
    if (cardTime) cardTime.textContent = '0:00';
    cardOverlay.classList.add('visible');
    animateCardWave();
    if (preloadAudio) {
      preloadAudio.pause();
      preloadAudio.currentTime = 0;
      preloadAudio = null;
    }
    if (data.audio) {
      preloadAudio = new Audio(audioUrl(AUDIO_BASE + data.audio));
      preloadAudio.addEventListener('loadedmetadata', function() {
        if (cardTime && preloadAudio && playingNode === data) {
          cardTime.textContent = '0:00 / ' + formatTime(preloadAudio.duration);
        }
      });
    }
  }

  function hideCard() {
    cardOverlay.classList.remove('visible');
    stopPlay();
    if (preloadAudio) {
      preloadAudio.pause();
      preloadAudio = null;
    }
  }

  function animateCardWave() {
    cardWave.innerHTML = '';
    for (var i = 0; i < 12; i++) {
      var s = document.createElement('span');
      s.style.animationDelay = (i * 0.05) + 's';
      s.style.animation = 'vuWaveBar 1s ease-in-out infinite';
      cardWave.appendChild(s);
    }
  }

  function stopPlay() {
    var lastDuration = (currentAudio && isFinite(currentAudio.duration)) ? currentAudio.duration : (preloadAudio && isFinite(preloadAudio.duration)) ? preloadAudio.duration : null;
    cardPlay.classList.remove('playing');
    cardPlay.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
    if (playTimer) clearTimeout(playTimer);
    playTimer = null;
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
    if (audioCtx) try { audioCtx.close(); } catch(e) {}
    audioCtx = null;
    setProgress(0);
    if (cardTime) {
      cardTime.textContent = lastDuration ? '0:00 / ' + formatTime(lastDuration) : '0:00';
    }
  }

  function updateTimeDisplay() {
    if (!currentAudio) return;
    var cur = currentAudio.currentTime;
    var dur = currentAudio.duration;
    if (cardTime) {
      if (isFinite(dur) && dur > 0) {
        cardTime.textContent = formatTime(cur) + ' / ' + formatTime(dur);
      } else {
        cardTime.textContent = formatTime(cur);
      }
    }
    if (cardProgress && isFinite(dur) && dur > 0) {
      setProgress(cur / dur);
    }
  }

  function playDemo() {
    if (cardPlay.classList.contains('playing')) {
      stopPlay();
      return;
    }
    if (!playingNode || !playingNode.audio) {
      stopPlay();
      return;
    }
    cardPlay.classList.add('playing');
    cardPlay.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>';
    animateCardWave();
    setProgress(0);
    if (cardTime) cardTime.textContent = '0:00';
    if (preloadAudio && preloadAudio.src && preloadAudio.src.indexOf(playingNode.audio) !== -1) {
      currentAudio = preloadAudio;
      preloadAudio = null;
    } else {
      if (preloadAudio) { preloadAudio.pause(); preloadAudio = null; }
      currentAudio = new Audio(audioUrl(AUDIO_BASE + playingNode.audio));
    }
    currentAudio.addEventListener('loadedmetadata', function() {
      if (cardTime && currentAudio) cardTime.textContent = '0:00 / ' + formatTime(currentAudio.duration);
    });
    currentAudio.addEventListener('timeupdate', updateTimeDisplay);
    currentAudio.addEventListener('ended', stopPlay);
    currentAudio.addEventListener('error', stopPlay);
    currentAudio.play().catch(stopPlay);
  }

  function drawConnections() {
    if (!connEl || isMobile()) return;
    var w = connEl.clientWidth || 800;
    var h = connEl.clientHeight || 400;
    var svgNS = 'http://www.w3.org/2000/svg';
    connEl.innerHTML = '';
    var defs = document.createElementNS(svgNS, 'defs');
    var grad = document.createElementNS(svgNS, 'linearGradient');
    grad.setAttribute('id', 'vuLineGrad');
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '100%');
    var s1 = document.createElementNS(svgNS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#D4607A'); s1.setAttribute('stop-opacity', '0.5');
    var s2 = document.createElementNS(svgNS, 'stop');
    s2.setAttribute('offset', '50%'); s2.setAttribute('stop-color', '#E8846A'); s2.setAttribute('stop-opacity', '0.4');
    var s3 = document.createElementNS(svgNS, 'stop');
    s3.setAttribute('offset', '100%'); s3.setAttribute('stop-color', '#F2C4CE'); s3.setAttribute('stop-opacity', '0.5');
    grad.appendChild(s1); grad.appendChild(s2); grad.appendChild(s3);
    defs.appendChild(grad);
    connEl.appendChild(defs);
    var positions = {};
    NODES.forEach(function(n) {
      positions[n.id] = { x: (n.x / 100) * w, y: (n.y / 100) * h };
    });
    CONNECTIONS.forEach(function(pair) {
      var a = positions[pair[0]];
      var b = positions[pair[1]];
      if (!a || !b) return;
      var line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', a.x);
      line.setAttribute('y1', a.y);
      line.setAttribute('x2', b.x);
      line.setAttribute('y2', b.y);
      connEl.appendChild(line);
    });
  }

  function initDesktop() {
    if (!nodesEl) return;
    nodesEl.innerHTML = '';
    NODES.forEach(function(n) {
      nodesEl.appendChild(createNode(n));
    });
    drawConnections();
  }

  function initMobile() {
    if (!mobileInner) return;
    mobileInner.innerHTML = '';
    NODES.forEach(function(n) {
      var div = createNode(n);
      div.className = 'vu-node vu-mobile-node';
      mobileInner.appendChild(div);
    });
  }

  function toggleView() {
    if (isMobile()) {
      if (canvasWrap) canvasWrap.style.display = 'none';
      if (mobileScroll) mobileScroll.style.display = 'flex';
      initMobile();
    } else {
      if (canvasWrap) canvasWrap.style.display = 'block';
      if (mobileScroll) mobileScroll.style.display = 'none';
      initDesktop();
    }
  }

  if (cardClose) cardClose.addEventListener('click', hideCard);
  if (cardOverlay) cardOverlay.addEventListener('click', function(e) { if (e.target === cardOverlay) hideCard(); });
  if (cardPlay) cardPlay.addEventListener('click', playDemo);
  if (card) card.addEventListener('click', function(e) { e.stopPropagation(); });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && cardOverlay && cardOverlay.classList.contains('visible')) hideCard();
  });

  toggleView();
  window.addEventListener('resize', function() {
    clearTimeout(window._vuResize);
    window._vuResize = setTimeout(function() {
      toggleView();
      drawConnections();
    }, 150);
  });

  // Pause animations when section mostly off-screen — reduces scroll lag
  var vuSection = document.getElementById('voice-universe');
  if (vuSection && 'IntersectionObserver' in window) {
    var vuObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        var pause = !e.isIntersecting || e.intersectionRatio < 0.25;
        vuSection.classList.toggle('vu-paused', pause);
      });
    }, { rootMargin: '80px', threshold: [0, 0.1, 0.25, 0.5, 1] });
    vuObs.observe(vuSection);
  }
})();
