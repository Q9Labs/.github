import { avatar, badge, button, panelHeader, field, icon, onAction, announce, escapeHtml, downloadText } from '../ui.js';

export function mount(root) {
  let joined=false,name='You',mic=false,camera=false,screen=false,summary=false,draftDecision='';
  const decisions=['Keep the bilingual layout for the product launch.'];
  function notes(){return `Design review — sample meeting\n\nDecisions\n${decisions.map((d,i)=>`${i+1}. ${d}`).join('\n')}\n\nNext step: review the updated design before Tuesday.\n`}
  function render(){
    root.innerHTML=`<section class="panel">${panelHeader('Atlas Studio / projects / atlas / review','غرفة داخل منتجك',badge(joined?'In sample room':'Ready to join',joined?'green':'gray'))}<div class="layout"><div>${joined?`<div class="room-grid">${[['LN','L. Nasser'],['DK','D. Kamal'],['YOU',name],['AI','Notes agent']].map(([initials,label],i)=>`<div class="participant ${i===3?'agent':''}">${avatar(initials,'large')}<strong>${escapeHtml(label)}</strong><span class="mini-label">${i===3?'Capturing typed decisions':i===2?`Mic ${mic?'on':'off'} · Camera ${camera?'on':'off'} · simulated`:'Sample participant'}</span></div>`).join('')}</div><div class="room-controls">${button(`${icon('mic')} Mic ${mic?'on':'off'}`,'mic',`class="quiet" aria-pressed="${mic}"`)}${button(`${icon('video')} Camera ${camera?'on':'off'}`,'camera',`class="quiet" aria-pressed="${camera}"`)}${button(screen?'Hide sample screen':'Show sample screen','screen','class="quiet"')}${button('Leave room','leave','class="danger"')}</div>${screen?'<div class="inset tint"><span class="eyebrow">SAMPLE SHARED SCREEN</span><h2>Atlas launch checklist</h2><ul class="check-list"><li>✓ Bilingual product page</li><li>✓ Mobile layout review</li><li>○ Final stakeholder sign-off</li></ul></div>':''}<p class="input-note">Camera, microphone, and participants are simulated. Your devices are never accessed.</p>`:`<div class="empty"><span class="empty-icon">${icon('video',36)}</span><h2>Your product. Your meeting room.</h2><p>Join a sample design review and capture a decision.</p><form id="join-form" class="stack">${field('Your display name','name',name,'required maxlength="40" autocomplete="off"')}<button type="submit">Join sample room</button></form></div><pre class="code-snippet">&lt;Chalk room="design-review" /&gt;</pre>`}</div><aside class="inset ${summary?'tint':''}">${panelHeader(summary?'Meeting summary':'Notes agent','وكيل الملاحظات',badge('Sample'))}<ul class="note-list">${decisions.map(d=>`<li>${escapeHtml(d)}</li>`).join('')}</ul>${joined?`<form id="decision-form" class="stack"><label class="field"><span>Add a meeting decision</span><textarea name="decision" required maxlength="240" rows="3" placeholder="What did the team decide?">${escapeHtml(draftDecision)}</textarea></label><button type="submit">Capture decision</button></form>`:'<p class="muted">Join the room to add a decision.</p>'}<div class="actions">${button(summary?'Back to live notes':'Generate summary','summary','class="quiet small"')}${summary?button('Download notes','download','class="quiet small"'):''}</div>${summary?'<p><strong>Next step:</strong> Review the updated design before Tuesday.</p>':''}</aside></div></section>`;
  }
  onAction(root,action=>{
    if(action==='mic')mic=!mic;
    if(action==='camera')camera=!camera;
    if(action==='screen')screen=!screen;
    if(action==='leave'){joined=false;mic=false;camera=false;screen=false;announce('Left the sample room. Your notes remain available.');}
    if(action==='summary')summary=!summary;
    if(action==='download'){downloadText('chalk-meeting-notes.txt',notes());announce('Meeting notes downloaded.');return;}
    render();
  });
  root.addEventListener('input',event=>{
    if(event.target instanceof HTMLTextAreaElement && event.target.name==='decision')draftDecision=event.target.value;
  });
  root.addEventListener('submit',event=>{
    event.preventDefault();if(!event.target.reportValidity())return;
    const data=new FormData(event.target);
    if(event.target.id==='join-form'){name=String(data.get('name')).trim();if(!name){announce('Enter a display name.');return;}joined=true;announce('Joined the sample room.');}
    if(event.target.id==='decision-form'){const decision=String(data.get('decision')).trim();if(!decision){announce('Enter a decision first.');return;}decisions.push(decision);draftDecision='';summary=false;announce('Decision captured by the notes agent.');}
    render();
  });render();
}
