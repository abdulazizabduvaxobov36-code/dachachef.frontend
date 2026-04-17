import { Box, Text } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSync } from 'react-icons/fa';

const API = import.meta.env.VITE_API_URL || '';
const fmt = (n) => Number(n || 0).toLocaleString('uz-UZ') + " so'm";

const AdminRevenuePage = () => {
    const navigate = useNavigate();
    const [commissionData, setCommissionData] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (sessionStorage.getItem('adminAuthed') !== '1') { navigate('/admin'); return; }
        loadData();
        const iv = setInterval(loadData, 15000);
        return () => clearInterval(iv);
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const r = await fetch(`${API}/orders/admin/commissions`);
            if (r.ok) setCommissionData(await r.json());
        } catch { }
        try {
            const r = await fetch(`${API}/orders/admin/orders`);
            if (r.ok) {
                const d = await r.json();
                setOrders(Array.isArray(d) ? d : (d.orders || []));
            }
        } catch { }
        setLoading(false);
    };

    const totalRevenue = orders.reduce((s, o) => s + Number(o.amount || 0), 0);
    const totalCommission = orders.reduce((s, o) => s + Math.round(Number(o.amount || 0) * 0.1), 0);

    return (
        <Box minH="100dvh" bgColor="#FFF5F0">
            <Box bgColor="white" px="16px" py="14px" boxShadow="0 1px 0 #EBEBEB"
                display="flex" alignItems="center" gap="12px">
                <Box cursor="pointer" w="36px" h="36px" borderRadius="full" bgColor="#F5F3F1"
                    display="flex" alignItems="center" justifyContent="center"
                    onClick={() => navigate('/admin')}>
                    <FaArrowLeft style={{ fontSize: '14px', color: '#1C110D' }} />
                </Box>
                <Box flex="1">
                    <Text fontWeight="800" color="#1C110D" style={{ fontSize: '18px' }}>💰 Komissiya & Daromad</Text>
                    <Text color="#9B8E8A" style={{ fontSize: '12px' }}>Barcha oshpazlar bo'yicha</Text>
                </Box>
                <Box cursor="pointer" onClick={loadData} bgColor="#FFF0EC" borderRadius="10px"
                    px="10px" py="6px" display="flex" alignItems="center" gap="6px"
                    border="1.5px solid #F5C5B0">
                    <FaSync style={{ color: '#C03F0C', fontSize: '11px' }} />
                    <Text color="#C03F0C" fontWeight="600" style={{ fontSize: '12px' }}>Yangilash</Text>
                </Box>
            </Box>

            {loading && <Box textAlign="center" py="20px"><Text color="#9B8E8A" style={{ fontSize: '13px' }}>Yuklanmoqda...</Text></Box>}

            <Box px="16px" pt="12px" pb="24px" display="flex" flexDir="column" gap="12px">
                {commissionData ? (
                    <>
                        {/* Grand total */}
                        <Box bgColor="#C03F0C" borderRadius="16px" px="20px" py="16px"
                            display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                                <Text color="rgba(255,255,255,0.85)" style={{ fontSize: '13px' }}>Jami komissiya (barcha oshpazlar)</Text>
                                <Text color="white" fontWeight="800" style={{ fontSize: '26px' }}>{fmt(commissionData.grandTotalCommission)}</Text>
                            </Box>
                            <Box textAlign="right">
                                <Text color="rgba(255,255,255,0.75)" style={{ fontSize: '12px' }}>Komissiya foizi</Text>
                                <Text color="white" fontWeight="800" style={{ fontSize: '22px' }}>{commissionData.commissionRate}</Text>
                            </Box>
                        </Box>

                        {/* Summary grid */}
                        <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap="10px">
                            {[
                                { label: 'Jami oshpazlar', value: commissionData.chefs?.length || 0, color: '#1C110D' },
                                { label: 'Jami buyurtmalar', value: commissionData.chefs?.reduce((s, c) => s + c.ordersCount, 0) || 0, color: '#1C110D' },
                                { label: 'Jami aylanma', value: fmt(commissionData.chefs?.reduce((s, c) => s + c.totalEarned, 0) || 0), color: '#22C55E' },
                                { label: 'Bizga tushadi', value: fmt(commissionData.grandTotalCommission), color: '#C03F0C' },
                            ].map((s, i) => (
                                <Box key={i} bgColor="white" borderRadius="14px" p="14px"
                                    boxShadow="0 2px 8px rgba(0,0,0,0.06)">
                                    <Text color="#9B614B" style={{ fontSize: '11px', marginBottom: '5px' }}>{s.label}</Text>
                                    <Text fontWeight="800" style={{ fontSize: '18px', color: s.color }}>{s.value}</Text>
                                </Box>
                            ))}
                        </Box>

                        {/* Per-chef breakdown */}
                        <Text fontWeight="800" color="#1C110D" style={{ fontSize: '15px', marginTop: '4px' }}>
                            Oshpazlar bo'yicha hisob
                        </Text>
                        {(!commissionData.chefs || commissionData.chefs.length === 0) ? (
                            <Box bgColor="white" borderRadius="16px" p="24px" textAlign="center">
                                <Text color="#B0A8A4">Hali bajarilgan buyurtma yo'q</Text>
                            </Box>
                        ) : commissionData.chefs.map((c, i) => (
                            <Box key={i} bgColor="white" borderRadius="16px" p="16px"
                                boxShadow="0 2px 10px rgba(0,0,0,0.06)">
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb="12px">
                                    <Box>
                                        <Text fontWeight="700" color="#1C110D" style={{ fontSize: '15px' }}>{c.chefName || "Noma'lum"}</Text>
                                        <Text color="#9B614B" style={{ fontSize: '12px' }}>📞 +998{c.chefPhone}</Text>
                                    </Box>
                                    <Box textAlign="right">
                                        <Text fontWeight="800" color="#C03F0C" style={{ fontSize: '20px' }}>{fmt(c.totalCommission)}</Text>
                                        <Text color="#9B614B" style={{ fontSize: '11px' }}>qarzdor</Text>
                                    </Box>
                                </Box>
                                <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap="8px">
                                    {[
                                        { label: 'Buyurtmalar', value: c.ordersCount, color: '#1C110D' },
                                        { label: 'Jami tushum', value: fmt(c.totalEarned), color: '#1C110D' },
                                        { label: 'Komissiya (bizga)', value: fmt(c.totalCommission), color: '#C03F0C' },
                                        { label: 'Oshpazga qoladi', value: fmt(c.totalNet), color: '#22C55E' },
                                    ].map((s, j) => (
                                        <Box key={j} bgColor="#FFF5F0" borderRadius="10px" p="10px">
                                            <Text color="#9B614B" style={{ fontSize: '10px', marginBottom: '3px' }}>{s.label}</Text>
                                            <Text fontWeight="700" style={{ fontSize: '13px', color: s.color }}>{s.value}</Text>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        ))}
                    </>
                ) : (
                    // Fallback: local hisoblash
                    <>
                        <Box bgColor="#C03F0C" borderRadius="16px" px="20px" py="16px">
                            <Text color="rgba(255,255,255,0.85)" style={{ fontSize: '13px' }}>Jami komissiya (10%)</Text>
                            <Text color="white" fontWeight="800" style={{ fontSize: '26px' }}>{fmt(totalCommission)}</Text>
                        </Box>
                        <Box bgColor="white" borderRadius="16px" p="14px">
                            <Text color="#9B614B" style={{ fontSize: '12px', marginBottom: '5px' }}>Jami aylanma</Text>
                            <Text fontWeight="800" color="#22C55E" style={{ fontSize: '20px' }}>{fmt(totalRevenue)}</Text>
                        </Box>
                        {!loading && (
                            <Box bgColor="white" borderRadius="16px" p="24px" textAlign="center">
                                <Text color="#B0A8A4" style={{ fontSize: '13px' }}>Backend ishlamayapti — to'liq ma'lumot yuklanmadi</Text>
                            </Box>
                        )}
                    </>
                )}
            </Box>
        </Box>
    );
};
export default AdminRevenuePage;