from pathlib import Path

p=Path('loveca-card-browser.js')
s=p.read_text(encoding='utf-8')

old='''          <label>並び順\n            <select id="lovecaSort">\n              <option value="no-asc">カード番号 昇順</option>\n              <option value="no-desc">カード番号 降順</option>\n              <option value="name">カード名</option>\n            </select>\n          </label>\n          <label class="loveca-check-row"><span>☆お気に入りライブのみ</span><input id="lovecaFavoritesOnly" type="checkbox"></label>\n'''
new='''          <label>コスト下限\n            <input id="lovecaCostMin" type="number" inputmode="numeric" min="0" placeholder="例 2">\n          </label>\n          <label>コスト上限\n            <input id="lovecaCostMax" type="number" inputmode="numeric" min="0" placeholder="例 4">\n          </label>\n          <label>ライブスコア下限\n            <input id="lovecaScoreMin" type="number" inputmode="numeric" min="0" placeholder="例 1">\n          </label>\n          <label>ライブスコア上限\n            <input id="lovecaScoreMax" type="number" inputmode="numeric" min="0" placeholder="例 3">\n          </label>\n          <label>ハート種類\n            <select id="lovecaHeartType">\n              <option value="">指定なし</option>\n              <option value="pink">桃</option>\n              <option value="red">赤</option>\n              <option value="yellow">黄</option>\n              <option value="green">緑</option>\n              <option value="blue">青</option>\n              <option value="purple">紫</option>\n              <option value="colorless">無色</option>\n            </select>\n          </label>\n          <label>ハート数 下限\n            <input id="lovecaHeartMin" type="number" inputmode="numeric" min="0" placeholder="例 2">\n          </label>\n          <label>ハート数 上限\n            <input id="lovecaHeartMax" type="number" inputmode="numeric" min="0" placeholder="例 4">\n          </label>\n          <label>ブレード\n            <select id="lovecaBladeFilter">\n              <option value="all">指定なし</option>\n              <option value="yes">あり</option>\n              <option value="no">なし</option>\n            </select>\n          </label>\n          <label>並び順\n            <select id="lovecaSort">\n              <option value="no-asc">カード番号 昇順</option>\n              <option value="no-desc">カード番号 降順</option>\n              <option value="name">カード名</option>\n              <option value="cost-asc">コスト 昇順</option>\n              <option value="cost-desc">コスト 降順</option>\n              <option value="score-asc">ライブスコア 昇順</option>\n              <option value="score-desc">ライブスコア 降順</option>\n            </select>\n          </label>\n          <label class="loveca-check-row"><span>☆お気に入りライブのみ</span><input id="lovecaFavoritesOnly" type="checkbox"></label>\n'''
if old not in s: raise SystemExit('markup target not found')
s=s.replace(old,new,1)

old="""    ['#lovecaQuery','#lovecaTypeFilter','#lovecaColorFilter','#lovecaRarityFilter','#lovecaExpansionFilter','#lovecaSort','#lovecaFavoritesOnly']\n      .forEach(selector=>document.querySelector(selector)?.addEventListener(selector==='#lovecaQuery'?'input':'change',()=>{visibleCount=PAGE_SIZE;applyFilters()}));\n"""
new="""    ['#lovecaQuery','#lovecaTypeFilter','#lovecaColorFilter','#lovecaRarityFilter','#lovecaExpansionFilter','#lovecaCostMin','#lovecaCostMax','#lovecaScoreMin','#lovecaScoreMax','#lovecaHeartType','#lovecaHeartMin','#lovecaHeartMax','#lovecaBladeFilter','#lovecaSort','#lovecaFavoritesOnly']\n      .forEach(selector=>document.querySelector(selector)?.addEventListener(['#lovecaQuery','#lovecaCostMin','#lovecaCostMax','#lovecaScoreMin','#lovecaScoreMax','#lovecaHeartMin','#lovecaHeartMax'].includes(selector)?'input':'change',()=>{visibleCount=PAGE_SIZE;applyFilters()}));\n"""
if old not in s: raise SystemExit('bind target not found')
s=s.replace(old,new,1)

old="""      document.querySelector('#lovecaExpansionFilter').value='';\n      document.querySelector('#lovecaSort').value='no-asc';\n      document.querySelector('#lovecaFavoritesOnly').checked=false;\n"""
new="""      document.querySelector('#lovecaExpansionFilter').value='';\n      document.querySelector('#lovecaCostMin').value='';\n      document.querySelector('#lovecaCostMax').value='';\n      document.querySelector('#lovecaScoreMin').value='';\n      document.querySelector('#lovecaScoreMax').value='';\n      document.querySelector('#lovecaHeartType').value='';\n      document.querySelector('#lovecaHeartMin').value='';\n      document.querySelector('#lovecaHeartMax').value='';\n      document.querySelector('#lovecaBladeFilter').value='all';\n      document.querySelector('#lovecaSort').value='no-asc';\n      document.querySelector('#lovecaFavoritesOnly').checked=false;\n"""
if old not in s: raise SystemExit('clear target not found')
s=s.replace(old,new,1)

old="""    const expansion=document.querySelector('#lovecaExpansionFilter')?.value||'';\n    const favOnly=!!document.querySelector('#lovecaFavoritesOnly')?.checked;\n    const favs=favorites();\n\n    filtered=cards.filter(card=>{\n"""
new="""    const expansion=document.querySelector('#lovecaExpansionFilter')?.value||'';\n    const costMin=numberOrNull(document.querySelector('#lovecaCostMin')?.value);\n    const costMax=numberOrNull(document.querySelector('#lovecaCostMax')?.value);\n    const scoreMin=numberOrNull(document.querySelector('#lovecaScoreMin')?.value);\n    const scoreMax=numberOrNull(document.querySelector('#lovecaScoreMax')?.value);\n    const heartType=document.querySelector('#lovecaHeartType')?.value||'';\n    const heartMin=numberOrNull(document.querySelector('#lovecaHeartMin')?.value);\n    const heartMax=numberOrNull(document.querySelector('#lovecaHeartMax')?.value);\n    const bladeFilter=document.querySelector('#lovecaBladeFilter')?.value||'all';\n    const favOnly=!!document.querySelector('#lovecaFavoritesOnly')?.checked;\n    const favs=favorites();\n\n    filtered=cards.filter(card=>{\n"""
if old not in s: raise SystemExit('vars target not found')
s=s.replace(old,new,1)

old="""      if(expansion&&String(card.expansion||'')!==expansion)return false;\n      if(favOnly&&!favs.has(String(card.id)))return false;\n      if(query){\n"""
new="""      if(expansion&&String(card.expansion||'')!==expansion)return false;\n\n      const cost=numberOrNull(card.cost);\n      if(costMin!==null&&(cost===null||cost<costMin))return false;\n      if(costMax!==null&&(cost===null||cost>costMax))return false;\n\n      const score=numberOrNull(card.score);\n      if(scoreMin!==null&&(!card.isLive||score===null||score<scoreMin))return false;\n      if(scoreMax!==null&&(!card.isLive||score===null||score>scoreMax))return false;\n\n      if(heartType){\n        const heartCount=Number(card.hearts?.[heartType])||0;\n        const effectiveMin=heartMin===null?1:heartMin;\n        if(heartCount<effectiveMin)return false;\n        if(heartMax!==null&&heartCount>heartMax)return false;\n      }else if(heartMin!==null||heartMax!==null){\n        const values=Object.values(card.hearts||{}).map(Number).filter(Number.isFinite);\n        const matches=values.some(value=>(heartMin===null||value>=heartMin)&&(heartMax===null||value<=heartMax));\n        if(!matches)return false;\n      }\n\n      const hasBlade=bladeCount(card)>0;\n      if(bladeFilter==='yes'&&!hasBlade)return false;\n      if(bladeFilter==='no'&&hasBlade)return false;\n      if(favOnly&&!favs.has(String(card.id)))return false;\n      if(query){\n"""
if old not in s: raise SystemExit('filter target not found')
s=s.replace(old,new,1)

old="""    const sort=document.querySelector('#lovecaSort')?.value||'no-asc';\n    filtered.sort((a,b)=>{\n      if(sort==='name')return String(a.name||'').localeCompare(String(b.name||''),'ja',{numeric:true});\n      const result=String(a.cardNo||'').localeCompare(String(b.cardNo||''),'ja',{numeric:true});\n      return sort==='no-desc'?-result:result;\n    });\n"""
new="""    const sort=document.querySelector('#lovecaSort')?.value||'no-asc';\n    filtered.sort((a,b)=>{\n      if(sort==='name')return String(a.name||'').localeCompare(String(b.name||''),'ja',{numeric:true});\n      if(sort==='cost-asc'||sort==='cost-desc'){\n        const av=numberOrNull(a.cost),bv=numberOrNull(b.cost);\n        const result=(av??9999)-(bv??9999);\n        return sort==='cost-desc'?-result:result;\n      }\n      if(sort==='score-asc'||sort==='score-desc'){\n        const av=numberOrNull(a.score),bv=numberOrNull(b.score);\n        const result=(av??9999)-(bv??9999);\n        return sort==='score-desc'?-result:result;\n      }\n      const result=String(a.cardNo||'').localeCompare(String(b.cardNo||''),'ja',{numeric:true});\n      return sort==='no-desc'?-result:result;\n    });\n"""
if old not in s: raise SystemExit('sort target not found')
s=s.replace(old,new,1)

insert="""\n  function numberOrNull(value){\n    const text=String(value??'').trim();\n    if(!text||!/^\\d+(?:\\.\\d+)?$/.test(text))return null;\n    const n=Number(text);\n    return Number.isFinite(n)?n:null;\n  }\n\n  function bladeCount(card){\n    const candidates=[card.bladeHeart,card.attack];\n    for(const value of candidates){\n      const text=String(value??'').trim();\n      if(!text||text==='-'||text==='0')continue;\n      const nums=text.match(/\\d+/g);\n      if(nums)return nums.map(Number).reduce((a,b)=>a+b,0);\n      if(/blade|ブレード/i.test(text))return 1;\n    }\n    return 0;\n  }\n"""
needle='''  function applyFilters(){\n'''
if needle not in s: raise SystemExit('function insertion target not found')
s=s.replace(needle,insert+'\n'+needle,1)

p.write_text(s,encoding='utf-8')

css=Path('loveca-card-browser.css')
c=css.read_text(encoding='utf-8')
c=c.replace('.loveca-search-row input,\n.loveca-filter-grid select{','.loveca-search-row input,\n.loveca-filter-grid select,\n.loveca-filter-grid input{',1)
css.write_text(c,encoding='utf-8')

sw=Path('sw.js')
w=sw.read_text(encoding='utf-8')
import re
w=re.sub(r"v20260909-\\d+",'v20260909-5',w,count=1)
sw.write_text(w,encoding='utf-8')
