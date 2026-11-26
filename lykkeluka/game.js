'use strict';

(() => {
  const el = id => document.getElementById(id);
  const paint = raffleDrum(el('drum'));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const ticketLimit = 3;
  const recordKey = 'enso-arcade.lykkeluka.best.v1';
  let ticket, total, pot, remaining, history, phase, message, jackpot, spin = 0;

  function newTicket() {
    remaining = Array.from({length:13}, (_, i) => i + 1);
    history = [];
    pot = 0;
    spin = 0;
    jackpot = false;
    phase = 'open';
    message = 'The drum is full. Give it a turn.';
  }
  function replay() {
    total = 0;
    ticket = 1;
    newTicket();
    render();
  }
  function record() {
    try {
      const previous = Number(localStorage.getItem(recordKey)) || 0;
      const best = Math.max(total, previous);
      localStorage.setItem(recordKey, String(best));
      return ' Personal best: ' + best + ' ★.';
    } catch {
      return '';
    }
  }
  function closeTicket(award, explanation) {
    total += award;
    pot = award;
    phase = ticket === ticketLimit ? 'finished' : 'closed';
    message = explanation;
    if (phase === 'finished') message += ' Three tickets played.' + record();
  }
  function art(releasing = null) {
    paint({balls:remaining, spin, last:history.length ? history[history.length-1] : null, jackpot, releasing});
  }
  function render() {
    const closed = phase === 'closed' || phase === 'finished';
    el('serial').textContent = 'Ticket ' + ticket + ' of ' + ticketLimit;
    el('banked').textContent = total + ' ★ banked';
    el('risk').textContent = closed ? 'Ticket closed' : '1 in ' + remaining.length;
    el('pot-label').textContent = phase === 'finished' ? 'Final score' : closed ? 'Banked this ticket' : 'Stars on this ticket';
    el('pot').textContent = phase === 'finished' ? total : pot;
    el('history').replaceChildren(...history.map(value => {
      const b = document.createElement('span');
      b.className = value === 13 ? 'ball bad' : 'ball';
      b.textContent = value;
      return b;
    }));
    el('draw').setAttribute('aria-disabled', String(phase === 'turning'));
    el('draw').textContent = {open:'Turn the crank', turning:'Turning…', closed:'Next ticket', finished:'Play again'}[phase];
    el('bank').disabled = phase !== 'open' || pot === 0;
    el('bank').textContent = !closed && pot ? 'Bank ' + pot + ' ★' : 'Bank stars';
    el('message').textContent = message;
    art();
  }
  function reveal(index) {
    const [value] = remaining.splice(index, 1);
    history.push(value);
    spin = 0;
    phase = 'open';
    if (value === 13) {
      closeTicket(0, pot ? 'Red thirteen! ' + pot + ' unbanked stars slipped away.' : 'Red thirteen on the first draw. This ticket is empty.');
    } else {
      pot += value;
      if (pot === 13) {
        jackpot = true;
        closeTicket(26, 'Lucky thirteen! Your exact total doubles to 26 banked stars.');
      } else if (remaining.length === 1) {
        closeTicket(pot, 'You drew every safe ball. All ' + pot + ' stars are banked!');
      } else {
        message = 'You drew ' + value + '. Bank your ' + pot + (pot === 1 ? ' star' : ' stars') + ' or turn again.';
      }
    }
    render();
  }
  function turn() {
    if (phase === 'finished') { replay(); return; }
    if (phase === 'closed') { ticket++; newTicket(); render(); return; }
    if (phase !== 'open') return;
    const chosen = Math.floor(Math.random() * remaining.length);
    phase = 'turning';
    message = 'The balls are tumbling…';
    render();
    if (reducedMotion.matches) { reveal(chosen); return; }
    const start = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - start) / 850);
      if (t >= 1 || reducedMotion.matches) { reveal(chosen); return; }
      spin = t * t * (3 - 2*t);
      art(remaining[chosen]);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  el('draw').onclick = turn;
  el('bank').onclick = () => {
    if (phase !== 'open' || !pot) return;
    closeTicket(pot, 'Ticket stamped. ' + pot + (pot === 1 ? ' star is' : ' stars are') + ' safely banked.');
    render();
    el('draw').focus({preventScroll:true});
  };
  el('draw').addEventListener('keydown', event => {
    if (event.repeat && (event.key === 'Enter' || event.key === ' ')) event.preventDefault();
  });
  replay();
})();
