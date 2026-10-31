const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../loveca-online.js'),'utf8').replace("if(document.readyState==='loading')",`globalThis.online={resolveLive,applyLiveResolution,submitLive,set:s=>{board=s;uid='a';api={db:{},doc(){},runTransaction:async(_,fn)=>fn({get:async()=>({exists:()=>true,data:()=>({phaseState:{phase:2,round:0,turnUid:'a'},players:{a:{},b:{}}})}),update:(_,v)=>globalThis.update=v})};roomId='test';currentPhase=2;battleActive=true;publishBoard=()=>{globalThis.published=(globalThis.published||0)+1}},get:()=>board};if(document.readyState==='loading')`);
function setup(live=['x',null,'y'],successLive=[]){
 const inputs={'#onlineLiveSuccess':{value:'yes'},'#onlineLiveScore':{value:'10'},'#onlineLiveReward':{value:'2'},'#lovecaOnlineStatus':{style:{}}};
 const ctx={document:{readyState:'loading',addEventListener(){},querySelector:s=>inputs[s]||null},prompt:()=>null};vm.runInNewContext(source,ctx);
 ctx.online.set({live,successLive});ctx.inputs=inputs;return ctx;
}
const report=(score,count=0,success=true,reward={id:'y',slot:2})=>({score,successCount:count,success,hasLive:true,reward});
test('win awards selected card, including third success, only once',()=>{
 const c=setup(['x',null,'y'],['old1','old2']);
 const r=c.online.resolveLive({a:report(10,2),b:report(9)},'b',['a','b']);
 assert.equal(r.placements.a,true);assert.equal(r.nextFirst,'a');
 c.online.applyLiveResolution({...r,round:0});
 assert.equal(c.online.get().successLive.join(','),'old1,old2,y');
 assert.equal(c.online.get().live[0],'x');assert.equal(c.online.get().live[2],null);
 c.online.applyLiveResolution({...r,round:0});assert.equal(c.published,1);
});
test('tie permits only players with fewer than two successes; first stays unchanged',()=>{
 const c=setup();const r=c.online.resolveLive({a:report(10,2),b:report(10,1)},'a',['a','b']);
 assert.equal(r.tie,true);assert.equal(r.placements.a,false);assert.equal(r.placements.b,true);assert.equal(r.nextFirst,'a');
 c.online.applyLiveResolution({...r,round:0});assert.equal(c.online.get().successLive.length,0);
});
test('both failures retain first and award neither player',()=>{
 const c=setup();const r=c.online.resolveLive({a:report(0,0,false),b:report(0,0,false)},'b',['a','b']);
 assert.equal(r.nextFirst,'b');assert.equal(r.placements.a,false);assert.equal(r.placements.b,false);
});
test('submission requires choice for multiple cards, sends exact selected slot',async()=>{
 const c=setup();c.inputs['#onlineLiveReward'].value='';await c.online.submitLive();assert.equal(c.update,undefined);
 c.inputs['#onlineLiveReward'].value='2';await c.online.submitLive();assert.equal(c.update.liveReports.a.reward.slot,2);assert.equal(c.update.liveReports.a.reward.id,'y');
});
test('single card submission chooses automatically; missing selected card never awards a different one',async()=>{
 const c=setup([null,'single',null]);await c.online.submitLive();assert.equal(c.update.liveReports.a.reward.id,'single');
 c.online.applyLiveResolution({round:0,placements:{a:true},rewards:{a:{id:'missing',slot:1}}});
 assert.equal(c.online.get().successLive.length,0);assert.equal(c.online.get().lastLiveRound,undefined);
});
