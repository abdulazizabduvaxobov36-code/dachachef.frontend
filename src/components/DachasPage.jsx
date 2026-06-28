import { Box, Text } from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaMapMarkerAlt, FaPhone, FaTimes, FaChevronDown, FaHome, FaClipboardList, FaHeart, FaUser } from 'react-icons/fa';
import { MdHolidayVillage } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import Store from '../store';

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

const DachasPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const [dachas, setDachas] = useState([]);
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [showPicker, setShowPicker] = useState(false);
    const [expanded, setExpanded] = useState({});
    const [imgModal, setImgModal] = useState(null);
    const pickerRef = useRef(null);

    useEffect(() => {
        Store.fetchDachas().then(() => setDachas(Store.getDachas()));
        setDachas(Store.getDachas());
        const handler = () => setDachas(Store.getDachas());
        window.addEventListener('dachas-updated', handler);
        return () => window.removeEventListener('dachas-updated', handler);
    }, []);

    useEffect(() => {
        const handler = e => {
            if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filtered = selectedDistrict
        ? dachas.filter(d => {
            const distName = ANDIJON_DISTRICTS.find(x => x.id === selectedDistrict)?.name;
            return d.district === distName;
        })
        : dachas;

    const navTabs = [
        { icon: FaHome, route: '/glabal', label: t('footer.home') },
        { icon: FaClipboardList, route: '/orderspage', label: t('footer.orders') },
        { icon: MdHolidayVillage, route: '/dachas', label: 'Dachalar' },
        { icon: FaHeart, route: '/like', label: t('footer.like') },
        { icon: FaUser, route: '/profile', label: t('footer.profile') },
    ];

    return (
        <Box minH="100dvh" bgColor="#FFF5F0">
            {/* Header */}
            <Box bgColor="white" px={{ base: '14px', sm: '18px' }} py={{ base: '12px', sm: '14px' }}
                display="flex" alignItems="center" gap="12px" boxShadow="0 1px 0 #F0EBE6">
                <Box bgColor="#FFF0EC" borderRadius="full" display="flex" alignItems="center"
                    justifyContent="center" cursor="pointer" onClick={() => navigate(-1)}
                    style={{ width: 'clamp(32px,9vw,38px)', height: 'clamp(32px,9vw,38px)' }}>
                    <FaArrowLeft style={{ fontSize: 'clamp(12px,3vw,14px)', color: '#1C110D' }} />
                </Box>
                <Box>
                    <Text fontWeight="bold" color="#1C110D" style={{ fontSize: 'clamp(15px,4.2vw,18px)' }}>
                        🏡 Dachalar
                    </Text>
                    <Text fontSize="12px" color="#9B614B">
                        {selectedDistrict ? `${filtered.length} ta topildi` : `${dachas.length} ta dacha`}
                    </Text>
                </Box>
            </Box>

            {/* Filter */}
            <Box mx="14px" mt="12px" bgColor="white" borderRadius="18px" p="14px"
                boxShadow="0 2px 8px rgba(0,0,0,0.06)">
                <Box position="relative" ref={pickerRef}>
                    <Box display="flex" alignItems="center" gap="8px" borderRadius="12px" px="12px"
                        bgColor={selectedDistrict ? '#FFF0EC' : '#F7F7F7'}
                        border={selectedDistrict ? '1.5px solid #C03F0C' : '1.5px solid #E8E8E8'}
                        cursor="pointer" style={{ height: '46px' }}
                        onClick={() => setShowPicker(v => !v)}>
                        <FaMapMarkerAlt color={selectedDistrict ? '#C03F0C' : '#9B8E8A'} size={14} />
                        <Text flex="1" fontSize="14px" fontWeight={selectedDistrict ? '700' : '400'}
                            color={selectedDistrict ? '#C03F0C' : '#9B8E8A'}>
                            {selectedDistrict
                                ? ANDIJON_DISTRICTS.find(d => d.id === selectedDistrict)?.name
                                : 'Tuman bo\'yicha qidirish'}
                        </Text>
                        {selectedDistrict
                            ? <Box onClick={e => { e.stopPropagation(); setSelectedDistrict(''); }} p="4px">
                                <FaTimes color="#C03F0C" size={12} />
                            </Box>
                            : <FaChevronDown color="#9B8E8A" size={12} />
                        }
                    </Box>
                    {showPicker && (
                        <Box position="absolute" top="50px" left="0" right="0" bgColor="white"
                            borderRadius="16px" boxShadow="0 8px 24px rgba(0,0,0,0.14)"
                            border="1px solid #F0E6E0" zIndex={300} maxH="260px" overflowY="auto">
                            <Box px="14px" py="10px" borderBottom="1px solid #F5F5F5">
                                <Text fontWeight="700" fontSize="13px" color="#1C110D">Andijon viloyati tumanlari</Text>
                            </Box>
                            {ANDIJON_DISTRICTS.map(d => (
                                <Box key={d.id} px="14px" py="11px" cursor="pointer"
                                    bgColor={selectedDistrict === d.id ? '#FFF0EC' : 'white'}
                                    borderBottom="1px solid #FAFAFA"
                                    display="flex" alignItems="center" gap="8px"
                                    onClick={() => { setSelectedDistrict(d.id); setShowPicker(false); }}>
                                    <FaMapMarkerAlt size={11} color={selectedDistrict === d.id ? '#C03F0C' : '#C8B8B0'} />
                                    <Text fontSize="14px" fontWeight={selectedDistrict === d.id ? '700' : '400'}
                                        color={selectedDistrict === d.id ? '#C03F0C' : '#1C110D'}>
                                        {d.name}
                                    </Text>
                                    {selectedDistrict === d.id && <Text ml="auto" fontSize="12px" color="#C03F0C">✓</Text>}
                                </Box>
                            ))}
                        </Box>
                    )}
                </Box>
            </Box>

            {/* List */}
            <Box pb="90px" px="14px" mt="12px">
                {dachas.length === 0 ? (
                    <Box mt="60px" textAlign="center">
                        <Text fontSize="50px" mb="12px">🏡</Text>
                        <Text fontWeight="700" color="#1C110D" fontSize="16px">Hali dacha qo'shilmagan</Text>
                        <Text color="#9B8E8A" fontSize="13px" mt="6px">Admin dachalarni qo'shgach bu yerda ko'rinadi</Text>
                    </Box>
                ) : filtered.length === 0 ? (
                    <Box mt="60px" textAlign="center">
                        <Text fontSize="40px" mb="12px">🔍</Text>
                        <Text fontWeight="700" color="#1C110D" fontSize="16px">Bu tumanda dacha topilmadi</Text>
                        <Text color="#9B8E8A" fontSize="13px" mt="6px">Boshqa tumanni tanlang</Text>
                    </Box>
                ) : (
                    filtered.map(dacha => {
                        const isExpanded = expanded[dacha.id];
                        const desc = dacha.description || '';
                        const shortDesc = desc.length > 120 ? desc.slice(0, 120) + '...' : desc;

                        return (
                            <Box key={dacha.id} bgColor="white" borderRadius="18px" mb="14px"
                                overflow="hidden" border="1px solid #F0EBE6"
                                boxShadow="0 2px 10px rgba(0,0,0,0.06)">

                                {/* Rasm */}
                                {dacha.image
                                    ? <img src={dacha.image} alt={dacha.name} cursor="pointer"
                                        onClick={() => setImgModal(dacha.image)}
                                        style={{ width: '100%', height: '180px', objectFit: 'cover', cursor: 'pointer' }} />
                                    : <Box w="100%" h="120px" bgColor="#F0E6E0"
                                        display="flex" alignItems="center" justifyContent="center" fontSize="50px">
                                        🏡
                                    </Box>
                                }

                                <Box p="14px">
                                    {/* Nomi + narx */}
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb="6px">
                                        <Text fontWeight="800" color="#1C110D" fontSize="16px" flex="1" lineHeight="1.3">
                                            {dacha.name}
                                        </Text>
                                        {(dacha.price || !dacha.price) && (
                                            <Box bgColor="#C03F0C" borderRadius="20px" px="10px" py="4px" ml="8px" flexShrink={0}>
                                                <Text color="white" fontSize="11px" fontWeight="700">
                                                    {dacha.price || 'Kelishilgan holda'}
                                                </Text>
                                            </Box>
                                        )}
                                    </Box>

                                    {/* Joylashuv */}
                                    <Box display="flex" alignItems="center" gap="4px" mb="10px">
                                        <FaMapMarkerAlt color="#C03F0C" size={11} />
                                        <Text fontSize="12px" color="#9B614B" fontWeight="600">{dacha.district}</Text>
                                        {dacha.address && <Text fontSize="12px" color="#9B8E8A">· {dacha.address}</Text>}
                                    </Box>

                                    {/* Sig'im */}
                                    {dacha.capacity && (
                                        <Box display="flex" alignItems="center" gap="6px" mb="10px">
                                            <Text fontSize="13px" color="#1C110D">👥 {dacha.capacity} kishigacha</Text>
                                        </Box>
                                    )}

                                    {/* Qulayliklar */}
                                    {dacha.amenities?.length > 0 && (
                                        <Box display="flex" flexWrap="wrap" gap="6px" mb="12px">
                                            {dacha.amenities.map(key => {
                                                const AMENITY_LABELS = {
                                                    pool: '🏊 Basseyn', kids_pool: '👶 Bolalar basseyn',
                                                    billiard: '🎱 Bilyard', tennis: '🏓 Stol tennis',
                                                    ps: '🎮 PlayStation', wifi: '🌐 Wi-Fi',
                                                    bbq: '🔥 Mangal/BBQ', tv: '📺 Smart TV',
                                                    ac: '🌀 Konditsioner', tapshan: '🛋 Tapshan',
                                                    kitchen: '🍽 Oshxona', parking: '🚗 Avtoturargoh',
                                                    karaoke: '🎤 Karaoke', gazebo: '🌿 So\'ri',
                                                    speaker: '🔊 Kolonka', beds: '🛏 Yotoqxona'
                                                };
                                                return (
                                                    <Box key={key} bgColor="#FFF5F0" borderRadius="10px" px="10px" py="5px"
                                                        border="1px solid #F0E6E0">
                                                        <Text fontSize="12px" color="#C03F0C" fontWeight="600">
                                                            {AMENITY_LABELS[key] || key}
                                                        </Text>
                                                    </Box>
                                                );
                                            })}
                                        </Box>
                                    )}

                                    {/* Tavsif */}
                                    {desc && (
                                        <Box mb="12px">
                                            <Text fontSize="13px" color="#525252" lineHeight="1.6">
                                                {isExpanded ? desc : shortDesc}
                                            </Text>
                                            {desc.length > 120 && (
                                                <Text fontSize="12px" color="#C03F0C" fontWeight="700" mt="4px" cursor="pointer"
                                                    onClick={() => setExpanded(p => ({ ...p, [dacha.id]: !p[dacha.id] }))}>
                                                    {isExpanded ? 'Kamroq ko\'rsatish ▲' : 'Ko\'proq ko\'rsatish ▼'}
                                                </Text>
                                            )}
                                        </Box>
                                    )}

                                    {/* Tugmalar */}
                                    <Box display="flex" gap="8px">
                                        {dacha.phone && (
                                            <Box flex="1" display="flex" alignItems="center" justifyContent="center"
                                                gap="6px" py="11px" borderRadius="14px" cursor="pointer"
                                                bgColor="#FFF0EC" border="1.5px solid #F5C5B0"
                                                onClick={() => window.open(`tel:${dacha.phone}`)}>
                                                <FaPhone size={13} color="#C03F0C" />
                                                <Text fontSize="13px" fontWeight="700" color="#C03F0C">Qo'ng'iroq</Text>
                                            </Box>
                                        )}
                                        <Box flex="1" display="flex" alignItems="center" justifyContent="center"
                                            gap="6px" py="11px" borderRadius="14px" cursor="pointer"
                                            bgColor="#C03F0C" border="1.5px solid #C03F0C"
                                            onClick={() => {
                                                const distId = ANDIJON_DISTRICTS.find(d => d.name === dacha.district)?.id;
                                                if (distId) localStorage.setItem('customer_dacha_district', distId);
                                                navigate('/glabal');
                                            }}>
                                            <Text fontSize="13px" fontWeight="700" color="white">👨‍🍳 Oshpaz top</Text>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        );
                    })
                )}
            </Box>

            {/* Rasm modali */}
            {imgModal && (
                <Box position="fixed" top="0" left="0" right="0" bottom="0"
                    bgColor="rgba(0,0,0,0.92)" zIndex={500}
                    display="flex" alignItems="center" justifyContent="center"
                    onClick={() => setImgModal(null)}>
                    <img src={imgModal} alt=""
                        style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '12px' }} />
                    <Box position="absolute" top="16px" right="16px" bgColor="rgba(255,255,255,0.15)"
                        borderRadius="full" w="36px" h="36px" display="flex" alignItems="center"
                        justifyContent="center" cursor="pointer" fontSize="18px" color="white">
                        ✕
                    </Box>
                </Box>
            )}

            {/* Bottom nav */}
            <Box className="fixed-bottom" borderTop="1px solid #EBEBEB"
                display="flex" justifyContent="space-around" alignItems="center" py="10px" bgColor="white">
                {navTabs.map(tab => (
                    <Box key={tab.route} display="flex" flexDir="column" alignItems="center" gap="3px"
                        cursor="pointer" px="10px" onClick={() => navigate(tab.route)}>
                        <tab.icon style={{ fontSize: '22px', color: location.pathname === tab.route ? '#C03F0C' : '#B0A8A4' }} />
                        <Text fontWeight="700" style={{ fontSize: '10px', color: location.pathname === tab.route ? '#C03F0C' : '#B0A8A4' }}>
                            {tab.label}
                        </Text>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

export default DachasPage;