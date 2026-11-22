export function createProjects(store) {
  const db = store.db;
  db.exec('CREATE TABLE IF NOT EXISTS system_administrators(user_id INTEGER PRIMARY KEY REFERENCES users(id))');
  function syncAdministrators(){db.exec("INSERT OR IGNORE INTO project_members(project_id,user_id,role) SELECT p.id,s.user_id,'Member' FROM projects p CROSS JOIN system_administrators s");}
  const existing = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='project_members'").get();
  db.exec(`CREATE TABLE IF NOT EXISTS project_members(
    project_id INTEGER NOT NULL REFERENCES projects(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    role TEXT NOT NULL DEFAULT 'Member' CHECK(role IN ('Owner','Member')),
    PRIMARY KEY(project_id,user_id));
    CREATE INDEX IF NOT EXISTS project_members_user ON project_members(user_id,project_id);`);
  // One-time migration: retain access for existing managers and people already involved in tickets.
  if (!existing) {
    db.exec(`INSERT OR IGNORE INTO project_members SELECT p.id,u.id,'Member' FROM projects p CROSS JOIN users u WHERE u.role='Manager';
      INSERT OR IGNORE INTO project_members SELECT project_id,reporter_id,'Member' FROM bugs;
      INSERT OR IGNORE INTO project_members SELECT project_id,assignee_id,'Member' FROM bugs WHERE assignee_id IS NOT NULL;`);
  }
  function denied(message='You are not assigned to this project') {const error=Error(message);error.status=403;throw error;}
  function requireMember(projectId,user) {
    syncAdministrators();
    if (!db.prepare('SELECT 1 FROM project_members WHERE project_id=? AND user_id=?').get(Number(projectId),user.id)) denied();
  }
  function requireManager(projectId,user) {
    requireMember(projectId,user);
    const member=db.prepare('SELECT role FROM project_members WHERE project_id=? AND user_id=?').get(Number(projectId),user.id);
    if(user.role!=='Manager'&&member.role!=='Owner')denied('Only the project owner or an assigned manager can manage this project');
  }
  function members(values) {
    if(!Array.isArray(values)||values.some(id=>!Number.isSafeInteger(id)))throw Error('Choose valid project members');
    const ids=[...new Set(values)];
    for(const id of ids)if(!db.prepare('SELECT id FROM users WHERE id=?').get(id))throw Error('Unknown project member');
    return ids;
  }
  function transaction(action) {db.exec('BEGIN IMMEDIATE');try{const result=action();db.exec('COMMIT');return result;}catch(error){db.exec('ROLLBACK');throw error;}}
  return {
    requireMember,requireManager,
    data(user) {
      syncAdministrators();
      const snapshot=store.data();
      const memberships=db.prepare('SELECT * FROM project_members').all();
      const ids=new Set(memberships.filter(member=>member.user_id===user.id).map(member=>member.project_id));
      const bugs=snapshot.bugs.filter(bug=>ids.has(bug.project_id));
      const bugIds=new Set(bugs.map(bug=>bug.id));
      return {...snapshot,projects:snapshot.projects.filter(project=>ids.has(project.id)).map(project=>({...project,can_manage:user.role==='Manager'||memberships.some(m=>m.project_id===project.id&&m.user_id===user.id&&m.role==='Owner')})),modules:snapshot.modules.filter(module=>ids.has(module.project_id)),bugs,history:snapshot.history.filter(event=>bugIds.has(event.bug_id)),project_members:memberships.filter(member=>ids.has(member.project_id))};
    },
    create(d,user) {
      const ids=members(d.member_ids||[]);
      return transaction(()=>{
        const result=store.project(d);
        const insert=db.prepare('INSERT INTO project_members(project_id,user_id,role) VALUES(?,?,?)');
        insert.run(result.id,user.id,'Owner');
        for(const id of ids)if(id!==user.id)insert.run(result.id,id,'Member');
        syncAdministrators();
        return result;
      });
    },
    updateMembers(d,user) {
      requireManager(d.project_id,user);
      const ids=members(d.member_ids);
      return transaction(()=>{
        const owners=db.prepare("SELECT user_id FROM project_members WHERE project_id=? AND role='Owner'").all(d.project_id).map(m=>m.user_id);
        if(!ids.includes(user.id)||owners.some(id=>!ids.includes(id)))throw Error('Keep the project owner and yourself assigned');
        const administrators=db.prepare('SELECT user_id FROM system_administrators').all();
        if(administrators.some(admin=>!ids.includes(admin.user_id)))throw Error('System administrators must remain assigned to every project');
        const assignees=db.prepare('SELECT DISTINCT assignee_id FROM bugs WHERE project_id=? AND assignee_id IS NOT NULL').all(d.project_id);
        if(assignees.some(bug=>!ids.includes(bug.assignee_id)))throw Error('Reassign this member’s tickets before removing them from the project');
        db.prepare("DELETE FROM project_members WHERE project_id=? AND role!='Owner'").run(d.project_id);
        const insert=db.prepare("INSERT OR IGNORE INTO project_members VALUES(?,?,'Member')");
        for(const id of ids)insert.run(d.project_id,id);
        return {ok:true};
      });
    },
    module(d,user) {requireManager(d.project_id,user);return store.module(d);},
    validateBug(d,user) {
      requireMember(d.project_id,user);
      if(d.id){const old=db.prepare('SELECT project_id FROM bugs WHERE id=?').get(d.id);if(old)requireMember(old.project_id,user);}
      if(d.assignee_id&&!db.prepare('SELECT 1 FROM project_members WHERE project_id=? AND user_id=?').get(d.project_id,d.assignee_id))throw Error('The assignee must be a member of this project');
    },
    export(user,projectId) {
      if(projectId)requireMember(projectId,user);
      const ids=new Set(this.data(user).projects.map(project=>project.id));
      // Keep export column names unchanged while restricting rows by project ID.
      return store.export().filter(row=>{
        const bug=db.prepare('SELECT project_id FROM bugs WHERE id=?').get(row.id);
        return ids.has(bug.project_id)&&(!projectId||bug.project_id===Number(projectId));
      });
    }
  };
}
