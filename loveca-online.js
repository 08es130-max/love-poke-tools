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
const underCount=()=>board.stageUnder.reduce((n,a)=>n+a.filter(x=>x.kind==='energy').length,0);
const energyTotal=()=>board.energy+underCount();
function normalizeBoard(){if(!Array.isArray(board.stageUnder)||board.stageUnder.length!==3)board.stageUnder=[[],[],[]];board.stageUnder=board.stageUnder.map(a=>Array.isArray(a)?a:[]);if(!Array.isArray(board.energyUsed))board.energyUsed=[];if(!Array.isArray(board.revealed))board.revealed=[];if(!Array.isArray(board.successLive))board.successLive=[];if(!Array.isArray(board.stageWait))board.stageWait=[false,false,false];}
function cardTile(id){const c=card(id);return id?'<span class="online-card">'+(c?.imageUrl?'<img src="'+esc(c.imageUrl)+'" alt="'+esc(c.name)+'">':esc(c?.name||id))+'</span>':'<span class="online-empty">空き</span>'}
function slots(arr,kind,editable,under=[]){return (arr||[null,null,null]).map((id,i)=>'<div class="online-slot-wrap"><div class="online-slot '+(kind==='live'?'online-slot-live':'online-slot-stage')+' '+(kind==='stage'&&board?.stageWait?.[i]&&editable?'online-wait':'')+'">'+(editable?'<button type="button" data-online-slot="'+kind+'" data-online-index="'+i+'">'+cardTile(id)+'</button>':cardTile(id))+'</div>'+(kind==='stage'?'<div class="online-under">'+(under[i]||[]).map((item,j)=>'<button type="button" '+(editable?'data-online-under-slot="'+i+'" data-online-under-index="'+j+'"':'disabled')+'>'+(item.kind==='energy'?'⚡':cardTile(item.id))+'</button>').join('')+'</div>':'')+'</div>').join('')}
function diagnostics(){const el=$('#lovecaOnlineDiagnostics');if(el)el.textContent='自分の盤面：'+boardWriteState+' ／ 相手の盤面：'+opponentReadState}
function showBoard(){
 const panel=$('#lovecaOnlineBattle');if(!panel||!board)return;
 panel.hidden=false;
 $('#lovecaOnlineOwnStage').innerHTML=slots(board.stage,'stage',true,board.stageUnder);
 $('#lovecaOnlineOwnLive').innerHTML=slots(board.live,'live',true);
 $('#lovecaOnlineOwnHand').innerHTML=board.hand.map((id,i)=>'<button type="button" data-online-hand="'+i+'">'+cardTile(id)+'</button>').join('');
 $('#lovecaOnlineOwnInfo').textContent='山札 '+board.deck.length+'枚 ／ 控え室 '+board.discard.length+'枚 ／ エネルギー置き場 '+board.energy+'枚（全体 '+energyTotal()+'/12）';
 $('#lovecaOnlineOwnDiscard').innerHTML=board.discard.map((id,i)=>'<button type="button" data-online-discard="'+i+'">'+cardTile(id)+'</button>').join('')||'<span class="online-empty">なし</span>';
 $('#lovecaOnlineOwnEnergy').innerHTML=Array.from({length:board.energy},(_,i)=>'<button type="button" data-online-energy-card="'+i+'" class="'+(board.energyUsed.includes(i)?'online-energy-used':'')+'">⚡<small>'+(board.energyUsed.includes(i)?'使用済':'使用可')+'</small></button>').join('');
 $('#lovecaOnlineOwnExtras').innerHTML='公開中 '+board.revealed.length+'枚 ／ 成功ライブ '+board.successLive.length+'枚'+(board.revealed.length?'<div class="online-hand">'+board.revealed.map((id,i)=>'<button type="button" data-online-revealed="'+i+'">'+cardTile(id)+'</button>').join('')+'</div>':'');
 diagnostics();
}
function showOpponent(d){
 const el=$('#lovecaOnlineOpponent');if(!el)return;
 if(!d){el.textContent='相手の公開盤面を待っています';return}
 el.innerHTML='<h3>相手の盤面（閲覧専用）</h3><p>手札 '+Number(d.handCount||0)+'枚 ／ 山札 '+Number(d.deckCount||0)+'枚 ／ エネルギー置き場 '+Number(d.energy||0)+'枚</p><p>ライブ</p><div class="online-slots">'+slots(d.live,'live',false)+'</div><p>ステージ</p><div class="online-slots">'+slots(d.stage,'stage',false,(d.stageUnder||[]).map(x=>x.cards||[]))+'</div><details><summary>控え室 '+(d.discard||[]).length+'枚</summary><p>'+(d.discard||[]).map(id=>esc(card(id)?.name||id)).join('、')+'</p></details>';
}
async function publishBoard(){
 if(!board||!roomId)return;
 localStorage.setItem(boardStorage(),JSON.stringify(board));showBoard();
 const visible={stage:board.stage,live:board.live,discard:board.discard.slice(-100),energy:board.energy,handCount:board.hand.length,deckCount:board.deck.length,stageUnder:board.stageUnder.map(items=>({cards:items.map(item=>item.kind==='energy'?{kind:'energy'}:{kind:'card',id:item.id})}))};
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
 normalizeBoard();publishBoard();
 const opponent=Object.keys(players).find(id=>id!==uid);
 if(opponent){
  if(boardUnsub)boardUnsub();
  opponentReadState='受信待ち';diagnostics();
  boardUnsub=api.onSnapshot(api.doc(api.db,'lovecaOnlineRooms',roomId,'boards',opponent),snap=>{opponentReadState=snap.exists()?'受信成功':'相手の送信待ち';diagnostics();showOpponent(snap.exists()?snap.data():null)},e=>{opponentReadState='受信失敗（'+e.code+'）';diagnostics();status('相手の盤面を読めません：'+e.message,true)});
 }
}
function clearUnder(i){
 for(const item of board.stageUnder[i]||[]){if(item.kind==='energy')board.energy++;else board.discard.push(item.id)}
 board.stageUnder[i]=[];
}
function chooseCard(from,index){
 const id=board[from]?.[index];if(!id)return false;
 const isLive=card(id)?.cardType==='ライブ'||card(id)?.isLive;
 const answer=prompt('移動先：1〜3='+(isLive?'ライブ':'ステージ')+'、H=手札、D=控え室、T=山札の上、B=山札の下'+(!isLive&&board.stage.some(Boolean)?'、U1〜U3=メンバーの下':''),'1');
 if(answer===null)return false;
 const v=answer.trim().toUpperCase(),kind=isLive?'live':'stage',i=Number(v)-1;
 if(/^U[123]$/.test(v)&&!isLive&&board.stage[Number(v[1])-1]){
  const n=Number(v[1])-1;board[from].splice(index,1);board.stageUnder[n].push({kind:'card',id});return true;
 }
 if(/^[123]$/.test(v)){
  if(board[kind][i]){if(kind==='stage')clearUnder(i);board.discard.push(board[kind][i])}
  board[kind][i]=id;board[from].splice(index,1);return true;
 }
 const targets={H:'hand',D:'discard',T:'deck',B:'deck'};
 if(!targets[v])return false;
 board[from].splice(index,1);if(v==='B')board.deck.unshift(id);else board[targets[v]].push(id);return true;
}
function boardAction(e){
 if(!battleActive||!board)return;
 const target=e.target,draw=target.closest('[data-online-draw]'),energy=target.closest('[data-online-energy]'),hand=target.closest('[data-online-hand]'),discard=target.closest('[data-online-discard]'),revealed=target.closest('[data-online-revealed]'),slot=target.closest('[data-online-slot]'),under=target.closest('[data-online-under-slot]'),energyCard=target.closest('[data-online-energy-card]'),extra=target.closest('[data-online-command]');
 let changed=false;
 if(draw){if(!board.deck.length){if(board.discard.length){board.deck=shuffle(board.discard.splice(0));status('山札をリフレッシュしました')}else{status('山札がありません',true);return}}board.hand.push(board.deck.pop());changed=true}
 else if(energy){if(energyTotal()>=12){status('エネルギーはメンバーの下を含めて12枚が上限です',true);return}board.energy++;changed=true}
 else if(energyCard){
  const i=Number(energyCard.dataset.onlineEnergyCard),answer=prompt('エネルギー：1=使用済み切替、2=メンバーの下へ','1');
  if(answer==='1'){const pos=board.energyUsed.indexOf(i);if(pos>=0)board.energyUsed.splice(pos,1);else board.energyUsed.push(i);changed=true}
  else if(answer==='2'){const n=Number(prompt('ステージ番号（1〜3）','1'))-1;if(!board.stage[n])return;board.energy--;board.energyUsed=board.energyUsed.filter(x=>x!==i).map(x=>x>i?x-1:x);board.stageUnder[n].push({kind:'energy'});changed=true}
 }
 else if(hand)changed=chooseCard('hand',Number(hand.dataset.onlineHand));
 else if(discard)changed=chooseCard('discard',Number(discard.dataset.onlineDiscard));
 else if(revealed)changed=chooseCard('revealed',Number(revealed.dataset.onlineRevealed));
 else if(under){
  const i=Number(under.dataset.onlineUnderSlot),j=Number(under.dataset.onlineUnderIndex),item=board.stageUnder[i]?.[j];if(!item)return;
  const answer=prompt(item.kind==='energy'?'エネルギー置き場に戻しますか？（Y）':'移動先：H=手札、D=控え室','D');
  if(item.kind==='energy'&&answer?.toUpperCase()==='Y'){board.stageUnder[i].splice(j,1);board.energy++;changed=true}
  else if(item.kind==='card'&&['H','D'].includes(answer?.toUpperCase())){board.stageUnder[i].splice(j,1);board[answer.toUpperCase()==='H'?'hand':'discard'].push(item.id);changed=true}
 }
 else if(slot){
  const kind=slot.dataset.onlineSlot,index=Number(slot.dataset.onlineIndex),id=board[kind]?.[index];if(!id)return;
  const answer=prompt('移動先：H=手札、D=控え室、T=山札の上、B=山札の下'+(kind==='stage'?'、W=ウェイト切替':''),'D')?.toUpperCase();
  if(answer==='W'&&kind==='stage'){board.stageWait[index]=!board.stageWait[index];changed=true}
  else if(['H','D','T','B'].includes(answer)){
   if(kind==='stage')clearUnder(index);
   if(answer==='B')board.deck.unshift(id);else board[{H:'hand',D:'discard',T:'deck'}[answer]].push(id);
   board[kind][index]=null;changed=true;
  }
 }else if(extra){
  const cmd=extra.dataset.onlineCommand;
  if(cmd==='shuffle'){shuffle(board.deck);changed=true}
  if(cmd==='discard-return'){const count=Number(prompt('控え室から山札に戻す枚数（0=すべて）','0'));if(!Number.isInteger(count)||count<0)return;const n=count===0?board.discard.length:Math.min(count,board.discard.length);for(let i=0;i<n;i++)board.deck.push(board.discard.pop());shuffle(board.deck);changed=true}
  if(cmd==='reveal'){const n=Number(prompt('山札から何枚公開しますか？','1'));if(!Number.isInteger(n)||n<1||n>100)return;for(let i=0;i<n&&board.deck.length;i++)board.revealed.push(board.deck.pop());alert(board.revealed.map(id=>card(id)?.name||id).join('、')||'カードなし');changed=true}
  if(cmd==='next'){board.energyUsed=[];changed=true}
 }
 if(changed)publishBoard();
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
 pane.innerHTML='<section class="panel"><h2>オンライン対戦・ルーム</h2><p class="hint">第2段階・試験版：双方準備完了で盤面を表示します。カード効果は手動処理です。手札・山札の中身は送信しません。</p><label class="block-label">使用するデッキ<select id="lovecaOnlineDeck"></select></label><div class="solo-choice-grid" style="margin:12px 0"><button type="button" id="lovecaOnlineCreate" class="primary-btn">ルームを作成</button></div><label class="block-label">ルームコード<input id="lovecaOnlineJoinCode" maxlength="6" placeholder="6文字"></label><button type="button" id="lovecaOnlineJoin" class="ghost-btn">ルームに参加</button><p id="lovecaOnlineStatus" role="status" style="margin-top:12px"></p><div id="lovecaOnlineRoom" hidden><h3>ルーム番号：<strong id="lovecaOnlineCode"></strong></h3><button type="button" id="lovecaOnlineCopy" class="ghost-btn">コードをコピー</button><p id="lovecaOnlinePlayers"></p><button type="button" id="lovecaOnlineReady" class="primary-btn">準備完了</button><p id="lovecaOnlineMatch"></p><div id="lovecaOnlineBattle" hidden><h3>オンライン対戦盤面（試験版）</h3><p id="lovecaOnlineDiagnostics" class="online-diagnostics"></p><div id="lovecaOnlineOpponent"></div><h3>自分の盤面</h3><div class="online-own-mat"><div class="online-section-title">ライブカード</div><div class="online-slots" id="lovecaOnlineOwnLive"></div><div class="online-section-title">ステージ</div><div class="online-slots" id="lovecaOnlineOwnStage"></div><div class="online-pile-row"><span id="lovecaOnlineOwnInfo"></span></div><div class="online-section-title">エネルギー（タップで操作）</div><div id="lovecaOnlineOwnEnergy" class="online-energy-row"></div><details><summary>控え室（タップで移動）</summary><div id="lovecaOnlineOwnDiscard" class="online-hand"></div></details><div class="online-toolbar"><button type="button" data-online-draw>1枚ドロー</button><button type="button" data-online-energy>＋エネルギー</button><button type="button" data-online-command="next">次ターン</button><button type="button" data-online-command="shuffle">山札シャッフル</button><button type="button" data-online-command="discard-return">控え室→山札</button><button type="button" data-online-command="reveal">山札公開</button></div><div class="online-section-title">手札（タップして配置）</div><div class="online-hand" id="lovecaOnlineOwnHand"></div><p id="lovecaOnlineOwnExtras"></p></div><p class="hint">試験版：カード効果は手動処理です。相手のカードは操作できません。</p></div><button type="button" id="lovecaOnlineLeave" class="ghost-btn">ルームから退出</button></div></section>';
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