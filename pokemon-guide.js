
const $=selector=>document.querySelector(selector);
const TYPE_JA={Normal:'ノーマル',Fire:'ほのお',Water:'みず',Electric:'でんき',Grass:'くさ',Ice:'こおり',Fighting:'かくとう',Poison:'どく',Ground:'じめん',Flying:'ひこう',Psychic:'エスパー',Bug:'むし',Rock:'いわ',Ghost:'ゴースト',Dragon:'ドラゴン',Dark:'あく',Steel:'はがね',Fairy:'フェアリー'};

function escapeHtml(value=''){
  return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
function pokemonById(id){
  const candidates=(window.POKEMON_DATA||[]).filter(p=>Number(p.id)===Number(id));
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
function renderPokemon(id){
  const p=pokemonById(id);
  const detail=$('#guidePokemonDetail');
  if(!p||!detail)return;
  const learn=window.POKEMON_SV_LEARNSETS?.[p.id]||{};
  const level=(learn.l||[]).map(([mid,lev])=>moveButton(moveName(mid),levelLabel(lev))).join('');
  const tm=(learn.t||[]).map(([mid,no])=>moveButton(moveName(mid),no?`TM${no}`:'')).join('');
  const egg=(learn.e||[]).map(mid=>moveButton(moveName(mid),'タマゴ技')).join('');
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
    <div class="guide-move-section"><h3>タマゴ技 <span>${(learn.e||[]).length}</span></h3><div class="guide-move-grid">${egg||'<p class="note">なし</p>'}</div></div>
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
  const found=(q?data.filter(p=>p.name.includes(q)):data.slice(0,30))
    .sort((a,b)=>(q?(b.name.startsWith(q)-a.name.startsWith(q)):0)||a.id-b.id)
    .slice(0,30);
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
