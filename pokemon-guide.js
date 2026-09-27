
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
function speedStat(base,level,iv,ev,nature){
  const raw=Math.floor(((2*base+iv+Math.floor(ev/4))*level)/100)+5;
  return Math.floor(raw*nature);
}
function adjustedSpeed(base){
  const level=Math.max(1,Math.min(100,Number($('#speedLevel')?.value)||50));
  const iv=Math.max(0,Math.min(31,Number($('#speedIv')?.value)||0));
  const ev=Math.max(0,Math.min(252,Number($('#speedEv')?.value)||0));
  const nature=Number($('#speedNature')?.value)||1;
  let value=speedStat(base,level,iv,ev,nature);
  value=Math.floor(value*(Number($('#speedItem')?.value)||1));
  const ability=$('#speedAbility')?.value||'1';
  value=Math.floor(value*(ability==='quickfeet'?1.5:(Number(ability)||1)));
  value=Math.floor(value*rankMultiplier($('#speedRank')?.value));
  if($('#speedTailwind')?.checked)value*=2;
  if($('#speedParalysis')?.checked&&ability!=='quickfeet')value=Math.floor(value*.5);
  return Math.max(1,Math.floor(value));
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
function speedPokemonRows(){
  const allowed=tournamentPokemonIds();
  const q=($('#speedSearch')?.value||'').trim();
  const seen=new Set();
  return (window.POKEMON_DATA||[]).filter(p=>{
    if(p.formKey||seen.has(Number(p.id)))return false;
    seen.add(Number(p.id));
    if(allowed&&!allowed.has(Number(p.id)))return false;
    if(q&&!p.name.includes(q))return false;
    return !!window.POKEMON_STATS?.[String(p.id)];
  }).map(p=>{
    const s=Number(window.POKEMON_STATS[String(p.id)]?.speed)||0;
    return {p,base:s,value:adjustedSpeed(s)};
  }).sort((a,b)=>b.value-a.value||b.base-a.base||a.p.id-b.p.id);
}
function renderSpeedTable(){
  const root=$('#speedTable');if(!root)return;
  const rows=speedPokemonRows();
  $('#speedResultCount').textContent=`${rows.length}体`;
  let last=null,rank=0;
  root.innerHTML=rows.map((row,index)=>{
    if(row.value!==last){rank=index+1;last=row.value}
    return `<button type="button" class="speed-row" data-poke-guide-id="${row.p.id}"><span class="speed-rank">${rank}</span><span class="speed-name"><strong>${escapeHtml(row.p.name)}</strong><small>No.${String(row.p.id).padStart(4,'0')}</small></span><span class="speed-base">S${row.base}</span><span class="speed-value">${row.value}</span></button>`;
  }).join('')||'<p class="note">条件に該当するポケモンがいません。</p>';
}
function refreshTournamentFilter(){
  const select=$('#speedTournamentFilter');if(!select)return;
  const current=select.value;
  const tournaments=window.getLovePokeSpeedTournaments?.()||[];
  select.innerHTML='<option value="all">全ポケモン</option>'+tournaments.map(t=>`<option value="${escapeHtml(t.id)}">${escapeHtml(t._speedLabel||t.name||'大会')}</option>`).join('');
  if([...select.options].some(o=>o.value===current))select.value=current;
  renderSpeedTable();
}
function showGuideTool(tool='dex'){
  document.querySelectorAll('.guide-tool-tab').forEach(b=>b.classList.toggle('active',b.dataset.guideTool===tool));
  document.querySelectorAll('.guide-tool-pane').forEach(p=>p.classList.add('hidden'));
  const id={dex:'guideDexTool',types:'guideTypesTool',speed:'guideSpeedTool'}[tool];
  if(id)document.getElementById(id)?.classList.remove('hidden');
  if(tool==='types')renderTypeChart();
  if(tool==='speed'){refreshTournamentFilter();renderSpeedTable()}
}
document.querySelectorAll('.guide-tool-tab').forEach(b=>b.addEventListener('click',()=>showGuideTool(b.dataset.guideTool)));
['speedTournamentFilter','speedLevel','speedIv','speedEv','speedNature','speedItem','speedAbility','speedRank','speedTailwind','speedParalysis','speedSearch'].forEach(id=>{
  document.getElementById(id)?.addEventListener(id==='speedSearch'?'input':'change',renderSpeedTable);
});
window.addEventListener('lovePokeTournamentsUpdated',refreshTournamentFilter);
renderTypeChart();
refreshTournamentFilter();
