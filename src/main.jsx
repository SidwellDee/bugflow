import React from 'react';
import {createRoot} from 'react-dom/client';
import {AccountGate} from './Accounts.jsx';
import Workspace from './Workspace.jsx';
import './style.css';
import './projects.css';
createRoot(document.getElementById('root')).render(
  <AccountGate>{(user,logout,onProfile)=><Workspace user={user} logout={logout} onProfile={onProfile}/>}</AccountGate>
);
