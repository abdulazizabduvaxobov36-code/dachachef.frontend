import { Box, Button, Text } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShieldAlt, FaTelegram, FaSignOutAlt, FaSync } from 'react-icons/fa';
import Store from '../store';

const API = import.meta.env.VITE_API_URL || '';
const fmt = (n) => {
    const num = Number(n || 0);
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + ' mlrd';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + ' mln';
    if (num >= 1_000) return (num / 1_000).toFixed(0) + ' ming';
    return num.toLocaleString('uz-UZ') + " so'm";
};

// ─── LOGIN ─────────────────────────────────────────────────────
const LoginScreen = ({ onSuccess }) => {
    const [step, setStep] = useState(1);
    const [code, setCode] = useState('');
    const [sending, setSending] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [err, setErr] = useState('');
    const [timer, setTimer] = useState(0);

    const startTimer = () => {
        setTimer(60);
        const iv = setInterval(() => setTimer(p => { if (p <= 1) { clearInterval(iv); return 0; } return p - 1; }), 1000);
    };

    const sendCode = async () => {
        setSending(true); setErr('');
        try {
            const res = await fetch(`${API}/auth/admin-send-otp`, { method: 'POST' });
            const data = await res.json();
            if (!res.ok) { setErr(data.message || 'Xatolik'); setSending(false); return; }
            if (data.devCode) setCode(String(data.devCode));
            setStep(2); startTimer();
        } catch { setErr('Server bilan aloqa yo\'q'); }
        setSending(false);
    };

    const verify = async () => {
        if (code.length !== 6) { setErr('6 xonali kod kiriting'); return; }
        setVerifying(true); setErr('');
        try {
            const res = await fetch(`${API}/auth/admin-verify-otp`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) { setErr(data.message || 'Kod noto\'g\'ri'); setVerifying(false); return; }
            sessionStorage.setItem('adminAuthed', '1');
            onSuccess();
        } catch { setErr('Server bilan aloqa yo\'q'); }
        setVerifying(false);
    };

    return (
        <Box minH="100dvh" bgColor="#0F172A" display="flex" flexDir="column"
            alignItems="center" justifyContent="center" px="20px">
            {/* Logo */}
            <Box display="flex" alignItems="center" gap="12px" mb="32px">
                <Box w="52px" h="52px" borderRadius="16px" bgColor="#C03F0C"
                    display="flex" alignItems="center" justifyContent="center">
                    <FaShieldAlt style={{ fontSize: '24px', color: 'white' }} />
                </Box>
                <Box>
                    <Text fontWeight="800" color="white" style={{ fontSize: '22px', lineHeight: 1.1 }}>Admin Panel</Text>
                    <Text color="#64748B" style={{ fontSize: '12px' }}>DachaChef boshqaruv</Text>
                </Box>
            </Box>

            <Box bgColor="#1E293B" borderRadius="24px" p="28px" w="100%" maxW="360px"
                border="1px solid #334155">

                {step === 1 ? (
                    <>
                        <Text fontWeight="700" color="white" mb="6px" style={{ fontSize: '18px' }}>
                            Kirish
                        </Text>
                        <Text color="#64748B" mb="24px" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                            Telegram botga 6 xonali tasdiqlash kodi yuboriladi. Faqat admin kira oladi.
                        </Text>
                        <Box bgColor="#0F172A" borderRadius="14px" p="14px" mb="20px"
                            display="flex" alignItems="center" gap="10px" border="1px solid #1E40AF">
                            <FaTelegram style={{ fontSize: '22px', color: '#3B82F6', flexShrink: 0 }} />
                            <Text color="#93C5FD" style={{ fontSize: '13px' }}>
                                Kod <Text as="span" fontWeight="700">@dacha_chef_bot</Text> ga keladi
                            </Text>
                        </Box>
                        {err && (
                            <Box bgColor="#450A0A" borderRadius="10px" px="14px" py="10px" mb="14px">
                                <Text color="#FCA5A5" style={{ fontSize: '13px' }}>⚠ {err}</Text>
                            </Box>
                        )}
                        <Button w="100%" h="50px" bgColor="#C03F0C" color="white" borderRadius="14px"
                            fontWeight="700" fontSize="15px" _hover={{ bgColor: '#a0300a' }}
                            isLoading={sending} loadingText="Yuborilmoqda..."
                            onClick={sendCode}>
                            📨 Kod olish
                        </Button>
                    </>
                ) : (
                    <>
                        <Box display="flex" alignItems="center" gap="8px" mb="20px">
                            <Box bgColor="#1E3A5F" borderRadius="10px" p="8px">
                                <FaTelegram style={{ fontSize: '18px', color: '#3B82F6' }} />
                            </Box>
                            <Text color="#93C5FD" style={{ fontSize: '13px' }}>
                                Telegram botga kod yuborildi
                            </Text>
                        </Box>
                        <Text color="#94A3B8" fontWeight="600" mb="8px" style={{ fontSize: '13px' }}>
                            Kodni kiriting
                        </Text>
                        <input
                            value={code} autoFocus
                            onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setErr(''); }}
                            onKeyDown={e => e.key === 'Enter' && verify()}
                            placeholder="• • • • • •"
                            style={{
                                width: '100%', border: `1.5px solid ${err ? '#EF4444' : '#334155'}`,
                                borderRadius: '14px', padding: '14px', fontSize: '28px',
                                letterSpacing: '10px', outline: 'none', textAlign: 'center',
                                background: '#0F172A', color: 'white', boxSizing: 'border-box',
                                marginBottom: '12px', fontWeight: '700',
                            }}
                        />
                        {err && (
                            <Box bgColor="#450A0A" borderRadius="10px" px="14px" py="10px" mb="12px">
                                <Text color="#FCA5A5" style={{ fontSize: '13px' }}>⚠ {err}</Text>
                            </Box>
                        )}
                        <Button w="100%" h="50px" bgColor="#C03F0C" color="white" borderRadius="14px"
                            fontWeight="700" fontSize="15px" _hover={{ bgColor: '#a0300a' }} mb="12px"
                            isLoading={verifying} loadingText="Tekshirilmoqda..."
                            onClick={verify}>
                            Kirish →
                        </Button>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Text color="#64748B" style={{ fontSize: '13px', cursor: 'pointer' }}
                                onClick={() => { setStep(1); setCode(''); setErr(''); }}>
                                ← Orqaga
                            </Text>
                            {timer > 0
                                ? <Text color="#475569" style={{ fontSize: '13px' }}>{timer}s kutish</Text>
                                : <Text color="#C03F0C" fontWeight="600" style={{ fontSize: '13px', cursor: 'pointer' }}
                                    onClick={() => { setCode(''); setErr(''); sendCode(); }}>
                                    Qayta yuborish
                                </Text>
                            }
                        </Box>
                    </>
                )}
            </Box>
        </Box>
    );
};

// ─── STAT CARD ────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color, bg }) => (
    <Box bgColor="white" borderRadius="16px" p="14px" boxShadow="0 2px 10px rgba(0,0,0,0.06)"
        display="flex" alignItems="center" gap="12px">
        <Box w="42px" h="42px" borderRadius="12px" bgColor={bg} flexShrink={0}
            display="flex" alignItems="center" justifyContent="center" style={{ fontSize: '20px' }}>
            {icon}
        </Box>
        <Box minW={0}>
            <Text color="#9B8E8A" style={{ fontSize: '11px' }}>{label}</Text>
            <Text fontWeight="800" style={{ fontSize: '15px', color }} noOfLines={1}>{value}</Text>
        </Box>
    </Box>
);

// ─── NAV CARD ─────────────────────────────────────────────────
const NavCard = ({ icon, label, desc, value, valueColor, valueBg, border, onClick }) => (
    <Box bgColor="white" borderRadius="18px" px="16px" py="14px"
        boxShadow="0 2px 10px rgba(0,0,0,0.06)" border={`1.5px solid ${border}`}
        cursor="pointer" onClick={onClick} display="flex" alignItems="center" gap="14px"
        _active={{ transform: 'scale(0.98)' }} transition="transform 0.1s">
        <Box w="48px" h="48px" borderRadius="14px" bgColor={valueBg} flexShrink={0}
            display="flex" alignItems="center" justifyContent="center" style={{ fontSize: '22px' }}>
            {icon}
        </Box>
        <Box flex="1" minW={0}>
            <Text fontWeight="800" color="#1C110D" style={{ fontSize: '15px' }}>{label}</Text>
            <Text color="#9B8E8A" style={{ fontSize: '12px', marginTop: '1px' }}>{desc}</Text>
        </Box>
        <Box bgColor={valueBg} borderRadius="10px" px="10px" py="5px" flexShrink={0}>
            <Text fontWeight="800" style={{ fontSize: '14px', color: valueColor }}>{value}</Text>
        </Box>
    </Box>
);

// ─── DASHBOARD ────────────────────────────────────────────────
const Dashboard = ({ onLogout }) => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ chefs: 0, blockedChefs: 0, customers: 0, blockedCustomers: 0, orders: 0, revenue: 0, commission: 0 });
    const [loading, setLoading] = useState(false);

    const loadStats = async () => {
        setLoading(true);
        let s = { chefs: 0, blockedChefs: 0, customers: 0, blockedCustomers: 0, orders: 0, revenue: 0, commission: 0 };
        try {
            const r = await fetch(`${API}/admin/chefs`);
            if (r.ok) {
                const d = await r.json();
                const list = Array.isArray(d) ? d : [];
                s.chefs = list.length;
                s.blockedChefs = list.filter(c => c.isBlocked).length;
            }
        } catch { s.chefs = Store.getChefs().length; }
        try {
            const r = await fetch(`${API}/customers`);
            if (r.ok) {
                const d = await r.json();
                const list = Array.isArray(d) ? d : [];
                // localStorage dan qo'shimcha mijozlarni sanash
                const phones = new Set(list.map(c => c.phone));
                Object.keys(localStorage)
                    .filter(k => k.startsWith('saved_customer_') || k.startsWith('customerInfo_'))
                    .forEach(k => {
                        try {
                            const v = JSON.parse(localStorage.getItem(k));
                            const p = v?.phone || v?.data?.phone;
                            if (p && !phones.has(p)) { phones.add(p); list.push({ phone: p }); }
                        } catch { }
                    });
                s.customers = list.length;
                s.blockedCustomers = list.filter(c => c.isBlocked).length;
            }
        } catch { }
        try {
            const r = await fetch(`${API}/orders/admin/orders`);
            if (r.ok) {
                const d = await r.json();
                const list = Array.isArray(d) ? d : (d.orders || []);
                s.orders = list.length;
                s.revenue = list.reduce((a, o) => a + Number(o.amount || 0), 0);
                s.commission = list.reduce((a, o) => a + Math.round(Number(o.amount || 0) * 0.1), 0);
            }
        } catch { }
        setStats(s);
        setLoading(false);
    };

    useEffect(() => {
        loadStats();
        const iv = setInterval(loadStats, 30000);
        return () => clearInterval(iv);
    }, []);

    const STATS = [
        { icon: '👨‍🍳', label: 'Oshpazlar', value: stats.chefs, color: '#C03F0C', bg: '#FFF0EC' },
        { icon: '👤', label: 'Mijozlar', value: stats.customers, color: '#3B82F6', bg: '#EFF6FF' },
        { icon: '📋', label: 'Buyurtmalar', value: stats.orders, color: '#7C3AED', bg: '#F5F3FF' },
        { icon: '💵', label: 'Aylanma', value: fmt(stats.revenue), color: '#22C55E', bg: '#F0FFF4' },
        { icon: '💰', label: 'Komissiya', value: fmt(stats.commission), color: '#C03F0C', bg: '#FFF0EC' },
        { icon: '🚫', label: 'Bloklangan', value: stats.blockedChefs + stats.blockedCustomers, color: '#EF4444', bg: '#FEF2F2' },
    ];

    const NAV = [
        { icon: '👨‍🍳', label: 'Oshpazlar', desc: `${stats.blockedChefs} ta bloklangan`, value: stats.chefs, valueColor: '#C03F0C', valueBg: '#FFF0EC', border: '#F5C5B0', route: '/admin/chefs' },
        { icon: '👤', label: 'Mijozlar', desc: `${stats.blockedCustomers} ta bloklangan`, value: stats.customers, valueColor: '#3B82F6', valueBg: '#EFF6FF', border: '#BFDBFE', route: '/admin/customers' },
        { icon: '📋', label: 'Buyurtmalar', desc: 'Barcha buyurtmalar', value: stats.orders, valueColor: '#7C3AED', valueBg: '#F5F3FF', border: '#DDD6FE', route: '/admin/orders' },
        { icon: '💰', label: 'Daromad', desc: 'Komissiya hisob-kitob', value: fmt(stats.commission), valueColor: '#22C55E', valueBg: '#F0FFF4', border: '#BBF7D0', route: '/admin/revenue' },
    ];

    return (
        <Box minH="100dvh" bgColor="#F8F4F2">
            {/* Header */}
            <Box bgColor="white" px="16px" py="14px" boxShadow="0 1px 0 #EBEBEB"
                display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap="10px">
                    <Box w="38px" h="38px" borderRadius="12px" bgColor="#C03F0C"
                        display="flex" alignItems="center" justifyContent="center">
                        <FaShieldAlt style={{ fontSize: '16px', color: 'white' }} />
                    </Box>
                    <Box>
                        <Text fontWeight="800" color="#1C110D" style={{ fontSize: '18px', lineHeight: 1.1 }}>Admin Panel</Text>
                        <Text color="#9B8E8A" style={{ fontSize: '11px' }}>DachaChef boshqaruvi</Text>
                    </Box>
                </Box>
                <Box display="flex" alignItems="center" gap="8px">
                    <Box cursor="pointer" w="36px" h="36px" borderRadius="10px" bgColor="#F5F3F1"
                        display="flex" alignItems="center" justifyContent="center"
                        onClick={loadStats} title="Yangilash">
                        <FaSync style={{ fontSize: '13px', color: loading ? '#C03F0C' : '#9B8E8A' }} />
                    </Box>
                    <Box cursor="pointer" borderRadius="10px" px="12px" py="7px"
                        bgColor="#FEF2F2" border="1.5px solid #FCA5A5"
                        display="flex" alignItems="center" gap="6px"
                        onClick={onLogout}>
                        <FaSignOutAlt style={{ fontSize: '12px', color: '#EF4444' }} />
                        <Text color="#EF4444" fontWeight="700" style={{ fontSize: '12px' }}>Chiqish</Text>
                    </Box>
                </Box>
            </Box>

            <Box px="16px" pt="16px" pb="32px">
                {/* Stats */}
                <Text fontWeight="800" color="#1C110D" mb="12px" style={{ fontSize: '15px' }}>
                    📊 Umumiy ko'rsatkichlar
                </Text>
                <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap="10px" mb="24px">
                    {STATS.map((s, i) => (
                        <StatCard key={i} {...s} />
                    ))}
                </Box>

                {/* Navigation */}
                <Text fontWeight="800" color="#1C110D" mb="12px" style={{ fontSize: '15px' }}>
                    🗂 Bo'limlar
                </Text>
                <Box display="flex" flexDir="column" gap="10px">
                    {NAV.map((item, i) => (
                        <NavCard key={i} {...item} onClick={() => navigate(item.route)} />
                    ))}
                </Box>
            </Box>
        </Box>
    );
};

// ─── MAIN ─────────────────────────────────────────────────────
const AdminPage = () => {
    const [authed, setAuthed] = useState(() => sessionStorage.getItem('adminAuthed') === '1');

    const handleLogout = () => {
        if (!window.confirm('Chiqishni xohlaysizmi?')) return;
        sessionStorage.removeItem('adminAuthed');
        setAuthed(false);
    };

    if (!authed) return <LoginScreen onSuccess={() => setAuthed(true)} />;
    return <Dashboard onLogout={handleLogout} />;
};

export default AdminPage;
