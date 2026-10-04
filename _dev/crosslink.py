#!/usr/bin/env python3
"""Fill the 'Try these problems' strips in the notes and add section numbers to 'Study first' links.
Run AFTER a render (needs _site/notes/chN.html for section numbers). Re-run render afterwards.
Usage: python3 _dev/crosslink.py
"""
import re, pathlib, html
from html.parser import HTMLParser
R = pathlib.Path(__file__).resolve().parent.parent

class Secs(HTMLParser):
    """collect section ids, their numbers/titles and parent level-2 section"""
    def __init__(s):
        super().__init__(); s.stack=[]; s.info={}; s.cur=None; s.buf=''
    def handle_starttag(s, tag, a):
        a=dict(a)
        if tag=='section':
            s.stack.append((a.get('id'), a.get('class','')))
        if tag in ('h2','h3') and s.stack:
            s.cur=(tag,a.get('data-number')); s.buf=''
    def handle_endtag(s, tag):
        if tag=='section' and s.stack: s.stack.pop()
        if tag in ('h2','h3') and s.cur:
            sid=s.stack[-1][0] if s.stack else None
            l2=[i for i,c in s.stack if 'level2' in c]
            title=re.sub(r'^\s*[\d.]+\s*','',s.buf).strip()
            if sid: s.info[sid]={'num':s.cur[1],'title':title,'parent':l2[-1] if l2 else sid}
            s.cur=None
    def handle_data(s, d):
        if s.cur: s.buf+=d

secinfo={}
for n in range(1,5):
    f=R/f'_site/notes/ch{n}.html'
    p=Secs(); p.feed(f.read_text()); secinfo[n]=p.info

# problems: id, chapter, data-sec, number/title
probs=[]
for f in sorted((R/'problems').glob('_*.qmd')):
    t=f.read_text()
    for m in re.finditer(r'::: \{\.problem #(p[\dR]+-\d+) data-sec="ch(\d):([\w-]+)"[^}]*\}\n### Problem ([\dR.]+) · ([^\n{]+)', t):
        probs.append(dict(id=m[1],ch=int(m[2]),sec=m[3],num=m[4],title=m[5].strip()))
print(len(probs),'problems')

# map each problem to the level-2 section of its data-sec
strips={}
for p in probs:
    info=secinfo[p['ch']].get(p['sec'])
    if not info: print('WARNING unknown section', p); continue
    strips.setdefault((p['ch'],info['parent']),[]).append(p)

def keyp(p):
    a,b=p['num'].split('.'); return (a,int(b))
for n in range(1,5):
    f=R/f'notes/ch{n}.qmd'; t=f.read_text()
    # Ch1 used fixed strips; convert them to placeholders so everything is generated the same way
    def fill(m):
        sec=m[1]; ps=sorted(strips.get((n,sec),[]),key=keyp)
        if not ps: return f'::: {{.try-problems data-sec="{sec}"}}\n:::'  # keep empty placeholder (hidden by CSS)
        links=', '.join(f'[Problem {p["num"]}](../problems/index.qmd#{p["id"]})' for p in ps)
        return f'::: {{.try-problems data-sec="{sec}"}}\n**Try these problems:** {links}\n:::'
    t=re.sub(r'::: \{\.try-problems data-sec="([\w-]+)"\}\n(?:[^\n]*\n)??:::', fill, t)
    f.write_text(t)

# add § numbers to links into the notes that lack them (problems, workshops, slides notes-links excluded)
def addnum(m):
    text,n,sec=m[1],int(m[2]),m[3]
    if text.startswith('§') or 'Notes' in text: return m[0]
    info=secinfo[n].get(sec)
    if not info or not info['num']: return m[0]
    return f'[§{info["num"]} {text[0].upper()+text[1:]}](../notes/ch{n}.qmd#{sec})'
for f in list((R/'problems').glob('_*.qmd'))+list((R/'workshops').glob('*.qmd')):
    t=f.read_text()
    t2=re.sub(r'(?<=Study first: )\[([^\]]+)\]\(\.\./notes/ch(\d)\.qmd#([\w-]+)\)', addnum, t)
    t2=re.sub(r'(?<= and )\[([^\]]+)\]\(\.\./notes/ch(\d)\.qmd#([\w-]+)\)(?=[^\n]*\]\{\.meta\})', addnum, t2)
    if t2!=t: f.write_text(t2); print('numbered links in', f.name)
for (n,sec),ps in sorted(strips.items()): print(n,sec,[p['num'] for p in sorted(ps,key=keyp)])
