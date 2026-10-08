(()=>{
'use strict';
const BUTTON_ID='mascot-test-live-launch',DIALOG_ID='mascot-test-live-dialog';
if(document.getElementById(BUTTON_ID))return;
const style=document.createElement('style');style.textContent=`
#${BUTTON_ID}{position:fixed;right:max(132px,calc(env(safe-area-inset-right,0px) + 130px));bottom:max(10px,calc(env(safe-area-inset-bottom,0px) + 8px));z-index:930;min-width:100px;min-height:42px;padding:7px 10px;border:1px solid #d79bc0;border-radius:24px;background:#fffafa;color:#b23b83;font:700 12px/1.2 -apple-system,BlinkMacSystemFont,sans-serif;box-shadow:0 4px 14px #0002;cursor:pointer;touch-action:manipulation}
#${BUTTON_ID}:focus-visible{outline:3px solid #44abc0;outline-offset:2px}
#${DIALOG_ID}{box-sizing:border-box;position:fixed;inset:0;margin:auto;width:min(480px,calc(100vw - 18px));max-width:none;height:min(650px,calc(100dvh - 26px));max-height:none;padding:0;border:0;border-radius:19px;overflow:hidden;box-shadow:0 20px 60px #130d245c;background:#fff;z-index:9900}
#${DIALOG_ID}::backdrop{background:#101025b8}
#${DIALOG_ID} iframe{width:100%;height:100%;border:0;display:block}
#${DIALOG_ID} .test-live-close{position:absolute;top:7px;right:8px;z-index:3;padding:7px 10px;border:1px solid #c9a6d0;border-radius:14px;background:#fffffff0;color:#61396b;font-size:12px;font-weight:750;cursor:pointer;min-height:35px}
`;document.head.appendChild(style);
const btn=document.createElement('button');btn.id=BUTTON_ID;btn.type='button';btn.textContent='♪ テストライブ';btn.setAttribute('aria-label','栞子のテストライブを開く');
const dlg=document.createElement('dialog');dlg.id=DIALOG_ID;dlg.setAttribute('aria-label','栞子ミニライブ');
const close=document.createElement('button');close.className='test-live-close';close.type='button';close.textContent='✕ 閉じる';
const frame=document.createElement('iframe');frame.title='栞子のミニライブ動作テスト';frame.setAttribute('loading','lazy');
dlg.append(close,frame);document.body.append(btn,dlg);
btn.addEventListener('click',()=>{frame.src='./mini-live/shioriko-test-live.html?v=20261009-1';if(typeof dlg.showModal==='function')dlg.showModal();else dlg.setAttribute('open','')});
close.addEventListener('click',()=>{if(typeof dlg.close==='function')dlg.close();else dlg.removeAttribute('open')});
dlg.addEventListener('close',()=>{frame.removeAttribute('src')});
dlg.addEventListener('click',e=>{if(e.target===dlg&&typeof dlg.close==='function')dlg.close()});
})();