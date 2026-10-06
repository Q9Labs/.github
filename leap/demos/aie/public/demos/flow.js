import { badge, button, panelHeader, field, wave, onAction, announce, escapeHtml, ar } from '../ui.js';

const sample=[['name','Khalid Bahri'],['city','Sharjah'],['business','Auto parts retail'],['years','4'],['amount','180000']];
const labels={name:'Full name',city:'City',business:'Business',years:'Years trading',amount:'Requested amount (AED)'};
export function mount(root) {
  let values={name:'',city:'',business:'',years:'',amount:''},step=0,running=false,phase='edit',timer;
  function stop(){clearTimeout(timer);running=false;}
  function play(){stop();running=true;render();timer=setTimeout(()=>{const [key,value]=sample[step];values[key]=value;step++;if(step<sample.length)play();else{stop();render();announce('Five fields captured. Review and correct the details.');}},1100);}
  function render(){
    root.innerHTML=`<div class="layout equal"><section class="panel soft">${panelHeader('Voice-led application','طلب بصوتك',badge(running?'Playing sample answer':step===5?'Answer captured':'Sample transcript',running?'green':'gray'))}<span class="eyebrow">SMALL BUSINESS FINANCING</span><h2>Say it naturally.<br>Review it clearly.</h2>${wave(running)}<div class="inset tint"><p>${ar('اسمي خالد بحري، من الشارقة. عندي محل قطع غيار من أربع سنوات، وأحتاج ١٨٠ ألف درهم.')}</p><p class="muted">“I’m Khalid Bahri, from Sharjah. I’ve run an auto parts shop for four years, and I need AED 180,000.”</p></div><div class="actions">${phase==='edit'?button(running?'Pause answer':step===5?'Replay sample answer':step?'Continue answer':'Play sample answer',running?'pause':'play','class="quiet"'):''}${phase==='edit'&&step>0&&step<5?button('Fill remaining fields','finish','class="quiet"'):''}</div><p class="input-note">This plays a timed transcript, not audio. No microphone access. Replaying replaces the fields with sample values.</p>${step===5&&phase==='edit'?'<div class="inset"><h3>Try a correction</h3><p>The applicant clarifies: “Actually, six years.” Change Years trading from 4 to 6 before reviewing.</p></div>':''}</section><section class="panel">${panelHeader(phase==='submitted'?'Application receipt':phase==='review'?'Review your application':'Captured details','راجع التفاصيل',badge(phase==='submitted'?'Complete':phase==='review'?'2 / 2':'1 / 2'))}${phase==='submitted'?`<div class="receipt">${badge('Sample application confirmed','green')}<h2>All set, ${escapeHtml(values.name)}.</h2><p>Demo reference FL-2048</p><p>${escapeHtml(values.business)} · ${escapeHtml(values.city)}</p><p>${escapeHtml(values.years)} years · AED ${Number(values.amount).toLocaleString('en-US')}</p><p class="muted">No application was transmitted or stored.</p>${button('Edit application','edit','class="quiet"')}</div>`:phase==='review'?`<dl class="review-list">${sample.map(([key])=>`<div><dt>${labels[key]}</dt><dd>${escapeHtml(values[key])}</dd></div>`).join('')}</dl><div class="actions">${button('Confirm sample application','confirm')}${button('Back to edit','edit','class="quiet"')}</div>`:`<form id="application-form" class="stack">${sample.map(([key])=>field(labels[key],key,values[key],`required ${running?'disabled':''} ${key==='years'?'type="number" min="0" max="100" step="1"':key==='amount'?'type="number" min="1" max="1000000000" step="1"':'maxlength="80"'}`)).join('')}<button type="submit" ${running?'disabled':''}>Review application →</button><p class="input-note">You can type directly, or play the sample answer to fill the form.</p></form>`}</section></div>`;
  }
  onAction(root,action=>{
    if(action==='play'){if(step===5){step=0;values={name:'',city:'',business:'',years:'',amount:''};}play();return;}
    if(action==='pause')stop();
    if(action==='finish'){stop();for(const [key,value] of sample.slice(step))values[key]=value;step=5;}
    if(action==='edit')phase='edit';
    if(action==='confirm'){phase='submitted';announce('Sample application confirmed. Nothing was submitted.');}
    render();
  });
  root.addEventListener('input',event=>{if(Object.hasOwn(values,event.target.name))values[event.target.name]=event.target.value;});
  root.addEventListener('submit',event=>{event.preventDefault();if(!event.target.reportValidity())return;if(Object.values(values).some(v=>!v.trim())){announce('Complete every field before reviewing.');return;}stop();phase='review';render();announce('Review the details before confirming.');});
  window.addEventListener('pagehide',stop,{once:true});render();
}
