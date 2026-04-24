import { Box, Button, Text } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShieldAlt, FaUsers, FaUtensils, FaMoneyBillWave, FaTelegram } from 'react-icons/fa';
import Store from '../store';

const API = import.meta.env.VITE_API_URL || '';
const fmt = (n) => Number(n || 0).toLocaleString('uz-UZ') + " so'm";
const getBlocked = () => JSON.parse(localStorage.getItem('blockedUsers') || '{}');
export const isBlocked = (phone) => !!getBlocked()[phone];

const AdminPage = () => {
    const navigate = useNavigate();
    const [authed, setAuthed] = useState(() => sessionStorage.getItem('adminAuthed') === '1');
    const [step, setStep] = useState(1);
    const [code, setCode] = useState('');
    const [sending, setSending] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [err, setErr] = useState('');
    const [resendTimer, setResendTimer] = useState(0);

    const [stats, setStats] = useState({ chefs: 0, customers: 0, orders: 0, revenue: 0, commission: 0, blocked: 0 });
    const [loading, setLoading] = useState(false);

    const startTimer = () => {
        setResendTimer(60);
        const iv = setInterval(() => {
            setResendTimer(prev => {
                if (prev <= 1) { clearInterval(iv); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    const sendCode = async () => {
        setSending(true);
        setErr('');
        try {
            const res = await fetch(`${API}/auth/admin-send-otp`, { method: 'POST' });
            const data = await res.json();
            if (!res.ok) { setErr(data.message || 'Xatolik'); setSending(false); return; }
            if (data.devCode) setCode(String(data.devCode));
            setStep(2);
            startTimer();
        } catch {
            setErr('Server bilan aloqa yo\'q');
        }
        setSending(false);
    };

    const verify = async () => {
        if (code.length !== 6) { setErr('6 xonali kod kiriting'); return; }
        setVerifying(true);
        setErr('');
        try {
            const res = await fetch(`${API}/auth/admin-verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) { setErr(data.message || 'Kod noto\'g\'ri'); setVerifying(false); return; }
            sessionStorage.setItem('adminAuthed', '1');
            setAuthed(true);
        } catch {
            setErr('Server bilan aloqa yo\'q');
        }
        setVerifying(false);
    };

    const loadStats = async () => {
        setLoading(true);
        let chefCount = Store.getChefs().length;
        let customerCount = 0, orderCount = 0, revenue = 0, commission = 0;
        try { const r = await fetch(`${API}/chefs`); if (r.ok) { const d = await r.json(); chefCount = (Array.isArray(d) ? d : (d.chefs || [])).length; } } catch { }
        try { const r = await fetch(`${API}/customers`); if (r.ok) { const d = await r.json(); customerCount = (Array.isArray(d) ? d : (d.customers || [])).length; } } catch { }
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
        setStats({ chefs: chefCount, customers: customerCount, orders: orderCount, revenue, commission, blocked: Object.keys(getBlocked()).length });
        setLoading(false);
    };

    useEffect(() => {
        if (authed) { loadStats(); const iv = setInterval(loadStats, 30000); return () => clearInterval(iv); }
    }, [authed]);

    // Login sahifasi
    if (!authed) return (
        <Box minH="100dvh" bgColor="#0F172A" display="flex" alignItems="center" justifyContent="center" px="16px">
            <Box bgColor="#1E293B" borderRadius="24px" p="32px" w="100%" maxW="360px"
                boxShadow="0 8px 32px rgba(0,0,0,0.4)" border="1px solid #334155">
                <Box display="flex" alignItems="center" gap="10px" mb="24px">
                    <FaShieldAlt style={{ fontSize: '28px', color: '#C03F0C' }} />
                    <Box>
                        <Text fontWeight="800" color="white" style={{ fontSize: '20px' }}>Admin Panel</Text>
                        <Text color="#94A3B8" style={{ fontSize: '12px' }}>Faqat adminlar uchun</Text>
                    </Box>
                </Box>

                {step === 1 ? (
                    <>
                        <Box bgColor="#0F172A" borderRadius="14px" p="14px" mb="20px"
                            border="1px solid #334155" display="flex" alignItems="flex-start" gap="10px">
                            <FaTelegram style={{ fontSize: '20px', color: '#2563EB', flexShrink: 0, marginTop: '2px' }} />
                            <Text color="#94A3B8" style={{ fontSize: '13px' }}>
                                Telegram botga 6 xonali tasdiqlash kodi yuboriladi
                            </Text>
                        </Box>
                        {err && <Text color="#EF4444" mb="12px" style={{ fontSize: '13px' }}>⚠ {err}</Text>}
                        <Button w="100%" h="48px" bgColor="#C03F0C" color="white" borderRadius="14px"
                            fontWeight="700" _hover={{ bgColor: '#a0300a' }}
                            isLoading={sending} loadingText="Yuborilmoqda..."
                            onClick={sendCode}>
                            Kod olish
                        </Button>
                    </>
                ) : (
                    <>
                        <Box bgColor="#0F172A" borderRadius="14px" p="12px" mb="16px"
                            border="1px solid #2563EB" display="flex" alignItems="center" gap="10px">
                            <FaTelegram style={{ fontSize: '20px', color: '#2563EB' }} />
                            <Text color="#94A3B8" style={{ fontSize: '13px' }}>
                                Telegram botga 6 xonali kod yuborildi
                            </Text>
                        </Box>
                        <Text color="#94A3B8" mb="6px" fontWeight="600" style={{ fontSize: '13px' }}>Kodni kiriting</Text>
                        <input
                            value={code}
                            onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setErr(''); }}
                            onKeyDown={e => e.key === 'Enter' && verify()}
                            placeholder="6 xonali kod"
                            style={{
                                width: '100%', border: '1.5px solid #334155', borderRadius: '12px',
                                padding: '12px 14px', fontSize: '20px', outline: 'none', letterSpacing: '6px',
                                background: '#0F172A', color: 'white', boxSizing: 'border-box',
                                textAlign: 'center', marginBottom: '12px',
                            }}
                        />
                        {err && <Text color="#EF4444" mb="10px" style={{ fontSize: '13px' }}>⚠ {err}</Text>}
                        <Button w="100%" h="48px" bgColor="#C03F0C" color="white" borderRadius="14px"
                            fontWeight="700" _hover={{ bgColor: '#a0300a' }} mb="10px"
                            isLoading={verifying} loadingText="Tekshirilmoqda..."
                            onClick={verify}>
                            Kirish
                        </Button>
                        <Box textAlign="center">
                            {resendTimer > 0
                                ? <Text color="#64748B" style={{ fontSize: '13px' }}>Qayta yuborish: {resendTimer}s</Text>
                                : <Text color="#C03F0C" fontWeight="600" style={{ fontSize: '13px', cursor: 'pointer' }}
                                    onClick={() => { setCode(''); setErr(''); sendCode(); }}>
                                    Kodni qayta yuborish
                                </Text>
                            }
                        </Box>
                        <Box mt="10px" textAlign="center">
                            <Text color="#64748B" style={{ fontSize: '12px', cursor: 'pointer' }}
                                onClick={() => { setStep(1); setCode(''); setErr(''); }}>
                                ← Orqaga
                            </Text>
                        </Box>
                    </>
                )}
            </Box>
        </Box>
    );

    const NAV_ITEMS = [
        { icon: '👨‍🍳', label: 'Oshpazlar', count: stats.chefs, sub: 'Boshqarish, bloklash', color: '#C03F0C', bg: '#FFF0EC', border: '#F5C5B0', route: '/admin/chefs' },
        { icon: '👤', label: 'Mijozlar', count: stats.customers, sub: 'Ko\'rish, bloklash', color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE', route: '/admin/customers' },
        { icon: '📋', label: 'Buyurtmalar', count: stats.orders, sub: 'Kim kimga, qancha summa', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', route: '/admin/orders' },
        { icon: '💰', label: 'Komissiya', count: fmt(stats.commission), sub: 'Daromad va hisob-kitob', color: '#22C55E', bg: '#F0FFF4', border: '#BBF7D0', route: '/admin/revenue' },
    ];

    return (
        <Box minH="100dvh" bgColor="#FFF5F0">
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
                    onClick={() => { sessionStorage.removeItem('adminAuthed'); setAuthed(false); setStep(1); setCode(''); }}>
                    <Text color="#EF4444" fontWeight="700" style={{ fontSize: '12px' }}>Chiqish</Text>
                </Box>
            </Box>

            <Box px="16px" pt="16px" pb="24px">
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

                <Text fontWeight="800" color="#1C110D" mb="12px" style={{ fontSize: '16px' }}>🗂 Boshqaruv bo'limlari</Text>
                <Box display="flex" flexDir="column" gap="10px">
                    {NAV_ITEMS.map((item, i) => (
                        <Box key={i} bgColor="white" borderRadius="18px" p="16px"
                            boxShadow="0 2px 10px rgba(0,0,0,0.06)"
                            border={`1.5px solid ${item.border}`}
                            cursor="pointer" onClick={() => navigate(item.route)}
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
