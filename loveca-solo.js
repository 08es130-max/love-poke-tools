/* Manual solo play tester. All state stays on this device. */
(()=>{'use strict';
const DECKS='lovepoke_loveca_card_decks_v1',SESSION='lovepoke_loveca_solo_v1';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}};
const write=s=>{try{localStorage.setItem(SESSION,JSON.stringify(s))}catch{alert('進行状況の保存に失敗しました')}};
let cards=[],state=null,undoStack=[];
const snapshot=()=>{if(state){undoStack.push(JSON.stringify(state));if(undoStack.length>40)undoStack.shift()}};
const undo=()=>{if(undoStack.length){state=JSON.parse(undoStack.pop());write(state);render()}};
const card=id=>cards.find(c=>String(c.id)===String(id));
const random=arr=>{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
function reset(deck){
 const pile=[];for(const [id,n] of Object.entries(deck.cards||{}))for(let i=0;i<Math.min(500,Number(n)||0);i++)pile.push(id);
 state={deckId:deck.id,turn:1,deck:random(pile),hand:[],stage:[],live:[],discard:[],energy:[],energyUsed:[],selected:null,stageSlots:[null,null,null],liveSlots:[null,null,null],successLive:[],revealed:[],stageWait:[false,false,false],stageUnder:[[],[],[]],log:[]};
 undoStack=[];state.energy=Array.from({length:4},(_,i)=>({token:i+1,used:false}));draw(5);write(state);render();
}
let refreshNoticeTimer;
function refreshDeck(){
 if(!state||state.deck.length||!state.discard.length)return false;
 state.deck=random(state.discard);
 state.discard=[];
 state.log.unshift('T'+state.turn+'：山札をリフレッシュ（'+state.deck.length+'枚）');
 const notice=$('#lovecaSoloRefreshNotice')||document.createElement('div');
 notice.id='lovecaSoloRefreshNotice';
 notice.setAttribute('role','status');
 notice.setAttribute('aria-live','polite');
 notice.textContent='リフレッシュしました';
 notice.style.cssText='position:fixed;z-index:99999;left:50%;bottom:125px;transform:translateX(-50%);padding:12px 18px;border-radius:12px;background:#9d2e61;color:white;font-weight:bold;box-shadow:0 5px 20px #0004;white-space:nowrap';
 if(!notice.isConnected)document.body.append(notice);
 clearTimeout(refreshNoticeTimer);
 refreshNoticeTimer=setTimeout(()=>notice.remove(),2500);
 return true;
}
function draw(n=1){
 for(let i=0;i<n;i++){
  if(!state.deck.length&&!refreshDeck())break;
  state.hand.push(state.deck.pop());
  if(!state.deck.length)refreshDeck();
 }
}
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
 if(!Array.isArray(state.successLive))state.successLive=[];
 if(!Array.isArray(state.revealed))state.revealed=[];
 if(!Array.isArray(state.stageWait))state.stageWait=[false,false,false];
 if(!Array.isArray(state.stageUnder))state.stageUnder=[[],[],[]];
 if(!Array.isArray(state.stageSlots)){state.stageSlots=[...state.stage.slice(0,3),...Array(3)].slice(0,3);state.stage=state.stage.slice(3)}
 if(!Array.isArray(state.liveSlots)){state.liveSlots=[...state.live.slice(0,3),...Array(3)].slice(0,3);state.live=state.live.slice(3)}
 if(!Array.isArray(state.energy)||!state.energy.every(e=>e&&typeof e==='object'&&'used'in e)){state.energy=Array.from({length:4},(_,i)=>({token:i+1,used:false}));state.energyUsed=[]}
 const tile=(id,zone,i)=>{const c=card(id);return '<button type="button" class="solo-tap-card" data-solo-pick="'+zone+'" data-solo-index="'+i+'">'+(c?.imageUrl?'<img loading="lazy" src="'+esc(c.imageUrl)+'" alt="'+esc(c.name)+'">':'<span>CARD</span>')+'</button>'};
 const slots=(key,label)=>'<section class="solo-slots-section"><h3>'+label+'</h3><div class="solo-three-slots">'+state[key].map((id,i)=>'<button type="button" class="solo-slot '+(key==='liveSlots'?'solo-slot-live':'solo-slot-stage')+(key==='stageSlots'&&state.stageWait[i]?' solo-wait':'')+'" data-solo-pick="'+key+'" data-solo-index="'+i+'"><span class="solo-slot-number">'+(i+1)+'</span>'+(id?(card(id)?.imageUrl?'<img src="'+esc(card(id).imageUrl)+'" alt="'+esc(card(id).name)+'">':'<span>'+esc(card(id)?.name||id)+'</span>'):'<span class="solo-empty">空き</span>')+'</button>'+(key==='stageSlots'?'<div class="solo-under-row">'+(state.stageUnder[i]||[]).map((item,j)=>'<button type="button" class="solo-under-card" data-solo-under-slot="'+i+'" data-solo-under-index="'+j+'" title="下に置いたカード">'+(item.kind==='energy'?'<span>⚡</span>':card(item.id)?.imageUrl?'<img src="'+esc(card(item.id).imageUrl)+'" alt="">':'<span>カード</span>')+'</button>').join('')+'</div>':'')).join('')+'</div></section>';
 const energies=state.energy.map((e,i)=>'<button type="button" class="solo-energy-card '+(e.used?'used':'')+'" data-solo-energy="'+i+'"><span>ENERGY</span><small>'+(e.used?'使用済':'使用可')+'</small></button>').join('');
 root.innerHTML='<div class="solo-toolbar"><strong>ターン '+state.turn+'</strong><button type="button" data-solo-command="undo">↶ 1手戻る</button><button type="button" data-solo-command="draw">ドロー</button><button type="button" data-solo-command="next">次のターン</button><button type="button" data-solo-command="shuffle">シャッフル</button><button type="button" data-solo-command="reveal">山札をめくる</button><button type="button" data-solo-command="discard-return">控え室→山札</button><button type="button" data-solo-command="special">特殊処理</button><button type="button" data-solo-command="energy">＋エネルギー</button></div><div class="solo-portrait-mat">'+slots('liveSlots','ライブカード')+slots('stageSlots','ステージ')+'<div class="solo-deck-row"><div class="solo-pile">山札 <strong>'+state.deck.length+'</strong></div><button type="button" class="solo-pile" data-solo-zone="discard">控え室（見る） <strong>'+state.discard.length+'</strong></button></div><section class="solo-reveal-zone"><div class="solo-zone-title">公開中 '+state.revealed.length+'枚</div><div class="solo-reveal-cards">'+state.revealed.map((id,i)=>tile(id,'revealed',i)).join('')+'</div></section><section class="solo-success-zone"><div class="solo-zone-title">成功ライブカード置き場 <strong>'+state.successLive.length+'枚</strong></div><div class="solo-success-cards">'+state.successLive.map((id,i)=>tile(id,'successLive',i)).join('')+'</div></section><section class="solo-zone solo-energy"><div class="solo-zone-title">エネルギー '+state.energy.filter(e=>!e.used).length+'/'+state.energy.length+'</div><div class="solo-energy-row">'+energies+'</div></section><section class="solo-zone solo-hand"><div class="solo-zone-title">手札 '+state.hand.length+'枚（カードをタップして配置）</div><div class="solo-hand-cards">'+state.hand.map((id,i)=>tile(id,'hand',i)).join('')+'</div></section></div><details class="solo-history"><summary>操作履歴</summary><p>'+state.log.slice(0,20).map(esc).join(' ／ ')+'</p></details>';
 const toolbar=root.querySelector('.solo-toolbar'),hand=root.querySelector('.solo-hand');
 if(toolbar&&hand){const dock=document.createElement('div');dock.className='solo-control-dock';dock.append(toolbar,hand);root.append(dock)}
 write(state);
}
function pick(zone,index){
 if(!state)return;
 const id=state[zone]?.[index];if(!id)return;
 const c=card(id),live=Boolean(c?.isLive||c?.cardType==='ライブ'||String(c?.cardType||'').toLowerCase()==='live');
 const targets=zone==='hand'?(live?['liveSlots']:['stageSlots']):zone==='liveSlots'?['liveSlots']:zone==='stageSlots'?['stageSlots']:[];
 const names={stageSlots:'ステージ',liveSlots:'ライブ'};
 const choices=targets.flatMap(k=>[0,1,2].map(i=>({key:k,index:i,label:names[k]+' '+(i+1),occupied:!!state[k][i]})));
 const dialog=$('#loveSoloCardDialog'),body=$('#loveSoloCardDetail');
 body.innerHTML='<div class="solo-detail-top"><div class="solo-detail-image">'+(c?.imageUrl?'<img src="'+esc(c.imageUrl)+'" alt="'+esc(c.name)+'">':'')+'</div><div class="solo-detail-info"><h3>'+esc(c?.name||id)+'</h3><p>'+esc(c?.cardNo||'')+' / '+esc(c?.cardType||'')+'</p><div class="solo-effect-box"><strong>カード効果</strong><p>'+esc(c?.text||'効果なし')+'</p></div></div></div><h4>移動先を選択</h4><div class="solo-choice-grid">'+choices.map(x=>'<button type="button" class="ghost-btn" data-solo-target="'+x.key+'" data-solo-target-index="'+x.index+'">'+x.label+(x.occupied?'（元のカードは控え室へ）':'')+'</button>').join('')+(zone==='stageSlots'?'<button type="button" class="ghost-btn" data-solo-wait="'+index+'">'+(state.stageWait[index]?'ウェイト解除':'ウェイト（横向き）')+'</button>':'')+(zone==='revealed'?'<button type="button" class="ghost-btn" data-solo-target="deckTop">山札の上へ戻す</button>':'')+(live?'<button type="button" class="ghost-btn" data-solo-target="successLive">成功ライブへ</button>':'')+(zone==='hand'||zone==='discard'?state.stageSlots.map((id,i)=>id?'<button type="button" class="ghost-btn" data-solo-under-target="'+i+'">ステージ'+(i+1)+'の下に置く</button>':'').join(''):'')+'<button type="button" class="ghost-btn" data-solo-target="hand">手札へ戻す</button><button type="button" class="ghost-btn" data-solo-target="discard">控え室へ</button></div>';
 dialog.dataset.from=zone;dialog.dataset.index=index;dialog.showModal();
}
function attachUnder(from,index,slot){
 if(!state||!state.stageSlots[slot]||!Array.isArray(state.stageUnder?.[slot]))return false;
 let item;
 if(from==='energy'){
  if(!state.energy[index])return false;
  snapshot();item={kind:'energy',energy:state.energy.splice(index,1)[0]};
 }else if(from==='hand'||from==='discard'){
  if(!state[from][index])return false;
  snapshot();item={kind:'card',id:state[from].splice(index,1)[0]};
 }else return false;
 state.stageUnder[slot].push(item);
 state.log.unshift('T'+state.turn+'：'+(item.kind==='energy'?'エネルギー':card(item.id)?.name||item.id)+'をステージ'+(slot+1)+'の下へ');
 write(state);render();return true;
}
function detachUnder(slot,index,to){
 const item=state?.stageUnder?.[slot]?.[index];if(!item)return;
 snapshot();state.stageUnder[slot].splice(index,1);
 if(item.kind==='energy')state.energy.push(item.energy||{token:state.energy.length+1,used:false});
 else state[to==='hand'?'hand':'discard'].push(item.id);
 state.log.unshift('T'+state.turn+'：ステージ'+(slot+1)+'の下から戻す');
 $('#loveSoloCardDialog').close();write(state);render();
}
function showUnder(slot,index){
 const item=state?.stageUnder?.[slot]?.[index];if(!item)return;
 const c=item.kind==='card'?card(item.id):null;
 const body=$('#loveSoloCardDetail');
 body.innerHTML='<h3>ステージ'+(slot+1)+'の下のカード</h3>'+(c?.imageUrl?'<img style="max-width:140px;max-height:200px;object-fit:contain" src="'+esc(c.imageUrl)+'">':'<p>エネルギー</p>')+'<p>'+esc(c?.name||'')+'</p><div class="solo-choice-grid">'+(item.kind==='energy'?'<button type="button" data-solo-under-remove="energy">エネルギー置き場に戻す</button>':'<button type="button" data-solo-under-remove="hand">手札へ</button><button type="button" data-solo-under-remove="discard">控え室へ</button>')+'</div>';
 const dialog=$('#loveSoloCardDialog');dialog.dataset.underSlot=slot;dialog.dataset.underIndex=index;dialog.showModal();
}
function place(to,index){
 const dialog=$('#loveSoloCardDialog'),from=dialog.dataset.from,fromIndex=Number(dialog.dataset.index);
 if(!state||!Array.isArray(state[from]))return;
 const id=state[from][fromIndex];if(!id)return;
 if(to===from&&index===fromIndex){dialog.close();return}
 if(to==='deckTop'&&from!=='revealed')return;
 snapshot();
 if(from==='stageSlots'){state.stageWait[fromIndex]=false;if(to!=='stageSlots'){for(const item of state.stageUnder[fromIndex]||[]){if(item.kind==='energy')state.energy.push(item.energy);else state.discard.push(item.id)}state.stageUnder[fromIndex]=[]}}
 if(from==='hand'||from==='discard'||from==='successLive'||from==='revealed')state[from].splice(fromIndex,1);else state[from][fromIndex]=null;
 if(to==='deckTop')state.deck.push(id);
 else if(to==='hand'||to==='discard'||to==='successLive')state[to].push(id);
 else if(Array.isArray(state[to])&&index>=0&&index<3){
  const displaced=state[to][index];state[to][index]=id;
  if(displaced){state.discard.push(displaced);if(to==='stageSlots'){for(const item of state.stageUnder[index]||[]){if(item.kind==='energy')state.energy.push(item.energy);else state.discard.push(item.id)}state.stageUnder[index]=[]}}
  if(to==='stageSlots')state.stageWait[index]=false
 }else return;
 state.log.unshift('T'+state.turn+' '+(card(id)?.name||id)+' → '+to+(Number.isInteger(index)?index+1:''));
 dialog.close();write(state);render();
}
let discardSelection=[];
function returnDiscard(mode,onlyMembers=false,indices=null){
 if(!state)return false;
 const chosen=indices===null?state.discard.flatMap((id,i)=>!onlyMembers||card(id)?.cardType==='メンバー'?[i]:[]):[...new Set(indices)].sort((a,b)=>a-b);
 if(!chosen.length){alert('戻すカードを選択してください');return false}
 if(chosen.some(i=>!Number.isInteger(i)||i<0||i>=state.discard.length))return false;
 const moved=chosen.map(i=>state.discard[i]);
 if(onlyMembers&&moved.some(id=>card(id)?.cardType!=='メンバー'))return false;
 snapshot();
 const selectedSet=new Set(chosen);
 state.discard=state.discard.filter((_,i)=>!selectedSet.has(i));
 if(mode==='shuffle')state.deck=random([...state.deck,...moved]);
 else if(mode==='bottom')state.deck=[...(onlyMembers?random(moved):moved),...state.deck];
 else if(mode==='top')state.deck.push(...moved);
 else return false;
 state.log.unshift('T'+state.turn+'：控え室から'+moved.length+'枚を山札'+(mode==='shuffle'?'に戻してシャッフル':mode==='bottom'?'の下へ':'の上へ')+(onlyMembers?'（13ミア：メンバーのみ）':''));
 write(state);render();return true;
}
function showDiscardReturn(){
 discardSelection=[];
 const dialog=$('#loveSoloCardDialog'),body=$('#loveSoloCardDetail');
 body.innerHTML='<h3>控え室から山札へ</h3><p>控え室 '+state.discard.length+'枚</p><label style="display:block;margin:8px 0">戻す枚数 <select id="soloReturnCount" style="width:100%;min-height:42px"><option value="all">すべて戻す（'+state.discard.length+'枚）</option>'+state.discard.map((_,i)=>'<option value="'+(i+1)+'">'+(i+1)+'枚を選ぶ</option>').join('')+'</select></label><div id="soloReturnPicker" style="display:none"></div><p style="margin:10px 0 4px">戻し方</p><div class="solo-choice-grid"><button type="button" class="ghost-btn" data-solo-discard-return="shuffle">戻してシャッフル</button><button type="button" class="ghost-btn" data-solo-discard-return="bottom">山札の下に置く</button><button type="button" class="ghost-btn" data-solo-discard-return="top">山札の上に置く</button></div><p class="hint">枚数指定時は控え室からカードを選んでください。上・下へ置く際は選択したカードの控え室内の並び順を維持します。</p>';
 body.querySelector('#soloReturnCount').addEventListener('change',updateDiscardPicker);
 updateDiscardPicker();dialog.showModal();
}
function updateDiscardPicker(){
 const body=$('#loveSoloCardDetail'),value=body.querySelector('#soloReturnCount')?.value,picker=body.querySelector('#soloReturnPicker');
 if(!picker)return;
 if(value==='all'){discardSelection=[];picker.style.display='none';return}
 const limit=Number(value);discardSelection=discardSelection.slice(0,limit);
 picker.style.display='block';
 picker.innerHTML='<p style="margin:8px 0">カードを選択 <strong>'+discardSelection.length+' / '+limit+'枚</strong></p><div class="solo-discard-list">'+state.discard.map((id,i)=>{const c=card(id),chosen=discardSelection.includes(i);return '<button type="button" data-solo-return-pick="'+i+'" aria-pressed="'+chosen+'" style="border:2px solid '+(chosen?'#d43c81':'#ddd')+';background:'+(chosen?'#fff0f6':'#fff')+'">'+(c?.imageUrl?'<img src="'+esc(c.imageUrl)+'" alt="">':'')+'<span>'+(chosen?'✓ ':'')+esc(c?.name||id)+'<small>'+esc(c?.cardNo||'')+'</small></span></button>'}).join('')+'</div>';
}
function showSpecial(){
 const dialog=$('#loveSoloCardDialog'),body=$('#loveSoloCardDetail');
 const count=state.discard.filter(id=>card(id)?.cardType==='メンバー').length;
 body.innerHTML='<h3>特殊処理</h3><div class="solo-choice-grid"><button type="button" class="ghost-btn" data-solo-special="mia13">13ミア：控え室のメンバーをシャッフルして山札の下へ（'+count+'枚）</button></div><p class="hint">ライブカードなど、メンバー以外は控え室に残ります。</p>';
 dialog.showModal();
}
function showDiscard(){
 const dialog=$('#loveSoloCardDialog'),body=$('#loveSoloCardDetail');
 body.innerHTML='<h3>控え室（'+state.discard.length+'枚）</h3><div class="solo-discard-list">'+state.discard.map((id,i)=>{const c=card(id);return '<button type="button" data-solo-discard-pick="'+i+'">'+(c?.imageUrl?'<img src="'+esc(c.imageUrl)+'" alt="">':'')+'<span>'+esc(c?.name||id)+'<small>'+esc(c?.cardNo||'')+'</small></span></button>'}).join('')+'</div>';
 dialog.showModal();
}
function init(){
 const nav=$('#loveScreen > .love-subnav'),browser=$('#loveCardBrowserPane');
 if(!nav||!browser){setTimeout(init,350);return}
 const tab=document.createElement('button');tab.className='love-tab';tab.dataset.lovePane='solo';tab.type='button';tab.textContent='1人回し';nav.append(tab);
 const pane=document.createElement('div');pane.id='loveSoloPane';pane.className='love-pane hidden';
 pane.innerHTML='<section class="panel"><div class="section-title-row"><h2>1人回し</h2><span class="badge ok">端末内保存</span></div><p class="hint">カード効果は手動処理です。手札のカードをタップして配置先を選びます。初期エネルギー4枚、次のターンごとに1枚追加（最大12枚）。タップで横向き（使用済み）にし、次のターンで戻します。</p><div style="display:flex;gap:8px"><select id="loveSoloDeckChoice" style="flex:1"></select><button type="button" id="loveSoloStart" class="primary-btn">開始／やり直し</button></div><div id="loveSoloBoard"></div></section><dialog id="loveSoloCardDialog" style="max-width:min(95vw,460px);max-height:85vh;overflow:auto;border-radius:12px;border:1px solid #aaa"><div id="loveSoloCardDetail"></div><button type="button" id="loveSoloClose" class="primary-btn">閉じる</button></dialog>';
 browser.after(pane);
 tab.onclick=()=>{nav.querySelectorAll('.love-tab').forEach(b=>b.classList.toggle('active',b===tab));['#loveCalcPane','#loveCardBrowserPane','#loveWishlistPane','#loveDeckBuilderPane'].forEach(s=>$(s)?.classList.add('hidden'));pane.classList.remove('hidden');$('#appTitle').textContent='ラブカ 1人回し';$('#resetAllBtn').style.display='none';render()};
 nav.querySelectorAll('.love-tab:not([data-love-pane="solo"])').forEach(b=>b.addEventListener('click',()=>pane.classList.add('hidden')));
 $('#navLove')?.addEventListener('click',()=>{if(tab.classList.contains('active')){$('#appTitle').textContent='ラブカ 1人回し';$('#resetAllBtn').style.display='none'}});
 $('#loveSoloStart').onclick=()=>{const deck=read(DECKS,[]).find(d=>d.id===$('#loveSoloDeckChoice').value);if(!deck){alert('先にデッキを作成してください');return}if(state&&!confirm('現在の1人回しを初期化しますか？'))return;reset(deck)};
 pane.addEventListener('change',e=>{const sel=e.target.closest('[data-solo-from]');if(sel&&sel.value)move(sel.dataset.soloFrom,Number(sel.dataset.soloIndex),sel.value)});
 const handleSoloClick=e=>{
  const command=e.target.closest('[data-solo-command]')?.dataset.soloCommand;
  if(command&&state){if(command==='undo'){undo();return}if(command==='discard-return'){showDiscardReturn();return}if(command==='special'){showSpecial();return}if(command==='reveal'){const raw=prompt('山札の上から何枚めくりますか？（山札 '+state.deck.length+'枚／控え室 '+state.discard.length+'枚）','3');if(raw===null)return;const n=Number(raw);if(!Number.isSafeInteger(n)||n<1||n>500){alert('1〜500の整数を指定してください');return}if(!state.deck.length&&!state.discard.length){alert('山札と控え室にカードがありません');return}snapshot();let revealedCount=0;for(let i=0;i<n;i++){if(!state.deck.length&&!refreshDeck())break;state.revealed.push(state.deck.pop());revealedCount++;if(!state.deck.length)refreshDeck()}state.log.unshift('山札から'+revealedCount+'枚めくる'+(revealedCount<n?'（指定'+n+'枚・残りなし）':''));write(state);render();if(revealedCount<n)alert('カードが足りないため、'+revealedCount+'枚だけ公開しました');return}snapshot();if(command==='draw')draw();if(command==='energy'&&state.energy.length<12)state.energy.push({token:state.energy.length+1,used:false});if(command==='next'){const finished=state.liveSlots.filter(Boolean);state.discard.push(...finished);state.liveSlots=[null,null,null];state.turn++;state.stageWait=[false,false,false];state.energy.forEach(e=>e.used=false);if(state.energy.length<12)state.energy.push({token:state.energy.length+1,used:false});draw();if(finished.length)state.log.unshift('ターン終了：ライブ'+finished.length+'枚を控え室へ')}if(command==='shuffle')state.deck=random(state.deck);state.log.unshift('T'+state.turn+'：'+command);write(state);render();return}
  const returnPick=e.target.closest('[data-solo-return-pick]');
  if(returnPick&&state){const i=Number(returnPick.dataset.soloReturnPick),limit=Number($('#soloReturnCount')?.value);if(!Number.isInteger(i)||!Number.isInteger(limit))return;const pos=discardSelection.indexOf(i);if(pos>=0)discardSelection.splice(pos,1);else if(discardSelection.length<limit)discardSelection.push(i);updateDiscardPicker();return}
  const discardReturn=e.target.closest('[data-solo-discard-return]');
  if(discardReturn&&state){const count=$('#soloReturnCount')?.value;const indices=count==='all'?null:[...discardSelection];if(count!=='all'&&indices.length!==Number(count)){alert('戻すカードを'+count+'枚選択してください');return}if(returnDiscard(discardReturn.dataset.soloDiscardReturn,false,indices))$('#loveSoloCardDialog').close();return}
  const special=e.target.closest('[data-solo-special]');
  if(special&&state){$('#loveSoloCardDialog').close();if(special.dataset.soloSpecial==='mia13')returnDiscard('bottom',true);return}
  const underTarget=e.target.closest('[data-solo-under-target]');
  if(underTarget&&state){const dialog=$('#loveSoloCardDialog');if(attachUnder(dialog.dataset.from,Number(dialog.dataset.index),Number(underTarget.dataset.soloUnderTarget)))dialog.close();return}
  const underRemove=e.target.closest('[data-solo-under-remove]');
  if(underRemove&&state){const dialog=$('#loveSoloCardDialog');detachUnder(Number(dialog.dataset.underSlot),Number(dialog.dataset.underIndex),underRemove.dataset.soloUnderRemove);return}
  const underCard=e.target.closest('[data-solo-under-slot]');
  if(underCard&&state){showUnder(Number(underCard.dataset.soloUnderSlot),Number(underCard.dataset.soloUnderIndex));return}
  const energy=e.target.closest('[data-solo-energy]');if(energy&&state){if(state.stageSlots.some(Boolean)){const slot=prompt('エネルギーをステージメンバーの下に置く場合は番号（1〜3）を入力。使用済み切替は空欄でOK','');if(slot===null)return;if(slot.trim()){const i=Number(slot)-1;if(!attachUnder('energy',Number(energy.dataset.soloEnergy),i))alert('指定したステージにメンバーがいません');return}}const item=state.energy[Number(energy.dataset.soloEnergy)];if(item){snapshot();item.used=!item.used;write(state);render()}return}
  const zone=e.target.closest('[data-solo-zone]');if(zone&&state){if(zone.dataset.soloZone==='discard')showDiscard();return}
  const selected=e.target.closest('[data-solo-pick]');if(selected){pick(selected.dataset.soloPick,Number(selected.dataset.soloIndex));return}
  const wait=e.target.closest('[data-solo-wait]');if(wait&&state){const i=Number(wait.dataset.soloWait);if(state.stageSlots[i]){snapshot();state.stageWait[i]=!state.stageWait[i];$('#loveSoloCardDialog').close();write(state);render()}return}
  const discardPick=e.target.closest('[data-solo-discard-pick]');if(discardPick){$('#loveSoloCardDialog').close();pick('discard',Number(discardPick.dataset.soloDiscardPick));return}
  const target=e.target.closest('[data-solo-target]');if(target){place(target.dataset.soloTarget,Number(target.dataset.soloTargetIndex));return}
  const detail=e.target.closest('[data-solo-detail]');if(!detail)return;
  const c=card(detail.dataset.soloDetail);if(!c)return;
  $('#loveSoloCardDetail').innerHTML='<h3>'+esc(c.name)+'</h3><p>'+esc(c.cardNo)+'</p>'+(c.imageUrl?'<img src="'+esc(c.imageUrl)+'" style="max-width:100%;max-height:50vh;object-fit:contain">':'')+'<p style="white-space:pre-wrap">'+esc(c.text)+'</p>';
  $('#loveSoloCardDialog').showModal();
 };
 pane.addEventListener('click',handleSoloClick);
 // Dialog is nested inside pane: its clicks bubble to the pane handler exactly once.
 $('#loveSoloClose').onclick=()=>$('#loveSoloCardDialog').close();
 const saved=read(SESSION,null);if(saved&&['deck','hand','stage','live','energy','energyUsed','discard'].every(k=>Array.isArray(saved[k])))state=saved;
 fetch('./loveca-cards.json').then(r=>r.json()).then(d=>{cards=Array.isArray(d.cards)?d.cards:[];render()}).catch(console.warn);
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();