import { badge, button, panelHeader, onAction, announce, escapeHtml } from '../ui.js';

export function mount(root) {
  const students=[{name:'Layan A.',present:true,grade:94,paid:true},{name:'Omar K.',present:true,grade:88,paid:false},{name:'Reem S.',present:true,grade:96,paid:true},{name:'Faisal M.',present:false,grade:91,paid:false}];
  let view='attendance',published=false,activity=['08:10 · Morning attendance opened'],preview='Select an action to preview the corresponding parent update.';
  function log(message,parent){activity.unshift(message);preview=parent;announce(message);}
  function render() {
    const present=students.filter(s=>s.present).length,paid=students.filter(s=>s.paid).length;
    root.innerHTML=`<div class="panel-heading"><div><span class="eyebrow">AL-WAHA SCHOOLS · ABU DHABI</span><h2>The school day, in one place.</h2></div>${badge('Sample class · Grade 8','gray')}</div><div class="stat-grid">${[['attendance',`${present}/4`,'Present today'],['grades',published?'Published':'Draft','Class grades'],['fees',`${paid}/4`,'Fees recorded'],['parents',String(activity.length-1),'Parent updates']].map(([id,value,label])=>button(`<span class="mini-label">${label}</span><strong>${value}</strong>`,'view',`data-view="${id}" class="stat-card ${view===id?'selected':''}" aria-pressed="${view===id}"`)).join('')}</div><div class="layout"><section class="panel">${panelHeader({attendance:'Attendance',grades:'Gradebook',fees:'Fee records',parents:'Parent updates'}[view],'لوحة المدرسة',badge('4 sample students'))}${view==='parents'?`<div class="inset tint"><span class="mini-label">Latest parent message preview</span><h3>${escapeHtml(preview)}</h3><p class="muted">Preview only. No parent was contacted.</p></div>`:`<div class="table-wrap"><table><thead><tr><th>Student</th><th>${view==='attendance'?'Attendance':view==='grades'?'Score / 100':'Term fees'}</th><th>Action</th></tr></thead><tbody>${students.map((s,i)=>`<tr><td>${s.name}</td><td>${view==='attendance'?badge(s.present?'Present':'Not checked in',s.present?'green':'gray'):view==='grades'?`<label class="field"><span class="sr-only">Grade for ${s.name}</span><input aria-label="Grade for ${s.name}" type="number" min="0" max="100" value="${s.grade}" data-grade="${i}" ${published?'disabled':''}></label>`:badge(s.paid?'Recorded paid':'Outstanding',s.paid?'green':'gray')}</td><td>${view==='attendance'?button(s.present?'Mark absent':'Mark present','attendance',`class="quiet small" data-index="${i}"`):view==='grades'?badge(published?'Shared in demo':'Not published',published?'green':'gray'):button(s.paid?'View receipt':'Record sample payment',s.paid?'receipt':'pay',`class="quiet small" data-index="${i}"`)}</td></tr>`).join('')}</tbody></table></div>`}<div class="actions">${view==='attendance'?button(present===4?'All students checked in':'Scan sample QR','scan',present===4?'disabled':''):view==='grades'?button(published?'Reopen gradebook':'Publish sample grades',published?'reopen':'publish'):view==='fees'?'<span class="input-note">Recordkeeping only — no payments are processed.</span>':''}</div></section><aside class="panel soft">${panelHeader('Activity feed','آخر التحديثات')}<div class="activity">${activity.map(a=>`<p>${escapeHtml(a)}</p>`).join('')}</div><div class="divider"></div><div class="inset"><span class="mini-label">Parent update preview</span><p>${escapeHtml(preview)}</p>${badge('Not sent','gray')}</div></aside></div>`;
  }
  onAction(root,(action,target)=>{
    const s=students[Number(target.dataset.index)];
    if(action==='view')view=target.dataset.view;
    if(action==='attendance'){s.present=!s.present;log(`${s.name} marked ${s.present?'present':'absent'}`,`${s.name} is ${s.present?'present in class':'marked absent'} today.`);}
    if(action==='scan'){const next=students.find(s=>!s.present);if(next){next.present=true;log(`QR check-in · ${next.name}`,`${next.name} has arrived at school.`);}}
    if(action==='publish'){
      const invalid=[...root.querySelectorAll('input[data-grade]')].find(input=>!input.reportValidity()||input.value==='');
      if(invalid){invalid.focus();announce('Enter a grade from 0 to 100 for every student.');return;}
      published=true;log('Grade 8 grades published in demo',`New grades are available. Layan A.: ${students[0].grade}/100.`);
    }
    if(action==='reopen')published=false;
    if(action==='pay'){s.paid=true;log(`Sample fee receipt · ${s.name}`,`A sample term-fee payment for ${s.name} has been recorded.`);}
    if(action==='receipt'){preview=`Sample receipt · ${s.name} · Term fees recorded paid. No payment processed.`;announce(preview);}
    render();
  });
  root.addEventListener('input',event=>{if(event.target.matches('input[data-grade]'))students[Number(event.target.dataset.grade)].grade=event.target.value;});render();
}
