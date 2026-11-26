import Icon from "./Icon.jsx";
import React,{useEffect,useRef,useState} from 'react';
export default function UserMenu({user,onAccount,onProjects,onLogout}){
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const root=useRef(null),trigger=useRef(null),first=useRef(null);
 useEffect(()=>{const outside=event=>{if(!root.current?.contains(event.target))setOpen(false)};document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside)},[]);
 useEffect(()=>{if(open)first.current?.focus()},[open]);
 function dismiss(){setOpen(false);trigger.current?.focus()}
 return <div className="user-menu" ref={root} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setOpen(false)}} onKeyDown={event=>{
  if(event.key==='Escape'){event.preventDefault();dismiss()}
  if(open&&['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
   event.preventDefault();const buttons=[...root.current.querySelectorAll('[role="menuitem"]')].filter(button=>!button.disabled),index=buttons.indexOf(document.activeElement);
   buttons[event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length]?.focus();
  }
 }}>
  <button className="user-menu-trigger" ref={trigger} aria-haspopup="menu" aria-expanded={open} aria-controls="account-menu" onClick={()=>setOpen(!open)} onKeyDown={event=>{if(['ArrowDown','ArrowUp'].includes(event.key)&&!open){event.preventDefault();setOpen(true)}}}>
   <span className="avatar">{user.name.split(' ').map(name=>name[0]).slice(0,2).join('')}</span><span className="signed-in-user"><strong>{user.name}</strong><span>{user.role}</span></span><span className="menu-chevron" aria-hidden="true"><Icon name="down" /></span>
  </button>
  {open&&<div className="user-menu-popover" id="account-menu" role="menu" aria-label="User account">
   <div className="user-menu-summary"><strong>{user.name}</strong><span>{user.email}</span></div>
   <button ref={first} role="menuitem" onClick={()=>{dismiss();onProjects()}}><Icon name="projects" /> My projects</button>
   <button role="menuitem" onClick={()=>{dismiss();onAccount()}}><Icon name="users" /> My account & team</button>
   <div className="menu-separator"/>
   <button role="menuitem" className="signout-menuitem" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{await onLogout()}catch(e){setError(e.message)}finally{setBusy(false)}}}><Icon name="logout" /> {busy?'Signing out…':'Sign out'}</button>
   {error&&<p role="alert" className="error">{error}</p>}
  </div>}
 </div>;
}
