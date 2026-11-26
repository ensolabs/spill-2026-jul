'use strict';

(() => {
  const $ = id => document.getElementById(id);
  const watches = [4, 3, 2];
  const names = ['first', 'second', 'last'];
  const draw = harbourView($('harbour'));
  const model = { beat: 0, pulse: 0, reaction: '', rung: -Infinity };
  let phase = 'ready', round = 0, period = 0, firstBeat = 0;
  let sound = false, audio = null, volume = null;
  const results = [];

  function manifest() {
    const home = results.reduce((sum, r) => sum + r.aboard, 0);
    $('tally').textContent = home + ' / 12 home on time';
    $('calls').replaceChildren(...watches.map((_, i) => {
      const row = document.createElement('li'), result = results[i];
      row.textContent = 'Watch ' + (i + 1) + ' · ' + (result ? result.aboard + '/4' : '—');
      if (result) row.dataset.outcome = result.reaction;
      return row;
    }));
    return home;
  }
  function tone(hz, duration, strength, delay = 0) {
    if (!sound || audio?.state !== 'running') return;
    const oscillator = audio.createOscillator(), envelope = audio.createGain();
    const start = audio.currentTime + delay;
    oscillator.frequency.value = hz;
    envelope.gain.setValueAtTime(.0001, start);
    envelope.gain.exponentialRampToValueAtTime(strength, start + .006);
    envelope.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(envelope).connect(volume);
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
    oscillator.start(start);
    oscillator.stop(start + duration + .01);
  }

  function soundLabel() {
    $('sound').textContent = sound ? 'Sound on' : 'Sound off';
    $('sound').setAttribute('aria-pressed', String(sound));
  }
  $('sound').onclick = async () => {
    if (sound) {
      sound = false;
      volume.gain.value = 0;
    } else {
      try {
        const Context = window.AudioContext || window.webkitAudioContext;
        if (!audio) {
          audio = new Context();
          volume = audio.createGain();
          volume.connect(audio.destination);
        }
        await audio.resume();
        sound = audio.state === 'running';
        volume.gain.value = sound ? .65 : 0;
      } catch {
        $('announcement').textContent = 'Sound is unavailable. Follow the clock face to play.';
      }
    }
    soundLabel();
  };

  function watchLabel() {
    $('watch').textContent = 'Watch 0' + (round + 1) + ' / 03';
  }
  function start(now) {
    if (phase === 'finished') { round = 0; results.length = 0; }
    else if (phase === 'result') round++;
    // Beat one has its own lead-in. Twelve lands eleven intervals after one.
    if (phase !== 'interrupted') period = 650 + Math.round(Math.random() * 300);
    firstBeat = now + 750;
    phase = 'playing';
    Object.assign(model, { beat: 0, pulse: 0, reaction: '', rung: -Infinity });
    $('result').hidden = true;
    watchLabel(); manifest();
    $('headline').textContent = 'Watch the clock.';
    $('hint').textContent = 'The first ' + ['four', 'three', 'two'][round] + ' beats are visible. Keep their pace through twelve to bring four passengers home on time.';
    $('announcement').textContent = $('hint').textContent;
    $('action').textContent = 'Pull the rope';
    // Keep focus on the control, including across keyboard-only watches.
    $('action').setAttribute('aria-disabled', 'true');
  }
  function ring(now) {
    if (now < firstBeat + (watches[round] - 1) * period) return;
    const delta = Math.round(now - (firstBeat + 11 * period));
    const exact = Math.abs(delta) <= 125;
    const reaction = exact ? 'together' : delta < 0 ? 'early' : 'late';
    // One more traveller misses the sailing or connection for each quarter-beat of error.
    const missed = Math.min(4, Math.ceil(Math.max(0, Math.abs(delta) - 125) / (period / 4)));
    const aboard = 4 - missed;
    results.push({delta, reaction, aboard});
    const home = manifest();
    phase = round === watches.length - 1 ? 'finished' : 'result';
    Object.assign(model, { beat: 12, pulse: 0, reaction, missed, rung: now });
    const deltaText = Math.abs(delta) + ' ms ' + (delta < 0 ? 'early' : 'late');
    $('headline').textContent = exact ? 'Right on twelve.' : deltaText + '.';
    const who = missed === 1 ? 'One passenger' : missed + ' passengers';
    $('hint').textContent = exact ? 'All four passengers board and make the last connection.'
      : reaction === 'early' ? 'The ferry casts off before everyone boards. ' + who + (missed === 1 ? ' stays' : ' stay') + ' on the quay.'
      : 'The ferry waits for your bell and arrives behind schedule. ' + who + (missed === 1 ? ' misses' : ' miss') + ' the last connection.';
    if (phase === 'finished') $('hint').textContent += home === 12 ? ' Perfect shift. Everyone is home on time.' : ' Shift complete. ' + home + ' of 12 made it home on time.';
    tone(220, 2.6, .32); tone(551, 1.8, .16); tone(897, 1.1, .075);
    if (exact) { tone(98, 1.2, .32, .24); tone(147, 1.1, .09, .24); }
    $('result').hidden = false;
    $('needle').style.left = Math.max(0, Math.min(100, 50 + delta / 25)) + '%';
    const mean = Math.round(results.reduce((sum, d) => sum + Math.abs(d.delta), 0) / results.length);
    $('ledger').textContent = results.length === 1 ? 'Timing error · ' + Math.abs(delta) + ' ms' : 'Average error · ' + mean + ' ms';
    $('action').removeAttribute('aria-disabled');
    $('action').textContent = phase === 'finished' ? 'Play again' : 'Start ' + names[round+1] + ' watch';
    $('announcement').textContent = [$('headline').textContent, $('hint').textContent, $('ledger').textContent].join(' ');
  }
  function act() {
    const now = performance.now();
    if (phase === 'playing') ring(now);
    else start(now);
  }
  $('action').onclick = act;
  document.addEventListener('keydown', event => {
    const target = event.composedPath()[0];
    if (event.code !== 'Space' || event.altKey || event.ctrlKey || event.metaKey ||
        (target !== $('action') && target !== document.body && target !== document.documentElement)) return;
    event.preventDefault();
    if (!event.repeat) act();
  });
  function interrupt() {
    if (phase !== 'playing') return;
    phase = 'interrupted';
    model.beat = 0; model.pulse = 0;
    $('headline').textContent = 'Watch paused.';
    $('hint').textContent = 'Restart this watch to see the opening beats again.';
    $('announcement').textContent = $('hint').textContent;
    $('action').removeAttribute('aria-disabled');
    $('action').textContent = 'Restart watch';
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) interrupt(); });
  document.addEventListener('click', event => {
    const nav = document.querySelector('arcade-nav');
    if (event.composedPath().includes(nav) && nav.shadowRoot?.querySelector('button')?.getAttribute('aria-expanded') === 'true') interrupt();
  });

  function frame(now) {
    if (phase === 'playing' && now >= firstBeat) {
      const beat = Math.min(watches[round], Math.floor((now - firstBeat) / period) + 1);
      if (beat !== model.beat) {
        model.beat = beat;
        tone(beat % 2 ? 1160 : 980, .075, .17);
        $('announcement').textContent = String(beat);
        if (beat === watches[round]) {
          $('headline').textContent = 'Keep counting…';
          $('hint').textContent = 'The clock has stuck on ' + beat + '. Pull the rope when your count reaches twelve.';
          $('action').removeAttribute('aria-disabled');
        }
      }
      const age = now - (firstBeat + (beat - 1) * period);
      model.pulse = Math.max(0, 1 - age / 220);
    }
    draw(model, now);
    requestAnimationFrame(frame);
  }
  manifest();
  requestAnimationFrame(frame);
})();
