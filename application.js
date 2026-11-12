import {OAuth2Client} from 'google-auth-library';
import {createHash} from 'node:crypto';
import {createAccounts} from './accounts.js';
import {createGmail} from './gmail.js';
import {createVault} from './security.js';

export function createApplication(store, config, dependencies={}) {
 const accounts=createAccounts(store.db), gmail=createGmail(store.db,config,dependencies.vault||createVault(config.encryptionKey),dependencies.fetcher);
 const google=dependencies.google||new OAuth2Client(config.clientId);
 const fetcher=dependencies.fetcher||fetch;
 const secure=config.origin.startsWith('https:');
 const cookie=(name,value,age)=>`${name}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${age}${secure?'; Secure':''}`;
 const cookies=req=>Object.fromEntries((req.headers.cookie||'').split(';').map(p=>p.trim().split('=')));
 const limiter=new Map();
 const deliver=()=>gmail.flush().catch(()=>console.warn('Gmail delivery is pending; check the connection in Team & Gmail.'));
 function rate(req,action,max=12){const key=req.socket.remoteAddress+':'+action,now=Date.now();for(const[k,v]of limiter)if(v.until<now)limiter.delete(k);let item=limiter.get(key);if(!item){item={count:0,until:now+900000};limiter.set(key,item)}if(++item.count>max){const e=Error('Too many attempts. Try again in 15 minutes.');e.status=429;throw e}}
 function verifyMail(user){const value=accounts.verification(user.id);gmail.queue(user.email,'Verify your BugFlow email',`Hello ${user.name},\n\nVerify your email to access BugFlow:\n${config.origin}/api/auth/verify?token=${value}\n\nThis link expires in 24 hours. If you did not register, ignore this message.`);void deliver()}
 function authorize(purpose,req,res,user){if(!config.clientId||!config.clientSecret)throw Error('Google is not configured. Follow GOOGLE_SETUP.md.');const flow=accounts.flow(purpose,user?.id);res.setHeader('Set-Cookie',cookie('bugflow_oauth',flow.state,600));const params=new URLSearchParams({client_id:config.clientId,redirect_uri:config.origin+'/api/auth/google/callback',response_type:'code',scope:'openid email profile'+(purpose==='gmail'?' https://www.googleapis.com/auth/gmail.send':''),state:flow.state,nonce:flow.nonce,code_challenge:createHash('sha256').update(flow.verifier).digest('base64url'),code_challenge_method:'S256',...(purpose==='gmail'?{access_type:'offline',prompt:'consent'}:{})});return 'https://accounts.google.com/o/oauth2/v2/auth?'+params}
 const current=req=>accounts.current(cookies(req).bugflow_session);
 const timer=setInterval(()=>void deliver(),60000);timer.unref();
 return {accounts,gmail,close:()=>clearInterval(timer),async handle(req,res,url,send){
  if(!url.pathname.startsWith('/api/'))return false;
  const path=url.pathname,user=current(req);
  try{
   let d;
   if(req.method==='POST'){
    if(req.headers.origin!==config.origin){const e=Error('Request origin is not allowed');e.status=403;throw e}
    if(!req.headers['content-type']?.startsWith('application/json'))throw Error('Use JSON requests');
    let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>100000){const e=Error('Request too large');e.status=413;throw e}}d=JSON.parse(raw);
   }
   const session=u=>{res.setHeader('Set-Cookie',cookie('bugflow_session',accounts.session(u.id),604800));return u};
   if(req.method==='GET'&&path==='/api/auth/me')return send({user,googleConfigured:!!(config.clientId&&config.clientSecret)});
   if(req.method==='POST'&&path==='/api/auth/register'){rate(req,'register',5);const u=await accounts.register(d);verifyMail(u);return send({user:session(u),message:'Account created. Verify your email before entering the workspace.',mailConnected:gmail.status().connected},201)}
   if(req.method==='POST'&&path==='/api/auth/login'){rate(req,'login');return send({user:session(await accounts.login(d))})}
   if(req.method==='POST'&&path==='/api/auth/logout'){accounts.logout(cookies(req).bugflow_session);res.setHeader('Set-Cookie',cookie('bugflow_session','',0));return send({ok:true})}
   if(req.method==='GET'&&path==='/api/auth/verify'){rate(req,'verify',30);const u=accounts.verify(url.searchParams.get('token'));session(u);res.writeHead(302,{'Location':'/?notice=verified','Referrer-Policy':'no-referrer'});res.end();return}
   if(req.method==='GET'&&path==='/api/auth/google'){rate(req,'google',30);const location=authorize('login',req,res);res.writeHead(302,{Location:location});res.end();return}
   if(req.method==='GET'&&path==='/api/auth/google/callback'){
    const flow=accounts.consumeFlow(url.searchParams.get('state'),cookies(req).bugflow_oauth);res.setHeader('Set-Cookie',cookie('bugflow_oauth','',0));
    if(url.searchParams.has('error'))throw Error('Google consent was cancelled. Please try again.');
    const response=await fetcher('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({code:url.searchParams.get('code')||'',client_id:config.clientId,client_secret:config.clientSecret,redirect_uri:config.origin+'/api/auth/google/callback',grant_type:'authorization_code',code_verifier:flow.verifier}),signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw Error('Google authorization failed. Please try again.');const tokens=await response.json();
    let claims;try{const ticket=await google.verifyIdToken({idToken:tokens.id_token,audience:config.clientId});claims=ticket.getPayload()}catch{throw Error('Google identity could not be verified. Please try again.')}if(claims.nonce!==flow.nonce||!claims.email_verified)throw Error('Google identity could not be verified');
    if(flow.purpose==='gmail'){
     if(!user||user.id!==flow.user_id||user.role!=='Manager')throw Error('Sign in as the manager who started this Gmail connection');
     if(!(tokens.scope||'').split(' ').includes('https://www.googleapis.com/auth/gmail.send'))throw Error('Allow the Gmail send permission to connect notifications');
     gmail.connect(claims.email,tokens.refresh_token);
     // Connecting a mailbox verifies only the same account's address.
     if(claims.email.toLowerCase()===user.email.toLowerCase())store.db.prepare('UPDATE accounts SET verified=1 WHERE user_id=?').run(user.id);
     void deliver();
    }else session(accounts.google(claims));
    res.writeHead(302,{Location:'/?notice='+ (flow.purpose==='gmail'?'gmail-connected':'signed-in')});res.end();return;
   }
   if(!user){const e=Error('Sign in to continue');e.status=401;throw e}
   if(req.method==='POST'&&path==='/api/auth/resend'){rate(req,'resend',5);if(!user.verified)verifyMail(user);return send({message:gmail.status().connected?'Verification email queued. Check your inbox.':'Verification queued. Ask the workspace manager to connect Gmail.'})}
   if(req.method==='GET'&&path==='/api/mail/status')return send(gmail.status());
   if(path.startsWith('/api/mail/')&&req.method==='POST'){
    if(user.role!=='Manager'){const e=Error('Manager access required');e.status=403;throw e}
    if(path==='/api/mail/connect')return send({url:authorize('gmail',req,res,user)});
    if(path==='/api/mail/disconnect'){gmail.disconnect();return send({ok:true})}
    if(path==='/api/mail/test'){if(!user.verified)throw Error('Verify your email first');if(!gmail.status().connected)throw Error('Connect Gmail first');rate(req,'test',5);gmail.queue(user.email,'BugFlow Gmail connection test','Your BugFlow workspace can send email through Gmail.');void deliver();return send({message:'Test email queued to your registered address.'})}
   }
   if(!user.verified){const e=Error('Verify your email before entering the workspace');e.status=403;throw e}
   if(req.method==='GET'&&path==='/api/data')return send(store.data());
   if(req.method==='GET'&&path==='/api/team')return send({users:accounts.list().map(u=>({...u,email:user.role==='Manager'||u.id===user.id?u.email:undefined})),me:user});
   if(req.method==='POST'&&path==='/api/team/role'){if(user.role!=='Manager'){const e=Error('Manager access required');e.status=403;throw e}accounts.role(Number(d.id),d.role,user.id);return send({ok:true})}
   if(req.method==='POST'&&path==='/api/team/preferences')return send({user:accounts.preference(user.id,d.notifications)});
   if(req.method==='GET'&&path==='/api/export'){const rows=store.export(),cell=v=>'"'+String(v??'').replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';res.setHeader('Content-Disposition','attachment; filename="bugflow-all-projects.csv"');return send(rows.length?[Object.keys(rows[0]).map(cell).join(','),...rows.map(r=>Object.values(r).map(cell).join(','))].join('\r\n'):'',200,'text/csv')}
   if(req.method==='POST'&&path==='/api/bugs'){
    const before=d.id?store.data().bugs.find(b=>b.id===d.id):null;
    const result=store.save({...d,actor_id:user.id});const bug=store.data().bugs.find(b=>b.id===result.id);
    if(!before||before.status!==bug.status||before.assignee_id!==bug.assignee_id){for(const id of new Set([bug.assignee_id,bug.reporter_id])){const recipient=accounts.profile(id);if(recipient?.verified&&recipient.notifications)gmail.queue(recipient.email,`BugFlow BUG-${bug.id}: ${bug.status}`,`Ticket: ${bug.title}\nStatus: ${bug.status}\nUpdated by: ${user.name}\n\nOpen the workspace: ${config.origin}`)}void deliver()}
    return send(result,201);
   }
   if(req.method==='POST'&&path==='/api/projects')return send(store.project(d),201);
   if(req.method==='POST'&&path==='/api/modules')return send(store.module(d),201);
   return send({error:'Not found'},404);
  }catch(e){
   if(path==='/api/auth/google/callback'){res.writeHead(302,{Location:'/?auth_error='+encodeURIComponent(e.message)});res.end();return}
   return send({error:e.message},e.status||400);
  }
 }};
}
