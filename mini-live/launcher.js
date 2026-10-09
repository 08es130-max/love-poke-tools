(()=>{
'use strict';
const id='mascot-test-live-launch';
if(document.getElementById(id))return;
const css=document.createElement('style');
css.textContent=`
#${id}{position:fixed;right:max(132px,calc(env(safe-area-inset-right,0px) + 130px));bottom:max(10px,calc(env(safe-area-inset-bottom,0px) + 8px));z-index:930;min-width:100px;min-height:42px;padding:7px 10px;border:1px solid #d79bc0;border-radius:24px;background:#fffafa;color:#b23b83;font:700 12px/1.2 -apple-system,BlinkMacSystemFont,sans-serif;box-shadow:0 4px 14px #0002;cursor:pointer;touch-action:manipulation}
#${id}:focus-visible{outline:3px solid #44abc0;outline-offset:2px}
.mascot-live-toast{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 65px);transform:translateX(-50%);z-index:950;max-width:min(92vw,320px);padding:9px 12px;border-radius:12px;background:#34263bec;color:#fff;font-size:12px;font-weight:700;text-align:center;pointer-events:none}
`;
document.head.append(css);
const btn=document.createElement('button');
btn.id=id;btn.type='button';btn.textContent='♪ テストライブ';
btn.setAttribute('aria-label','歩行中のキャラクターがその場でライブを始めます');
document.body.append(btn);
let toastTimer=0;
function notify(message){
  let toast=document.querySelector('.mascot-live-toast');
  if(!toast){toast=document.createElement('div');toast.className='mascot-live-toast';document.body.append(toast)}
  toast.textContent=message;toast.hidden=false;
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>{toast.hidden=true},2600);
}
btn.addEventListener('click',async()=>{
  if(typeof window.lovePokeStartMascotLive!=='function'){notify('マスコットを読み込み中です');return}
  btn.disabled=true;
  try{
    const started=await window.lovePokeStartMascotLive();
    if(!started)notify('歩行モードで歩夢・かすみ・しずく・果林・愛・彼方・栞子を表示するとライブできます');
  }catch(_){notify('ライブ画像を読み込めませんでした')}
  finally{btn.disabled=false}
});
})();