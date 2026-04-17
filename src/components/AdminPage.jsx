import { Box, Text, Button } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShieldAlt, FaUsers, FaUtensils, FaMoneyBillWave, FaChartBar, FaEye, FaEyeSlash } from 'react-icons/fa';
import Store from '../store';

const API = import.meta.env.VITE_API_URL || '';
const ADMIN_PASS = 'admin1234';
const fmt = (n) => Number(n || 0).toLocaleString('uz-UZ') + " so'm";
const getBlocked = () => JSON.parse(localStorage.getItem('blockedUsers') || '{}');
export const isBlocked = (phone) => !!getBlocked()[phone];

const AdminPage = () => {
    const navigate = useNavigate();
    const [authed, setAuthed] = useState(() => sessionStorage.getItem('adminAuthed') === '1');
    const [pass, setPass] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [passErr, setPassErr] = useState('');

    const [stats, setStats] = useState({ chefs: 0, customers: 0, orders: 0, revenue: 0, commission: 0, blocked: 0 });
    const [loading, setLoading] = useState(false);

    const login = () => {
        if (pass === ADMIN_PASS) {
            sessionStorage.setItem('adminAuthed', '1');
            setAuthed(true);
        } else {
            setPassErr("Parol noto'g'ri");
        }
    };

    const loadStats = async () => {
        setLoading(true);
        let chefCount = Store.getChefs().length;
        let customerCount = 0;
        let orderCount = 0;
        let revenue = 0;
        let commission = 0;

        try {
            const r = await fetch(`${API}/chefs`);
            if (r.ok) {
                const d = await r.json();
                chefCount = (Array.isArray(d) ? d : (d.chefs || [])).length;
            }
        } catch { }

        try {
            const r = await fetch(`${API}/customers`);
            if (r.ok) {
                const d = await r.json();
                customerCount = (Array.isArray(d) ? d : (d.customers || [])).length;
            }
        } catch { }

        try {
            const r = await fetch(`${API}/orders/admin/orders`);
            if (r.ok) {
                const d = await r.json();
                const list = Array.isArray(d) ? d : (d.orders || []);
                orderCount = list.length;
                revenue = list.reduce((s, o) => s + Number(o.amount || 0), 0);
                commission = list.reduce((s, o) => s + Math.round(Number(o.amount || 0) * 0.1), 0);
            }
        } catch { }

        setStats({
            chefs: chefCount,
            customers: customerCount,
            orders: orderCount,
            revenue,
            commission,
            blocked: Object.keys(getBlocked()).length,
        });
        setLoading(false);
    };

    useEffect(() => {
        if (authed) {
            loadStats();
            const iv = setInterval(loadStats, 30000);
            return () => clearInterval(iv);
        }
    }, [authed]);

    if (!authed) return (
        <Box minH="100dvh" bgColor="#FFF5F0" display="flex" alignItems="center" justifyContent="center" px="16px">
            <Box bgColor="white" borderRadius="24px" p="32px" w="100%" maxW="360px"
                boxShadow="0 8px 32px rgba(0,0,0,0.1)">
                <Box display="flex" alignItems="center" gap="10px" mb="24px">
                    <FaShieldAlt style={{ fontSize: '28px', color: '#C03F0C' }} />
                    <Box>
                        <Text fontWeight="800" color="#1C110D" style={{ fontSize: '20px' }}>Admin Panel</Text>
                        <Text color="#9B8E8A" style={{ fontSize: '12px' }}>Faqat adminlar uchun</Text>
                    </Box>
                </Box>
                <Text color="#6B6560" mb="6px" fontWeight="600" style={{ fontSize: '13px' }}>Parol</Text>
                <Box position="relative" mb="14px">
                    <input
                        type={showPass ? 'text' : 'password'}
                        value={pass}
                        onChange={e => { setPass(e.target.value); setPassErr(''); }}
                        onKeyDown={e => e.key === 'Enter' && login()}
                        placeholder="Admin paroli"
                        style={{
                            width: '100%', border: '1.5px solid #F0E6E0', borderRadius: '12px',
                            padding: '12px 44px 12px 14px', fontSize: '15px', outline: 'none',
                            background: '#FFF5F0', color: '#1C110D', boxSizing: 'border-box',
                        }}
                    />
                    <Box position="absolute" right="12px" top="50%" transform="translateY(-50%)"
                        cursor="pointer" onClick={() => setShowPass(v => !v)}>
                        {showPass ? <FaEyeSlash color="#9B8E8A" /> : <FaEye color="#9B8E8A" />}
                    </Box>
                </Box>
                {passErr && <Text color="#E53E3E" mb="10px" style={{ fontSize: '13px' }}>⚠ {passErr}</Text>}
                <Button w="100%" h="48px" bgColor="#C03F0C" color="white" borderRadius="14px"
                    fontWeight="700" _hover={{ bgColor: '#a0300a' }} onClick={login}>
                    Kirish
                </Button>
            </Box>
        </Box>
    );

    const NAV_ITEMS = [
        {
            icon: '👨‍🍳', label: 'Oshpazlar', count: stats.chefs, sub: 'Boshqarish, bloklash',
            color: '#C03F0C', bg: '#FFF0EC', border: '#F5C5B0', route: '/admin/chefs',
        },
        {
            icon: '👤', label: 'Mijozlar', count: stats.customers, sub: 'Ko\'rish, bloklash',
            color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE', route: '/admin/customers',
        },
        {
            icon: '📋', label: 'Buyurtmalar', count: stats.orders, sub: 'Kim kimga buyurtma berdi',
            color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', route: '/admin/orders',
        },
        {
            icon: '💰', label: 'Komissiya', count: fmt(stats.commission), sub: 'Daromad va hisob-kitob',
            color: '#22C55E', bg: '#F0FFF4', border: '#BBF7D0', route: '/admin/revenue',
        },
    ];

    return (
        <Box minH="100dvh" bgColor="#FFF5F0">
            {/* Header */}
            <Box bgColor="white" px="16px" py="14px" boxShadow="0 1px 0 #EBEBEB"
                display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap="10px">
                    <Text style={{ fontSize: '22px' }}>🍽️</Text>
                    <Box>
                        <Text fontWeight="800" color="#1C110D" style={{ fontSize: '20px' }}>Admin Panel</Text>
                        <Text color="#9B8E8A" style={{ fontSize: '11px' }}>DachaChef boshqaruv markazi</Text>
                    </Box>
                </Box>
                <Box cursor="pointer" bgColor="#FEF2F2" borderRadius="10px" px="10px" py="6px"
                    border="1.5px solid #FCA5A5"
                    onClick={() => { sessionStorage.removeItem('adminAuthed'); setAuthed(false); }}>
                    <Text color="#EF4444" fontWeight="700" style={{ fontSize: '12px' }}>Chiqish</Text>
                </Box>
            </Box>

            <Box px="16px" pt="16px" pb="24px">
                {/* Statistika kartalar */}
                <Text fontWeight="800" color="#1C110D" mb="12px" style={{ fontSize: '16px' }}>📊 Statistika</Text>
                <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap="10px" mb="24px">
                    {[
                        { label: 'Oshpazlar', value: stats.chefs, color: '#C03F0C', icon: '👨‍🍳' },
                        { label: 'Mijozlar', value: stats.customers, color: '#3B82F6', icon: '👤' },
                        { label: 'Buyurtmalar', value: stats.orders, color: '#7C3AED', icon: '📋' },
                        { label: 'Jami aylanma', value: fmt(stats.revenue), color: '#22C55E', icon: '💵' },
                        { label: 'Bizga komissiya', value: fmt(stats.commission), color: '#C03F0C', icon: '💰' },
                        { label: 'Bloklangan', value: stats.blocked, color: '#EF4444', icon: '🚫' },
                    ].map((s, i) => (
                        <Box key={i} bgColor="white" borderRadius="16px" p="14px"
                            boxShadow="0 2px 8px rgba(0,0,0,0.06)"
                            display="flex" alignItems="center" gap="10px">
                            <Text style={{ fontSize: '22px' }}>{s.icon}</Text>
                            <Box>
                                <Text color="#9B614B" style={{ fontSize: '11px' }}>{s.label}</Text>
                                <Text fontWeight="800" style={{ fontSize: '16px', color: s.color }}>{s.value}</Text>
                            </Box>
                        </Box>
                    ))}
                </Box>

                {/* Navigatsiya */}
                <Text fontWeight="800" color="#1C110D" mb="12px" style={{ fontSize: '16px' }}>🗂 Boshqaruv bo'limlari</Text>
                <Box display="flex" flexDir="column" gap="10px">
                    {NAV_ITEMS.map((item, i) => (
                        <Box key={i} bgColor="white" borderRadius="18px" p="16px"
                            boxShadow="0 2px 10px rgba(0,0,0,0.06)"
                            border={`1.5px solid ${item.border}`}
                            cursor="pointer"
                            _hover={{ boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
                            transition="box-shadow 0.2s"
                            onClick={() => navigate(item.route)}
                            display="flex" alignItems="center" gap="14px">
                            <Box w="50px" h="50px" borderRadius="14px" bgColor={item.bg} flexShrink={0}
                                display="flex" alignItems="center" justifyContent="center"
                                style={{ fontSize: '22px' }}>
                                {item.icon}
                            </Box>
                            <Box flex="1" minW={0}>
                                <Text fontWeight="800" color="#1C110D" style={{ fontSize: '16px' }}>{item.label}</Text>
                                <Text color="#9B8E8A" style={{ fontSize: '12px' }}>{item.sub}</Text>
                            </Box>
                            <Box bgColor={item.bg} borderRadius="12px" px="10px" py="4px" flexShrink={0}>
                                <Text fontWeight="800" style={{ fontSize: '14px', color: item.color }}>{item.count}</Text>
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Box>
        </Box>
    );
};
export default AdminPage;