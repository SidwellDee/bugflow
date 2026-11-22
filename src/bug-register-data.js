export function getBugPage({bugs=[],search='',status='',severity='',page=1,pageSize=10}){
  const size=[10,25,50].includes(Number(pageSize))?Number(pageSize):10;
  const query=search.trim().toLowerCase().replace(/^bug-0*/,'');
  const filtered=bugs.filter(bug=>(!status||bug.status===status)&&(!severity||bug.severity===severity)&&`${bug.id} ${bug.title}`.toLowerCase().includes(query)).sort((a,b)=>b.id-a.id);
  const total=filtered.length,pageCount=Math.max(1,Math.ceil(total/size));
  const current=Math.min(pageCount,Math.max(1,Number.isFinite(Number(page))?Math.trunc(Number(page)):1));
  const offset=(current-1)*size;
  return {rows:filtered.slice(offset,offset+size),total,pageCount,page:current,pageSize:size,from:total?offset+1:0,to:Math.min(offset+size,total)};
}

export function pageNumbers(current,total){
  if(total<=7)return Array.from({length:total},(_,index)=>index+1);
  const first=Math.max(2,Math.min(current-1,total-3)),last=Math.min(total-1,Math.max(current+1,4));
  return [1,...(first>2?['before']:[]),...Array.from({length:last-first+1},(_,index)=>first+index),...(last<total-1?['after']:[]),total];
}
