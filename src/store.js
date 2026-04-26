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
const BASE = import.meta.env?.VITE_API_URL || 'http://localhost:5000';

const api = {
  get: async (path) => {
    // Hech qanday network so'rov yubormaslik
    return null;
  },
  post: async (path, body) => {
    // Hech qanday network so'rov yubormaslik
    return null;
  },
  put: async (path, body) => {
    // Hech qanday network so'rov yubormaslik
    return null;
  },
  del: async (path) => {
    // Hech qanday network so'rov yubormaslik
    return null;
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
    // Barcha oshpazlarni ko'rsatish, vaqt cheklovsiz
    return chefs.filter(c => c.phone && c.name);
  },

  addChef: async (chef) => {
    console.log('Store.addChef - Input chef:', chef);
    const c = { ...chef, registeredAt: chef.registeredAt || Date.now() };
    const all = Store.getChefs();
    console.log('Store.addChef - Current chefs:', all);
    const i = all.findIndex(x => x.phone === c.phone);
    if (i >= 0) all[i] = c; else all.push(c);
    console.log('Store.addChef - Updated chefs:', all);
    local.set('registeredChefs', all);
    console.log('Store.addChef - Saved to localStorage, checking:', localStorage.getItem('registeredChefs'));
    window.dispatchEvent(new Event('chefs-updated'));
    broadcast('chefs-updated');
    api.post('/chefs', c);          // server sync (fon)
    return c;
  },

  updateChef: async (phone, updates) => {
    const all = Store.getChefs();
    const i = all.findIndex(c => c.phone === phone);
    if (i >= 0) {
      const oldPhone = all[i].phone;
      const newPhone = updates.phone;

      // Telefon raqami o'zgargan bo'lsa, eski ma'lumotlarni tozalash
      if (oldPhone && newPhone && oldPhone !== newPhone) {
        console.log('Chef phone changed from', oldPhone, 'to', newPhone);

        // Eski telefon raqami bilan bog'liq ma'lumotlarni tozalash
        Object.keys(localStorage)
          .filter(key =>
            key.startsWith(`saved_chef_${oldPhone}`) ||
            key.startsWith(`chef_${oldPhone}`) ||
            key.startsWith(`chat_`) && key.endsWith(`_${oldPhone}`) ||
            key.startsWith(`unread_`) && key.includes(`_${oldPhone}`)
          )
          .forEach(key => {
            console.log('Removing old key:', key);
            localStorage.removeItem(key);
          });

        // Eski oshpazni ro'yxatdan o'chirib, yangisini qo'shish
        all.splice(i, 1);
        const newChef = { ...updates, registeredAt: Date.now() };
        all.push(newChef);
        local.set('registeredChefs', all);
        window.dispatchEvent(new Event('chefs-updated'));
        broadcast('chefs-updated');
        api.post('/chefs', newChef);
      } else {
        // Telefon raqami o'zgarmagan bo'lsa, oddiy yangilash
        all[i] = { ...all[i], ...updates };
        local.set('registeredChefs', all);
        window.dispatchEvent(new Event('chefs-updated'));
        broadcast('chefs-updated');
        api.post('/chefs', all[i]);   // server sync
      }
    } else if (updates.phone) {
      const nc = { ...updates, registeredAt: Date.now() };
      all.push(nc);
      local.set('registeredChefs', all);
      window.dispatchEvent(new Event('chefs-updated'));
      broadcast('chefs-updated');
      api.post('/chefs', nc);
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
    // Eventlarni yuborish - GlabalPage yangilanishi uchun
    window.dispatchEvent(new Event('chefs-updated'));
    window.dispatchEvent(new Event('posts-updated'));
    broadcast('chefs-updated');
    console.log('chefs-updated event dispatched after removal');
    api.del(`/chefs/${phone}`);
  },

  getChefByPhone: (phone) => Store.getChefs().find(c => c.phone === phone) || null,

  listenChefs: (callback) => {
    callback(Store.getChefs());
    // Serverdan bir marta sinxronlaymiz (xato bo'lsa o'tkazib yuboramiz)
    api.get('/chefs').then(serverChefs => {
      if (!serverChefs || !Array.isArray(serverChefs) || serverChefs.length === 0) return;
      const local2 = Store.getChefs();
      // Serverda bor, localda yo'q bo'lsa qo'shamiz
      let changed = false;
      serverChefs.forEach(sc => {
        if (!local2.find(c => c.phone === sc.phone)) { local2.push(sc); changed = true; }
      });
      if (changed) { local.set('registeredChefs', local2); callback(local2); }
    });
    // Safe retry logic for chefs updates
    let retry = 1000;
    const fetchSafe = async () => {
      try {
        await api.get('/chefs');
        retry = 1000;
      } catch {
        retry = Math.min(retry * 2, 10000);
      }
      setTimeout(fetchSafe, retry);
    };
    fetchSafe();
  },

  // ─── CUSTOMER INFO ──────────────────────────────────────────
  saveCustomerInfo: (phone, data) => {
    if (!phone) return;
    local.set(`customerInfo_${phone}`, { phone, ...data });
    api.post(`/customers/${phone}`, data);   // server sync
  },

  getCustomerInfo: (phone) => {
    if (!phone) return null;
    // Avval localdan, keyin serverdan (fon)
    const cached = local.get(`customerInfo_${phone}`);
    if (!cached) {
      api.get(`/customers/${phone}`).then(d => {
        if (d) local.set(`customerInfo_${phone}`, d);
      });
    }
    return cached;
  },

  // ─── ONLINE ─────────────────────────────────────────────────
  setOnline: (role, id) => {
    if (!role || !id) return;
    localStorage.setItem(`online_${role}_${id}`, Date.now().toString());
    api.post('/online', { role, id });
  },
  setOffline: (role, id) => {
    if (!role || !id) return;
    localStorage.removeItem(`online_${role}_${id}`);
    api.del(`/online/${role}/${id}`);
  },
  isOnline: (role, id) => {
    const ts = localStorage.getItem(`online_${role}_${id}`);
    return ts ? Date.now() - Number(ts) < 90000 : false;
  },
  startHeartbeat: (role, id) => {
    Store.setOnline(role, id);
    let retry = 20000;
    const heartbeatSafe = async () => {
      try {
        Store.setOnline(role, id);
        retry = 20000;
      } catch {
        retry = Math.min(retry * 2, 60000);
      }
      setTimeout(heartbeatSafe, retry);
    };
    heartbeatSafe();
    const cleanup = () => { Store.setOffline(role, id); };
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
    api.post(`/chats/${chatId}`, newMsg);    // server sync
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
    // Safe retry logic for messages
    let retry = 1000;
    const fetchMessagesSafe = async () => {
      try {
        const m = Store.getMessages(chatId);
        if (m.length !== last) { last = m.length; callback(m); }
        retry = 1000;
      } catch {
        retry = Math.min(retry * 2, 10000);
      }
      setTimeout(fetchMessagesSafe, retry);
    };
    fetchMessagesSafe();
    return () => {
      window.removeEventListener('message-received', onMsg);
      window.removeEventListener('storage', onStorage);
    };
  },

  clearUnread: (chatId, userId) => {
    localStorage.setItem(`unread_${chatId}_${userId}`, '0');
    api.post('/unread/clear', { chatId, userId });
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
    api.post('/posts', np);
    return np;
  },

  deletePost: async (id) => {
    local.set('chefPosts', Store.getPosts().filter(p => p.id !== id));
    window.dispatchEvent(new Event('posts-updated'));
    broadcast('posts-updated');
    api.del(`/posts/${id}`);
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
        return { chatId, customerPhone, unread, lastMsg: msgs.at(-1)?.text || 'http://localhost:5000' };
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
        unread, lastMsg: msgs.at(-1)?.text || 'http://localhost:5000'
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

  // ─── BIR TG — BITTA AKK TEKSHIRUVI ─────────────────────────
  // Berilgan telefon raqami allaqachon boshqa rol bilan ro'yxatdan o'tganini tekshiradi
  isPhoneRegistered: (phone) => {
    // Faqat faol saved_ kalitlarini tekshirish (7 kun ichida)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith('saved_')) continue;
      try {
        const s = JSON.parse(localStorage.getItem(key));
        if (s?.data?.phone === phone) {
          if (Date.now() - s.loginTime > 7 * 24 * 60 * 60 * 1000) {
            localStorage.removeItem(key);
            continue;
          }
          return { registered: true, role: s.role };
        }
      } catch { }
    }
    // Faqat registeredChefs dan oshpazni tekshirish
    const chefs = Store.getChefs();
    const chef = chefs.find(c => c.phone === phone);
    if (chef) return { registered: true, role: 'chef' };
    return { registered: false, role: null };
  },

  clearAllChefs: () => {
    localStorage.removeItem('registeredChefs');
    window.dispatchEvent(new Event('chefs-updated'));
  },
};

export default Store;

Store.createOrder = async (customerId, chefId, price, source = 'customer') => {
  try {
    const response = await api.post('/orders', { customerId, chefId, price, source });
    return response;
  } catch (error) {
    console.error('Create order error:', error);
    return null;
  }
};

Store.getOrders = async () => {
  try {
    return await api.get('/orders');
  } catch (error) {
    console.error('Get orders error:', error);
    return null;
  }
};

Store.getChefOrders = async (chefId) => {
  try {
    return await api.get(`/orders/chef/${chefId}`);
  } catch (error) {
    console.error('Get chef orders error:', error);
    return null;
  }
};

Store.getCustomerOrders = async (customerId) => {
  try {
    return await api.get(`/orders/customer/${customerId}`);
  } catch (error) {
    console.error('Get customer orders error:', error);
    return null;
  }
};

Store.updateOrder = async (orderId, status) => {
  try {
    return await api.put(`/orders/${orderId}`, { status });
  } catch (error) {
    console.error('Update order error:', error);
    return null;
  }
};

Store.getCustomerAllOrders = async (customerPhone) => {
  try {
    return await api.get(`/orders/customer/${customerPhone}/all`);
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

// Baho va izoh qoldirish
Store.updateOrderRating = async (orderId, rating, review) => {
  try {
    const AUTH_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:5000';
    console.log('Rating API call:', `${AUTH_BASE}/orders/${orderId}/rating`, { rating, review });
    const r = await fetch(`${AUTH_BASE}/orders/${orderId}/rating`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, review }),
    });
    console.log('Rating API response:', r.status, r.ok);
    if (!r.ok) {
      console.error('Rating API error:', await r.text());
      return null;
    }
    return await r.json();
  } catch (error) {
    console.error('Rating API exception:', error);
    return null;
  }
};

// Oshpazning barcha baholari
Store.getChefRatings = async (chefPhone) => {
  try {
    const AUTH_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:5000';
    const r = await fetch(`${AUTH_BASE}/orders/chef/${chefPhone}/ratings`);
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
};

// Mijoz qoldirgan barcha baholar
Store.getCustomerRatings = async (customerPhone) => {
  try {
    const AUTH_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:5000';
    const r = await fetch(`${AUTH_BASE}/orders/customer/${customerPhone}/ratings`);
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
};

// Oshpazga notification yuborish (baho va izoh uchun)
Store.sendChefNotification = async (chefPhone, notification) => {
  try {
    const AUTH_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:5000';
    const r = await fetch(`${AUTH_BASE}/notifications/chef`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chefPhone, ...notification }),
    });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
};

// --- AUTH (Backend API) ---─────────────────────────────────────
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