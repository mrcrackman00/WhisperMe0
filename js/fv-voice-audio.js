/**
 * FV Voice Post Card Audio — Voice First Social & Product Preview
 * Uses Voice Universe audio (quiet-joy.mp3)
 */
(function () {
  const AUDIO_BASE = 'audio/';
  const FV_AUDIO = 'quiet-joy.mp3'; // from Voice Universe

  let currentAudio = null;
  let currentCard = null;

  function formatTime(sec) {
    if (!isFinite(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function getPlayBtn(card) {
    return card && card.querySelector && card.querySelector('.fv-vc-play, .fv-pc-play, .ww-play-btn, .nf-play-btn, .comm-play-btn');
  }

  function getDurEl(card) {
    if (!card || !card.querySelector) return null;
    if (card.classList && card.classList.contains('ww-card')) {
      return card.querySelector('.ww-time') || card.querySelector('.ww-va-dur');
    }
    if (card.classList && card.classList.contains('comm-voice-card')) {
      return card.querySelector('.comm-vc-dur');
    }
    return card.querySelector('.fv-vc-dur, .fv-pc-dur');
  }

  function getWaveEl(card) {
    return card && card.querySelector && card.querySelector('.fv-vc-wave, .fv-pc-wave, .ww-waveform, .ww-voice-visual, .nf-waveform, .comm-waveform');
  }

  function setPlaying(card, playing) {
    if (!card) return;
    const btn = getPlayBtn(card);
    const wave = getWaveEl(card);
    if (btn) {
      btn.textContent = playing ? '❚❚' : '▶';
      btn.classList.toggle('fv-pc-play-active', playing);
    }
    if (wave) wave.classList.toggle('fv-wave-playing', playing);
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
      if (durEl) {
        const d = durEl.dataset.duration;
        durEl.textContent = (currentCard.classList && currentCard.classList.contains('ww-card') && d)
          ? '0:00 / ' + d : (d || durEl.textContent);
      }
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

  function audioUrl(path) {
    return new URL(path, window.location.href).href;
  }

  function toggleCard(card) {
    if (!card || !card.dataset || !card.dataset.fvAudio) return;
    const src = audioUrl(AUDIO_BASE + card.dataset.fvAudio);
    const btn = getPlayBtn(card);
    const wasThis = currentCard === card;

    if (currentAudio && currentCard !== card) {
      stopAll();
    }

    if (wasThis && currentAudio) {
      if (currentAudio.paused) {
        currentAudio.play();
        setPlaying(card, true);
        startTimeUpdate(currentAudio, card);
      } else {
        currentAudio.pause();
        setPlaying(card, false);
        if (timeInterval) clearInterval(timeInterval);
        const durEl = getDurEl(card);
        if (durEl && durEl.dataset.duration) durEl.textContent = durEl.dataset.duration;
      }
      return;
    }

    currentCard = card;
    currentAudio = new Audio(src);
    currentAudio.addEventListener('loadedmetadata', () => {
      const durEl = getDurEl(card);
      if (durEl && isFinite(currentAudio.duration)) {
        durEl.dataset.duration = formatTime(currentAudio.duration);
      }
    });
    currentAudio.addEventListener('ended', stopAll);
    currentAudio.addEventListener('error', stopAll);
    currentAudio.play().catch(stopAll);
    setPlaying(card, true);
    startTimeUpdate(currentAudio, card);
  }

  function init() {
    const cards = document.querySelectorAll('[data-fv-audio]');
    cards.forEach((card) => {
      const btn = getPlayBtn(card);
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleCard(card);
        });
        btn.setAttribute('role', 'button');
        btn.setAttribute('aria-label', 'Play voice');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
