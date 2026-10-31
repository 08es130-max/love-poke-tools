(()=>{
'use strict';
const KEY='lovepoke_loveca_card_decks_v1';
let cards=[],selected='';
const $=s=>document.querySelector(s);
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const get=()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v:[]}catch{return []}};
const put=v=>{try{localStorage.setItem(KEY,JSON.stringify(v));return true}catch{alert('保存に失敗しました');return false}};
const lookup=id=>cards.find(c=>String(c.id)===String(id));
function render(){
 const chooser=$('#lovecaDeckChooser'),stats=$('#lovecaBuilderStats'),items=$('#lovecaDeckItems');
 if(!chooser)return;
 const decks=get();if(!decks.some(d=>d.id===selected))selected=decks[0]?.id||'';
 const rename=$('#lovecaDeckRename');if(rename)rename.disabled=!selected;
 chooser.innerHTML=decks.length?decks.map(d=>'<option value="'+escape(d.id)+'">'+escape(d.name)+'</option>').join(''):'<option value="">未作成</option>';chooser.value=selected;
 const deck=decks.find(d=>d.id===selected);
 if(!deck){stats.innerHTML='<section style="border:2px solid #e98aaf;border-radius:12px;padding:12px;margin:12px 0"><h3>デッキ集計</h3><p>デッキを作成すると、コスト・ブレードハート・非ブレの枚数がここに表示されます。</p></section>';items.innerHTML='';return}
 const entries=Object.entries(deck.cards||{}).filter(([,n])=>n>0);
 let nonBlade=0,liveNonBlade=0,memberCount=0,liveCount=0,unknown=0;
 const costs={},colors={pink:0,red:0,yellow:0,green:0,blue:0,purple:0,all:0,draw:0,note:0};
 const colorLabels={pink:'桃',red:'赤',yellow:'黄',green:'緑',blue:'青',purple:'紫',all:'ALL',draw:'ドロー',note:'音符'};
 for(const [id,rawCount] of entries){
  const count=Number(rawCount)||0,c=lookup(id);
  if(!c){unknown+=count;continue}
  const isLive=!!c.isLive||c.cardType==='ライブ';
  const isMember=c.cardType==='メンバー'||(!isLive&&c.cardType!=='エネルギー');
  if(isLive)liveCount+=count;
  if(isMember){
   memberCount+=count;
   if(c.cost!==null&&c.cost!==undefined&&String(c.cost).trim()!==''){
    const cost=String(c.cost).trim();costs[cost]=(costs[cost]||0)+count;
   }
   const memberKinds=Array.isArray(c.bladeHeartTypes)?c.bladeHeartTypes:[];
   if(!c.hasBladeHeart&&!memberKinds.some(k=>['pink','red','yellow','green','blue','purple','all','draw'].includes(k)))nonBlade+=count;
  }
  // Live cards can carry a special heart AND colored blade hearts simultaneously.
  // Count each kind independently for both member and live cards.
  const kinds=Array.isArray(c.bladeHeartTypes)?c.bladeHeartTypes:[];
  // The official data stores live-card symbols in bladeHeart (e.g. "紫1", "ALL1"),
  // while member-card colors are stored in bladeHeartTypes.
  if(isLive){
   const labels={桃:'pink',赤:'red',黄:'yellow',緑:'green',青:'blue',紫:'purple',ALL:'all'};
   const raw=String(c.bladeHeart||'');
   const matches=[...raw.matchAll(/(ALL|桃|赤|黄|緑|青|紫)\s*(\d+)/g)];
   for(const match of matches)colors[labels[match[1]]]+=count*Number(match[2]);
   if(!matches.length&&raw.includes('[全ブレード]'))colors.all+=count;
   if(!matches.length&&!raw.includes('[全ブレード]')&&!kinds.some(k=>['pink','red','yellow','green','blue','purple','all','draw'].includes(k))&&c.specialHeart!=='draw')liveNonBlade+=count;
  }else{
   for(const kind of kinds)if(Object.prototype.hasOwnProperty.call(colors,kind))colors[kind]+=count;
  }
  for(const special of ['draw','note'])if(kinds.includes(special)||c.specialHeart===special||(special==='note'&&c.specialHeart==='スコア'))colors[special]+=count;
 }
 const total=entries.reduce((n,[,c])=>n+(Number(c)||0),0);
 const max=Math.max(1,...Object.values(costs));
 const costRows=Object.entries(costs).sort((a,b)=>Number(a[0])-Number(b[0])).map(([cost,n])=>'<div style="display:flex;gap:8px;align-items:center;margin:4px 0"><span style="width:40px">'+escape(cost)+'</span><div style="flex:1;background:#aaa3;border-radius:5px"><div style="width:'+(100*n/max)+'%;height:12px;background:#ee7eaa;border-radius:5px"></div></div><strong>'+n+'枚</strong></div>').join('');
 const colorRows=Object.entries(colors).map(([key,n])=>'<span style="display:inline-flex;justify-content:space-between;gap:6px;padding:5px 8px;border:1px solid #e9c5d3;border-radius:8px;background:#fff;white-space:nowrap">'+colorLabels[key]+' <strong>'+n+'</strong></span>').join('');
 stats.innerHTML='<section id="lovecaDeckSummary" style="border:2px solid #e98aaf;border-radius:14px;padding:12px;margin:12px 0;background:#fff8fb"><h3 style="margin:0 0 10px;color:#aa2d65">デッキ集計 <small style="font-size:12px">'+total+'枚</small></h3><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;text-align:center"><div style="border-radius:10px;background:white;padding:8px 3px"><small>メンバー</small><div style="font-size:22px;font-weight:bold">'+memberCount+'</div></div><div style="border-radius:10px;background:white;padding:8px 3px"><small>ライブ</small><div style="font-size:22px;font-weight:bold">'+liveCount+'</div></div><div style="border-radius:10px;background:white;padding:8px 3px"><small>非ブレ</small><div style="font-size:22px;font-weight:bold">'+(nonBlade+liveNonBlade)+'</div></div></div></section><div style="border:1px solid #e9c5d3;border-radius:12px;padding:12px;margin:12px 0"><h3 style="margin:0 0 8px">詳細集計：'+total+'枚</h3><p style="margin:4px 0">メンバー <strong>'+memberCount+'枚</strong> ／ ライブ <strong>'+liveCount+'枚</strong></p><p style="margin:4px 0">非ブレ（メンバー） <strong>'+nonBlade+'枚</strong> ／ ライブを含む非ブレ <strong>'+(nonBlade+liveNonBlade)+'枚</strong></p><h4 style="margin:12px 0 6px">コスト別枚数（メンバー）</h4>'+(costRows||'<p class="hint">集計対象のメンバーなし</p>')+'<h4 style="margin:12px 0 6px">ブレードハート色別枚数</h4><div style="display:flex;flex-wrap:wrap;gap:5px">'+colorRows+'</div><p class="hint" style="margin:8px 0 0">色別・ドロー・音符をそれぞれ集計します。上部の非ブレはライブカードを含む合計です。</p>'+(unknown?'<p class="hint">カード情報未取得：'+unknown+'枚</p>':'')+'</div>';

 items.innerHTML=entries.map(([id,n])=>{const c=lookup(id);return '<div style="display:flex;gap:8px;align-items:center;border-bottom:1px solid #aaa4;padding:8px 0">'+(c?.imageUrl?'<img src="'+escape(c.imageUrl)+'" loading="lazy" style="width:45px">':'')+'<div style="flex:1;min-width:0"><strong>'+escape(c?.name||id)+'</strong><div class="hint">'+escape(c?.cardNo||'')+'</div></div><button class="ghost-btn" data-deck-adjust="'+escape(id)+'" data-delta="-1">−</button><strong>'+n+'</strong><button class="ghost-btn" data-deck-adjust="'+escape(id)+'" data-delta="1">＋</button></div>'}).join('')||'<p class="note">カード検索から追加してください。</p>';
}
function addButtons(){
 const box=$('#lovecaCardResults');if(!box||!cards.length)return;
 const byNumber=new Map(cards.map(c=>[String(c.cardNo),c]));
 box.querySelectorAll('.loveca-card-item').forEach(el=>{
  const actions=el.querySelector('.loveca-card-actions');if(!actions||actions.querySelector('[data-deck-add]'))return;
  const c=byNumber.get(el.querySelector('.loveca-card-meta span')?.textContent?.trim());if(!c||c.cardType==='エネルギー')return;
  const button=document.createElement('button');button.type='button';button.className='ghost-btn';button.dataset.deckAdd=c.id;button.textContent='＋ デッキに追加';actions.append(button);
 });
}
function init(){
 const nav=$('#loveScreen > .love-subnav'),browser=$('#loveCardBrowserPane');
 if(!nav||!browser){setTimeout(init,350);return}
 const tab=document.createElement('button');tab.className='love-tab';tab.type='button';tab.dataset.lovePane='builder';tab.textContent='デッキ構築';nav.append(tab);
 const pane=document.createElement('div');pane.id='loveDeckBuilderPane';pane.className='love-pane hidden';
 pane.innerHTML='<section class="panel"><div class="section-title-row"><h2>デッキ構築</h2><span class="badge ok">端末に保存</span></div><div style="display:flex;gap:8px;flex-wrap:wrap"><select id="lovecaDeckChooser" style="flex:1;min-width:120px"></select><button type="button" class="primary-btn" id="lovecaDeckNew">新規作成</button><button type="button" class="ghost-btn" id="lovecaDeckRename">名前変更</button><button type="button" class="ghost-btn" id="lovecaDeckDelete">削除</button></div><div id="lovecaBuilderStats"></div><div id="lovecaDeckItems"></div></section>';
 browser.after(pane);
 const addDialog=document.createElement('dialog');
 addDialog.id='lovecaDeckAddDialog';
 addDialog.style.cssText='width:min(92vw,420px);max-height:80dvh;overflow:auto;border:1px solid #e7b1c9;border-radius:14px;padding:18px;background:#fff;color:#333;box-shadow:0 12px 40px #0005';
 addDialog.innerHTML='<form method="dialog"><h3 style="margin:0 0 8px">デッキに追加</h3><p id="lovecaDeckAddCardName" style="margin:0 0 12px;overflow-wrap:anywhere"></p><label style="display:block;margin-bottom:12px">追加するデッキ<select id="lovecaDeckAddChoice" style="display:block;width:100%;min-height:44px;margin-top:6px"></select></label><p id="lovecaDeckAddEmpty" class="hint" style="display:none">デッキがありません。先にデッキ構築から作成してください。</p><div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" id="lovecaDeckAddCancel" class="ghost-btn">キャンセル</button><button type="button" id="lovecaDeckAddConfirm" class="primary-btn">OK・追加</button></div></form>';
 document.body.append(addDialog);
 const toast=document.createElement('div');toast.id='lovecaDeckAddToast';toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');toast.style.cssText='position:fixed;left:50%;bottom:105px;transform:translateX(-50%);z-index:99999;background:#a82e65;color:white;border-radius:12px;padding:12px 18px;font-weight:bold;box-shadow:0 5px 20px #0003;max-width:90vw;text-align:center;display:none';document.body.append(toast);
 let pendingAdd='',toastTimer;
 const notify=message=>{toast.textContent=message;toast.style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.style.display='none',2400)};
 $('#lovecaDeckAddCancel').onclick=()=>addDialog.close();
 $('#lovecaDeckAddConfirm').onclick=()=>{
  const deckId=$('#lovecaDeckAddChoice').value,all=get(),deck=all.find(d=>d.id===deckId);
  if(!deck||!pendingAdd)return;
  deck.cards=deck.cards||{};
  deck.cards[pendingAdd]=(Number(deck.cards[pendingAdd])||0)+1;
  if(!put(all))return;
  selected=deckId;
  const name=lookup(pendingAdd)?.name||'カード';
  addDialog.close();pendingAdd='';render();notify('「'+name+'」を「'+deck.name+'」に追加しました');
 };

 tab.onclick=()=>{nav.querySelectorAll('.love-tab').forEach(b=>b.classList.toggle('active',b===tab));$('#loveCalcPane')?.classList.add('hidden');browser.classList.add('hidden');$('#loveWishlistPane')?.classList.add('hidden');pane.classList.remove('hidden');$('#appTitle').textContent='ラブカ デッキ構築';$('#resetAllBtn').style.display='none';render()};
 nav.querySelectorAll('.love-tab:not([data-love-pane="builder"])').forEach(b=>b.addEventListener('click',()=>pane.classList.add('hidden')));
 $('#navLove')?.addEventListener('click',()=>{if(tab.classList.contains('active')){$('#appTitle').textContent='ラブカ デッキ構築';$('#resetAllBtn').style.display='none'}});
 $('#lovecaDeckChooser').onchange=e=>{selected=e.target.value;render()};
 $('#lovecaDeckNew').onclick=()=>{const name=prompt('デッキ名','新しいデッキ');if(!name?.trim())return;const all=get(),id='d'+Date.now();all.push({id,name:name.trim(),cards:{}});if(put(all)){selected=id;render()}};
 $('#lovecaDeckRename').onclick=()=>{const all=get(),deck=all.find(d=>d.id===selected);if(!deck)return;const name=prompt('新しいデッキ名',deck.name);if(name===null)return;const trimmed=name.trim();if(!trimmed){alert('デッキ名を入力してください');return}if(trimmed.length>60){alert('デッキ名は60文字以内にしてください');return}if(all.some(d=>d.id!==deck.id&&d.name===trimmed)){alert('同じ名前のデッキが既にあります');return}deck.name=trimmed;if(put(all)){render();notify('デッキ名を変更しました')}};
 $('#lovecaDeckDelete').onclick=()=>{if(!selected||!confirm('デッキを削除しますか？'))return;const all=get().filter(d=>d.id!==selected);if(put(all)){selected='';render()}};
 document.addEventListener('click',e=>{
  const add=e.target.closest('[data-deck-add]'),adjust=e.target.closest('[data-deck-adjust]');
  if(!add&&!adjust)return;
  if(add){
   const all=get();pendingAdd=String(add.dataset.deckAdd);
   const choice=$('#lovecaDeckAddChoice');
   choice.innerHTML=all.map(d=>'<option value="'+escape(d.id)+'">'+escape(d.name)+'</option>').join('');
   choice.value=all.some(d=>d.id===selected)?selected:(all[0]?.id||'');
   $('#lovecaDeckAddCardName').textContent=lookup(pendingAdd)?.name||'選択したカード';
   $('#lovecaDeckAddEmpty').style.display=all.length?'none':'block';
   $('#lovecaDeckAddConfirm').disabled=!all.length;
   addDialog.showModal();return;
  }
  const id=adjust.dataset.deckAdjust,delta=Number(adjust.dataset.delta),all=get(),deck=all.find(d=>d.id===selected);
  if(!deck)return;
  deck.cards[id]=Math.max(0,(deck.cards[id]||0)+delta);if(!deck.cards[id])delete deck.cards[id];
  if(put(all))render();
 });
 const box=$('#lovecaCardResults');if(box)new MutationObserver(addButtons).observe(box,{childList:true});
 fetch('./loveca-cards.json').then(r=>r.json()).then(data=>{cards=Array.isArray(data.cards)?data.cards:[];addButtons();render()}).catch(console.warn);
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();