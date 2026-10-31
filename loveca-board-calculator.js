/* Shared board-linked calculator for solo and online LoveCa. */
(()=>{'use strict';
const KEYS=['pink','red','yellow','green','blue','purple','colorless','all'],COLORS=KEYS.slice(0,6),LABEL=['桃','赤','黄','緑','青','紫','無','ALL'];
const empty=()=>Object.fromEntries(KEYS.map(k=>[k,0]));
const num=v=>Math.max(0,Math.floor(Number(v)||0));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));
let context=null,edited=null,dialog=null;
const get=id=>context?.card(id);
function boardData(){
 const b=context.board(),owned=empty(),req=empty(),stage=context.kind==='solo'?b.stageSlots:b.stage,lives=context.kind==='solo'?b.liveSlots:b.live;
 for(const id of stage||[]){const c=get(id);if(!c)continue;for(const k of KEYS)owned[k]+=num(c.hearts?.[k])}
 if(context.livePhase()){for(const id of lives||[]){const c=get(id);if(!c)continue;for(const k of KEYS)req[k]+=num(c.hearts?.[k])}}
 return {owned,req,lives:(lives||[]).filter(Boolean),stage:(stage||[]).filter(Boolean)};
}
function cheerData(){
 const b=context.board(),ids=context.kind==='solo'?(b.cheer||[]):(b.cheer||[]),sum=empty(),list=[];let note=0,draw=0,unknown=0;
 const names={桃:'pink',赤:'red',黄:'yellow',緑:'green',青:'blue',紫:'purple',ALL:'all'};
 for(const id of ids){const c=get(id);if(!c){unknown++;continue}const gain=empty(),raw=String(c.bladeHeart||'');
 const matches=[...raw.matchAll(/(ALL|桃|赤|黄|緑|青|紫)\s*(\d+)/g)];
 if(matches.length){for(const m of matches)gain[names[m[1]]]+=num(m[2])}
 else if(raw.includes('[全ブレード]'))gain.all++;
 else for(const k of c.bladeHeartTypes||[])if(k in gain)gain[k]++;
 const isNote=['note','スコア'].includes(c.specialHeart)||c.bladeHeartTypes?.includes('note');
 const isDraw=c.specialHeart==='draw'||c.bladeHeartTypes?.includes('draw');
 if(isNote)note++;if(isDraw)draw++;
 if(c.hasBladeHeart&&!Object.values(gain).some(Boolean)&&!isNote&&!isDraw)unknown++;
 for(const k of KEYS)sum[k]+=gain[k];
 list.push({id,c,gain,isNote,isDraw});
 }
 return {ids,list,sum,note,draw,unknown};
}
function evaluate(owned,req){
 let deficit=0,spare=0,details=[];
 for(const k of COLORS){const gap=req[k]-owned[k];deficit+=Math.max(0,gap);spare+=Math.max(0,-gap);if(gap>0)details.push(LABEL[KEYS.indexOf(k)]+' '+gap)}
 const colorlessGap=Math.max(0,req.colorless-owned.colorless-spare);
 if(colorlessGap)details.push('無 '+colorlessGap);
 const all=owned.all,need=deficit+colorlessGap,missing=Math.max(0,need-all);
 const extra=Math.max(0,all-need)+Math.max(0,spare-Math.max(0,req.colorless-owned.colorless))+Math.max(0,owned.colorless-req.colorless);
 return {missing,extra,details};
}
function ensure(){
 if(dialog)return;
 dialog=document.createElement('dialog');dialog.id='lovecaBoardCalculator';dialog.style.cssText='width:min(96vw,620px);max-height:90dvh;overflow:auto;border:1px solid #d9a6bb;border-radius:14px;padding:16px;color:#29242a;background:#fff;box-shadow:0 12px 50px #0006;z-index:99999';
 document.body.append(dialog);
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();if(e.target.closest('[data-calc-close]'))dialog.close();if(e.target.closest('[data-calc-reset]')){edited=null;render()}if(e.target.closest('[data-calc-cheer]')){dialog.close();context?.cheer?.()}});
 dialog.addEventListener('input',e=>{const input=e.target.closest('[data-calc-key]');if(!input)return;const [type,key]=input.dataset.calcKey.split(':');if(!edited)edited=boardData();edited[type][key]=num(input.value);showResult()});
}
function render(){
 if(!context)return;ensure();const base=boardData(),data=edited||base,cheer=cheerData(),live=context.livePhase(),total=empty();
 for(const k of KEYS)total[k]=data.owned[k]+cheer.sum[k];
 const field=(type,key,value)=>'<input type="number" min="0" inputmode="numeric" aria-label="'+(type==='owned'?'所持':'必要')+' '+LABEL[KEYS.indexOf(key)]+'" data-calc-key="'+type+':'+key+'" value="'+num(value)+'" style="width:100%;min-width:0;min-height:38px;box-sizing:border-box;padding:5px 6px;text-align:center;font-size:16px;border:1px solid #ddd;border-radius:8px">';
 const matrix='<div style="display:grid;grid-template-columns:52px minmax(0,1fr) '+(live?'minmax(0,1fr)':'')+';gap:5px 8px;align-items:center"><strong style="font-size:12px">色</strong><strong style="text-align:center;font-size:13px">所持ハート</strong>'+(live?'<strong style="text-align:center;font-size:13px">ライブ必要</strong>':'')+KEYS.map((k,i)=>'<strong style="font-size:14px">'+LABEL[i]+'</strong>'+field('owned',k,data.owned[k])+(live?field('req',k,data.req[k]):'')).join('')+'</div>';
 dialog.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><h3 style="margin:0;font-size:17px">盤面連動ハート計算</h3><button type="button" data-calc-close style="font-size:13px">元の画面に戻る</button></div><p style="font-size:12px;margin:8px 0">対象：'+(context.kind==='solo'?'1人回し':'オンライン対戦')+' ／ '+(live?'ライブフェイズ':'メインフェイズ')+'。数値は手動修正できます。</p>'+matrix+'<div style="display:flex;flex-wrap:wrap;gap:8px;margin:12px 0"><button type="button" data-calc-reset>盤面通りに戻す</button>'+(live?'<button type="button" data-calc-cheer>エール枚数を指定してめくる</button>':'')+'</div><div id="lovecaBoardCalcResult"></div>';
 showResult();
}
function showResult(){
 if(!context||!dialog)return;const node=dialog.querySelector('#lovecaBoardCalcResult');if(!node)return;
 const data=edited||boardData(),cheer=cheerData(),total=empty();
 for(const k of KEYS)total[k]=num(data.owned[k])+cheer.sum[k];
 const calc=evaluate(total,data.req),live=context.livePhase();
 node.innerHTML='<h4>エール集計</h4><p>公開 '+cheer.ids.length+'枚 ／ ドロー '+cheer.draw+' ／ 音符 '+cheer.note+'（スコア+'+cheer.note+'）</p>'+(cheer.list.length?'<div style="display:grid;gap:6px">'+cheer.list.map(x=>'<div style="display:flex;align-items:center;gap:8px;border-bottom:1px solid #ddd;padding:5px 0">'+(x.c.imageUrl?'<img src="'+esc(x.c.imageUrl)+'" style="width:42px;height:58px;object-fit:contain">':'')+'<span style="flex:1;font-size:12px">'+esc(x.c.name)+'<small style="display:block">'+KEYS.filter(k=>x.gain[k]).map(k=>LABEL[KEYS.indexOf(k)]+x.gain[k]).join(' ')+' '+(x.isDraw?'ドロー ':'')+(x.isNote?'音符':'')+'</small></span></div>').join('')+'</div>':'')+'<p>盤面＋エール：'+KEYS.map((k,i)=>LABEL[i]+' '+total[k]).join(' ／ ')+'</p>'+(live?'<div style="border-top:1px solid #ddd;padding-top:8px"><strong style="font-size:20px">'+(cheer.ids.length?(calc.missing===0?'成功（ハート条件）':'失敗（ハート不足）'):'エール待ち')+'</strong><p>'+(calc.missing?'不足：'+calc.details.join('、')+' ／ ALL補完後 '+calc.missing+'個不足':'余剰ハート：'+calc.extra+'個')+'</p></div>':'')+(cheer.unknown?'<p>不明なブレードハート '+cheer.unknown+'枚</p>':'')+'<p style="font-size:12px">※カード効果・特殊な成功条件・エールのドロー追加処理は手動確認が必要です。ハート条件のみの判定です。</p>';
}
window.LovecaBoardCalc={open(config){context=config;edited=null;render();dialog.showModal()},refresh(){if(context&&dialog?.open&&!edited)render()},evaluate,cheerData};
})();