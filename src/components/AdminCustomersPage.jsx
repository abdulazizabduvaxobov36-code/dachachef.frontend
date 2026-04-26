import { Box, Text } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaLock, FaUnlock, FaTrash, FaSync } from 'react-icons/fa';

const API = import.meta.env.VITE_API_URL || '';
const dateStr = (d) => {
    if (!d) return '—';
    const dt = new Date(typeof d === 'number' && d < 1e12 ? d * 1000 : d);
    return dt.toLocaleDateString('uz-UZ') + ' ' + dt.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
};
const getBlocked = () => JSON.parse(localStorage.getItem('blockedCustomers') || '{}');
const setBlockedLS = (obj) => localStorage.setItem('blockedCustomers', JSON.stringify(obj));

const AdminCustomersPage = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [blocked, setBlockedState] = useState(getBlocked);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState('all');

    useEffect(() => {
        if (sessionStorage.getItem('adminAuthed') !== '1') { navigate('/admin'); return; }
        loadCustomers();
        const iv = setInterval(loadCustomers, 10000);
        return () => clearInterval(iv);
    }, []);

    const loadCustomers = async () => {
        setLoading(true);
        const custData = {};
        try {
            const r = await fetch(`${API}/customers`);
            if (r.ok) {
                const d = await r.json();
                const list = Array.isArray(d) ? d : (d.customers || []);
                list.forEach(c => { if (c.phone) custData[c.phone] = c; });
            }
        } catch { }
        Object.keys(localStorage).filter(k => k.startsWith('customer_') || k === 'customerData').forEach(k => {
            try {
                const v = JSON.parse(localStorage.getItem(k));
                if (v?.phone && !custData[v.phone]) custData[v.phone] = v;
            } catch { }
        });
        setCustomers(Object.values(custData));
        setLoading(false);
    };

    const toggleBlock = (phone) => {
        const b = { ...getBlocked() };
        if (b[phone]) delete b[phone]; else b[phone] = true;
        setBlockedLS(b);
        setBlockedState({ ...b });
    };

    const deleteCustomer = async (phone) => {
        if (!window.confirm("Bu mijozni o'chirasizmi? Bu amal qaytarib bo'lmaydi.")) return;
        localStorage.removeItem(`customerInfo_${phone}`);
        localStorage.removeItem(`saved_customer_${phone}`);
        localStorage.removeItem(`customer_${phone}`);
        const b = { ...getBlocked() };
        delete b[phone];
        setBlockedLS(b);
        setBlockedState({ ...b });
        setCustomers(prev => prev.filter(c => c.phone !== phone));
        try {
            await fetch(`${API}/customers/${phone}`, { method: 'DELETE' });
        } catch { }
    };

    const applyFilter = (list) => {
        const q = search.trim().toLowerCase();
        return list.filter(c => {
            if (q && !(
                (c.firstName || c.name || '').toLowerCase().includes(q) ||
                (c.lastName || '').toLowerCase().includes(q) ||
                (c.phone || '').includes(q)
            )) return false;
            if (tab === 'blocked') return !!blocked[c.phone];
            return true;
        });
    };

    const filtered = applyFilter(customers);
    const blockedCount = customers.filter(c => blocked[c.phone]).length;

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
                    <Text fontWeight="800" color="#1C110D" style={{ fontSize: '18px' }}>👤 Mijozlar</Text>
                    <Text color="#9B8E8A" style={{ fontSize: '12px' }}>Jami: {customers.length} ta</Text>
                </Box>
                <Box cursor="pointer" onClick={loadCustomers} bgColor="#FFF0EC" borderRadius="10px"
                    px="10px" py="6px" display="flex" alignItems="center" gap="6px"
                    border="1.5px solid #F5C5B0">
                    <FaSync style={{ color: '#C03F0C', fontSize: '11px' }} />
                    <Text color="#C03F0C" fontWeight="600" style={{ fontSize: '12px' }}>Yangilash</Text>
                </Box>
            </Box>

            {/* Tabs */}
            <Box px="16px" pt="12px" display="flex" gap="8px">
                <Box flex="1" cursor="pointer" textAlign="center" py="9px" borderRadius="12px"
                    bgColor={tab === 'all' ? '#C03F0C' : 'white'}
                    border={tab === 'all' ? '1.5px solid #C03F0C' : '1.5px solid #F0E6E0'}
                    onClick={() => setTab('all')}>
                    <Text fontWeight="700" style={{ fontSize: '13px' }}
                        color={tab === 'all' ? 'white' : '#9B8E8A'}>
                        Hammasi ({customers.length})
                    </Text>
                </Box>
                <Box flex="1" cursor="pointer" textAlign="center" py="9px" borderRadius="12px"
                    bgColor={tab === 'blocked' ? '#EF4444' : 'white'}
                    border={tab === 'blocked' ? '1.5px solid #EF4444' : '1.5px solid #F0E6E0'}
                    onClick={() => setTab('blocked')}>
                    <Text fontWeight="700" style={{ fontSize: '13px' }}
                        color={tab === 'blocked' ? 'white' : '#9B8E8A'}>
                        Bloklangan ({blockedCount})
                    </Text>
                </Box>
            </Box>

            <Box px="16px" pt="10px" pb="8px">
                <Box display="flex" alignItems="center" gap="10px" bgColor="white" borderRadius="14px"
                    px="14px" border="1.5px solid #F0E6E0" style={{ height: '44px' }}>
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Ism yoki telefon bo'yicha qidirish..."
                        style={{ width: '100%', border: 'none', outline: 'none', fontSize: '14px', color: '#1C110D', background: 'transparent' }}
                    />
                </Box>
            </Box>

            {loading && <Box textAlign="center" py="20px"><Text color="#9B8E8A" style={{ fontSize: '13px' }}>Yuklanmoqda...</Text></Box>}

            <Box px="16px" pb="24px" display="flex" flexDir="column" gap="10px">
                {filtered.length === 0 && !loading && (
                    <Box bgColor="white" borderRadius="16px" p="24px" textAlign="center">
                        <Text color="#B0A8A4">
                            {tab === 'blocked' ? 'Bloklangan mijoz yo\'q' : 'Hali mijoz yo\'q'}
                        </Text>
                    </Box>
                )}
                {filtered.map((c, i) => (
                    <Box key={c.phone || i} bgColor="white" borderRadius="16px" p="14px"
                        boxShadow="0 2px 8px rgba(0,0,0,0.05)"
                        border={blocked[c.phone] ? '1.5px solid #FCA5A5' : '1.5px solid transparent'}>
                        <Box display="flex" alignItems="center" gap="12px" mb="10px">
                            <Box w="46px" h="46px" borderRadius="full" flexShrink={0}
                                overflow="hidden" bgColor="#3B82F6"
                                display="flex" alignItems="center" justifyContent="center">
                                {c.image
                                    ? <img src={c.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <Text fontWeight="800" color="white" style={{ fontSize: '18px' }}>{(c.firstName || c.name || 'M').charAt(0).toUpperCase()}</Text>}
                            </Box>
                            <Box flex="1" minW={0}>
                                <Box display="flex" alignItems="center" gap="6px" flexWrap="wrap">
                                    <Text fontWeight="800" color="#1C110D" style={{ fontSize: '14px' }}>
                                        {c.firstName || c.name || "Noma'lum"} {c.lastName || ''}
                                    </Text>
                                    {blocked[c.phone] && (
                                        <Box bgColor="#FEE2E2" borderRadius="6px" px="6px" py="1px">
                                            <Text color="#EF4444" fontWeight="700" style={{ fontSize: '10px' }}>BLOKLANGAN</Text>
                                        </Box>
                                    )}
                                </Box>
                                <Text color="#9B8E8A" style={{ fontSize: '12px' }}>📞 +998{c.phone}</Text>
                                {c.createdAt && <Text color="#B0A8A4" style={{ fontSize: '11px' }}>{dateStr(c.createdAt)}</Text>}
                            </Box>
                        </Box>
                        <Box display="flex" gap="8px">
                            <Box flex="1" cursor="pointer" borderRadius="10px" py="8px"
                                bgColor={blocked[c.phone] ? '#ECFDF5' : '#FEF2F2'}
                                display="flex" alignItems="center" justifyContent="center" gap="6px"
                                onClick={() => toggleBlock(c.phone)}>
                                {blocked[c.phone]
                                    ? <><FaUnlock style={{ fontSize: '11px', color: '#22C55E' }} /><Text color="#22C55E" fontWeight="700" style={{ fontSize: '12px' }}>Blokdan chiqar</Text></>
                                    : <><FaLock style={{ fontSize: '11px', color: '#EF4444' }} /><Text color="#EF4444" fontWeight="700" style={{ fontSize: '12px' }}>Bloklash</Text></>}
                            </Box>
                            <Box flex="1" cursor="pointer" borderRadius="10px" py="8px"
                                bgColor="#FFF5F0"
                                display="flex" alignItems="center" justifyContent="center" gap="6px"
                                onClick={() => deleteCustomer(c.phone)}>
                                <FaTrash style={{ fontSize: '11px', color: '#C03F0C' }} />
                                <Text color="#C03F0C" fontWeight="700" style={{ fontSize: '12px' }}>O'chirish</Text>
                            </Box>
                        </Box>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};
export default AdminCustomersPage;
