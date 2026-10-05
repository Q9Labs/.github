import { icons } from './icons.js';

export const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function icon(name, size=20) {
  const nodes=icons[name];
  if (!nodes) throw new Error(`Unknown icon: ${name}`);
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true">${nodes.map(n=>n.tag==='path'?`<path d="${n.d}" stroke="currentColor" stroke-width="${n.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`:`<circle cx="${n.cx}" cy="${n.cy}" r="${n.r}" stroke="currentColor" stroke-width="${n.strokeWidth}"/>`).join('')}</svg>`;
}
export const ar = text => `<span class="arabic" lang="ar" dir="rtl">${escapeHtml(text)}</span>`;
export const avatar = (initials, extra='') => `<span class="avatar ${extra}">${escapeHtml(initials)}</span>`;
export const badge = (label, extra='') => `<span class="badge ${extra}">${escapeHtml(label)}</span>`;
export const button = (label, action, extra='') => `<button type="button" data-action="${action}" ${extra}>${label}</button>`;
export const panelHeader = (title, arabic, right='') => `<div class="panel-heading"><div><strong>${escapeHtml(title)}</strong>${arabic?ar(arabic):''}</div><div class="row">${right}</div></div>`;
export const empty = (title, copy) => `<div class="empty"><span class="empty-icon">${icon('waveform',32)}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(copy)}</p></div>`;
export const wave = running => `<div class="wave ${running?'running':''}" aria-label="${running?'Sample conversation playing':'Conversation paused'}">${Array.from({length:56},(_,i)=>`<i style="--h:${8+Math.round(Math.sin(i*.43)**2*25)}px;--d:${i*-.07}s"></i>`).join('')}</div>`;
export function onAction(root, handler) {
  root.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    const target=event.target.closest('button[data-action]');
    if (target && root.contains(target) && !target.disabled) {
      const priorButtons=[...root.querySelectorAll('button')];
      const index=priorButtons.indexOf(target);
      const identity=Object.entries(target.dataset);
      handler(target.dataset.action, target);
      if (!target.isConnected) {
        const nextButtons=[...root.querySelectorAll('button')];
        const same=nextButtons.find(button=>identity.every(([key,value])=>button.dataset[key]===value));
        const next=same&&!same.disabled?same:nextButtons[index];
        if(next&&!next.disabled)next.focus({preventScroll:true});
      }
    }
  });
}
export function announce(message) {
  document.getElementById('notice').textContent=message;
}
export function field(label, name, value='', extra='') {
  return `<label class="field"><span>${escapeHtml(label)}</span><input name="${name}" value="${escapeHtml(value)}" ${extra}></label>`;
}
export function tabs(items, selected) {
  return `<div class="tabs" aria-label="Demo views">${items.map(([id,label])=>button(escapeHtml(label),'tab',`data-tab="${id}" aria-pressed="${id===selected}" class="${id===selected?'selected':''}"`)).join('')}</div>`;
}
export function downloadText(filename, text) {
  const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download=filename;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
