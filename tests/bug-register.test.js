import {test} from 'node:test';
import assert from 'node:assert/strict';
import {getBugPage,pageNumbers} from '../src/bug-register-data.js';
const tickets=Array.from({length:33},(_,index)=>({id:index+1,title:`Ticket ${index+1}`,status:index%2?'Assigned':'Reported',severity:index%3?'Medium':'High'}));
test('register pages preserve all tickets without duplication and put newest first',()=>{
  const pages=[1,2,3,4].map(page=>getBugPage({bugs:tickets,page}));
  assert.deepEqual(pages.map(page=>page.rows.length),[10,10,10,3]);
  assert.deepEqual(pages.map(page=>[page.from,page.to]),[[1,10],[11,20],[21,30],[31,33]]);
  assert.deepEqual(pages.flatMap(page=>page.rows.map(bug=>bug.id)),Array.from({length:33},(_,index)=>33-index));
  assert.equal(tickets[0].id,1);
});
test('search and filters apply across the entire register before pagination',()=>{
  const result=getBugPage({bugs:tickets,status:'Reported',severity:'High',pageSize:10});
  assert.deepEqual(result.rows.map(bug=>bug.id),[31,25,19,13,7,1]);assert.equal(result.total,6);assert.equal(result.pageCount,1);
  assert.equal(getBugPage({bugs:tickets,search:'BUG-032'}).rows[0].id,32);
  assert.equal(getBugPage({bugs:tickets,search:' ticket 33 '}).rows[0].id,33);
});
test('page size changes and data shrinking clamp navigation to valid pages',()=>{
  const large=getBugPage({bugs:tickets,pageSize:25,page:2});assert.equal(large.rows.length,8);assert.equal(large.from,26);
  const shrunk=getBugPage({bugs:tickets.slice(0,2),page:4});assert.equal(shrunk.page,1);assert.equal(shrunk.rows.length,2);
  assert.equal(getBugPage({bugs:tickets,page:-2}).page,1);assert.equal(getBugPage({bugs:tickets,page:99}).page,4);
});
test('empty filter results show zero tickets with a valid disabled navigation state',()=>{
  const result=getBugPage({bugs:tickets,search:'nonexistent',page:4});assert.equal(result.total,0);assert.equal(result.page,1);assert.equal(result.pageCount,1);assert.equal(result.from,0);assert.equal(result.to,0);assert.deepEqual(result.rows,[]);
});
test('page number windows expose first, last and current page with stable gaps',()=>{
  assert.deepEqual(pageNumbers(1,3),[1,2,3]);assert.deepEqual(pageNumbers(1,20),[1,2,3,4,'after',20]);assert.deepEqual(pageNumbers(10,20),[1,'before',9,10,11,'after',20]);assert.deepEqual(pageNumbers(20,20),[1,'before',17,18,19,20]);
});
