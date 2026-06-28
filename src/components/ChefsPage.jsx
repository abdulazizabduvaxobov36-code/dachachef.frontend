import { Box, Text } from '@chakra-ui/react';
import { FaArrowLeft, FaHeart, FaStar, FaMapMarkerAlt, FaTimes, FaChevronDown } from 'react-icons/fa';
import { FiSearch } from 'react-icons/fi';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Store from '../store';

const API_BASE = import.meta.env?.VITE_API_URL || '';

const ANDIJON_DISTRICTS = [
  { id: 'bostonliq', name: "Bo'stonliq tumani (Chimgan/Charvak)" },
  { id: 'zangiota', name: 'Zangiota tumani' },
  { id: 'qibray', name: 'Qibray tumani' },
  { id: 'parkent', name: 'Parkent tumani' },
  { id: 'ohangaron', name: 'Ohangaron tumani' },
  { id: 'yangiyul', name: 'Yangiyul tumani' },
  { id: 'toshkent_t', name: 'Toshkent tumani' },
  { id: 'urtachirchiq', name: "O'rtachirchiq tumani" },
  { id: 'yuqorichirchiq', name: 'Yuqorichirchiq tumani' },
  { id: 'piskent', name: 'Piskent tumani' },
  { id: 'bekobod', name: 'Bekobod tumani' },
  { id: 'keles', name: 'Keles tumani' },
  { id: 'chinoz', name: 'Chinoz tumani' },
  { id: 'quyichirchiq', name: 'Quyichirchiq tumani' },
  { id: 'toshkent_sh', name: 'Toshkent shahri' },
];

const ChefsPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [chefs, setChefs] = useState(() => Store.getChefs());
  const [ratings, setRatings] = useState({});
  const [liked, setLiked] = useState(() => JSON.parse(localStorage.getItem('likedChefs') || '[]'));
  const [search, setSearch] = useState('');
  const [animKey, setAnimKey] = useState(null);
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

  const refresh = () => setChefs([...Store.getChefs()]);

  useEffect(() => {
    // Backend dan oshpazlarni yuklash — o'chirilganlar ham localdan o'chadi
    fetch(`${API_BASE}/chefs`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(backendChefs => {
        if (!Array.isArray(backendChefs)) return;
        const local = JSON.parse(localStorage.getItem('registeredChefs') || '[]');
        const backendPhones = new Set(backendChefs.map(c => c.phone).filter(Boolean));
        let synced = local.filter(c => backendPhones.has(c.phone));
        backendChefs.forEach(sc => {
          if (!sc.phone || !sc.name) return;
          const i = synced.findIndex(c => c.phone === sc.phone);
          if (i < 0) synced.push(sc);
          else synced[i] = { ...synced[i], ...sc };
        });
        localStorage.setItem('registeredChefs', JSON.stringify(synced));
        setChefs(synced.filter(c => c.phone && c.name));
      })
      .catch(() => { });

    const unsub = Store.listenChefs(latest => setChefs([...latest]));
    const onStorage = e => { if (e.key === 'registeredChefs') refresh(); };
    window.addEventListener('storage', onStorage);
    window.addEventListener('chefs-updated', refresh);
    return () => {
      unsub?.();
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('chefs-updated', refresh);
    };
  }, []);

  // Baholari
  useEffect(() => {
    const handler = e => {
      if (districtRef.current && !districtRef.current.contains(e.target)) setShowDistrictPicker(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (chefs.length === 0) return;
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
    }).catch(() => { });
  }, [chefs.length]);

  const toggleLike = (phone, e) => {
    e.stopPropagation();
    const upd = liked.includes(phone) ? liked.filter(p => p !== phone) : [...liked, phone];
    localStorage.setItem('likedChefs', JSON.stringify(upd));
    setLiked(upd); setAnimKey(phone); setTimeout(() => setAnimKey(null), 300);
  };

  const districtFiltered = chefs.filter(c => {
    if (!selectedDistrict) return true;
    const prefs = Store.getChefDachaPrefs(c.phone);
    if (!prefs.canGo.length && !prefs.cannotGo.length) return true;
    return prefs.canGo.includes(selectedDistrict);
  });

  const filtered = districtFiltered.filter(c => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return c.name?.toLowerCase().startsWith(q) || c.surname?.toLowerCase().startsWith(q);
  });

  return (
    <Box bgColor="#FFF5F0" minH="100dvh" pb="32px">
      {/* Header */}
      <Box bgColor="#C03F0C" px="16px" pt="14px" pb="20px">
        <Box display="flex" alignItems="center" gap="12px">
          <Box w="36px" h="36px" bgColor="rgba(255,255,255,0.18)" borderRadius="full"
            display="flex" alignItems="center" justifyContent="center"
            cursor="pointer" onClick={() => navigate('/glabal')} flexShrink={0}>
            <FaArrowLeft style={{ color: 'white', fontSize: '14px' }} />
          </Box>
          <Text fontWeight="800" color="white" style={{ fontSize: '18px' }}>
            {t('chefsPage.title') || 'Barcha oshpazlar'}
          </Text>
        </Box>
      </Box>

      {/* Search + Tuman filtri */}
      <Box mx="16px" mt="-10px" mb="12px" bgColor="white" borderRadius="18px" p="14px"
        boxShadow="0 4px 16px rgba(192,63,12,0.12)">
        <Box display="flex" alignItems="center" gap="10px" borderRadius="12px"
          bgColor="#FFF5F0" border="1.5px solid #F3E4DE"
          px="12px" style={{ height: '46px' }}>
          <FiSearch color="#9B614B" style={{ fontSize: '17px', flexShrink: 0 }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('chefsPage.search') || 'Ism bilan qidirish...'}
            style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '15px', color: '#1C110D' }} />
          {search && <Box cursor="pointer" color="#9B8E8A" onClick={() => setSearch('')} style={{ fontSize: '20px', lineHeight: 1 }}>×</Box>}
        </Box>

        {/* Tuman filtri */}
        <Box mt="10px" position="relative" ref={districtRef}>
          <Box display="flex" alignItems="center" gap="8px" borderRadius="12px" px="12px"
            bgColor={selectedDistrict ? "#FFF0EC" : "#F7F7F7"}
            border={selectedDistrict ? "1.5px solid #C03F0C" : "1.5px solid #E8E8E8"}
            cursor="pointer" style={{ height: '46px' }}
            onClick={() => setShowDistrictPicker(v => !v)}>
            <FaMapMarkerAlt color={selectedDistrict ? "#C03F0C" : "#9B8E8A"} size={14} style={{ flexShrink: 0 }} />
            <Text flex="1" fontSize="14px" fontWeight={selectedDistrict ? "700" : "400"}
              color={selectedDistrict ? "#C03F0C" : "#9B8E8A"}>
              {selectedDistrict
                ? ANDIJON_DISTRICTS.find(d => d.id === selectedDistrict)?.name
                : 'Tuman bo\'yicha filter (ixtiyoriy)'}
            </Text>
            {selectedDistrict
              ? <Box onClick={e => { e.stopPropagation(); clearDistrict(); }} p="4px">
                <FaTimes color="#C03F0C" size={12} />
              </Box>
              : <FaChevronDown color="#9B8E8A" size={12} />
            }
          </Box>

          {showDistrictPicker && (
            <Box position="absolute" top="50px" left="0" right="0" bgColor="white"
              borderRadius="16px" boxShadow="0 8px 24px rgba(0,0,0,0.14)"
              border="1px solid #F0E6E0" zIndex={300} maxH="260px" overflowY="auto">
              <Box px="14px" py="10px" borderBottom="1px solid #F5F5F5">
                <Text fontWeight="700" fontSize="13px" color="#1C110D">Toshkent viloyati tumanlari</Text>
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

        {selectedDistrict && (
          <Box mt="8px" bgColor="#FFF0EC" borderRadius="10px" px="12px" py="7px"
            display="flex" alignItems="center" gap="6px">
            <FaMapMarkerAlt color="#C03F0C" size={11} />
            <Text fontSize="12px" color="#C03F0C" fontWeight="600">
              {ANDIJON_DISTRICTS.find(d => d.id === selectedDistrict)?.name} ga bora oladigan oshpazlar
            </Text>
          </Box>
        )}
      </Box>

      {/* List */}
      <Box px="16px" display="flex" flexDir="column" gap="10px">
        {filtered.length === 0 && (
          <Box bgColor="white" borderRadius="18px" p="32px" textAlign="center"
            boxShadow="0 2px 10px rgba(0,0,0,0.05)">
            <FaUtensils style={{ fontSize: '32px', color: '#F3D5C8', margin: '0 auto 10px' }} />
            <Text color="#B0A8A4" style={{ fontSize: '14px' }}>
              {chefs.length === 0 ? (t('chefsPage.noChefs') || 'Hozircha oshpaz yo\'q') : (t('chefsPage.notFound') || 'Topilmadi')}
            </Text>
          </Box>
        )}
        {filtered.map((chef) => {
          const realIdx = chefs.indexOf(chef);
          const isOnline = Store.isOnline('chef', chef.phone);
          const isLiked = liked.includes(chef.phone);
          return (
            <Box key={chef.phone || realIdx} bgColor="white" borderRadius="18px"
              boxShadow="0 2px 10px rgba(0,0,0,0.06)" overflow="hidden"
              border={isOnline ? '1.5px solid #ECFDF5' : '1.5px solid transparent'}
              cursor="pointer" onClick={() => navigate(`/chef-view/${realIdx}`)}>
              <Box display="flex" alignItems="center" gap="12px" p="14px">
                <Box position="relative" flexShrink={0}>
                  {chef.image
                    ? <img src={chef.image} alt="" style={{ width: '60px', height: '60px', borderRadius: '14px', objectFit: 'cover' }}
                      onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                    : null}
                  <Box w="60px" h="60px" borderRadius="14px" bgColor="#FFF0EC"
                    display={chef.image ? 'none' : 'flex'} alignItems="center" justifyContent="center">
                    <Text fontWeight="800" color="#C03F0C" style={{ fontSize: '22px' }}>{chef.name?.charAt(0)}</Text>
                  </Box>
                  <Box position="absolute" bottom="2px" right="2px" w="12px" h="12px"
                    borderRadius="full" border="2px solid white"
                    bgColor={isOnline ? '#22C55E' : '#D1D5DB'} />
                </Box>

                <Box flex="1" minW={0}>
                  <Box display="flex" alignItems="center" gap="6px" mb="3px">
                    <Text fontWeight="700" color="#1C110D" style={{ fontSize: '15px' }} noOfLines={1}>
                      {chef.name} {chef.surname}
                    </Text>
                    {isOnline && (
                      <Box bgColor="#ECFDF5" borderRadius="6px" px="5px" py="1px" flexShrink={0}>
                        <Text color="#22C55E" fontWeight="700" style={{ fontSize: '9px' }}>
                          {t('common.online') || 'ONLINE'}
                        </Text>
                      </Box>
                    )}
                  </Box>
                  <Box display="flex" alignItems="center" gap="6px">
                    <Box bgColor="#FFF0EC" borderRadius="8px" px="7px" py="2px">
                      <Text color="#C03F0C" fontWeight="700" style={{ fontSize: '11px' }}>
                        {chef.exp} yil tajriba
                      </Text>
                    </Box>
                  </Box>
                  <Box display="flex" alignItems="center" gap="3px" mt="4px">
                    <FaStar color="#F4B400" style={{ fontSize: '11px' }} />
                    <Text color="#9B8E8A" fontWeight="600" style={{ fontSize: '11px' }}>
                      {ratings[chef.phone] > 0 ? ratings[chef.phone] : '5.0'}
                    </Text>
                  </Box>
                </Box>

                <Box cursor="pointer" transition="transform 0.25s"
                  transform={animKey === chef.phone ? 'scale(1.35)' : 'scale(1)'}
                  onClick={e => toggleLike(chef.phone, e)}>
                  <FaHeart style={{ fontSize: '22px', color: isLiked ? '#C03F0C' : '#E0DAD7' }} />
                </Box>
              </Box>

            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
export default ChefsPage;