// Uses real HTTP and the production server, but a disposable database and no mail credentials.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createServer} from 'node:net';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {createVault} from '../security.js';

test('production HTTP registration, email verification and password login', {timeout:30000},async()=>{
 const temp=await mkdtemp(join(tmpdir(),'bugflow-http-'));
 const probe=createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
 const origin=`http://127.0.0.1:${port}`,key=randomBytes(32).toString('base64'),database=join(temp,'test.db');
 const child=spawn(process.execPath,['server.js','--production'],{cwd:process.cwd(),env:{...process.env,PORT:String(port),HOST:'127.0.0.1',APP_ORIGIN:origin,BUGFLOW_DB:database,TOKEN_ENCRYPTION_KEY:key,GOOGLE_CLIENT_ID:'',GOOGLE_CLIENT_SECRET:'',GMAIL_EMAIL:'',GMAIL_APP_PASSWORD:''},stdio:['ignore','pipe','pipe']});
 let logs='';child.stdout.on('data',chunk=>logs+=chunk);child.stderr.on('data',chunk=>logs+=chunk);
 const request=(path,body,cookie)=>fetch(origin+path,{method:body?'POST':'GET',headers:{Origin:origin,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{}),redirect:'manual',signal:AbortSignal.timeout(3000)});
 try{
  let ready=false;for(let i=0;i<100;i++){if(child.exitCode!==null)throw Error('Server exited: '+logs);try{if((await request('/healthz')).ok){ready=true;break}}catch{}await new Promise(resolve=>setTimeout(resolve,50))}assert.ok(ready,logs);
  assert.equal((await (await request('/api/auth/me')).json()).apiVersion,1);
  const credentials={name:'HTTP Test User',email:'registration@example.invalid',password:'HTTP verification password!',role:'Developer'};
  const registered=await request('/api/auth/register',credentials);assert.equal(registered.status,201);const user=await registered.json();assert.equal(user.user.verified,0);
  const cookie=registered.headers.get('set-cookie').split(';')[0];assert.equal((await request('/api/data',undefined,cookie)).status,403);
  await request('/api/auth/logout',{},cookie);const pendingLogin=await request('/api/auth/login',credentials);assert.equal(pendingLogin.status,200);
  const db=new DatabaseSync(database);let link;try{const body=createVault(key).open(db.prepare('SELECT body FROM mail_outbox ORDER BY id DESC LIMIT 1').get().body);link=body.match(/http:\/\/\S+\/api\/auth\/verify\?token=\S+/)[0]}finally{db.close()}
  assert.equal((await request(new URL(link).pathname+new URL(link).search)).status,302);
  const login=await request('/api/auth/login',credentials);assert.equal(login.status,200);assert.equal((await login.json()).user.verified,1);
  const session=login.headers.get('set-cookie').split(';')[0];assert.equal((await request('/api/data',undefined,session)).status,200);
 }finally{
  if(child.exitCode===null){const exited=once(child,'exit');child.kill();await exited}
  await rm(temp,{recursive:true,force:true});
 }
});
