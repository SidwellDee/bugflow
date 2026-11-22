import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildReportData} from '../src/report-data.js';
const now=new Date('2026-11-22T12:00:00Z');
const bug=(id,values={})=>({id,project_id:1,module_id:1,assignee_id:2,status:'Reported',severity:'Medium',priority:'P2',created_at:'2026-11-21T10:00:00Z',...values});
const data={projectId:1,now,users:[{id:2,name:'Sam',role:'Developer'},{id:3,name:'Lebo',role:'Tester'}],modules:[{id:1,project_id:1,name:'Login'},{id:2,project_id:1,name:'Results'},{id:3,project_id:2,name:'Other project'}]};
test('chart series exclude other project tickets, modules and history',()=>{
 const report=buildReportData({...data,bugs:[bug(1),bug(2,{project_id:2,module_id:3})],history:[{id:1,bug_id:2,timestamp:'2026-11-21T10:00:00Z',changes:JSON.stringify({status:{from:'In Progress',to:'Resolved'}})}]});
 assert.equal(report.total,1);assert.equal(report.status.reduce((sum,row)=>sum+row.value,0),1);assert.equal(report.severity.reduce((sum,row)=>sum+row.total,0),1);assert.deepEqual(report.modules.map(row=>row.name),['Login']);assert.equal(report.activity.reduce((sum,row)=>sum+row.resolved,0),0);assert.equal(report.activity.reduce((sum,row)=>sum+row.created,0),1);
});
test('priority stacks, workload and module states reconcile to snapshot totals',()=>{
 const report=buildReportData({...data,bugs:[bug(1,{status:'In Progress',severity:'Critical',priority:'P1'}),bug(2,{status:'Resolved',severity:'Critical',priority:'P2'}),bug(3,{status:'Closed',module_id:2}),bug(4,{status:'Reopened',assignee_id:null,module_id:null})]});
 assert.equal(report.total,4);assert.equal(report.outstanding,2);assert.equal(report.closed,1);
 assert.deepEqual(report.severity[0],{name:'Critical',total:2,P1:1,P2:1,P3:0,P4:0});
 assert.deepEqual(report.workload.find(row=>row.name==='Sam'),{name:'Sam',total:3,outstanding:1,verification:1,closed:1});
 assert.equal(report.workload.find(row=>row.name==='Unassigned').outstanding,1);assert.equal(report.modules.find(row=>row.name==='Project wide').total,1);
 for(const row of report.workload)assert.equal(row.total,row.outstanding+row.verification+row.closed);
 assert.equal(report.modules.reduce((sum,row)=>sum+row.total,0),4);
});
test('daily activity uses UTC, excludes seed snapshots and counts repeated observed transitions once',()=>{
 const transitions=[
  {id:1,timestamp:'2026-11-20T12:00:00Z',changes:{status:{from:null,to:'Resolved'}}},
  {id:2,timestamp:'2026-11-21T23:30:00-02:00',changes:{status:{from:'In Progress',to:'Resolved'}}},
  {id:3,timestamp:'2026-11-22T09:00:00Z',changes:{status:{from:'Closed',to:'Reopened'}}},
  {id:4,timestamp:'2026-11-22T10:00:00Z',changes:{status:{from:'In Progress',to:'Resolved'}}},
  {id:5,timestamp:'2026-11-22T11:00:00Z',changes:{status:{from:'Resolved',to:'Resolved'}}}
 ].map(row=>({...row,bug_id:1,changes:JSON.stringify(row.changes)}));
 const report=buildReportData({...data,bugs:[bug(1)],history:[...transitions,transitions[1],{id:6,bug_id:1,timestamp:'2026-11-22T10:00:00Z',changes:'malformed'}]});
 assert.equal(report.activity.length,30);assert.equal(report.activity[0].date,'2026-10-24');assert.deepEqual(report.activity.at(-1),{date:'2026-11-22',created:0,resolved:2,reopened:1});assert.equal(report.activity.reduce((sum,row)=>sum+row.resolved,0),2);
});
test('activity date range does not change current-state charts',()=>{
 const bugs=[bug(1,{created_at:'2026-10-01T10:00:00Z'}),bug(2,{created_at:'2026-11-22T10:00:00Z'})];
 const short=buildReportData({...data,bugs,days:30}),long=buildReportData({...data,bugs,days:90});
 assert.equal(short.activity.length,30);assert.equal(long.activity.length,90);assert.deepEqual(short.status,long.status);assert.equal(short.total,2);assert.equal(short.activity.reduce((sum,row)=>sum+row.created,0),1);assert.equal(long.activity.reduce((sum,row)=>sum+row.created,0),2);
});
test('empty projects produce usable zero series without synthetic activity',()=>{
 const report=buildReportData({...data,bugs:[],history:[]});assert.equal(report.total,0);assert.equal(report.closed,0);assert.equal(report.modules.length,0);assert.equal(report.status.length,7);assert.equal(report.activity.length,30);assert.equal(report.activity.every(row=>!row.created&&!row.resolved&&!row.reopened),true);assert.equal(report.workload.every(row=>row.total===0),true);
});
