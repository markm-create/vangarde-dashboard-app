import React, { useState, useEffect } from 'react';
import { 
  Save, 
  User, 
  Shield, 
  Layout, 
  CheckCircle2, 
  ListTodo,
  Users,
  Eye,
  EyeOff,
  Plus,
  X,
  Lock,
  Fingerprint,
  Laptop,
  RotateCcw,
  Trash2,
  AlertTriangle,
  UserPlus,
  ChevronDown,
  Moon,
  Sun,
  UserCheck,
  Settings
} from 'lucide-react';
import { useData } from '../DataContext';
import { AppUser, AppPermissions } from '../types';
import { DEFAULT_PERMISSIONS, getDefaultPermissionsForRole, USER_SCRIPT_URL, CONFIG } from '../constants';

// --- GOOGLE SHEETS CONFIGURATION ---
const STORAGE_KEY = CONFIG.STORAGE_KEY;

type SettingsTab = 'general' | 'access';

interface UserSettingsProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  currentUser: AppUser;
}

const getCookie = (name: string) => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

const ROLE_PRIORITY: Record<string, number> = {
  'CEO': 0,
  'Developer': 1,
  'Manager': 2,
  'Administrator': 3,
  'Collector': 4,
  'Viewer': 5
};

const sortUsers = (users: AppUser[]) => {
  return [...users].sort((a, b) => {
    const priorityA = ROLE_PRIORITY[a.role] ?? 99;
    const priorityB = ROLE_PRIORITY[b.role] ?? 99;
    if (priorityA !== priorityB) return priorityA - priorityB;
    return a.name.localeCompare(b.name);
  });
};

const UserSettings: React.FC<UserSettingsProps> = ({ isDarkMode, onToggleDarkMode, currentUser: loggedInUser }) => {
  const { collectors, fetchCollectors } = useData();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [users, setUsers] = useState<AppUser[]>([]);

  useEffect(() => {
    fetchCollectors();
  }, [fetchCollectors]);
  const [selectedEmail, setSelectedEmail] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isCreating, setIsCreating] = useState(false);
  const [newPermissions, setNewPermissions] = useState<AppPermissions>(DEFAULT_PERMISSIONS);

  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<AppUser['role']>('Collector');
  const [showPassword, setShowPassword] = useState(false);

  const getLatestUsersFromStorage = (): AppUser[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: AppUser[] = JSON.parse(stored);
        return sortUsers(parsed);
      }
    } catch (e) {
      console.error("Failed to parse users", e);
    }
    return [];
  };

  useEffect(() => {
    const initUsers = () => {
      const sortedUsers = getLatestUsersFromStorage();
      if (sortedUsers.length > 0) {
        setUsers(sortedUsers);
        const foundSelf = sortedUsers.find(u => u.email.toLowerCase() === loggedInUser.email.toLowerCase());
        setSelectedEmail(foundSelf ? foundSelf.email : sortedUsers[0].email);
      } else {
        const initialUsers: AppUser[] = [{
          name: 'Mark Mojica',
          email: 'mark.mojica@vangardegroup.com',
          username: 'mmojica',
          password: 'password123',
          role: 'Developer',
          lastLogin: new Date().toISOString(),
          permissions: getDefaultPermissionsForRole('Developer', 'mark.mojica@vangardegroup.com')
        }];
        setUsers(initialUsers);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialUsers));
        setSelectedEmail(initialUsers[0].email);
      }
    };
    initUsers();
    window.addEventListener('vg_user_update', initUsers);
    return () => window.removeEventListener('vg_user_update', initUsers);
  }, [loggedInUser.email]);

  useEffect(() => {
    if (isCreating) return;
    const user = users.find(u => u.email.toLowerCase() === selectedEmail.toLowerCase());
    if (user) {
      setEditName(user.name);
      setEditEmail(user.email);
      setEditUsername(user.username || '');
      setEditPassword(user.password || '');
      setEditRole(user.role);
    }
  }, [selectedEmail, users, isCreating]);

  const applyRoleDefaults = (role: AppUser['role'], email: string) => {
    const defaults = getDefaultPermissionsForRole(role, email);
    if (isCreating) {
      setNewPermissions(defaults);
    } else {
      updateUserLocally(defaults);
    }
  };

  const currentEditedUser = isCreating 
    ? { name: editName, email: editEmail, username: editUsername, password: editPassword, role: editRole, lastLogin: new Date().toISOString(), permissions: newPermissions } as AppUser 
    : users.find(u => u.email.toLowerCase() === selectedEmail.toLowerCase());

  const handleStartCreate = () => {
    setIsCreating(true);
    setEditName('');
    setEditEmail('');
    setEditUsername('');
    setEditPassword('');
    setEditRole('Collector');
    setNewPermissions(getDefaultPermissionsForRole('Collector'));
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    const user = users.find(u => u.email.toLowerCase() === selectedEmail.toLowerCase());
    if (user) {
      setEditName(user.name);
      setEditEmail(user.email);
      setEditUsername(user.username || '');
      setEditPassword(user.password || '');
      setEditRole(user.role);
    }
  };

  // --- UPDATED: CLOUD DELETE SYNC ---
  const handleDeleteUser = async () => {
    console.log("handleDeleteUser triggered. selectedEmail:", selectedEmail);
    if (!selectedEmail) {
      alert("No user selected to delete.");
      return;
    }
    const targetEmail = selectedEmail.toLowerCase();
    
    if (targetEmail === 'mark.mojica@vangardegroup.com') {
      alert("CRITICAL ERROR: The primary Developer account cannot be deleted.");
      return;
    }

    const confirmation = window.prompt(`To permanently delete user "${editName}", please type the word DELETE below:`);
    console.log("Confirmation prompt result:", confirmation);
    
    if (confirmation && confirmation.trim().toUpperCase() === "DELETE") {
      setIsSaving(true);
      try {
        console.log("Deleting user from cloud:", targetEmail);
        // Delete from Google Sheet
        const response = await fetch(USER_SCRIPT_URL, {
          method: "POST",
          mode: 'cors',
          credentials: 'omit',
          redirect: 'follow',
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: JSON.stringify({ action: "deleteUser", email: targetEmail })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("Delete response:", result);

        if (result.status === "success") {
          const existingUsers = getLatestUsersFromStorage();
          const updatedUsers = existingUsers.filter(u => u.email.toLowerCase() !== targetEmail);
          saveToStorage(updatedUsers);
          
          if (updatedUsers.length > 0) {
            setSelectedEmail(updatedUsers[0].email);
          } else {
            setSelectedEmail('');
            setEditName('');
            setEditEmail('');
          }
        } else {
          alert(`Error: ${result.message || "Cloud database failed to delete user."}`);
        }
      } catch (error) {
        console.error("Delete failed", error);
        alert("Network Error: Could not connect to the database.");
      } finally {
        setIsSaving(false);
      }
    } else if (confirmation !== null) {
      alert("Incorrect confirmation word. Deletion aborted. You must type DELETE exactly.");
    }
  };

  const handlePermissionToggle = (key: keyof AppPermissions) => {
    if (isCreating) {
      setNewPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    } else {
      if (!currentEditedUser) return;
      const currentPerms = currentEditedUser.permissions || DEFAULT_PERMISSIONS;
      const updatedPermissions = { ...currentPerms, [key]: !currentPerms[key] };
      updateUserLocally(updatedPermissions);
    }
  };

  const handleCollectorToggle = (collectorId: string) => {
    let currentIds: string[] = [];
    if (isCreating) currentIds = newPermissions.allowedCollectorIds || [];
    else if (currentEditedUser) currentIds = (currentEditedUser.permissions?.allowedCollectorIds) || [];

    const newIds = currentIds.includes(collectorId) ? currentIds.filter(id => id !== collectorId) : [...currentIds, collectorId];

    if (isCreating) setNewPermissions(prev => ({ ...prev, allowedCollectorIds: newIds }));
    else if (currentEditedUser) {
      const currentPerms = currentEditedUser.permissions || DEFAULT_PERMISSIONS;
      const updatedPermissions = { ...currentPerms, allowedCollectorIds: newIds };
      updateUserLocally(updatedPermissions);
    }
  };

  const updateUserLocally = (permissions: AppPermissions) => {
    const updatedUsers = users.map(user => {
      if (user.email.toLowerCase() === selectedEmail.toLowerCase()) {
        return { ...user, permissions };
      }
      return user;
    });
    setUsers(updatedUsers);
    setShowSuccess(false);
  };

  // --- UPDATED: CLOUD SAVE/UPDATE SYNC ---
  const handleSave = async () => {
    setIsSaving(true);
    const trimmedName = editName.trim();
    const trimmedEmail = editEmail.trim();

    if (!trimmedName || !trimmedEmail) {
      setIsSaving(false);
      alert("Name and Email are required.");
      return;
    }

    // Prepare data for the Google Sheet
    const permissions = isCreating ? newPermissions : (users.find(u => u.email.toLowerCase() === selectedEmail.toLowerCase())?.permissions || DEFAULT_PERMISSIONS);
    
    const cloudPayload = {
      action: isCreating ? "createUser" : "updateUser",
      name: trimmedName,
      username: editUsername.trim(),
      password: editPassword,
      email: trimmedEmail,
      oldEmail: isCreating ? trimmedEmail : selectedEmail, // Important for finding the row if email changed
      role: editRole,
      permissions: permissions,
      settings: permissions // Send both for compatibility
    };

    try {
      console.log("Saving to cloud...", cloudPayload);
      // 1. Send to Google Sheets
      const response = await fetch(USER_SCRIPT_URL, {
        method: "POST",
        mode: 'cors',
        credentials: 'omit',
        redirect: 'follow',
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: JSON.stringify(cloudPayload)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Cloud response:", result);

      if (result.status !== "success") {
        throw new Error(result.message || "Cloud Sync Failed");
      }

      // 2. Update Local Storage if Cloud Sync was successful
      const existingUsers = getLatestUsersFromStorage();

      if (isCreating) {
        const newUser: AppUser = { 
          name: trimmedName, 
          email: trimmedEmail, 
          username: editUsername.trim(), 
          password: editPassword, 
          role: editRole, 
          lastLogin: new Date().toISOString(), 
          permissions: permissions 
        };
        const updatedUsers = [...existingUsers.filter(u => u.email.toLowerCase() !== trimmedEmail.toLowerCase()), newUser];
        saveToStorage(updatedUsers);
        setSelectedEmail(trimmedEmail); 
        setIsCreating(false);
      } else {
        const updatedUsers = existingUsers.map(user => {
          if (user.email.toLowerCase() === selectedEmail.toLowerCase()) {
             return { 
               ...user, 
               name: trimmedName, 
               email: trimmedEmail, 
               username: editUsername.trim(),
               password: editPassword,
               role: editRole, 
               permissions: permissions
             };
          }
          return user;
        });
        const isSelfEdit = loggedInUser.email.trim().toLowerCase() === selectedEmail.toLowerCase();
        saveToStorage(updatedUsers, isSelfEdit);
        if (selectedEmail.toLowerCase() !== trimmedEmail.toLowerCase()) setSelectedEmail(trimmedEmail);
      }
    } catch (error) {
      console.error("Save failed", error);
      alert(`CRITICAL ERROR: Failed to sync with Cloud Database. ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const saveToStorage = (data: AppUser[], shouldReload = false) => {
      try {
          const sorted = sortUsers(data);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
          
          // If it's a self-edit, we must also update the active session
          if (shouldReload) {
              const freshSelf = data.find(u => u.email.toLowerCase() === selectedEmail.toLowerCase() || u.email.toLowerCase() === editEmail.toLowerCase());
              if (freshSelf) {
                  localStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(freshSelf));
              }
          }

          window.dispatchEvent(new Event('vg_user_update'));
          setUsers(sorted);
          setIsSaving(false);
          setShowSuccess(true);
          if (shouldReload) window.location.reload(); 
          else setTimeout(() => setShowSuccess(false), 2000);
      } catch (e) {
          console.error("Save failed", e);
          setIsSaving(false);
      }
  };

  const displayUser = currentEditedUser || { permissions: DEFAULT_PERMISSIONS } as AppUser;
  const effectivePermissions = displayUser.permissions || DEFAULT_PERMISSIONS;

  const TabButton = ({ id, label, icon: Icon }: { id: SettingsTab, label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-widest border-b-2 transition-all ${
        activeTab === id 
        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
        : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  return (
    <div className="p-8 space-y-8 bg-[#f8fafc] dark:bg-slate-950 min-h-screen animate-in fade-in duration-500 font-sans pb-20">
      <div className="flex justify-between items-end">
        <div>
           <h1 className="text-2xl font-bold text-[#1e293b] dark:text-slate-100 uppercase tracking-wide">Settings</h1>
           <p className="text-slate-400 dark:text-slate-500 font-semibold text-[11px] tracking-widest mt-1 uppercase">Identity & System Configuration</p>
        </div>
        {showSuccess && (
            <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-800 animate-in fade-in zoom-in duration-200">
                <CheckCircle2 size={14} />
                Updates Saved
            </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[750px]">
        {/* Navigation Bar */}
        <div className="flex border-b border-slate-50 dark:border-slate-800 px-4 pt-2 shrink-0">
            <TabButton id="general" label="General" icon={Laptop} />
            {(loggedInUser.permissions.manageUsers || loggedInUser.permissions.managePermissions) && (
              <TabButton id="access" label="User" icon={Users} />
            )}
        </div>

        <div className="p-8 flex-1 overflow-hidden">
            {/* TAB 1: GENERAL */}
            {activeTab === 'general' && (
              <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                <div>
                   <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Display Preferences</h3>
                   <p className="text-sm text-slate-500 dark:text-slate-400">Personalize your workspace visibility settings.</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-indigo-900/40 text-indigo-400' : 'bg-amber-100 text-amber-600'}`}>
                         {isDarkMode ? <Moon size={24} /> : <Sun size={24} />}
                      </div>
                      <div>
                         <h4 className="font-bold text-slate-800 dark:text-slate-100">Dark Mode</h4>
                         <p className="text-xs text-slate-500 dark:text-slate-400">Reduce eye strain in low-light environments</p>
                      </div>
                   </div>

                   <button 
                     onClick={onToggleDarkMode}
                     className={`w-14 h-8 rounded-full p-1 transition-all duration-300 relative ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                   >
                      <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 flex items-center justify-center ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`}>
                         {isDarkMode ? <Moon size={12} className="text-indigo-600" /> : <Sun size={12} className="text-amber-500" />}
                      </div>
                   </button>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                         <Layout size={24} />
                      </div>
                      <div>
                         <h4 className="font-bold text-slate-800 dark:text-slate-100">Mirror Page Default View</h4>
                         <p className="text-xs text-slate-500 dark:text-slate-400">Choose your preferred layout for the Mirror Page</p>
                      </div>
                   </div>

                   <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                      <button 
                        onClick={() => {
                          localStorage.setItem(CONFIG.MIRROR_VIEW_KEY, 'grid');
                          window.dispatchEvent(new Event('storage'));
                          setShowSuccess(true);
                          setTimeout(() => setShowSuccess(false), 2000);
                        }}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                          localStorage.getItem(CONFIG.MIRROR_VIEW_KEY) !== 'list'
                          ? 'bg-indigo-600 text-white shadow-md' 
                          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                        }`}
                      >
                        Grid
                      </button>
                      <button 
                        onClick={() => {
                          localStorage.setItem(CONFIG.MIRROR_VIEW_KEY, 'list');
                          window.dispatchEvent(new Event('storage'));
                          setShowSuccess(true);
                          setTimeout(() => setShowSuccess(false), 2000);
                        }}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                          localStorage.getItem(CONFIG.MIRROR_VIEW_KEY) === 'list'
                          ? 'bg-indigo-600 text-white shadow-md' 
                          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                        }`}
                      >
                        Table
                      </button>
                   </div>
                </div>
              </div>
            )}

            {/* TAB 2: MERGED ACCESS (USERS + PERMISSIONS) */}
            {activeTab === 'access' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in slide-in-from-left-4 duration-300 h-full">
                
                {/* Left Pane: User Selector List */}
                <div className="lg:col-span-4 flex flex-col space-y-6 h-full border-r border-slate-100 dark:border-slate-800 pr-8 overflow-hidden">
                   <div className="flex-shrink-0 flex justify-end items-center bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-2xl">
                      {!isCreating && loggedInUser.permissions.manageUsers && (
                        <button 
                          onClick={handleStartCreate}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none transition-all flex items-center gap-2 active:scale-95"
                        >
                          <Plus size={14} strokeWidth={3} /> ADD NEW USER
                        </button>
                      )}
                    </div>

                    {isCreating && (
                      <div className="flex-shrink-0 p-6 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/40 rounded-3xl flex items-center justify-between shadow-sm animate-in zoom-in-95">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-50 dark:border-indigo-800">
                                  <UserPlus size={20} />
                              </div>
                              <div>
                                  <p className="text-sm font-black text-indigo-900 dark:text-indigo-100 uppercase">Provisioning</p>
                                  <p className="text-[9px] text-indigo-500 font-bold uppercase">Creating user</p>
                              </div>
                          </div>
                          <button onClick={handleCancelCreate} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl text-indigo-400 hover:text-rose-500 transition-colors">
                              <X size={20} />
                          </button>
                      </div>
                    )}

                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-200 min-h-0 pb-4">
                        {users.map(u => {
                            const isActive = selectedEmail.toLowerCase() === u.email.toLowerCase() && !isCreating;
                            return (
                                <button
                                    key={u.email}
                                    onClick={() => {
                                        setIsCreating(false);
                                        setSelectedEmail(u.email);
                                    }}
                                    className={`w-full text-left p-4 rounded-2xl transition-all border group flex flex-col justify-center relative overflow-hidden ${
                                        isActive 
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none' 
                                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-600 hover:border-indigo-200 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between relative z-10">
                                        <p className={`text-sm font-black truncate transition-colors ${isActive ? 'text-white' : 'text-slate-800 dark:text-slate-100 group-hover:text-indigo-600'}`}>
                                            {u.name}
                                        </p>
                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter ${
                                            isActive 
                                            ? 'bg-white/20 text-white' 
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                                        }`}>
                                            {u.role}
                                        </span>
                                    </div>
                                    <p className={`text-[10px] font-bold truncate mt-0.5 relative z-10 transition-colors ${isActive ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500 group-hover:text-indigo-400'}`}>
                                        {u.email}
                                    </p>
                                    {isActive && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20">
                                            <Shield size={40} />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {!isCreating && selectedEmail && loggedInUser.permissions.manageUsers && (
                        <div className="flex-shrink-0 p-6 bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-3xl shadow-sm">
                             <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-white dark:bg-slate-800 text-rose-500 dark:text-rose-400 rounded-xl shadow-sm border border-rose-50 dark:border-rose-900/50">
                                    <AlertTriangle size={18} />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black text-rose-900 dark:text-rose-100 uppercase tracking-widest">Restricted Zone</h4>
                                    <p className="text-[9px] text-rose-500 font-bold uppercase mt-0.5 italic">Account termination</p>
                                </div>
                             </div>
                             <button 
                                onClick={handleDeleteUser}
                                className="w-full py-3 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center gap-2 active:scale-95"
                             >
                                <Trash2 size={14} />
                                Delete Account
                             </button>
                        </div>
                    )}
                </div>

                {/* Right Pane: Configuration & Permissions */}
                <div className="lg:col-span-8 space-y-12 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-100 pb-24">
                    {/* Section 1: Profile metadata */}
                    <div className="bg-slate-50/50 dark:bg-slate-800/30 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-inner">
                        <div className="flex justify-between items-center mb-8">
                            <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-[0.2em]">Profile Data</h4>
                            {!isCreating && loggedInUser.permissions.managePermissions && (
                                <button 
                                    onClick={() => {
                                        if(window.confirm('Apply standard RBAC default permissions for this role?')) {
                                            applyRoleDefaults(editRole, editEmail);
                                        }
                                    }}
                                    className="px-3 py-1.5 bg-white dark:bg-slate-900 text-[10px] font-black text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-2 transition-all rounded-xl shadow-sm border border-slate-100 dark:border-slate-800"
                                >
                                    <RotateCcw size={12} /> Reset to Defaults
                                </button>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Legal Name</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:border-indigo-500 outline-none transition-all shadow-sm"
                                        placeholder="Full Name"
                                    />
                                    <UserCheck size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Corporate Email</label>
                                <div className="relative">
                                    <input 
                                        type="email" 
                                        value={editEmail}
                                        onChange={(e) => setEditEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:border-indigo-500 outline-none transition-all shadow-sm"
                                        placeholder="email@vangardegroup.com"
                                    />
                                    <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Username</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={editUsername}
                                        onChange={(e) => setEditUsername(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:border-indigo-500 outline-none transition-all shadow-sm"
                                        placeholder="username"
                                    />
                                    <Fingerprint size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Password</label>
                                <div className="relative">
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        value={editPassword}
                                        onChange={(e) => setEditPassword(e.target.value)}
                                        className="w-full pl-12 pr-12 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:border-indigo-500 outline-none transition-all shadow-sm"
                                        placeholder="••••••••"
                                    />
                                    <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Access Tier</label>
                                <div className="relative">
                                    <select 
                                        value={editRole}
                                        onChange={(e) => {
                                            const newRole = e.target.value as AppUser['role'];
                                            setEditRole(newRole);
                                            if (isCreating || window.confirm(`Update permissions to standard ${newRole} defaults?`)) {
                                                const defaults = getDefaultPermissionsForRole(newRole, editEmail);
                                                if (isCreating) setNewPermissions(defaults);
                                                else updateUserLocally(defaults);
                                            }
                                        }}
                                        className="w-full pl-12 pr-10 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:border-indigo-500 outline-none appearance-none cursor-pointer shadow-sm"
                                    >
                                        <option value="CEO">CEO</option>
                                        <option value="Developer">Developer</option>
                                        <option value="Manager">Manager</option>
                                        <option value="Administrator">Administrator</option>
                                        <option value="Collector">Collector</option>
                                        <option value="Viewer">Viewer</option>
                                    </select>
                                    <Shield size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Permissions Configuration */}
                    {loggedInUser.permissions.managePermissions && (
                      <div className="space-y-10">
                         <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/40 p-6 rounded-[2rem] flex gap-4 shadow-sm">
                            <div className="text-amber-500 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm flex items-center justify-center shrink-0 h-fit"><AlertTriangle size={24} /></div>
                            <p className="text-xs text-amber-700 dark:text-amber-400 font-bold uppercase tracking-tight leading-relaxed italic">You are managing security overrides for {isCreating ? 'a New Member' : currentEditedUser?.name}. Changes persist on save.</p>
                         </div>

                         {/* VISIBILITY */}
                         <section>
                            <div className="flex items-center gap-3 mb-6">
                              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl"><Layout size={18} /></div>
                              <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Dashboard Visibility</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <ToggleItem label="Executive" desc="Revenue Targets" active={effectivePermissions.viewExecutive} onToggle={() => handlePermissionToggle('viewExecutive')} />
                                <ToggleItem label="KPI" desc="Key Performance Indicators" active={effectivePermissions.viewKPI} onToggle={() => handlePermissionToggle('viewKPI')} />
                                <ToggleItem label="Postdates" desc="Payment Tables" active={effectivePermissions.viewPostdates} onToggle={() => handlePermissionToggle('viewPostdates')} />
                                <ToggleItem label="Projection" desc="Target Forecasting" active={effectivePermissions.viewProjection} onToggle={() => handlePermissionToggle('viewProjection')} />
                                <ToggleItem label="Mirror" desc="Live Snapshots" active={effectivePermissions.viewMirror} onToggle={() => handlePermissionToggle('viewMirror')} />
                                <ToggleItem label="RPC Logs" desc="Contact Records" active={effectivePermissions.viewRPCLogs} onToggle={() => handlePermissionToggle('viewRPCLogs')} />
                                <ToggleItem label="Collector" desc="Team Ranks" active={effectivePermissions.viewCollectorDashboard} onToggle={() => handlePermissionToggle('viewCollectorDashboard')} />
                                <ToggleItem label="Collector Home" desc="Collector Landing Page" active={effectivePermissions.viewCollectorHome} onToggle={() => handlePermissionToggle('viewCollectorHome')} />
                                <ToggleItem label="Audits" desc="Compliance" active={effectivePermissions.viewAuditDashboard} onToggle={() => handlePermissionToggle('viewAuditDashboard')} />
                                <ToggleItem label="Recovery" desc="Decline Recovery Audit" active={effectivePermissions.viewRecovery} onToggle={() => handlePermissionToggle('viewRecovery')} />
                                <ToggleItem label="Inventory" desc="Assets" active={effectivePermissions.viewInventory} onToggle={() => handlePermissionToggle('viewInventory')} />
                                <ToggleItem label="Collector Inventory" desc="Personal Assets" active={effectivePermissions.viewCollectorInventory} onToggle={() => handlePermissionToggle('viewCollectorInventory')} />
                                <ToggleItem label="Campaign" desc="Outreach Hub" active={effectivePermissions.viewCampaign} onToggle={() => handlePermissionToggle('viewCampaign')} />
                                <ToggleItem label="Settings" desc="System Config" active={effectivePermissions.viewSettings} onToggle={() => handlePermissionToggle('viewSettings')} />
                            </div>
                         </section>

                         <div className="h-px bg-slate-100 dark:bg-slate-800 w-full"></div>

                         {/* OPERATIONS */}
                         <section>
                            <div className="flex items-center gap-3 mb-6">
                              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl"><ListTodo size={18} /></div>
                              <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Tactical Operations</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <ToggleItem label="Manage RPC" desc="Edit/Delete Logs" active={effectivePermissions.manageRPCLogs} onToggle={() => handlePermissionToggle('manageRPCLogs')} />
                                <ToggleItem label="Manage Clients" desc="Edit Client List" active={effectivePermissions.manageClients} onToggle={() => handlePermissionToggle('manageClients')} />
                                <ToggleItem label="Manage Files" desc="Exports/Uploads" active={effectivePermissions.manageDocuments} onToggle={() => handlePermissionToggle('manageDocuments')} />
                                <ToggleItem label="Reports" desc="External Comms" active={effectivePermissions.sendReport} onToggle={() => handlePermissionToggle('sendReport')} />
                                <ToggleItem label="Add Tasks" desc="Workflow Actions" active={effectivePermissions.addTasks} onToggle={() => handlePermissionToggle('addTasks')} />
                                <ToggleItem label="Add Projects" desc="Client Logic" active={effectivePermissions.addProjects} onToggle={() => handlePermissionToggle('addProjects')} />
                            </div>
                         </section>

                         <div className="h-px bg-slate-100 dark:bg-slate-800 w-full"></div>

                         {/* ADMINISTRATIVE */}
                         <section>
                            <div className="flex items-center gap-3 mb-6">
                              <div className="p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl"><Settings size={18} /></div>
                              <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Administrative Control</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <ToggleItem label="Manage Users" desc="Profile Edits" active={effectivePermissions.manageUsers} onToggle={() => handlePermissionToggle('manageUsers')} />
                                <ToggleItem label="Manage Access" desc="Security Settings" active={effectivePermissions.managePermissions} onToggle={() => handlePermissionToggle('managePermissions')} />
                            </div>
                         </section>

                         <div className="h-px bg-slate-100 dark:bg-slate-800 w-full"></div>

                         {/* PORTFOLIO SCOPE */}
                         <section>
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-3">
                                   <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl"><Users size={18} /></div>
                                   <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Portfolio Scope</h4>
                                </div>
                                <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-4 py-1.5 rounded-full uppercase tracking-widest border border-blue-100 dark:border-blue-900">
                                    Viewing Rights
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {[...(collectors.data || [])].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })).map(collector => {
                                    const isAllowed = (effectivePermissions.allowedCollectorIds || []).includes(collector.id);
                                    return (
                                        <button 
                                            key={collector.id}
                                            onClick={() => handleCollectorToggle(collector.id)}
                                            className={`flex flex-col items-center gap-3 p-5 rounded-[2rem] border transition-all ${
                                                isAllowed 
                                                ? 'bg-white dark:bg-slate-800 border-indigo-300 dark:border-indigo-500 shadow-md ring-4 ring-indigo-50 dark:ring-indigo-900/10' 
                                                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-40 hover:opacity-70'
                                            }`}
                                        >
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-[10px] shadow-sm ${
                                                isAllowed ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                            }`}>
                                                {collector.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                            </div>
                                            <span className={`text-[10px] font-black uppercase text-center truncate w-full ${isAllowed ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-400'}`}>
                                                {collector.name}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                         </section>
                      </div>
                    )}
                </div>
              </div>
            )}
        </div>

        {/* Global Action Footer */}
        {activeTab === 'access' && (
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex justify-end shrink-0 z-50">
              <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-indigo-600 text-white px-16 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50"
              >
                 <Save size={18} /> 
                 {isSaving ? 'Syncing Cloud Database...' : (isCreating ? 'Provision Account' : 'Commit Changes')}
              </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ToggleItem = ({ label, desc, active, onToggle }: { label: string, desc: string, active: boolean, onToggle: () => void }) => (
    <div 
        onClick={onToggle}
        className={`flex items-start justify-between p-5 rounded-[2rem] border transition-all cursor-pointer group h-full shadow-sm ${
            active 
            ? 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-500 opacity-100' 
            : 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-200 dark:hover:border-slate-700'
        }`}
    >
        <div className="pr-2">
            <h4 className={`text-xs font-black transition-colors mb-1 uppercase tracking-tight ${active ? 'text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>{label}</h4>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest leading-tight">{desc}</p>
        </div>
        
        <div className={`w-9 h-5 rounded-full p-1 transition-all duration-300 ease-in-out relative flex-shrink-0 mt-0.5 ${active ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
            <div className={`w-3 h-3 rounded-full bg-white shadow-md transform transition-all duration-300 ${active ? 'translate-x-4' : 'translate-x-0'}`} />
        </div>
    </div>
);

export default UserSettings;