/* LoveCa online manual board: private deck and hand remain local. */
(()=>{'use strict';
const DECKS='lovepoke_loveca_card_decks_v1';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));
let api=null,uid='',roomId='',unsub=null,boardUnsub=null,creating=false,ownDeck='',myReady=false,board=null,catalog=[],players={},battleActive=false,boardWriteState='未送信',opponentReadState='未購読';
const card=id=>catalog.find(c=>String(c.id)===String(id));
const boardStorage=()=>`loveca_online_board_${roomId}_${uid}`;
const shuffle=a=>{for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const ROOM_KEY='loveca_online_last_room_v1';
const status=(s,error=false)=>{const el=$('#lovecaOnlineStatus');if(el){el.textContent=s;el.style.color=error?'#c03550':''}};
const decks=()=>{try{return JSON.parse(localStorage.getItem(DECKS)||'[]')}catch{return []}};
function paintDecks(){const sel=$('#lovecaOnlineDeck'),prev=sel.value;sel.innerHTML=decks().map(d=>'<option value="'+esc(d.id)+'">'+esc(d.name)+'</option>').join('')||'<option value="">デッキがありません</option>';sel.value=ownDeck||prev||sel.options[0]?.value||'';ownDeck=sel.value}
function cardTile(id){const c=card(id);return id?'<span class="online-card">'+(c?.imageUrl?'<img src="'+esc(c.imageUrl)+'" alt="'+esc(c.name)+'">':esc(c?.name||id))+'</span>':'<span class="online-empty">空き</span>'}
function slots(arr,kind,editable){return (arr||[null,null,null]).map((id,i)=>'<div class="online-slot '+(kind==='live'?'online-slot-live':'online-slot-stage')+'">'+(editable?'<button type="button" data-online-slot="'+kind+'" data-online-index="'+i+'">'+cardTile(id)+'</button>':cardTile(id))+'</div>').join('')}
function diagnostics(){const el=$('#lovecaOnlineDiagnostics');if(el)el.textContent='自分の盤面：'+boardWriteState+' ／ 相手の盤面：'+opponentReadState}
function showBoard(){
 const panel=$('#lovecaOnlineBattle');if(!panel||!board)return;
 panel.hidden=false;
 $('#lovecaOnlineOwnStage').innerHTML=slots(board.stage,'stage',true);
 $('#lovecaOnlineOwnLive').innerHTML=slots(board.live,'live',true);
 $('#lovecaOnlineOwnHand').innerHTML=board.hand.map((id,i)=>'<button type="button" data-online-hand="'+i+'">'+cardTile(id)+'</button>').join('');
 $('#lovecaOnlineOwnInfo').textContent='山札 '+board.deck.length+'枚 ／ 控え室 '+board.discard.length+'枚 ／ エネルギー '+board.energy+'/12';
 diagnostics();
}
function showOpponent(d){
 const el=$('#lovecaOnlineOpponent');if(!el)return;
 if(!d){el.textContent='相手の公開盤面を待っています';return}
 el.innerHTML='<h3>相手の盤面（閲覧専用）</h3><p>手札 '+Number(d.handCount||0)+'枚 ／ 山札 '+Number(d.deckCount||0)+'枚 ／ エネルギー '+Number(d.energy||0)+'/12</p><p>ライブ</p><div class="online-slots">'+slots(d.live,'',false)+'</div><p>ステージ</p><div class="online-slots">'+slots(d.stage,'',false)+'</div><p>控え室 '+(d.discard||[]).map(id=>esc(card(id)?.name||id)).join('、')+'</p>';
}
async function publishBoard(){
 if(!board||!roomId)return;
 localStorage.setItem(boardStorage(),JSON.stringify(board));showBoard();
 const visible={stage:board.stage,live:board.live,discard:board.discard.slice(-100),energy:board.energy,handCount:board.hand.length,deckCount:board.deck.length,stageUnder:[[],[],[]]};
 try{boardWriteState='送信中';diagnostics();await api.setDoc(api.doc(api.db,'lovecaOnlineRooms',roomId,'boards',uid),visible);boardWriteState='送信成功';diagnostics()}
 catch(e){boardWriteState='送信失敗（'+e.code+'）';diagnostics();status('盤面同期エラー：'+e.message+'（Firestoreの盤面ルールを確認してください）',true)}
}
function startBattle(){
 if(battleActive||!roomId||!api)return;
 const deck=decks().find(d=>d.id===ownDeck);
 if(!deck){status('使用するデッキがありません',true);return}
 battleActive=true;
 try{board=JSON.parse(localStorage.getItem(boardStorage())||'null')}catch{board=null}
 if(!board||!Array.isArray(board.deck)||!Array.isArray(board.hand)){
  const pile=[];for(const [id,count] of Object.entries(deck.cards||{}))for(let i=0;i<Math.min(100,Math.max(0,Number(count)||0));i++)pile.push(id);
  board={deck:shuffle(pile),hand:[],stage:[null,null,null],live:[null,null,null],discard:[],energy:4};
  for(let i=0;i<5&&board.deck.length;i++)board.hand.push(board.deck.pop());
 }
 publishBoard();
 const opponent=Object.keys(players).find(id=>id!==uid);
 if(opponent){
  if(boardUnsub)boardUnsub();
  opponentReadState='受信待ち';diagnostics();
  boardUnsub=api.onSnapshot(api.doc(api.db,'lovecaOnlineRooms',roomId,'boards',opponent),snap=>{opponentReadState=snap.exists()?'受信成功':'相手の送信待ち';diagnostics();showOpponent(snap.exists()?snap.data():null)},e=>{opponentReadState='受信失敗（'+e.code+'）';diagnostics();status('相手の盤面を読めません：'+e.message,true)});
 }
}
function boardAction(e){
 if(!battleActive||!board)return;
 const draw=e.target.closest('[data-online-draw]'),energy=e.target.closest('[data-online-energy]'),hand=e.target.closest('[data-online-hand]'),slot=e.target.closest('[data-online-slot]');
 if(draw){if(!board.deck.length){status('山札がありません',true);return}board.hand.push(board.deck.pop())}
 else if(energy){board.energy=Math.min(12,board.energy+1)}
 else if(hand){
  const index=Number(hand.dataset.onlineHand),id=board.hand[index];if(!id)return;
  const kind=card(id)?.cardType==='ライブ'||card(id)?.isLive?'live':'stage';
  const answer=prompt((kind==='live'?'ライブ':'ステージ')+'の配置先（1〜3）','1');if(answer===null)return;
  const i=Number(answer)-1;if(!Number.isInteger(i)||i<0||i>2){status('1〜3を入力してください',true);return}
  if(board[kind][i])board.discard.push(board[kind][i]);
  board[kind][i]=id;board.hand.splice(index,1);
 }else if(slot){
  const kind=slot.dataset.onlineSlot,index=Number(slot.dataset.onlineIndex),id=board[kind]?.[index];if(!id)return;
  const answer=prompt('移動先：1=手札、2=控え室','2');
  if(answer==='1')board.hand.push(id);else if(answer==='2')board.discard.push(id);else return;
  board[kind][index]=null;
 }else return;
 publishBoard();
}

function renderRoom(data){
 players=data?.players||{};
 const panel=$('#lovecaOnlineRoom');if(!panel)return;
 panel.hidden=!data;
 if(!data){battleActive=false;board=null;const b=$('#lovecaOnlineBattle');if(b)b.hidden=true;return;}
 const player=data.players?.[uid],others=Object.entries(data.players||{}).filter(([id])=>id!==uid);
 myReady=!!player?.ready;
 $('#lovecaOnlineCode').textContent=data.code||'';
 $('#lovecaOnlineCreate').disabled=true;$('#lovecaOnlineJoin').disabled=true;
 $('#lovecaOnlinePlayers').textContent='あなた：'+(player?.ready?'準備完了':'準備中')+' ／ 相手：'+(others.length?(others[0][1].ready?'準備完了':'準備中'):'参加待ち');
 $('#lovecaOnlineReady').textContent=myReady?'準備を取り消す':'準備完了';
 $('#lovecaOnlineReady').disabled=!player;
 $('#lovecaOnlineDeck').disabled=myReady;
 const both=others.length===1&&myReady&&others[0][1].ready;
 $('#lovecaOnlineMatch').textContent=both?'双方準備完了・対戦盤面を表示中':'相手の参加・準備完了を待っています';
 if(both)startBattle();
 else if(battleActive){battleActive=false;if(boardUnsub){boardUnsub();boardUnsub=null}$('#lovecaOnlineBattle').hidden=true;}
}
function listen(id){
 if(unsub){unsub();unsub=null}if(boardUnsub){boardUnsub();boardUnsub=null}battleActive=false;roomId=id;sessionStorage.setItem(ROOM_KEY,id);
 unsub=api.onSnapshot(api.doc(api.db,'lovecaOnlineRooms',id),snap=>{
  if(!snap.exists()){status('ルームが終了しました');roomId='';sessionStorage.removeItem(ROOM_KEY);renderRoom(null);$('#lovecaOnlineCreate').disabled=false;$('#lovecaOnlineJoin').disabled=false;return}
  const data=snap.data();
  if(!data.players?.[uid]){status('ルームの参加権限がありません',true);roomId='';sessionStorage.removeItem(ROOM_KEY);renderRoom(null);$('#lovecaOnlineCreate').disabled=false;$('#lovecaOnlineJoin').disabled=false;return}
  renderRoom(data);if(!$('#lovecaOnlineStatus')?.textContent?.includes('エラー'))status('ルームに接続中');
 },e=>{status('同期エラー：'+e.message+'。FirebaseのFirestoreルールと匿名認証を確認してください',true)});
}
async function connect(){
 if(api)return true;
 const cfg=window.LOVEPOKE_FIREBASE_CONFIG;
 if(!cfg?.apiKey||!cfg?.projectId){status('Firebaseの設定がありません',true);return false}
 status('接続しています…');
 try{
  const [app,auth,fs]=await Promise.all([
   import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js'),
   import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js'),
   import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js')
  ]);
  const instance=app.getApps().length?app.getApp():app.initializeApp(cfg);
  const a=auth.getAuth(instance),credential=await auth.signInAnonymously(a);
  uid=credential.user.uid;
  api={db:fs.getFirestore(instance),doc:fs.doc,getDoc:fs.getDoc,setDoc:fs.setDoc,updateDoc:fs.updateDoc,runTransaction:fs.runTransaction,onSnapshot:fs.onSnapshot,serverTimestamp:fs.serverTimestamp};
  status('接続できました。ルームを作成または参加してください');return true;
 }catch(e){status('接続できません：'+e.message+'（匿名認証の有効化が必要です）',true);return false}
}
const CODE_CHARS='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const code=()=>Array.from(crypto.getRandomValues(new Uint32Array(6)),v=>CODE_CHARS[v%CODE_CHARS.length]).join('');
async function create(){
 if(creating||roomId)return;creating=true;
 try{
  if(!ownDeck){status('デッキを選択してください',true);return}
  if(!await connect())return;
  let id='',c='';
  for(let n=0;n<5;n++){c=code();id=c;const ref=api.doc(api.db,'lovecaOnlineRooms',id);if(!(await api.getDoc(ref)).exists())break;id=''}
  if(!id)throw Error('ルーム番号を確保できません');
  await api.setDoc(api.doc(api.db,'lovecaOnlineRooms',id),{code:c,host:uid,phase:'lobby',createdAt:api.serverTimestamp(),players:{[uid]:{ready:false,joinedAt:Date.now()}}});
  listen(id);
 }catch(e){status('作成失敗：'+e.message+'（Firestoreルールを確認してください）',true)}
 finally{creating=false}
}
async function join(){
 if(roomId)return;
 const id=$('#lovecaOnlineJoinCode').value.toUpperCase().replace(/[^A-Z2-9]/g,'');
 if(!/^[A-HJ-NP-Z2-9]{6}$/.test(id)){status('6文字のルームコードを入力してください',true);return}
 if(!ownDeck){status('デッキを選択してください',true);return}
 if(!await connect())return;
 try{
  const ref=api.doc(api.db,'lovecaOnlineRooms',id);
  await api.runTransaction(api.db,async tx=>{
   const snap=await tx.get(ref);if(!snap.exists())throw Error('ルームが見つかりません');
   const d=snap.data(),players=d.players||{};
   if(d.phase!=='lobby')throw Error('受付を終了したルームです');
   if(!players[uid]&&Object.keys(players).length>=2)throw Error('満員です');
   tx.update(ref,{['players.'+uid]:players[uid]||{ready:false,joinedAt:Date.now()}});
  });
  listen(id);
 }catch(e){status('参加失敗：'+e.message,true)}
}
async function leave(){
 if(!roomId||!api)return;
 const id=roomId;
 try{
  await api.runTransaction(api.db,async tx=>{
   const ref=api.doc(api.db,'lovecaOnlineRooms',id),snap=await tx.get(ref);
   if(!snap.exists())return;
   const data=snap.data(),players={...(data.players||{})};
   delete players[uid];
   tx.update(ref,{players});
  });
  if(unsub){unsub();unsub=null}if(boardUnsub){boardUnsub();boardUnsub=null}
  roomId='';myReady=false;sessionStorage.removeItem(ROOM_KEY);
  renderRoom(null);$('#lovecaOnlineCreate').disabled=false;$('#lovecaOnlineJoin').disabled=false;
  status('ルームから退出しました');
 }catch(e){status('退出失敗：'+e.message,true)}
}
async function resume(){
 const id=sessionStorage.getItem(ROOM_KEY);
 if(!id||roomId)return;
 if(!await connect())return;
 try{const snap=await api.getDoc(api.doc(api.db,'lovecaOnlineRooms',id));if(snap.exists()&&snap.data().players?.[uid])listen(id);else sessionStorage.removeItem(ROOM_KEY)}
 catch(e){status('ルーム復帰失敗：'+e.message,true)}
}
async function ready(){
 if(!roomId||!api)return;
 if(!ownDeck){status('デッキを選択してください',true);return}
 try{await api.updateDoc(api.doc(api.db,'lovecaOnlineRooms',roomId),{['players.'+uid+'.ready']:!myReady})}catch(e){status('準備状態を変更できません：'+e.message,true)}
}
function init(){
 const nav=$('#loveScreen > .love-subnav'),solo=nav?.querySelector('[data-love-pane="solo"]');
 if(!nav||!solo){setTimeout(init,400);return}
 if($('#lovecaOnlinePane'))return;
 const tab=document.createElement('button');tab.type='button';tab.className='love-tab';tab.dataset.lovePane='online';tab.textContent='オンライン';nav.append(tab);
 const pane=document.createElement('div');pane.id='lovecaOnlinePane';pane.className='love-pane hidden';
 pane.innerHTML='<section class="panel"><h2>オンライン対戦・ルーム</h2><p class="hint">第2段階・試験版：双方準備完了で盤面を表示します。カード効果は手動処理です。手札・山札の中身は送信しません。</p><label class="block-label">使用するデッキ<select id="lovecaOnlineDeck"></select></label><div class="solo-choice-grid" style="margin:12px 0"><button type="button" id="lovecaOnlineCreate" class="primary-btn">ルームを作成</button></div><label class="block-label">ルームコード<input id="lovecaOnlineJoinCode" maxlength="6" placeholder="6文字"></label><button type="button" id="lovecaOnlineJoin" class="ghost-btn">ルームに参加</button><p id="lovecaOnlineStatus" role="status" style="margin-top:12px"></p><div id="lovecaOnlineRoom" hidden><h3>ルーム番号：<strong id="lovecaOnlineCode"></strong></h3><button type="button" id="lovecaOnlineCopy" class="ghost-btn">コードをコピー</button><p id="lovecaOnlinePlayers"></p><button type="button" id="lovecaOnlineReady" class="primary-btn">準備完了</button><p id="lovecaOnlineMatch"></p><div id="lovecaOnlineBattle" hidden><h3>オンライン対戦盤面（試験版）</h3><p id="lovecaOnlineDiagnostics" class="online-diagnostics"></p><div id="lovecaOnlineOpponent"></div><h3>自分の盤面</h3><div class="online-own-mat"><div class="online-section-title">ライブカード</div><div class="online-slots" id="lovecaOnlineOwnLive"></div><div class="online-section-title">ステージ</div><div class="online-slots" id="lovecaOnlineOwnStage"></div><div class="online-pile-row"><span id="lovecaOnlineOwnInfo"></span></div><div class="online-toolbar"><button type="button" data-online-draw>1枚ドロー</button><button type="button" data-online-energy>＋エネルギー</button></div><div class="online-section-title">手札（タップして配置）</div><div class="online-hand" id="lovecaOnlineOwnHand"></div></div><p class="hint">試験版：自分のカードだけ操作できます。カード効果・メンバー下のカード移動などは未対応です。</p></div><button type="button" id="lovecaOnlineLeave" class="ghost-btn">ルームから退出</button></div></section>';
 $('#loveSoloPane').after(pane);
 const show=()=>{nav.querySelectorAll('.love-tab').forEach(b=>b.classList.toggle('active',b===tab));document.querySelectorAll('#loveScreen .love-pane').forEach(p=>p.classList.add('hidden'));pane.classList.remove('hidden');$('#appTitle').textContent='ラブカ オンライン';const reset=$('#resetAllBtn');if(reset)reset.style.display='none';paintDecks()};
 tab.addEventListener('click',show);
 nav.querySelectorAll('.love-tab:not([data-love-pane="online"])').forEach(b=>b.addEventListener('click',()=>pane.classList.add('hidden')));
 $('#lovecaOnlineDeck').addEventListener('change',e=>{ownDeck=e.target.value});
 $('#lovecaOnlineCreate').addEventListener('click',create);
 $('#lovecaOnlineJoin').addEventListener('click',join);
 $('#lovecaOnlineReady').addEventListener('click',ready);
 pane.addEventListener('click',boardAction);
 fetch('./loveca-cards.json').then(r=>r.json()).then(d=>{catalog=Array.isArray(d.cards)?d.cards:[];if(board)showBoard()}).catch(console.warn);
 $('#lovecaOnlineLeave').addEventListener('click',leave);
 $('#lovecaOnlineCopy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(roomId);status('ルームコードをコピーしました')}catch{status('コピーできませんでした。表示されたコードを共有してください',true)}});
 paintDecks();resume();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();