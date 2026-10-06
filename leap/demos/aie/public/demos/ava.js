import { avatar, badge, button, panelHeader, empty, wave, onAction, announce, field, tabs, escapeHtml } from '../ui.js';

const turns = [
  ['Maha S.', 'Are you open on Thursday?', false],
  ['Ava', 'We are — nine to five. Shall I book you in?', false],
  ['Maha S.', 'نعم، الساعة عشرة من فضلك.', true],
  ['Ava', 'تم الحجز الخميس ١٠ صباحًا.', true]
];
export function mount(root) {
  let view='call', step=0, running=false, handoff=false, confirmed=false, timer, campaign=0;
  let day='Thursday', time='10:00';
  function stop() { clearTimeout(timer); running=false; }
  function play() {
    stop(); running=true; handoff=false; render();
    timer=setTimeout(()=>{step++; if(step<turns.length) play(); else {stop();render();announce('Call complete. Review the captured booking.');}},1600);
  }
  function render() {
    root.innerHTML=tabs([['call','Live call'],['campaign','Campaign']],view)+(view==='call'?`
      <div class="layout"><section class="panel">
      ${panelHeader('Front desk · sample call','مكالمة تجريبية',badge(handoff?'Human handoff':running?'Playing transcript':step===4?'Call complete':'Ready','green'))}
      <div class="row">${avatar('MS','large')}<div><h3>Maha S.</h3><span class="muted">+971 50 ••• •241 · English + العربية</span></div></div>
      ${wave(running)}
      <div class="transcript" aria-live="polite">${step?turns.slice(0,step).map(([who,text,rtl])=>`<div class="turn ${who==='Ava'?'ai':''}"><span class="mini-label">${who}</span><div class="bubble ${rtl?'arabic':''}" ${rtl?'lang="ar" dir="rtl"':''}>${escapeHtml(text)}</div></div>`).join(''):empty('A bilingual conversation, one booking','Play the sample transcript to watch the conversation unfold. No audio is recorded or played.')}</div>
      <div class="actions">${step<4?button(running?'Pause':handoff?'Return to Ava':step?'Continue call':'Start sample call',running?'pause':'play'):button('Replay call','replay','class="quiet"')}${step<4&&running?button('Take over','handoff','class="quiet"'):''}${step<4?button('Next turn →','next','class="quiet"'):''}</div>
      ${handoff?'<p class="input-note">You took over. Ava’s transcript is paused; return to Ava to continue.</p>':''}
      </section><aside class="panel soft">${panelHeader('Captured from the call','ملخص المكالمة')}
      ${step<4?`<div class="stack"><div class="inset">${badge('Intent','gray')}<h3>${step>=2?'Book an appointment':'Waiting for the conversation'}</h3><p class="muted">${step>=3?'Thursday · 10:00 requested':'Details appear as the call progresses.'}</p></div><div class="progress-track"><span style="width:${step*25}%"></span></div><span class="muted">${step} of 4 conversation turns</span></div>`:confirmed?`<div class="receipt">${badge('Sample booking confirmed','green')}<h2>See you ${escapeHtml(day)}.</h2><p>Maha S. · ${escapeHtml(time)}</p><p class="muted">Saved for this walkthrough only. No message was sent.</p>${button('Edit booking','edit','class="quiet"')}</div>`:`<form id="booking" class="stack"><div class="inset tint"><h3>Appointment requested</h3><p>Review or change the captured details.</p></div>${field('Day','day',day,'required maxlength="40"')}${field('Time','time',time,'type="time" required')}<button type="submit">Confirm sample booking</button></form>`}
      </aside></div>`:`<section class="panel">${panelHeader('Thursday appointments','حملة المواعيد',badge(`${campaign}/3 complete`))}<p class="muted">Run a three-contact sample campaign. Each outcome is simulated.</p><div class="table-wrap"><table><thead><tr><th>Contact</th><th>Language</th><th>Outcome</th></tr></thead><tbody>${['Maha S.','Omar A.','Reem K.'].map((name,i)=>`<tr><td>${name}</td><td>${i===1?'English':'العربية'}</td><td>${badge(campaign>i?['Booked Thursday, 10:00','Callback requested','Booked Thursday, 14:00'][i]:'Queued',campaign>i?'green':'gray')}</td></tr>`).join('')}</tbody></table></div><div class="actions">${button(campaign===3?'Campaign complete':campaign?'Process next contact':'Run sample campaign','campaign',campaign===3?'disabled':'')}${button('Reset campaign','reset-campaign','class="quiet"')}</div></section>`);
  }
  onAction(root,(action,target)=>{
    if(action==='tab'){stop();view=target.dataset.tab;}
    if(action==='play'){play();return;}
    if(action==='pause')stop();
    if(action==='handoff'){stop();handoff=true;announce('Human handoff. Sample call paused.');}
    if(action==='next'){stop();handoff=false;step=Math.min(step+1,4);}
    if(action==='replay'){step=0;confirmed=false;play();return;}
    if(action==='edit')confirmed=false;
    if(action==='campaign'){campaign=Math.min(campaign+1,3);announce(`Processed ${campaign} of 3 sample contacts.`);}
    if(action==='reset-campaign')campaign=0;
    render();
  });
  root.addEventListener('input',event=>{if(event.target.name==='day')day=event.target.value;if(event.target.name==='time')time=event.target.value;});
  root.addEventListener('submit',event=>{event.preventDefault();if(event.target.id==='booking'&&event.target.reportValidity()){if(!day.trim()){announce('Enter a booking day.');return;}confirmed=true;render();announce('Sample booking confirmed. Nothing was sent.');}});
  window.addEventListener('pagehide',stop,{once:true});render();
}
