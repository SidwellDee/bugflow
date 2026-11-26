import Icon from "./Icon.jsx";
import React,{useEffect,useState} from 'react';
import {api} from './api.js';

function Dialog({title,close,children}){
 useEffect(()=>{const handler=event=>{if(event.key==='Escape')close()};document.addEventListener('keydown',handler);return()=>document.removeEventListener('keydown',handler)},[close]);
 return <div className="modalback"><div className="modal project-dialog" role="dialog" aria-modal="true" aria-labelledby="project-dialog-title"><div className="toolbar"><h2 id="project-dialog-title" style={{flex:1}}>{title}</h2><button className="secondary" type="button" onClick={close}><Icon name="close" /> Close</button></div>{children}</div></div>;
}

export function ProjectsHome({data,user,onOpen,onManage,onCreate}){
 return <><div className="page-heading"><div><span className="eyebrow">YOUR WORKSPACE, IN FOCUS</span><h1>Your projects</h1><p>Welcome back, {user.name.split(' ')[0]}. Choose a project to see its dashboard.</p></div><span className="project-count">{data.projects.length} assigned {data.projects.length===1?'project':'projects'}</span></div>
 {!data.projects.length&&<div className="projects-empty"><h2>No projects assigned yet</h2><p>A project owner can add you to their team, or you can create your first project below.</p></div>}
 <div className="project-card-grid">{data.projects.map((project,index)=>{
  const bugs=data.bugs.filter(bug=>bug.project_id===project.id),closed=bugs.filter(bug=>bug.status==='Closed').length,outstanding=bugs.filter(bug=>!['Closed','Tested','Resolved'].includes(bug.status)).length,members=data.project_members.filter(member=>member.project_id===project.id);
  return <article className="project-card" key={project.id}>
   <button className="project-card-open" onClick={()=>onOpen(project.id)} aria-label={`Open ${project.name} dashboard`}>
    <div className="project-card-top"><span className={`project-icon project-color-${index%4}`}>{project.name.split(' ').map(word=>word[0]).slice(0,2).join('')}</span><span className="badge">{outstanding} outstanding</span></div>
    <h2>{project.name}</h2><p className="project-description">{project.description}</p>
    <div className="project-card-stats"><span><strong>{bugs.length}</strong> tickets</span><span><strong>{data.modules.filter(module=>module.project_id===project.id).length}</strong> modules</span><span><strong>{members.length}</strong> members</span></div>
    <div className="project-progress"><span>Closed tickets</span><span>{closed} / {bugs.length}</span></div><div className="bar"><i style={{width:(bugs.length?closed/bugs.length*100:0)+'%'}}/></div>
    <span className="project-open-label">Open dashboard <Icon name="forward" /></span>
   </button>
   <div className="project-card-footer"><span className="muted">{members.find(member=>member.user_id===user.id)?.role==='Owner'?'Project owner':'Team member'}</span><button className="project-manage-button" onClick={()=>onManage(project)}><Icon name="settings" /> {project.can_manage?'Manage project':'View modules & team'}</button></div>
  </article>;
 })}<button className="create-project-card" onClick={onCreate}><span aria-hidden="true"><Icon name="plus" /></span><strong>Create a project</strong><small>Organise modules, assign your team<br/>and keep every issue in view.</small></button></div></>;
}

export function CreateProject({data,user,close,onCreated}){
 const [selected,setSelected]=useState([user.id]),[busy,setBusy]=useState(false),[error,setError]=useState('');
 return <Dialog title="Create a project" close={close}><p>Give your team a focused workspace. You will be assigned as its owner.</p><form onSubmit={async event=>{
  event.preventDefault();const values=Object.fromEntries(new FormData(event.currentTarget));setBusy(true);setError('');try{const result=await api('projects',{...values,member_ids:selected});await onCreated(result.id)}catch(e){setError(e.message)}finally{setBusy(false)}
 }}><label>Project name<input name="name" required maxLength={100} autoFocus/></label><label>Description<textarea name="description" required maxLength={5000}/></label><fieldset className="member-picker"><legend>Assign team members</legend>{data.users.map(member=><label key={member.id}><input type="checkbox" checked={selected.includes(member.id)} disabled={member.id===user.id} onChange={event=>setSelected(event.target.checked?[...selected,member.id]:selected.filter(id=>id!==member.id))}/><span>{member.name}<small>{member.id===user.id?'You · Project owner':member.role}</small></span></label>)}</fieldset>{error&&<p role="alert" className="error">{error}</p>}<button disabled={busy}>{busy?'Creating…':'Create project'}</button></form></Dialog>;
}

export function ManageProject({project,data,user,close,onSaved}){
 const original=data.project_members.filter(member=>member.project_id===project.id),[selected,setSelected]=useState(original.map(member=>member.user_id)),[tab,setTab]=useState('Modules'),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const modules=data.modules.filter(module=>module.project_id===project.id);
 return <Dialog title={project.name} close={close}><p>{project.description}</p><div className="editor-tabs">{['Modules','Members'].map(name=><button type="button" key={name} className={tab===name?'selected':''} onClick={()=>{setTab(name);setError('');setMessage('')}}>{name}</button>)}</div>
 {tab==='Modules'&&<><div className="module-list">{modules.length?modules.map(module=><div key={module.id}><span className="module-symbol" aria-hidden="true">▱</span><span>{module.name}</span><small>{data.bugs.filter(bug=>bug.module_id===module.id).length} tickets</small></div>):<p>No modules yet. Add the first program module below.</p>}</div>{project.can_manage&&<form onSubmit={async event=>{event.preventDefault();const form=event.currentTarget,values=Object.fromEntries(new FormData(form));setBusy(true);setError('');try{await api('modules',{name:values.name,project_id:project.id});form.reset();await onSaved();setMessage('Module added.')}catch(e){setError(e.message)}finally{setBusy(false)}}}><label>New module name<input name="name" required maxLength={100} placeholder="e.g. Authentication"/></label><button disabled={busy}>{busy?'Adding…':'Add module'}</button></form>}</>}
 {tab==='Members'&&<form onSubmit={async event=>{event.preventDefault();setBusy(true);setError('');try{await api('projects/members',{project_id:project.id,member_ids:selected});await onSaved();setMessage('Project assignments updated.')}catch(e){setError(e.message)}finally{setBusy(false)}}}><p className="auth-hint">Assigned members will see this project after signing in. Owners remain assigned.</p><fieldset className="member-picker"><legend>Project team</legend>{data.users.filter(member=>project.can_manage||original.some(m=>m.user_id===member.id)).map(member=><label key={member.id}><input type="checkbox" checked={selected.includes(member.id)} disabled={!project.can_manage||member.id===user.id||original.some(m=>m.user_id===member.id&&m.role==='Owner')} onChange={event=>setSelected(event.target.checked?[...selected,member.id]:selected.filter(id=>id!==member.id))}/><span>{member.name}<small>{original.find(m=>m.user_id===member.id)?.role==='Owner'?'Project owner':member.role}</small></span></label>)}</fieldset>{project.can_manage&&<button disabled={busy}>{busy?'Saving…':'Save assignments'}</button>}</form>}
 {error&&<p role="alert" className="error">{error}</p>}{message&&<p role="status" className="board-message">{message}</p>}
 </Dialog>;
}
