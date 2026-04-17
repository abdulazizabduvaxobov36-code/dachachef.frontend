import { Box, Text } from '@chakra-ui/react';
import { FaHome, FaCommentDots, FaUser, FaArrowLeft, FaPaperPlane } from 'react-icons/fa';
import { MdDeleteOutline } from 'react-icons/md';
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Store from '../store';

const ChefMessagesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const chefProfile = (() => {
    const s = JSON.parse(localStorage.getItem('chefProfile') || 'null');
    if (s?.phone) return s;
    const sess = Store.getSession();
    if (sess?.role === 'chef' && sess?.data?.phone) return sess.data;
    return {};
  })();
  const myPhone = chefProfile.phone || 'http://localhost:5000';
  const navState = location.state;

  const getChats = () => {
    return Object.keys(localStorage)
      .filter(k => k.startsWith('chat_') && k.includes(`_${myPhone}`))
      .map(k => {
        const chatId = k.replace('chat_', '');
        const msgs = Store.getMessages(chatId);
        if (msgs.length === 0) return null;
        const last = msgs[msgs.length - 1];
        const customerPhone = chatId.replace(`_${myPhone}`, '');
        const cInfo = Store.getCustomerInfo(customerPhone);
        const unread = Store.getUnread(chatId, myPhone);
        return {
          id: chatId, customerPhone,
          customerName: cInfo ? `${cInfo.firstName || 'http://localhost:5000'} ${cInfo.lastName || 'http://localhost:5000'}`.trim() : null,
          customerImage: cInfo?.image || null,
          lastMsg: last.text, time: last.ts, unread,
          lastSender: last.sender,
        };
      }).filter(Boolean).sort((a, b) => b.unread - a.unread);
  };

  const [chats, setChats] = useState(getChats);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState({});
  const [message, setMessage] = useState('');
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [customerTyping, setCustomerTyping] = useState(false);
  const [newMsgChatId, setNewMsgChatId] = useState(null);
  const [deletingId, setDeletingId] = useState(null); // o'chirish tasdiq
  const endRef = useRef(null);
  const [autoOpened, setAutoOpened] = useState(false);

  useEffect(() => {
    if (!autoOpened && navState?.chatId) {
      setSelectedChat({ id: navState.chatId, customerPhone: navState.customerPhone });
      Store.clearUnread(navState.chatId, myPhone);
      setAutoOpened(true);
    }
  }, [navState]);

  useEffect(() => {
    const onMsg = (e) => {
      setChats(getChats());
      if (e.detail?.chatId && e.detail.chatId !== selectedChat?.id) {
        setNewMsgChatId(e.detail.chatId);
        setTimeout(() => setNewMsgChatId(null), 3000);
      }
    };
    window.addEventListener('message-received', onMsg);
    const onStorage = (e) => { if (e.key?.startsWith('chat_')) setChats(getChats()); };
    window.addEventListener('storage', onStorage);
    const poll = setInterval(() => setChats(getChats()), 1000);
    return () => {
      window.removeEventListener('message-received', onMsg);
      window.removeEventListener('storage', onStorage);
      clearInterval(poll);
    };
  }, [selectedChat?.id]);

  useEffect(() => {
    if (!selectedChat) return;
    setMessages(prev => ({ ...prev, [selectedChat.id]: Store.getMessages(selectedChat.id) }));
    Store.clearUnread(selectedChat.id, myPhone);
    const unsub = Store.listenMessages(selectedChat.id, msgs => {
      setMessages(prev => ({ ...prev, [selectedChat.id]: msgs }));
      Store.clearUnread(selectedChat.id, myPhone);
      setChats(getChats());
    });
    const onStorage = (e) => {
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

  useEffect(() => {
    if (!selectedChat) return;
    const id = setInterval(() => {
      const ts = localStorage.getItem(`typing_${selectedChat.id}_customer`);
      setCustomerTyping(ts ? Date.now() - Number(ts) < 3000 : false);
    }, 300);
    return () => clearInterval(id);
  }, [selectedChat?.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, selectedChat, customerTyping]);

  const sendMsg = async () => {
    if (!message.trim() || !selectedChat) return;
    localStorage.removeItem(`typing_${selectedChat.id}_chef`);
    const newMsg = { text: message, sender: 'chef', from: myPhone, to: selectedChat.customerPhone };
    setMessage('');
    await Store.sendMessage(selectedChat.id, newMsg);
    setMessages(prev => ({ ...prev, [selectedChat.id]: Store.getMessages(selectedChat.id) }));
    setChats(getChats());
  };

  const handleTyping = val => {
    setMessage(val);
    if (!selectedChat) return;
    localStorage.setItem(`typing_${selectedChat.id}_chef`, Date.now().toString());
    if (typingTimeout) clearTimeout(typingTimeout);
    setTypingTimeout(setTimeout(() => localStorage.removeItem(`typing_${selectedChat.id}_chef`), 3000));
  };

  const confirmDelete = (chatId) => {
    setDeletingId(chatId);
    setTimeout(() => setDeletingId(null), 3000);
  };

  const doDelete = (chatId) => {
    localStorage.removeItem(`chat_${chatId}`);
    setChats(getChats());
    setDeletingId(null);
    if (selectedChat?.id === chatId) setSelectedChat(null);
  };

  const isOnline = phone => phone ? Store.isOnline('customer', phone) : false;
  const totalUnread = chats.reduce((s, c) => s + (c.unread || 0), 0);

  // Avatar
  const Avatar = ({ image, name, phone, size = 48, onClick }) => {
    const letter = name?.charAt(0)?.toUpperCase() || phone?.charAt(0) || '?';
    return (
      <Box onClick={onClick} cursor={onClick ? 'pointer' : 'default'} flexShrink={0}>
        {image
          ? <img src={image} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
          : <Box w={`${size}px`} h={`${size}px`} borderRadius="full" bgColor="#C03F0C"
            display="flex" alignItems="center" justifyContent="center" color="white" fontWeight="700"
            style={{ fontSize: `${Math.round(size * 0.38)}px` }}>
            {letter}
          </Box>
        }
      </Box>
    );
  };

  const NavBar = () => (
    <Box className="fixed-bottom" borderTop="1px solid #F0EBE6"
      display="flex" justifyContent="space-around" alignItems="center" py="10px">
      {[
        { icon: FaHome, route: '/chef-home', labelKey: 'nav.home', badge: 0 },
        { icon: FaCommentDots, route: '/chef-messages', labelKey: 'nav.messages', badge: totalUnread },
        { icon: FaUser, route: '/chef-profile', labelKey: 'nav.profile', badge: 0 },
      ].map(tab => (
        <Box key={tab.route} display="flex" flexDir="column" alignItems="center" gap="3px"
          cursor="pointer" px="18px" onClick={() => navigate(tab.route)}>
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
          <Text fontWeight="700" style={{ fontSize: '10px', color: location.pathname === tab.route ? '#C03F0C' : '#B0A8A4' }}>
            {t(tab.labelKey)}
          </Text>
        </Box>
      ))}
    </Box>
  );

  // === CHAT OYNASI ===
  if (selectedChat) {
    const chatMsgs = messages[selectedChat.id] || [];
    const cInfo = Store.getCustomerInfo(selectedChat.customerPhone);
    const cName = cInfo ? `${cInfo.firstName || 'http://localhost:5000'} ${cInfo.lastName || 'http://localhost:5000'}`.trim() : null;
    const cImage = cInfo?.image || null;

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
          {/* Mijoz rasmi — bosib mijoz profiliga o'tish yo'q (mijoz profil sahifasi yo'q) */}
          <Avatar image={cImage} name={cName} phone={selectedChat.customerPhone} size={40} />
          <Box flex="1" minW={0}>
            <Text fontWeight="700" color="#1C110D" noOfLines={1} style={{ fontSize: '15px' }}>
              {cName || `${t('chefMessages.customer')} · +998${selectedChat.customerPhone}`}
            </Text>
            <Text style={{ fontSize: '11px', color: customerTyping ? '#C03F0C' : isOnline(selectedChat.customerPhone) ? '#22C55E' : '#B0A8A4' }}>
              {customerTyping ? `✍️ ${t('chefMessages.typing')}` : isOnline(selectedChat.customerPhone) ? t('chefMessages.online') : t('common.offline')}
            </Text>
          </Box>
        </Box>

        {/* Xabarlar */}
        <Box flex="1" overflowY="auto" px="16px" py="14px"
          display="flex" flexDir="column" gap="8px" style={{ paddingBottom: '80px' }}>
          {chatMsgs.length === 0 && (
            <Box textAlign="center" py="40px">
              <Text color="#B0A8A4" style={{ fontSize: '13px' }}>{t('chefMessages.noMsg')}</Text>
            </Box>
          )}
          {chatMsgs.map((msg, i) => (
            <Box key={i} display="flex"
              justifyContent={msg.sender === 'chef' ? 'flex-end' : 'flex-start'}
              alignItems="flex-end" gap="6px">
              {/* FAQAT mijoz xabarida — mijoz rasmi chap tomonda */}
              {msg.sender !== 'chef' && (
                <Avatar image={cImage} name={cName} phone={selectedChat.customerPhone} size={28} />
              )}
              <Box maxW="75%" px="14px" py="9px"
                borderRadius={msg.sender === 'chef' ? '18px 18px 4px 18px' : '18px 18px 18px 4px'}
                bgColor={msg.sender === 'chef' ? '#C03F0C' : 'white'}
                color={msg.sender === 'chef' ? 'white' : '#1C110D'}
                boxShadow="0 1px 4px rgba(0,0,0,0.08)">
                <Text style={{ fontSize: '14px', lineHeight: '1.4' }}>{msg.text}</Text>
                <Text mt="3px" textAlign="right"
                  style={{ fontSize: '10px', color: msg.sender === 'chef' ? 'rgba(255,255,255,0.6)' : '#B0A8A4' }}>
                  {msg.ts}
                </Text>
              </Box>
              {/* OSHPAZ xabarida — oshpaz rasmi KO'RINMAYDI (o'zi yozgan) */}
            </Box>
          ))}
          {customerTyping && (
            <Box display="flex" alignItems="flex-end" gap="6px">
              <Avatar image={cImage} name={cName} phone={selectedChat.customerPhone} size={28} />
              <Box px="14px" py="10px" borderRadius="18px 18px 18px 4px" bgColor="white"
                boxShadow="0 1px 4px rgba(0,0,0,0.08)" display="flex" gap="4px" alignItems="center">
                {[0, 1, 2].map(i => <Box key={i} w="7px" h="7px" borderRadius="full" bgColor="#C03F0C"
                  style={{ animation: `bounce 1.2s ${i * 0.2}s infinite` }} />)}
              </Box>
            </Box>
          )}
          <div ref={endRef} />
        </Box>

        {/* Input */}
        <Box className="chat-input-area">
          <Box flex="1" display="flex" alignItems="center" bgColor="#F5F3F1"
            borderRadius="25px" px="16px" style={{ height: '44px' }}>
            <input placeholder={t('chefMessages.placeholder')} value={message}
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
    <Box minH="100dvh" bgColor="#FFF5F0" display="flex" flexDir="column">
      <Box bgColor="white" px="16px" pt="14px" pb="12px" boxShadow="0 1px 0 #F0EBE6">
        <Text fontWeight="800" color="#1C110D" style={{ fontSize: '18px' }}>{t('chefMessages.title')}</Text>
      </Box>

      <Box flex="1" pb="80px" pt="14px" px="16px" display="flex" flexDir="column" gap="10px">
        {chats.length === 0 && (
          <Box textAlign="center" py="60px">
            <Text color="#B0A8A4" style={{ fontSize: '14px' }}>{t('chefMessages.noChats')}</Text>
          </Box>
        )}
        {chats.map(chat => {
          const isNew = chat.unread > 0;
          const isHighlight = newMsgChatId === chat.id;
          const isDeleting = deletingId === chat.id;
          return (
            <Box key={chat.id}
              bgColor={isHighlight ? "#FFF0EC" : isNew ? "#FFFAF8" : "white"}
              borderRadius="18px" p="14px"
              display="flex" alignItems="center" gap="12px"
              boxShadow={isHighlight ? "0 4px 16px rgba(192,63,12,0.2)" : isNew ? "0 2px 12px rgba(192,63,12,0.1)" : "0 2px 10px rgba(0,0,0,0.06)"}
              border={isHighlight ? "1.5px solid #F5C5B0" : isNew ? "1px solid #FFE8DC" : "1px solid transparent"}
              transition="all 0.3s"
              cursor="pointer"
              onClick={() => { setSelectedChat(chat); Store.clearUnread(chat.id, myPhone); setChats(getChats()); }}>

              {/* Avatar */}
              <Box position="relative" flexShrink={0}>
                <Avatar image={chat.customerImage} name={chat.customerName}
                  phone={chat.customerPhone} size={48} />
                <Box position="absolute" bottom="0" right="0" w="12px" h="12px" borderRadius="full"
                  bgColor={isOnline(chat.customerPhone) ? '#22C55E' : '#D1D5DB'} border="2px solid white" />
              </Box>

              {/* Info */}
              <Box flex="1" minW={0}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb="3px">
                  <Text fontWeight={isNew ? "800" : "700"} color="#1C110D" noOfLines={1}
                    style={{ fontSize: '15px' }}>
                    {chat.customerName || `${t('chefMessages.customer')} · +998${chat.customerPhone}`}
                  </Text>
                  <Text fontWeight={isNew ? "700" : "400"}
                    style={{ fontSize: '11px', color: isNew ? '#C03F0C' : '#B0A8A4', flexShrink: 0, marginLeft: '8px' }}>
                    {chat.time}
                  </Text>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  {/* Faqat xabar matni — PROFIL: text yo'q, ✓ yo'q */}
                  <Text noOfLines={1}
                    style={{
                      fontSize: '13px', color: isNew && chat.lastSender !== 'chef' ? '#C03F0C' : '#9B8E8A', flex: 1,
                      fontWeight: isNew && chat.lastSender !== 'chef' ? '600' : '400'
                    }}>
                    {chat.lastMsg}
                  </Text>
                  {/* Badge: faqat o'qilmagan bo'lsa */}
                  {isNew && (
                    <Box bgColor="#C03F0C" color="white" borderRadius="full" fontWeight="700"
                      minW="20px" h="20px" px="4px" display="flex" alignItems="center" justifyContent="center"
                      style={{ fontSize: '10px', flexShrink: 0, marginLeft: '8px' }}>
                      {chat.unread > 9 ? '9+' : chat.unread}
                    </Box>
                  )}
                </Box>
              </Box>

              {/* O'chirish — tasdiq bilan */}
              <Box flexShrink={0} onClick={e => { e.stopPropagation(); isDeleting ? doDelete(chat.id) : confirmDelete(chat.id); }}
                px="10px" py="6px" borderRadius="12px"
                bgColor={isDeleting ? "#FEE2E2" : "#F8F8F8"}
                border={isDeleting ? "1px solid #FECACA" : "1px solid #E2E8F0"}
                transition="all 0.2s" title={isDeleting ? "Qayta bosib o'chirishni tasdiqlang" : "O'chirish"}>
                <Text style={{ fontSize: isDeleting ? '10px' : '12px', color: isDeleting ? '#C53030' : '#6B7280', fontWeight: isDeleting ? '700' : '600', whiteSpace: 'nowrap' }}>
                  {isDeleting ? "Tasdiqlash: o'chirish" : "O'chirish"}
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
export default ChefMessagesPage;