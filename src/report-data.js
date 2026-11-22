import {statusNames} from '../workflow.js';

const completed=new Set(['Resolved','Tested','Closed']);
const severityOrder=['Critical','High','Medium','Low'];
const priorityOrder=['P1','P2','P3','P4'];
const dateKey=value=>{
  const date=new Date(value);
  return Number.isFinite(date.getTime())?date.toISOString().slice(0,10):null;
};

// Every series is derived from the same project-scoped snapshot, not demo values.
export function buildReportData({projectId,bugs=[],modules=[],users=[],history=[],days=30,now=new Date()}){
  const tickets=bugs.filter(bug=>bug.project_id===projectId);
  const ticketIds=new Set(tickets.map(bug=>bug.id));
  const status=statusNames.map(name=>({name,value:tickets.filter(bug=>bug.status===name).length}));
  const severity=severityOrder.map(name=>{
    const matching=tickets.filter(bug=>bug.severity===name);
    return {name,total:matching.length,...Object.fromEntries(priorityOrder.map(priority=>[priority,matching.filter(bug=>bug.priority===priority).length]))};
  });
  const workloadMap=new Map(users.filter(user=>user.role!=='Tester').map(user=>[user.id,{name:user.name,outstanding:0,verification:0,closed:0,total:0}]));
  for(const bug of tickets){
    const key=bug.assignee_id??'unassigned';
    if(!workloadMap.has(key))workloadMap.set(key,{name:key==='unassigned'?'Unassigned':users.find(user=>user.id===key)?.name||`Member ${key}`,outstanding:0,verification:0,closed:0,total:0});
    const row=workloadMap.get(key);row.total++;
    row[bug.status==='Closed'?'closed':completed.has(bug.status)?'verification':'outstanding']++;
  }
  const workload=[...workloadMap.values()].sort((a,b)=>b.outstanding-a.outstanding||b.total-a.total||a.name.localeCompare(b.name));
  const moduleRows=[...modules.filter(module=>module.project_id===projectId).map(module=>({id:module.id,name:module.name})),{id:null,name:'Project wide'}].map(module=>{
    const matching=tickets.filter(bug=>(bug.module_id??null)===module.id);
    return {name:module.name,total:matching.length,outstanding:matching.filter(bug=>!completed.has(bug.status)).length,completed:matching.filter(bug=>completed.has(bug.status)).length};
  }).filter(row=>row.total>0).sort((a,b)=>b.outstanding-a.outstanding||b.total-a.total||a.name.localeCompare(b.name));
  const end=new Date(now);end.setUTCHours(0,0,0,0);
  const rangeDays=days===90?90:30;
  const activity=Array.from({length:rangeDays},(_,index)=>{
    const date=new Date(end);date.setUTCDate(date.getUTCDate()-rangeDays+1+index);
    return {date:date.toISOString().slice(0,10),created:0,resolved:0,reopened:0};
  });
  const buckets=new Map(activity.map(row=>[row.date,row]));
  for(const bug of tickets){const row=buckets.get(dateKey(bug.created_at));if(row)row.created++}
  const seen=new Set();
  for(const event of history){
    if(!ticketIds.has(event.bug_id)||seen.has(event.id))continue;
    seen.add(event.id);
    let changes;try{changes=typeof event.changes==='string'?JSON.parse(event.changes):event.changes}catch{continue}
    const change=changes?.status,row=buckets.get(dateKey(event.timestamp));
    // Null origins are imports/creation snapshots, not observed repair/reopen events.
    if(!row||!change||change.from==null||change.from===change.to)continue;
    if(change.to==='Resolved')row.resolved++;
    if(change.to==='Reopened')row.reopened++;
  }
  return {status,severity,workload,modules:moduleRows,activity,total:tickets.length,outstanding:tickets.filter(bug=>!completed.has(bug.status)).length,closed:tickets.filter(bug=>bug.status==='Closed').length};
}
