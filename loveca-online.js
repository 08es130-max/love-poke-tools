/* LoveCa online lobby: phase 1 only. No card/deck contents leave this device. */
(()=>{'use strict';
const DECKS='lovepoke_loveca_card_decks_v1';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));
let api=null,uid='',roomId='',unsub=null,creating=false,ownDeck='',myReady=false;
const ROOM_KEY='loveca_online_last_room_v1';
const status=(s,error=false)=>{const el=$('#lovecaOnlineStatus');if(el){el.textContent=s;el.style.color=error?'#c03550':''}};
const decks=()=>{try{return JSON.parse(localStorage.getItem(DECKS)||'[]')}catch{return []}};
function paintDecks(){const sel=$('#lovecaOnlineDeck'),prev=sel.value;sel.innerHTML=decks().map(d=>'<option value="'+esc(d.id)+'">'+esc(d.name)+'</option>').join('')||'<option value="">デッキがありません</option>';sel.value=ownDeck||prev||sel.options[0]?.value||'';ownDeck=sel.value}
function renderRoom(data){
 const panel=$('#lovecaOnlineRoom');if(!panel)return;
 panel.hidden=!data;
 if(!data)return;
 const player=data.players?.[uid],others=Object.entries(data.players||{}).filter(([id])=>id!==uid);
 myReady=!!player?.ready;
 $('#lovecaOnlineCode').textContent=data.code||'';
 $('#lovecaOnlineCreate').disabled=true;$('#lovecaOnlineJoin').disabled=true;
 $('#lovecaOnlinePlayers').textContent='あなた：'+(player?.ready?'準備完了':'準備中')+' ／ 相手：'+(others.length?(others[0][1].ready?'準備完了':'準備中'):'参加待ち');
 $('#lovecaOnlineReady').textContent=myReady?'準備を取り消す':'準備完了';
 $('#lovecaOnlineReady').disabled=!player;
 const both=others.length===1&&myReady&&others[0][1].ready;
 $('#lovecaOnlineMatch').textContent=both?'双方準備完了（対戦盤面は第2段階で実装）':'相手の参加・準備完了を待っています';
}
function listen(id){
 if(unsub){unsub();unsub=null}roomId=id;sessionStorage.setItem(ROOM_KEY,id);
 unsub=api.onSnapshot(api.doc(api.db,'lovecaOnlineRooms',id),snap=>{
  if(!snap.exists()){status('ルームが終了しました');roomId='';sessionStorage.removeItem(ROOM_KEY);renderRoom(null);$('#lovecaOnlineCreate').disabled=false;$('#lovecaOnlineJoin').disabled=false;return}
  const data=snap.data();
  if(!data.players?.[uid]){status('ルームの参加権限がありません',true);roomId='';sessionStorage.removeItem(ROOM_KEY);renderRoom(null);$('#lovecaOnlineCreate').disabled=false;$('#lovecaOnlineJoin').disabled=false;return}
  renderRoom(data);status('ルームに接続中');
 },e=>status('同期エラー：'+e.message,true));
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
  if(unsub){unsub();unsub=null}
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
 pane.innerHTML='<section class="panel"><h2>オンライン対戦・ルーム</h2><p class="hint">第1段階：2人の接続と準備完了を確認します。対戦盤面・カード同期はまだ利用できません。デッキの中身は送信しません。</p><label class="block-label">使用するデッキ<select id="lovecaOnlineDeck"></select></label><div class="solo-choice-grid" style="margin:12px 0"><button type="button" id="lovecaOnlineCreate" class="primary-btn">ルームを作成</button></div><label class="block-label">ルームコード<input id="lovecaOnlineJoinCode" maxlength="6" placeholder="6文字"></label><button type="button" id="lovecaOnlineJoin" class="ghost-btn">ルームに参加</button><p id="lovecaOnlineStatus" role="status" style="margin-top:12px"></p><div id="lovecaOnlineRoom" hidden><h3>ルーム番号：<strong id="lovecaOnlineCode"></strong></h3><button type="button" id="lovecaOnlineCopy" class="ghost-btn">コードをコピー</button><p id="lovecaOnlinePlayers"></p><button type="button" id="lovecaOnlineReady" class="primary-btn">準備完了</button><p id="lovecaOnlineMatch"></p><button type="button" id="lovecaOnlineLeave" class="ghost-btn">ルームから退出</button></div></section>';
 $('#loveSoloPane').after(pane);
 const show=()=>{nav.querySelectorAll('.love-tab').forEach(b=>b.classList.toggle('active',b===tab));document.querySelectorAll('#loveScreen .love-pane').forEach(p=>p.classList.add('hidden'));pane.classList.remove('hidden');$('#appTitle').textContent='ラブカ オンライン';const reset=$('#resetAllBtn');if(reset)reset.style.display='none';paintDecks()};
 tab.addEventListener('click',show);
 nav.querySelectorAll('.love-tab:not([data-love-pane="online"])').forEach(b=>b.addEventListener('click',()=>pane.classList.add('hidden')));
 $('#lovecaOnlineDeck').addEventListener('change',e=>{ownDeck=e.target.value;if(myReady&&roomId)ready()});
 $('#lovecaOnlineCreate').addEventListener('click',create);
 $('#lovecaOnlineJoin').addEventListener('click',join);
 $('#lovecaOnlineReady').addEventListener('click',ready);
 $('#lovecaOnlineLeave').addEventListener('click',leave);
 $('#lovecaOnlineCopy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(roomId);status('ルームコードをコピーしました')}catch{status('コピーできませんでした。表示されたコードを共有してください',true)}});
 paintDecks();resume();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();