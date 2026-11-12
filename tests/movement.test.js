import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createStore} from '../store.js';
import {statusNames, states, canMove} from '../workflow.js';

test('board and editor expose every other status from each column', () => {
  for (const from of statusNames) {
    assert.equal(states[from].length, 6);
    for (const to of statusNames) assert.equal(canMove(from, to), from !== to);
  }
  assert.equal(canMove('Unknown', 'Reported'), false);
});

for (const actor of [1, 2, 3, 4]) {
  test(`every forward and backward move persists with history for team member ${actor}`, () => {
    const store = createStore(':memory:');
    try {
      // Exercise all 42 direction pairs using the same payload sent by the board.
      for (const from of statusNames) {
        for (const to of statusNames.filter(status => status !== from)) {
          const original = store.data().bugs.find(bug => bug.id === 1);
          store.db.prepare('UPDATE bugs SET status=?,assignee_id=2,resolution=? WHERE id=1').run(from, 'Verified repair');
          const bug = store.data().bugs.find(bug => bug.id === 1);
          const before = store.data().history.length;
          store.save({...bug, status: to, actor_id: actor, note: to === 'Reopened' ? 'Retest failed' : 'Moved on the project board.'});
          const snapshot = store.data();
          const saved = snapshot.bugs.find(bug => bug.id === 1);
          assert.equal(saved.status, to, `${from} → ${to}`);
          assert.equal(saved.version, original.version + 1);
          assert.equal(snapshot.history.length, before + 1);
          assert.deepEqual(JSON.parse(snapshot.history[0].changes).status, {from, to});
          assert.equal(snapshot.history[0].actor_id, actor);
        }
      }
    } finally {store.db.close();}
  });
}

test('backward moves preserve resolution and can return to unassigned Reported', () => {
  const store = createStore(':memory:');
  try {
    const closed = store.data().bugs.find(bug => bug.status === 'Closed');
    store.save({...closed, status: 'Reported', assignee_id: null, actor_id: 3, note: 'Return to triage'});
    const bug = store.data().bugs.find(bug => bug.id === closed.id);
    assert.equal(bug.status, 'Reported');
    assert.equal(bug.assignee_id, null);
    assert.equal(bug.resolution, closed.resolution);
  } finally {store.db.close();}
});
