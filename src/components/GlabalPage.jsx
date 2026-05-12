import { Box, Text } from '@chakra-ui/react';
import { FiSearch } from 'react-icons/fi';
import { FaStar, FaHeart, FaClipboardList, FaHome, FaUser, FaBell, FaMapMarkerAlt, FaTimes, FaChevronDown } from 'react-icons/fa';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import Store from '../store';

const ANDIJON_DISTRICTS = [
  { id: 'andijon_shahar', name: 'Andijon shahri' },
  { id: 'asaka',          name: 'Asaka tumani' },
  { id: 'oltinkol',       name: "Oltinko'l tumani" },
  { id: 'baliqchi',       name: 'Baliqchi tumani' },
  { id: 'boston',         name: "Bo'ston tumani" },
  { id: 'buloqboshi',     name: 'Buloqboshi tumani' },
  { id: 'izboskan',       name: 'Izboskan tumani' },
  { id: 'jalolquduq',     name: 'Jalolquduq tumani' },
  { id: 'xojaobod',       name: "Xo'jaobod tumani" },
  { id: 'marhamat',       name: 'Marhamat tumani' },
  { id: 'mashrabov',      name: 'Mashrabov tumani' },
  { id: 'paxtaobod',      name: 'Paxtaobod tumani' },
  { id: 'qurgontepa',     name: "Qo'rg'ontepa tumani" },
  { id: 'shahrixon',      name: 'Shahrixon tumani' },
  { id: 'ulugmor',        name: "Ulug'nor tumani" },
  { id: 'xonobod',        name: 'Xonobod shahri' },
  { id: 'imomota',        name: 'Imom Ota' },
];

const GlabalPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const notifRef = useRef(null);

  const getCD = () => {
    const s = JSON.parse(localStorage.getItem('customerData') || 'null');
    if (s?.phone) return s;
    const sess = Store.getSession();
    if (sess?.role === 'customer' && sess?.data?.phone) return sess.data;
    return {};
  };
  const customerData = getCD();
  const myPhone = customerData.phone || 'guest';

  const [chefs, setChefs] = useState(() => Store.getChefs());
  const [ratings, setRatings] = useState({});
  const [search, setSearch] = useState('');
  const [liked, setLiked] = useState(() => JSON.parse(localStorage.getItem('likedChefs') || '[]'));
  const [animIdx, setAnimIdx] = useState(null);
  const [showNotif, setShowNotif] = useState(false);
  const [notifs, setNotifs] = useState([]);

  // Dacha tumani filtri
  const [selectedDistrict, setSelectedDistrict] = useState(
    () => localStorage.getItem('customer_dacha_district') || ''
  );
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);
  const districtRef = useRef(null);

  const saveDistrict = (id) => {
    setSelectedDistrict(id);
    localStorage.setItem('customer_dacha_district', id);
    setShowDistrictPicker(false);
  };

  const clearDistrict = () => {
    setSelectedDistrict('');
    localStorage.removeItem('customer_dacha_district');
  };

  const refreshAll = () => {
    const latest = Store.getChefs();
    setChefs([...latest]);
    setNotifs(Store.getCustomerNotifications(myPhone, latest));
  };

  useEffect(() => {
    if (customerData.phone) return Store.startHeartbeat('customer', customerData.phone);
  }, []);

  // Backend dan oshpazlarni yuklash — o'chirilganlar ham localdan o'chadi
  useEffect(() => {
    const API_BASE = import.meta.env?.VITE_API_URL || '';
    fetch(`${API_BASE}/chefs`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(backendChefs => {
        if (!Array.isArray(backendChefs)) return;
        const local = JSON.parse(localStorage.getItem('registeredChefs') || '[]');
        const backendPhones = new Set(backendChefs.map(c => c.phone).filter(Boolean));
        // Backend da yo'q bo'lganlarni o'chirib tashlash (o'chirilgan/bloklangan)
        let synced = local.filter(c => backendPhones.has(c.phone));
        // Qo'shish yoki yangilash
        backendChefs.forEach(sc => {
          if (!sc.phone || !sc.name) return;
          const i = synced.findIndex(c => c.phone === sc.phone);
          if (i < 0) synced.push(sc);
          else synced[i] = { ...synced[i], ...sc };
        });
        localStorage.setItem('registeredChefs', JSON.stringify(synced));
        setChefs(synced.filter(c => c.phone && c.name));
      })
      .catch(() => {}); // tarmoq xatosi — localdan foydalaniladi
  }, []);

  // Oshpazlar baholari
  useEffect(() => {
    if (chefs.length === 0) return;
    const API_BASE = import.meta.env?.VITE_API_URL || '';
    Promise.allSettled(
      chefs.map(c =>
        fetch(`${API_BASE}/reviews/${c.phone}`)
          .then(r => r.ok ? r.json() : null)
          .then(d => ({ phone: c.phone, avg: d?.avgRating || 0 }))
      )
    ).then(results => {
      const map = {};
      results.forEach(r => { if (r.status === 'fulfilled' && r.value) map[r.value.phone] = r.value.avg; });
      setRatings(map);
    }).catch(() => {});
  }, [chefs.length]);

  // Bloklangan mijozni darhol chiqarish (cache + backend)
  useEffect(() => {
    const phone = customerData.phone;
    if (!phone) return;
    const cacheKey = `blk_customer_${phone}`;
    const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
    if (cached?.blocked && Date.now() - cached.at < 5 * 60 * 1000) {
      navigate('/blocked', { replace: true }); return;
    }
    const API_BASE = import.meta.env?.VITE_API_URL || '';
    fetch(`${API_BASE}/customers/${phone}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data || !data._id) {
          localStorage.removeItem('customerData');
          Store.clearSession();
          navigate('/', { replace: true });
          return;
        }
        if (data.isBlocked) {
          localStorage.setItem(cacheKey, JSON.stringify({ blocked: true, at: Date.now() }));
          navigate('/blocked', { replace: true });
        } else {
          localStorage.removeItem(cacheKey);
        }
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    const unsub = Store.listenChefs(latest => { setChefs([...latest]); setNotifs(Store.getCustomerNotifications(myPhone, latest)); });
    window.addEventListener('chefs-updated', refreshAll);
    // Yangi xabar kelganda hasChat qayta hisoblansin uchun chefs ham yangilansin
    const onMsg = () => {
      const latest = Store.getChefs();
      setChefs([...latest]);
      setNotifs(Store.getCustomerNotifications(myPhone, latest));
    };
    window.addEventListener('message-received', onMsg);
    const onStorage = e => {
      if (e.key === 'registeredChefs') refreshAll();
      if (e.key?.startsWith('chat_')) {
        const latest = Store.getChefs();
        setChefs([...latest]);
        setNotifs(Store.getCustomerNotifications(myPhone, latest));
      }
    };
    window.addEventListener('storage', onStorage);
    // 1 soniyada bir yangilab turamiz - boshqa tabdan oshpaz yozsa ko'rinsin
    const iv = setInterval(onMsg, 1000);
    return () => {
      unsub?.();
      clearInterval(iv);
      window.removeEventListener('chefs-updated', refreshAll);
      window.removeEventListener('message-received', onMsg);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    const handler = e => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (districtRef.current && !districtRef.current.contains(e.target)) setShowDistrictPicker(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  useEffect(() => { localStorage.setItem('likedChefs', JSON.stringify(liked)); }, [liked]);

  const toggleLike = (phone, idx) => {
    setLiked(prev => prev.includes(phone) ? prev.filter(p => p !== phone) : [...prev, phone]);
    setAnimIdx(idx); setTimeout(() => setAnimIdx(null), 300);
  };

  const totalUnread = notifs.reduce((s, n) => s + n.unread, 0);
  const HOME_LIMIT = 4; // GlabalPage da ko'rsatiladigan oshpazlar soni
  // Tuman bo'yicha filter: oshpazning prefs.canGo da selectedDistrict bor bo'lsa ko'rsatiladi
  const districtFiltered = chefs.filter(c => {
    if (!selectedDistrict) return true; // tuman tanlanmagan — hammasini ko'rsat
    const prefs = Store.getChefDachaPrefs(c.phone);
    // Agar oshpaz hali belgilamagan bo'lsa ham ko'rsatamiz (yangi oshpazlar uchun)
    if (!prefs.canGo.length && !prefs.cannotGo.length) return true;
    return prefs.canGo.includes(selectedDistrict);
  });

  const filtered = districtFiltered.filter(c => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (c.name || '').toLowerCase().startsWith(q) || (c.surname || '').toLowerCase().startsWith(q) || `${c.name || ''} ${c.surname || ''}`.toLowerCase().startsWith(q);
  });
  const sortedChefs = [...filtered].sort((a, b) => (b.registeredAt || 0) - (a.registeredAt || 0));
  const displayChefs = search.trim()
    ? filtered
    : sortedChefs.slice(0, HOME_LIMIT); // faqat 6 ta, qolgani ChefsPage da

  const NavBar = () => (
    <Box className="fixed-bottom" borderTop="1px solid #EBEBEB"
      display="flex" justifyContent="space-around" alignItems="center" py="10px">
      {[
        { icon: FaHome, route: '/glabal', label: t('footer.home'), badge: 0 },
        { icon: FaClipboardList, route: '/orderspage', label: t('footer.orders'), badge: notifs.reduce((s, n) => s + n.unread, 0) },
        { icon: FaHeart, route: '/like', label: t('footer.like'), badge: 0 },
        { icon: FaUser, route: '/profile', label: t('footer.profile'), badge: 0 },
      ].map(tab => (
        <Box key={tab.route} display="flex" flexDir="column" alignItems="center" gap="3px"
          cursor="pointer" px="14px" onClick={() => navigate(tab.route)} position="relative">
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

  return (
    <Box display="flex" flexDir="column" minH="100dvh" bgColor="#FFF5F0">
      <Box flex="1" pb="72px">
        {/* Header */}
        <Box bgColor="white" px="16px" pt="14px" pb="12px" boxShadow="0 1px 0 #EBEBEB">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap="8px">
              <img src="/images/icons8-restaurant-48.png" alt="" style={{ width: '30px', height: '30px' }} />
              <Text fontWeight="800" color="#1C110D" style={{ fontSize: '18px', letterSpacing: '-0.3px' }}>
                {t('glabal.logo')}
              </Text>
            </Box>
            {/* Bell */}
            <Box position="relative" ref={notifRef}>
              <Box cursor="pointer" onClick={() => setShowNotif(v => !v)}
                w="38px" h="38px" borderRadius="full" bgColor={totalUnread > 0 ? "#FFF0EC" : "#FFF0EC"}
                display="flex" alignItems="center" justifyContent="center">
                <FaBell style={{ fontSize: '18px', color: totalUnread > 0 ? '#C03F0C' : '#888' }} />
                {totalUnread > 0 && (
                  <Box position="absolute" top="0" right="0" minW="17px" h="17px" px="3px"
                    bgColor="#C03F0C" borderRadius="full" display="flex" alignItems="center"
                    justifyContent="center" color="white" fontWeight="800" style={{ fontSize: '9px' }}>
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </Box>
                )}
              </Box>
              {showNotif && (
                <Box position="absolute" top="46px" right="0" w="290px"
                  bgColor="white" borderRadius="18px" boxShadow="0 8px 32px rgba(0,0,0,0.14)"
                  overflow="hidden" zIndex={200} border="1px solid #F0F0F0">
                  <Box px="14px" py="11px" borderBottom="1px solid #F5F5F5"
                    display="flex" justifyContent="space-between" alignItems="center">
                    <Text fontWeight="700" color="#1C110D" style={{ fontSize: '14px' }}>{t('glabal.notifTitle')}</Text>
                    {totalUnread > 0 && <Box bgColor="#FFF0EC" color="#C03F0C" borderRadius="10px" px="8px" py="2px"
                      style={{ fontSize: '11px', fontWeight: '700' }}>{totalUnread} {t('glabal.newMsg')}</Box>}
                  </Box>
                  {notifs.length === 0
                    ? <Box py="24px" textAlign="center"><Text color="#B0A8A4" style={{ fontSize: '13px' }}>{t('glabal.noNotif')}</Text></Box>
                    : notifs.map((n, i) => (
                      <Box key={i} display="flex" alignItems="center" gap="10px" px="14px" py="11px"
                        cursor="pointer" borderBottom={i < notifs.length - 1 ? '1px solid #F8F8F8' : 'none'}
                        _hover={{ bgColor: '#FFF9F7' }}
                        onClick={() => { setShowNotif(false); Store.clearUnread(n.chatId, myPhone); navigate('/orderspage', { state: { chefPhone: n.chefPhone, chefName: n.chefName } }); }}>
                        {n.chefImage
                          ? <img src={n.chefImage} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                          : <Box w="40px" h="40px" borderRadius="full" bgColor="#C03F0C" flexShrink={0}
                            display="flex" alignItems="center" justifyContent="center" color="white" fontWeight="700" style={{ fontSize: '16px' }}>
                            {n.chefName?.charAt(0)}
                          </Box>
                        }
                        <Box flex="1" minW={0}>
                          <Text fontWeight="700" color="#1C110D" noOfLines={1} style={{ fontSize: '13px' }}>{n.chefName}</Text>
                          <Text color="#9B8E8A" noOfLines={1} style={{ fontSize: '12px' }}>{n.lastMsg}</Text>
                        </Box>
                        <Box bgColor="#C03F0C" color="white" borderRadius="full" fontWeight="700"
                          minW="20px" h="20px" display="flex" alignItems="center" justifyContent="center" px="4px" style={{ fontSize: '10px' }}>
                          {n.unread > 9 ? '9+' : n.unread}
                        </Box>
                      </Box>
                    ))
                  }
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        {/* Search + Dacha tumani filtri */}
        <Box mx="16px" my="12px" bgColor="white" borderRadius="18px" p="14px"
          boxShadow="0 4px 10px rgba(0,0,0,0.05)">
          <Text fontWeight="700" color="#1C110D" mb="8px" style={{ fontSize: '14px' }}>{t('glabal.findChef')}</Text>
          <Box display="flex" alignItems="center" gap="10px" borderRadius="12px"
            bgColor="#FFF5F0" border="1px solid #F3E4DE"
            px="12px" style={{ height: '52px' }}>
            <FiSearch color="#9B614B" style={{ fontSize: '17px', flexShrink: 0 }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t('glabal.enterName')}
              style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '15px', color: '#1C110D' }} />
            {search && <Box cursor="pointer" color="#9B8E8A" onClick={() => setSearch('')} style={{ fontSize: '20px', lineHeight: 1 }}>×</Box>}
          </Box>

          {/* Dacha tumani tanlash */}
          <Box mt="10px" position="relative" ref={districtRef}>
            <Box
              display="flex" alignItems="center" gap="8px" borderRadius="12px" px="12px"
              bgColor={selectedDistrict ? "#FFF0EC" : "#F7F7F7"}
              border={selectedDistrict ? "1.5px solid #C03F0C" : "1.5px solid #E8E8E8"}
              cursor="pointer" style={{ height: '46px' }}
              onClick={() => setShowDistrictPicker(v => !v)}>
              <FaMapMarkerAlt color={selectedDistrict ? "#C03F0C" : "#9B8E8A"} size={14} style={{ flexShrink: 0 }} />
              <Text flex="1" fontSize="14px" fontWeight={selectedDistrict ? "700" : "400"}
                color={selectedDistrict ? "#C03F0C" : "#9B8E8A"}>
                {selectedDistrict
                  ? ANDIJON_DISTRICTS.find(d => d.id === selectedDistrict)?.name || 'Tuman'
                  : 'Dacham qaysi tumanda? (ixtiyoriy)'}
              </Text>
              {selectedDistrict
                ? <Box onClick={e => { e.stopPropagation(); clearDistrict(); }} p="4px">
                    <FaTimes color="#C03F0C" size={12} />
                  </Box>
                : <FaChevronDown color="#9B8E8A" size={12} />
              }
            </Box>

            {/* Dropdown */}
            {showDistrictPicker && (
              <Box position="absolute" top="50px" left="0" right="0" bgColor="white"
                borderRadius="16px" boxShadow="0 8px 24px rgba(0,0,0,0.14)"
                border="1px solid #F0E6E0" zIndex={300} maxH="280px" overflowY="auto">
                <Box px="14px" py="10px" borderBottom="1px solid #F5F5F5">
                  <Text fontWeight="700" fontSize="13px" color="#1C110D">Andijon viloyati tumanlari</Text>
                </Box>
                {ANDIJON_DISTRICTS.map(d => (
                  <Box key={d.id} px="14px" py="11px" cursor="pointer"
                    bgColor={selectedDistrict === d.id ? "#FFF0EC" : "white"}
                    borderBottom="1px solid #FAFAFA"
                    display="flex" alignItems="center" gap="8px"
                    onClick={() => saveDistrict(d.id)}>
                    <FaMapMarkerAlt size={11} color={selectedDistrict === d.id ? "#C03F0C" : "#C8B8B0"} />
                    <Text fontSize="14px" fontWeight={selectedDistrict === d.id ? "700" : "400"}
                      color={selectedDistrict === d.id ? "#C03F0C" : "#1C110D"}>
                      {d.name}
                    </Text>
                    {selectedDistrict === d.id && <Text ml="auto" fontSize="12px" color="#C03F0C">✓</Text>}
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* Filter natijasi xabari */}
          {selectedDistrict && (
            <Box mt="8px" bgColor="#FFF0EC" borderRadius="10px" px="12px" py="7px"
              display="flex" alignItems="center" gap="6px">
              <FaMapMarkerAlt color="#C03F0C" size={11} />
              <Text fontSize="12px" color="#C03F0C" fontWeight="600">
                {ANDIJON_DISTRICTS.find(d => d.id === selectedDistrict)?.name} ga bora oladigan oshpazlar ko'rsatilmoqda
              </Text>
            </Box>
          )}
        </Box>



        {/* Section */}
        <Box px="16px" pt="4px" pb="8px" display="flex" justifyContent="space-between" alignItems="center">
          <Text fontWeight="800" color="#1C110D" style={{ fontSize: '16px' }}>
            {search.trim() ? t('glabal.searchResults') : t('glabal.chefs')}
          </Text>
          {!search.trim() && (
            <Box cursor="pointer"
              onClick={() => navigate('/chefspage')}
              px="12px" py="5px" borderRadius="20px" bgColor="#FFF0EC" border="1px solid #FCDDD5">
              <Text color="#C03F0C" fontWeight="700" style={{ fontSize: '12px' }}>
                {t('glabal.all')}
              </Text>
            </Box>
          )}
        </Box>

        {/* Chef Cards */}
        <Box px="16px" display="flex" flexDir="column" gap="10px">
          {chefs.length === 0 ? (
            <Box bgColor="white" borderRadius="18px" p="32px" textAlign="center">
              <Text color="#B0A8A4" style={{ fontSize: '14px' }}>{t('glabal.noChefs')}</Text>
            </Box>
          ) : search.trim() && filtered.length === 0 ? (
            <Box bgColor="white" borderRadius="18px" p="32px" textAlign="center">
              <Text color="#B0A8A4" style={{ fontSize: '14px' }}>{t('glabal.notFound')}</Text>
            </Box>
          ) : displayChefs.map((chef) => {
            const realIdx = chefs.indexOf(chef);
            const isLiked = liked.includes(chef.phone);
            const isOnline = Store.isOnline('chef', chef.phone);
            return (
              <Box key={chef.phone} bgColor="white" borderRadius="18px"
                boxShadow="0 2px 10px rgba(0,0,0,0.06)" overflow="hidden">
                <Box p="14px" display="flex" alignItems="center" gap="12px"
                  cursor="pointer" onClick={() => navigate(`/chef-view/${realIdx}`)}>
                  <Box position="relative" flexShrink={0}>
                    {chef.image
                      ? <img src={chef.image} alt="" style={{ width: '60px', height: '60px', borderRadius: '14px', objectFit: 'cover' }} />
                      : <Box w="60px" h="60px" borderRadius="14px" bgColor="#F0E6E0"
                        display="flex" alignItems="center" justifyContent="center">
                        <Text fontWeight="800" color="#C03F0C" style={{ fontSize: '22px' }}>{chef.name?.charAt(0)}</Text>
                      </Box>
                    }
                    <Box position="absolute" bottom="2px" right="2px" w="11px" h="11px"
                      borderRadius="full" border="2px solid white" bgColor={isOnline ? '#22C55E' : '#D1D5DB'} />
                  </Box>
                  <Box flex="1" minW={0}>
                    <Box display="flex" alignItems="center" gap="6px" mb="2px">
                      <Text fontWeight="700" color="#1C110D" style={{ fontSize: '15px' }} noOfLines={1}>
                        {chef.name} {chef.surname}
                      </Text>
                      {isOnline && <Box bgColor="#ECFDF5" borderRadius="6px" px="5px" py="1px">
                        <Text color="#22C55E" fontWeight="700" style={{ fontSize: '9px' }}>{t('common.online')}</Text>
                      </Box>}
                    </Box>
                    <Text color="#C03F0C" fontWeight="600" style={{ fontSize: '12px' }}>{chef.exp} {t('common.experience')}</Text>
                    <Box display="flex" alignItems="center" gap="3px" mt="2px">
                      <FaStar color="#F4B400" style={{ fontSize: '11px' }} />
                      <Text color="#9B8E8A" style={{ fontSize: '11px' }}>
                        {ratings[chef.phone] > 0 ? ratings[chef.phone] : '5.0'}
                      </Text>
                    </Box>
                  </Box>
                  <Box onClick={e => { e.stopPropagation(); toggleLike(chef.phone, realIdx); }}
                    transition="transform 0.25s" transform={animIdx === realIdx ? 'scale(1.35)' : 'scale(1)'}>
                    <FaHeart style={{ fontSize: '22px', color: isLiked ? '#C03F0C' : '#E0DAD7' }} />
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
      <NavBar />
    </Box>
  );
};
export default GlabalPage;