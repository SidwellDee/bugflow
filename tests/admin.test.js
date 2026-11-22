import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createStore} from '../store.js';
import {createSuperuser} from '../bootstrap-admin.js';
import {createAccounts} from '../accounts.js';
import {createProjects} from '../projects.js';
test('bootstrap creates a verified administrator who can log in and manage existing and future projects',async()=>{
 const store=createStore(':memory:');try{
  const result=await createSuperuser(store),accounts=createAccounts(store.db),projects=createProjects(store);
  assert.equal(result.user.verified,1);assert.equal(result.user.role,'Manager');assert.equal(result.user.is_superuser,1);
  const login=await accounts.login({email:result.user.email,password:result.password});assert.equal(login.id,result.user.id);
  assert.equal(projects.data(login).projects.length,1);
  const created=projects.create({name:'Future project',description:'Created by another member',member_ids:[]},{id:2,role:'Developer'});
  projects.requireManager(created.id,login);
  assert.equal(projects.data(login).projects.length,2);
  assert.equal(projects.data(login).projects.every(project=>project.can_manage),true);
  assert.throws(()=>projects.updateMembers({project_id:created.id,member_ids:[2]},{id:2,role:'Developer'}),/administrators/);
 }finally{store.db.close()}
});
test('bootstrap is idempotent and does not reset an existing administrator password',async()=>{
 const store=createStore(':memory:');try{
  const first=await createSuperuser(store);const second=await createSuperuser(store,{password:'Different secret password'});
  assert.equal(second.created,false);assert.equal(second.user.id,first.user.id);assert.equal(second.password,undefined);
  assert.equal((await createAccounts(store.db).login({email:first.user.email,password:first.password})).id,first.user.id);
 }finally{store.db.close()}
});
test('bootstrap refuses to take over an ordinary registered email',async()=>{
 const store=createStore(':memory:');try{
  const accounts=createAccounts(store.db);await accounts.register({name:'Existing',email:'existing@example.com',password:'Existing password long'});
  await assert.rejects(createSuperuser(store,{email:'existing@example.com'}),/another account/);
  assert.equal(store.db.prepare('SELECT count(*) n FROM system_administrators').get().n,0);
 }finally{store.db.close()}
});
