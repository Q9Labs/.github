"""Builds products-row.svg: the original shelf with the Flow and Edli objects swapped for Mesa and Terminal."""
import re,sys
A='/Users/macmini/code/canvas/canvases/q9-website-revamp/assets/'
S=float(sys.argv[1]) if len(sys.argv)>1 else .42
MX,TX=(float(sys.argv[2]),float(sys.argv[3])) if len(sys.argv)>3 else (233,533)
OFF=float(sys.argv[4]) if len(sys.argv)>4 else 62
orig=open('/tmp/q9port/row/products-row.orig.svg').read()
pat=re.compile(r'<linearGradient.*?</linearGradient>|<(?:polygon|path|ellipse)[^>]*>',re.S)
els=list(pat.finditer(orig))
flow=(els[29].start(),els[38].end()); edli=(els[63].start(),els[74].end())
def els_of(f,a,b):
    s=open(A+f).read(); m=list(re.finditer(r'<linearGradient.*?</linearGradient>|<(?:polygon|path|ellipse|g|/g|rect|circle)[^>]*>',s[s.index('</style>'):],re.S))
    return s,s[s.index('</style>'):][m[a].start():m[b].end()]
def route_y(x): return 62.9+(x+91.3)*0.57735
def grp(inner,cx,s,off=None):
    ty=route_y(cx)-(OFF if off is None else off)-s*159
    return '<g transform="translate(%.1f %.1f) scale(%s)" stroke-width="%.2f">%s</g>'%(cx-0,ty,s,1.8/s,inner)
_,mesa=els_of('a-st-mesa.svg',9,68)
t,term=els_of('a-st-terminal.svg',9,44)
cg=re.search(r'<defs>.*?</defs>',t,re.S).group(0)
new=orig[:flow[0]]+grp(mesa,MX,S)+orig[flow[1]:edli[0]]+grp(term,TX,S*0.9,float(sys.argv[5]))+orig[edli[1]:]
new=new.replace('<svg ','<svg ',1)
new=re.sub(r'(<title>).*?(</title>)',r'\1Six small stations on one long platform joined by a single cyan path: speakers for Ava, a desk for Nura, a drive-thru lane for Mesa, a video wall for Chalk, a task board for Track and a help point beside a plane gate for Terminal.\2',new)
new=new.replace('<style>','%s<style>.bob2{animation:bob 6.5s ease-in-out -2s infinite}@keyframes bob{50%%{transform:translateY(-6.4px)}}'%cg,1).replace('.pulse{animation:none}}','.pulse,.bob2{animation:none}}',1)
open('/tmp/q9port/row/products-row.svg','w').write(new)
