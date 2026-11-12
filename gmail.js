import {email} from './security.js';
export function encodeMessage(to,subject,body){email(to);if(/[\r\n]/.test(subject))throw Error('Invalid subject');return Buffer.from(`To: ${to}\r\nSubject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${Buffer.from(body).toString('base64')}`).toString('base64url')}
export function createGmail(db,config,vault,fetcher=fetch){
 db.exec(`CREATE TABLE IF NOT EXISTS gmail_connection(id INTEGER PRIMARY KEY CHECK(id=1),email TEXT NOT NULL,refresh_token TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS mail_outbox(id INTEGER PRIMARY KEY,recipient TEXT NOT NULL,subject TEXT NOT NULL,body TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',attempts INTEGER NOT NULL DEFAULT 0,next_attempt INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL,sent_at TEXT);`);
 const connection=()=>db.prepare('SELECT * FROM gmail_connection WHERE id=1').get();let busy=false,lastError=null;
 return {
 status(){const c=connection();return {configured:!!(config.clientId&&config.clientSecret),connected:!!c,sender:c?.email||null,lastError,queue:db.prepare('SELECT status,count(*) count FROM mail_outbox GROUP BY status').all()}},
 connect(address,refresh){email(address);if(!refresh)throw Error('No refresh token received. Reconnect Gmail and grant consent.');db.prepare('INSERT INTO gmail_connection VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET email=excluded.email,refresh_token=excluded.refresh_token').run(address,vault.seal(refresh))},
 disconnect(){db.prepare('DELETE FROM gmail_connection').run()},
 queue(to,subject,body){email(to);db.prepare('INSERT INTO mail_outbox(recipient,subject,body,created_at) VALUES(?,?,?,?)').run(to,subject,vault.seal(body),new Date().toISOString())},
 async flush(){if(busy||!connection()||!db.prepare("SELECT id FROM mail_outbox WHERE status='pending' AND next_attempt<=? LIMIT 1").get(Date.now()))return;busy=true;try{
 const c=connection(),r=await fetcher('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({client_id:config.clientId,client_secret:config.clientSecret,refresh_token:vault.open(c.refresh_token),grant_type:'refresh_token'}),signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Gmail authorization needs reconnecting');const auth=await r.json();
 lastError=null;
 for(const message of db.prepare("SELECT * FROM mail_outbox WHERE status='pending' AND next_attempt<=? ORDER BY id LIMIT 10").all(Date.now())){try{const response=await fetcher('https://gmail.googleapis.com/gmail/v1/users/me/messages/send',{method:'POST',headers:{Authorization:'Bearer '+auth.access_token,'Content-Type':'application/json'},body:JSON.stringify({raw:encodeMessage(message.recipient,message.subject,vault.open(message.body))}),signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('Gmail send failed');db.prepare("UPDATE mail_outbox SET status='sent',sent_at=? WHERE id=?").run(new Date().toISOString(),message.id)}catch{lastError='Some emails could not be delivered. Pending messages will retry; failed messages need administrator review.';db.prepare("UPDATE mail_outbox SET attempts=attempts+1,status=CASE WHEN attempts>=4 THEN 'failed' ELSE 'pending' END,next_attempt=? WHERE id=?").run(Date.now()+60000,message.id)}}
 }catch(error){lastError='Gmail authorization or delivery failed. Check the Google app settings and reconnect Gmail.';throw error}finally{busy=false}}
 };
}
