from pathlib import Path
import re

app=Path('app.js')
text=app.read_text(encoding='utf-8')

old="""function finalEvolutionHtml(p){
  const finals=finalEvolutionList(p);
  if(!finals.length)return '';
  if(finals.length===1 && finals[0].uniqueKey===p.uniqueKey)return '';
  const items=finals.map(f=>{
    const tags=specialTags(f).map(t=>`<span class=\"cat-tag\">${t}</span>`).join('');
    return `${f.name}${tags}`;
  }).join('／');
  const label=finals.length>1?'最終進化候補':'最終進化';
  return `<div class=\"final-evo\">${label}：${items}</div>`;
}
"""
new="""function pokemonStats(p){
  if(!p)return {bst:null,speed:null};
  const stat=window.POKEMON_STATS?.[String(p.id)]||null;
  return {bst:stat?.bst??null,speed:stat?.speed??null};
}
function finalEvolutionStats(p){
  const finals=finalEvolutionList(p);
  const withStats=finals.map(f=>({pokemon:f,...pokemonStats(f)})).filter(x=>x.bst!=null);
  if(!withStats.length)return {bst:null,speed:null,finals:[]};
  const best=withStats.reduce((a,b)=>b.bst>a.bst?b:a,withStats[0]);
  return {bst:best.bst,speed:best.speed,finals:withStats};
}
function finalEvolutionHtml(p){
  const finals=finalEvolutionList(p);
  if(!finals.length)return '';
  if(finals.length===1 && finals[0].uniqueKey===p.uniqueKey)return '';
  const items=finals.map(f=>{
    const tags=specialTags(f).map(t=>`<span class=\"cat-tag\">${t}</span>`).join('');
    const s=pokemonStats(f);
    const stat=s.bst!=null?` <span class=\"poke-stat-mini\">BST ${s.bst} / S ${s.speed??'—'}</span>`:'';
    return `${f.name}${tags}${stat}`;
  }).join('／');
  const label=finals.length>1?'最終進化候補':'最終進化';
  return `<div class=\"final-evo\">${label}：${items}</div>`;
}
"""
if old not in text:
    raise SystemExit('finalEvolutionHtml anchor not found')
text=text.replace(old,new,1)

old2="""      nm.innerHTML=`<div class=\"poke-name\">${p.name}<span class=\"slot-tag\">${slotLabel(j)}</span></div>
        <div class=\"category-tags\">${tagHtml(p)}</div>${finalEvolutionHtml(p)}`;
"""
new2="""      const ownStats=pokemonStats(p);
      const finalStats=finalEvolutionStats(p);
      const statLine=ownStats.bst!=null
        ? `<div class=\"poke-stat-line\">BST ${ownStats.bst} / S ${ownStats.speed??'—'}${finalStats.bst!=null&&finalStats.bst!==ownStats.bst?`　最終BST ${finalStats.bst}`:''}</div>`
        : '';
      nm.innerHTML=`<div class=\"poke-name\">${p.name}<span class=\"slot-tag\">${slotLabel(j)}</span></div>
        <div class=\"category-tags\">${tagHtml(p)}</div>${statLine}${finalEvolutionHtml(p)}`;
"""
if old2 not in text:
    raise SystemExit('result row anchor not found')
text=text.replace(old2,new2,1)

old3="""    card.append(list);box.append(card);
"""
new3="""    const partyFinalBst=g.reduce((sum,p)=>sum+(finalEvolutionStats(p).bst??pokemonStats(p).bst??0),0);
    if(partyFinalBst){
      const total=document.createElement('div');
      total.className='poke-party-stat-total';
      total.textContent=`パーティ最終進化BST合計 ${partyFinalBst}`;
      card.append(total);
    }
    card.append(list);box.append(card);
"""
if old3 not in text:
    raise SystemExit('party anchor not found')
text=text.replace(old3,new3,1)
app.write_text(text,encoding='utf-8')

idx=Path('index.html')
i=idx.read_text(encoding='utf-8')
anchor='<script src="./pokemon-data.js"></script>'
if anchor not in i:
    raise SystemExit('index pokemon-data anchor not found')
if 'pokemon-stats.js' not in i:
    i=i.replace(anchor,anchor+'\n<script src="./pokemon-stats.js"></script>',1)
idx.write_text(i,encoding='utf-8')

css=Path('styles.css')
c=css.read_text(encoding='utf-8')
addition='''\n.poke-stat-line{font-size:.72rem;color:#666;margin-top:3px;line-height:1.35}\n.poke-stat-mini{font-size:.7rem;color:#777;white-space:nowrap}\n.poke-party-stat-total{font-size:.76rem;font-weight:700;color:#666;text-align:right;margin:6px 4px 8px}\n'''
if '.poke-stat-line{' not in c:
    c+=addition
css.write_text(c,encoding='utf-8')

sw=Path('sw.js')
w=sw.read_text(encoding='utf-8')
m=re.search(r"v20260909-(\\d+)",w)
if m:
    n=int(m.group(1))+1
    w=w[:m.start()]+f'v20260909-{n}'+w[m.end():]
if "'./pokemon-stats.js'" not in w:
    w=w.replace("'./pokemon-data.js',","'./pokemon-data.js',\n  './pokemon-stats.js',",1)
sw.write_text(w,encoding='utf-8')
