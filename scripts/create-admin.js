import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createStore} from '../store.js';
import {createSuperuser} from '../bootstrap-admin.js';
if(existsSync('.env'))process.loadEnvFile('.env');
const store=createStore(process.env.BUGFLOW_DB||'bugflow.db');
try{
 const result=await createSuperuser(store,{email:process.env.BUGFLOW_ADMIN_EMAIL,name:process.env.BUGFLOW_ADMIN_NAME,password:process.env.BUGFLOW_ADMIN_PASSWORD});
 console.log(result.created?'Verified system administrator created.':'System administrator already exists; credentials preserved.');
 console.log('Database: '+resolve(process.env.BUGFLOW_DB||'bugflow.db'));
 console.log('Email: '+result.user.email);
 if(result.created)console.log('Password: '+result.password);
 console.log('Verified: yes | Role: Manager | Access: all projects');
}finally{store.db.close()}
