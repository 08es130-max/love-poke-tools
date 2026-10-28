/* Compact Loveca navigation: three primary tabs, contextual secondary tabs. */
(()=>{
'use strict';
function init(){
 const nav=document.querySelector('#loveScreen > .love-subnav');
 if(!nav||!nav.querySelector('[data-love-pane="solo"]')){setTimeout(init,300);return}
 if(document.querySelector('#loveCompactSubnav'))return;
 const lookup=id=>nav.querySelector('[data-love-pane="'+id+'"]');
 const search=lookup('cards'),wishlist=lookup('wishlist'),deck=lookup('builder'),solo=lookup('solo'),online=lookup('online');
 if(!search||!wishlist||!deck||!solo){setTimeout(init,300);return;}
 // Keep original tab nodes and their listeners; secondary buttons invoke them.
 const secondary=document.createElement('nav');
 secondary.id='loveCompactSubnav';
 secondary.className='love-compact-subnav hidden';
 secondary.setAttribute('aria-label','ラブカの詳細メニュー');
 nav.after(secondary);
 const options=[
  {id:'cards',label:'カードを探す',group:'cards'},
  {id:'wishlist',label:'欲しいもの',group:'cards'},
  {id:'builder',label:'デッキ編集',group:'builder'},
  {id:'solo',label:'1人回し',group:'builder'},
  ...(online?[{id:'online',label:'オンライン',group:'builder'}]:[])
 ];
 for(const item of options){
  const b=document.createElement('button');b.type='button';b.className='love-compact-option';
  b.dataset.compactPane=item.id;b.textContent=item.label;
  b.addEventListener('click',()=>{lookup(item.id)?.click();sync(item.id)});
  secondary.append(b);
 }
 const style=document.createElement('style');
 style.textContent=`
 #loveScreen > .love-subnav{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
 #loveScreen > .love-subnav > .love-tab{min-width:0!important;width:100%;padding:12px 5px!important;font-size:clamp(13px,3.4vw,16px)!important;white-space:nowrap}
 #loveScreen > .love-subnav > .love-tab[data-love-pane="wishlist"],
 #loveScreen > .love-subnav > .love-tab[data-love-pane="solo"],
 #loveScreen > .love-subnav > .love-tab[data-love-pane="online"]{display:none!important}
 #loveCompactSubnav{display:flex;gap:8px;margin:8px 0 12px;padding:0 2px}
 #loveCompactSubnav.hidden{display:none!important}
 #loveCompactSubnav .love-compact-option{flex:1;min-width:0;padding:9px 6px;border:1px solid #e7b8ca;border-radius:999px;background:transparent;color:inherit;font-weight:700;font-size:13px}
 #loveCompactSubnav .love-compact-option.active{background:#fce5ee;color:#d83170;border-color:#ee77a4}
 `;
 document.head.append(style);
 search.textContent='カード検索';deck.textContent='デッキ';
 function sync(id){
  const group=id==='cards'||id==='wishlist'?'cards':id==='builder'||id==='solo'||id==='online'?'builder':'calc';
  secondary.classList.toggle('hidden',group==='calc');
  secondary.querySelectorAll('button').forEach(b=>{
   const item=options.find(x=>x.id===b.dataset.compactPane);
   b.classList.toggle('hidden',item.group!==group);
   b.style.display=item.group===group?'':'none';
   b.classList.toggle('active',b.dataset.compactPane===id);
  });
  nav.querySelectorAll('.love-tab').forEach(b=>b.classList.toggle('active',b.dataset.lovePane===group));
 }
 for(const id of ['calc','cards','wishlist','builder','solo',...(online?['online']:[])]){
  lookup(id)?.addEventListener('click',()=>sync(id));
 }
 const selected=nav.querySelector('.love-tab.active')?.dataset.lovePane||'calc';
 sync(selected);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
