import { Box, Text } from '@chakra-ui/react';
import { FaArrowLeft, FaHeart, FaStar } from 'react-icons/fa';
import { FiSearch } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Store from '../store';

const ChefsPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [chefs, setChefs] = useState(() => Store.getChefs());
  const [liked, setLiked] = useState(() => JSON.parse(localStorage.getItem('likedChefs') || '[]'));
  const [search, setSearch] = useState('');
  const [animKey, setAnimKey] = useState(null);

  const refresh = () => setChefs([...Store.getChefs()]);

  useEffect(() => {
    const unsub = Store.listenChefs(latest => setChefs([...latest]));
    const onStorage = e => { if (e.key === 'registeredChefs') refresh(); };
    window.addEventListener('storage', onStorage);
    window.addEventListener('chefs-updated', refresh);
    return () => { unsub?.(); window.removeEventListener('storage', onStorage); window.removeEventListener('chefs-updated', refresh); };
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
    <Box bgColor="#FFF5F0" minH="100dvh" pb="24px">
      {/* Header */}
      <Box bgColor="white" px="16px" pt="14px" pb="12px" boxShadow="0 1px 0 #EBEBEB">
        <Box display="flex" alignItems="center" gap="12px">
          <Box w="36px" h="36px" bgColor="#F5F3F1" borderRadius="full"
            display="flex" alignItems="center" justifyContent="center"
            cursor="pointer" onClick={() => navigate('/glabal')} flexShrink={0}>
            <FaArrowLeft style={{ color: '#1C110D', fontSize: '14px' }} />
          </Box>
          <Text fontWeight="800" color="#1C110D" style={{ fontSize: '18px' }}>{t('chefsPage.title')}</Text>
        </Box>
      </Box>

      {/* Search */}
      <Box mx="16px" my="12px" bgColor="white" borderRadius="18px" p="14px"
        boxShadow="0 4px 10px rgba(0,0,0,0.05)">
        <Text fontWeight="700" color="#1C110D" mb="8px" style={{ fontSize: '14px' }}>
          Oshpaz qidirish
        </Text>
        <Box display="flex" alignItems="center" gap="10px" borderRadius="12px"
          bgColor="#FFF5F0" border="1px solid #F3E4DE"
          px="12px" style={{ height: '44px' }}>
          <FiSearch color="#9B614B" style={{ fontSize: '17px', flexShrink: 0 }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('chefsPage.search')}
            style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '15px', color: '#1C110D' }} />
          {search && <Box cursor="pointer" color="#9B8E8A" onClick={() => setSearch('')} style={{ fontSize: '20px', lineHeight: 1 }}>×</Box>}
        </Box>
      </Box>

      <Box px="16px" pt="14px" display="flex" flexDir="column" gap="10px">
        {filtered.length === 0 && (
          <Box bgColor="white" borderRadius="18px" p="32px" textAlign="center">
            <Text color="#B0A8A4" style={{ fontSize: '14px' }}>{chefs.length === 0 ? t('chefsPage.noChefs') : t('chefsPage.notFound')}</Text>
          </Box>
        )}
        {filtered.map((chef, idx) => {
          const realIdx = chefs.indexOf(chef);
          const isOnline = Store.isOnline('chef', chef.phone);
          const isLiked = liked.includes(chef.phone);
          return (
            <Box key={chef.phone || idx} bgColor="white" borderRadius="18px"
              boxShadow="0 2px 10px rgba(0,0,0,0.06)"
              display="flex" alignItems="center" gap="12px" p="14px"
              cursor="pointer" onClick={() => navigate(`/chef-view/${realIdx}`)}>
              <Box position="relative" flexShrink={0}>
                {chef.image
                  ? <img src={chef.image} alt="" style={{ width: '58px', height: '58px', borderRadius: '14px', objectFit: 'cover' }}
                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                  : null}
                <Box w="58px" h="58px" borderRadius="14px" bgColor="#F0E6E0"
                  display={chef.image ? 'none' : 'flex'} alignItems="center" justifyContent="center">
                  <Text fontWeight="800" color="#C03F0C" style={{ fontSize: '20px' }}>{chef.name?.charAt(0)}</Text>
                </Box>
                <Box position="absolute" bottom="2px" right="2px" w="11px" h="11px"
                  borderRadius="full" border="2px solid white" bgColor={isOnline ? '#22C55E' : '#D1D5DB'} />
              </Box>
              <Box flex="1" minW={0}>
                <Box display="flex" alignItems="center" gap="6px" mb="2px">
                  <Text fontWeight="700" color="#1C110D" style={{ fontSize: '15px' }} noOfLines={1}>{chef.name} {chef.surname}</Text>
                  {isOnline && <Box bgColor="#ECFDF5" borderRadius="6px" px="5px" py="1px">
                    <Text color="#22C55E" fontWeight="700" style={{ fontSize: '9px' }}>{t('common.online')}</Text>
                  </Box>}
                </Box>
                <Text color="#C03F0C" fontWeight="600" style={{ fontSize: '12px' }}>{chef.exp} {t('common.experience')}</Text>
                <Box display="flex" alignItems="center" gap="3px" mt="2px">
                  <FaStar color="#F4B400" style={{ fontSize: '11px' }} />
                  <Text color="#9B8E8A" style={{ fontSize: '11px' }}>5.0</Text>
                </Box>
              </Box>
              <Box cursor="pointer" transition="transform 0.25s"
                transform={animKey === chef.phone ? 'scale(1.35)' : 'scale(1)'}
                onClick={e => toggleLike(chef.phone, e)}>
                <FaHeart style={{ fontSize: '22px', color: isLiked ? '#C03F0C' : '#E0DAD7' }} />
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
export default ChefsPage;