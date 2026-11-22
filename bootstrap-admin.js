import {randomBytes} from 'node:crypto';
import {email,hashPassword} from './security.js';
import {createAccounts} from './accounts.js';
import {createProjects} from './projects.js';

export async function createSuperuser(store,options={}){
 const accounts=createAccounts(store.db);
 createProjects(store);
 const address=email(options.email||'admin@bugflow.local'),name=options.name||'System Administrator';
 if(typeof name!=='string'||!name.trim()||name.length>100)throw Error('Administrator name must be between 1 and 100 characters');
 const existing=store.db.prepare('SELECT a.user_id,s.user_id administrator FROM accounts a LEFT JOIN system_administrators s ON s.user_id=a.user_id WHERE a.email=?').get(address);
 if(existing){if(!existing.administrator)throw Error('That email belongs to another account. Choose a different administrator email.');return {created:false,user:accounts.profile(existing.user_id)}}
 const password=options.password||'Bf!'+randomBytes(18).toString('base64url'),hash=await hashPassword(password);
 store.db.exec('BEGIN IMMEDIATE');
 try{
  const id=Number(store.db.prepare("INSERT INTO users(name,role) VALUES(?,'Manager')").run(name.trim()).lastInsertRowid);
  store.db.prepare('INSERT INTO accounts(user_id,email,password_hash,verified,notifications,created_at) VALUES(?,?,?,1,0,?)').run(id,address,hash,new Date().toISOString());
  store.db.prepare('INSERT INTO system_administrators(user_id) VALUES(?)').run(id);
  store.db.prepare("INSERT OR IGNORE INTO project_members(project_id,user_id,role) SELECT id,?,'Member' FROM projects").run(id);
  store.db.exec('COMMIT');return {created:true,user:accounts.profile(id),password};
 }catch(error){store.db.exec('ROLLBACK');throw error}
}
