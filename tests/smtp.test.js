import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {createStore} from '../store.js';
import {createVault} from '../security.js';
import {createGmail} from '../gmail.js';

test('Gmail SMTP sends queued verification without OAuth and never exposes password',async()=>{
 const s=createStore(':memory:');try{
  const sent=[],password='test-app-password';
  const mail=createGmail(s.db,{smtpUser:'sender@gmail.com',smtpPassword:password},createVault(randomBytes(32).toString('base64')),async()=>{throw Error('OAuth should not be used')},{sendMail:async message=>{sent.push(message);return {accepted:[message.to],rejected:[]}}});
  mail.queue('member@example.com','Verify your email','Open the verification link');
  assert.equal(mail.status().transport,'smtp');assert.equal(mail.status().connected,true);
  assert.equal(JSON.stringify(mail.status()).includes(password),false);
  await mail.flush();assert.equal(sent.length,1);assert.equal(sent[0].from.address,'sender@gmail.com');assert.equal(sent[0].to,'member@example.com');assert.equal(s.db.prepare('SELECT status FROM mail_outbox').get().status,'sent');
 }finally{s.db.close()}
});
test('SMTP authentication errors preserve email for retry and do not expose credentials',async()=>{
 const s=createStore(':memory:');try{
  const password='super-secret-test';
  const mail=createGmail(s.db,{smtpUser:'sender@gmail.com',smtpPassword:password},createVault(randomBytes(32).toString('base64')),fetch,{sendMail:async()=>{throw Error('bad password '+password)}});
  mail.queue('member@example.com','Verify','Link');await mail.flush();
  assert.equal(s.db.prepare('SELECT attempts FROM mail_outbox').get().attempts,1);
  assert.equal(s.db.prepare('SELECT status FROM mail_outbox').get().status,'pending');
  assert.match(mail.status().lastError,/App Password/);assert.equal(JSON.stringify(mail.status()).includes(password),false);
 }finally{s.db.close()}
});
