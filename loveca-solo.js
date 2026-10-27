/* Manual solo play tester. All state stays on this device. */
(()=>{'use strict';
const DECKS='lovepoke_loveca_card_decks_v1',SESSION='lovepoke_loveca_solo_v1';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}};
const write=s=>{try{localStorage.setItem(SESSION,JSON.stringify(s))}catch{alert('進行状況の保存に失敗しました')}};
let cards=[],state=null;
const card=id=>cards.find(c=>String(c.id)===String(id));
const random=arr=>{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
function reset(deck){
 const pile=[];for(const [id,n] of Object.entries(deck.cards||{}))for(let i=0;i<Math.min(500,Number(n)||0);i++)pile.push(id);
 state={deckId:deck.id,turn:1,deck:random(pile),hand:[],stage:[],live:[],discard:[],energy:[],energyUsed:[],selected:null,stageSlots:[null,null,null],liveSlots:[null,null,null],log:[]};
 state.energy=Array.from({length:4},(_,i)=>({token:i+1,used:false}));draw(5);write(state);render();
}
function draw(n=1){for(let i=0;i<n;i++){if(!state.deck.length)break;state.hand.push(state.deck.pop())}}
function move(from,index,to){
 if(!state||!Array.isArray(state[from])||!Array.isArray(state[to])||from==='energy'||to==='energy'||from==='energyUsed'||to==='energyUsed')return;
 const id=state[from][index];if(id===undefined)return;
 state[from].splice(index,1);state[to].push(id);state.log.unshift('T'+state.turn+' '+from+' → '+to+'：'+(card(id)?.name||id));write(state);render();
}
function render(){
 const pane=$('#loveSoloPane');if(!pane)return;
 const decks=read(DECKS,[]),chooser=$('#loveSoloDeckChoice'),choice=chooser.value;
 chooser.innerHTML=decks.map(d=>'<option value="'+esc(d.id)+'">'+esc(d.name)+'</option>').join('')||'<option value="">デッキ未作成</option>';
 if(state&&!decks.some(d=>d.id===state.deckId))state=null;
 chooser.value=state?.deckId||choice||decks[0]?.id||'';
 const root=$('#loveSoloBoard');
 if(!state){root.innerHTML='<p class="note">デッキを選んで「開始」を押してください。</p>';return}
 if(!Array.isArray(state.stageSlots)){state.stageSlots=[...state.stage.slice(0,3),...Array(3)].slice(0,3);state.stage=state.stage.slice(3)}
 if(!Array.isArray(state.liveSlots)){state.liveSlots=[...state.live.slice(0,3),...Array(3)].slice(0,3);state.live=state.live.slice(3)}
 if(!Array.isArray(state.energy)||!state.energy.every(e=>e&&typeof e==='object'&&'used'in e)){state.energy=Array.from({length:4},(_,i)=>({token:i+1,used:false}));state.energyUsed=[]}
 const tile=(id,zone,i)=>{const c=card(id);return '<button type="button" class="solo-tap-card" data-solo-pick="'+zone+'" data-solo-index="'+i+'">'+(c?.imageUrl?'<img loading="lazy" src="'+esc(c.imageUrl)+'" alt="'+esc(c.name)+'">':'<span>CARD</span>')+'</button>'};
 const slots=(key,label)=>'<section class="solo-slots-section"><h3>'+label+'</h3><div class="solo-three-slots">'+state[key].map((id,i)=>'<button type="button" class="solo-slot '+(key==='liveSlots'?'solo-slot-live':'solo-slot-stage')+'" data-solo-pick="'+key+'" data-solo-index="'+i+'"><span class="solo-slot-number">'+(i+1)+'</span>'+(id?(card(id)?.imageUrl?'<img src="'+esc(card(id).imageUrl)+'" alt="'+esc(card(id).name)+'">':'<span>'+esc(card(id)?.name||id)+'</span>'):'<span class="solo-empty">空き</span>')+'</button>').join('')+'</div></section>';
 const energies=state.energy.map((e,i)=>'<button type="button" class="solo-energy-card '+(e.used?'used':'')+'" data-solo-energy="'+i+'"><span>ENERGY</span><small>'+(e.used?'使用済':'使用可')+'</small></button>').join('');
 root.innerHTML='<div class="solo-toolbar"><strong>ターン '+state.turn+'</strong><button type="button" data-solo-command="draw">ドロー</button><button type="button" data-solo-command="next">次のターン</button><button type="button" data-solo-command="shuffle">シャッフル</button><button type="button" data-solo-command="energy">＋エネルギー</button></div><div class="solo-portrait-mat">'+slots('liveSlots','ライブカード')+slots('stageSlots','ステージ')+'<div class="solo-deck-row"><div class="solo-pile">山札 <strong>'+state.deck.length+'</strong></div><button type="button" class="solo-pile" data-solo-zone="discard">控え室 <strong>'+state.discard.length+'</strong></button></div><section class="solo-zone solo-energy"><div class="solo-zone-title">エネルギー '+state.energy.filter(e=>!e.used).length+'/'+state.energy.length+'</div><div class="solo-energy-row">'+energies+'</div></section><section class="solo-zone solo-hand"><div class="solo-zone-title">手札 '+state.hand.length+'枚（カードをタップして配置）</div><div class="solo-hand-cards">'+state.hand.map((id,i)=>tile(id,'hand',i)).join('')+'</div></section></div><details class="solo-history"><summary>操作履歴</summary><p>'+state.log.slice(0,20).map(esc).join(' ／ ')+'</p></details>';
 write(state);
}
function pick(zone,index){
 if(!state)return;
 const id=state[zone]?.[index];if(!id)return;
 const c=card(id),live=Boolean(c?.isLive||c?.cardType==='ライブ'||String(c?.cardType||'').toLowerCase()==='live');
 const targets=zone==='hand'?(live?['liveSlots']:['stageSlots']):['stageSlots','liveSlots'];
 const names={stageSlots:'ステージ',liveSlots:'ライブ'};
 const choices=targets.flatMap(k=>[0,1,2].map(i=>({key:k,index:i,label:names[k]+' '+(i+1),occupied:!!state[k][i]})));
 const dialog=$('#loveSoloCardDialog'),body=$('#loveSoloCardDetail');
 body.innerHTML='<h3>'+esc(c?.name||id)+'</h3>'+(c?.imageUrl?'<img src="'+esc(c.imageUrl)+'" style="width:90px;max-height:130px;object-fit:contain">':'')+'<p>移動先を選択</p><div class="solo-choice-grid">'+choices.map(x=>'<button type="button" class="ghost-btn" data-solo-target="'+x.key+'" data-solo-target-index="'+x.index+'">'+x.label+(x.occupied?'（入替）':'')+'</button>').join('')+'<button type="button" class="ghost-btn" data-solo-target="hand">手札へ戻す</button><button type="button" class="ghost-btn" data-solo-target="discard">控え室へ</button></div><details><summary>カード効果を見る</summary><p>'+esc(c?.text)+'</p></details>';
 dialog.dataset.from=zone;dialog.dataset.index=index;dialog.showModal();
}
function place(to,index){
 const dialog=$('#loveSoloCardDialog'),from=dialog.dataset.from,fromIndex=Number(dialog.dataset.index);
 if(!state||!Array.isArray(state[from]))return;
 const id=state[from][fromIndex];if(!id)return;
 if(from==='hand'||from==='discard')state[from].splice(fromIndex,1);else state[from][fromIndex]=null;
 if(to==='hand'||to==='discard')state[to].push(id);
 else if(Array.isArray(state[to])&&index>=0&&index<3){
  const displaced=state[to][index];state[to][index]=id;
  if(displaced){if(from==='hand'||from==='discard')state.hand.push(displaced);else state[from][fromIndex]=displaced}
 }else return;
 state.log.unshift('T'+state.turn+' '+(card(id)?.name||id)+' → '+to+(Number.isInteger(index)?index+1:''));
 dialog.close();write(state);render();
}
function init(){
 const nav=$('#loveScreen > .love-subnav'),browser=$('#loveCardBrowserPane');
 if(!nav||!browser){setTimeout(init,350);return}
 const tab=document.createElement('button');tab.className='love-tab';tab.dataset.lovePane='solo';tab.type='button';tab.textContent='1人回し';nav.append(tab);
 const pane=document.createElement('div');pane.id='loveSoloPane';pane.className='love-pane hidden';
 pane.innerHTML='<section class="panel"><div class="section-title-row"><h2>1人回し</h2><span class="badge ok">端末内保存</span></div><p class="hint">カード効果は手動処理です。手札のカードをタップして配置先を選びます。初期エネルギー4枚。タップで横向き（使用済み）にし、次のターンで戻します。</p><div style="display:flex;gap:8px"><select id="loveSoloDeckChoice" style="flex:1"></select><button type="button" id="loveSoloStart" class="primary-btn">開始／やり直し</button></div><div id="loveSoloBoard"></div></section><dialog id="loveSoloCardDialog" style="max-width:min(95vw,460px);max-height:85vh;overflow:auto;border-radius:12px;border:1px solid #aaa"><div id="loveSoloCardDetail"></div><button type="button" id="loveSoloClose" class="primary-btn">閉じる</button></dialog>';
 browser.after(pane);
 tab.onclick=()=>{nav.querySelectorAll('.love-tab').forEach(b=>b.classList.toggle('active',b===tab));['#loveCalcPane','#loveCardBrowserPane','#loveWishlistPane','#loveDeckBuilderPane'].forEach(s=>$(s)?.classList.add('hidden'));pane.classList.remove('hidden');$('#appTitle').textContent='ラブカ 1人回し';$('#resetAllBtn').style.display='none';render()};
 nav.querySelectorAll('.love-tab:not([data-love-pane="solo"])').forEach(b=>b.addEventListener('click',()=>pane.classList.add('hidden')));
 $('#navLove')?.addEventListener('click',()=>{if(tab.classList.contains('active')){$('#appTitle').textContent='ラブカ 1人回し';$('#resetAllBtn').style.display='none'}});
 $('#loveSoloStart').onclick=()=>{const deck=read(DECKS,[]).find(d=>d.id===$('#loveSoloDeckChoice').value);if(!deck){alert('先にデッキを作成してください');return}if(state&&!confirm('現在の1人回しを初期化しますか？'))return;reset(deck)};
 pane.addEventListener('change',e=>{const sel=e.target.closest('[data-solo-from]');if(sel&&sel.value)move(sel.dataset.soloFrom,Number(sel.dataset.soloIndex),sel.value)});
 pane.addEventListener('click',e=>{
  const command=e.target.closest('[data-solo-command]')?.dataset.soloCommand;
  if(command&&state){if(command==='draw')draw();if(command==='energy')state.energy.push({token:state.energy.length+1,used:false});if(command==='next'){state.turn++;state.energy.forEach(e=>e.used=false);draw()}if(command==='shuffle')state.deck=random(state.deck);state.log.unshift('T'+state.turn+'：'+command);write(state);render();return}
  const energy=e.target.closest('[data-solo-energy]');if(energy&&state){const item=state.energy[Number(energy.dataset.soloEnergy)];if(item){item.used=!item.used;write(state);render()}return}
  const selected=e.target.closest('[data-solo-pick]');if(selected){pick(selected.dataset.soloPick,Number(selected.dataset.soloIndex));return}
  const target=e.target.closest('[data-solo-target]');if(target){place(target.dataset.soloTarget,Number(target.dataset.soloTargetIndex));return}
  const detail=e.target.closest('[data-solo-detail]');if(!detail)return;
  const c=card(detail.dataset.soloDetail);if(!c)return;
  $('#loveSoloCardDetail').innerHTML='<h3>'+esc(c.name)+'</h3><p>'+esc(c.cardNo)+'</p>'+(c.imageUrl?'<img src="'+esc(c.imageUrl)+'" style="max-width:100%;max-height:50vh;object-fit:contain">':'')+'<p style="white-space:pre-wrap">'+esc(c.text)+'</p>';
  $('#loveSoloCardDialog').showModal();
 });
 $('#loveSoloClose').onclick=()=>$('#loveSoloCardDialog').close();
 const saved=read(SESSION,null);if(saved&&['deck','hand','stage','live','energy','energyUsed','discard'].every(k=>Array.isArray(saved[k])))state=saved;
 fetch('./loveca-cards.json').then(r=>r.json()).then(d=>{cards=Array.isArray(d.cards)?d.cards:[];render()}).catch(console.warn);
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();