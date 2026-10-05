import { icon, announce } from './ui.js';

const products = [
  {key:'ava',name:'Ava',title:'AI Voice Calling Platform',ar:'من مكالمة إلى حجز',copy:'Start a bilingual sample call, take over, and review what Ava captured.',icon:'call',load:()=>import('./demos/ava.js')},
  {key:'nura',name:'Nura',title:'AI Hiring & Interview Platform',ar:'تعرّف على الشخص وراء الدرجة',copy:'Screen a sample applicant batch, explore the evidence, and build your shortlist.',icon:'ranking',load:()=>import('./demos/nura.js')},
  {key:'edli',name:'Edli',title:'AI Powered School Ecosystem',ar:'لوحة واحدة للمدرسة كلها',copy:'Record attendance, publish grades, and see the parent update in one place.',icon:'school',load:()=>import('./demos/edli.js')},
  {key:'chalk',name:'Chalk',title:'Agent Native Real-Time Collaboration Space',ar:'غرفة داخل منتجك',copy:'Join a sample design review, add a decision, and let the notes agent capture it.',icon:'video',load:()=>import('./demos/chalk.js')},
  {key:'track',name:'Track',title:'Agent First Team Collaboration & Project Management',ar:'من رسالة إلى مهمة منجزة',copy:'Turn a conversation into a draft, approve it, and move the task across the board.',icon:'badge',load:()=>import('./demos/track.js')},
  {key:'flow',name:'Flow',title:'Voice Enabled Customer Journey',ar:'هم يتكلمون، والحقول تُملأ',copy:'Play a sample answer, correct the extracted details, and review your application.',icon:'mic',load:()=>import('./demos/flow.js')},
  {key:'mesa',name:'Mesa',title:'AI Restaurant Ordering & Booking Platform',copy:'Try live restaurant ordering and booking with a voice agent.',icon:'mic',href:'https://mesa.q9labs.ai'},
  {key:'terminal',name:'Terminal',title:'AI Airline Customer Service Kiosk',copy:'Talk to a live voice agent for airline customer service.',icon:'call',href:'https://terminal.q9labs.ai'}
];
const key=location.pathname.split('/').filter(Boolean)[0];
const product=products.find(p=>p.key===key && !p.href);
const root=document.getElementById('app');
const nav=`<header class="site-header"><a href="/" aria-label="Q9 Labs demo home"><img class="q9-logo" src="/assets/logos/q9.svg" alt="Q9 Labs"></a><nav aria-label="Products">${products.map(p=>`<a href="${p.href || `/${p.key}`}" ${p.href ? 'target="_blank" rel="noopener"' : ''} ${p.key===key?'aria-current="page"':''}>${p.name}</a>`).join('')}</nav><span class="demo-label">Interactive demos</span></header>`;
const footer=`<footer class="site-footer"><span>Product walkthroughs use sample data. Live voice demos require internet.</span><div class="row"><a href="https://q9labs.ai/aie" target="_blank" rel="noopener noreferrer">Explore Q9 Labs ↗</a></div></footer>`;
if (!key) {
  root.innerHTML=nav+`<main id="main" class="hub"><div class="hub-intro"><span class="eyebrow">AI Everything Abu Dhabi · 6–7 Oct · Hall 3, Stand P013–P014</span><h1>Don’t just watch.<br><em>Try it.</em></h1><p>Eight products. Hands-on walkthroughs and live voice demos.<br>Click through the work, from first conversation to finished outcome.</p></div><div class="product-grid">${products.map((p,i)=>`<a class="product-card" href="${p.href || `/${p.key}`}" ${p.href ? 'target="_blank" rel="noopener"' : ''}><div class="card-top">${p.href ? `<strong class="product-name">${p.name}</strong>` : `<img src="/assets/logos/${p.key}-logo-trimmed.png" alt="${p.name}">`}<span class="card-number">0${i+1}</span></div><h2>${p.title}</h2><p>${p.copy}</p><span class="card-link">Try ${p.name} ${icon(p.icon)}</span></a>`).join('')}</div></main>`+footer;
} else if (product) {
  document.title=`${product.name} — Q9 Labs interactive demo`;
  root.innerHTML=nav+`<main id="main" class="demo-page"><section class="demo-intro"><div><div class="intro-brand"><img src="/assets/logos/${key}-logo-trimmed.png" alt="${product.name}"><span class="eyebrow">PRODUCT WALKTHROUGH</span></div><h1>${product.title}</h1><p>${product.copy}</p></div><div class="intro-actions">${key==='ava' ? '<a class="button" href="https://itisal-demos.q9labs.ai/darco/" target="_blank" rel="noopener">Talk to Ava live ↗</a>' : ''}<button id="copy-link" type="button" class="quiet">${icon('link')} Copy demo link</button><button id="reset-demo" type="button" class="quiet">Reset demo</button></div></section><div id="demo-root" class="workbench"></div><div class="demo-bottom"><span lang="ar" dir="rtl" class="arabic">${product.ar}</span><a href="/">Explore all demos →</a></div></main>`+footer;
  document.getElementById('reset-demo').addEventListener('click',()=>location.reload());
  document.getElementById('copy-link').addEventListener('click',async()=>{
    try {await navigator.clipboard.writeText(location.origin+'/'+key);announce('Demo link copied.');}
    catch {announce(`Copy this demo link: ${location.origin}/${key}`);}
  });
  try {const demo=await product.load();demo.mount(document.getElementById('demo-root'));}
  catch(error) {document.getElementById('demo-root').innerHTML='<div class="empty"><h2>The demo could not load</h2><p>Reload this page to try again.</p></div>';console.error(`Could not load ${key} demo`,error);}
} else {
  root.innerHTML=nav+`<main id="main" class="hub"><h1>Demo not found</h1><p>Choose a product walkthrough.</p><a class="button" href="/">Back to demos</a></main>`+footer;
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(error => {
    announce('Offline preparation failed. Keep this page online or reload to retry.');
    console.error('Offline preparation failed', error);
  });
}
