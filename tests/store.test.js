import {test} from 'node:test';import assert from 'node:assert/strict';import {createStore} from '../store.js';
const draft=()=>({project_id:1,module_id:1,title:'Test defect',description:'Details',steps:'Repeat',expected:'Success',actual:'Failure',environment:'Test',type:'Functional',severity:'High',priority:'P1',status:'Reported',actor_id:3});
function fixture(){const s=createStore(':memory:');return {s,d:draft(),save(d){const r=s.save(d);Object.assign(d,s.data().bugs.find(b=>b.id===r.id));return r}}}
test('full lifecycle, reopening and atomic history',()=>{const{s,d,save}=fixture();try{save(d);for(const[status,actor]of[['Assigned',1],['In Progress',2],['Resolved',2],['Tested',3],['Closed',3],['Reopened',3],['Assigned',1]]){Object.assign(d,{status,actor_id:actor,assignee_id:2,resolution:'Fixed validation',note:status==='Reopened'?'Retest failed':''});save(d)}assert.equal(s.data().history.filter(h=>h.bug_id===d.id).length,8)}finally{s.db.close()}});
for(const [title,prepare,pattern] of [
 ['invalid status',({d,save})=>{save(d);d.status='Unknown'},/Invalid status/],
 ['cross-project module',({s,d})=>{s.project({name:'Other',description:'Other'});d.project_id=2},/Module must belong/],
 ['invalid acting member',({d,save})=>{save(d);d.actor_id=999},/acting member/],
 ['stale edit',({d,save})=>{save(d);d.version=0},/changed/],
 ['resolution required',({d,save})=>{save(d);Object.assign(d,{status:'Assigned',actor_id:2,assignee_id:2});save(d);d.status='In Progress';save(d);d.status='Resolved'},/resolution/],
 ['required title',({d})=>{d.title=' '},/title/],
 ['classification',({d})=>{d.severity='Unknown'},/severity/],
 ['reopening reason',({d})=>Object.assign(d,{id:5,version:1,status:'Reopened',assignee_id:2}),/Explain/]
])test(title,()=>{const f=fixture();try{prepare(f);const before=f.s.data();assert.throws(()=>f.save(f.d),pattern);assert.deepEqual(f.s.data(),before)}finally{f.s.db.close()}});
test('project and module registration',()=>{const s=createStore(':memory:');try{const p=s.project({name:'Library',description:'Loans'});s.module({project_id:p.id,name:'Loans'});assert.equal(s.data().modules.at(-1).project_id,p.id);assert.throws(()=>s.project({name:'Library',description:'Duplicate'}))}finally{s.db.close()}});
