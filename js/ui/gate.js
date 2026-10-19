/* js/ui/gate.js — the "tap to enter" screen. Browsers only allow sound after a real tap,
   so this is that tap. Text comes from config/site.js → gate. No images. */
import { SITE } from '../../config/site.js';
import { S } from '../core/state.js';
import { mk } from '../core/util.js';

export function init(onEnter) {
  const root = mk('div', 'gate');
  root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Enter');
  const btn = mk('button', 'gate-btn', root, `<span class="g"></span><small></small>`);
  btn.querySelector('.g').textContent = SITE.gate.text;
  btn.querySelector('small').textContent = SITE.gate.hint || '';
  let done = false;
  const enter = () => {
    if (done) return; done = true;
    S.gated = false;
    root.classList.add('out');
    document.body.classList.add('ready');
    onEnter && onEnter();
    setTimeout(() => root.remove(), 500);
  };
  btn.addEventListener('click', enter);
  setTimeout(() => btn.focus({ preventScroll: true }), 50);
}
