import { Box, Text } from '@chakra-ui/react';
import { FaArrowLeft, FaHeart, FaStar, FaUtensils } from 'react-icons/fa';
import { FiSearch } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Store from '../store';

const API_BASE = import.meta.env?.VITE_API_URL || '';

const ChefsPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [chefs, setChefs] = useState(() => Store.getChefs());
  const [liked, setLiked] = useState(() => JSON.parse(localStorage.getItem('likedChefs') || '[]'));
  const [search, setSearch] = useState('');
  const [animKey, setAnimKey] = useState(null);

  const refresh = () => setChefs([...Store.getChefs()]);

  useEffect(() => {
    // Backend dan oshpazlarni yuklash
    fetch(`${API_BASE}/chefs`)
      .then(r => r.ok ? r.json() : [])
      .then(backendChefs => {
        if (!Array.isArray(backendChefs) || backendChefs.length === 0) return;
        const local = JSON.parse(localStorage.getItem('registeredChefs') || '[]');
        let changed = false;
        backendChefs.forEach(sc => {
          if (!sc.phone || !sc.name) return;
          const i = local.findIndex(c => c.phone === sc.phone);
          if (i < 0) { local.push(sc); changed = true; }
          else { local[i] = { ...local[i], ...sc }; changed = true; }
        });
        if (changed) {
          localStorage.setItem('registeredChefs', JSON.stringify(local));
          setChefs(local.filter(c => c.phone && c.name));
        }
      })
      .catch(() => {});

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

  const toggleLike = (phone, e) => {
    e.stopPropagation();
    const upd = liked.includes(phone) ? liked.filter(p => p !== phone) : [...liked, phone];
    localStorage.setItem('likedChefs', JSON.stringify(upd));
    setLiked(upd); setAnimKey(phone); setTimeout(() => setAnimKey(null), 300);
  };

  const filtered = chefs.filter(c => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return c.name?.toLowerCase().startsWith(q) || c.surname?.toLowerCase().startsWith(q);
  });

  return (
    <Box bgColor="#FFF5F0" minH="100dvh" pb="32px">
      {/* Header */}
      <Box bgColor="#C03F0C" px="16px" pt="14px" pb="20px">
        <Box display="flex" alignItems="center" gap="12px" mb="16px">
          <Box w="36px" h="36px" bgColor="rgba(255,255,255,0.18)" borderRadius="full"
            display="flex" alignItems="center" justifyContent="center"
            cursor="pointer" onClick={() => navigate('/glabal')} flexShrink={0}>
            <FaArrowLeft style={{ color: 'white', fontSize: '14px' }} />
          </Box>
          <Text fontWeight="800" color="white" style={{ fontSize: '18px' }}>
            {t('chefsPage.title') || 'Barcha oshpazlar'}
          </Text>
        </Box>
        <Box display="flex" alignItems="center" gap="10px">
          <Box bgColor="rgba(255,255,255,0.15)" borderRadius="12px" px="14px" py="8px"
            display="flex" alignItems="center" gap="8px">
            <FaUtensils style={{ color: 'white', fontSize: '13px' }} />
            <Text color="white" fontWeight="700" style={{ fontSize: '13px' }}>
              {chefs.length} oshpaz
            </Text>
          </Box>
          <Box bgColor="rgba(255,255,255,0.15)" borderRadius="12px" px="14px" py="8px">
            <Text color="white" fontWeight="700" style={{ fontSize: '13px' }}>
              {chefs.filter(c => Store.isOnline('chef', c.phone)).length} online
            </Text>
          </Box>
        </Box>
      </Box>

      {/* Search */}
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
                    <Text color="#9B8E8A" fontWeight="600" style={{ fontSize: '11px' }}>5.0</Text>
                  </Box>
                </Box>

                <Box cursor="pointer" transition="transform 0.25s"
                  transform={animKey === chef.phone ? 'scale(1.35)' : 'scale(1)'}
                  onClick={e => toggleLike(chef.phone, e)}>
                  <FaHeart style={{ fontSize: '22px', color: isLiked ? '#C03F0C' : '#E0DAD7' }} />
                </Box>
              </Box>

              {chef.bio && (
                <Box px="14px" pb="12px">
                  <Text color="#9B8E8A" style={{ fontSize: '12px' }} noOfLines={2}>{chef.bio}</Text>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
export default ChefsPage;
