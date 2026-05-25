import { Box, Button, Text } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaCheck, FaTimes, FaMapMarkerAlt } from 'react-icons/fa';
import Store from '../store';

const ANDIJON_DISTRICTS = [
    { id: 'andijon_shahar', name: 'Andijon shahri' },
    { id: 'asaka', name: 'Asaka tumani' },
    { id: 'oltinkol', name: "Oltinko'l tumani" },
    { id: 'baliqchi', name: 'Baliqchi tumani' },
    { id: 'boston', name: "Bo'ston tumani" },
    { id: 'buloqboshi', name: 'Buloqboshi tumani' },
    { id: 'izboskan', name: 'Izboskan tumani' },
    { id: 'jalolquduq', name: 'Jalolquduq tumani' },
    { id: 'xojaobod', name: "Xo'jaobod tumani" },
    { id: 'marhamat', name: 'Marhamat tumani' },
    { id: 'mashrabov', name: 'Mashrabov tumani' },
    { id: 'paxtaobod', name: 'Paxtaobod tumani' },
    { id: 'qurgontepa', name: "Qo'rg'ontepa tumani" },
    { id: 'shahrixon', name: 'Shahrixon tumani' },
    { id: 'ulugmor', name: "Ulug'nor tumani" },
    { id: 'xonobod', name: 'Xonobod shahri' },
    { id: 'imomota', name: 'Imom Ota' },
];

const ChefDachaPrefsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const fromProfile = location.state?.from === 'profile';

    const stored = (() => {
        const s = JSON.parse(localStorage.getItem('chefProfile') || 'null');
        if (s?.phone) return s;
        const sess = Store.getSession();
        if (sess?.role === 'chef' && sess?.data?.phone) return sess.data;
        return {};
    })();
    const chefPhone = stored.phone || '';

    const [prefs, setPrefs] = useState({ canGo: [], cannotGo: [] });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setPrefs(Store.getChefDachaPrefs(chefPhone));
    }, [chefPhone]);

    const getStatus = (id) => {
        if (prefs.canGo.includes(id)) return 'can';
        if (prefs.cannotGo.includes(id)) return 'cannot';
        return 'neutral';
    };

    const toggle = (id, newStatus) => {
        setSaved(false);
        setPrefs(prev => {
            let canGo = prev.canGo.filter(x => x !== id);
            let cannotGo = prev.cannotGo.filter(x => x !== id);
            if (newStatus === 'can') canGo.push(id);
            if (newStatus === 'cannot') cannotGo.push(id);
            return { canGo, cannotGo };
        });
    };

    const selectAll = () => {
        setSaved(false);
        setPrefs({ canGo: ANDIJON_DISTRICTS.map(d => d.id), cannotGo: [] });
    };

    const clearAll = () => {
        setSaved(false);
        setPrefs({ canGo: [], cannotGo: [] });
    };

    const handleSave = () => {
        setSaving(true);
        Store.setChefDachaPrefs(chefPhone, prefs);
        setTimeout(() => {
            setSaving(false);
            setSaved(true);
            setTimeout(() => navigate(fromProfile ? '/chef-profile' : '/chef-home'), 600);
        }, 400);
    };

    const canCount = prefs.canGo.length;
    const cannotCount = prefs.cannotGo.length;
    const neutralCount = ANDIJON_DISTRICTS.length - canCount - cannotCount;

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
                        {t('chefDachaPrefs.title')}
                    </Text>
                    <Text color="#9B614B" fontSize="12px">{t('chefDachaPrefs.subtitle')}</Text>
                </Box>
            </Box>

            <Box pb="120px" px={{ base: '14px', sm: '16px' }}>
                {/* Info + stats */}
                <Box mt="16px" bgColor="white" borderRadius="18px" p="16px"
                    boxShadow="0 2px 8px rgba(0,0,0,0.06)" border="1px solid #FFF0EC">
                    <Text color="#9B614B" fontSize="13px" lineHeight="1.6" mb="12px">
                        {t('chefDachaPrefs.info')}
                    </Text>
                    <Box display="flex" gap="8px" flexWrap="wrap" mb="12px">
                        {canCount > 0 && (
                            <Box bgColor="#F0FFF4" borderRadius="10px" px="12px" py="6px" border="1px solid #C6F6D5">
                                <Text fontSize="13px" color="#276749" fontWeight="700">✓ {canCount} {t('chefDachaPrefs.canGoLabel')}</Text>
                            </Box>
                        )}
                        {cannotCount > 0 && (
                            <Box bgColor="#FFF5F5" borderRadius="10px" px="12px" py="6px" border="1px solid #FECDCA">
                                <Text fontSize="13px" color="#C53030" fontWeight="700">✗ {cannotCount} {t('chefDachaPrefs.cannotGoLabel')}</Text>
                            </Box>
                        )}
                        {neutralCount > 0 && (
                            <Box bgColor="#F7F7F7" borderRadius="10px" px="12px" py="6px" border="1px solid #E2E2E2">
                                <Text fontSize="13px" color="#666" fontWeight="700">— {neutralCount} {t('chefDachaPrefs.neutralLabel')}</Text>
                            </Box>
                        )}
                    </Box>
                    <Box display="flex" gap="8px">
                        <Button size="sm" bgColor="#F0FFF4" color="#276749" borderRadius="10px"
                            border="1px solid #C6F6D5" fontWeight="700" fontSize="12px"
                            _hover={{ bgColor: '#DCFCE7' }} onClick={selectAll}>
                            {t('chefDachaPrefs.selectAll')}
                        </Button>
                        <Button size="sm" bgColor="#F7F7F7" color="#666" borderRadius="10px"
                            border="1px solid #E2E2E2" fontWeight="700" fontSize="12px"
                            _hover={{ bgColor: '#EFEFEF' }} onClick={clearAll}>
                            {t('chefDachaPrefs.clear')}
                        </Button>
                    </Box>
                </Box>

                {/* Tumanlar */}
                {ANDIJON_DISTRICTS.map(district => {
                    const status = getStatus(district.id);
                    return (
                        <Box key={district.id} mt="10px" bgColor="white" borderRadius="16px" p="14px"
                            boxShadow="0 2px 6px rgba(0,0,0,0.05)"
                            border={status === 'can' ? '1.5px solid #22C55E' : status === 'cannot' ? '1.5px solid #E53E3E' : '1px solid #F0EBE6'}>
                            <Box display="flex" alignItems="center" gap="8px" mb="10px">
                                <FaMapMarkerAlt color={status === 'can' ? '#22C55E' : status === 'cannot' ? '#E53E3E' : '#C03F0C'} size={13} />
                                <Text fontWeight="700" color="#1C110D" fontSize="14px" flex="1">{district.name}</Text>
                                {status === 'can' && (
                                    <Box bgColor="#F0FFF4" borderRadius="full" px="8px" py="2px">
                                        <Text fontSize="11px" color="#276749" fontWeight="700">✓ {t('chefDachaPrefs.canGo')}</Text>
                                    </Box>
                                )}
                                {status === 'cannot' && (
                                    <Box bgColor="#FFF5F5" borderRadius="full" px="8px" py="2px">
                                        <Text fontSize="11px" color="#C53030" fontWeight="700">✗ {t('chefDachaPrefs.cannotGo')}</Text>
                                    </Box>
                                )}
                            </Box>
                            <Box display="flex" gap="8px">
                                <Box flex="1" display="flex" alignItems="center" justifyContent="center"
                                    gap="5px" py="9px" borderRadius="10px" cursor="pointer"
                                    bgColor={status === 'can' ? '#22C55E' : '#F0FFF4'}
                                    border={`1.5px solid ${status === 'can' ? '#22C55E' : '#C6F6D5'}`}
                                    onClick={() => toggle(district.id, status === 'can' ? 'neutral' : 'can')}>
                                    <FaCheck size={11} color={status === 'can' ? 'white' : '#276749'} />
                                    <Text fontWeight="700" fontSize="12px" color={status === 'can' ? 'white' : '#276749'}>
                                        {t('chefDachaPrefs.canGo')}
                                    </Text>
                                </Box>
                                <Box flex="1" display="flex" alignItems="center" justifyContent="center"
                                    gap="5px" py="9px" borderRadius="10px" cursor="pointer"
                                    bgColor={status === 'cannot' ? '#E53E3E' : '#FFF5F5'}
                                    border={`1.5px solid ${status === 'cannot' ? '#E53E3E' : '#FECDCA'}`}
                                    onClick={() => toggle(district.id, status === 'cannot' ? 'neutral' : 'cannot')}>
                                    <FaTimes size={11} color={status === 'cannot' ? 'white' : '#C53030'} />
                                    <Text fontWeight="700" fontSize="12px" color={status === 'cannot' ? 'white' : '#C53030'}>
                                        {t('chefDachaPrefs.cannotGo')}
                                    </Text>
                                </Box>
                            </Box>
                        </Box>
                    );
                })}
            </Box>

            {/* Save */}
            <Box position="fixed" bottom="0" left="0" right="0"
                px={{ base: '14px', sm: '16px' }} py={{ base: '12px', sm: '14px' }}
                bgColor="white" borderTop="1px solid #F0F0F0" zIndex={10}>
                {saved && (
                    <Text textAlign="center" color="#22C55E" fontWeight="700" fontSize="14px" mb="8px">
                        ✓ {t('chefDachaPrefs.saved')}
                    </Text>
                )}
                <Button w="100%" bgColor="#C03F0C" color="white" fontWeight="bold"
                    style={{ height: 'clamp(46px,13vw,54px)', borderRadius: '18px', fontSize: 'clamp(14px,3.8vw,15px)' }}
                    _hover={{ bgColor: '#a0300a' }} isLoading={saving}
                    loadingText={t('chefDachaPrefs.saving')} onClick={handleSave}>
                    💾 {t('chefDachaPrefs.save')}
                </Button>
            </Box>
        </Box>
    );
};

export default ChefDachaPrefsPage;