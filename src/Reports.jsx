import React,{useMemo,useState} from 'react';
import {ResponsiveContainer,PieChart,Pie,Cell,BarChart,Bar,AreaChart,Area,XAxis,YAxis,CartesianGrid,Tooltip,Legend} from 'recharts';
import {buildReportData} from './report-data.js';
import './reports.css';

const statusColors=['#a1a1b3','#9687cf','#d4a461','#5fa99b','#6d9fc3','#66a18b','#c9839b'];
const priorityColors={P1:'#c87891',P2:'#b49ad1',P3:'#80a4ca',P4:'#8bb8aa'};
const numberAxis={allowDecimals:false,tickLine:false,axisLine:false,tick:{fill:'#9388a1',fontSize:11}};
const tooltipStyle={border:'1px solid #e9e1f0',borderRadius:9,fontSize:12,boxShadow:'0 6px 24px #35204712'};
const formatDay=value=>new Date(value+'T00:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'UTC'});
const shorten=value=>value.length>19?value.slice(0,18)+'…':value;

function DataTable({caption,rows,columns}){
 return <details className="report-data-table"><summary>View data table</summary><div className="tablewrap"><table><caption>{caption}</caption><thead><tr>{columns.map(column=><th key={column.key} scope="col">{column.label}</th>)}</tr></thead><tbody>{rows.map((row,index)=><tr key={index}>{columns.map(column=><td key={column.key}>{row[column.key]}</td>)}</tr>)}</tbody></table></div></details>;
}
function Panel({title,description,className='',children}){
 return <section className={'report-panel '+className}><div className="report-panel-heading"><h2>{title}</h2><p>{description}</p></div>{children}</section>;
}
function Empty({children='Create your first ticket to see this chart.'}){return <div className="report-chart-empty"><span aria-hidden="true">▥</span><p>{children}</p></div>}
function SmallSeries({rows}){return <div className="status-chart-key">{rows.map((row,index)=><div key={row.name}><span className="series-swatch" style={{background:statusColors[index]}}/><span>{row.name}</span><strong>{row.value}</strong></div>)}</div>}

export default function Reports({project,data}){
 const [days,setDays]=useState(30);
 const report=useMemo(()=>buildReportData({projectId:project.id,bugs:data.bugs,modules:data.modules,users:data.users,history:data.history,days}),[project.id,data,days]);
 const activityTotal=report.activity.reduce((sum,row)=>sum+row.created+row.resolved+row.reopened,0);
 const workloadHeight=Math.max(260,report.workload.length*42+70);
 const modulesHeight=Math.max(260,report.modules.length*42+65);
 return <div className="project-reports">
  <div className="toolbar report-page-heading"><div><h2>Project analytics</h2><p>Understand ticket flow, spot hotspots and balance your team’s work.</p></div><a className="button" href={'/api/export?project_id='+project.id} download>↓ Export project CSV</a></div>
  <div className="report-scope-note"><span className="report-scope-dot"/>Current snapshot · {project.name} · {report.total} tickets</div>
  <div className="reports-grid">
   <Panel title="Lifecycle overview" description="Where tickets stand right now. Hover over a segment for its share.">
    {report.total?<div className="status-chart-layout"><div className="report-chart status-donut" role="img" aria-label={`Status distribution for ${report.total} tickets. ${report.closed} closed.`}>
     <ResponsiveContainer width="100%" height="100%" minWidth={0}><PieChart><Pie data={report.status.filter(row=>row.value>0)} dataKey="value" nameKey="name" innerRadius="65%" outerRadius="88%" paddingAngle={3} stroke="none" isAnimationActive={false}>{report.status.filter(row=>row.value>0).map(row=><Cell key={row.name} fill={statusColors[report.status.findIndex(status=>status.name===row.name)]}/>)}</Pie><Tooltip formatter={(value,name)=>[`${value} tickets (${Math.round(value/report.total*100)}%)`,name]} contentStyle={tooltipStyle}/></PieChart></ResponsiveContainer>
     <div className="donut-centre"><strong>{report.total}</strong><span>total tickets</span></div>
    </div><SmallSeries rows={report.status}/></div>:<Empty/>}
    <DataTable caption="Current tickets by lifecycle status" rows={report.status} columns={[{key:'name',label:'Status'},{key:'value',label:'Tickets'}]}/>
   </Panel>
   <Panel title="Impact & urgency" description="Severity shows impact; stacked colours show scheduling priority.">
    {report.total?<div className="report-chart" role="img" aria-label="Ticket count by severity, stacked by priority"><ResponsiveContainer width="100%" height="100%" minWidth={0}><BarChart data={report.severity} margin={{top:12,right:8,bottom:8,left:-22}} accessibilityLayer><CartesianGrid vertical={false} stroke="#eee8f3" strokeDasharray="3 3"/><XAxis dataKey="name" {...numberAxis}/><YAxis {...numberAxis}/><Tooltip cursor={{fill:'#f8f5fc'}} contentStyle={tooltipStyle}/><Legend iconType="circle" iconSize={7} wrapperStyle={{fontSize:11,paddingTop:15}}/>{Object.entries(priorityColors).map(([priority,color])=><Bar key={priority} dataKey={priority} stackId="priority" fill={color} maxBarSize={42} isAnimationActive={false}/>)}</BarChart></ResponsiveContainer></div>:<Empty/>}
    <DataTable caption="Tickets by severity and priority" rows={report.severity} columns={[{key:'name',label:'Severity'},...Object.keys(priorityColors).map(key=>({key,label:key})),{key:'total',label:'Total'}]}/>
   </Panel>
   <Panel title="Ticket activity" description="Daily creations and recorded resolution/reopening events. Dates use UTC." className="report-panel-wide">
    <div className="activity-controls"><span>Activity over the last {days} days</span><div className="report-range" role="group" aria-label="Activity date range">{[30,90].map(value=><button key={value} aria-pressed={days===value} className={days===value?'active':''} onClick={()=>setDays(value)}>{value} days</button>)}</div></div>
    {activityTotal?<div className="report-chart activity-chart" role="img" aria-label={`Ticket creations, resolution events and reopening events over ${days} days`}><ResponsiveContainer width="100%" height="100%" minWidth={0}><AreaChart data={report.activity} margin={{top:15,right:15,bottom:6,left:-22}} accessibilityLayer><defs><linearGradient id="report-created-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#9a87cc" stopOpacity={.24}/><stop offset="100%" stopColor="#9a87cc" stopOpacity={.02}/></linearGradient></defs><CartesianGrid vertical={false} stroke="#eee8f3" strokeDasharray="3 3"/><XAxis dataKey="date" {...numberAxis} tickFormatter={formatDay} minTickGap={36}/><YAxis {...numberAxis}/><Tooltip labelFormatter={date=>formatDay(date)+' (UTC)'} contentStyle={tooltipStyle}/><Legend iconType="circle" iconSize={7} wrapperStyle={{fontSize:11,paddingTop:15}}/><Area type="linear" dataKey="created" name="Created" stroke="#9a87cc" fill="url(#report-created-gradient)" strokeWidth={2} isAnimationActive={false}/><Area type="linear" dataKey="resolved" name="Resolution events" stroke="#65a99a" fill="transparent" strokeWidth={2} isAnimationActive={false}/><Area type="linear" dataKey="reopened" name="Reopening events" stroke="#c57e9a" fill="transparent" strokeWidth={2} isAnimationActive={false}/></AreaChart></ResponsiveContainer></div>:<Empty>No recorded activity in this period. Try a longer date range.</Empty>}
    <p className="report-footnote">Repeated repairs and reopenings count as separate events. Imported status snapshots are excluded from event totals. Current-state charts above are unaffected by this date range.</p>
    <DataTable caption={`Daily ticket activity over ${days} days in UTC`} rows={report.activity} columns={[{key:'date',label:'Date (UTC)'},{key:'created',label:'Created'},{key:'resolved',label:'Resolution events'},{key:'reopened',label:'Reopening events'}]}/>
   </Panel>
   <Panel title="Module hotspots" description="Outstanding work versus resolved, tested or closed tickets in each module.">
    {report.modules.length?<div className="report-chart-scroll"><div className="report-chart" style={{height:modulesHeight}} role="img" aria-label="Outstanding and completed tickets by module"><ResponsiveContainer width="100%" height="100%" minWidth={0}><BarChart data={report.modules} layout="vertical" margin={{top:10,right:15,bottom:10,left:10}} accessibilityLayer><CartesianGrid horizontal={false} stroke="#eee8f3" strokeDasharray="3 3"/><XAxis type="number" {...numberAxis}/><YAxis type="category" dataKey="name" width={125} tickFormatter={shorten} {...numberAxis}/><Tooltip cursor={{fill:'#f8f5fc'}} contentStyle={tooltipStyle}/><Legend iconType="circle" iconSize={7} wrapperStyle={{fontSize:11,paddingTop:12}}/><Bar dataKey="outstanding" name="Outstanding" stackId="module" fill="#ac94ce" maxBarSize={22} isAnimationActive={false}/><Bar dataKey="completed" name="Resolved / tested / closed" stackId="module" fill="#8cbaad" maxBarSize={22} isAnimationActive={false}/></BarChart></ResponsiveContainer></div></div>:<Empty/>}
    <DataTable caption="Ticket totals by module" rows={report.modules} columns={[{key:'name',label:'Module'},{key:'outstanding',label:'Outstanding'},{key:'completed',label:'Resolved / tested / closed'},{key:'total',label:'Total'}]}/>
   </Panel>
   <Panel title="Team workload" description="Compare outstanding work, fixes awaiting verification and closed tickets.">
    {report.total?<div className="report-chart-scroll"><div className="report-chart" style={{height:workloadHeight}} role="img" aria-label="Tickets grouped by current assignee and completion state"><ResponsiveContainer width="100%" height="100%" minWidth={0}><BarChart data={report.workload} layout="vertical" margin={{top:10,right:15,bottom:10,left:10}} accessibilityLayer><CartesianGrid horizontal={false} stroke="#eee8f3" strokeDasharray="3 3"/><XAxis type="number" {...numberAxis}/><YAxis type="category" dataKey="name" width={125} tickFormatter={shorten} {...numberAxis}/><Tooltip cursor={{fill:'#f8f5fc'}} contentStyle={tooltipStyle}/><Legend iconType="circle" iconSize={7} wrapperStyle={{fontSize:11,paddingTop:12}}/><Bar dataKey="outstanding" name="Outstanding" stackId="workload" fill="#ac94ce" maxBarSize={22} isAnimationActive={false}/><Bar dataKey="verification" name="Resolved / tested" stackId="workload" fill="#88aacc" maxBarSize={22} isAnimationActive={false}/><Bar dataKey="closed" name="Closed" stackId="workload" fill="#8cbaad" maxBarSize={22} isAnimationActive={false}/></BarChart></ResponsiveContainer></div></div>:<Empty/>}
    <DataTable caption="Ticket counts by current assignee" rows={report.workload} columns={[{key:'name',label:'Team member'},{key:'outstanding',label:'Outstanding'},{key:'verification',label:'Resolved / tested'},{key:'closed',label:'Closed'},{key:'total',label:'Total'}]}/>
   </Panel>
  </div>
 </div>;
}
