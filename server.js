// ============================================================
//  OSHPAZ.UZ — Backend Server
//  Ishga tushirish: node server.js
//  Frontend:       npm run dev  (boshqa terminal)
// ============================================================

import express      from 'express';
import cors         from 'cors';
import { createServer } from 'http';
import { Server }   from 'socket.io';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const app        = express();
const httpServer = createServer(app);
const io         = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET','POST','PUT','DELETE'] }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ─── JSON "database" ─────────────────────────────────────────
const DB = new URL('./data.json', import.meta.url);

const empty = {
  chefs:       [],   // [{phone, name, surname, exp, image, registeredAt}]
  customers:   {},   // { phone: {firstName, lastName, phone, image} }
  chats:       {},   // { chatId: [{id,text,sender,from,to,ts}] }
  unread:      {},   // { "chatId_phone": count }
  posts:       [],   // [{id,chefPhone,dishName,image,createdAt}]
  orders:      [],   // [{_id, customerPhone, chefPhone, amount, status, rating, review, createdAt, completedAt}]
  online:      {},   // { "chef_phone" | "customer_phone": timestamp }
};

const read  = () => {
  try {
    if (!existsSync(DB)) { write(empty); return { ...empty }; }
    return JSON.parse(readFileSync(DB, 'utf8'));
  } catch { return { ...empty }; }
};
const write = (d) => {
  try { writeFileSync(DB, JSON.stringify(d, null, 2)); } catch {}
};

// ─── CHEFS ───────────────────────────────────────────────────
// Barcha oshpazlar ro'yxati
app.get('/api/chefs', (_req, res) => {
  try {
    const d = read();
    let chefs = d.chefs || [];
    if (!Array.isArray(chefs)) chefs = Object.values(chefs);
    // 30 kundan eski akklar filtrlash
    const month = 30 * 24 * 60 * 60 * 1000;
    chefs = chefs.filter(c => !c.registeredAt || Date.now() - c.registeredAt < month);
    res.json(chefs);
  } catch (err) {
    console.error('/api/chefs GET error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Oshpaz qo'shish / yangilash
app.post('/api/chefs', (req, res) => {
  try {
    const d = read();
    const chef = { ...req.body, registeredAt: req.body.registeredAt || Date.now() };
    if (!Array.isArray(d.chefs)) d.chefs = [];
    const i = d.chefs.findIndex(c => c.phone === chef.phone);
    if (i >= 0) d.chefs[i] = chef; else d.chefs.push(chef);
    write(d);
    io.emit('chefs-updated', d.chefs);
    res.json({ ok: true, chef });
  } catch (err) {
    console.error('/api/chefs POST error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/chefs/:phone', (req, res) => {
  try {
    const d = read();
    if (!Array.isArray(d.chefs)) d.chefs = [];
    const index = d.chefs.findIndex(c => c.phone === req.params.phone);
    if (index === -1) return res.status(404).json({ error: 'Chef not found' });
    d.chefs[index] = { ...d.chefs[index], ...req.body, phone: req.body.phone || d.chefs[index].phone };
    write(d);
    io.emit('chefs-updated', d.chefs);
    res.json({ ok: true, chef: d.chefs[index] });
  } catch (err) {
    console.error('/api/chefs PUT error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Oshpazni o'chirish
app.delete('/api/chefs/:phone', (req, res) => {
  const d = read();
  d.chefs = (d.chefs || []).filter(c => c.phone !== req.params.phone);
  write(d);
  io.emit('chefs-updated', d.chefs);
  res.json({ ok: true });
});

// ─── CUSTOMERS ───────────────────────────────────────────────
// Mijoz ma'lumoti (rasm va ism — chat da ko'rish uchun)
app.post('/api/customers/:phone', (req, res) => {
  const d = read();
  d.customers = d.customers || {};
  d.customers[req.params.phone] = { phone: req.params.phone, ...req.body };
  write(d);
  res.json({ ok: true });
});

app.get('/api/customers/:phone', (req, res) => {
  const d = read();
  res.json((d.customers || {})[req.params.phone] || null);
});

// ─── ONLINE ──────────────────────────────────────────────────
// Online holat belgilash
app.post('/api/online', (req, res) => {
  try {
    const { role, id } = req.body;
    if (!role || !id) return res.status(400).json({ error: 'role va id kerak' });
    const d = read();
    d.online = d.online || {};
    d.online[`${role}_${id}`] = Date.now();
    write(d);
    io.emit('online-updated', { role, id, ts: d.online[`${role}_${id}`] });
    res.json({ ok: true });
  } catch (err) {
    console.error('/api/online POST error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Offline
app.delete('/api/online/:role/:id', (req, res) => {
  try {
    const d = read();
    d.online = d.online || {};
    delete d.online[`${req.params.role}_${req.params.id}`];
    write(d);
    io.emit('online-updated', { role: req.params.role, id: req.params.id, ts: null });
    res.json({ ok: true });
  } catch (err) {
    console.error('/api/online DELETE error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Online holatlarni olish
app.get('/api/online', (_req, res) => {
  try {
    const d = read();
    // 90 soniyadan eski online larni tozalaymiz
    const limit = 90 * 1000;
    const online = d.online || {};
    const fresh = {};
    Object.entries(online).forEach(([k, ts]) => {
      if (Date.now() - ts < limit) fresh[k] = ts;
    });
    res.json(fresh);
  } catch (err) {
    console.error('/api/online GET error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── MESSAGES ────────────────────────────────────────────────
// Chat ID: customerPhone_chefPhone

// Barcha xabarlarni olish
app.get('/api/chats/:chatId', (req, res) => {
  const d = read();
  res.json((d.chats || {})[req.params.chatId] || []);
});

// Xabar yuborish
app.post('/api/chats/:chatId', (req, res) => {
  const d    = read();
  const msg  = req.body;
  const cid  = req.params.chatId;
  d.chats    = d.chats || {};
  d.unread   = d.unread || {};
  d.chats[cid] = [...(d.chats[cid] || []), msg];
  // Qabul qiluvchining unread++
  const key = `${cid}_${msg.to}`;
  d.unread[key] = (d.unread[key] || 0) + 1;
  write(d);
  io.emit('message-received', { chatId: cid, msg });
  res.json({ ok: true, msg });
});

// Oshpaz uchun o'ziga tegishli chatlar ro'yxati
app.get('/api/chats/list', (req, res) => {
  const { phone } = req.query;
  const d = read();
  const all = Object.keys(d.chats || {});
  const filtered = phone ? all.filter(id => id.endsWith(`_${phone}`)) : all;
  res.json(filtered);
});

// Chatni o'chirish
app.delete('/api/chats/:chatId', (req, res) => {
  const d = read();
  delete (d.chats || {})[req.params.chatId];
  write(d);
  res.json({ ok: true });
});

// ─── UNREAD ──────────────────────────────────────────────────
// O'qilmagan xabarlar sonini olish
app.get('/api/unread/:chatId/:userId', (req, res) => {
  const d   = read();
  const key = `${req.params.chatId}_${req.params.userId}`;
  res.json({ count: (d.unread || {})[key] || 0 });
});

// O'qildi deb belgilash
app.post('/api/unread/clear', (req, res) => {
  const { chatId, userId } = req.body;
  const d = read();
  d.unread = d.unread || {};
  d.unread[`${chatId}_${userId}`] = 0;
  write(d);
  res.json({ ok: true });
});

// ─── POSTS ───────────────────────────────────────────────────
// Barcha postlar
app.get('/api/posts', (_req, res) => {
  const d = read();
  res.json(d.posts || []);
});

// Oshpazning postlari
app.get('/api/posts/:chefPhone', (req, res) => {
  const d = read();
  const posts = (d.posts || []).filter(p => p.chefPhone === req.params.chefPhone);
  res.json(posts);
});

// Post qo'shish
app.post('/api/posts', (req, res) => {
  const d    = read();
  const post = { ...req.body, id: Date.now(), createdAt: Date.now() };
  d.posts    = [post, ...(d.posts || [])];
  write(d);
  io.emit('posts-updated', d.posts);
  res.json({ ok: true, post });
});

// Post o'chirish
app.delete('/api/posts/:id', (req, res) => {
  const d = read();
  d.posts = (d.posts || []).filter(p => String(p.id) !== req.params.id);
  write(d);
  io.emit('posts-updated', d.posts);
  res.json({ ok: true });
});

// ─── ORDERS ──────────────────────────────────────────────────
// Buyurtma yaratish
app.post('/api/orders', (req, res) => {
  try {
    const d = read();
    const order = { ...req.body, _id: Date.now().toString(), createdAt: Date.now(), status: 'pending' };
    d.orders = d.orders || [];
    d.orders.push(order);
    write(d);
    res.json({ ok: true, order });
  } catch (err) {
    console.error('/api/orders POST error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mijozning barcha buyurtmalari
app.get('/api/orders/customer/:phone/all', (req, res) => {
  try {
    const d = read();
    const orders = (d.orders || []).filter(o => o.customerPhone === req.params.phone);
    res.json({ orders });
  } catch (err) {
    console.error('/api/orders/customer/:phone/all GET error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Buyurtmani baholash
app.patch('/api/orders/:id/rating', (req, res) => {
  try {
    const d = read();
    const orderId = req.params.id;
    const { rating, review } = req.body;
    d.orders = d.orders || [];
    const order = d.orders.find(o => o._id === orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    order.rating = rating;
    order.review = review;
    order.status = 'completed';
    order.completedAt = Date.now();
    // Pul o'tkazish logikasi (komissiya)
    // Oshpazdan 10% komissiya olamiz
    const commission = Math.round(order.amount * 0.1);
    console.log(`Order ${orderId} completed. Commission: ${commission} from chef ${order.chefPhone}`);
    write(d);
    res.json({ ok: true, order });
  } catch (err) {
    console.error('/api/orders/:id/rating PATCH error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── SOCKET.IO real-time ─────────────────────────────────────
io.on('connection', (socket) => {
  // Ulanganda hozirgi ma'lumotlarni yuborish
  const d = read();
  socket.emit('init', {
    chefs:  d.chefs  || [],
    posts:  d.posts  || [],
    online: d.online || {},
  });

  // Typing indicator
  socket.on('typing',      ({ chatId, sender }) => socket.broadcast.emit('typing',      { chatId, sender }));
  socket.on('stop-typing', ({ chatId, sender }) => socket.broadcast.emit('stop-typing', { chatId, sender }));

  // Online heartbeat (socket orqali)
  socket.on('heartbeat', ({ role, id }) => {
    const d = read();
    d.online = d.online || {};
    d.online[`${role}_${id}`] = Date.now();
    write(d);
    socket.broadcast.emit('online-updated', { role, id, ts: Date.now() });
  });

  socket.on('disconnect', () => {});
});

// ─── START ───────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log('\n🍽️  OSHPAZ.UZ backend ishga tushdi!');
  console.log(`   http://localhost:${PORT}`);
  console.log('   Frontend: npm run dev (boshqa terminaldo)\n');
  console.log('   Endpointlar:');
  console.log('   GET    /api/chefs');
  console.log('   POST   /api/chefs');
  console.log('   POST   /api/customers/:phone');
  console.log('   GET    /api/chats/:chatId');
  console.log('   POST   /api/chats/:chatId');
  console.log('   GET    /api/posts');
  console.log('   POST   /api/posts\n');
});
