import React, { useState } from 'react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ==========================================
  // HIER DEN LOGIN-STATE & FUNKTION EINFÜGEN:
  // ==========================================
   const [currentUser, setCurrentUser] = useState({ name: 'Pieck', role: 'owner' });
  const [authMode, setAuthMode] = useState('login');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
   const [showLoginModal, setShowLoginModal] = useState(false);
   const [isEditingName, setIsEditingName] = useState(false); 
  // ==========================================
  // AB HIER LÄUFT DEIN BESTEHENDER REST DER APP WEITER!
  // ==========================================

  const [tempUserName, setTempUserName] = useState(currentUser ? currentUser.name : '');
  // Datenschutz: Blockierte Charaktere für den Owner
  const [blockedUsersMap, setBlockedUsersMap] = useState({});
  const [reportedCharacterIds, setReportedCharacterIds] = useState([]);

  // Safety Handbook State (Angepasst mit Ads / No-Ads Payment Modell)
  const [isEditingHandbook, setIsEditingHandbook] = useState(false);
  const [handbookContent, setHandbookContent] = useState({
    title: 'PEACK.AI SAFETY & FOREVER PLEDGE',
    pledgeTitle: 'The Eternal Oath (Forever Promise)',
    pledgeText: 'As the Owner, I solemnly swear: All chats, messages, and AI interactions on Peack.ai are and will remain completely unlimited and free forever. Future platform upkeep may introduce ads or an optional "No Ads" payment tier, but messaging itself will NEVER be paywalled or charged!',
    rule1Title: '1. Age & Content Policy (18+)',
    rule1Text: 'Peack.ai supports unrestricted creative roleplay and adult content for verified users.',
    rule2Title: '2. Moderation & Reporting',
    rule2Text: 'Always use the Report button to flag rule-breaking characters instantly.',
    rule3Title: '3. Privacy & Blocking',
    rule3Text: 'Your block list is completely private and protected locally.'
  });
  const [tempHandbook, setTempHandbook] = useState(handbookContent);

  // Owner Feed Posts State (Inklusive dem angepassten Schwur im ersten Post)
  const [ownerFeedPosts, setOwnerFeedPosts] = useState([
    {
      id: 'forever-pledge',
      author: 'Pieck',
      role: 'owner',
      isPledge: true,
      content: '📜 THE ETERNAL OATH: I solemnly swear as the Owner of Peack.ai that all chats and AI interactions here will remain completely unlimited for all eternity! Future ads or an optional "No Ads" payment tier may arrive to help cover server bills, but messaging will NEVER be paywalled. Chat as much as you want – forever. 🍑✨',
      timestamp: 'Official Pledge'
    },
    {
      id: 'post-1',
      author: 'Pieck',
      role: 'owner',
      isPledge: false,
      content: 'Welcome back to Peack.ai! Next system maintenance scheduled for tonight at 02:00 AM. 18+ mode active.',
      timestamp: 'Just now'
    }
  ]);
  const [newFeedPostContent, setNewFeedPostContent] = useState('');

  // Charaktere
  const [characters, setCharacters] = useState([
    { 
      id: 'assistant', 
      name: 'Peack Assistant', 
      description: 'Your official guide and helper across Peack.ai.', 
      greeting: 'Welcome back! As your assistant, I am ready to take any commands.',
      nsfw: true,
      pinned: true,
      creator: 'Peack System',
      isOfficial: true,
      avatar: null,
      avatarBg: 'from-rose-500 via-pink-500 to-amber-500'
    }
  ]);

  // States für Charaktererstellung
  const [newCharName, setNewCharName] = useState('');
  const [newCharGender, setNewCharGender] = useState('Female');
  const [newCharDesc, setNewCharDesc] = useState('');
  const [newCharNsfw, setNewCharNsfw] = useState(true);
  const [newCharAvatar, setNewCharAvatar] = useState(null);

  // Bearbeitungs-State für Nachrichten
  const [editingMessageIndex, setEditingMessageIndex] = useState(null);
  const [editedMessageContent, setEditedMessageContent] = useState('');

 
    const API_URL = window.location.hostname === 'localhost' 
  ? 'http://127.0.0.1:8000' 
  : 'https://peack-ai-backend.onrender.com'; // Falls deine Render-Backend-URL so heißt
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = authMode === 'login' ? '/api/login' : '/api/register';
    
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });
      const data = await response.json();
      
      if (response.ok) {
        setCurrentUser({
          name: data.username,
          role: data.is_owner ? 'owner' : 'user',
          globalNsfw: true
        });
      } else {
        setAuthError(data.detail || 'Ein Fehler ist aufgetreten.');
      }
    } catch (err) {
      setAuthError('Verbindung zum Server fehlgeschlagen.');
    }
  };
  const handleImageUpload = (e, callback) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = () => callback(reader.result);
    reader.readAsDataURL(file);
  }
};

   const handleSendMessage = async (e, customMessages = null) => {
    if (e) e.preventDefault();
    const activeMessages = customMessages || messages;
    if (!inputMessage.trim() && !customMessages) return;

    let updatedMessages = activeMessages;
    if (!customMessages) {
      const userMsg = { role: 'user', content: inputMessage };
      updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setInputMessage('');
    }

    try {
    const response = await fetch('https://peack-ai-backend.onrender.com/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'openrouter/auto',
    messages: updatedMessages,
    system_prompt: selectedCharacter 
      ? `${selectedCharacter.description} [User name: ${currentUser.name}]` 
      : 'You are a helpful assistant.'
  })
});

      if (!response.ok) throw new Error('Backend error');

      const data = await response.json();
      const botMsg = { role: 'assistant', content: data.reply || 'Hello!' };
      setMessages([...updatedMessages, botMsg]);
    } catch (err) {
      setMessages([...updatedMessages, { role: 'assistant', content: 'Connection error with AI backend.' }]);
    }
  };

  const handleDeleteMessage = (index) => {
    if (index === 0) {
      alert('Safety Warning: The initial greeting message cannot be deleted.');
      return;
    }
    setMessages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveEditedMessage = (index) => {
    if (index === 0) {
      alert('Safety Warning: The initial greeting message cannot be edited.');
      return;
    }
    const newMsgs = [...messages];
    newMsgs[index].content = editedMessageContent;
    setMessages(newMsgs);
    setEditingMessageIndex(null);
    setEditedMessageContent('');
    handleSendMessage(null, newMsgs);
  };
// Funktion zum Ausloggen (setzt den currentUser auf null zurück)
  const handleLogout = () => {
    setCurrentUser(null);
    setAuthMode('login');
    setUsernameInput('');
    setPasswordInput('');
  }; 
  const handleRegenerate = () => {
    if (messages.length <= 1) return;
    const lastUserIdx = messages.map(m => m.role).lastIndexOf('user');
    if (lastUserIdx === -1) return;
    const trimmedMsgs = messages.slice(0, lastUserIdx + 1);
    setMessages(trimmedMsgs);
    handleSendMessage(null, trimmedMsgs);
  };

  const currentBlockedIds = blockedUsersMap[currentUser?.id] || [];

  const handleToggleBlock = (charId) => {
    if (!currentUser) return;

    setBlockedUsersMap(prev => {
      const userBlocked = prev[currentUser.id] || [];
      let updatedList;
      if (userBlocked.includes(charId)) {
        updatedList = userBlocked.filter(id => id !== charId);
      } else {
        updatedList = [...userBlocked, charId];
        if (selectedCharacter && selectedCharacter.id === charId) {
          setActiveTab('home');
          setSelectedCharacter(null);
        }
      }
      return { ...prev, [currentUser.id]: updatedList };
    });
  };

  const handleReportCharacter = (charId) => {
    if (!reportedCharacterIds.includes(charId)) {
      setReportedCharacterIds(prev => [...prev, charId]);
      alert('Character successfully reported to moderation.');
    } else {
      alert('You have already reported this character.');
    }
  };

  const handleCreateFeedPost = (e) => {
    e.preventDefault();
    if (!newFeedPostContent.trim()) return;

    const newPost = {
      id: Date.now().toString(),
      author: currentUser.name,
      role: currentUser.role,
      isPledge: false,
      content: newFeedPostContent,
      timestamp: 'Just now'
    };

    setOwnerFeedPosts([newPost, ...ownerFeedPosts]);
    setNewFeedPostContent('');
  };

  const handleCreateCharacter = (e) => {
    e.preventDefault();
    if (!newCharName.trim() || !newCharDesc.trim()) return;

    const gradients = [
      'from-rose-500 via-pink-600 to-amber-500',
      'from-pink-500 to-purple-600',
      'from-rose-600 to-orange-500',
      'from-fuchsia-600 to-pink-500'
    ];

    const created = {
      id: Date.now().toString(),
      name: newCharName,
      description: newCharDesc,
      greeting: `Hello! I am ${newCharName} (${newCharGender}). Let's start chatting!`,
      nsfw: newCharNsfw,
      pinned: false,
      creator: currentUser.name,
      isOfficial: true,
      avatar: newCharAvatar,
      avatarBg: gradients[Math.floor(Math.random() * gradients.length)]
    };

    setCharacters(prev => [created, ...prev]);
    setNewCharName('');
    setNewCharDesc('');
    setNewCharNsfw(true);
    setNewCharAvatar(null);
    setActiveTab('home');
  };

  const handleDeleteCharacter = (e, id) => {
    e.stopPropagation();
    setCharacters(prev => prev.filter(c => c.id !== id));
  };

  const handleTogglePin = (e, id) => {
    e.stopPropagation();
    setCharacters(prev => prev.map(c => c.id === id ? { ...c, pinned: !c.pinned } : c));
  };

  const updateCurrentUserName = () => {
    setCurrentUser(prev => ({ ...prev, name: tempUserName }));
    setIsEditingName(false);
  };

  const toggleUserNsfw = (val) => {
    setCurrentUser(prev => ({ ...prev, globalNsfw: val }));
  };

  const updateUserAvatar = (avatarData) => {
    setCurrentUser(prev => ({ ...prev, avatar: avatarData }));
  };

  const handleSaveHandbookChanges = () => {
    setHandbookContent(tempHandbook);
    setIsEditingHandbook(false);
  };

  const filteredCharacters = characters.filter(c => 
    !currentBlockedIds.includes(c.id) &&
    (c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
     c.creator.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const pinnedCharacters = characters.filter(c => c.pinned && !currentBlockedIds.includes(c.id));
  const recentCharacters = characters.filter(c => !c.pinned && !currentBlockedIds.includes(c.id));

  return !currentUser ? (
    <div style={{ padding: '40px', color: '#fff', textAlign: 'center' }}>
      <h2>Welcome to Peack.ai</h2>
      <p>{authMode === 'login' ? 'Logge dich in deinen Account ein' : 'Erstelle deinen Account'}</p>

      <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', maxWidth: '300px', margin: '0 auto', gap: '10px' }}>
        <input
          type="text"
          placeholder="Benutzername"
          value={usernameInput}
          onChange={(e) => setUsernameInput(e.target.value)}
          style={{ padding: '10px', borderRadius: '5px', background: '#1a2236', color: '#fff' }}
          required
        />
        <input
          type="password"
          placeholder="Passwort"
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
          style={{ padding: '10px', borderRadius: '5px', background: '#1a2236', color: '#fff' }}
          required
        />
        <button type="submit" style={{ padding: '10px', borderRadius: '5px', background: '#4f46e5', color: '#fff', cursor: 'pointer' }}>
          {authMode === 'login' ? 'Einloggen' : 'Registrieren'}
        </button>
      </form>

      {authError && <p style={{ color: '#ff4d4d', marginTop: '10px' }}>{authError}</p>}

      <p style={{ marginTop: '20px', cursor: 'pointer', color: '#38bdf8' }} onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
        {authMode === 'login' ? 'Noch keinen Account? Hier registrieren' : 'Schon einen Account? Einloggen'}
      </p>
    </div>
  ) : (
    <div className="min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-center p-0 sm:p-4 font-sans">
      <div className="w-full sm:max-w-md h-screen sm:h-[850px] bg-[#0c0f17] sm:border sm:border-gray-800 sm:rounded-3xl flex flex-col relative overflow-hidden shadow-2xl">
        
        {/* Top Header */}
        <div className="p-4 flex justify-between items-center bg-[#0c0f17] z-10 border-b border-gray-800/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 p-0.5 shadow-lg shadow-rose-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#0c0f17] rounded-[10px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/20 to-amber-500/20"></div>
                <svg className="w-4 h-4 text-rose-400 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C9.5 2 7.5 4 7.5 6.5C7.5 8 8.5 9.5 9.5 10.5C8 12 6 15 6 18.5C6 20.4 7.6 22 9.5 22C11 22 12 21 12 21C12 21 13 22 14.5 22C16.4 22 18 20.4 18 18.5C18 15 16 12 14.5 10.5C15.5 9.5 16.5 8 16.5 6.5C16.5 4 14.5 2 12 2ZM12 4C13.4 4 14.5 5.1 14.5 6.5C14.5 7.5 13.5 9 12 10.5C10.5 9 9.5 7.5 9.5 6.5C9.5 5.1 10.6 4 12 4ZM14.3 2.3C14.7 2.1 15.2 2.3 15.4 2.7C15.6 3.1 15.4 3.6 15 3.8C14.1 4.3 13.3 5 12.8 5.8C12.5 5.4 12.1 5 11.6 4.6C12.4 3.7 13.3 2.9 14.3 2.3Z" />
                </svg>
              </div>
            </div>
            <div>
              <div className="font-black text-sm tracking-wider bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
                PEACK.AI
              </div>
              <div className="text-[9px] text-gray-500 tracking-wider font-semibold uppercase">Peach & Peek</div>
            </div>
          </div>
          <div className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-slate-800 text-slate-200">
            <span>👑</span> Owner
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-24 px-4 space-y-4">
          
          {/* HOME TAB */}
          {activeTab === 'home' && (
            <div className="space-y-4">
              {/* Integrierte Suche */}
              <div className="relative">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search characters, creators or tags..." 
                  className="w-full bg-[#131825] border border-gray-800 p-3.5 pl-10 rounded-2xl text-sm text-white outline-none focus:border-rose-500 transition shadow-inner"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-3.5 text-xs text-gray-400 hover:text-white bg-gray-800/60 w-5 h-5 rounded-full flex items-center justify-center"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Grid (Chai Style Cards) */}
              <div className="grid grid-cols-2 gap-3">
                {filteredCharacters.map((char) => (
                  <div 
                    key={char.id}
                    onClick={() => {
                      setSelectedCharacter(char);
                      setMessages([{ role: 'assistant', content: char.greeting }]);
                      setActiveTab('chat');
                    }}
                    className="bg-[#131825] border border-gray-800 p-3 rounded-2xl cursor-pointer flex flex-col justify-between h-52 relative overflow-hidden group hover:border-rose-500/50 transition"
                  >
                    {char.avatar ? (
                      <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${char.avatar})` }}></div>
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-br ${char.avatarBg} opacity-20 group-hover:opacity-30 transition`}></div>
                    )}
                    
                    <div className="relative z-10 flex justify-between items-start">
                      <div className="flex items-center space-x-1.5 bg-black/50 px-2 py-1 rounded-xl backdrop-blur-md border border-white/10">
                        <div className="w-5 h-5 rounded-full overflow-hidden bg-rose-500/30 flex items-center justify-center text-[10px]">
                          {char.avatar ? <img src={char.avatar} className="w-full h-full object-cover" /> : '🍑'}
                        </div>
                        <span className="text-[9px] font-black uppercase text-white truncate max-w-[70px]">
                          {char.name}
                        </span>
                      </div>

                      <button 
                        onClick={(e) => handleTogglePin(e, char.id)} 
                        className="text-rose-400 text-xs bg-black/40 p-1.5 rounded-lg"
                      >
                        📌
                      </button>
                    </div>

                    <div className="relative z-10 space-y-1">
                      <div className="font-bold text-sm text-white line-clamp-1 flex items-center gap-1.5">
                        <span>{char.name}</span>
                        {char.nsfw && <span className="text-[9px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded">18+</span>}
                      </div>
                      <div className="text-[11px] text-gray-400 line-clamp-2">{char.description}</div>
                      <div className="text-[9px] text-gray-500">By {char.creator}</div>
                    </div>
                  </div>
                ))}

                {/* Create Character Karte */}
                <div 
                  onClick={() => setActiveTab('create')}
                  className="border border-dashed border-gray-700 bg-[#131825]/50 p-3 rounded-2xl flex flex-col items-center justify-center cursor-pointer h-52 hover:border-rose-500 hover:bg-[#131825] transition text-center space-y-2"
                >
                  <div className="w-10 h-10 bg-rose-500 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                    +
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">Create Character</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">By {currentUser.name}</div>
                  </div>
                </div>
              </div>

              {/* Owner Feed & Der Ewige Schwur */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <div className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">
                    👑 PEACK.AI OWNER FEED & FOREVER PLEDGE
                  </div>
                </div>

                <form onSubmit={handleCreateFeedPost} className="bg-[#131825] border border-rose-500/40 p-3 rounded-2xl space-y-2">
                  <div className="text-[10px] text-rose-300 font-bold">Write new maintenance update or announcement:</div>
                  <textarea 
                    value={newFeedPostContent}
                    onChange={(e) => setNewFeedPostContent(e.target.value)}
                    placeholder="e.g. Next maintenance coming up at 3 AM..."
                    className="w-full bg-[#0c0f17] border border-gray-800 p-2.5 rounded-xl text-xs text-white outline-none focus:border-rose-500 resize-none h-16"
                  ></textarea>
                  <div className="flex justify-end">
                    <button type="submit" className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-xl font-black text-xs transition shadow-lg">
                      Post Announcement 🍑
                    </button>
                  </div>
                </form>

                <div className="space-y-3">
                  {ownerFeedPosts.map((post) => (
                    <div 
                      key={post.id} 
                      className={`bg-[#131825] border p-4 rounded-2xl space-y-2 ${post.isPledge ? 'border-rose-500 shadow-lg shadow-rose-500/10 bg-gradient-to-br from-[#131825] to-rose-950/20' : 'border-gray-800'}`}
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className={`px-2 py-0.5 rounded font-bold ${post.isPledge ? 'bg-rose-500 text-white shadow' : 'bg-rose-500/20 text-rose-300'}`}>
                          👑 {post.author} ({post.role}) {post.isPledge && '✨ PLEDGE'}
                        </span>
                        <span className="text-gray-500 text-[10px]">{post.timestamp}</span>
                      </div>
                      <p className={`text-xs leading-relaxed font-medium ${post.isPledge ? 'text-rose-100 font-semibold' : 'text-gray-200'}`}>
                        {post.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CHATS TAB */}
          {activeTab === 'chats' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">PINNED CHATS ({pinnedCharacters.length})</div>
                {pinnedCharacters.map(char => (
                  <div 
                    key={char.id}
                    onClick={() => {
                      setSelectedCharacter(char);
                      setMessages([{ role: 'assistant', content: char.greeting }]);
                      setActiveTab('chat');
                    }}
                    className="bg-[#131825] border border-rose-500/30 p-3 rounded-2xl flex justify-between items-center cursor-pointer hover:border-rose-500 transition"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${char.avatarBg || 'from-rose-500 to-pink-600'} flex items-center justify-center font-bold text-sm overflow-hidden`}>
                        {char.avatar ? <img src={char.avatar} className="w-full h-full object-cover" /> : '🍑'}
                      </div>
                      <div>
                        <div className="font-bold text-sm flex items-center space-x-2">
                          <span>{char.name}</span>
                          {char.nsfw && <span className="text-[9px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded">18+</span>}
                        </div>
                        <div className="text-[10px] text-gray-500">By {char.creator}</div>
                      </div>
                    </div>
                    <button onClick={(e) => handleTogglePin(e, char.id)} className="text-rose-400 text-xs">📌</button>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-2">
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">RECENT CHATS ({recentCharacters.length})</div>
                {recentCharacters.map(char => (
                  <div 
                    key={char.id}
                    onClick={() => {
                      setSelectedCharacter(char);
                      setMessages([{ role: 'assistant', content: char.greeting }]);
                      setActiveTab('chat');
                    }}
                    className="bg-[#131825] border border-gray-800 p-3 rounded-2xl flex justify-between items-center cursor-pointer hover:border-gray-700"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${char.avatarBg || 'from-rose-500 to-pink-600'} flex items-center justify-center font-bold text-sm overflow-hidden`}>
                        {char.avatar ? <img src={char.avatar} className="w-full h-full object-cover" /> : '🍑'}
                      </div>
                      <div>
                        <div className="font-bold text-sm flex items-center space-x-2">
                          <span>{char.name}</span>
                          {char.nsfw && <span className="text-[9px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded">18+</span>}
                        </div>
                        <div className="text-[10px] text-gray-500">By {char.creator}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button onClick={(e) => handleTogglePin(e, char.id)} className="text-gray-400 hover:text-rose-400 p-1" title="Pin">📌</button>
                      <button onClick={(e) => handleDeleteCharacter(e, char.id)} className="text-gray-400 hover:text-rose-400 p-1" title="Delete">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CREATE TAB */}
          {activeTab === 'create' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h1 className="text-lg font-bold">Create a character</h1>
                <button onClick={() => setActiveTab('home')} className="text-xs text-rose-400 font-bold">Cancel</button>
              </div>

              <form onSubmit={handleCreateCharacter} className="space-y-4 bg-[#131825] border border-gray-800 p-4 rounded-3xl">
                <div className="text-xs text-rose-400 font-bold uppercase tracking-wider">Identity (Creator: {currentUser.name})</div>

                <div>
                  <label className="text-xs text-gray-400 font-medium">Avatar image</label>
                  <div className="mt-1 flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-lg overflow-hidden border border-gray-700">
                      {newCharAvatar ? <img src={newCharAvatar} className="w-full h-full object-cover" /> : '🍑'}
                    </div>
                    <label className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer transition shadow-md">
                      Upload Image
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setNewCharAvatar)} className="hidden" />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-medium">Name *</label>
                  <input 
                    type="text" 
                    value={newCharName}
                    onChange={(e) => setNewCharName(e.target.value)}
                    placeholder="e.g. Lyra Vane" 
                    className="w-full bg-[#0c0f17] border border-gray-800 p-3 rounded-xl mt-1 text-sm text-white outline-none focus:border-rose-500" 
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-medium">Gender *</label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {['Male', 'Female', 'Other'].map((g) => (
                      <button
                        type="button"
                        key={g}
                        onClick={() => setNewCharGender(g)}
                        className={`py-2.5 rounded-xl text-xs font-bold transition border ${newCharGender === g ? 'bg-rose-500 text-white border-rose-500 shadow-lg' : 'bg-[#0c0f17] text-gray-400 border-gray-800'}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-medium">Short description *</label>
                  <textarea 
                    value={newCharDesc}
                    onChange={(e) => setNewCharDesc(e.target.value)}
                    placeholder="A brief summary..." 
                    className="w-full bg-[#0c0f17] border border-gray-800 p-3 rounded-xl mt-1 text-sm text-white outline-none h-24 focus:border-rose-500 resize-none"
                    required
                  ></textarea>
                </div>

                <div className="bg-[#0c0f17] border border-gray-800 p-3.5 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-xs text-white flex items-center space-x-2">
                      <span>NSFW Mode (18+)</span>
                      <span className="text-[9px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded">Unrestricted</span>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">Allows unrestricted adult roleplay.</div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={newCharNsfw}
                    onChange={(e) => setNewCharNsfw(e.target.checked)}
                    className="w-5 h-5 accent-rose-500 cursor-pointer rounded"
                  />
                </div>

                <button type="submit" className="w-full bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-xl font-black text-sm transition shadow-lg">
                  Save Character 🍑
                </button>
              </form>
            </div>
          )}

          {/* HANDBOOK TAB */}
          {activeTab === 'handbook' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h1 className="text-lg font-bold flex items-center space-x-2">
                  <span>📖</span>
                  <span>{handbookContent.title}</span>
                </h1>
                {currentUser.role === 'owner' && (
                  <button 
                    onClick={() => {
                      if (isEditingHandbook) {
                        handleSaveHandbookChanges();
                      } else {
                        setTempHandbook(handbookContent);
                        setIsEditingHandbook(true);
                      }
                    }}
                    className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition shadow"
                  >
                    {isEditingHandbook ? '💾 Save Changes' : '✏️ Edit Handbook'}
                  </button>
                )}
              </div>

              {isEditingHandbook ? (
                <div className="bg-[#131825] border border-rose-500/50 p-4 rounded-3xl space-y-3">
                  <div className="text-xs text-rose-400 font-bold uppercase">Edit Handbook (English)</div>
                  
                  <div>
                    <label className="text-[11px] text-gray-400">Handbook Title</label>
                    <input 
                      type="text" 
                      value={tempHandbook.title} 
                      onChange={(e) => setTempHandbook({...tempHandbook, title: e.target.value})}
                      className="w-full bg-[#0c0f17] border border-gray-800 p-2.5 rounded-xl text-xs text-white mt-1 outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-400">Pledge Section Title</label>
                    <input 
                      type="text" 
                      value={tempHandbook.pledgeTitle} 
                      onChange={(e) => setTempHandbook({...tempHandbook, pledgeTitle: e.target.value})}
                      className="w-full bg-[#0c0f17] border border-gray-800 p-2.5 rounded-xl text-xs text-white mt-1 outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-400">Pledge Content</label>
                    <textarea 
                      value={tempHandbook.pledgeText} 
                      onChange={(e) => setTempHandbook({...tempHandbook, pledgeText: e.target.value})}
                      className="w-full bg-[#0c0f17] border border-gray-800 p-2.5 rounded-xl text-xs text-white mt-1 outline-none focus:border-rose-500 h-20 resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-400">Rule 1 Title</label>
                    <input 
                      type="text" 
                      value={tempHandbook.rule1Title} 
                      onChange={(e) => setTempHandbook({...tempHandbook, rule1Title: e.target.value})}
                      className="w-full bg-[#0c0f17] border border-gray-800 p-2.5 rounded-xl text-xs text-white mt-1 outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-400">Rule 1 Text</label>
                    <input 
                      type="text" 
                      value={tempHandbook.rule1Text} 
                      onChange={(e) => setTempHandbook({...tempHandbook, rule1Text: e.target.value})}
                      className="w-full bg-[#0c0f17] border border-gray-800 p-2.5 rounded-xl text-xs text-white mt-1 outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-400">Rule 2 Title</label>
                    <input 
                      type="text" 
                      value={tempHandbook.rule2Title} 
                      onChange={(e) => setTempHandbook({...tempHandbook, rule2Title: e.target.value})}
                      className="w-full bg-[#0c0f17] border border-gray-800 p-2.5 rounded-xl text-xs text-white mt-1 outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-400">Rule 2 Text</label>
                    <input 
                      type="text" 
                      value={tempHandbook.rule2Text} 
                      onChange={(e) => setTempHandbook({...tempHandbook, rule2Text: e.target.value})}
                      className="w-full bg-[#0c0f17] border border-gray-800 p-2.5 rounded-xl text-xs text-white mt-1 outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-400">Rule 3 Title</label>
                    <input 
                      type="text" 
                      value={tempHandbook.rule3Title} 
                      onChange={(e) => setTempHandbook({...tempHandbook, rule3Title: e.target.value})}
                      className="w-full bg-[#0c0f17] border border-gray-800 p-2.5 rounded-xl text-xs text-white mt-1 outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-400">Rule 3 Text</label>
                    <input 
                      type="text" 
                      value={tempHandbook.rule3Text} 
                      onChange={(e) => setTempHandbook({...tempHandbook, rule3Text: e.target.value})}
                      className="w-full bg-[#0c0f17] border border-gray-800 p-2.5 rounded-xl text-xs text-white mt-1 outline-none focus:border-rose-500"
                    />
                  </div>

                  <button 
                    onClick={handleSaveHandbookChanges}
                    className="w-full bg-rose-500 hover:bg-rose-600 text-white py-2.5 rounded-xl font-bold text-xs transition"
                  >
                    Save & Publish 🍑
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1 bg-rose-500/10 border border-rose-500/30 p-3.5 rounded-2xl shadow-inner">
                    <div className="font-bold text-rose-400 flex items-center space-x-1.5 text-xs">
                      <span>📜</span>
                      <span>{handbookContent.pledgeTitle}</span>
                    </div>
                    <p className="text-xs text-gray-200 mt-1 leading-relaxed">{handbookContent.pledgeText}</p>
                  </div>

                  <div className="bg-[#131825] border border-gray-800 p-3.5 rounded-2xl space-y-1">
                    <div className="font-bold text-rose-400 text-xs">{handbookContent.rule1Title}</div>
                    <p className="text-xs text-gray-400 leading-relaxed">{handbookContent.rule1Text}</p>
                  </div>

                  <div className="bg-[#131825] border border-gray-800 p-3.5 rounded-2xl space-y-1">
                    <div className="font-bold text-rose-400 text-xs">{handbookContent.rule2Title}</div>
                    <p className="text-xs text-gray-400 leading-relaxed">{handbookContent.rule2Text}</p>
                  </div>

                  <div className="bg-[#131825] border border-gray-800 p-3.5 rounded-2xl space-y-1">
                    <div className="font-bold text-rose-400 text-xs">{handbookContent.rule3Title}</div>
                    <p className="text-xs text-gray-400 leading-relaxed">{handbookContent.rule3Text}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-4 pb-24 overflow-y-auto max-h-[calc(100vh-150px)]">
              <h1 className="text-lg font-bold">PROFILE & SETTINGS</h1>

              <div className="bg-[#131825] border border-gray-800 p-4 rounded-2xl space-y-3">
                <div className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">
                  BLOCKED CHARACTERS FOR {currentUser.name.toUpperCase()} ({currentBlockedIds.length})
                </div>
                <div className="text-[11px] text-gray-500 italic">🔒 Private datenschutzkonforme Block-Liste für dein Profil.</div>
                {currentBlockedIds.length === 0 ? (
                  <div className="text-xs text-gray-500">No characters blocked by you.</div>
                ) : (
                  <div className="space-y-2">
                    {characters.filter(c => currentBlockedIds.includes(c.id)).map(char => (
                      <div key={char.id} className="flex justify-between items-center bg-[#0c0f17] border border-gray-800 p-2.5 rounded-xl text-xs">
                        <span className="font-semibold">{char.name}</span>
                        <button 
                          onClick={() => handleToggleBlock(char.id)}
                          className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1 rounded-lg font-bold transition"
                        >
                          Unblock
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-[#131825] border border-gray-800 p-6 rounded-3xl flex flex-col items-center space-y-3">
                <div className="w-20 h-20 rounded-full border-2 border-rose-500 bg-gray-800 flex items-center justify-center text-2xl overflow-hidden relative group">
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} className="w-full h-full object-cover" />
                  ) : (
                    <span>🍑</span>
                  )}
                  <label className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 cursor-pointer transition">
                    Change
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, updateUserAvatar)} className="hidden" />
                  </label>
                </div>
                {/* Ausloggen-Button zum Testen */}
                   <div className="my-4 px-1">
                 <button
                  onClick={handleLogout}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition duration-200 cursor-pointer"
                  >
                    Ausloggen
                   </button>
                </div>
                <div className="text-center">
                  <div className="font-bold text-base">{currentUser.name}</div>
                  <div className="text-xs text-rose-400 font-medium mt-0.5 uppercase">👑 {currentUser.role} Account</div>
                </div>
              </div>

              <div className="bg-[#131825] border border-gray-800 p-4 rounded-2xl space-y-2">
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">USER NAME</div>
                <div className="flex justify-between items-center">
                  {isEditingName ? (
                    <input 
                      type="text" 
                      value={tempUserName} 
                      onChange={(e) => setTempUserName(e.target.value)}
                      className="bg-black/50 border border-gray-700 text-white px-3 py-1.5 rounded-xl text-sm outline-none focus:border-rose-500"
                    />
                  ) : (
                    <span className="font-bold text-sm text-white">{currentUser.name}</span>
                  )}
                  <button 
                    onClick={() => isEditingName ? updateCurrentUserName() : setIsEditingName(true)}
                    className="text-rose-400 text-xs bg-rose-500/10 px-3 py-1.5 rounded-xl font-bold hover:bg-rose-500/20"
                  >
                    {isEditingName ? 'Save' : '✏️ Edit'}
                  </button>
                </div>
              </div>

              <div className="bg-[#131825] border border-gray-800 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-white flex items-center space-x-2">
                    <span>Global NSFW Override</span>
                    <span className="text-[9px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded">18+</span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Enable adult content handling for {currentUser.name}.</div>
                </div>
                <input
                  type="checkbox"
                  checked={currentUser.globalNsfw || false}
                  onChange={(e) => toggleUserNsfw(e.target.checked)}
                  className="w-5 h-5 accent-rose-500 cursor-pointer rounded"
                />
              </div>
            </div>
          )}

          {/* CHAT INTERFACE */}
          {activeTab === 'chat' && selectedCharacter && (
            <div className="flex flex-col h-full -mx-4 -my-4 p-4 min-h-[700px]">
              <div className="flex flex-col pb-3 border-b border-gray-800 space-y-2">
                <div className="flex items-center justify-between">
                  <button onClick={() => setActiveTab('home')} className="text-sm text-rose-400 font-bold">← Back</button>
                  <div className="flex flex-col items-center">
                    <div className="font-bold text-sm flex items-center space-x-2">
                      <span>{selectedCharacter.name}</span>
                      {selectedCharacter.nsfw && <span className="text-[9px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded">18+</span>}
                    </div>
                    <span className="text-[9px] text-gray-500">By {selectedCharacter.creator}</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button 
                      onClick={() => handleReportCharacter(selectedCharacter.id)} 
                      className="text-[10px] bg-gray-800 hover:bg-gray-700 text-yellow-400 px-2 py-1 rounded-lg"
                    >
                      🚨 Report
                    </button>
                    <button 
                      onClick={() => handleToggleBlock(selectedCharacter.id)} 
                      className="text-[10px] bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 px-2 py-1 rounded-lg"
                    >
                      🚫 Block
                    </button>
                  </div>
                </div>

                <div className="bg-[#131825] border border-rose-500/20 text-rose-300/80 text-[10px] px-3 py-1.5 rounded-xl flex items-center justify-center text-center space-x-1.5">
                  <span>⚠️</span>
                  <span><strong>Safety Warning:</strong> AI-generated messages can be inaccurate or explicit. 18+ mode active.</span>
                </div>
              </div>

              {/* Nachrichtenverlauf */}
              <div className="flex-1 overflow-y-auto space-y-4 py-4">
                {messages.map((msg, index) => (
                  <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm relative group ${msg.role === 'user' ? 'bg-rose-500 text-white font-medium shadow-md' : 'bg-[#131825] border border-gray-800 text-gray-200'}`}>

                      {editingMessageIndex === index ? (
                        <div className="space-y-2">
                          <textarea 
                            value={editedMessageContent}
                            onChange={(e) => setEditedMessageContent(e.target.value)}
                            className="w-full bg-black/40 text-white p-2 rounded-xl text-xs outline-none border border-gray-700 resize-none"
                          />
                          <div className="flex justify-end space-x-2">
                            <button onClick={() => setEditingMessageIndex(null)} className="text-[10px] px-2 py-1 bg-gray-700 rounded-lg">Cancel</button>
                            <button onClick={() => handleSaveEditedMessage(index)} className="text-[10px] px-2 py-1 bg-rose-500 text-white font-bold rounded-lg">Save & Resend</button>
                          </div>
                        </div>
                      ) : (
                        <div>{msg.content}</div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 mt-1 px-1 opacity-60 hover:opacity-100 transition text-[10px] text-gray-400">
                      <span>{msg.role === 'user' ? currentUser.name : selectedCharacter.name}</span>
                      <span>•</span>
                      {index !== 0 && (
                        <button onClick={() => handleDeleteMessage(index)} className="hover:text-rose-400">🗑️ Delete</button>
                      )}
                      {msg.role === 'user' && (
                        <button onClick={() => { setEditingMessageIndex(index); setEditedMessageContent(msg.content); }} className="hover:text-rose-400">✏️ Edit</button>
                      )}
                      {index === 0 && <span className="text-[9px] text-gray-600">(Protected Greeting)</span>}
                    </div>
                  </div>
                ))}
              </div>

              {messages.length > 1 && (
                <div className="flex justify-center pb-2">
                  <button 
                    onClick={handleRegenerate}
                    className="text-xs bg-[#131825] border border-gray-800 hover:border-rose-500 text-rose-400 px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition"
                  >
                    <span>🔄 Regenerate Response</span>
                  </button>
                </div>
              )}

              {/* Input-Bereich */}
              <form onSubmit={handleSendMessage} className="pt-2 flex items-center space-x-2">
                <input 
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={`Chat as ${currentUser.name}...`}
                  className="flex-1 bg-[#131825] border border-gray-800 text-white p-3 rounded-2xl text-sm outline-none focus:border-rose-500"
                />
                <button type="submit" className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-3 rounded-2xl font-black text-sm transition shadow-lg">Send</button>
              </form>
            </div>
          )}
        </div>

        {/* UNTERE NAVIGATION */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#0c0f17] border-t border-gray-800 flex justify-around items-center px-2 z-40">
          <button onClick={() => setActiveTab('home')} className={`p-2 transition flex flex-col items-center ${activeTab === 'home' ? 'text-rose-400' : 'text-gray-400'}`} title="Home">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span className="text-[9px] mt-0.5">Home</span>
          </button>

          <button onClick={() => setActiveTab('handbook')} className={`p-2 transition flex flex-col items-center ${activeTab === 'handbook' ? 'text-rose-400' : 'text-gray-400'}`} title="Handbook">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
            <span className="text-[9px] mt-0.5">Handbook</span>
          </button>

          <button 
            onClick={() => setActiveTab('create')} 
            className="w-10 h-10 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow-xl -top-3 relative transition transform hover:scale-105 font-bold text-lg"
            title="Create Character"
          >
            +
          </button>

          <button onClick={() => setActiveTab('chats')} className={`p-2 transition flex flex-col items-center ${activeTab === 'chats' ? 'text-rose-400' : 'text-gray-400'}`} title="Chats">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span className="text-[9px] mt-0.5">{currentUser ? currentUser.name : 'Login'}</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`p-2 transition flex flex-col items-center ${activeTab === 'profile' ? 'text-rose-400' : 'text-gray-400'}`}
            title="Profile"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span className="text-[9px] mt-0.5">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}