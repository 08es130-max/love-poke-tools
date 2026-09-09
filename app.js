const heartDefs = [
  {key:'pink', label:'ピンク', color:'#f15b9a'},
  {key:'red', label:'赤', color:'#ef4437'},
  {key:'yellow', label:'黄', color:'#f5b51b'},
  {key:'green', label:'緑', color:'#35b96d'},
  {key:'blue', label:'青', color:'#2d9ed7'},
  {key:'purple', label:'紫', color:'#8d55ad'},
  {key:'gray', label:'無色', color:'#777'},
];
const specialDefs = [
  {key:'all', label:'ALL', color:'#f05a8a'},
  {key:'blade', label:'ブレード', color:'#ff7ca8'},
];
const deckCats = [
  ...heartDefs.map(x=>({key:x.key,label:x.label,color:x.color})),
  {key:'gray2',label:'無色×2',color:'#666'},
  {key:'all',label:'ALL',color:'#f05a8a'},
  {key:'blank',label:'ハートなし',color:'#aaa'},
];

const state = {
  owned:Object.fromEntries([...heartDefs,...specialDefs].map(x=>[x.key,0])),
  lives:[0,1,2].map(()=>Object.fromEntries(heartDefs.map(x=>[x.key,0]))),
  decks: JSON.parse(localStorage.getItem('lovepoke_decks')||'[]'),
  selectedDeckId: localStorage.getItem('lovepoke_selected_deck') || '',
  livePresets: JSON.parse(localStorage.getItem('lovepoke_live_presets')||'[]'),
  editingLivePresetId:'',
  detailed:false,
  inputMode:false,
  resultDetail:false,
  known:{
    grave:Object.fromEntries(deckCats.filter(x=>x.key!=='blank').map(x=>[x.key,0])),
    hand:Object.fromEntries(deckCats.filter(x=>x.key!=='blank').map(x=>[x.key,0])),
    stage:Object.fromEntries(deckCats.filter(x=>x.key!=='blank').map(x=>[x.key,0])),
    success:Object.fromEntries(deckCats.filter(x=>x.key!=='blank').map(x=>[x.key,0])),
  },
  zoneTotals:{grave:0,hand:0,stage:0,success:0}
};

const $ = s=>document.querySelector(s);
const heartGrid=$('#heartGrid'), resultGrid=$('#resultGrid');

function clamp(n){return Math.max(0,Number(n)||0)}

function numberCell(value,onChange,position=null){
  const inp=document.createElement('input');
  inp.className='number-cell';
  inp.type='text';
  inp.inputMode='numeric';
  inp.pattern='[0-9]*';
  inp.value=String(value);
  inp.readOnly=!state.inputMode;
  if(position){
    // Mobile browser input toolbars use the sequential focus order rather than
    // dispatching Enter. Keep that order column-major while retaining the
    // table's row-major DOM and visual layout.
    inp.tabIndex=state.inputMode
      ? position.column*heartDefs.length+position.row+1
      : -1;
    inp.enterKeyHint=position.row===heartDefs.length-1?'done':'next';
    inp.addEventListener('keydown',event=>{
      if(event.key!=='Enter'||!state.inputMode)return;
      event.preventDefault();
      const nextRow=position.row+1;
      if(nextRow<heartDefs.length){
        document.querySelector(`.number-cell[data-row="${nextRow}"][data-column="${position.column}"]`)?.focus();
      }else{
        inp.blur();
      }
    });
    inp.dataset.row=position.row;
    inp.dataset.column=position.column;
  }else{
    // ALL and blade are outside the four seven-color navigation sequences.
    inp.tabIndex=-1;
  }
  if(state.inputMode) inp.classList.add('editing');
  inp.addEventListener('focus',()=>{
    if(!state.inputMode)return;
    if(inp.value==='0'){
      inp.value='';
    }else{
      setTimeout(()=>inp.select(),0);
    }
  });
  inp.addEventListener('click',()=>{
    if(state.inputMode && inp.value!=='') setTimeout(()=>inp.select(),0);
  });
  inp.addEventListener('input',()=>{
    const clean=inp.value.replace(/\D/g,'');
    if(inp.value!==clean) inp.value=clean;
    onChange(clamp(clean));
    renderResults();
    renderProbability();
  });
  inp.addEventListener('blur',()=>{
    if(inp.value===''){
      inp.value='0';
      onChange(0);
      renderResults();
      renderProbability();
    }
  });
  return inp;
}

function buildHeartGrid(){
  heartGrid.innerHTML='';
  for(const [rowIndex,d] of heartDefs.entries()){
    const row=document.createElement('div');row.className='heart-row';row.style.background=`linear-gradient(90deg, ${d.color}1c, ${d.color}0c)`;
    const lab=document.createElement('div');lab.className='heart-label';lab.innerHTML=`<span class="dot" style="background:${d.color}">♥</span>${d.label}`;
    row.append(lab);
    row.append(numberCell(state.owned[d.key],v=>{state.owned[d.key]=v},{row:rowIndex,column:0}));
    for(let i=0;i<3;i++){
      row.append(numberCell(state.lives[i][d.key],v=>{state.lives[i][d.key]=v},{row:rowIndex,column:i+1}));
    }
    heartGrid.append(row);
  }
  for(const d of specialDefs){
    const row=document.createElement('div');row.className='heart-row';row.style.background=`linear-gradient(90deg, ${d.color}1c, ${d.color}0c)`;
    const lab=document.createElement('div');lab.className='heart-label';lab.innerHTML=`<span class="dot" style="background:${d.color}">${d.key==='all'?'ALL':'B'}</span>${d.label}`;
    row.append(lab);
    row.append(numberCell(state.owned[d.key],v=>{state.owned[d.key]=v}));
    for(let i=0;i<3;i++){const dis=document.createElement('div');dis.className='disabled-cell';dis.textContent='—';row.append(dis);}
    heartGrid.append(row);
  }
}

function calcNeeds(){
  const req=Object.fromEntries(heartDefs.map(d=>[d.key, state.lives.reduce((s,l)=>s+l[d.key],0)]));
  const diff={};
  for(const d of heartDefs) diff[d.key]=state.owned[d.key]-req[d.key];

  const colorKeys=heartDefs.filter(x=>x.key!=='gray').map(x=>x.key);
  let grayNeed=Math.max(0,-diff.gray);
  let graySurplus=Math.max(0,diff.gray);
  let coloredSurplus=0;
  let coloredDeficit=0;
  for(const k of colorKeys){
    if(diff[k]>=0) coloredSurplus+=diff[k];
    else coloredDeficit+=-diff[k];
  }
  const grayAfterColor=Math.max(0,grayNeed-coloredSurplus);
  const all=state.owned.all;
  const totalNeedBeforeAll=coloredDeficit+grayAfterColor;
  const extraNeeded=Math.max(0,totalNeedBeforeAll-all);

  return {req,diff,colorKeys,grayNeed,graySurplus,coloredSurplus,coloredDeficit,grayAfterColor,all,totalNeedBeforeAll,extraNeeded};
}

function calcVisibleShortages(c){
  const left={};
  let wild=state.owned.all;

  for(const d of heartDefs.filter(x=>x.key!=='gray')){
    const need=Math.max(0,-c.diff[d.key]);
    const use=Math.min(need,wild);
    left[d.key]=need-use;
    wild-=use;
  }

  const grayAfterSurplus=Math.max(0,c.grayNeed-c.coloredSurplus);
  const grayUse=Math.min(grayAfterSurplus,wild);
  left.gray=grayAfterSurplus-grayUse;
  wild-=grayUse;
  return left;
}

function renderResults(){
  const c=calcNeeds();
  const shortage=calcVisibleShortages(c);
  resultGrid.innerHTML='';

  const needHero=$('#needHero');
  const chips=[];
  for(const d of heartDefs){
    const n=shortage[d.key]||0;
    if(n>0){
      chips.push(`<div class="need-chip"><span class="dot" style="background:${d.color}">♥</span>${d.label} <strong>× ${n}</strong></div>`);
    }
  }
  chips.push(`<div class="need-chip blade">ブレード <strong>${state.owned.blade}枚</strong></div>`);
  needHero.innerHTML=`<div class="need-hero-title">あと必要</div>`+
    (c.extraNeeded===0
      ? `<div class="need-ok">ライブ可能です</div><div class="need-items">${chips[chips.length-1]}</div>`
      : `<div class="need-items">${chips.join('')}</div>`);

  for(const d of heartDefs){
    const v=c.diff[d.key];
    const card=document.createElement('div');card.className='result-card';card.style.background=`${d.color}12`;
    card.innerHTML=`<div><strong>${d.label}</strong><div class="sub">所持 ${state.owned[d.key]} / 必要 ${c.req[d.key]}</div></div>
      <strong style="color:${v<0?'#d84a36':v>0?'#16834a':'#555'}">${v>0?'+':''}${v}</strong>`;
    resultGrid.append(card);
  }
  const allCard=document.createElement('div');allCard.className='result-card';allCard.style.background='#f05a8a12';
  allCard.innerHTML=`<div><strong>ALL</strong><div class="sub">任意の1ハートとして使用</div></div><strong>${state.owned.all}</strong>`;
  resultGrid.append(allCard);

  const badge=$('#statusBadge');
  if(c.extraNeeded===0){badge.textContent='ライブ可能';badge.className='badge ok'}
  else{badge.textContent=`あと${c.extraNeeded}ハート`;badge.className='badge warn'}
  $('#summaryText').innerHTML =
    `色不足 合計 <b>${c.coloredDeficit}</b> ／ 無色不足 <b>${c.grayNeed}</b> ／ 色余剰→無色へ最大 <b>${Math.min(c.grayNeed,c.coloredSurplus)}</b><br>`+
    `ALL <b>${c.all}</b> を任意配分した後の追加必要ハート：<b>${c.extraNeeded}</b>`;
  $('#bladeInfo').textContent=`ブレード ${state.owned.blade}`;
}

function activeDeck(){return state.decks.find(d=>d.id===state.selectedDeckId)||null}
function renderDeckSelect(){
  const sel=$('#deckSelect');sel.innerHTML='';
  if(!state.decks.length){
    const o=document.createElement('option');o.textContent='デッキ未登録';o.value='';sel.append(o);
    state.selectedDeckId='';
  } else {
    for(const d of state.decks){
      const o=document.createElement('option');o.value=d.id;o.textContent=d.name;sel.append(o);
    }
    if(!state.decks.some(d=>d.id===state.selectedDeckId)) state.selectedDeckId=state.decks[0].id;
    sel.value=state.selectedDeckId;
  }
  localStorage.setItem('lovepoke_selected_deck',state.selectedDeckId);
}

function comb(n,k){
  if(k<0||k>n)return 0;
  k=Math.min(k,n-k); let r=1;
  for(let i=1;i<=k;i++) r=r*(n-k+i)/i;
  return r;
}
function isSuccess(draw, calc){
  const colorKeys=calc.colorKeys;
  let colorDef=0, colorExcess=0;
  for(const k of colorKeys){
    const need=Math.max(0, calc.req[k]-state.owned[k]);
    const got=draw[k]||0;
    if(got>=need) colorExcess+=got-need;
    else colorDef+=need-got;
  }
  const baseGray=Math.max(0, calc.req.gray-state.owned.gray);
  const grayPower=(draw.gray||0)+2*(draw.gray2||0);
  const grayDef=Math.max(0, baseGray-grayPower-colorExcess);
  const wild=state.owned.all+(draw.all||0);
  return wild >= colorDef+grayDef;
}
function exactProbability(counts, drawN){
  const cats=deckCats.map(x=>x.key);
  const N=cats.reduce((s,k)=>s+(counts[k]||0),0);
  if(drawN<0||drawN>N) return null;
  if(drawN===0) return isSuccess(Object.fromEntries(cats.map(k=>[k,0])),calcNeeds())?1:0;
  const total=comb(N,drawN);
  if(!isFinite(total)||total<=0)return null;
  let successWays=0;
  const picked={};
  function rec(i,left,ways){
    if(i===cats.length-1){
      const k=cats[i], x=left, max=counts[k]||0;
      if(x<0||x>max)return;
      picked[k]=x;
      const w=ways*comb(max,x);
      if(isSuccess(picked,calcNeeds())) successWays+=w;
      return;
    }
    const k=cats[i], max=Math.min(counts[k]||0,left);
    for(let x=0;x<=max;x++){
      picked[k]=x;
      rec(i+1,left-x,ways*comb(counts[k]||0,x));
    }
  }
  rec(0,drawN,1);
  return successWays/total;
}

function baseDeckCounts(deck){
  return Object.fromEntries(deckCats.map(c=>[c.key,clamp(deck?.counts?.[c.key])]))
}
function remainingCounts(deck){
  const c=baseDeckCounts(deck);
  const zoneKeys=['grave','hand','stage','success'];
  for(const cat of deckCats.filter(x=>x.key!=='blank')){
    for(const z of zoneKeys) c[cat.key]-=clamp(state.known[z][cat.key]);
  }
  for(const z of zoneKeys){
    const knownHeart=deckCats.filter(x=>x.key!=='blank').reduce((s,cat)=>s+clamp(state.known[z][cat.key]),0);
    const impliedBlank=Math.max(0,clamp(state.zoneTotals[z])-knownHeart);
    c.blank-=impliedBlank;
  }
  return c;
}
function validateRemaining(c){
  return Object.values(c).every(v=>v>=0);
}
function pct(p){return p==null?'—':`${(p*100).toFixed(1)}%`}
function renderProbability(){
  const deck=activeDeck(), blade=state.owned.blade;
  if(!deck){$('#baseProbability').textContent='—';$('#liveProbability').textContent='—';$('#probabilityNote').textContent='デッキを登録すると計算できます。';return}
  const base=baseDeckCounts(deck);
  const p1=exactProbability(base,blade);
  $('#baseProbability').textContent=pct(p1);
  const rem=remainingCounts(deck);
  if(!validateRemaining(rem)){
    $('#liveProbability').textContent='入力エラー';
    $('#probabilityNote').textContent='見えている枚数が登録デッキ枚数を超えています。';
  }else{
    const p2=exactProbability(rem,blade);
    $('#liveProbability').textContent=pct(p2);
    const total=Object.values(rem).reduce((a,b)=>a+b,0);
    $('#probabilityNote').textContent=`「3ライブ合算の不足」を、ブレード${blade}枚で補える確率です。現在の残りデッキ：${total}枚。`;
  }
  renderRemaining(rem);
}

function renderKnownGrid(){
  const grid=$('#knownGrid');grid.innerHTML='';
  for(const cat of deckCats.filter(x=>x.key!=='blank')){
    const row=document.createElement('div');row.className='known-row';
    row.innerHTML=`<div class="heart-label"><span class="dot" style="background:${cat.color}">${cat.key==='all'?'A':cat.key==='gray2'?'×2':'♥'}</span>${cat.label}</div>`;
    for(const z of ['grave','hand','stage','success']){
      const inp=document.createElement('input');inp.type='number';inp.min='0';inp.value=state.known[z][cat.key];
      inp.oninput=()=>{state.known[z][cat.key]=clamp(inp.value);renderProbability()};
      row.append(inp);
    }
    grid.append(row);
  }
}
function renderRemaining(rem){
  const el=$('#remainingDeck');el.innerHTML='';
  for(const cat of deckCats){
    const item=document.createElement('div');item.className='remaining-item';
    const v=rem?.[cat.key]??0;
    item.innerHTML=`<span>${cat.label}</span><strong style="${v<0?'color:#c33':''}">${v}</strong>`;
    el.append(item);
  }
}

function buildDeckCounts(){
  const box=$('#deckCounts');box.innerHTML='';
  for(const cat of deckCats){
    const div=document.createElement('label');div.className='deck-count-item';
    div.innerHTML=`<span>${cat.label}</span>`;
    const inp=document.createElement('input');inp.type='number';inp.min='0';inp.value='0';inp.dataset.cat=cat.key;
    inp.oninput=updateDeckTotal;
    div.append(inp);box.append(div);
  }
}
function updateDeckTotal(){
  let s=0;document.querySelectorAll('#deckCounts input').forEach(i=>s+=clamp(i.value));
  $('#deckTotal').textContent=s;
}
function loadDeckIntoDialog(deck){
  $('#deckName').value=deck?.name||'';
  document.querySelectorAll('#deckCounts input').forEach(i=>i.value=deck?.counts?.[i.dataset.cat]||0);
  updateDeckTotal();
}
function saveDecks(){localStorage.setItem('lovepoke_decks',JSON.stringify(state.decks))}

function saveLivePresets(){
  localStorage.setItem('lovepoke_live_presets',JSON.stringify(state.livePresets));
}

function renderLivePresetSelects(){
  for(let i=0;i<3;i++){
    const sel=$(`#livePreset${i+1}Select`);
    if(!sel)continue;
    const current=sel.value;
    sel.innerHTML='<option value="">登録ライブを選択</option>';
    for(const p of state.livePresets){
      const o=document.createElement('option');
      o.value=p.id;
      o.textContent=p.name;
      sel.append(o);
    }
    if(state.livePresets.some(p=>p.id===current)) sel.value=current;
  }

  const manage=$('#liveManageSelect');
  if(manage){
    manage.innerHTML='<option value="">新規登録</option>';
    for(const p of state.livePresets){
      const o=document.createElement('option');
      o.value=p.id;
      o.textContent=p.name;
      manage.append(o);
    }
    manage.value=state.livePresets.some(p=>p.id===state.editingLivePresetId)?state.editingLivePresetId:'';
  }
}

function applyLivePreset(index,presetId){
  const p=state.livePresets.find(x=>x.id===presetId);
  if(!p)return;
  for(const d of heartDefs) state.lives[index][d.key]=clamp(p.counts?.[d.key]);
  render();
}

function buildLivePresetCounts(){
  const box=$('#livePresetCounts');
  if(!box)return;
  box.innerHTML='';
  for(const d of heartDefs){
    const label=document.createElement('label');
    label.className='deck-count-item';
    label.innerHTML=`<span><span class="dot" style="background:${d.color}">♥</span> ${d.label}</span>`;
    const inp=document.createElement('input');
    inp.type='number';
    inp.inputMode='numeric';
    inp.min='0';
    inp.value='0';
    inp.dataset.cat=d.key;
    inp.addEventListener('focus',()=>{
      if(inp.value==='0') inp.value='';
      else inp.select();
    });
    inp.addEventListener('blur',()=>{if(inp.value==='')inp.value='0'});
    label.append(inp);
    box.append(label);
  }
}

function loadLivePresetIntoDialog(id=''){
  state.editingLivePresetId=id;
  const p=state.livePresets.find(x=>x.id===id)||null;
  $('#livePresetName').value=p?.name||'';
  document.querySelectorAll('#livePresetCounts input').forEach(inp=>{
    inp.value=p?.counts?.[inp.dataset.cat]||0;
  });
  renderLivePresetSelects();
}

function resetInputs(){
  for(const k of Object.keys(state.owned)) state.owned[k]=0;
  for(const l of state.lives) for(const k of Object.keys(l)) l[k]=0;
  render();
}
function resetOwned(){
  for(const k of Object.keys(state.owned)) state.owned[k]=0;
  render();
}
function resetLive(index){
  for(const k of Object.keys(state.lives[index])) state.lives[index][k]=0;
  render();
}

$('#deckSelect').addEventListener('change',e=>{state.selectedDeckId=e.target.value;localStorage.setItem('lovepoke_selected_deck',state.selectedDeckId);renderProbability()});
$('#openDeckBtn').onclick=()=>{loadDeckIntoDialog(activeDeck());$('#deckDialog').showModal()};
$('#newDeckBtn').onclick=()=>loadDeckIntoDialog(null);
$('#saveDeckBtn').onclick=()=>{
  const name=$('#deckName').value.trim()||'名称未設定';
  const counts={};document.querySelectorAll('#deckCounts input').forEach(i=>counts[i.dataset.cat]=clamp(i.value));
  let deck=activeDeck();
  if(deck && $('#deckName').dataset.forceNew!=='1'){deck.name=name;deck.counts=counts}
  else{
    deck={id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),name,counts};
    state.decks.push(deck);state.selectedDeckId=deck.id;
  }
  $('#deckName').dataset.forceNew='0';saveDecks();renderDeckSelect();renderProbability();$('#deckDialog').close();
};
$('#newDeckBtn').addEventListener('click',()=>{$('#deckName').dataset.forceNew='1'});
$('#deleteDeckBtn').onclick=()=>{
  const d=activeDeck();if(!d)return;
  if(confirm(`「${d.name}」を削除しますか？`)){
    state.decks=state.decks.filter(x=>x.id!==d.id);state.selectedDeckId=state.decks[0]?.id||'';saveDecks();renderDeckSelect();renderProbability();$('#deckDialog').close();
  }
};
$('#toggleDetailBtn').onclick=()=>{
  state.detailed=!state.detailed;$('#detailArea').classList.toggle('hidden',!state.detailed);
  $('#toggleDetailBtn').textContent=state.detailed?'詳細計算を閉じる':'詳細計算を開く';
};
for(const z of ['grave','hand','stage','success']){
  $(`#zone-total-${z}`).oninput=e=>{state.zoneTotals[z]=clamp(e.target.value);renderProbability()};
}
$('#resetAllBtn').onclick=()=>{if(confirm('入力値をすべて0に戻しますか？'))resetInputs()};

$('#openLiveBtn').onclick=()=>{
  buildLivePresetCounts();
  loadLivePresetIntoDialog(state.livePresets[0]?.id||'');
  $('#liveDialog').showModal();
};
$('#liveManageSelect').onchange=e=>loadLivePresetIntoDialog(e.target.value);
$('#newLivePresetBtn').onclick=()=>loadLivePresetIntoDialog('');
$('#saveLivePresetBtn').onclick=()=>{
  const name=$('#livePresetName').value.trim()||'名称未設定';
  const counts={};
  document.querySelectorAll('#livePresetCounts input').forEach(inp=>counts[inp.dataset.cat]=clamp(inp.value));
  let p=state.livePresets.find(x=>x.id===state.editingLivePresetId);
  if(p){
    p.name=name;
    p.counts=counts;
  }else{
    p={id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),name,counts};
    state.livePresets.push(p);
    state.editingLivePresetId=p.id;
  }
  saveLivePresets();
  renderLivePresetSelects();
  $('#liveDialog').close();
};
$('#deleteLivePresetBtn').onclick=()=>{
  const p=state.livePresets.find(x=>x.id===state.editingLivePresetId);
  if(!p)return;
  if(confirm(`「${p.name}」を削除しますか？`)){
    state.livePresets=state.livePresets.filter(x=>x.id!==p.id);
    state.editingLivePresetId=state.livePresets[0]?.id||'';
    saveLivePresets();
    renderLivePresetSelects();
    loadLivePresetIntoDialog(state.editingLivePresetId);
  }
};
for(let i=0;i<3;i++){
  $(`#livePreset${i+1}Select`).onchange=e=>{
    if(!e.target.value)return;
    applyLivePreset(i,e.target.value);
  };
}

$('#resetOwnedBtn').onclick=resetOwned;
$('#resetLive1Btn').onclick=()=>resetLive(0);
$('#resetLive2Btn').onclick=()=>resetLive(1);
$('#resetLive3Btn').onclick=()=>resetLive(2);
$('#inputModeBtn').onclick=()=>{
  state.inputMode=!state.inputMode;
  $('#inputModeBtn').textContent=`入力モード：${state.inputMode?'ON':'OFF'}`;
  $('#inputModeBtn').classList.toggle('active',state.inputMode);
  buildHeartGrid();
};
$('#toggleResultDetailBtn').onclick=()=>{
  state.resultDetail=!state.resultDetail;
  $('#resultDetailArea').classList.toggle('hidden',!state.resultDetail);
  $('#toggleResultDetailBtn').textContent=state.resultDetail?'内訳を閉じる':'内訳を見る';
};

function render(){
  buildHeartGrid();renderResults();renderProbability();
}
buildDeckCounts();renderKnownGrid();renderDeckSelect();renderLivePresetSelects();render();

// =========================
// ポケモン抽選
// =========================
// パラドックスポケモン（コライドン/ミライドンは伝説枠として別扱い）
const ancientIds = new Set([
  984,985,986,987,988,989,1005,1009,1020,1021
]);
const futureIds = new Set([
  990,991,992,993,994,995,1006,1010,1022,1023
]);
const DEFAULT_PLAYERS=[
  {playerId:'player-takumi',displayName:'たくみ'},
  {playerId:'player-hiroki',displayName:'ひろき'},
  {playerId:'player-hase',displayName:'はせ'},
  {playerId:'player-babacchi',displayName:'馬場っち'},
  {playerId:'player-ryuichi',displayName:'隆一'}
];
const savedPlayerNames=(()=>{try{return JSON.parse(localStorage.getItem('lovepoke_pokemon_player_names')||'null')}catch{return null}})();
const pokeState={
  players:5,
  perPlayer:6,
  data:(Array.isArray(window.POKEMON_DATA)?window.POKEMON_DATA:[]).map((p,idx)=>({
    ...p,
    uniqueKey:p.formKey?`${p.id}-${p.formKey}`:`${p.id}-base-${idx}`,
    ancient:ancientIds.has(p.id),
    future:futureIds.has(p.id)
  })),
  groups:[],
  locks:[],
  playerNames:Array.isArray(savedPlayerNames)?savedPlayerNames:[...DEFAULT_PLAYERS.map(p=>p.displayName)],
  manualPokemon:[],
  specialA:1,
  specialB:2
};

function setScreen(screen){
  const love=screen==='love';
  const poke=screen==='poke';
  $('#loveScreen').classList.toggle('hidden',!love);
  $('#pokeScreen').classList.toggle('hidden',!poke);
  $('#mahjongScreen').classList.toggle('hidden',screen!=='mahjong');
  $('#navLove').classList.toggle('active',love);
  $('#navPoke').classList.toggle('active',poke);
  $('#navMahjong').classList.toggle('active',screen==='mahjong');
  $('#appTitle').textContent=love?'ラブカ ハート計算':poke?'ポケモン':'麻雀 戦歴';
  $('#resetAllBtn').style.display=love?'inline-block':'none';
}
$('#navLove').onclick=()=>setScreen('love');
$('#navPoke').onclick=()=>setScreen('poke');
$('#navMahjong').onclick=()=>setScreen('mahjong');

function playerDisplayName(pi){
  return (pokeState.playerNames[pi]||'').trim() || `PLAYER ${pi+1}`;
}
window.getLovePokeTournamentParticipants=()=>Array.from({length:pokeState.players},(_,pi)=>({
  id:DEFAULT_PLAYERS[pi]?.playerId||`player-slot-${pi+1}`,
  playerId:DEFAULT_PLAYERS[pi]?.playerId||`player-slot-${pi+1}`,
  name:playerDisplayName(pi),displayName:playerDisplayName(pi),
  pokemon:Array.from({length:pokeState.perPlayer},(_,slot)=>pokeState.manualPokemon[pi]?.[slot]||pokeState.groups[pi]?.[slot]).filter(Boolean).map(p=>({id:p.id||null,name:p.name,formKey:p.formKey||''}))
}));
window.getLovePokeBasePlayers=()=>DEFAULT_PLAYERS.map((p,i)=>({...p,displayName:playerDisplayName(i)}));
function buildPlayerNameInputs(){
  const box=$('#playerNameInputs'); if(!box)return;
  box.innerHTML='';
  for(let i=0;i<pokeState.players;i++){
    const label=document.createElement('label');label.className='player-name-item';
    const caption=document.createElement('span');caption.textContent=`PLAYER ${i+1}`;
    const inp=document.createElement('input');inp.type='text';inp.placeholder='名前';
    inp.value=pokeState.playerNames[i]||'';
    inp.oninput=()=>{pokeState.playerNames[i]=inp.value;localStorage.setItem('lovepoke_pokemon_player_names',JSON.stringify(pokeState.playerNames));if(pokeState.groups.length)renderPokeResults();buildManualPokemonInputs()};
    label.append(caption,inp);box.append(label);
  }
}

function adjustPokeNumber(key,delta,min,max){
  pokeState[key]=Math.max(min,Math.min(max,pokeState[key]+delta));
  $('#playersValue').textContent=pokeState.players;
  $('#perValue').textContent=pokeState.perPlayer;
  buildPlayerNameInputs();
  buildManualPokemonInputs();
}
$('#playersMinus').onclick=()=>adjustPokeNumber('players',-1,1,10);
$('#playersPlus').onclick=()=>adjustPokeNumber('players',1,1,10);
$('#perMinus').onclick=()=>adjustPokeNumber('perPlayer',-1,1,12);
$('#perPlus').onclick=()=>adjustPokeNumber('perPlayer',1,1,12);


function adjustSpecial(key,delta){
  pokeState[key]=Math.max(0,Math.min(12,pokeState[key]+delta));
  $('#spAValue').textContent=pokeState.specialA;
  $('#spBValue').textContent=pokeState.specialB;
}
$('#spAMinus').onclick=()=>adjustSpecial('specialA',-1);
$('#spAPlus').onclick=()=>adjustSpecial('specialA',1);
$('#spBMinus').onclick=()=>adjustSpecial('specialB',-1);
$('#spBPlus').onclick=()=>adjustSpecial('specialB',1);

function specialOpts(which){
  const p=which==='A'?'spA':'spB';
  return {
    legendary:$(`#${p}legendary`).checked,
    sub:$(`#${p}sub`).checked,
    mythical:$(`#${p}mythical`).checked,
    pseudo:$(`#${p}pseudo`).checked,
    ancient:$(`#${p}ancient`).checked,
    future:$(`#${p}future`).checked
  };
}
function specialPool(which){
  const o=specialOpts(which);
  return pokeState.data.filter(p=>{
    return (o.legendary&&p.legendary) ||
           (o.sub&&p.subLegendary) ||
           (o.mythical&&p.mythical) ||
           (o.pseudo&&p.pseudo) ||
           (o.ancient&&p.ancient) ||
           (o.future&&p.future);
  });
}
function slotRule(slotIndex){
  if(slotIndex < pokeState.specialA) return 'A';
  if(slotIndex < pokeState.specialA + pokeState.specialB) return 'B';
  return 'N';
}
function slotLabel(slotIndex){
  const r=slotRule(slotIndex);
  return r==='A'?'特殊A':r==='B'?'特殊B':'通常';
}
function candidatesForRule(rule){
  if(rule==='A') return specialPool('A');
  if(rule==='B') return specialPool('B');
  return filteredPool();
}
function validateSpecialSettings(){
  const spTotal=pokeState.specialA+pokeState.specialB;
  if(spTotal>pokeState.perPlayer){
    alert(`特殊枠が合計${spTotal}体ですが、1人あたり${pokeState.perPlayer}体です。特殊枠の合計を${pokeState.perPlayer}以下にしてください。`);
    return false;
  }
  if(pokeState.specialA>0 && specialPool('A').length===0){
    alert('特殊枠Aの対象カテゴリが選ばれていません。');
    return false;
  }
  if(pokeState.specialB>0 && specialPool('B').length===0){
    alert('特殊枠Bの対象カテゴリが選ばれていません。');
    return false;
  }
  return true;
}

function filteredPool(){
  const opts={
    legendary:$('#includeLegendary').checked,
    sub:$('#includeSubLegendary').checked,
    mythical:$('#includeMythical').checked,
    pseudo:$('#includePseudo').checked,
    ancient:$('#includeAncient').checked,
    future:$('#includeFuture').checked,
    sv:$('#svOnly').checked
  };
  return pokeState.data.filter(p=>{
    if(!opts.legendary && p.legendary)return false;
    if(!opts.sub && p.subLegendary)return false;
    if(!opts.mythical && p.mythical)return false;
    if(!opts.pseudo && p.pseudo)return false;
    if(!opts.ancient && p.ancient)return false;
    if(!opts.future && p.future)return false;
    if(opts.sv && !p.sv)return false;
    return true;
  });
}
function shuffle(a){
  const x=[...a];
  for(let i=x.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [x[i],x[j]]=[x[j],x[i]];
  }
  return x;
}
function ensureLockShape(){
  pokeState.locks=Array.from({length:pokeState.players},(_,i)=>
    Array.from({length:pokeState.perPlayer},(_,j)=>pokeState.locks?.[i]?.[j]||false)
  );
}

function evolutionUniqueOn(){
  return $('#evoUnique')?.checked !== false;
}
function canUsePokemon(p, usedIds, usedFamilies){
  if(usedIds.has(p.uniqueKey)) return false;
  if(evolutionUniqueOn() && usedFamilies.has(p.evo)) return false;
  return true;
}
function markPokemonUsed(p, usedIds, usedFamilies){
  usedIds.add(p.uniqueKey);
  if(evolutionUniqueOn()) usedFamilies.add(p.evo);
}

function drawAll(){
  if(pokeState.data.length<1025){alert('ポケモンデータの読み込みに失敗しています。');return;}
  if(!validateSpecialSettings())return;

  const usedIds=new Set();
  const usedFamilies=new Set();
  const groups=[];

  for(let pi=0;pi<pokeState.players;pi++){
    const g=[];
    for(let slot=0;slot<pokeState.perPlayer;slot++){
      const rule=slotRule(slot);
      const candidates=shuffle(
        candidatesForRule(rule).filter(p=>canUsePokemon(p,usedIds,usedFamilies))
      );
      const pick=candidates[0];
      if(!pick){
        alert(`抽選候補が足りません。PLAYER ${pi+1} の ${slotLabel(slot)} 枠で候補不足になりました。`);
        return;
      }
      g.push(pick);
      markPokemonUsed(pick,usedIds,usedFamilies);
    }
    groups.push(g);
  }

  pokeState.groups=groups;
  pokeState.manualPokemon=[];
  pokeState.locks=Array.from({length:pokeState.players},()=>Array(pokeState.perPlayer).fill(false));
  renderPokeResults();
  buildManualPokemonInputs();
}
$('#drawPokemonBtn').onclick=drawAll;

function currentUsed(excludePlayer=-1){
  const ids=new Set();
  const families=new Set();
  pokeState.groups.forEach((g,pi)=>g.forEach(p=>{
    if(pi!==excludePlayer){
      ids.add(p.uniqueKey);
      if(evolutionUniqueOn()) families.add(p.evo);
    }
  }));
  return {ids,families};
}
function rerollPlayer(pi){
  if(!pokeState.groups.length)return;
  if(!validateSpecialSettings())return;

  const used=currentUsed(pi);
  pokeState.groups[pi].forEach((p,j)=>{
    if(pokeState.locks[pi][j]) markPokemonUsed(p,used.ids,used.families);
  });

  for(let j=0;j<pokeState.perPlayer;j++){
    if(pokeState.locks[pi][j])continue;
    const rule=slotRule(j);
    const candidates=shuffle(
      candidatesForRule(rule).filter(p=>canUsePokemon(p,used.ids,used.families))
    );
    const pick=candidates[0];
    if(!pick){alert(`PLAYER ${pi+1} の ${slotLabel(j)} 枠で候補が足りません。`);return}
    pokeState.groups[pi][j]=pick;
    if(pokeState.manualPokemon[pi])pokeState.manualPokemon[pi][j]=pick;
    markPokemonUsed(pick,used.ids,used.families);
  }
  renderPokeResults();
  buildManualPokemonInputs();
}
function rerollUnlockedAll(){
  if(!pokeState.groups.length)return drawAll();
  if(!validateSpecialSettings())return;

  const usedIds=new Set();
  const usedFamilies=new Set();
  pokeState.groups.forEach((g,pi)=>g.forEach((p,j)=>{
    if(pokeState.locks[pi][j]) markPokemonUsed(p,usedIds,usedFamilies);
  }));

  for(let pi=0;pi<pokeState.players;pi++){
    for(let j=0;j<pokeState.perPlayer;j++){
      if(pokeState.locks[pi][j])continue;
      const rule=slotRule(j);
      const candidates=shuffle(
        candidatesForRule(rule).filter(p=>canUsePokemon(p,usedIds,usedFamilies))
      );
      const pick=candidates[0];
      if(!pick){alert(`PLAYER ${pi+1} の ${slotLabel(j)} 枠で候補が足りません。`);return}
      pokeState.groups[pi][j]=pick;
      if(pokeState.manualPokemon[pi])pokeState.manualPokemon[pi][j]=pick;
      markPokemonUsed(pick,usedIds,usedFamilies);
    }
  }
  renderPokeResults();
  buildManualPokemonInputs();
}
$('#rerollAllBtn').onclick=rerollUnlockedAll;

function specialTags(p){
  const tags=[];
  if(p.legendary)tags.push('伝説');
  if(p.subLegendary)tags.push('準伝');
  if(p.mythical)tags.push('幻');
  if(p.pseudo)tags.push('600族');
  if(p.ancient)tags.push('古代');
  if(p.future)tags.push('未来');
  return tags;
}
function tagHtml(p){
  const tags=specialTags(p);
  if(p.sv)tags.push('SV可');
  return tags.map(t=>`<span class="cat-tag">${t}</span>`).join('');
}
const finalEvolutionOverrides = {"ピチュー":["ライチュウ"],"ピカチュウ":["ライチュウ"],"ライチュウ":["ライチュウ"],"ピィ":["ピクシー"],"ピッピ":["ピクシー"],"ピクシー":["ピクシー"],"ププリン":["プクリン"],"プリン":["プクリン"],"プクリン":["プクリン"],"トゲピー":["トゲキッス"],"トゲチック":["トゲキッス"],"トゲキッス":["トゲキッス"],"バルキー":["サワムラー","エビワラー","カポエラー"],"サワムラー":["サワムラー","エビワラー","カポエラー"],"エビワラー":["サワムラー","エビワラー","カポエラー"],"カポエラー":["サワムラー","エビワラー","カポエラー"],"ムチュール":["ルージュラ"],"ルージュラ":["ルージュラ"],"エレキッド":["エレキブル"],"エレブー":["エレキブル"],"エレキブル":["エレキブル"],"ブビィ":["ブーバーン"],"ブーバー":["ブーバーン"],"ブーバーン":["ブーバーン"],"ルリリ":["マリルリ"],"マリル":["マリルリ"],"マリルリ":["マリルリ"],"ソーナノ":["ソーナンス"],"ソーナンス":["ソーナンス"],"スボミー":["ロズレイド"],"ロゼリア":["ロズレイド"],"ロズレイド":["ロズレイド"],"リーシャン":["チリーン"],"チリーン":["チリーン"],"ウソハチ":["ウソッキー"],"ウソッキー":["ウソッキー"],"マネネ":["バリコオル"],"バリヤード":["バリコオル"],"バリコオル":["バリコオル"],"ピンプク":["ハピナス"],"ラッキー":["ハピナス"],"ハピナス":["ハピナス"],"ゴンベ":["カビゴン"],"カビゴン":["カビゴン"],"リオル":["ルカリオ"],"ルカリオ":["ルカリオ"],"タマンタ":["マンタイン"],"マンタイン":["マンタイン"],"イーブイ":["シャワーズ","サンダース","ブースター","エーフィ","ブラッキー","リーフィア","グレイシア","ニンフィア"],"シャワーズ":["シャワーズ","サンダース","ブースター","エーフィ","ブラッキー","リーフィア","グレイシア","ニンフィア"],"サンダース":["シャワーズ","サンダース","ブースター","エーフィ","ブラッキー","リーフィア","グレイシア","ニンフィア"],"ブースター":["シャワーズ","サンダース","ブースター","エーフィ","ブラッキー","リーフィア","グレイシア","ニンフィア"],"エーフィ":["シャワーズ","サンダース","ブースター","エーフィ","ブラッキー","リーフィア","グレイシア","ニンフィア"],"ブラッキー":["シャワーズ","サンダース","ブースター","エーフィ","ブラッキー","リーフィア","グレイシア","ニンフィア"],"リーフィア":["シャワーズ","サンダース","ブースター","エーフィ","ブラッキー","リーフィア","グレイシア","ニンフィア"],"グレイシア":["シャワーズ","サンダース","ブースター","エーフィ","ブラッキー","リーフィア","グレイシア","ニンフィア"],"ニンフィア":["シャワーズ","サンダース","ブースター","エーフィ","ブラッキー","リーフィア","グレイシア","ニンフィア"],"ニョロモ":["ニョロボン","ニョロトノ"],"ニョロゾ":["ニョロボン","ニョロトノ"],"ニョロボン":["ニョロボン","ニョロトノ"],"ニョロトノ":["ニョロボン","ニョロトノ"],"クサイハナ":["ラフレシア","キレイハナ"],"ナゾノクサ":["ラフレシア","キレイハナ"],"ラフレシア":["ラフレシア","キレイハナ"],"キレイハナ":["ラフレシア","キレイハナ"],"ヤドン":["ヤドラン","ヤドキング"],"ヤドラン":["ヤドラン","ヤドキング"],"ヤドキング":["ヤドラン","ヤドキング"],"ケムッソ":["アゲハント","ドクケイル"],"カラサリス":["アゲハント","ドクケイル"],"アゲハント":["アゲハント","ドクケイル"],"マユルド":["アゲハント","ドクケイル"],"ドクケイル":["アゲハント","ドクケイル"],"ラルトス":["サーナイト","エルレイド"],"キルリア":["サーナイト","エルレイド"],"サーナイト":["サーナイト","エルレイド"],"エルレイド":["サーナイト","エルレイド"],"ツチニン":["テッカニン","ヌケニン"],"テッカニン":["テッカニン","ヌケニン"],"ヌケニン":["テッカニン","ヌケニン"],"ユキワラシ":["オニゴーリ","ユキメノコ"],"オニゴーリ":["オニゴーリ","ユキメノコ"],"ユキメノコ":["オニゴーリ","ユキメノコ"],"パールル":["ハンテール","サクラビス"],"ハンテール":["ハンテール","サクラビス"],"サクラビス":["ハンテール","サクラビス"],"ミノムッチ":["ミノマダム","ガーメイル"],"ミノマダム":["ミノマダム","ガーメイル"],"ガーメイル":["ミノマダム","ガーメイル"],"カブルモ":["シュバルゴ"],"シュバルゴ":["シュバルゴ"],"チョボマキ":["アギルダー"],"アギルダー":["アギルダー"],"ニダンギル":["ギルガルド"],"ヒトツキ":["ギルガルド"],"ギルガルド":["ギルガルド"],"ヌメラ":["ヌメルゴン"],"ヌメイル":["ヌメルゴン"],"ヌメルゴン":["ヌメルゴン"],"ヤバチャ":["ポットデス"],"ポットデス":["ポットデス"],"カジッチュ":["アップリュー","タルップル","カミツオロチ"],"アップリュー":["アップリュー","タルップル","カミツオロチ"],"タルップル":["アップリュー","タルップル","カミツオロチ"],"カミッチュ":["アップリュー","タルップル","カミツオロチ"],"カミツオロチ":["アップリュー","タルップル","カミツオロチ"],"チャデス":["ヤバソチャ"],"ヤバソチャ":["ヤバソチャ"],"ノコッチ":["ノココッチ"],"ノココッチ":["ノココッチ"],"キリンリキ":["リキキリン"],"リキキリン":["リキキリン"],"オドシシ":["アヤシシ"],"アヤシシ":["アヤシシ"],"ハリーセン":["ハリーマン"],"ハリーマン":["ハリーマン"],"バスラオ":["イダイトウ"],"イダイトウ":["イダイトウ"],"リングマ":["ガチグマ"],"ガチグマ":["ガチグマ"],"アカツキガチグマ":["アカツキガチグマ"]};

function finalEvolutionList(p){
  const names=finalEvolutionOverrides[p.name];
  if(names?.length){
    // すでに最終進化のポケモン自身なら、それ以上の進化先は表示しない。
    // 例：サワムラー／エビワラー／カポエラーはそれぞれ最終進化。
    if(names.includes(p.name)) return [p];
    return names.map(name=>pokeState.data.find(x=>x.name===name)).filter(Boolean);
  }
  const family=pokeState.data.filter(x=>x.evo===p.evo && !x.formKey);
  if(!family.length)return [];
  const final=family.reduce((a,b)=>b.id>a.id?b:a,family[0]);
  return [final];
}
function pokemonStats(p){
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
    const tags=specialTags(f).map(t=>`<span class="cat-tag">${t}</span>`).join('');
    const s=pokemonStats(f);
    const stat=s.bst!=null?` <span class="poke-stat-mini">BST ${s.bst} / S ${s.speed??'—'}</span>`:'';
    return `${f.name}${tags}${stat}`;
  }).join('／');
  const label=finals.length>1?'最終進化候補':'最終進化';
  return `<div class="final-evo">${label}：${items}</div>`;
}
function resultText(){
  return pokeState.groups.map((g,pi)=>{
    const lines=[playerDisplayName(pi)];
    g.forEach((p,j)=>{
      const finals=finalEvolutionList(p);
      const selfTags=specialTags(p);
      let line=`${j+1}. ${p.name}`;
      if(selfTags.length)line+=`【${selfTags.join('・')}】`;
      const showFinals=finals.filter(f=>f.uniqueKey!==p.uniqueKey || finals.length>1);
      if(showFinals.length){
        const parts=showFinals.map(f=>{
          const ft=specialTags(f);
          return `${f.name}${ft.length?`【${ft.join('・')}】`:''}`;
        });
        line+=` → ${finals.length>1?'最終進化候補':'最終進化'}：${parts.join('／')}`;
      }
      lines.push(line);
    });
    return lines.join('\n');
  }).join('\n\n');
}
function showCopyToast(text){
  const old=document.querySelector('.copy-toast'); if(old)old.remove();
  const el=document.createElement('div');el.className='copy-toast';el.textContent=text;
  document.body.append(el);setTimeout(()=>el.remove(),1600);
}
async function copyResults(){
  if(!pokeState.groups.length)return;
  const text=resultText();
  try{
    await navigator.clipboard.writeText(text);
    showCopyToast('結果をコピーしました');
  }catch{
    const ta=document.createElement('textarea');ta.value=text;document.body.append(ta);ta.select();
    document.execCommand('copy');ta.remove();showCopyToast('結果をコピーしました');
  }
}
$('#copyResultsBtn').onclick=copyResults;

function renderPokeResults(){
  const panel=$('#pokeResultsPanel'),box=$('#pokeResults');
  if(!pokeState.groups.length){panel.classList.add('hidden');return}
  panel.classList.remove('hidden');box.innerHTML='';
  pokeState.groups.forEach((g,pi)=>{
    const card=document.createElement('div');card.className='player-card';
    const head=document.createElement('div');head.className='player-head';
    head.innerHTML=`<div class="player-title">${playerDisplayName(pi)}</div>`;
    const acts=document.createElement('div');acts.className='player-actions';
    const rer=document.createElement('button');rer.type='button';rer.className='mini-btn';rer.textContent='この人だけ再抽選';rer.onclick=()=>rerollPlayer(pi);
    acts.append(rer);head.append(acts);card.append(head);
    const list=document.createElement('div');list.className='pokemon-list';
    g.forEach((p,j)=>{
      const locked=!!pokeState.locks[pi][j];
      const row=document.createElement('div');row.className=`pokemon-row${locked?' locked-row':''}`;
      const lock=document.createElement('button');lock.type='button';lock.className=`lock-btn${locked?' locked':''}`;
      lock.textContent=locked?'🔒 固定中':'🔓 未固定';
      lock.onclick=()=>{pokeState.locks[pi][j]=!pokeState.locks[pi][j];renderPokeResults()};
      const no=document.createElement('div');no.className='dex-no';no.textContent=String(p.id).padStart(4,'0');
      const nm=document.createElement('div');
      const ownStats=pokemonStats(p);
      const finalStats=finalEvolutionStats(p);
      const statLine=ownStats.bst!=null
        ? `<div class="poke-stat-line">BST ${ownStats.bst} / S ${ownStats.speed??'—'}${finalStats.bst!=null&&finalStats.bst!==ownStats.bst?`　最終BST ${finalStats.bst}`:''}</div>`
        : '';
      nm.innerHTML=`<div class="poke-name">${p.name}<span class="slot-tag">${slotLabel(j)}</span></div>
        <div class="category-tags">${tagHtml(p)}</div>${statLine}${finalEvolutionHtml(p)}`;
      row.append(lock,no,nm);list.append(row);
    });
    const partyFinalBst=g.reduce((sum,p)=>sum+(finalEvolutionStats(p).bst??pokemonStats(p).bst??0),0);
    if(partyFinalBst){
      const total=document.createElement('div');
      total.className='poke-party-stat-total';
      total.textContent=`パーティ最終進化BST合計 ${partyFinalBst}`;
      card.append(total);
    }
    card.append(list);box.append(card);
  });
}
buildPlayerNameInputs();
function pokemonSuggestions(query){
  const value=query.trim();if(!value)return [];
  return pokeState.data.filter(p=>p.sv&&p.name.includes(value)).sort((a,b)=>(b.name.startsWith(value)-a.name.startsWith(value))||a.id-b.id).slice(0,8);
}
function buildManualPokemonInputs(){
  const root=$('#manualPokemonInputs');if(!root)return;
  pokeState.manualPokemon=Array.from({length:pokeState.players},(_,i)=>Array.from({length:pokeState.perPlayer},(_,j)=>pokeState.manualPokemon[i]?.[j]||pokeState.groups[i]?.[j]||null));root.innerHTML='';
  for(let pi=0;pi<pokeState.players;pi++){
    const card=document.createElement('div');card.className='manual-player';card.innerHTML=`<strong>${playerDisplayName(pi)}</strong>`;const grid=document.createElement('div');grid.className='manual-pokemon-grid';
    for(let slot=0;slot<pokeState.perPlayer;slot++){
      const wrap=document.createElement('div');wrap.className='autocomplete';const input=document.createElement('input');input.type='search';input.placeholder=`${slot+1}体目`;input.autocomplete='off';input.value=pokeState.manualPokemon[pi][slot]?.name||'';const choices=document.createElement('div');choices.className='pokemon-suggestions hidden';
      const update=()=>{const found=pokemonSuggestions(input.value);choices.innerHTML=found.map(p=>`<button type="button" data-key="${p.uniqueKey}">${p.name}</button>`).join('');choices.classList.toggle('hidden',!found.length);choices.querySelectorAll('button').forEach(btn=>btn.onclick=()=>{const p=pokeState.data.find(x=>x.uniqueKey===btn.dataset.key);pokeState.manualPokemon[pi][slot]=p;input.value=p.name;choices.classList.add('hidden')})};
      input.oninput=()=>{pokeState.manualPokemon[pi][slot]=input.value.trim()?{name:input.value.trim()}:null;update()};input.onfocus=update;input.onblur=()=>setTimeout(()=>choices.classList.add('hidden'),150);wrap.append(input,choices);grid.append(wrap);
    }card.append(grid);root.append(card);
  }
}
buildManualPokemonInputs();


if('serviceWorker' in navigator){
  let reloadingForUpdate=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(reloadingForUpdate)return;
    reloadingForUpdate=true;
    window.location.reload();
  });

  window.addEventListener('load',async()=>{
    try{
      const registration=await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});
      await registration.update();
      document.addEventListener('visibilitychange',()=>{
        if(document.visibilityState==='visible')registration.update().catch(()=>{});
      });
    }catch{}
  });
}
