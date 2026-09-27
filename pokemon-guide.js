
const $=selector=>document.querySelector(selector);
const TYPE_JA={Normal:'ノーマル',Fire:'ほのお',Water:'みず',Electric:'でんき',Grass:'くさ',Ice:'こおり',Fighting:'かくとう',Poison:'どく',Ground:'じめん',Flying:'ひこう',Psychic:'エスパー',Bug:'むし',Rock:'いわ',Ghost:'ゴースト',Dragon:'ドラゴン',Dark:'あく',Steel:'はがね',Fairy:'フェアリー'};

function escapeHtml(value=''){
  return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
function pokemonById(idOrName){
  const data=window.POKEMON_DATA||[];
  const numeric=Number(idOrName);
  const candidates=Number.isFinite(numeric)&&String(idOrName).trim()!==''?
    data.filter(p=>Number(p.id)===numeric):
    data.filter(p=>p.name===String(idOrName));
  return candidates.find(p=>!p.formKey)||candidates[0]||null;
}
function moveName(id){return window.POKEMON_SV_MOVE_NAMES?.[id]||`技${id}`}
function typeNames(p){
  const key=p?.formKey?`${p.id}-${p.formKey}`:String(p?.id||'');
  return (window.POKEMON_TYPES?.[key]||window.POKEMON_TYPES?.[String(p?.id)]||[]).map(t=>TYPE_JA[t]||t);
}
function statText(p){
  const s=window.POKEMON_STATS?.[String(p?.id)]||null;
  return s?`BST ${s.bst??'—'} ／ S ${s.speed??'—'}`:'種族値データなし';
}
function levelLabel(level){
  if(level===-3)return '進化時';
  if(level<=1)return 'Lv.1';
  return `Lv.${level}`;
}
function moveButton(name,sub=''){
  return `<div class="guide-move"><strong>${escapeHtml(name)}</strong>${sub?`<span>${escapeHtml(sub)}</span>`:''}</div>`;
}
function filterMoves(root,query){
  const q=query.trim();
  root.querySelectorAll('.guide-move').forEach(el=>{
    el.classList.toggle('hidden',!!q&&!el.textContent.includes(q));
  });
}
function inheritedEggMoves(p){
  const family=(window.POKEMON_DATA||[]).filter(x=>!x.formKey&&x.evo===p.evo);
  const ids=new Set();
  for(const member of family){
    const learn=window.POKEMON_SV_LEARNSETS?.[member.id]||{};
    (learn.e||[]).forEach(id=>ids.add(id));
  }
  return [...ids];
}
function renderPokemon(id){
  const p=pokemonById(id);
  const detail=$('#guidePokemonDetail');
  if(!p||!detail)return;
  const learn=window.POKEMON_SV_LEARNSETS?.[p.id]||{};
  const level=(learn.l||[]).map(([mid,lev])=>moveButton(moveName(mid),levelLabel(lev))).join('');
  const tm=(learn.t||[]).map(([mid,no])=>moveButton(moveName(mid),no?`TM${no}`:'')).join('');
  const eggMoves=inheritedEggMoves(p);
  const egg=eggMoves.map(mid=>moveButton(moveName(mid),'タマゴ技')).join('');
  const reminder=(learn.r||[]).map(mid=>moveButton(moveName(mid),'思い出し')).join('');
  const types=typeNames(p);
  detail.classList.remove('hidden');
  detail.innerHTML=`
    <div class="guide-detail-head">
      <div>
        <div class="guide-dex-no">No.${String(p.id).padStart(4,'0')}</div>
        <h2>${escapeHtml(p.name)}</h2>
        <div class="guide-type-row">${types.map(t=>`<span class="guide-type-chip">${escapeHtml(t)}</span>`).join('')}</div>
      </div>
      <div class="guide-stat">${escapeHtml(statText(p))}</div>
    </div>
    <label class="block-label">このポケモンの技を絞り込み
      <input id="guideMoveFilter" type="search" placeholder="例：じしん">
    </label>
    <div class="guide-move-section"><h3>レベルで覚える技 <span>${(learn.l||[]).length}</span></h3><div class="guide-move-grid">${level||'<p class="note">データなし</p>'}</div></div>
    <div class="guide-move-section"><h3>わざマシン <span>${(learn.t||[]).length}</span></h3><div class="guide-move-grid">${tm||'<p class="note">データなし</p>'}</div></div>
    <div class="guide-move-section"><h3>タマゴ技 <span>${eggMoves.length}</span></h3><div class="guide-move-grid">${egg||'<p class="note">なし</p>'}</div></div>
    ${(learn.r||[]).length?`<div class="guide-move-section"><h3>思い出し技 <span>${learn.r.length}</span></h3><div class="guide-move-grid">${reminder}</div></div>`:''}
    <p class="hint">SV Ver.3.0.0（藍の円盤込み）の内蔵データを表示しています。特殊フォームは今後個別に補正できます。</p>
  `;
  const filter=$('#guideMoveFilter');
  if(filter)filter.oninput=()=>filterMoves(detail,filter.value);
  detail.scrollIntoView({behavior:'smooth',block:'start'});
}
function renderSuggestions(query=''){
  const root=$('#guidePokemonSuggestions');
  if(!root)return;
  const q=query.trim();
  const data=(window.POKEMON_DATA||[]).filter(p=>!p.formKey&&window.POKEMON_SV_LEARNSETS?.[p.id]);
  const found=(q?data.filter(p=>p.name.includes(q)):data)
    .sort((a,b)=>(q?(b.name.startsWith(q)-a.name.startsWith(q)):0)||a.id-b.id);
  root.innerHTML=found.map(p=>`<button type="button" data-guide-result="${p.id}"><span>No.${String(p.id).padStart(4,'0')}</span><strong>${escapeHtml(p.name)}</strong></button>`).join('')||'<p class="note">該当するポケモンが見つかりません。</p>';
}
function activateGuide(){
  document.querySelectorAll('.poke-tab').forEach(x=>x.classList.toggle('active',x.dataset.pokePane==='guide'));
  document.querySelectorAll('.poke-pane').forEach(x=>x.classList.add('hidden'));
  $('#pokeGuidePane')?.classList.remove('hidden');
}
window.openLovePokeGuide=id=>{
  activateGuide();
  const p=pokemonById(id);
  if(p&&$('#guidePokemonSearch'))$('#guidePokemonSearch').value=p.name;
  renderSuggestions(p?.name||'');
  renderPokemon(id);
};
document.addEventListener('click',event=>{
  const target=event.target.closest('[data-poke-guide-id],[data-guide-result]');
  if(!target)return;
  const id=target.dataset.pokeGuideId||target.dataset.guideResult;
  if(id)window.openLovePokeGuide(id);
});
const search=$('#guidePokemonSearch');
if(search){
  search.addEventListener('input',()=>renderSuggestions(search.value));
  search.addEventListener('focus',()=>renderSuggestions(search.value));
}
renderSuggestions('');


/* ===== Type chart / Speed comparison ===== */
const TYPE_SHORT={Normal:'無',Fire:'炎',Water:'水',Electric:'電',Grass:'草',Ice:'氷',Fighting:'闘',Poison:'毒',Ground:'地',Flying:'飛',Psychic:'超',Bug:'虫',Rock:'岩',Ghost:'霊',Dragon:'竜',Dark:'悪',Steel:'鋼',Fairy:'妖'};
const TYPE_ORDER=['Normal','Fire','Water','Electric','Grass','Ice','Fighting','Poison','Ground','Flying','Psychic','Bug','Rock','Ghost','Dragon','Dark','Steel','Fairy'];
const TYPE_CHART={
 Normal:{Rock:.5,Ghost:0,Steel:.5},Fire:{Fire:.5,Water:.5,Grass:2,Ice:2,Bug:2,Rock:.5,Dragon:.5,Steel:2},
 Water:{Fire:2,Water:.5,Grass:.5,Ground:2,Rock:2,Dragon:.5},Electric:{Water:2,Electric:.5,Grass:.5,Ground:0,Flying:2,Dragon:.5},
 Grass:{Fire:.5,Water:2,Grass:.5,Poison:.5,Ground:2,Flying:.5,Bug:.5,Rock:2,Dragon:.5,Steel:.5},
 Ice:{Fire:.5,Water:.5,Grass:2,Ice:.5,Ground:2,Flying:2,Dragon:2,Steel:.5},
 Fighting:{Normal:2,Ice:2,Poison:.5,Flying:.5,Psychic:.5,Bug:.5,Rock:2,Ghost:0,Dark:2,Steel:2,Fairy:.5},
 Poison:{Grass:2,Poison:.5,Ground:.5,Rock:.5,Ghost:.5,Steel:0,Fairy:2},
 Ground:{Fire:2,Electric:2,Grass:.5,Poison:2,Flying:0,Bug:.5,Rock:2,Steel:2},
 Flying:{Electric:.5,Grass:2,Fighting:2,Bug:2,Rock:.5,Steel:.5},
 Psychic:{Fighting:2,Poison:2,Psychic:.5,Dark:0,Steel:.5},
 Bug:{Fire:.5,Grass:2,Fighting:.5,Poison:.5,Flying:.5,Psychic:2,Ghost:.5,Dark:2,Steel:.5,Fairy:.5},
 Rock:{Fire:2,Ice:2,Fighting:.5,Ground:.5,Flying:2,Bug:2,Steel:.5},
 Ghost:{Normal:0,Psychic:2,Ghost:2,Dark:.5},Dragon:{Dragon:2,Steel:.5,Fairy:0},
 Dark:{Fighting:.5,Psychic:2,Ghost:2,Dark:.5,Fairy:.5},Steel:{Fire:.5,Water:.5,Electric:.5,Ice:2,Rock:2,Steel:.5,Fairy:2},
 Fairy:{Fire:.5,Fighting:2,Poison:.5,Dragon:2,Dark:2,Steel:.5}
};
function renderTypeChart(){
  const root=$('#typeChartTable');if(!root)return;
  const cell=(a,d)=>{const v=TYPE_CHART[a]?.[d]??1;return v===2?'◎':v===.5?'△':v===0?'×':''};
  root.innerHTML=`<table class="type-chart"><thead><tr><th>攻＼防</th>${TYPE_ORDER.map(t=>`<th title="${TYPE_JA[t]}">${TYPE_SHORT[t]}</th>`).join('')}</tr></thead><tbody>${TYPE_ORDER.map(a=>`<tr><th title="${TYPE_JA[a]}">${TYPE_SHORT[a]}</th>${TYPE_ORDER.map(d=>{const mark=cell(a,d);return `<td class="type-effect-${mark==='◎'?'super':mark==='△'?'resist':mark==='×'?'immune':'normal'}">${mark}</td>`}).join('')}</tr>`).join('')}</tbody></table>`;
}
function rankMultiplier(rank){
  const r=Math.max(-6,Math.min(6,Number(rank)||0));
  return r>=0?(2+r)/2:2/(2-r);
}
function speedStat(base,level=50,iv=31,ev=252,nature=1){
  const raw=Math.floor(((2*base+iv+Math.floor(ev/4))*level)/100)+5;
  return Math.floor(raw*nature);
}
const SPEED_ABILITY_BY_NAME={
  'フシギバナ':['ようりょくそ',2],'ラフレシア':['ようりょくそ',2],'ウツボット':['ようりょくそ',2],'ナッシー':['ようりょくそ',2],
  'キレイハナ':['ようりょくそ',2],'ワタッコ':['ようりょくそ',2],'ダーテング':['ようりょくそ',2],'トロピウス':['ようりょくそ',2],
  'リーフィア':['ようりょくそ',2],'エルフーン':['ようりょくそ',2],'ドレディア':['ようりょくそ',2],'マラカッチ':['ようりょくそ',2],
  'メブキジカ':['ようりょくそ',2],'アマージョ':['ようりょくそ',2],'スコヴィラン':['ようりょくそ',2],
  'キングドラ':['すいすい',2],'ハリーセン':['すいすい',2],'ルンパッパ':['すいすい',2],'フローゼル':['すいすい',2],
  'ネオラント':['すいすい',2],'ガマゲロゲ':['すいすい',2],'ツンベアー':['すいすい',2],'イダイトウ':['すいすい',2],'ハリーマン':['すいすい',2],
  'ドリュウズ':['すなかき',2],'ルガルガン':['すなかき',2],'ハカドッグ':['すなかき',2],'サンドパン':['すなかき',2],
  'ツンベアー':['ゆきかき',2],'ハルクジラ':['ゆきかき',2],'アローラサンドパン':['ゆきかき',2],
  'アローラライチュウ':['サーフテール',2],
  'サワムラー':['かるわざ',2],'フワライド':['かるわざ',2],'レパルダス':['かるわざ',2],'ルチャブル':['かるわざ',2],
  'ジュナイパー':['かるわざ',2],'オオニューラ':['かるわざ',2],
  'ハバタクカミ':['こだいかっせい',1.5],'トドロクツキ':['こだいかっせい',1.5],'テツノツツミ':['クォークチャージ',1.5],
  'テツノブジン':['クォークチャージ',1.5],'テツノドクガ':['クォークチャージ',1.5]
};
function benchmarkFor(p){
  const base=Number(window.POKEMON_STATS?.[String(p.id)]?.speed)||0;
  const fastest=speedStat(base,50,31,252,1.1);
  const neutral=speedStat(base,50,31,252,1);
  const ability=SPEED_ABILITY_BY_NAME[p.name]||null;
  return {p,base,fastest,neutral,scarf:Math.floor(fastest*1.5),ability,abilityValue:ability?Math.floor(fastest*ability[1]):null};
}
function tournamentPokemonIds(){
  const value=$('#speedTournamentFilter')?.value||'all';
  if(value==='all')return null;
  const tournament=(window.getLovePokeSpeedTournaments?.()||[]).find(t=>String(t.id)===value);
  if(!tournament)return new Set();
  const ids=[];
  for(const snapshot of (tournament.players||[]).flatMap(p=>p.pokemon||[])){
    const full=(window.POKEMON_DATA||[]).find(p=>Number(p.id)===Number(snapshot.id)&&String(p.formKey||'')===String(snapshot.formKey||''))||
      (window.POKEMON_DATA||[]).find(p=>Number(p.id)===Number(snapshot.id))||snapshot;
    const finals=window.getLovePokeFinalEvolutionList?.(full)||[];
    if(finals.length){
      const best=finals.reduce((a,b)=>(window.POKEMON_STATS?.[String(b.id)]?.bst||0)>(window.POKEMON_STATS?.[String(a.id)]?.bst||0)?b:a,finals[0]);
      ids.push(Number(best.id));
    }else ids.push(Number(snapshot.id));
  }
  return new Set(ids.filter(Number.isFinite));
}
function benchmarkRows(){
  const allowed=tournamentPokemonIds(),q=($('#speedSearch')?.value||'').trim(),seen=new Set();
  return (window.POKEMON_DATA||[]).filter(p=>{
    if(p.formKey||seen.has(Number(p.id)))return false;seen.add(Number(p.id));
    if(allowed&&!allowed.has(Number(p.id)))return false;
    if($('#speedSvOnly')?.checked&&!p.sv)return false;
    if(q&&!p.name.includes(q))return false;
    return !!window.POKEMON_STATS?.[String(p.id)];
  }).map(benchmarkFor).sort((a,b)=>b.fastest-a.fastest||b.base-a.base||a.p.id-b.p.id);
}
function targetPokemon(){
  const name=($('#speedTargetSearch')?.value||'').trim();
  return (window.POKEMON_DATA||[]).find(p=>!p.formKey&&p.name===name)||null;
}
function targetSpeed(){
  const p=targetPokemon();if(!p)return null;
  const base=Number(window.POKEMON_STATS?.[String(p.id)]?.speed)||0;
  const iv=Math.max(0,Math.min(31,Number($('#speedIv')?.value)||0));
  const ev=Math.max(0,Math.min(252,Number($('#speedEv')?.value)||0));
  const nature=Number($('#speedNature')?.value)||1;
  let value=speedStat(base,50,iv,ev,nature);
  value=Math.floor(value*(Number($('#speedItem')?.value)||1));
  const ability=$('#speedAbility')?.value||'1';
  value=Math.floor(value*(ability==='quickfeet'?1.5:(Number(ability)||1)));
  value=Math.floor(value*rankMultiplier($('#speedRank')?.value));
  if($('#speedTailwind')?.checked)value*=2;
  if($('#speedParalysis')?.checked&&ability!=='quickfeet')value=Math.floor(value*.5);
  return {p,base,value:Math.max(1,Math.floor(value))};
}
function renderSpeedTable(){
  const root=$('#speedTable');if(!root)return;
  const rows=benchmarkRows(),target=targetSpeed();
  $('#speedResultCount').textContent=`${rows.length}体`;
  const counts=rows.reduce((m,row)=>(m.set(row.fastest,(m.get(row.fastest)||0)+1),m),new Map());
  let last=null,rank=0;
  root.innerHTML=rows.map((row,index)=>{
    const groupCount=counts.get(row.fastest)||1;
    const groupStart=index===0||rows[index-1].fastest!==row.fastest;
    const groupEnd=index===rows.length-1||rows[index+1].fastest!==row.fastest;
    if(groupStart){rank=index+1;last=row.fastest}
    const targetSame=!!(target&&row.fastest===target.value);
    const near=!!(target&&!targetSame&&Math.abs(row.fastest-target.value)<=1);
    const classes=['speed-row','benchmark-row',groupCount>1?'speed-tie':'',groupStart&&groupCount>1?'speed-tie-start':'',groupEnd&&groupCount>1?'speed-tie-end':'',targetSame?'speed-tie-target':'',near?'target-line-near':''].filter(Boolean).join(' ');
    const tieBadge=groupStart&&groupCount>1?`<small class="speed-tie-badge">同速 ${row.fastest}・${groupCount}体</small>`:'';
    return `<button type="button" class="${classes}" data-poke-guide-id="${row.p.id}"><span class="speed-rank">${rank}</span><span class="speed-name"><strong>${escapeHtml(row.p.name)}</strong>${tieBadge}<small>No.${String(row.p.id).padStart(4,'0')}</small></span><span class="speed-base">S${row.base}</span><span>${row.fastest}</span><span>${row.neutral}</span><span>${row.scarf}</span><span class="speed-ability-value">${row.ability?`${row.abilityValue}<small>${row.ability[0]}</small>`:'—'}</span></button>`;
  }).join('')||'<p class="note">条件に該当するポケモンがいません。</p>';
  renderTargetResult(rows,target);
}
function renderTargetResult(rows,target){
  const root=$('#speedTargetResult');if(!root)return;
  if(!target){root.innerHTML='ポケモンを選ぶと、ここに実数値と位置を表示します。';return}
  const allLines=rows.flatMap(r=>[
    {value:r.fastest,label:`${r.p.name} 最速`},{value:r.neutral,label:`${r.p.name} 準速`},
    {value:r.scarf,label:`${r.p.name} 最速スカーフ`},...(r.ability?[{value:r.abilityValue,label:`${r.p.name} ${r.ability[0]}発動`}]:[])
  ]).sort((a,b)=>b.value-a.value);
  const faster=allLines.filter(x=>x.value>target.value).sort((a,b)=>a.value-b.value)[0];
  const slower=allLines.filter(x=>x.value<target.value).sort((a,b)=>b.value-a.value)[0];
  const equal=allLines.filter(x=>x.value===target.value).slice(0,3);
  root.innerHTML=`<div class="speed-target-main"><strong>${escapeHtml(target.p.name)}</strong><span>S${target.base}</span><b>実数値 ${target.value}</b></div>
    ${equal.length?`<div class="speed-line-equal">同速：${equal.map(x=>escapeHtml(x.label)).join(' / ')}</div>`:''}
    <div class="speed-line-around"><span>ひとつ上：${faster?`${escapeHtml(faster.label)} (${faster.value})`:'なし'}</span><span>ひとつ下：${slower?`${escapeHtml(slower.label)} (${slower.value})`:'なし'}</span></div>`;
}
function refreshTournamentFilter(){
  const select=$('#speedTournamentFilter');if(!select)return;
  const current=select.value,tournaments=window.getLovePokeSpeedTournaments?.()||[];
  select.innerHTML='<option value="all">全ポケモン</option>'+tournaments.map(t=>`<option value="${escapeHtml(t.id)}">${escapeHtml(t._speedLabel||t.name||'大会')}</option>`).join('');
  if([...select.options].some(o=>o.value===current))select.value=current;
  const list=$('#speedPokemonList');
  if(list)list.innerHTML=(window.POKEMON_DATA||[]).filter(p=>!p.formKey&&p.sv).map(p=>`<option value="${escapeHtml(p.name)}"></option>`).join('');
  renderSpeedTable();
}
function showGuideTool(tool='dex'){
  document.querySelectorAll('.guide-tool-tab').forEach(b=>b.classList.toggle('active',b.dataset.guideTool===tool));
  document.querySelectorAll('.guide-tool-pane').forEach(p=>p.classList.add('hidden'));
  const id={dex:'guideDexTool',types:'guideTypesTool',speed:'guideSpeedTool',party:'guidePartyTool',build:'guideBuildTool'}[tool];
  if(id)document.getElementById(id)?.classList.remove('hidden');
  if(tool==='types')renderTypeChart();
  if(tool==='speed'){refreshTournamentFilter();renderSpeedTable()} if(tool==='party')refreshPartyAnalysisSelect(); if(tool==='build')renderBuildMemos()
}
document.querySelectorAll('.guide-tool-tab').forEach(b=>b.addEventListener('click',()=>showGuideTool(b.dataset.guideTool)));
['speedTournamentFilter','speedIv','speedEv','speedNature','speedItem','speedAbility','speedRank','speedTailwind','speedParalysis','speedSvOnly'].forEach(id=>{
  document.getElementById(id)?.addEventListener('change',renderSpeedTable);
});
$('#speedSearch')?.addEventListener('input',renderSpeedTable);
$('#speedTargetSearch')?.addEventListener('input',renderSpeedTable);
window.addEventListener('lovePokeTournamentsUpdated',refreshTournamentFilter);
renderTypeChart();
refreshTournamentFilter();


/* ===== Party analysis / build memo ===== */
const PARTY_TYPE_JA={Normal:'無',Fire:'炎',Water:'水',Electric:'電',Grass:'草',Ice:'氷',Fighting:'闘',Poison:'毒',Ground:'地',Flying:'飛',Psychic:'超',Bug:'虫',Rock:'岩',Ghost:'霊',Dragon:'竜',Dark:'悪',Steel:'鋼',Fairy:'妖'};
function analysisFinal(p){
  const full=(window.POKEMON_DATA||[]).find(x=>Number(x.id)===Number(p.id)&&String(x.formKey||'')===String(p.formKey||''))||(window.POKEMON_DATA||[]).find(x=>Number(x.id)===Number(p.id))||p;
  const finals=window.getLovePokeFinalEvolutionList?.(full)||[];
  if(!finals.length)return full;
  return finals.reduce((a,b)=>(window.POKEMON_STATS?.[String(b.id)]?.bst||0)>(window.POKEMON_STATS?.[String(a.id)]?.bst||0)?b:a,finals[0]);
}
function partyTypeRows(player){
  const mons=(player.pokemon||[]).map(analysisFinal).map(p=>({p,types:window.POKEMON_TYPES?.[String(p.id)]||[]}));
  return TYPE_ORDER.map(atk=>{
    const effects=mons.map(m=>TYPE_CHART[atk]?m.types.reduce((v,t)=>v*(TYPE_CHART[atk]?.[t]??1),1):1);
    return {type:atk,weak:effects.filter(v=>v>1).length,resist:effects.filter(v=>v>0&&v<1).length,immune:effects.filter(v=>v===0).length};
  });
}
function partyCoverage(player){
  const mons=(player.pokemon||[]).map(analysisFinal).map(p=>({p,types:window.POKEMON_TYPES?.[String(p.id)]||[]}));
  return TYPE_ORDER.map(def=>{
    const hitters=mons.filter(m=>m.types.some(atk=>(TYPE_CHART[atk]?.[def]??1)>1));
    return {def,hitters};
  });
}
function renderPartyAnalysis(){
  const root=$('#partyAnalysisResult'),sel=$('#partyAnalysisSelect');if(!root||!sel)return;
  const [tid,pid]=(sel.value||'').split('::'),t=(window.getLovePokeSpeedTournaments?.()||[]).find(x=>String(x.id)===tid),player=t?.players?.find(p=>String(p.playerId||p.id)===pid);
  if(!player){root.innerHTML='<p class="note">大会とプレイヤーを選ぶと6体をまとめて分析します。</p>';return}
  const typeRows=partyTypeRows(player),coverage=partyCoverage(player),mons=(player.pokemon||[]).map(analysisFinal);
  root.innerHTML=`<div class="party-analysis-title"><strong>${escapeHtml(player.displayName||player.name||'PLAYER')}</strong><span>${mons.map(x=>escapeHtml(x.name)).join('・')}</span></div>
    <h3>弱点・耐性</h3><div class="party-type-grid">${typeRows.map(x=>`<div class="${x.weak>=3?'party-danger':''}"><b>${PARTY_TYPE_JA[x.type]}</b><span>弱 ${x.weak}</span><span>耐 ${x.resist}</span><span>無 ${x.immune}</span></div>`).join('')}</div>
    <h3>攻撃範囲（タイプ一致）</h3><div class="coverage-grid">${coverage.map(x=>`<div class="${x.hitters.length?'covered':'uncovered'}"><b>${PARTY_TYPE_JA[x.def]}</b><span>${x.hitters.length?`抜群 ${x.hitters.length}体`:'抜群なし'}</span><small>${x.hitters.map(h=>escapeHtml(h.p.name)).join('・')}</small></div>`).join('')}</div>`;
}
function refreshPartyAnalysisSelect(){
  const sel=$('#partyAnalysisSelect');if(!sel)return;const current=sel.value,ts=window.getLovePokeSpeedTournaments?.()||[];
  sel.innerHTML='<option value="">大会・プレイヤーを選択</option>'+ts.flatMap(t=>(t.players||[]).map(p=>`<option value="${escapeHtml(t.id)}::${escapeHtml(p.playerId||p.id)}">${escapeHtml(t._speedLabel||t.name)} / ${escapeHtml(p.displayName||p.name)}</option>`)).join('');
  if([...sel.options].some(o=>o.value===current))sel.value=current;renderPartyAnalysis();
}
$('#partyAnalysisSelect')?.addEventListener('change',renderPartyAnalysis);
window.addEventListener('lovePokeTournamentsUpdated',refreshPartyAnalysisSelect);
/* ===== Photo stat -> EV estimator ===== */
const PHOTO_KEYS=['hp','attack','defense','spAttack','spDefense','speed'];
const PHOTO_IDS={hp:'statPhotoHp',attack:'statPhotoAtk',defense:'statPhotoDef',spAttack:'statPhotoSpa',spDefense:'statPhotoSpd',speed:'statPhotoSpe'};
const PHOTO_SHORT={hp:'H',attack:'A',defense:'B',spAttack:'C',spDefense:'D',speed:'S'};
function photoNature(k){const u=$('#statPhotoNatureUp')?.value,d=$('#statPhotoNatureDown')?.value;return u===k?1.1:(d===k?0.9:1)}
function photoStat(base,k,lv,iv,ev){const q=Math.floor(((2*base+iv+Math.floor(ev/4))*lv)/100);return k==='hp'?q+lv+10:Math.floor((q+5)*photoNature(k))}
function photoEvOpts(base,k,lv,val,iv){const a=[];for(let ev=0;ev<=252;ev+=4)if(photoStat(base,k,lv,iv,ev)===val)a.push(ev);return a}
function photoIv0Opts(base,k,lv,val){const a=[];for(let iv=0;iv<=31;iv++)if(photoStat(base,k,lv,iv,0)===val)a.push(iv);return a}
function photoSpeedOpts(base,lv,val,maxEv){const a=[];for(let iv=0;iv<=31;iv++)for(let ev=0;ev<=Math.min(252,maxEv);ev+=4)if(photoStat(base,'speed',lv,iv,ev)===val)a.push({iv,ev});return a}
function photoPoke(){const n=$('#statPhotoPokemon')?.value.trim();return (window.POKEMON_DATA||[]).find(p=>p.name===n)}
function calculatePhotoEv(){
 const p=photoPoke(),root=$('#statPhotoResult');if(!root)return;if(!p){root.innerHTML='<p class="photo-warn">ポケモン名を確認してください。</p>';return}
 const st=window.POKEMON_STATS?.[String(p.id)],lv=Math.max(1,Math.min(100,Number($('#statPhotoLevel')?.value)||50));if(!st)return;
 const v={};for(const k of PHOTO_KEYS)v[k]=Number($('#'+PHOTO_IDS[k])?.value);if(Object.values(v).some(x=>!Number.isFinite(x)||x<=0)){root.innerHTML='<p class="photo-warn">6つの能力値を確認してください。</p>';return}
 const z={};let used=0,bad=false;
 for(const k of ['hp','attack','defense','spAttack','spDefense']){const e=photoEvOpts(st[k],k,lv,v[k],31);if(e.length){z[k]={ev:e[0],iv:'31',kind:e[0]?'trained':'max0'};used+=e[0]}else{const iv=photoIv0Opts(st[k],k,lv,v[k]);if(iv.length)z[k]={ev:0,iv:iv.length===1?String(iv[0]):iv[0]+'〜'+iv[iv.length-1],kind:'unused'};else{z[k]={ev:0,iv:'要確認',kind:'bad'};bad=true}}}
 const s31=photoEvOpts(st.speed,'speed',lv,v.speed,31),remain=Math.max(0,508-used);
 if(s31.length&&s31[0]<=remain)z.speed={ev:s31[0],iv:'31',kind:s31[0]?'trained':'max0'};else{const so=photoSpeedOpts(st.speed,lv,v.speed,remain);if(so.length){so.sort((a,b)=>(b.iv-a.iv)||(a.ev-b.ev));z.speed={ev:so[0].ev,iv:String(so[0].iv),kind:'speed',opts:so.slice(0,8)}}else{z.speed={ev:0,iv:'要確認',kind:'bad'};bad=true}}
 const total=Object.values(z).reduce((n,x)=>n+(x.ev||0),0);
 let msg=bad?'能力値または性格補正に、現在の条件では成立しない箇所があります。':total===508?'EV508で矛盾なく成立します。':total<508?'努力値の振り忘れ、または育成対象能力の個体値を最大まで上げ忘れている可能性があります。':'EVが508を超えるため、読み取り値・性格・個体値を確認してください。';
 const rows=PHOTO_KEYS.map(k=>'<tr><th>'+PHOTO_SHORT[k]+'</th><td>'+v[k]+'</td><td>'+z[k].ev+'</td><td>'+z[k].iv+'</td><td>'+(z[k].kind==='unused'?'EV0としてIV推定':z[k].kind==='speed'?'S調整候補':z[k].kind==='bad'?'要確認':'IV31前提')+'</td></tr>').join('');
 const sx=z.speed.opts?.length?'<p class="hint">S候補：'+z.speed.opts.map(x=>'IV'+x.iv+'/EV'+x.ev).join('、')+'</p>':'';
 root.innerHTML='<div class="photo-ev-summary '+((bad||total!==508)?'warn':'')+'"><strong>推定EV '+total+'/508</strong><p>'+escapeHtml(msg)+'</p></div><div class="photo-result-scroll"><table><thead><tr><th></th><th>実数値</th><th>EV</th><th>IV</th><th>判定</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+sx+'<button id="applyPhotoEvToMemo" type="button" class="ghost-btn">育成メモへ反映</button>';
 $('#applyPhotoEvToMemo')?.addEventListener('click',()=>{$('#buildMemoPokemon').value=p.name;$('#buildMemoEv').value=PHOTO_KEYS.filter(k=>z[k].ev>0).map(k=>PHOTO_SHORT[k]+z[k].ev).join(' ');const det=PHOTO_KEYS.filter(k=>z[k].kind==='unused'||z[k].kind==='speed').map(k=>PHOTO_SHORT[k]+': IV'+z[k].iv+' / EV'+z[k].ev).join('、');$('#buildMemoNote').value=[det,msg].filter(Boolean).join('\n')});
}
async function ocrGuidedNumber(src,rect,isHp=false){
 const sw=src.width||src.videoWidth,sh=src.height||src.videoHeight,[x,y,w,h]=rect,base=document.createElement('canvas');
 base.width=Math.max(120,Math.round(sw*w*8));base.height=Math.max(60,Math.round(sh*h*8));
 const bg=base.getContext('2d');bg.imageSmoothingEnabled=false;bg.drawImage(src,sw*x,sh*y,sw*w,sh*h,0,0,base.width,base.height);
 const variants=[base];
 for(const threshold of [125,155,185]){
  const c=document.createElement('canvas');c.width=base.width;c.height=base.height;const g=c.getContext('2d');g.drawImage(base,0,0);
  const d=g.getImageData(0,0,c.width,c.height);for(let i=0;i<d.data.length;i+=4){const v=.299*d.data[i]+.587*d.data[i+1]+.114*d.data[i+2],q=v>threshold?255:0;d.data[i]=d.data[i+1]=d.data[i+2]=q}g.putImageData(d,0,0);variants.push(c);
 }
 const found=[];
 for(const canvas of variants){
  const rec=await window.Tesseract.recognize(canvas,'eng',{tessedit_char_whitelist:isHp?'0123456789/':'0123456789',tessedit_pageseg_mode:'7'});
  const nums=String(rec.data?.text||'').match(/\d{2,3}/g)||[];for(const n of nums){const v=Number(n);if(v>=10&&v<=999)found.push(v)}
 }
 return found.length?(isHp?found[found.length-1]:found.sort((a,b)=>found.filter(x=>x===b).length-found.filter(x=>x===a).length)[0]):null;
}
function currentGuidedStatRects(){
 const guide=$('#statCameraOverlay .stat-camera-guide'),gr=guide?.getBoundingClientRect();
 if(!guide||!gr?.width||!gr?.height)return null;
 const sels={hp:'.ghp',spAttack:'.gspa',attack:'.gatk',spDefense:'.gspd',defense:'.gdef',speed:'.gspe'};
 return Object.fromEntries(Object.entries(sels).map(([k,sel])=>{const r=guide.querySelector(sel).getBoundingClientRect();return[k,[(r.left-gr.left)/gr.width,(r.top-gr.top)/gr.height,r.width/gr.width,r.height/gr.height]]}));
}
function numericRect(k,r){
 if(k==='hp')return[r[0]+r[2]*.08,r[1]+r[3]*.43,r[2]*.84,r[3]*.55];
 return[r[0]+r[2]*.10,r[1]+r[3]*.45,r[2]*.80,r[3]*.52];
}
async function readGuidedStats(src,rects){
 const out={};for(const [k,r] of Object.entries(rects||{})){const n=await ocrGuidedNumber(src,numericRect(k,r),k==='hp');if(n&&n>=10&&n<=999)out[k]=n}return out;
}
function detectNatureMarkers(src,rects){
 const sw=src.width||src.videoWidth,sh=src.height||src.videoHeight,keys=['attack','defense','spAttack','spDefense','speed'],scores=[];
 for(const k of keys){const r=rects?.[k];if(!r)continue;const c=document.createElement('canvas');c.width=Math.max(40,Math.round(sw*r[2]));c.height=Math.max(40,Math.round(sh*r[3]));const g=c.getContext('2d');g.drawImage(src,sw*r[0],sh*r[1],sw*r[2],sh*r[3],0,0,c.width,c.height);const d=g.getImageData(0,0,c.width,c.height).data;let red=0,blue=0;for(let i=0;i<d.length;i+=4){const R=d[i],G=d[i+1],B=d[i+2],mx=Math.max(R,G,B),mn=Math.min(R,G,B);if(mx-mn<45)continue;if(R>145&&R>G*1.28&&R>B*1.15)red++;if(B>135&&B>R*1.18&&B>G*1.03)blue++;}scores.push({k,red,blue})}
 const up=[...scores].sort((a,b)=>b.red-a.red)[0],down=[...scores].sort((a,b)=>b.blue-a.blue)[0];
 return{up:up&&up.red>6?up.k:'',down:down&&down.blue>6?down.k:''};
}
async function consumeGuidedImage(src,previewUrl,rects){
 const pv=$('#statPhotoPreview'),box=$('#statPhotoConfirm');pv.classList.remove('hidden');pv.innerHTML='<img src="'+previewUrl+'" alt="能力六角形"><p id="statPhotoOcrStatus" class="hint">6つの能力値を読み取っています…</p>';box.classList.remove('hidden');
 for(const k of PHOTO_KEYS)$('#'+PHOTO_IDS[k]).value='';
 try{const vals=await readGuidedStats(src,rects),nature=detectNatureMarkers(src,rects);for(const k of PHOTO_KEYS)if(vals[k])$('#'+PHOTO_IDS[k]).value=vals[k];if(nature.up)$('#statPhotoNatureUp').value=nature.up;if(nature.down)$('#statPhotoNatureDown').value=nature.down;const n=PHOTO_KEYS.filter(k=>vals[k]).length;$('#statPhotoOcrStatus').textContent='能力値 '+n+'/6 を取得しました。'+(nature.up||nature.down?' 性格補正も反映しました。':' 性格補正は確認してください。')}catch{$('#statPhotoOcrStatus').textContent='読み取りに失敗しました。空欄を入力してください。'}
}
function renderStatPokemonChoices(){
 const input=$('#statPhotoPokemon'),box=$('#statPhotoPokemonChoices');if(!input||!box)return;
 const q=input.value.trim();if(!q){box.classList.add('hidden');box.innerHTML='';return}
 const rows=(window.POKEMON_DATA||[]).filter(p=>p.sv!==false&&p.name.includes(q)).slice(0,12);
 box.innerHTML=rows.map(p=>'<button type="button" class="stat-pokemon-choice" data-name="'+p.name+'">'+p.name+'</button>').join('');
 box.classList.toggle('hidden',!rows.length);
}
$('#statPhotoPokemon')?.addEventListener('input',renderStatPokemonChoices);
$('#statPhotoPokemon')?.addEventListener('focus',renderStatPokemonChoices);
$('#statPhotoPokemonChoices')?.addEventListener('pointerdown',e=>{const b=e.target.closest('.stat-pokemon-choice');if(!b)return;e.preventDefault();$('#statPhotoPokemon').value=b.dataset.name;$('#statPhotoPokemonChoices').classList.add('hidden');$('#statPhotoPokemon').blur()});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.stat-pokemon-picker'))$('#statPhotoPokemonChoices')?.classList.add('hidden')});
let statCameraStream=null;
async function openStatCamera(){
 document.activeElement?.blur();
 await new Promise(r=>setTimeout(r,80));
 const poke=$('#statPhotoPokemon')?.value.trim(),lv=Number($('#statPhotoLevel')?.value);if(!poke||!lv||lv<1||lv>100){alert('先にポケモンとLvを入力してください。');return}
 try{statCameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080}},audio:false});const v=$('#statCameraVideo');v.srcObject=statCameraStream;await v.play();$('#statCameraOverlay').classList.remove('hidden')}catch{alert('カメラを開けませんでした。カメラ権限を確認してください。')}
}
function closeStatCamera(){statCameraStream?.getTracks().forEach(t=>t.stop());statCameraStream=null;$('#statCameraOverlay')?.classList.add('hidden')}
$('#statPhotoCameraBtn')?.addEventListener('click',openStatCamera);
$('#statCameraCancel')?.addEventListener('click',closeStatCamera);
$('#statCameraShutter')?.addEventListener('click',async()=>{
 const v=$('#statCameraVideo'),guide=$('#statCameraOverlay .stat-camera-guide'),vr=v.getBoundingClientRect(),gr=guide.getBoundingClientRect();
 const vw=v.videoWidth,vh=v.videoHeight,scale=Math.min(vr.width/vw,vr.height/vh),drawW=vw*scale,drawH=vh*scale,offX=vr.left+(vr.width-drawW)/2,offY=vr.top+(vr.height-drawH)/2;
 const sx=Math.max(0,(gr.left-offX)/scale),sy=Math.max(0,(gr.top-offY)/scale),sw=Math.min(vw-sx,gr.width/scale),sh=Math.min(vh-sy,gr.height/scale);
 const canvas=document.createElement('canvas');canvas.width=Math.round(sw);canvas.height=Math.round(sh);canvas.getContext('2d').drawImage(v,sx,sy,sw,sh,0,0,canvas.width,canvas.height);
 const rects=currentGuidedStatRects();closeStatCamera();await consumeGuidedImage(canvas,canvas.toDataURL('image/jpeg',.94),rects);
});
$('#statPhotoCalculate')?.addEventListener('click',calculatePhotoEv);

const BUILD_MEMO_KEY='lovePokeBuildMemosV1';
function loadBuildMemos(){try{return JSON.parse(localStorage.getItem(BUILD_MEMO_KEY)||'[]')}catch{return []}}
function renderBuildMemos(){
 const root=$('#buildMemoList');if(!root)return;const rows=loadBuildMemos();
 root.innerHTML=rows.length?rows.map((m,i)=>`<article class="build-memo-card"><div><strong>${escapeHtml(m.pokemon)}</strong><span>${escapeHtml(m.nature||'—')} / ${escapeHtml(m.ev||'—')} / ${escapeHtml(m.item||'—')}</span></div><p>${escapeHtml(m.note||'')}</p><button type="button" data-build-delete="${i}" class="ghost-btn">削除</button></article>`).join(''):'<p class="note">保存した育成メモはまだありません。</p>';
}
$('#saveBuildMemo')?.addEventListener('click',()=>{
 const pokemon=$('#buildMemoPokemon')?.value.trim();if(!pokemon)return;
 const rows=loadBuildMemos();rows.unshift({pokemon,nature:$('#buildMemoNature')?.value.trim()||'',ev:$('#buildMemoEv')?.value.trim()||'',item:$('#buildMemoItem')?.value.trim()||'',note:$('#buildMemoNote')?.value.trim()||'',savedAt:new Date().toISOString()});
 localStorage.setItem(BUILD_MEMO_KEY,JSON.stringify(rows.slice(0,100)));renderBuildMemos();
});
document.addEventListener('click',e=>{const b=e.target.closest('[data-build-delete]');if(!b)return;const rows=loadBuildMemos();rows.splice(Number(b.dataset.buildDelete),1);localStorage.setItem(BUILD_MEMO_KEY,JSON.stringify(rows));renderBuildMemos()});

const BUILD_BACKUP_LAST_KEY='lovePokeBuildBackupLastAtV1';
function formatBackupTime(iso){if(!iso)return '未作成';const d=new Date(iso);return Number.isNaN(d.getTime())?'未作成':d.toLocaleString('ja-JP',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}
function setBuildBackupStatus(message){const el=$('#buildBackupStatus');if(el)el.textContent=message}
function showBuildBackupLast(){setBuildBackupStatus(`最終バックアップ：${formatBackupTime(localStorage.getItem(BUILD_BACKUP_LAST_KEY))}　※大会データには共有されません。`)}
$('#exportBuildMemos')?.addEventListener('click',()=>{
 const payload={app:'love-poke-tools',kind:'build-memos',version:1,exportedAt:new Date().toISOString(),memos:loadBuildMemos()};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 const d=new Date(),stamp=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}_${String(d.getHours()).padStart(2,'0')}-${String(d.getMinutes()).padStart(2,'0')}`;
 a.href=url;a.download=`ラブカポケモン_育成メモバックアップ_${stamp}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 localStorage.setItem(BUILD_BACKUP_LAST_KEY,d.toISOString());showBuildBackupLast();
});
$('#importBuildMemos')?.addEventListener('click',()=>$('#importBuildMemosFile')?.click());
$('#importBuildMemosFile')?.addEventListener('change',async e=>{
 const file=e.target.files?.[0];if(!file)return;
 try{
  const data=JSON.parse(await file.text());
  if(data?.app!=='love-poke-tools'||data?.kind!=='build-memos'||!Array.isArray(data.memos))throw new Error('育成メモのバックアップではありません');
  const clean=data.memos.slice(0,100).filter(m=>m&&typeof m.pokemon==='string').map(m=>({pokemon:m.pokemon,nature:String(m.nature||''),ev:String(m.ev||''),item:String(m.item||''),note:String(m.note||''),savedAt:String(m.savedAt||'')}));
  if(!confirm(`現在の育成メモをバックアップの${clean.length}件で置き換えます。よろしいですか？`))return;
  localStorage.setItem(BUILD_MEMO_KEY,JSON.stringify(clean));renderBuildMemos();setBuildBackupStatus(`バックアップから${clean.length}件を復元しました。`);
 }catch(err){setBuildBackupStatus(`復元できませんでした：${err.message}`)}
 finally{e.target.value=''}
});
refreshPartyAnalysisSelect();renderBuildMemos();showBuildBackupLast();
