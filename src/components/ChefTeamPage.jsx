import { Box, Button, Text } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaUsers, FaMinus, FaPlus } from 'react-icons/fa';
import Store from '../store';

const ChefTeamPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const stored = (() => {
        const s = JSON.parse(localStorage.getItem('chefProfile') || 'null');
        if (s?.phone) return s;
        const sess = Store.getSession();
        if (sess?.role === 'chef' && sess?.data?.phone) return sess.data;
        return {};
    })();
    const chefPhone = stored.phone || '';

    const ROLES = [
        { key: 'ovqat', emoji: '👨‍🍳', label: t('chefTeam.role_ovqat') },
        { key: 'idish', emoji: '🍽', label: t('chefTeam.role_idish') },
        { key: 'podacha', emoji: '🍱', label: t('chefTeam.role_podacha') },
        { key: 'boshqa', emoji: '⚙️', label: t('chefTeam.role_boshqa') },
    ];

    const [counts, setCounts] = useState({ ovqat: 0, idish: 0, podacha: 0, boshqa: 0 });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const team = Store.getChefTeam(chefPhone);
        if (Array.isArray(team) && team.length > 0 && team[0]?.role) {
            const c = { ovqat: 0, idish: 0, podacha: 0, boshqa: 0 };
            team.forEach(m => {
                if (m.role === 'ovqat_qiladi') c.ovqat++;
                else if (m.role === 'idish_yuvadi') c.idish++;
                else if (m.role === 'podacha') c.podacha++;
                else c.boshqa++;
            });
            setCounts(c);
        } else if (team && !Array.isArray(team) && typeof team === 'object') {
            setCounts({ ovqat: team.ovqat || 0, idish: team.idish || 0, podacha: team.podacha || 0, boshqa: team.boshqa || 0 });
        }
    }, [chefPhone]);

    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    const change = (key, delta) => {
        setSaved(false);
        setCounts(prev => ({ ...prev, [key]: Math.max(0, (prev[key] || 0) + delta) }));
    };

    const handleSave = () => {
        setSaving(true);
        Store.setChefTeam(chefPhone, counts);
        setTimeout(() => {
            setSaving(false);
            setSaved(true);
            setTimeout(() => navigate(fromProfile ? '/chef-profile' : '/chef-home'), 600);
        }, 400);
    };

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
                <Text fontWeight="bold" color="#1C110D" style={{ fontSize: 'clamp(15px,4.2vw,18px)' }}>
                    {t('chefTeam.title')}
                </Text>
            </Box>

            <Box pb="120px" px={{ base: '14px', sm: '16px' }}>
                {/* Info */}
                <Box mt="16px" bgColor="white" borderRadius="18px" p="16px"
                    boxShadow="0 2px 8px rgba(0,0,0,0.06)" border="1px solid #FFF0EC">
                    <Box display="flex" alignItems="center" gap="10px" mb="8px">
                        <FaUsers color="#C03F0C" size={18} />
                        <Text fontWeight="700" color="#1C110D" fontSize="15px">{t('chefTeam.title')}</Text>
                    </Box>
                    <Text color="#9B614B" fontSize="13px" lineHeight="1.7">{t('chefTeam.info')}</Text>
                    {total > 0 && (
                        <Box mt="12px" bgColor="#FFF5F0" borderRadius="12px" px="14px" py="10px"
                            display="flex" alignItems="center" gap="10px">
                            <Text fontSize="28px" fontWeight="800" color="#C03F0C">{total}</Text>
                            <Text fontSize="14px" color="#1C110D" fontWeight="600">{t('chefTeam.total')}</Text>
                        </Box>
                    )}
                </Box>

                {/* Har bir vazifa */}
                {ROLES.map(role => (
                    <Box key={role.key} mt="12px" bgColor="white" borderRadius="18px" p="16px"
                        boxShadow="0 2px 8px rgba(0,0,0,0.05)"
                        border={counts[role.key] > 0 ? '1.5px solid #C03F0C' : '1px solid #F0EBE6'}>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box display="flex" alignItems="center" gap="10px" flex="1">
                                <Text fontSize="24px">{role.emoji}</Text>
                                <Text fontWeight="600" color="#1C110D" fontSize="14px" lineHeight="1.4">{role.label}</Text>
                            </Box>
                            <Box display="flex" alignItems="center">
                                <Box w="36px" h="36px" borderRadius="10px 0 0 10px"
                                    bgColor={counts[role.key] > 0 ? '#FFF0EC' : '#F7F7F7'}
                                    border="1.5px solid #E8D5CC"
                                    display="flex" alignItems="center" justifyContent="center"
                                    cursor="pointer" onClick={() => change(role.key, -1)}>
                                    <FaMinus size={11} color={counts[role.key] > 0 ? '#C03F0C' : '#C8B8B0'} />
                                </Box>
                                <Box w="44px" h="36px"
                                    bgColor={counts[role.key] > 0 ? '#C03F0C' : '#F7F7F7'}
                                    border="1.5px solid #E8D5CC" borderLeft="none" borderRight="none"
                                    display="flex" alignItems="center" justifyContent="center">
                                    <Text fontWeight="800" fontSize="16px" color={counts[role.key] > 0 ? 'white' : '#9B8E8A'}>
                                        {counts[role.key]}
                                    </Text>
                                </Box>
                                <Box w="36px" h="36px" borderRadius="0 10px 10px 0"
                                    bgColor="#FFF0EC" border="1.5px solid #E8D5CC"
                                    display="flex" alignItems="center" justifyContent="center"
                                    cursor="pointer" onClick={() => change(role.key, +1)}>
                                    <FaPlus size={11} color="#C03F0C" />
                                </Box>
                            </Box>
                        </Box>
                        {counts[role.key] > 0 && (
                            <Box mt="10px" bgColor="#FFF5F0" borderRadius="10px" px="12px" py="7px">
                                <Text fontSize="13px" color="#C03F0C" fontWeight="600">
                                    {counts[role.key]} ta — {role.label.toLowerCase()}
                                </Text>
                            </Box>
                        )}
                    </Box>
                ))}

                {/* Xulosa */}
                {total > 0 && (
                    <Box mt="14px" bgColor="white" borderRadius="18px" p="16px"
                        boxShadow="0 2px 8px rgba(0,0,0,0.06)" border="1px solid #F0EBE6">
                        <Text fontWeight="700" color="#1C110D" fontSize="14px" mb="10px">
                            📋 {t('chefTeam.summary')}
                        </Text>
                        {ROLES.filter(r => counts[r.key] > 0).map(r => (
                            <Box key={r.key} display="flex" alignItems="center" gap="8px" mb="6px">
                                <Text fontSize="16px">{r.emoji}</Text>
                                <Text fontSize="13px" color="#1C110D">
                                    {r.label} —{' '}
                                    <Text as="span" fontWeight="700" color="#C03F0C">{counts[r.key]} ta</Text>
                                </Text>
                            </Box>
                        ))}
                        <Box mt="10px" pt="10px" borderTop="1px solid #F0EBE6"
                            display="flex" justifyContent="space-between" alignItems="center">
                            <Text fontSize="13px" color="#9B614B">{t('chefTeam.grandTotal')}</Text>
                            <Text fontSize="16px" fontWeight="800" color="#C03F0C">{total + 1} ta</Text>
                        </Box>
                    </Box>
                )}
            </Box>

            {/* Save */}
            <Box position="fixed" bottom="0" left="0" right="0"
                px={{ base: '14px', sm: '16px' }} py={{ base: '12px', sm: '14px' }}
                bgColor="white" borderTop="1px solid #F0F0F0" zIndex={10}>
                {saved && (
                    <Text textAlign="center" color="#22C55E" fontWeight="700" fontSize="14px" mb="8px">
                        ✓ {t('chefTeam.saved')}
                    </Text>
                )}
                <Button w="100%" bgColor="#C03F0C" color="white" fontWeight="bold"
                    style={{ height: 'clamp(46px,13vw,54px)', borderRadius: '18px', fontSize: 'clamp(14px,3.8vw,15px)' }}
                    _hover={{ bgColor: '#a0300a' }} isLoading={saving}
                    loadingText={t('chefTeam.saving')} onClick={handleSave}>
                    💾 {t('chefTeam.save')}
                </Button>
            </Box>
        </Box>
    );
};

export default ChefTeamPage;