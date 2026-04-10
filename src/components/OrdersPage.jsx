import { Box, Text } from '@chakra-ui/react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { FaArrowLeft, FaPaperPlane, FaHome, FaClipboardList, FaHeart, FaUser, FaStar } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import Store from '../store';
import RatingModal from './RatingModal';

const OrdersPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const getCD = () => {
    const s = JSON.parse(localStorage.getItem('customerData') || 'null');
    if (s?.phone) return s;
    const sess = Store.getSession();
    if (sess?.role === 'customer' && sess?.data?.phone) return sess.data;
    return { phone: 'guest' };
  };
  const customerData = getCD();
  const myPhone = customerData.phone || 'guest';

  const navChefPhone = location.state?.chefPhone;
  const navChefName = location.state?.chefName;

  const buildChat = (c) => ({
    id: Store.makeChatId(myPhone, c.phone),
    chefName: `${c.name} ${c.surname}`,
    chefPhone: c.phone,
    chefImage: c.image || null,
  });

  const findInitial = () => {
    const chefs = Store.getChefs();
    if (navChefPhone) { const c = chefs.find(c => c.phone === navChefPhone); if (c) return buildChat(c); }
    if (navChefName) { const c = chefs.find(c => `${c.name} ${c.surname}` === navChefName); if (c) return buildChat(c); }
    return null;
  };

  const [selectedChat, setSelectedChat] = useState(findInitial);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState({});
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [chefTyping, setChefTyping] = useState(false);
  const [newMsgChatId, setNewMsgChatId] = useState(null);
  const [deletingId, setDeletingId] = useState(null); // Instagram highlight
  const [orders, setOrders] = useState([]);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const endRef = useRef(null);

  const getChats = useCallback(() => {
    const activeChefs = Store.getChefs();
    const activePhones = new Set(activeChefs.map(c => c.phone));
    // Faqat aktiv (o'chirilmagan) oshpazlar bilan chatlarni ko'rsatish
    return activeChefs.map(c => {
      const chatId = Store.makeChatId(myPhone, c.phone);
      const msgs = Store.getMessages(chatId);
      if (msgs.length === 0) return null;
      const last = msgs[msgs.length - 1];
      return {
        id: chatId,
        chefName: `${c.name} ${c.surname}`,
        chefPhone: c.phone,
        chefImage: c.image || null,
        lastMsg: last.text,
        time: last.ts,
        unread: Store.getUnread(chatId, myPhone),
        lastSender: last.sender,
      };
    }).filter(Boolean).sort((a, b) => b.unread - a.unread);
  }, [myPhone]);

  const [chats, setChats] = useState(getChats);
  const totalUnread = chats.reduce((s, c) => s + (c.unread || 0), 0);

  // Buyurtmalarni serverdan olish
  const fetchOrders = useCallback(async () => {
    if (!myPhone || myPhone === 'guest') { setOrders([]); return; }
    try {
      const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${BASE}/orders/customer/${myPhone}/all`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      } else {
        setOrders([]);
      }
    } catch {
      setOrders([]);
    }
  }, [myPhone]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Baho qoldirish
  const handleRatingSubmit = async (orderId, rating, review) => {
    try {
      const result = await Store.updateOrderRating(orderId, rating, review);
      if (result) {
        await fetchOrders();
        const order = orders.find(o => o._id === orderId);
        if (order && selectedChat) {
          const ratingText = `${rating} yulduz${review ? ': ' + review : ''}`;
          Store.sendMessage(selectedChat.id, { text: `Sizga ${ratingText} baho berdim!`, sender: 'customer', from: myPhone, to: selectedChat.chefPhone });
        }
      }
    } catch (error) {
      console.error('Baho qoldirishda xatolik:', error);
      throw error;
    }
  };

  // Yangi xabar tinglash
  useEffect(() => {
    const onMsg = (e) => {
      setChats(getChats());
      const cid = e.detail?.chatId;
      if (cid && cid !== selectedChat?.id) {
        setNewMsgChatId(cid);
        setTimeout(() => setNewMsgChatId(null), 3000);
      }
    };
    const onStorage = (e) => {
      if (e.key?.startsWith('chat_') || e.key === 'registeredChefs') setChats(getChats());
    };
    window.addEventListener('message-received', onMsg);
    window.addEventListener('storage', onStorage);
    const poll = setInterval(() => setChats(getChats()), 1000);
    return () => {
      window.removeEventListener('message-received', onMsg);
      window.removeEventListener('storage', onStorage);
      clearInterval(poll);
    };
  }, [selectedChat?.id, getChats]);

  // Tanlangan chat xabarlari
  useEffect(() => {
    if (!selectedChat) return;
    const fresh = Store.getMessages(selectedChat.id);
    setMessages(prev => ({ ...prev, [selectedChat.id]: fresh }));
    Store.clearUnread(selectedChat.id, myPhone);
    const unsub = Store.listenMessages(selectedChat.id, msgs => {
      setMessages(prev => ({ ...prev, [selectedChat.id]: msgs }));
      Store.clearUnread(selectedChat.id, myPhone);
      setChats(getChats());
    });
    const onStorage = e => {
      if (e.key === `chat_${selectedChat.id}`) {
        const msgs = Store.getMessages(selectedChat.id);
        setMessages(prev => ({ ...prev, [selectedChat.id]: msgs }));
        Store.clearUnread(selectedChat.id, myPhone);
        setChats(getChats());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => { unsub?.(); window.removeEventListener('storage', onStorage); };
  }, [selectedChat?.id]);

  // Typing indicator
  useEffect(() => {
    if (!selectedChat) return;
    const id = setInterval(() => {
      const ts = localStorage.getItem(`typing_${selectedChat.id}_chef`);
      setChefTyping(ts ? Date.now() - Number(ts) < 3000 : false);
    }, 300);
    return () => clearInterval(id);
  }, [selectedChat?.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, selectedChat, chefTyping]);

  const sendMsg = () => {
    if (!message.trim() || !selectedChat) return;
    localStorage.removeItem(`typing_${selectedChat.id}_customer`);
    Store.sendMessage(selectedChat.id, { text: message, sender: 'customer', from: myPhone, to: selectedChat.chefPhone });
    setMessages(prev => ({ ...prev, [selectedChat.id]: Store.getMessages(selectedChat.id) }));
    setMessage('');
    setChats(getChats());
  };

  const handleTyping = val => {
    setMessage(val);
    if (!selectedChat) return;
    localStorage.setItem(`typing_${selectedChat.id}_customer`, Date.now().toString());
    if (typingTimeout) clearTimeout(typingTimeout);
    setTypingTimeout(setTimeout(() => localStorage.removeItem(`typing_${selectedChat.id}_customer`), 3000));
  };

  const confirmDelete = (chatId) => { setDeletingId(chatId); setTimeout(() => setDeletingId(null), 3000); };
  const doDelete = (chatId) => { localStorage.removeItem(`chat_${chatId}`); setChats(getChats()); setDeletingId(null); if (selectedChat?.id === chatId) setSelectedChat(null); };

  const isOnline = phone => phone ? Store.isOnline('chef', phone) : false;

  // Avatar komponenti
  const Avatar = ({ image, name, size = 48 }) => {
    const letter = name?.charAt(0)?.toUpperCase() || '?';
    return image
      ? <img src={image} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
      : <Box w={`${size}px`} h={`${size}px`} borderRadius="full" bgColor="#C03F0C" flexShrink={0}
        display="flex" alignItems="center" justifyContent="center" color="white" fontWeight="700"
        style={{ fontSize: `${Math.round(size * 0.35)}px` }}>
        {letter}
      </Box>;
  };

  const NavBar = () => (
    <Box className="fixed-bottom" borderTop="1px solid #F0EBE6"
      display="flex" justifyContent="space-around" alignItems="center" py="10px">
      {[
        { icon: FaHome, route: '/glabal', label: t('footer.home'), badge: 0 },
        { icon: FaClipboardList, route: '/orderspage', label: t('footer.orders'), badge: totalUnread },
        { icon: FaHeart, route: '/like', label: t('footer.like'), badge: 0 },
        { icon: FaUser, route: '/profile', label: t('footer.profile'), badge: 0 },
      ].map(tab => (
        <Box key={tab.route} display="flex" flexDir="column" alignItems="center" gap="3px"
          cursor="pointer" px="14px" onClick={() => navigate(tab.route)}>
          <Box position="relative" display="inline-block">
            <tab.icon style={{ fontSize: '22px', color: location.pathname === tab.route ? '#C03F0C' : '#B0A8A4' }} />
            {tab.badge > 0 && (
              <Box position="absolute" top="-6px" right="-8px" minW="17px" h="17px" px="3px"
                bgColor="#C03F0C" borderRadius="full" display="flex" alignItems="center"
                justifyContent="center" color="white" fontWeight="800" style={{ fontSize: '9px' }}>
                {tab.badge > 9 ? '9+' : tab.badge}
              </Box>
            )}
          </Box>
          <Text fontWeight="700" style={{ fontSize: '10px', color: location.pathname === tab.route ? '#C03F0C' : '#B0A8A4' }}>{tab.label}</Text>
        </Box>
      ))}
    </Box>
  );

  // === CHAT OYNASI ===
  if (selectedChat) {
    const chatMsgs = messages[selectedChat.id] || [];
    const doneOrders = orders.filter(o => o.chefPhone === selectedChat.chefPhone && o.status === 'done');
    return (
      <Box h="100dvh" display="flex" flexDir="column" bgColor="#FFF5F0">
        {/* Header */}
        <Box bgColor="white" px="16px" pt="14px" pb="12px"
          display="flex" alignItems="center" gap="12px"
          boxShadow="0 1px 0 #F0EBE6" flexShrink={0}>
          <Box cursor="pointer" onClick={() => { setSelectedChat(null); setChats(getChats()); }}
            w="36px" h="36px" bgColor="#FFF0EC" borderRadius="full"
            display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
            <FaArrowLeft style={{ fontSize: '14px', color: '#C03F0C' }} />
          </Box>
          {/* Oshpaz rasmiga bossak profil sahifasiga o'tish */}
          <Box cursor="pointer" flexShrink={0}
            onClick={() => {
              const chefs = Store.getChefs();
              const idx = chefs.findIndex(c => c.phone === selectedChat.chefPhone);
              if (idx >= 0) navigate(`/chef-view/${idx}`);
            }}>
            <Avatar image={selectedChat.chefImage} name={selectedChat.chefName} size={40} />
          </Box>
          <Box flex="1" minW={0} cursor="pointer"
            onClick={() => {
              const chefs = Store.getChefs();
              const idx = chefs.findIndex(c => c.phone === selectedChat.chefPhone);
              if (idx >= 0) navigate(`/chef-view/${idx}`);
            }}>
            <Text fontWeight="700" color="#1C110D" noOfLines={1} style={{ fontSize: '15px' }}>
              {selectedChat.chefName}
            </Text>
            <Text style={{ fontSize: '11px', color: chefTyping ? '#C03F0C' : isOnline(selectedChat.chefPhone) ? '#22C55E' : '#B0A8A4' }}>
              {chefTyping ? `✍️ ${t('common.typing')}` : isOnline(selectedChat.chefPhone) ? t('common.online') : t('common.offline')}
            </Text>
          </Box>
        </Box>

        {/* Xabarlar */}
        <Box flex="1" overflowY="auto" px="16px" py="14px"
          display="flex" flexDir="column" gap="8px" style={{ paddingBottom: '80px' }}>
          {chatMsgs.length === 0 && (
            <Box textAlign="center" py="40px">
              <Text color="#B0A8A4" style={{ fontSize: '13px' }}>{t('orders.noMsg')}</Text>
            </Box>
          )}
          {chatMsgs.map((msg, i) => (
            <Box key={i} display="flex"
              justifyContent={msg.sender === 'customer' ? 'flex-end' : 'flex-start'}
              alignItems="flex-end" gap="6px">
              {/* FAQAT oshpaz xabarida — oshpaz rasmi chap tomonda */}
              {msg.sender !== 'customer' && (
                <Avatar image={selectedChat.chefImage} name={selectedChat.chefName} size={28} />
              )}
              <Box maxW="75%" px="14px" py="9px"
                borderRadius={msg.sender === 'customer' ? '18px 18px 4px 18px' : '18px 18px 18px 4px'}
                bgColor={msg.sender === 'customer' ? '#C03F0C' : 'white'}
                color={msg.sender === 'customer' ? 'white' : '#1C110D'}
                boxShadow="0 1px 4px rgba(0,0,0,0.08)">
                <Text style={{ fontSize: '14px', lineHeight: '1.4' }}>{msg.text}</Text>
                <Text mt="3px" textAlign="right"
                  style={{ fontSize: '10px', color: msg.sender === 'customer' ? 'rgba(255,255,255,0.6)' : '#B0A8A4' }}>
                  {msg.ts}
                </Text>
              </Box>
              {/* Mijoz o'z rasmini KO'RMAYDI */}
            </Box>
          ))}
          {chefTyping && (
            <Box display="flex" alignItems="flex-end" gap="6px">
              <Avatar image={selectedChat.chefImage} name={selectedChat.chefName} size={28} />
              <Box px="14px" py="10px" borderRadius="18px 18px 18px 4px" bgColor="white"
                boxShadow="0 1px 4px rgba(0,0,0,0.08)" display="flex" gap="4px" alignItems="center">
                {[0, 1, 2].map(i => (
                  <Box key={i} w="7px" h="7px" borderRadius="full" bgColor="#C03F0C"
                    style={{ animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
                ))}
              </Box>
            </Box>
          )}
          <div ref={endRef} />

          {/* Bajarilgan buyurtmalar va baho */}
          {doneOrders.length > 0 && (
            <Box mt="12px" p="12px" bgColor="#F0FFF4" borderRadius="12px" border="1px solid #BBF7D0">
              <Text fontWeight="600" color="#22C55E" mb="8px" style={{ fontSize: '12px' }}>
                Bajarilgan buyurtmalar:
              </Text>
              {doneOrders.map(order => (
                <Box key={order._id} p="8px" bgColor="white" borderRadius="8px" mb="8px">
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Text fontWeight="600" color="#1C110D" style={{ fontSize: '13px' }}>
                        {order.amount?.toLocaleString()} so'm
                      </Text>
                      <Text color="#9B614B" style={{ fontSize: '11px' }}>
                        {new Date(order.createdAt).toLocaleDateString('uz-UZ')}
                      </Text>
                      {order.rating && (
                        <Box display="flex" alignItems="center" gap="4px" mt="4px">
                          {[1, 2, 3, 4, 5].map(star => (
                            <FaStar key={star} size={12} color={star <= order.rating ? '#FFD700' : '#E0E0E0'} />
                          ))}
                          <Text color="#9B614B" style={{ fontSize: '10px', marginLeft: '4px' }}>{order.rating}/5</Text>
                        </Box>
                      )}
                      {order.review && (
                        <Text color="#9B614B" style={{ fontSize: '11px', marginTop: '4px' }}>"{order.review}"</Text>
                      )}
                    </Box>
                    {!order.rating && (
                      <button
                        onClick={() => { setSelectedOrder(order); setShowRatingModal(true); }}
                        style={{ padding: '6px 12px', borderRadius: '8px', background: '#C03F0C', color: 'white', border: 'none', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                        Baho berish
                      </button>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Input */}
        <Box className="chat-input-area">
          <Box flex="1" display="flex" alignItems="center" bgColor="#F5F3F1"
            borderRadius="25px" px="16px" style={{ height: '44px' }}>
            <input placeholder={t('orders.placeholder')} value={message}
              onChange={e => handleTyping(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMsg()}
              style={{ width: '100%', border: 'none', outline: 'none', fontSize: '15px', background: 'transparent', color: '#1C110D' }} />
          </Box>
          <Box w="44px" h="44px" borderRadius="full"
            bgColor={message.trim() ? '#C03F0C' : '#E0DAD7'}
            display="flex" alignItems="center" justifyContent="center"
            cursor="pointer" flexShrink={0} onClick={sendMsg} transition="background 0.2s">
            <FaPaperPlane style={{ fontSize: '16px', color: 'white' }} />
          </Box>
        </Box>
        <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => { setShowRatingModal(false); setSelectedOrder(null); }}
          order={selectedOrder}
          onSubmitRating={handleRatingSubmit}
        />
      </Box>
    );
  }

  // === CHAT RO'YXATI ===
  return (
    <Box minH="100dvh" bgColor="#FFF5F0" display="flex" flexDir="column">
      <Box bgColor="white" px="16px" pt="14px" pb="12px" boxShadow="0 1px 0 #F0EBE6">
        <Text fontWeight="800" color="#1C110D" style={{ fontSize: '18px' }}>{t('orders.title')}</Text>
      </Box>

      <Box flex="1" pb="80px" pt="14px" px="16px" display="flex" flexDir="column" gap="10px">
        {chats.length === 0 && (
          <Box textAlign="center" py="60px">
            <Text color="#B0A8A4" style={{ fontSize: '14px' }}>{t('orders.noChats')}</Text>
          </Box>
        )}
        {chats.map(chat => {
          const isNew = chat.unread > 0;
          const isHighlight = newMsgChatId === chat.id;
          return (
            <Box key={chat.id}
              bgColor={isHighlight ? "#FFF0EC" : isNew ? "#FFFAF8" : "white"}
              borderRadius="18px" p="14px"
              display="flex" alignItems="center" gap="12px" cursor="pointer"
              boxShadow={isHighlight ? "0 4px 16px rgba(192,63,12,0.2)" : isNew ? "0 2px 12px rgba(192,63,12,0.1)" : "0 2px 10px rgba(0,0,0,0.06)"}
              border={isHighlight ? "1.5px solid #F5C5B0" : isNew ? "1px solid #FFE8DC" : "1px solid transparent"}
              transition="all 0.3s"
              onClick={() => {
                setSelectedChat(chat);
                Store.clearUnread(chat.id, myPhone);
                setChats(getChats());
              }}>
              {/* Avatar */}
              <Box position="relative" flexShrink={0}>
                <Avatar image={chat.chefImage} name={chat.chefName} size={50} />
                <Box position="absolute" bottom="0" right="0" w="12px" h="12px" borderRadius="full"
                  bgColor={isOnline(chat.chefPhone) ? '#22C55E' : '#D1D5DB'} border="2px solid white" />
              </Box>

              {/* Info */}
              <Box flex="1" minW={0}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb="3px">
                  <Text fontWeight={isNew ? "800" : "700"} color="#1C110D" noOfLines={1}
                    style={{ fontSize: '15px' }}>
                    {chat.chefName}
                  </Text>
                  <Text fontWeight={isNew ? "700" : "400"}
                    style={{ fontSize: '11px', color: isNew ? '#C03F0C' : '#B0A8A4', flexShrink: 0, marginLeft: '8px' }}>
                    {chat.time}
                  </Text>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Text noOfLines={1}
                    style={{
                      fontSize: '13px', flex: 1,
                      color: isNew && chat.lastSender !== 'customer' ? '#C03F0C' : '#9B8E8A',
                      fontWeight: isNew && chat.lastSender !== 'customer' ? '600' : '400'
                    }}>
                    {chat.lastMsg}
                  </Text>
                  {isNew && (
                    <Box bgColor="#C03F0C" color="white" borderRadius="full" fontWeight="700"
                      minW="20px" h="20px" px="4px" display="flex" alignItems="center" justifyContent="center"
                      style={{ fontSize: '10px', flexShrink: 0, marginLeft: '8px' }}>
                      {chat.unread > 9 ? '9+' : chat.unread}
                    </Box>
                  )}
                </Box>
              </Box>

              {/* O'chirish */}
              <Box flexShrink={0}
                onClick={e => { e.stopPropagation(); if (deletingId === chat.id) { doDelete(chat.id); } else { confirmDelete(chat.id); } }}
                px="10px" py="6px" borderRadius="12px"
                bgColor={deletingId === chat.id ? "#FEE2E2" : "#F8F8F8"}
                border={deletingId === chat.id ? "1px solid #FECACA" : "1px solid #E2E8F0"}
                transition="all 0.2s" title={deletingId === chat.id ? "Tasdiqlash uchun yana bosing" : "O'chirish"}>
                <Text style={{
                  fontSize: deletingId === chat.id ? '10px' : '13px',
                  color: deletingId === chat.id ? '#C53030' : '#6B7280',
                  fontWeight: deletingId === chat.id ? '700' : '600', whiteSpace: 'nowrap'
                }}>
                  {deletingId === chat.id ? "Tasdiqlash: o'chirish" : "O'chirish"}
                </Text>
              </Box>
            </Box>
          );
        })}
      </Box>
      <NavBar />
    </Box>
  );
};
export default OrdersPage;