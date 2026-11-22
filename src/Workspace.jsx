import React,{useEffect,useState,lazy,Suspense} from 'react';
import Board from './Board.jsx';
import BugRegister from './BugRegister.jsx';
import Editor from './Editor.jsx';
import UserMenu from './UserMenu.jsx';
import {Team} from './Accounts.jsx';
import {ProjectsHome,CreateProject,ManageProject} from './Projects.jsx';
import {api} from './api.js';
const Reports=lazy(()=>import('./Reports.jsx')); 

export default function Workspace({user,logout,onProfile}){
 const [data,setData]=useState(null),[projectId,setProjectId]=useState(null),[page,setPage]=useState('Dashboard'),[edit,setEdit]=useState(null),[create,setCreate]=useState(false),[manage,setManage]=useState(null),[error,setError]=useState('');
 const load=async()=>{const snapshot=await api('data');setData(snapshot);return snapshot};
 useEffect(()=>{load().catch(e=>setError(e.message))},[]);
 if(!data)return <main><p role="status">{error||'Loading your projects…'}</p>{error&&<button onClick={()=>load().catch(e=>setError(e.message))}>Try again</button>}</main>;
 const project=data.projects.find(project=>project.id===projectId),home=()=>{setProjectId(null);setPage('Projects');setEdit(null);setError('')},open=id=>{setProjectId(id);setPage('Dashboard');setError('')};
 const bugs=data.bugs.filter(bug=>bug.project_id===project?.id),members=data.project_members.filter(member=>member.project_id===project?.id),projectData={...data,projects:project?[project]:[],modules:data.modules.filter(module=>module.project_id===project?.id),users:data.users.filter(member=>members.some(m=>m.user_id===member.id))};
 const out=bug=>!['Resolved','Tested','Closed'].includes(bug.status),name=(table,id)=>data[table].find(item=>item.id===id)?.name||'Unassigned';
 const counts=[['Reported total',bugs.length],['Resolved / tested',bugs.filter(bug=>['Resolved','Tested'].includes(bug.status)).length],['Outstanding',bugs.filter(out).length],['Reopened now',bugs.filter(bug=>bug.status==='Reopened').length],['Closed',bugs.filter(bug=>bug.status==='Closed').length]];
 const cards=<div className="cards">{counts.map(([label,count],index)=><div className="card" key={label}><div className="metric-label"><span className={'metric-dot metric-'+index}/>{label}</div><b>{count}</b><span className="metric-caption">In {project?.name}</span></div>)}</div>;
 const report=()=>setEdit({project_id:project.id,status:'Reported',type:'Functional',severity:'Medium',priority:'P2'});
 return <div className="app-shell"><header className="app-header"><a className="brand" href="/" onClick={event=>{event.preventDefault();home()}} aria-label="BugFlow projects"><span className="brand-mark">b</span><strong>bugflow<span>.</span></strong></a><div className="header-context">Workspace <span>/</span> {project?.name||'My projects'}</div><UserMenu user={user} onProjects={home} onAccount={()=>setPage('Team & Gmail')} onLogout={logout}/></header><main>
 {page==='Team & Gmail'?<><div className="page-heading"><div><span className="eyebrow">YOUR ACCOUNT</span><h1>Team & Gmail</h1><p>Your profile, team and email connections.</p></div><button className="secondary" onClick={home}>← My projects</button></div><Team user={user} onProfile={onProfile}/></>:!project?<ProjectsHome data={data} user={user} onOpen={open} onCreate={()=>setCreate(true)} onManage={p=>setManage(p.id)}/>:<>
 <button className="project-back" onClick={home}>← My projects</button><div className="page-heading"><div><span className="eyebrow">PROJECT WORKSPACE</span><h1>{project.name}</h1><p>{project.description}</p></div><span className="project-count">{members.length} team members · {projectData.modules.length} modules</span></div>
 <div className="navigation-row"><nav aria-label="Project pages">{['Dashboard','Bug register','Reports'].map((label,index)=><button key={label} className={page===label?'active':''} aria-current={page===label?'page':undefined} onClick={()=>setPage(label)}><span className="nav-symbol" aria-hidden="true">{['▦','☷','◷'][index]}</span>{label}</button>)}</nav><span className="demo-label"><span/>Project workspace</span></div>
 {page==='Dashboard'&&<>{cards}<div className="toolbar board-toolbar"><div><h2>Issue board <span className="total-pill">{bugs.length}</span></h2><p>Keep work moving, one ticket at a time.</p></div><button onClick={report}>＋ New ticket</button></div><Board bugs={bugs} data={projectData} actor={user.id} onOpen={setEdit} onMove={async ticket=>{await api('bugs',ticket);await load()}}/></>}
 {page==='Bug register'&&<BugRegister key={project.id} bugs={bugs} data={projectData} onOpen={setEdit} onCreate={report}/>}
 {page==='Reports'&&<>{cards}<Suspense fallback={<section><p role="status">Loading project analytics…</p></section>}><Reports project={project} data={projectData}/></Suspense></>}
 </>}
 </main><footer className="app-footer"><span>BugFlow · A little clarity for every fix.</span><span>Signed in securely · Changes are saved locally</span></footer>
 {create&&<CreateProject data={data} user={user} close={()=>setCreate(false)} onCreated={async id=>{await load();setCreate(false);open(id)}}/>}
 {manage&&data.projects.some(project=>project.id===manage)&&<ManageProject key={manage} project={data.projects.find(project=>project.id===manage)} data={data} user={user} close={()=>setManage(null)} onSaved={load}/>}
 {edit&&project&&<Editor key={edit.id||'new'} bug={edit} data={projectData} actor={user.id} close={()=>setEdit(null)} saved={async()=>{await load();setEdit(null)}}/>}
 </div>;
}
