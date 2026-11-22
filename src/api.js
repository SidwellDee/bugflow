export async function api(path,body){
  const response=await fetch('/api/'+path,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});
  const data=await response.json();
  if(!response.ok)throw Error(data.error||'The request could not be completed');
  return data;
}
