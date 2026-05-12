import { Box, Button, Text } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCheck, FaTimes, FaMapMarkerAlt } from 'react-icons/fa';
import Store from '../store';

const ChefDachaPrefsPage = () => {
    const navigate = useNavigate();
    const stored = (() => {
        const s = JSON.parse(localStorage.getItem('chefProfile') || 'null');
        if (s?.phone) return s;
        const sess = Store.getSession();
        if (sess?.role === 'chef' && sess?.data?.phone) return sess.data;
        return {};
    })();
    const chefPhone = stored.phone || '';

    const [dachas, setDachas] = useState([]);
    const [prefs, setPrefs] = useState({ canGo: [], cannotGo: [] });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setDachas(Store.getDachas());
        setPrefs(Store.getChefDachaPrefs(chefPhone));
        const handler = () => setDachas(Store.getDachas());
        window.addEventListener('dachas-updated', handler);
        return () => window.removeEventListener('dachas-updated', handler);
    }, [chefPhone]);

    const getStatus = (dachaId) => {
        if (prefs.canGo.includes(dachaId)) return 'can';
        if (prefs.cannotGo.includes(dachaId)) return 'cannot';
        return 'neutral';
    };

    const toggle = (dachaId, newStatus) => {
        setSaved(false);
        setPrefs(prev => {
            const canGo = prev.canGo.filter(id => id !== dachaId);
            const cannotGo = prev.cannotGo.filter(id => id !== dachaId);
            if (newStatus === 'can') canGo.push(dachaId);
            if (newStatus === 'cannot') cannotGo.push(dachaId);
            return { canGo, cannotGo };
        });
    };

    const handleSave = () => {
        setSaving(true);
        Store.setChefDachaPrefs(chefPhone, prefs);
        setTimeout(() => { setSaving(false); setSaved(true); }, 400);
    };

    const canCount = prefs.canGo.length;
    const cannotCount = prefs.cannotGo.length;

    return (
        <Box minH="100dvh" bgColor="#FFF5F0">
            {/* Header */}
            <Box bgColor="white" px={{ base: "14px", sm: "18px" }} py={{ base: "12px", sm: "14px" }}
                display="flex" alignItems="center" gap="12px" boxShadow="0 1px 0 #F0EBE6">
                <Box bgColor="#FFF0EC" borderRadius="full" display="flex" alignItems="center"
                    justifyContent="center" cursor="pointer" onClick={() => navigate(-1)}
                    style={{ width: "clamp(32px, 9vw, 38px)", height: "clamp(32px, 9vw, 38px)" }}>
                    <FaArrowLeft style={{ fontSize: "clamp(12px, 3vw, 14px)", color: "#1C110D" }} />
                </Box>
                <Box>
                    <Text fontWeight="bold" color="#1C110D" style={{ fontSize: "clamp(15px, 4.2vw, 18px)" }}>
                        Dacha imkoniyatlari
                    </Text>
                    <Text color="#9B614B" fontSize="12px">
                        Qaysi dachaga bora olasiz?
                    </Text>
                </Box>
            </Box>

            <Box pb="120px" px={{ base: "14px", sm: "16px" }}>
                {/* Info */}
                <Box mt="16px" bgColor="white" borderRadius="18px" p="16px"
                    boxShadow="0 2px 8px rgba(0,0,0,0.06)" border="1px solid #FFF0EC">
                    <Text color="#9B614B" fontSize="13px" lineHeight="1.6">
                        Har bir dacha uchun belgilang — bora olasizmi yoki yo'qmi. Mijoz zakaz berishdan oldin buni ko'radi.
                    </Text>
                    {(canCount > 0 || cannotCount > 0) && (
                        <Box mt="10px" display="flex" gap="10px">
                            {canCount > 0 && (
                                <Box bgColor="#F0FFF4" borderRadius="10px" px="12px" py="6px" border="1px solid #C6F6D5">
                                    <Text fontSize="13px" color="#276749" fontWeight="700">✓ {canCount} ta — boraman</Text>
                                </Box>
                            )}
                            {cannotCount > 0 && (
                                <Box bgColor="#FFF5F5" borderRadius="10px" px="12px" py="6px" border="1px solid #FECDCA">
                                    <Text fontSize="13px" color="#C53030" fontWeight="700">✗ {cannotCount} ta — bormayman</Text>
                                </Box>
                            )}
                        </Box>
                    )}
                </Box>

                {/* Dacha list */}
                {dachas.length === 0 ? (
                    <Box mt="40px" textAlign="center">
                        <FaMapMarkerAlt size={40} color="#E8D5CC" style={{ margin: '0 auto 12px' }} />
                        <Text color="#9B8E8A" fontSize="14px" fontWeight="600">Hali dacha qo'shilmagan</Text>
                        <Text color="#9B8E8A" fontSize="13px" mt="6px">Admin dachalarni qo'shgach, bu yerda ko'rinadi</Text>
                    </Box>
                ) : (
                    dachas.map(dacha => {
                        const status = getStatus(dacha.id);
                        return (
                            <Box key={dacha.id} mt="12px" bgColor="white" borderRadius="18px" p="16px"
                                boxShadow="0 2px 8px rgba(0,0,0,0.06)"
                                border={status === 'can' ? "1.5px solid #22C55E" : status === 'cannot' ? "1.5px solid #E53E3E" : "1px solid #F0EBE6"}>
                                <Box display="flex" alignItems="flex-start" gap="10px" mb="12px">
                                    <FaMapMarkerAlt color="#C03F0C" size={15} style={{ marginTop: "2px", flexShrink: 0 }} />
                                    <Box flex="1">
                                        <Text fontWeight="700" color="#1C110D" fontSize="15px">{dacha.name}</Text>
                                        {dacha.district && (
                                            <Text fontSize="12px" color="#9B614B">{dacha.district}</Text>
                                        )}
                                        {dacha.description && (
                                            <Text fontSize="12px" color="#9B8E8A" mt="4px">{dacha.description}</Text>
                                        )}
                                        {dacha.capacity && (
                                            <Text fontSize="12px" color="#9B8E8A">👥 {dacha.capacity} kishigacha</Text>
                                        )}
                                    </Box>
                                </Box>

                                {/* Toggle buttons */}
                                <Box display="flex" gap="8px">
                                    <Box flex="1" display="flex" alignItems="center" justifyContent="center"
                                        gap="6px" py="10px" borderRadius="12px" cursor="pointer"
                                        bgColor={status === 'can' ? "#22C55E" : "#F0FFF4"}
                                        border={`1.5px solid ${status === 'can' ? "#22C55E" : "#C6F6D5"}`}
                                        onClick={() => toggle(dacha.id, status === 'can' ? 'neutral' : 'can')}>
                                        <FaCheck size={13} color={status === 'can' ? "white" : "#276749"} />
                                        <Text fontWeight="700" fontSize="13px" color={status === 'can' ? "white" : "#276749"}>
                                            Boraman
                                        </Text>
                                    </Box>
                                    <Box flex="1" display="flex" alignItems="center" justifyContent="center"
                                        gap="6px" py="10px" borderRadius="12px" cursor="pointer"
                                        bgColor={status === 'cannot' ? "#E53E3E" : "#FFF5F5"}
                                        border={`1.5px solid ${status === 'cannot' ? "#E53E3E" : "#FECDCA"}`}
                                        onClick={() => toggle(dacha.id, status === 'cannot' ? 'neutral' : 'cannot')}>
                                        <FaTimes size={13} color={status === 'cannot' ? "white" : "#C53030"} />
                                        <Text fontWeight="700" fontSize="13px" color={status === 'cannot' ? "white" : "#C53030"}>
                                            Bormayman
                                        </Text>
                                    </Box>
                                </Box>
                            </Box>
                        );
                    })
                )}
            </Box>

            {/* Bottom save */}
            <Box className="fixed-bottom" px={{ base: "14px", sm: "16px" }} py={{ base: "12px", sm: "14px" }}
                bgColor="white" borderTop="1px solid #F0F0F0" zIndex={10}>
                {saved && (
                    <Text textAlign="center" color="#22C55E" fontWeight="700" fontSize="14px" mb="8px">
                        ✓ Sozlamalar saqlandi!
                    </Text>
                )}
                <Button w="100%" bgColor="#C03F0C" color="white" fontWeight="bold"
                    style={{ height: "clamp(46px, 13vw, 54px)", borderRadius: "18px", fontSize: "clamp(14px, 3.8vw, 15px)" }}
                    _hover={{ bgColor: "#a0300a" }} isLoading={saving}
                    loadingText="Saqlanmoqda..." onClick={handleSave}>
                    💾 Saqlash
                </Button>
            </Box>
        </Box>
    );
};

export default ChefDachaPrefsPage;