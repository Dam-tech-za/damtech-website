"""Summarise a Google Search Console "Performance on Search" export.

Usage (from the repo root):
  python3 -I research/scripts/gsc_summary.py <unzipped-export-dir> . research/search-console-YYYY-MM-DD

Writes monthly.csv, queries-tagged.csv, query-themes.csv, pages-combined.csv and
blog-posts-performance.csv. Old WordPress blog URLs are merged into their /blog/ slug
using lib/blog-url-moves.ts. Copy the raw CSVs into <out>/raw/ yourself.
"""
import csv, sys, re, collections, json

D,R,O=sys.argv[1:4]
def rd(f):
    with open(f"{D}/{f}",encoding='utf-8-sig') as h: return list(csv.DictReader(h))
def w(name,hdr,rows):
    with open(f"{O}/{name}","w",newline='',encoding='utf-8') as h:
        x=csv.writer(h,lineterminator='\n');x.writerow(hdr);x.writerows(rows)
def pct(c,i): return f"{c/i*100:.2f}%" if i else "0%"
# monthly
last_day=max(r['Date'] for r in rd('Chart.csv'))
m=collections.defaultdict(lambda:[0,0,0.0])
for r in rd('Chart.csv'):
    k=r['Date'][:7];c=int(r['Clicks']);i=int(r['Impressions']);m[k][0]+=c;m[k][1]+=i;m[k][2]+=float(r['Position'])*i
w('monthly.csv',['month','clicks','impressions','ctr','avg_position_weighted','note'],
  [[k,v[0],v[1],pct(v[0],v[1]),f"{v[2]/v[1]:.1f}",'3-31 May only' if k=='2026-05' else ('1-2 Nov only' if k=='2026-11' else '')] for k,v in sorted(m.items())])
# queries with themes
q=rd('Queries.csv')
themes=[('brand',r'dam ?tech'),
('competitor-brand',r'duraflex|jojo|kaytech|pioneer|aquadam'),
('residential-waterproofing',r'waterproof|roof|damp|torch|bitumen|leak detection|sealant|drip flashing|concrete sealing|foundation sealing'),
('geomembrane-hdpe-pvc-liner',r'liner|lining|geomembrane|hdpe|pvc|membrane'),
('fish-pond-trough',r'fish|trough|koi|pond'),
('steel-tank-specific',r'steel|galvani|corrugated|zinc|panel|bolted|pressed|sectional|metal'),
('water-tank-generic',r'tank|\d+ ?(000)? ?(l|lt|ltr|litre|liter)s?\b'),
('farm-dam-reservoir-borehole',r'dam|reservoir|borehole|irrigation|farm'),
]
loc=r"betty|kleinmond|hermanus|gansbaai|overstrand|pringle|rooi els|grabouw|western cape|cape town|overberg"
gp=r'pretoria|centurion|gauteng|johannesburg|midrand'
rows=[];agg=collections.defaultdict(lambda:[0,0,0,0.0])
for r in q:
    s=r['Top queries'];c=int(r['Clicks']);i=int(r['Impressions']);p=float(r['Position'])
    t=next((n for n,rx in themes if re.search(rx,s)),'other')
    region='overstrand-western-cape' if re.search(loc,s) else ('gauteng' if re.search(gp,s) else '')
    intent='price' if re.search(r'price|cost|cheap|for sale|how much|affordable',s) else ('question' if re.search(r'^(how|what|why|can|is|which|when)\b|size|diameter|calculat',s) else '')
    band='top-3' if p<=3 else 'page-1' if p<=10 else 'striking-11-20' if p<=20 else 'page-3-plus'
    rows.append([s,c,i,r['CTR'],p,t,region,intent,band])
    for k in (t,):
        a=agg[k];a[0]+=1;a[1]+=c;a[2]+=i;a[3]+=p*i
rows.sort(key=lambda x:-x[2])
w('queries-tagged.csv',['query','clicks','impressions','ctr','position','theme','region','intent','position_band'],rows)
w('query-themes.csv',['theme','queries','clicks','impressions','ctr','avg_position_weighted'],
  [[k,v[0],v[1],v[2],pct(v[1],v[2]),f"{v[3]/v[2]:.1f}"] for k,v in sorted(agg.items(),key=lambda x:-x[1][2])])
# pages combined
moves=dict(re.findall(r'"([a-z0-9-]+)":\s*"([a-z0-9-]+)"',open(f"{R}/lib/blog-url-moves.ts").read()))
posts=json.load(open(f"{R}/lib/posts-data.json")); slugs={p['slug']:p for p in posts}
pg=collections.defaultdict(lambda:[0,0,0.0,set()])
for r in rd('Pages.csv'):
    u=re.sub(r'^https?://(www\.)?dam-tech\.co\.za','',r['Top pages']).split('?')[0].split('#')[0].strip('/')
    s=u[5:] if u.startswith('blog/') else u
    key='/blog/'+moves.get(s,s)+'/' if moves.get(s,s) in slugs else '/'+u+('/' if u else '')
    c=int(r['Clicks']);i=int(r['Impressions']);a=pg[key];a[0]+=c;a[1]+=i;a[2]+=float(r['Position'])*i;a[3].add(r['Top pages'])
w('pages-combined.csv',['page','clicks','impressions','ctr','avg_position_weighted','source_urls_merged'],
  [[k,v[0],v[1],pct(v[0],v[1]),f"{v[2]/max(v[1],1):.1f}",len(v[3])] for k,v in sorted(pg.items(),key=lambda x:-x[1][1])])
br=[]
for p in posts:
    v=pg.get('/blog/'+p['slug']+'/',[0,0,0,set()])
    br.append([p['slug'],p['date'],p.get('author') or 'Damtech (legacy)',p['metaTitle'],v[0],v[1],pct(v[0],v[1]),f"{v[2]/v[1]:.1f}" if v[1] else '','published after export window' if p['date']>last_day else ''])
w('blog-posts-performance.csv',['slug','date','author','meta_title','clicks','impressions','ctr','avg_position_weighted','note'],br)
tc=sum(x[4] for x in br);ti=sum(x[5] for x in br);print('blog',tc,ti)
