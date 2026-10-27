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
 draw(5);write(state);render();
}
function draw(n=1){for(let i=0;i<n;i++){if(!state.deck.length)break;state.hand.push(state.deck.pop())}}
function move(from,index,to){
 if(!state||!Array.isArray(state[from])||!Array.isArray(state[to]))return;
 const id=state[from][index];if(id===undefined)return;
 state[from].splice(index,1);state[to].push(id);state.log.unshift('T'+state.turn+' '+from+' → '+to+'：'+(card(id)?.name||id));write(state);render();
}
function render(){
 const pane=$('#loveSoloPane');if(!pane)return;
 const decks=read(DECKS,[]);const chooser=$('#loveSoloDeckChoice');
 chooser.innerHTML=decks.map(d=>'<option value="'+esc(d.id)+'">'+esc(d.name)+'</option>').join('')||'<option value="">デッキ未作成</option>';
 if(state&&!decks.some(d=>d.id===state.deckId))state=null;
 if(state)chooser.value=state.deckId;
 const root=$('#loveSoloBoard');
 if(!state){root.innerHTML='<p class="note">デッキ構築でデッキを作成し、「開始」を押してください。</p>';return}
 const zones=[['hand','手札'],['stage','ステージ'],['live','ライブセット'],['energy','エネルギー'],['energyUsed','使用済エネルギー'],['discard','控え室']];
 const item=(id,zone,i)=>{const c=card(id);return '<div style="border:1px solid #aaa6;border-radius:8px;padding:6px;min-width:100px;max-width:140px;flex:0 0 115px">'+(c?.imageUrl?'<img loading="lazy" src="'+esc(c.imageUrl)+'" style="width:100%;max-height:145px;object-fit:contain">':'')+'<div style="font-size:11px">'+esc(c?.name||id)+'</div><button type="button" class="ghost-btn" style="width:100%" data-solo-detail="'+esc(id)+'">詳細</button><select data-solo-from="'+zone+'" data-solo-index="'+i+'" style="width:100%;font-size:11px"><option value="">移動先</option>'+zones.filter(z=>z[0]!==zone).map(z=>'<option value="'+z[0]+'">'+z[1]+'</option>').join('')+'</select></div>'};
 root.innerHTML='<h3>ターン '+state.turn+' ／ 山札 '+state.deck.length+'枚</h3><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px"><button type="button" class="primary-btn" data-solo-command="draw">1枚ドロー</button><button type="button" class="ghost-btn" data-solo-command="energy">山札からエネルギーへ</button><button type="button" class="ghost-btn" data-solo-command="next">次のターン</button><button type="button" class="ghost-btn" data-solo-command="shuffle">山札シャッフル</button></div>'+zones.map(([zone,label])=>'<section style="margin:12px 0"><h3>'+label+'（'+state[zone].length+'）</h3><div style="display:flex;gap:8px;overflow-x:auto;padding:6px 0">'+(state[zone].map((id,i)=>item(id,zone,i)).join('')||'<span class="hint">カードなし</span>')+'</div></section>').join('')+'<details><summary>操作履歴</summary><p class="hint">'+state.log.slice(0,20).map(esc).join(' ／ ')+'</p></details>';
}
function init(){
 const nav=$('#loveScreen > .love-subnav'),browser=$('#loveCardBrowserPane');
 if(!nav||!browser){setTimeout(init,350);return}
 const tab=document.createElement('button');tab.className='love-tab';tab.dataset.lovePane='solo';tab.type='button';tab.textContent='1人回し';nav.append(tab);
 const pane=document.createElement('div');pane.id='loveSoloPane';pane.className='love-pane hidden';
 pane.innerHTML='<section class="panel"><div class="section-title-row"><h2>1人回し</h2><span class="badge ok">端末内保存</span></div><p class="hint">カード効果は手動処理です。移動先を選ぶとカードを移動できます。エネルギーはデッキ内のカードから仮置きする簡易操作です。</p><div style="display:flex;gap:8px"><select id="loveSoloDeckChoice" style="flex:1"></select><button type="button" id="loveSoloStart" class="primary-btn">開始／やり直し</button></div><div id="loveSoloBoard"></div></section><dialog id="loveSoloCardDialog" style="max-width:min(95vw,460px);max-height:85vh;overflow:auto;border-radius:12px;border:1px solid #aaa"><div id="loveSoloCardDetail"></div><button type="button" id="loveSoloClose" class="primary-btn">閉じる</button></dialog>';
 browser.after(pane);
 tab.onclick=()=>{nav.querySelectorAll('.love-tab').forEach(b=>b.classList.toggle('active',b===tab));['#loveCalcPane','#loveCardBrowserPane','#loveWishlistPane','#loveDeckBuilderPane'].forEach(s=>$(s)?.classList.add('hidden'));pane.classList.remove('hidden');$('#appTitle').textContent='ラブカ 1人回し';$('#resetAllBtn').style.display='none';render()};
 nav.querySelectorAll('.love-tab:not([data-love-pane="solo"])').forEach(b=>b.addEventListener('click',()=>pane.classList.add('hidden')));
 $('#navLove')?.addEventListener('click',()=>{if(tab.classList.contains('active')){$('#appTitle').textContent='ラブカ 1人回し';$('#resetAllBtn').style.display='none'}});
 $('#loveSoloStart').onclick=()=>{const deck=read(DECKS,[]).find(d=>d.id===$('#loveSoloDeckChoice').value);if(!deck){alert('先にデッキを作成してください');return}if(state&&!confirm('現在の1人回しを初期化しますか？'))return;reset(deck)};
 pane.addEventListener('change',e=>{const sel=e.target.closest('[data-solo-from]');if(sel&&sel.value)move(sel.dataset.soloFrom,Number(sel.dataset.soloIndex),sel.value)});
 pane.addEventListener('click',e=>{
  const command=e.target.closest('[data-solo-command]')?.dataset.soloCommand;
  if(command&&state){if(command==='draw')draw();if(command==='energy'&&state.deck.length)state.energy.push(state.deck.pop());if(command==='next'){state.turn++;state.energy.push(...state.energyUsed.splice(0));draw()}if(command==='shuffle')state.deck=random(state.deck);state.log.unshift('T'+state.turn+'：'+command);write(state);render();return}
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