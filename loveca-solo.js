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
 state={deckId:deck.id,turn:1,deck:random(pile),hand:[],stage:[],live:[],discard:[],energy:[],energyUsed:[],selected:null,log:[]};
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
 const decks=read(DECKS,[]),chooser=$('#loveSoloDeckChoice');
 const oldChoice=chooser.value;
 chooser.innerHTML=decks.map(d=>'<option value="'+esc(d.id)+'">'+esc(d.name)+'</option>').join('')||'<option value="">デッキ未作成</option>';
 if(state&&!decks.some(d=>d.id===state.deckId))state=null;
 chooser.value=state?.deckId||oldChoice||decks[0]?.id||'';
 const root=$('#loveSoloBoard');
 if(!state){root.innerHTML='<p class="note">デッキを選んで「開始」を押してください。</p>';return}
 if(!Array.isArray(state.energy)||!state.energy.every(e=>e&&typeof e==='object'&&'used'in e)){
  state.energy=Array.from({length:4},(_,i)=>({token:i+1,used:false}));state.energyUsed=[];write(state);
 }
 const zones=[['hand','手札'],['stage','ステージ'],['live','ライブ置き場'],['discard','控え室']];
 const cardTile=(id,zone,i)=>{const c=card(id);return '<div class="solo-card">'+(c?.imageUrl?'<img loading="lazy" src="'+esc(c.imageUrl)+'" alt="'+esc(c.name)+'">':'<div class="solo-card-back">CARD</div>')+'<div class="solo-card-tools"><button type="button" data-solo-detail="'+esc(id)+'" aria-label="カード詳細">詳細</button><select aria-label="移動先" data-solo-from="'+zone+'" data-solo-index="'+i+'"><option value="">移動</option>'+zones.filter(z=>z[0]!==zone).map(z=>'<option value="'+z[0]+'">'+z[1]+'</option>').join('')+'</select></div></div>'};
 const area=(key,label)=>'<section class="solo-zone solo-'+key+'"><div class="solo-zone-title">'+label+' <small>'+state[key].length+'</small></div><div class="solo-zone-cards">'+state[key].map((id,i)=>cardTile(id,key,i)).join('')+'</div></section>';
 const energies=state.energy.map((e,i)=>'<button type="button" class="solo-energy-card '+(e.used?'used':'')+'" data-solo-energy="'+i+'" aria-label="エネルギー'+(i+1)+(e.used?' 使用済み':' 未使用')+'"><span>ENERGY</span><small>'+(e.used?'使用済':'使用可')+'</small></button>').join('');
 root.innerHTML='<div class="solo-toolbar"><strong>ターン '+state.turn+'</strong><button type="button" data-solo-command="draw">ドロー</button><button type="button" data-solo-command="next">次のターン</button><button type="button" data-solo-command="shuffle">シャッフル</button><button type="button" data-solo-command="energy">＋エネルギー</button></div><div class="solo-mat"><div class="solo-upper"><div class="solo-live-group">'+area('live','ライブカード置き場')+'</div>'+area('stage','ステージ（左・中央・右）')+'<div class="solo-side"><div class="solo-pile"><span>山札</span><strong>'+state.deck.length+'</strong></div>'+area('discard','控え室')+'</div></div><div class="solo-lower"><section class="solo-zone solo-energy"><div class="solo-zone-title">エネルギー <small>'+state.energy.filter(e=>!e.used).length+'/'+state.energy.length+' 使用可</small></div><div class="solo-energy-row">'+energies+'</div></section>'+area('hand','手札')+'</div></div><details class="solo-history"><summary>操作履歴</summary><p>'+state.log.slice(0,20).map(esc).join(' ／ ')+'</p></details>';
}
function init(){
 const nav=$('#loveScreen > .love-subnav'),browser=$('#loveCardBrowserPane');
 if(!nav||!browser){setTimeout(init,350);return}
 const tab=document.createElement('button');tab.className='love-tab';tab.dataset.lovePane='solo';tab.type='button';tab.textContent='1人回し';nav.append(tab);
 const pane=document.createElement('div');pane.id='loveSoloPane';pane.className='love-pane hidden';
 pane.innerHTML='<section class="panel"><div class="section-title-row"><h2>1人回し</h2><span class="badge ok">端末内保存</span></div><p class="hint">カード効果は手動処理です。移動先を選ぶとカードを移動できます。初期エネルギー4枚。タップで横向き（使用済み）にし、次のターンで戻します。</p><div style="display:flex;gap:8px"><select id="loveSoloDeckChoice" style="flex:1"></select><button type="button" id="loveSoloStart" class="primary-btn">開始／やり直し</button></div><div id="loveSoloBoard"></div></section><dialog id="loveSoloCardDialog" style="max-width:min(95vw,460px);max-height:85vh;overflow:auto;border-radius:12px;border:1px solid #aaa"><div id="loveSoloCardDetail"></div><button type="button" id="loveSoloClose" class="primary-btn">閉じる</button></dialog>';
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