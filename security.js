import {randomBytes, createHash, scrypt as scryptCallback, timingSafeEqual, createCipheriv, createDecipheriv} from 'node:crypto';
import {promisify} from 'node:util';
import {mkdirSync, readFileSync, writeFileSync, existsSync} from 'node:fs';
const scrypt=promisify(scryptCallback);
export const token=()=>randomBytes(32).toString('base64url');
export const digest=value=>createHash('sha256').update(value).digest('hex');
export function email(value){if(typeof value!=='string'||value.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(value)||/[\r\n<>]/.test(value))throw Error('Enter a valid email address');return value.trim().toLowerCase()}
export async function hashPassword(password){if(typeof password!=='string'||password.length<12||password.length>128)throw Error('Use a password between 12 and 128 characters');const salt=randomBytes(16).toString('hex');return salt+':'+Buffer.from(await scrypt(password,salt,64)).toString('hex')}
export async function checkPassword(password,hash){if(typeof password!=='string'||password.length>128||!hash)return false;const[salt,key]=hash.split(':');const candidate=await scrypt(password,salt,64);return timingSafeEqual(candidate,Buffer.from(key,'hex'))}
export function createVault(key){if(!key){mkdirSync('.local',{recursive:true});if(!existsSync('.local/mail.key'))writeFileSync('.local/mail.key',randomBytes(32).toString('base64'),{mode:0o600,flag:'wx'});key=readFileSync('.local/mail.key','utf8').trim()}const bytes=Buffer.from(key,'base64');if(bytes.length!==32)throw Error('TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key');return {
 seal(value){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',bytes,iv);const body=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),body]).toString('base64')},
 open(value){const raw=Buffer.from(value,'base64'),decipher=createDecipheriv('aes-256-gcm',bytes,raw.subarray(0,12));decipher.setAuthTag(raw.subarray(12,28));return Buffer.concat([decipher.update(raw.subarray(28)),decipher.final()]).toString('utf8')}
}}
