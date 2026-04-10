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
    if (navChefPhone) { const chef = chefs.find(c => c.phone === navChefPhone); if (chef) return buildChat(chef); }
    if (navChefName) { const chef = chefs.find(c => `${c.name} ${c.surname}` === navChefName); if (chef) return buildChat(chef); }
    return null;
  };

  const [selectedChat, setSelectedChat] = useState(findInitial);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState({});
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [chefTyping, setChefTyping] = useState(false);
  const [newMsgChatId, setNewMsgChatId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const endRef = useRef(null);

  // Buyurtmalarni olish
  const fetchOrders = async () => {
    if (!myPhone || myPhone === 'guest') return;
    try {
      const AUTH_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${AUTH_BASE}/orders/customer/${myPhone}/all`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Buyurtmalarni olishda xatolik:', error);
    }
  };

  // Baho qoldirish
  const handleRatingSubmit = async (orderId, rating, review) => {
    try {
      const result = await Store.updateOrderRating(orderId, rating, review);
      if (result) {
        await fetchOrders();
        const order = orders.find(o => o._id === orderId);
        if (order && selectedChat) {
          const ratingText = `${rating} yulduz${review ? ': ' + review : ''}`;
          Store.sendMessage(selectedChat.id, myPhone, `Sizga ${ratingText} baho berdim!`, 'customer');
        }
      }
    } catch (error) {
      console.error('Baho qoldirishda xatolik:', error);
      throw error;
    }
  };

  const getChats = useCallback(() => {
    const activeChefs = Store.getChefs();
    const activePhones = new Set(activeChefs.map(c => c.phone));
    return activeChefs.map(c => {
      const chatId = Store.makeChatId(myPhone, c.phone);
      const msgs = Store.getMessages(chatId);
      if (msgs.length === 0) return null;
      const last = msgs[msgs.length - 1];
      return {
        chatId,
        customerPhone: myPhone,
        chefPhone: c.phone,
        chefName: `${c.name} ${c.surname}`,
        chefImage: c.image || null,
        msgs,
        preview: msgs.slice(-4),
        unread: Store.getUnread(chatId, myPhone),
        lastMsg: last,
      };
    }).filter(Boolean);
  }, [myPhone]);

  const [chats, setChats] = useState(getChats());
  const [notifications, setNotifications] = useState([]);

  const refreshNotifs = () => setNotifications(Store.getChefNotifications(myPhone));
  const isOnline = (phone) => Store.isOnline(phone);
  const getMessages = () => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('chat_') && k.includes(myPhone));
    return keys.map(k => {
      const chatId = k.replace("chat_", "");
      if (localStorage.getItem(`accepted_${chatId}`)) return null;
      const msgs = Store.getMessages(chatId);
      if (msgs.length === 0) return null;
      const customerPhone = chatId.replace(`_${myPhone}`, "");
      const preview = msgs.slice(-4);
      const unread = Store.getUnread(chatId, myPhone);
      return { chatId, customerPhone, msgs, preview, unread, lastMsg: msgs[msgs.length - 1] };
    }).filter(Boolean);
  };

  const getOrders = useCallback(() => {
    return getChats();
  }, [getChats]);

  const handleTyping = (val) => {
    setMessage(val);
    if (selectedChat) {
      if (typingTimeout) clearTimeout(typingTimeout);
      setTypingTimeout(setTimeout(() => Store.sendTyping(selectedChat.id, myPhone), 500));
    }
  };

  const sendMsg = () => {
    if (!message.trim() || !selectedChat) return;
    Store.sendMessage(selectedChat.id, myPhone, message.trim(), 'customer');
    setMessage('');
  };

  const confirmDelete = (chatId) => setDeletingId(chatId);
  const doDelete = (chatId) => {
    Store.deleteChat(chatId);
    setChats(getChats());
    if (selectedChat?.id === chatId) setSelectedChat(null);
    setDeletingId(null);
  };

  useEffect(() => {
    const onMsg = () => { setMessages(getMessages()); refreshNotifs(); };
    window.addEventListener("message-received", onMsg);
    if (myPhone) {
      refreshNotifs();
      fetchOrders();
      const cleanup = Store.startHeartbeat("customer", myPhone);
      let lastOrdersKey = JSON.stringify(getOrders().map(o => o.chatId + o.msgs.length + o.unread));
      const interval = setInterval(() => {
        const currentKey = JSON.stringify(getOrders().map(o => o.chatId + o.msgs.length + o.unread));
        if (currentKey !== lastOrdersKey) {
          lastOrdersKey = currentKey;
          setMessages(getMessages());
          setOrders(getOrders());
        }
      }, 500);
      return () => { cleanup(); window.removeEventListener("message-received", onMsg); clearInterval(interval); };
    }
  }, [myPhone, getOrders, getMessages]);

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
    const unsubTyping = Store.listenTyping(selectedChat.id, isTyping => setChefTyping(isTyping));
    return () => { unsub && unsub(); unsubTyping && unsubTyping(); };
  }, [selectedChat?.id, getChats]);

  useEffect(() => {
    const onMsg = () => setChats(getChats());
    const onStorage = () => setChats(getChats());
    window.addEventListener('message-received', onMsg);
    window.addEventListener('storage', onStorage);
    const poll = setInterval(() => setChats(getChats()), 1000);
    return () => {
      window.removeEventListener('message-received', onMsg);
      window.removeEventListener('storage', onStorage);
      clearInterval(poll);
    };
  }, [selectedChat?.id, getChats]);

  useEffect(() => {
    if (newMsgChatId && newMsgChatId !== selectedChat?.id) {
      const chat = chats.find(c => c.chatId === newMsgChatId);
      if (chat) setSelectedChat(chat);
      setNewMsgChatId(null);
    }
  }, [newMsgChatId, selectedChat?.id, chats]);

  useEffect(() => {
    if (!endRef.current) return;
    endRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedChat?.id]);

  const Avatar = ({ image, name, size }) => (
    <Box w={size} h={size} borderRadius="full" overflow="hidden" bgColor="#F0E6E0" display="flex" alignItems="center" justifyContent="center">
      {image ? <img src={image} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Text color="#9B614B" style={{ fontSize: size / 3 }}>{name?.[0] || '?'}</Text>}
    </Box>
  );

  const NavBar = () => (
    <Box position="fixed" bottom="0" left="0" right="0" bgColor="white" borderTop="1px solid #EBEBEB" px="20px" py="12px" zIndex={100}>
      <Box display="flex" justifyContent="space-around" alignItems="center">
        <Box cursor="pointer" onClick={() => navigate('/')}><FaHome size={20} color="#C03F0C" /></Box>
        <Box cursor="pointer" onClick={() => navigate('/orders')}><FaClipboardList size={20} color="#C03F0C" /></Box>
        <Box cursor="pointer" onClick={() => navigate('/like')}><FaHeart size={20} color="#C03F0C" /></Box>
        <Box cursor="pointer" onClick={() => navigate('/profile')}><FaUser size={20} color="#C03F0C" /></Box>
      </Box>
    </Box>
  );

  // === CHAT QISMI ===
  if (selectedChat) {
    const chatMsgs = messages[selectedChat.id] || [];
    return (
      <Box minH="100dvh" bgColor="#FFF5F0" display="flex" flexDir="column">
        <Box bgColor="white" px="16px" py="12px"
          display="flex" alignItems="center" gap="12px"
          boxShadow="0 1px 0 #F0EBE6" flexShrink={0}>
          <Box cursor="pointer" onClick={() => { setSelectedChat(null); setChats(getChats()); }}
            w="36px" h="36px" bgColor="#FFF0EC" borderRadius="full"
            display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
            <FaArrowLeft style={{ fontSize: '14px', color: '#C03F0C' }} />
          </Box>
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
              {chefTyping ? `typing...` : isOnline(selectedChat.chefPhone) ? 'online' : 'offline'}
            </Text>
          </Box>
        </Box>

        <Box flex="1" overflowY="auto" px="16px" py="14px"
          display="flex" flexDir="column" gap="8px" style={{ paddingBottom: '80px' }}>
          {chatMsgs.length === 0 && (
            <Box textAlign="center" py="40px">
              <Text color="#B0A8A4" style={{ fontSize: '13px' }}>No messages</Text>
            </Box>
          )}
          {chatMsgs.map((msg, i) => (
            <Box key={i} display="flex"
              justifyContent={msg.sender === 'customer' ? 'flex-end' : 'flex-start'}
              alignItems="flex-end" gap="6px">
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

          {/* Buyurtmalar va baho qoldirish */}
          {orders.filter(o => o.chefPhone === selectedChat.chefPhone && o.status === 'done').length > 0 && (
            <Box mt="12px" p="12px" bgColor="#F0FFF4" borderRadius="12px" border="1px solid #BBF7D0">
              <Text fontWeight="600" color="#22C55E" mb="8px" style={{ fontSize: "12px" }}>
                Bajarilgan buyurtmalar:
              </Text>
              {orders
                .filter(o => o.chefPhone === selectedChat.chefPhone && o.status === 'done')
                .map(order => (
                  <Box key={order._id} p="8px" bgColor="white" borderRadius="8px" mb="8px">
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Text fontWeight="600" color="#1C110D" style={{ fontSize: "13px" }}>
                          {order.amount.toLocaleString()} so'm
                        </Text>
                        <Text color="#9B614B" style={{ fontSize: "11px" }}>
                          {new Date(order.createdAt).toLocaleDateString('uz-UZ')}
                        </Text>
                        {order.rating && (
                          <Box display="flex" alignItems="center" gap="4px" mt="4px">
                            {[1, 2, 3, 4, 5].map(star => (
                              <FaStar
                                key={star}
                                size={12}
                                color={star <= order.rating ? '#FFD700' : '#E0E0E0'}
                              />
                            ))}
                            <Text color="#9B614B" style={{ fontSize: "10px", marginLeft: "4px" }}>
                              {order.rating}/5
                            </Text>
                          </Box>
                        )}
                        {order.review && (
                          <Text color="#9B614B" style={{ fontSize: "11px", marginTop: "4px" }}>
                            "{order.review}"
                          </Text>
                        )}
                      </Box>
                      {!order.rating && (
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowRatingModal(true);
                          }}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "8px",
                            background: "#C03F0C",
                            color: "white",
                            border: "none",
                            fontSize: "11px",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                        >
                          Baho berish
                        </button>
                      )}
                    </Box>
                  </Box>
                ))}
            </Box>
          )}
        </Box>

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
      </Box>
    );
  }

  // === CHAT RO'YXATI ===
  return (
    <>
      <Box minH="100dvh" bgColor="#FFF5F0" display="flex" flexDir="column">
        <Box bgColor="white" px="20px" py="16px" boxShadow="0 1px 0 #EBEBEB">
          <Text fontWeight="800" color="#1C110D" style={{ fontSize: "20px" }}>Orders</Text>
        </Box>
        <Box flex="1" px="20px" py="12px">
          {chats.length === 0 ? (
            <Box textAlign="center" py="60px">
              <Text color="#B0A8A4" style={{ fontSize: "14px" }}>No orders yet</Text>
            </Box>
          ) : (
            chats.map(chat => (
              <Box key={chat.chatId} p="16px" bgColor="white" borderRadius="16px"
                mb="12px" boxShadow="0 2px 8px rgba(0,0,0,0.06)"
                display="flex" alignItems="center" gap="12px"
                onClick={() => setSelectedChat(chat)}
                style={{ cursor: 'pointer' }}>
                <Avatar image={chat.chefImage} name={chat.chefName} size={48} />
                <Box flex="1" minW={0}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb="4px">
                    <Text fontWeight="700" color="#1C110D" noOfLines={1} style={{ fontSize: "15px" }}>
                      {chat.chefName}
                    </Text>
                    <Text style={{ fontSize: "10px", flexShrink: 0, marginLeft: "8px", color: "#B0A8A4" }}>
                      {chat.lastMsg?.ts}
                    </Text>
                  </Box>
                  <Text noOfLines={1} color="#9B614B" style={{ fontSize: "13px" }}>
                    {chat.unread > 0 && <span style={{ color: "#C03F0C", fontWeight: "600" }}>{chat.unread} new messages</span>}
                    {chat.lastMsg?.text}
                  </Text>
                </Box>
                {chat.unread > 0 && (
                  <Box w="20px" h="20px" bgColor="#C03F0C" borderRadius="full"
                    display="flex" alignItems="center" justifyContent="center"
                    style={{ fontSize: '10px', flexShrink: 0, marginLeft: '8px' }}>
                    {chat.unread > 9 ? '9+' : chat.unread}
                  </Box>
                )}
              </Box>
            ))
          )}
        </Box>
        <NavBar />
      </Box>
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => {
          setShowRatingModal(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onSubmitRating={handleRatingSubmit}
      />
    </>
  );
};

export default OrdersPage;