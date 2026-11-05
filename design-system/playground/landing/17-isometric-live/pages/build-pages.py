import re, os, shutil, sys, json
SITE='/Users/macmini/code/hostinger-migration/sites/q9labs.ai/assets'
BK='/Users/macmini/code/hostinger-migration/rollback/q9labs-pages-before-2026-11-05/assets'
CV='/Users/macmini/code/canvas/canvases/q9-website-revamp'
home=open(SITE+'/index.html').read()  # homepage reference (not modified)

tokens=open(CV+'/tokens.css').read()
tokens=re.sub(r'/\*.*?\*/','',tokens,flags=re.S)
tokens=re.sub(r'\n\s*\n+','\n',tokens).strip()
fontfaces=''.join('@font-face{font-family:"General Sans";src:url(/img/home/fonts/GeneralSans-%d.woff2) format("woff2");font-weight:%d;font-style:normal;font-display:swap}\n'%(w,w) for w in (400,500,600))

analytics=re.search(r'<script>\n\(function\(\)\{\n  var h=location\.hostname;.*?</script>',home,re.S).group(0)
wa=re.search(r'<a class="wa".*?</a>',home,re.S).group(0)
icons=('<meta name="theme-color" content="#ffffff"/><link rel="icon" href="/favicon.svg" type="image/svg+xml" media="(prefers-color-scheme: light)"/>'
 '<link rel="apple-touch-icon" href="/apple-touch-icon.png"/><link rel="icon" href="/favicon-black.png" media="(prefers-color-scheme: light)"/>'
 '<link rel="icon" href="/favicon-white.png" media="(prefers-color-scheme: dark)"/>')
OGIMG='https://q9labs.ai/img/home/og-1200x630.png'
OGALT='The Q9 Labs logo and the headline AI products that stop revenue leaking from your business, beside an isometric platform with six product stations joined by cyan paths to a central approval stamp.'
preload='<link rel="preload" href="/img/home/fonts/GeneralSans-500.woff2" as="font" type="font/woff2" crossorigin>'

def old_head(name):
    s=open('%s/%s.html'%(BK,name)).read()
    g=lambda p: re.search(p,s).group(1)
    return dict(title=g(r'<title>(.*?)</title>'),desc=g(r'<meta name="description" content="(.*?)"'),
        ogt=g(r'<meta property="og:title" content="(.*?)"'),ogd=g(r'<meta property="og:description" content="(.*?)"'),
        ld=re.findall(r'<script type="application/ld\+json">.*?</script>',s,re.S))

def lineup():
    items=[]
    for m in re.finditer(r'<article class="card" id="(\w+)".*?</article>',home,re.S):
        a=m.group(0)
        items.append((re.search(r'card__name[^>]*>(.*?)<',a).group(1),re.search(r'card__desc">(.*?)</p>',a).group(1),
          re.search(r'<a class="link" href="([^"]*)"',a).group(1)))
    return [(n,d,u if u.startswith('http') else 'https://q9labs.ai'+u) for n,d,u in items]

def products_ld():
    L=lineup()
    org={"@context":"https://schema.org","@type":"Organization","name":"Q9 Labs","url":"https://q9labs.ai","logo":"https://q9labs.ai/img/q9logo.png","parentOrganization":{"@type":"Organization","name":"CollabEZ","url":"https://collabez.ae"},"makesOffer":[{"@type":"Offer","itemOffered":{"@type":"Product","name":n,"description":d,"url":u}} for n,d,u in L]}
    lst={"@context":"https://schema.org","@type":"ItemList","name":"Q9 Labs products","itemListElement":[{"@type":"ListItem","position":i+1,"name":n,"description":d,"url":u} for i,(n,d,u) in enumerate(L)]}
    return ['<script type="application/ld+json">'+json.dumps(x,ensure_ascii=False,separators=(',',':'))+'</script>' for x in (org,lst)]

def head(name,url,robots=True):
    h=old_head(name)
    if name=='products': h['ld']=products_ld()
    t=h['title']; d=h['desc']
    out=['<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">',
      '<title>%s</title><meta name="description" content="%s"/>'%(t,d),
      '<meta name="robots" content="index, follow"/><meta name="googlebot" content="index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1"/>',
      '<link rel="canonical" href="%s"/>'%url,
      '<meta property="og:title" content="%s"/><meta property="og:description" content="%s"/><meta property="og:url" content="%s"/><meta property="og:site_name" content="Q9 Labs"/>'%(h['ogt'],h['ogd'],url),
      '<meta property="og:image" content="%s"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/><meta property="og:image:alt" content="%s"/><meta property="og:type" content="website"/>'%(OGIMG,OGALT),
      '<meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="%s"/><meta name="twitter:description" content="%s"/><meta name="twitter:image" content="%s"/>'%(h['ogt'],h['ogd'],OGIMG),
      icons]+h['ld']+[preload]
    return ''.join(out)

copied=set()
def art(m):
    f=m.group(1)
    if f.startswith('a-'):
        assert os.path.exists(SITE+'/img/home/'+f), f
        return '/img/home/'+f
    os.makedirs(SITE+'/img/site',exist_ok=True)
    shutil.copy(CV+'/assets/'+f,SITE+'/img/site/'+f); copied.add(f)
    return '/img/site/'+f

def build(board,out,headhtml):
    s=open('%s/boards/%s.html'%(CV,board)).read()
    style=re.search(r'<style>(.*?)</style>',s,re.S).group(1)
    body=s[s.index('<body>'):]
    if '\n.wa{' not in style:
        pb=open(CV+'/boards/products.html').read()
        style+='\n'+re.search(r'\.wa\{.*?\n\.wa svg\{[^\n]*',pb,re.S).group(0)+'\n@media (max-width:46rem){.wa{left:1rem;bottom:1rem}}\n@media (prefers-reduced-motion:reduce){.wa{transition:none}}\n'
    body=re.sub(r'\.\./assets/([\w.-]+)',art,body)
    style=re.sub(r'\.\./assets/([\w.-]+)',art,style)
    if 'class="wa"' not in body: body=body.replace('</body>',wa+'\n</body>')
    body=body.replace('</body>',analytics+'\n</body>')
    page='<!doctype html>\n<html lang="en">\n<head>\n'+headhtml+'\n<style>\n'+tokens+'\n'+fontfaces+style.strip()+'\n</style>\n</head>\n'+body
    open(SITE+'/'+out,'w').write(page)

for board,out,name,path in [('products','products.html','products','/products'),('about','about-us.html','about-us','/about-us'),('privacy','privacy.html','privacy','/privacy'),('terms','terms.html','terms','/terms')]:
    build(board,out,head(name,'https://q9labs.ai'+path))

# 404
s=open(CV+'/boards/notfound.html').read()
title=re.search(r'<title>(.*?)</title>',s).group(1); desc=re.search(r'<meta name="description" content="(.*?)"',s).group(1)
h404='<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>%s</title><meta name="description" content="%s"/>%s%s'%(title,desc,icons,preload)
build('notfound','404.html',h404)
print(sorted(copied))
