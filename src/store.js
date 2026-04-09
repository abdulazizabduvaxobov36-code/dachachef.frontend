// STORE — localStorage (offline) + Server API (online sync)
// BroadcastChannel — bir xil kompyuterdagi tablar o'rtasida

const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dachachef') : null;
if (bc) {
  bc.onmessage = (e) => {
    const { type, key } = e.data || {};
    if (type === 'chefs-updated') window.dispatchEvent(new Event('chefs-updated'));
    if (type === 'message-received' && key)
      window.dispatchEvent(new CustomEvent('message-received', { detail: { chatId: key } }));
    if (type === 'posts-updated') window.dispatchEvent(new Event('posts-updated'));
  };
}
const broadcast = (type, key) => { try { bc?.postMessage({ type, key }); } catch { } };

// Server API — xato bo'lsa null qaytaradi, dastur ishlashda davom etadi
// Production da VITE_API_URL dan foydalanadi
// Dev da Vite /api proxy mavjud bo'lsa, shu yo'l ishlaydi; aks holda 3001 to'g'ridan-to'g'ri chaqiradi.
const DEFAULT_BACKEND = `${window.location.protocol}//${window.location.hostname}:3001`;
const BASE = import.meta.env.VITE_API_URL ||
  (window.location.port === '5173' ? DEFAULT_BACKEND : `${window.location.origin}/api`);

const api = {
  get: async (path) => {
    try {
      const r = await fetch(BASE + path, { signal: AbortSignal.timeout(4000) });
      if (!r.ok) return null;
      return await r.json();
    } catch { return null; }
  },
  post: async (path, body) => {
    try {
      const r = await fetch(BASE + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(4000)
      });
      if (!r.ok) return null;
      return await r.json();
    } catch { return null; }
  },
  del: async (path) => {
    try {
      const r = await fetch(BASE + path, { method: 'DELETE', signal: AbortSignal.timeout(4000) });
      return r.ok ? await r.json() : null;
    } catch { return null; }
  }
};

const local = {
  get: (key) => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch { } },
};

export const Store = {

  // ─── CHEFS ──────────────────────────────────────────────────
  getChefs: () => {
    const chefs = local.get('registeredChefs') || [];
    if (!Array.isArray(chefs)) return [];
    const month = 30 * 24 * 60 * 60 * 1000;
    return chefs.filter(c => !c.registeredAt || Date.now() - c.registeredAt < month);
  },

  addChef: async (chef) => {
    const c = { ...chef, registeredAt: chef.registeredAt || Date.now() };
    const all = Store.getChefs();
    const i = all.findIndex(x => x.phone === c.phone);
    if (i >= 0) all[i] = c; else all.push(c);
    local.set('registeredChefs', all);
    window.dispatchEvent(new Event('chefs-updated'));
    broadcast('chefs-updated');
    api.post('/api/chefs', c);          // server sync (fon)
    return c;
  },

  updateChef: async (phone, updates) => {
    const all = Store.getChefs();
    const i = all.findIndex(c => c.phone === phone);
    if (i >= 0) {
      all[i] = { ...all[i], ...updates };
      local.set('registeredChefs', all);
      window.dispatchEvent(new Event('chefs-updated'));
      broadcast('chefs-updated');
      api.post('/api/chefs', all[i]);   // server sync
    } else if (updates.phone) {
      const nc = { ...updates, registeredAt: Date.now() };
      all.push(nc);
      local.set('registeredChefs', all);
      window.dispatchEvent(new Event('chefs-updated'));
      broadcast('chefs-updated');
      api.post('/api/chefs', nc);
    }
  },

  removeChef: async (phone) => {
    local.set('registeredChefs', Store.getChefs().filter(c => c.phone !== phone));
    // Bu oshpaz bilan bog'liq barcha chatlarni o'chirish
    Object.keys(localStorage)
      .filter(k => k.startsWith('chat_') && k.endsWith(`_${phone}`))
      .forEach(k => localStorage.removeItem(k));
    // Unread larni ham o'chirish
    Object.keys(localStorage)
      .filter(k => k.startsWith('unread_') && k.includes(`_${phone}`))
      .forEach(k => localStorage.removeItem(k));
    // Postlarni ham o'chirish
    const posts = JSON.parse(localStorage.getItem('chefPosts') || '[]');
    localStorage.setItem('chefPosts', JSON.stringify(posts.filter(p => p.chefPhone !== phone)));
    // Online statusni o'chirish
    localStorage.removeItem(`online_chef_${phone}`);
    window.dispatchEvent(new Event('chefs-updated'));
    window.dispatchEvent(new Event('posts-updated'));
    broadcast('chefs-updated');
    api.del(`/api/chefs/${phone}`);
  },

  getChefByPhone: (phone) => Store.getChefs().find(c => c.phone === phone) || null,

  listenChefs: (callback) => {
    callback(Store.getChefs());
    // Serverdan bir marta sinxronlaymiz (xato bo'lsa o'tkazib yuboramiz)
    api.get('/api/chefs').then(serverChefs => {
      if (!serverChefs || !Array.isArray(serverChefs) || serverChefs.length === 0) return;
      const local2 = Store.getChefs();
      // Serverda bor, localda yo'q bo'lsa qo'shamiz
      let changed = false;
      serverChefs.forEach(sc => {
        if (!local2.find(c => c.phone === sc.phone)) { local2.push(sc); changed = true; }
      });
      if (changed) { local.set('registeredChefs', local2); callback(local2); }
    });
    // 500ms polling — localStorage o'zgarishlarini kuzatamiz
    let lastSig = JSON.stringify(Store.getChefs().map(c => c.phone));
    const iv = setInterval(() => {
      const sig = JSON.stringify(Store.getChefs().map(c => c.phone));
      if (sig !== lastSig) { lastSig = sig; callback(Store.getChefs()); }
    }, 500);
    return () => clearInterval(iv);
  },

  // ─── CUSTOMER INFO ──────────────────────────────────────────
  saveCustomerInfo: (phone, data) => {
    if (!phone) return;
    local.set(`customerInfo_${phone}`, { phone, ...data });
    api.post(`/api/customers/${phone}`, data);   // server sync
  },

  getCustomerInfo: (phone) => {
    if (!phone) return null;
    // Avval localdan, keyin serverdan (fon)
    const cached = local.get(`customerInfo_${phone}`);
    if (!cached) {
      api.get(`/api/customers/${phone}`).then(d => {
        if (d) local.set(`customerInfo_${phone}`, d);
      });
    }
    return cached;
  },

  // ─── ONLINE ─────────────────────────────────────────────────
  setOnline: (role, id) => {
    if (!role || !id) return;
    localStorage.setItem(`online_${role}_${id}`, Date.now().toString());
    api.post('/api/online', { role, id });
  },
  setOffline: (role, id) => {
    if (!role || !id) return;
    localStorage.removeItem(`online_${role}_${id}`);
    api.del(`/api/online/${role}/${id}`);
  },
  isOnline: (role, id) => {
    const ts = localStorage.getItem(`online_${role}_${id}`);
    return ts ? Date.now() - Number(ts) < 90000 : false;
  },
  startHeartbeat: (role, id) => {
    Store.setOnline(role, id);
    const iv = setInterval(() => Store.setOnline(role, id), 20000);
    const cleanup = () => { clearInterval(iv); Store.setOffline(role, id); };
    window.addEventListener('beforeunload', cleanup);
    return cleanup;
  },

  // ─── MESSAGES ───────────────────────────────────────────────
  getMessages: (chatId) => {
    const m = local.get(`chat_${chatId}`);
    return Array.isArray(m) ? m : [];
  },

  sendMessage: async (chatId, msg) => {
    const newMsg = {
      ...msg,
      id: Date.now(),
      ts: new Date().toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit' })
    };
    const msgs = Store.getMessages(chatId);
    msgs.push(newMsg);
    local.set(`chat_${chatId}`, msgs);
    // Receiver unread++
    const parts = chatId.split('_');
    const chefPhone = parts[parts.length - 1];
    const customerPhone = parts.slice(0, -1).join('_');
    const receiverPhone = msg.sender === 'customer' ? chefPhone : customerPhone;
    const uk = `unread_${chatId}_${receiverPhone}`;
    localStorage.setItem(uk, String(parseInt(localStorage.getItem(uk) || '0') + 1));
    window.dispatchEvent(new CustomEvent('message-received', { detail: { chatId } }));
    broadcast('message-received', chatId);
    api.post(`/api/chats/${chatId}`, newMsg);    // server sync
    return newMsg;
  },

  listenMessages: (chatId, callback) => {
    let last = Store.getMessages(chatId).length;
    if (last > 0) callback(Store.getMessages(chatId));
    const onMsg = (e) => {
      if (e.detail?.chatId !== chatId) return;
      const m = Store.getMessages(chatId); last = m.length; callback(m);
    };
    window.addEventListener('message-received', onMsg);
    const onStorage = (e) => {
      if (e.key !== `chat_${chatId}`) return;
      const m = Store.getMessages(chatId); last = m.length; callback(m);
    };
    window.addEventListener('storage', onStorage);
    const iv = setInterval(() => {
      const m = Store.getMessages(chatId);
      if (m.length !== last) { last = m.length; callback(m); }
    }, 500);
    return () => {
      window.removeEventListener('message-received', onMsg);
      window.removeEventListener('storage', onStorage);
      clearInterval(iv);
    };
  },

  clearUnread: (chatId, userId) => {
    localStorage.setItem(`unread_${chatId}_${userId}`, '0');
    api.post('/api/unread/clear', { chatId, userId });
  },
  getUnread: (chatId, userId) =>
    parseInt(localStorage.getItem(`unread_${chatId}_${userId}`) || '0'),

  makeChatId: (customerPhone, chefPhone) => `${customerPhone}_${chefPhone}`,

  setTyping: (chatId, sender) =>
    localStorage.setItem(`typing_${chatId}_${sender}`, Date.now().toString()),
  isTyping: (chatId, sender) => {
    const ts = localStorage.getItem(`typing_${chatId}_${sender}`);
    return ts ? Date.now() - Number(ts) < 3000 : false;
  },

  // ─── POSTS ──────────────────────────────────────────────────
  getPosts: () => { const p = local.get('chefPosts'); return Array.isArray(p) ? p : []; },

  addPost: async (post) => {
    const np = { ...post, id: Date.now(), createdAt: Date.now() };
    const all = [np, ...Store.getPosts()];
    local.set('chefPosts', all);
    window.dispatchEvent(new Event('posts-updated'));
    broadcast('posts-updated');
    api.post('/api/posts', np);
    return np;
  },

  deletePost: async (id) => {
    local.set('chefPosts', Store.getPosts().filter(p => p.id !== id));
    window.dispatchEvent(new Event('posts-updated'));
    broadcast('posts-updated');
    api.del(`/api/posts/${id}`);
  },

  listenPosts: (callback) => {
    callback(Store.getPosts());
    const onUpdate = () => callback(Store.getPosts());
    window.addEventListener('posts-updated', onUpdate);
    return () => window.removeEventListener('posts-updated', onUpdate);
  },

  // ─── NOTIFICATIONS ──────────────────────────────────────────
  getChefNotifications: (chefPhone) =>
    Object.keys(localStorage)
      .filter(k => k.startsWith('chat_') && k.includes(`_${chefPhone}`))
      .map(k => {
        const chatId = k.replace('chat_', '');
        const unread = Store.getUnread(chatId, chefPhone);
        if (unread === 0) return null;
        const customerPhone = chatId.replace(`_${chefPhone}`, '');
        const msgs = Store.getMessages(chatId);
        return { chatId, customerPhone, unread, lastMsg: msgs.at(-1)?.text || '' };
      }).filter(Boolean),

  getCustomerNotifications: (customerPhone, chefs) =>
    chefs.map(c => {
      const chatId = Store.makeChatId(customerPhone, c.phone);
      const unread = Store.getUnread(chatId, customerPhone);
      if (unread === 0) return null;
      const msgs = Store.getMessages(chatId);
      return {
        chatId, chefPhone: c.phone,
        chefName: `${c.name} ${c.surname}`,
        chefImage: c.image,
        unread, lastMsg: msgs.at(-1)?.text || ''
      };
    }).filter(Boolean),

  getTotalUnreadForCustomer: (customerPhone) =>
    Store.getChefs().reduce((t, c) => {
      const chatId = Store.makeChatId(customerPhone, c.phone);
      return t + Store.getUnread(chatId, customerPhone);
    }, 0),

  getTotalUnreadForChef: (chefPhone) => {
    // Faqat haqiqiy chat mavjud bo'lsa hisoblash
    return Object.keys(localStorage)
      .filter(k => k.startsWith('unread_') && k.endsWith(`_${chefPhone}`))
      .reduce((t, k) => {
        const chatId = k.replace('unread_', '').replace(`_${chefPhone}`, '');
        const msgs = JSON.parse(localStorage.getItem(`chat_${chatId}`) || '[]');
        if (msgs.length === 0) return t;
        return t + parseInt(localStorage.getItem(k) || '0');
      }, 0);
  },

  // ─── SESSION ────────────────────────────────────────────────
  setSession: (role, data) => {
    const s = { role, data, loginTime: Date.now() };
    sessionStorage.setItem('session', JSON.stringify(s));
    localStorage.setItem('session', JSON.stringify(s));
    if (data.phone)
      localStorage.setItem(`saved_${role}_${data.phone}`, JSON.stringify(s));
  },

  getSession: () => {
    try {
      const raw = sessionStorage.getItem('session') || localStorage.getItem('session');
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s?.loginTime) return null;
      if (Date.now() - s.loginTime > 7 * 24 * 60 * 60 * 1000) {
        sessionStorage.removeItem('session');
        localStorage.removeItem('session');
        return null;
      }
      if (!sessionStorage.getItem('session')) sessionStorage.setItem('session', raw);
      return s;
    } catch { return null; }
  },

  clearSession: () => {
    // Faqat joriy session tozalanadi
    // saved_* kalitlari saqlanib qoladi — Entrance da ko'rinadi
    sessionStorage.removeItem('session');
    localStorage.removeItem('session');
  },

  getSavedAccounts: () => {
    const accounts = [];
    const seen = new Set();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith('saved_')) continue;
      try {
        const s = JSON.parse(localStorage.getItem(key));
        if (!s?.data?.phone) continue;
        if (seen.has(s.data.phone)) continue;
        if (Date.now() - s.loginTime > 7 * 24 * 60 * 60 * 1000) {
          localStorage.removeItem(key); continue;
        }
        seen.add(s.data.phone);
        accounts.push({ key, ...s });
      } catch { }
    }
    return accounts;
  },

  removeSavedAccount: (key) => localStorage.removeItem(key),
};

export default Store;

Store.getCustomerAllOrders = async (customerPhone) => {
  try {
    const AUTH_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:5000';
    const r = await fetch(`${AUTH_BASE}/orders/customer/${customerPhone}/all`);
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
};

Store.getCustomerOrdersForChef = async (customerPhone, chefPhone) => {
  try {
    const AUTH_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:5000';
    const r = await fetch(`${AUTH_BASE}/orders/customer/${customerPhone}/chef/${chefPhone}`);
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
};

// ─── AUTH (Backend API) ─────────────────────────────────────
Store.authRegister = async ({ name, email, password, role }) => {
  try {
    const AUTH_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:5000';
    const r = await fetch(`${AUTH_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });
    const data = await r.json();
    if (!r.ok) return { ok: false, message: data.message || 'Xato' };
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('authUser', JSON.stringify(data.user));
    return { ok: true, ...data };
  } catch {
    return { ok: false, message: 'Server bilan aloqa yo\'q' };
  }
};

Store.authLogin = async ({ email, password }) => {
  try {
    const AUTH_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:5000';
    const r = await fetch(`${AUTH_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await r.json();
    if (!r.ok) return { ok: false, message: data.message || 'Xato' };
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('authUser', JSON.stringify(data.user));
    return { ok: true, ...data };
  } catch {
    return { ok: false, message: 'Server bilan aloqa yo\'q' };
  }
};

Store.getAuthToken = () => localStorage.getItem('authToken') || null;
Store.getAuthUser = () => { try { return JSON.parse(localStorage.getItem('authUser')); } catch { return null; } };
Store.authLogout = () => { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); };