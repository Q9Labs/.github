import { icon, announce } from './ui.js';

const products = [
  {key:'ava',name:'Ava',title:'AI Voice Calling Platform',copy:'Start a bilingual sample call, take over, and review what Ava captured.',load:()=>import('./demos/ava.js')},
  {key:'nura',name:'Nura',title:'AI Hiring & Interview Platform',copy:'Screen a sample applicant batch, explore the evidence, and build your shortlist.',load:()=>import('./demos/nura.js')},
  {key:'mesa',name:'Mesa',title:'AI Restaurant Ordering & Booking Platform',href:'https://mesa.q9labs.ai'},
  {key:'terminal',name:'Terminal',title:'AI Airline Customer Service Kiosk',href:'https://terminal.q9labs.ai'},
  {key:'track',name:'Track',title:'Agent First Team Collaboration & Project Management',copy:'Turn a conversation into a draft, approve it, and move the task across the board.',load:()=>import('./demos/track.js')},
  {key:'chalk',name:'Chalk',title:'Agent Native Real-Time Collaboration Space',copy:'Join a sample design review, add a decision, and let the notes agent capture it.',load:()=>import('./demos/chalk.js')},
  {key:'flow',name:'Flow',title:'Voice Enabled Customer Journey',copy:'Play a sample answer, correct the extracted details, and review your application.',load:()=>import('./demos/flow.js')},
  {key:'edli',name:'Edli',title:'AI Powered School Ecosystem',copy:'Record attendance, publish grades, and see the parent update in one place.',load:()=>import('./demos/edli.js')}
];
const key=location.pathname.split('/').filter(Boolean)[0];
const product=products.find(p=>p.key===key && !p.href);
const root=document.getElementById('app');
const newTab='target="_blank" rel="noopener"';
const header=`<header class="site-header"><div class="lockup"><a href="/" aria-label="Q9 Labs demo home"><img class="q9-logo" src="/assets/logos/q9.svg" alt="Q9 Labs"></a><img class="aie-logo" src="/assets/art/aie-logo.webp" alt="AI Everything Abu Dhabi" width="401" height="96"></div><a class="button secondary" href="https://q9labs.ai/aie" ${newTab}>Book a demo</a></header>`;
const footer=`<footer class="site-footer">Walkthroughs use sample data. Live demos need internet.</footer>`;
const backLink=`<a class="back-link" href="/">${icon('arrowLeft',18)} All products</a>`;
const productIcon=key=>`<img class="product-icon" src="/assets/art/icon-${key}.webp" alt="" width="192" height="192">`;
const card=p=>`<li><a class="product-card" href="${p.href || `/${p.key}`}" ${p.href ? newTab : ''}>${productIcon(p.key)}<h2>${p.name}</h2><p>${p.title}</p><span class="card-link">${p.href ? `Open live demo ${icon('external',18)}` : `Try the walkthrough ${icon('arrowRight',18)}`}</span></a></li>`;
if (!key) {
  root.innerHTML=header+`<main id="main" class="hub"><div class="hub-intro"><div><h1>AI for <em>everyone</em></h1><p class="lead">Try our products, hands on.</p><p class="event">AI Everything Abu Dhabi · <span class="nowrap">6–7 Oct</span> · <span class="nowrap">Hall 3, Stand P013–P014</span></p></div><img class="hero-art" src="/assets/art/kiosk.webp" alt="" width="464" height="760"></div><ul class="product-grid">${products.map(card).join('')}</ul></main>`+footer;
} else if (product) {
  document.title=`${product.name} · Q9 Labs demos`;
  root.innerHTML=header+`<main id="main" class="demo-page">${backLink}<section class="demo-intro"><div><div class="intro-name">${productIcon(key)}<h1>${product.name}</h1></div><p class="product-line">${product.title}</p><p class="muted">${product.copy}</p></div><div class="intro-actions">${key==='ava' ? `<a class="button" href="https://itisal-demos.q9labs.ai/darco/" ${newTab}>Talk to Ava live ${icon('external',18)}</a>` : ''}<button id="copy-link" type="button" class="quiet">${icon('link',18)} Copy demo link</button><button id="reset-demo" type="button" class="quiet">Reset demo</button></div></section><div id="demo-root" class="workbench"></div></main>`+footer;
  document.getElementById('reset-demo').addEventListener('click',()=>location.reload());
  document.getElementById('copy-link').addEventListener('click',async()=>{
    try {await navigator.clipboard.writeText(location.origin+'/'+key);announce('Demo link copied.');}
    catch {announce(`Copy this demo link: ${location.origin}/${key}`);}
  });
  try {const demo=await product.load();demo.mount(document.getElementById('demo-root'));}
  catch(error) {document.getElementById('demo-root').innerHTML='<div class="empty"><h2>The demo could not load</h2><p>Reload this page to try again.</p></div>';console.error(`Could not load ${key} demo`,error);}
} else {
  root.innerHTML=header+`<main id="main" class="hub">${backLink}<h1>We couldn't find that demo</h1><p class="muted">Choose a product from the list.</p></main>`+footer;
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(error => {
    announce('Offline preparation failed. Keep this page online or reload to retry.');
    console.error('Offline preparation failed', error);
  });
}
