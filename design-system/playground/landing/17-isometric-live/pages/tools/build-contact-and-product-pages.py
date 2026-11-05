#!/usr/bin/env python3
"""Turn the approved canvas boards (contact + six products) into production pages."""
import re, shutil, sys, html
from pathlib import Path

CANVAS = Path('/Users/macmini/code/canvas/canvases/q9-website-revamp')
SITE = Path('/Users/macmini/code/hostinger-migration/sites/q9labs.ai/assets')
BACKUP = Path('/Users/macmini/code/hostinger-migration/rollback/q9labs-pages-before-2026-11-05/assets')

home = (SITE / 'index.html').read_text()
tokens = (CANVAS / 'tokens.css').read_text()
tokens = re.sub(r'/\*.*?\*/', '', tokens, flags=re.S)
tokens = re.sub(r'\n\s*\n+', '\n', tokens).strip()

# favicons, apple-touch-icon and theme-color exactly as the homepage has them
icons = home[home.index('<meta name="theme-color"'):home.index('<script type="application/ld+json">')]
# GA + PostHog snippet exactly as the homepage has it (the script right after the WhatsApp float)
analytics = home[home.index('</a>\n<script>\n(function(){\n  var h=location.hostname;') + 5:home.index('</body>')]
font_preload = '<link rel="preload" href="/img/home/fonts/GeneralSans-500.woff2" as="font" type="font/woff2" crossorigin>'
font_face = ''.join(
    '@font-face{font-family:"General Sans";src:url(/img/home/fonts/GeneralSans-%d.woff2) format("woff2");font-weight:%d;font-style:normal;font-display:swap}\n' % (w, w)
    for w in (400, 500, 600))

LIVE_VALUES = {
    'ava': 'Ava - AI Voice Calling Platform',
    'nura': 'Nura - AI Hiring & Interview Platform',
    'flow': 'Flow - Voice-First Customer Service',
    'chalk': 'Chalk - Real-Time Collaboration',
    'track': 'Track - Project Management',
    'edli': 'Edli - AI-Powered School OS',
    'custom': 'Custom AI Solution',
    'other': 'Other',
}

EXTRA_CSS = '''
/* request form states */
.ferr{margin:.375rem 0 0;color:#b42318;font-size:.875rem;line-height:1.4;font-weight:500}
.ferr[hidden]{display:none}
.ferr--alert{grid-column:1/-1;margin:0 0 .75rem;padding:.75rem 1rem;border:1px solid #b42318;border-radius:.625rem;background:#fef3f2;font-size:.9375rem}
input[aria-invalid="true"]{border-color:#b42318!important}
fieldset[aria-invalid="true"] .chip span,fieldset[aria-invalid="true"] .opt span{border-color:#b42318}
.captcha{grid-column:1/-1;min-height:4.875rem;max-width:100%}
.btn[disabled]{opacity:.6;cursor:progress;transform:none}
.sent{grid-column:1/-1;display:grid;gap:.75rem;justify-items:start;padding:clamp(.5rem,2vw,1.5rem) 0;outline:none}
.sent[hidden]{display:none}
.sent svg{width:3rem;height:3rem;padding:.75rem;border:var(--edge) solid var(--q9-ink);border-radius:50%;background:var(--q9-cyan);color:var(--q9-ink)}
.sent h3{font-size:clamp(1.5rem,3vw,2rem);letter-spacing:-.03em}
.sent p{color:var(--q9-n-600);font-size:1.0625rem;max-width:32rem}
.is-sent>:not(.sent){display:none}
'''

SENT = ('<div class="sent" role="status" tabindex="-1" hidden>'
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5 10 17.5 19 7"/></svg>'
        '<h3>Thanks, we have your request.</h3>'
        '<p>We reply within 24 hours with the right agent, the right workflow, and a concrete first step.</p></div>')

OLD_IDS = {'f-name': 'full_name', 'f-email': 'business_email', 'f-phone': 'phone_whatsapp', 'f-city': 'city'}
OLD_NAMES = {'name': 'full_name', 'email': 'business_email', 'phone': 'phone_whatsapp', 'city': 'city'}


def live_head(src):
    """title, description, robots, canonical, OG, Twitter and JSON-LD from the page being replaced."""
    h = src[src.index('<head>'):src.index('</head>')]
    parts = [re.search(r'<title>.*?</title>', h).group(0)]
    parts += re.findall(r'<meta name="(?:description|robots|googlebot)"[^>]*/>', h)
    parts += re.findall(r'<link rel="canonical"[^>]*/>', h)
    parts += re.findall(r'<meta property="og:[^>]*/>', h)
    parts += re.findall(r'<meta name="twitter:[^>]*/>', h)
    ld = re.search(r'<script type="application/ld\+json">.*?</script>', src, re.S).group(0)
    return ''.join(parts), ld


def convert_form(body):
    # field ids and names follow the live form
    for old, new in OLD_IDS.items():
        body = body.replace('id="%s"' % old, 'id="%s"' % new).replace('for="%s"' % old, 'for="%s"' % new)
    for old, new in OLD_NAMES.items():
        body = body.replace('name="%s"' % old, 'name="%s"' % new)
    # per-field error line
    body = re.sub(r'(<input id="(full_name|business_email|phone_whatsapp|city)"[^>]*>)',
                  lambda m: '%s<p class="ferr" id="%s-error" hidden></p>' % (m.group(1), m.group(2)), body)
    # live product values
    def value(m):
        return '<input type="checkbox" name="product_interest" value="%s">' % html.escape(LIVE_VALUES[m.group(1)], quote=True).replace('&#x27;', "'")
    body = re.sub(r'<input type="checkbox" name="(?:products|product_interest)" value="(\w+)">', value, body)
    # the product pages only list six; the live form also has Custom AI Solution and Other
    if 'value="custom"' not in body and 'Custom AI Solution' not in body:
        extra = ''.join('<label class="opt"><input type="checkbox" name="product_interest" value="%s"><span>%s</span></label>'
                        % (html.escape(LIVE_VALUES[k]), t) for k, t in (('custom', 'Custom AI Solution'), ('other', 'Other')))
        body = body.replace('</div></fieldset>', extra + '</div></fieldset>', 1)
    body = body.replace('</fieldset>', '<p class="ferr" id="product_interest-error" hidden></p></fieldset>', 1)
    # real reCAPTCHA mount point
    body = re.sub(r'<div class="captcha".*?</small></div>', '<div class="captcha" id="captcha"></div>', body, count=1, flags=re.S)
    # submit: label span, alert line
    body = body.replace('Send request<svg', '<span class="btn-label">Send request</span><svg', 1)
    body = re.sub(r'(<div class="form__(?:submit|send)">)', r'<p class="ferr ferr--alert" id="form-alert" role="alert" hidden></p>\1', body, count=1)
    # plain-HTML fallback must never GET/POST the data anywhere
    body = body.replace('<form class="form" id="form" action="/contact-us" method="post">', '<form class="form" id="form" novalidate onsubmit="return false">')
    body = body.replace('</form>', SENT + '</form>', 1)
    return body


def build(name, board, backup_html, out):
    b = (CANVAS / 'boards' / board).read_text()
    src = (BACKUP / backup_html).read_text()
    meta, ld = live_head(src)

    style = re.search(r'<style>(.*?)</style>', b, re.S).group(1)
    style = re.sub(r'@font-face\{font-family:"General Sans";[^\n]*\n', '', style)
    style = re.sub(r'\.captcha[^\n]*\n', '', style)
    style += EXTRA_CSS

    body = b[b.index('<body>') + 6:b.index('</body>')]
    # board scripts: keep the menu script, drop nothing else
    body = convert_form(body)
    body = body.replace('../assets/', '/img/site/')

    head = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
            + meta + icons + ld + font_preload + '\n'
            '<style>\n' + tokens + '\n' + font_face + '</style>\n'
            '<style>' + style + '</style>\n</head>\n<body>')
    out_html = head + body + '<script src="/js/request-form.js" defer></script>\n' + analytics + '</body>\n</html>\n'
    assert '../' not in out_html and 'canvases' not in out_html and 'fontshare' not in out_html, name
    out.write_text(out_html)
    return out_html


if __name__ == '__main__':
    pages = [('contact', 'contact.html', 'contact-us.html', SITE / 'contact-us.html')]
    for p in ('ava', 'nura', 'chalk', 'track', 'flow', 'edli'):
        pages.append((p, p + '.html', 'products/%s.html' % p, SITE / 'products' / (p + '.html')))
    used = set()
    for name, board, backup_html, out in pages:
        h = build(name, board, backup_html, out)
        used |= set(re.findall(r'/img/site/([A-Za-z0-9_.-]+)', h))
    (SITE / 'img' / 'site').mkdir(exist_ok=True)
    for f in sorted(used):
        shutil.copyfile(CANVAS / 'assets' / f, SITE / 'img' / 'site' / f)
    print('copied', len(used), 'assets:', ' '.join(sorted(used)))
