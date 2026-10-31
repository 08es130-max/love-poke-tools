const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../loveca-solo.js'),'utf8').replace("if(document.readyState==='loading')", "globalThis.solo={setState:s=>state=s,getState:()=>state,confirmLiveResult,undo};if(document.readyState==='loading')");
function setup(liveSlots,values={}){
 const inputs={'#soloLiveSuccess':{value:'yes'},'#soloLiveScore':{value:'12'},'#soloLiveReward':{value:''}};
 for(const [key,value] of Object.entries(values))inputs[key]={value};
 const alerts=[],saved=new Map();
 const ctx={document:{readyState:'loading',addEventListener(){},querySelector:s=>inputs[s]||null},localStorage:{setItem:(k,v)=>saved.set(k,v)},alert:s=>alerts.push(s)};
 vm.runInNewContext(source,ctx);
 ctx.solo.setState({turn:1,phase:2,liveSlots,successLive:['old'],discard:[],log:[]});
 return {...ctx.solo,alerts,inputs,saved};
}
const plain=x=>JSON.parse(JSON.stringify(x));
test('one live moves automatically, persists, and undo restores it',()=>{
 const s=setup([null,'a',null]);s.confirmLiveResult();
 assert.deepEqual(plain(s.getState().successLive),['old','a']);
 assert.deepEqual(plain(s.getState().liveSlots),[null,null,null]);
 assert.equal(JSON.parse([...s.saved.values()][0]).lastLiveResult.score,12);
 s.undo();assert.deepEqual(plain(s.getState().liveSlots),[null,'a',null]);
 assert.deepEqual(plain(s.getState().successLive),['old']);
});
test('multiple lives require a choice and move exactly the selected slot, including duplicates',()=>{
 const s=setup(['a',null,'a']);s.confirmLiveResult();
 assert.equal(s.alerts.length,1);assert.equal(s.getState().successLive.length,1);
 s.inputs['#soloLiveReward'].value='2';s.confirmLiveResult();
 assert.deepEqual(plain(s.getState().liveSlots),['a',null,null]);
 assert.deepEqual(plain(s.getState().successLive),['old','a']);
 s.confirmLiveResult();assert.equal(s.getState().successLive.length,2);
 s.getState().turn++;s.confirmLiveResult();assert.equal(s.getState().successLive.length,3);
});
test('failure and no live do not move cards or require a choice',()=>{
 for(const slots of [['a','b',null],[null,null,null]]){
 const s=setup(slots,{'#soloLiveSuccess':'no'});s.confirmLiveResult();
 assert.deepEqual(plain(s.getState().liveSlots),slots);
 assert.deepEqual(plain(s.getState().successLive),['old']);
 assert.equal(s.getState().lastLiveResult.success,false);assert.equal(s.alerts.length,0);
 }
 const s=setup([null,null,null]);s.confirmLiveResult();assert.equal(s.getState().lastLiveResult.success,false);
});
test('invalid score or stale selection never changes state',()=>{
 for(const values of [{'#soloLiveScore':'-1'},{'#soloLiveScore':'1.5'},{'#soloLiveScore':'10000'},{'#soloLiveReward':'1'}]){
 const s=setup(['a',null,'b'],values),before=plain(s.getState());s.confirmLiveResult();
 assert.deepEqual(plain(s.getState()),before);assert.equal(s.alerts.length,1);
 }
});
