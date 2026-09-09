from pathlib import Path
import re

js=Path('loveca-card-browser.js')
s=js.read_text(encoding='utf-8')

anchor='''          <label>色
            <select id="lovecaColorFilter"><option value="">すべて</option></select>
          </label>'''
insert='''          <label>作品名
            <select id="lovecaWorkFilter"><option value="">すべて</option></select>
          </label>
'''+anchor
if '#lovecaWorkFilter' not in s:
    if anchor not in s: raise SystemExit('work markup anchor not found')
    s=s.replace(anchor,insert,1)

old="""    fillSelect('#lovecaColorFilter',unique(cards.map(c=>c.color)));
    fillSelect('#lovecaRarityFilter',unique(cards.map(c=>c.rarity)));"""
new="""    fillSelect('#lovecaWorkFilter',unique(cards.map(c=>c.work)));
    fillSelect('#lovecaColorFilter',unique(cards.map(c=>c.color)));
    fillSelect('#lovecaRarityFilter',unique(cards.map(c=>c.rarity)));"""
if old in s and "fillSelect('#lovecaWorkFilter'" not in s:s=s.replace(old,new,1)

old_list="['#lovecaQuery','#lovecaTypeFilter','#lovecaColorFilter','#lovecaRarityFilter','#lovecaExpansionFilter','#lovecaCostMin','#lovecaCostMax','#lovecaScoreMin','#lovecaScoreMax','#lovecaHeartType','#lovecaHeartMin','#lovecaHeartMax','#lovecaBladeFilter','#lovecaSort','#lovecaFavoritesOnly']"
new_list="['#lovecaQuery','#lovecaTypeFilter','#lovecaWorkFilter','#lovecaColorFilter','#lovecaRarityFilter','#lovecaExpansionFilter','#lovecaCostMin','#lovecaCostMax','#lovecaScoreMin','#lovecaScoreMax','#lovecaHeartType','#lovecaHeartMin','#lovecaHeartMax','#lovecaBladeFilter','#lovecaSort','#lovecaFavoritesOnly']"
s=s.replace(old_list,new_list,1)

old="""      document.querySelector('#lovecaTypeFilter').value='all';
      document.querySelector('#lovecaColorFilter').value='';"""
new="""      document.querySelector('#lovecaTypeFilter').value='all';
      document.querySelector('#lovecaWorkFilter').value='';
      document.querySelector('#lovecaColorFilter').value='';"""
s=s.replace(old,new,1)

old="""    const type=document.querySelector('#lovecaTypeFilter')?.value||'all';
    const color=document.querySelector('#lovecaColorFilter')?.value||'';"""
new="""    const type=document.querySelector('#lovecaTypeFilter')?.value||'all';
    const work=document.querySelector('#lovecaWorkFilter')?.value||'';
    const color=document.querySelector('#lovecaColorFilter')?.value||'';"""
s=s.replace(old,new,1)

old="""      if(type==='energy'&&cardType!=='エネルギー')return false;
      if(color&&String(card.color||'')!==color)return false;"""
new="""      if(type==='energy'&&cardType!=='エネルギー')return false;
      if(work&&String(card.work||'')!==work)return false;
      if(color&&String(card.color||'')!==color)return false;"""
s=s.replace(old,new,1)
js.write_text(s,encoding='utf-8')

css=Path('loveca-card-browser.css')
c=css.read_text(encoding='utf-8')
extra='''
.loveca-filter-compact{margin-top:12px}
.loveca-filter-actions{display:flex;align-items:center;justify-content:space-between;gap:10px}
.loveca-filter-actions .primary-btn{flex:1;min-height:44px}
.loveca-selected-filter-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:10px}
.loveca-selected-filter-grid label{display:flex;flex-direction:column;gap:5px;color:#666;font-size:.85rem;font-weight:700}
.loveca-selected-filter-grid input,.loveca-selected-filter-grid select{width:100%;min-height:42px;border:1px solid #d9d3d7;border-radius:10px;background:#fff;padding:8px 10px;font:inherit}
.loveca-selected-filter-grid .loveca-check-row{flex-direction:row;align-items:center;justify-content:space-between;min-height:42px;padding:8px 10px;border:1px solid #e4dde1;border-radius:10px;background:#fff}
.loveca-selected-filter-grid .loveca-check-row input{width:20px;height:20px}
.loveca-filter-chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}
.loveca-filter-chip{display:inline-flex;align-items:center;gap:6px;border:1px solid #efb7ca;border-radius:999px;background:#fff4f8;color:#b93667;padding:6px 9px;font:inherit;font-size:.78rem;font-weight:700}
.loveca-filter-chip b{font-size:1rem;line-height:1}
.loveca-filter-dialog{width:min(92vw,520px);border:0;border-radius:18px;padding:0;box-shadow:0 18px 60px rgba(0,0,0,.18)}
.loveca-filter-dialog::backdrop{background:rgba(30,20,25,.42)}
.loveca-filter-dialog-card{padding:18px}
.loveca-filter-choice-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:14px}
.loveca-filter-choice-grid label{display:flex;align-items:center;gap:8px;padding:11px;border:1px solid #e6dde2;border-radius:12px;background:#fff;font-weight:700;color:#555}
.loveca-filter-choice-grid input{width:20px;height:20px}
.loveca-filter-dialog-actions{margin-top:16px}
.loveca-filter-dialog-actions .primary-btn{width:100%;min-height:46px}
@media (max-width:480px){.loveca-selected-filter-grid,.loveca-filter-choice-grid{grid-template-columns:1fr 1fr}}
'''
if '.loveca-filter-compact{' not in c:c+=extra
css.write_text(c,encoding='utf-8')

index=Path('index.html')
h=index.read_text(encoding='utf-8')
if './loveca-filter-selector.js' not in h:
    marker='<script src="./loveca-card-browser.js"></script>'
    if marker not in h: raise SystemExit('index script marker not found')
    h=h.replace(marker,marker+'\n  <script src="./loveca-filter-selector.js"></script>',1)
index.write_text(h,encoding='utf-8')

sw=Path('sw.js')
w=sw.read_text(encoding='utf-8')
w=re.sub(r'v20260909-\d+','v20260909-6',w,count=1)
if "'./loveca-filter-selector.js'" not in w:
    marker="  './loveca-card-browser.js',"
    if marker not in w: raise SystemExit('sw marker not found')
    w=w.replace(marker,marker+"\n  './loveca-filter-selector.js',",1)
sw.write_text(w,encoding='utf-8')
