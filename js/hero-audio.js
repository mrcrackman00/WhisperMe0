/**
 * Hero Voice Card Audio Playback
 * Single-audio playback, play/pause UI, smooth interactions
 */
(function () {
  const AUDIO_BASE = 'audio/';
  function audioUrl(path) { return new URL(path, window.location.href).href; }
  const CARD_AUDIO = {
    'hero-vcard-1': 'creativity-chaos.mp3',
    'hero-vcard-2': 'silence-underrated.mp3',
    'hero-vcard-3': 'city-at-rest.mp3',
    'hero-vcard-4': 'changed-mind-ai.mp3',
    'hero-vcard-5': 'story-perspective.mp3'
  };

  let currentAudio = null;
  let currentCard = null;

  function getPlayBtn(card) {
    return card && card.querySelector && card.querySelector('.hvc-play');
  }

  function getWave(card) {
    return card && card.querySelector && card.querySelector('.hvc-wave');
  }

  function getDurEl(card) {
    return card && card.querySelector && card.querySelector('.hvc-dur');
  }

  function formatTime(sec) {
    if (!isFinite(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function parseDuration(str) {
    if (!str) return 0;
    const parts = String(str).split(':');
    if (parts.length >= 2) return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    return 0;
  }

  function setPlaying(card, playing) {
    if (!card) return;
    const btn = getPlayBtn(card);
    const wave = getWave(card);
    if (btn) {
      btn.classList.toggle('hvc-playing', playing);
      btn.setAttribute('aria-label', playing ? 'Pause' : 'Listen');
    }
    if (wave) wave.classList.toggle('hvc-wave-active', playing);
  }

  let timeInterval = null;

  function stopAll() {
    if (timeInterval) {
      clearInterval(timeInterval);
      timeInterval = null;
    }
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
    if (currentCard) {
      const durEl = getDurEl(currentCard);
      if (durEl && durEl.dataset.duration) durEl.textContent = durEl.dataset.duration;
      setPlaying(currentCard, false);
      currentCard = null;
    }
  }

  function startTimeUpdate(audio, card) {
    if (timeInterval) clearInterval(timeInterval);
    const durEl = getDurEl(card);
    if (!durEl) return;
    if (!durEl.dataset.duration) durEl.dataset.duration = durEl.textContent.trim() || '0:00';
    const total = audio.duration;
    const update = () => {
      if (audio.paused || audio.ended) return;
      const cur = audio.currentTime;
      const totStr = isFinite(total) && total > 0 ? formatTime(total) : (durEl.dataset.duration || '0:00');
      durEl.textContent = formatTime(cur) + ' / ' + totStr;
    };
    timeInterval = setInterval(update, 250);
    update();
  }

  function toggleCard(card) {
    if (!card || !card.classList) return;
    const id = Array.from(card.classList).find(c => c.startsWith('hero-vcard-'));
    const src = id && CARD_AUDIO[id] ? audioUrl(AUDIO_BASE + CARD_AUDIO[id]) : null;
    if (!src) return;

    const btn = getPlayBtn(card);
    const wasThis = currentCard === card;

    if (currentAudio && currentCard !== card) {
      stopAll();
    }

    if (wasThis && currentAudio && !currentAudio.paused) {
      currentAudio.pause();
      if (timeInterval) { clearInterval(timeInterval); timeInterval = null; }
      const durEl = getDurEl(card);
      if (durEl && durEl.dataset.duration) durEl.textContent = durEl.dataset.duration;
      setPlaying(card, false);
      currentCard = null;
      currentAudio = null;
      return;
    }

    if (!currentAudio || currentCard !== card) {
      currentAudio = new Audio(src);
      currentCard = card;
      currentAudio.addEventListener('ended', () => {
        const c = currentCard;
        if (timeInterval) { clearInterval(timeInterval); timeInterval = null; }
        const durEl = getDurEl(c);
        if (durEl && durEl.dataset.duration) durEl.textContent = durEl.dataset.duration;
        setPlaying(c, false);
        currentCard = null;
        currentAudio = null;
      });
      currentAudio.addEventListener('loadedmetadata', () => {
        if (currentCard === card && currentAudio) {
          const durEl = getDurEl(card);
          if (durEl && !durEl.dataset.duration) durEl.dataset.duration = formatTime(currentAudio.duration);
        }
      });
      currentAudio.addEventListener('error', () => {
        if (timeInterval) { clearInterval(timeInterval); timeInterval = null; }
        setPlaying(currentCard, false);
        currentCard = null;
        currentAudio = null;
      });
    }

    currentAudio.play().catch(() => {
      stopAll();
    });
    setPlaying(card, true);
    startTimeUpdate(currentAudio, card);
  }

  function init() {
    document.querySelectorAll('.hero-vcard').forEach(card => {
      const btn = getPlayBtn(card);
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleCard(card);
        });
      }
      card.addEventListener('click', (e) => {
        if (e.target.closest('.hvc-play')) return;
        toggleCard(card);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        toggleCard(card);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
