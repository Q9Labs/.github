import { icon, announce, escapeHtml } from './ui.js';

const products = [
  {key:'ava',name:'Ava',title:'AI Voice Calling Platform',live:'https://ava.q9labs.ai/',copy:'Start a bilingual sample call, take over, and review what Ava captured.',load:()=>import('./demos/ava.js')},
  {key:'nura',name:'Nura',title:'AI Hiring & Interview Platform',live:'https://recruiter.q9labs.ai/portal/dashboard/job-posts/jh7f7af36yjkte9cq079wvrvv18dfk3f?limit=50&range=%2230%22&compare=false&status=interviewed&sortBy=score&sortOrder=desc',copy:'Screen a sample applicant batch, explore the evidence, and build your shortlist.',load:()=>import('./demos/nura.js')},
  {key:'mesa',name:'Mesa',title:'AI Restaurant Ordering & Booking Platform',live:'https://mesa.q9labs.ai'},
  {key:'terminal',name:'Terminal',title:'AI Airline Customer Service Kiosk',live:'https://terminal.q9labs.ai'},
  {key:'track',name:'Track',title:'Agent First Team Collaboration & Project Management',live:'https://track.q9labs.ai/',copy:'Turn a conversation into a draft, approve it, and move the task across the board.',load:()=>import('./demos/track.js')},
  {key:'chalk',name:'Chalk',title:'Agent Native Real-Time Collaboration Space',live:'https://chalk.q9labs.ai/',copy:'Join a sample design review, add a decision, and let the notes agent capture it.',load:()=>import('./demos/chalk.js')},
  {key:'flow',name:'Flow',title:'Voice Enabled Customer Journey',live:'https://flow.q9labs.ai/',copy:'Play a sample answer, correct the extracted details, and review your application.',load:()=>import('./demos/flow.js')},
  {key:'edli',name:'Edli',title:'AI Powered School Ecosystem',copy:'Record attendance, publish grades, and see the parent update in one place.',load:()=>import('./demos/edli.js')},
  {key:'moet',name:'MoET Services',title:'AI Government Service Intake (UAE Ministry of Economy & Tourism concept)',icon:'flow',live:'https://moet-poc.q9labs.ai/'}
];
const key=location.pathname.split('/').filter(Boolean)[0];
const product=products.find(p=>p.key===key && p.load);
const root=document.getElementById('app');
const newTab='target="_blank" rel="noopener"';
const header=`<header class="site-header"><div class="lockup"><a href="/" aria-label="Q9 Labs demo home"><img class="q9-logo" src="/assets/logos/q9.svg" alt="Q9 Labs"></a><img class="aie-logo" src="/assets/art/aie-logo.webp" alt="AI Everything Abu Dhabi" width="401" height="96"></div><a class="button secondary" href="https://q9labs.ai/aie" ${newTab}>Book a demo</a></header>`;
const footer=`<footer class="site-footer">Walkthroughs use sample data. Live demos need internet.</footer>`;
const backLink=`<a class="back-link" href="/">${icon('arrowLeft',18)} All products</a>`;
const productIcon=key=>`<img class="product-icon" src="/assets/art/icon-${key}.webp" alt="" width="192" height="192">`;
const liveLink=(p,extra='')=>`<a class="${extra}" href="${escapeHtml(p.live)}" ${newTab}>Open live demo ${icon('external',18)}</a>`;
const card=p=>`<li class="product-card">${productIcon(p.icon||p.key)}<h2>${p.name}</h2><p>${p.title}</p><div class="card-actions">${p.live ? liveLink(p,'card-link') : `<a class="card-link" href="/${p.key}">Try the walkthrough ${icon('arrowRight',18)}</a>`}${p.live && p.load ? `<a class="walkthrough-link" href="/${p.key}">Walkthrough</a>` : ''}</div></li>`;
if (!key) {
  root.innerHTML=header+`<main id="main" class="hub"><div class="hub-intro"><div><h1>AI for <em>everyone</em></h1><p class="lead">Try our products, hands on.</p><p class="event">AI Everything Abu Dhabi · <span class="nowrap">6–7 Oct</span> · <span class="nowrap">Hall 3, Stand P013–P014</span></p></div><img class="hero-art" src="/assets/art/kiosk.webp" alt="" width="464" height="760"></div><ul class="product-grid">${products.map(card).join('')}</ul></main>`+footer;
} else if (product) {
  document.title=`${product.name} · Q9 Labs demos`;
  root.innerHTML=header+`<main id="main" class="demo-page">${backLink}<section class="demo-intro"><div><div class="intro-name">${productIcon(key)}<h1>${product.name}</h1></div><p class="product-line">${product.title}</p><p class="muted">${product.copy}</p></div><div class="intro-actions">${product.live ? liveLink(product,'button') : ''}<button id="copy-link" type="button" class="quiet">${icon('link',18)} Copy demo link</button><button id="reset-demo" type="button" class="quiet">Reset demo</button></div></section><div id="demo-root" class="workbench"></div></main>`+footer;
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
