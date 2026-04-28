import { Box, Text } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSync, FaExclamationTriangle, FaTrash } from 'react-icons/fa';

const API = import.meta.env.VITE_API_URL || '';
const fmt = (n) => Number(n || 0).toLocaleString('uz-UZ') + " so'm";
const dateStr = (d) => {
    if (!d) return '—';
    const dt = new Date(typeof d === 'number' && d < 1e12 ? d * 1000 : d);
    return dt.toLocaleDateString('uz-UZ') + ' ' + dt.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
};

const STATUS_LABELS = { pending: 'Kutilmoqda', new: 'Yangi', accepted: 'Qabul qilindi', rejected: 'Rad etildi', done: 'Bajarildi', cancelled: 'Bekor' };
const STATUS_COLORS = {
    pending: { bg: '#FFFBEB', color: '#B45309' },
    new: { bg: '#FFF0EC', color: '#C03F0C' },
    accepted: { bg: '#EFF6FF', color: '#3B82F6' },
    rejected: { bg: '#FEE2E2', color: '#EF4444' },
    done: { bg: '#F0FFF4', color: '#22C55E' },
    cancelled: { bg: '#FFF5F5', color: '#EF4444' },
};

const AdminOrdersPage = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sourceFilter, setSourceFilter] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (sessionStorage.getItem('adminAuthed') !== '1') { navigate('/admin'); return; }
        loadOrders();
        const iv = setInterval(loadOrders, 8000);
        return () => clearInterval(iv);
    }, []);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const r = await fetch(`${API}/orders/admin/orders`);
            if (r.ok) {
                const d = await r.json();
                setOrders((Array.isArray(d) ? d : (d.orders || [])).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
            } else {
                const r2 = await fetch(`${API}/orders`);
                if (r2.ok) {
                    const d = await r2.json();
                    setOrders((Array.isArray(d) ? d : (d.orders || [])).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
                }
            }
        } catch { }
        setLoading(false);
    };

    // Mijoz va oshpaz buyurtmalarini solishtirish
    // source='customer' → mijoz tomonidan
    // source='chef' yoki undefined → oshpaz tomonidan
    const customerOrders = orders.filter(o => o.source === 'customer');
    const chefOrders = orders.filter(o => o.source !== 'customer');

    // Har bir mijoz buyurtmasi uchun oshpaz tasdiqlagan? — bir xil chefPhone + customerPhone, yaqin vaqt (24h)
    const findMatch = (co) => {
        return chefOrders.find(ch => {
            if (ch.chefPhone !== co.chefPhone) return false;
            // customerPhone mosligini tekshirish
            if (ch.customerPhone === co.customerPhone) {
                // Vaqt yaqinligi: 24 soat ichida
                return Math.abs(new Date(ch.createdAt) - new Date(co.createdAt)) < 86400000;
            }
            return false;
        });
    };

    const filtered = orders.filter(o => {
        const src = sourceFilter;
        if (src === 'customer' && o.source !== 'customer') return false;
        if (src === 'chef' && o.source === 'customer') return false;
        if (search.trim()) {
            const q = search.toLowerCase();
            return (o.customerName || '').toLowerCase().includes(q) ||
                (o.customerPhone || '').includes(q) ||
                (o.chefName || '').toLowerCase().includes(q) ||
                (o.chefPhone || '').includes(q);
        }
        return true;
    });

    // Tasdiqlanmagan mijoz buyurtmalari soni (ogohlantirish uchun)
    const unconfirmedCount = customerOrders.filter(co => !findMatch(co) && co.status === 'pending').length;

    // Summa mos kelmaydigan oshpazlar — ogohlantirish kerak
    const mismatchedChefs = {};
    customerOrders.forEach(co => {
        const match = findMatch(co);
        if (match && Number(match.amount) < Number(co.amount)) {
            const phone = co.chefPhone;
            mismatchedChefs[phone] = (mismatchedChefs[phone] || 0) + 1;
        }
    });

    const sendWarning = async (chefPhone) => {
        alert(`Ogohlantirish yuborildi: ${chefPhone}`);
        // TODO: backend notification endpoint
    };

    const blockChef = (chefPhone) => {
        const b = JSON.parse(localStorage.getItem('blockedChefs') || '{}');
        b[chefPhone] = true;
        localStorage.setItem('blockedChefs', JSON.stringify(b));
        alert(`Oshpaz bloklandi: ${chefPhone}`);
    };

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
                    <Text fontWeight="800" color="#1C110D" style={{ fontSize: '18px' }}>📋 Buyurtmalar</Text>
                    <Text color="#9B8E8A" style={{ fontSize: '12px' }}>Jami: {orders.length} ta</Text>
                </Box>
                <Box cursor="pointer" onClick={loadOrders} bgColor="#FFF0EC" borderRadius="10px"
                    px="10px" py="6px" display="flex" alignItems="center" gap="6px"
                    border="1.5px solid #F5C5B0">
                    <FaSync style={{ color: '#C03F0C', fontSize: '11px' }} />
                    <Text color="#C03F0C" fontWeight="600" style={{ fontSize: '12px' }}>Yangilash</Text>
                </Box>
                <Box cursor="pointer" bgColor="#FEF2F2" borderRadius="10px"
                    px="10px" py="6px" display="flex" alignItems="center" gap="6px"
                    border="1.5px solid #FCA5A5"
                    onClick={async () => {
                        if (!window.confirm(`Barcha ${orders.length} ta buyurtmani o'chirasizmi? Bu qaytarib bo'lmaydi!`)) return;
                        try {
                            await fetch(`${API}/orders/admin/clear-all`, { method: 'DELETE' });
                            setOrders([]);
                        } catch { alert('Xato yuz berdi'); }
                    }}>
                    <FaTrash style={{ color: '#EF4444', fontSize: '11px' }} />
                    <Text color="#EF4444" fontWeight="600" style={{ fontSize: '12px' }}>Tozalash</Text>
                </Box>
            </Box>

            <Box px="16px" pt="12px" pb="4px">
                {/* Ogohlantirish: tasdiqlanmagan mijoz buyurtmalari */}
                {unconfirmedCount > 0 && (
                    <Box bgColor="#FEF9C3" borderRadius="14px" px="14px" py="10px" mb="10px"
                        border="1.5px solid #FDE047" display="flex" alignItems="center" gap="10px">
                        <FaExclamationTriangle style={{ color: '#B45309', fontSize: '16px', flexShrink: 0 }} />
                        <Text color="#B45309" fontWeight="700" style={{ fontSize: '13px' }}>
                            {unconfirmedCount} ta mijoz buyurtmasi oshpaz tomonidan tasdiqlanmagan!
                        </Text>
                    </Box>
                )}

                {/* Qidiruv */}
                <Box display="flex" alignItems="center" bgColor="white" borderRadius="14px"
                    px="14px" border="1.5px solid #F0E6E0" style={{ height: '44px' }} mb="10px">
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Mijoz yoki oshpaz nomi bo'yicha..."
                        style={{ width: '100%', border: 'none', outline: 'none', fontSize: '14px', color: '#1C110D', background: 'transparent' }}
                    />
                </Box>

                {/* Filtr */}
                <Box display="flex" gap="8px" mb="10px" flexWrap="wrap">
                    {[
                        { v: '', l: 'Barchasi', count: orders.length },
                        { v: 'customer', l: '👤 Mijoz bergan', count: customerOrders.length },
                        { v: 'chef', l: '👨‍🍳 Oshpaz bergan', count: chefOrders.length },
                    ].map(opt => (
                        <Box key={opt.v} cursor="pointer" px="12px" py="6px" borderRadius="20px"
                            border="1.5px solid"
                            borderColor={sourceFilter === opt.v ? '#C03F0C' : '#F0E6E0'}
                            bgColor={sourceFilter === opt.v ? '#C03F0C' : 'white'}
                            onClick={() => setSourceFilter(opt.v)}>
                            <Text fontWeight="600" style={{ fontSize: '12px', color: sourceFilter === opt.v ? 'white' : '#9B614B' }}>
                                {opt.l} ({opt.count})
                            </Text>
                        </Box>
                    ))}
                </Box>
            </Box>

            {loading && <Box textAlign="center" py="20px"><Text color="#9B8E8A" style={{ fontSize: '13px' }}>Yuklanmoqda...</Text></Box>}

            <Box px="16px" pb="24px" display="flex" flexDir="column" gap="10px">
                {filtered.length === 0 && !loading && (
                    <Box bgColor="white" borderRadius="16px" p="24px" textAlign="center">
                        <Text color="#B0A8A4">Buyurtmalar yo'q</Text>
                    </Box>
                )}
                {filtered.map((o, i) => {
                    const sc = STATUS_COLORS[o.status] || { bg: '#F5F5F5', color: '#666' };
                    const isFromCustomer = o.source === 'customer';
                    const matchedOrder = isFromCustomer ? findMatch(o) : null;
                    const hasAmountMismatch = matchedOrder && Number(matchedOrder.amount) < Number(o.amount);

                    return (
                        <Box key={o._id || i} bgColor="white" borderRadius="16px" p="14px"
                            boxShadow="0 2px 8px rgba(0,0,0,0.05)"
                            border={hasAmountMismatch ? '1.5px solid #FCA5A5' : isFromCustomer && !matchedOrder ? '1.5px solid #FDE047' : '1.5px solid transparent'}>

                            {/* Source badge */}
                            <Box display="flex" gap="6px" mb="8px" flexWrap="wrap">
                                <Box bgColor={isFromCustomer ? '#EFF6FF' : '#F0FFF4'} borderRadius="6px" px="8px" py="2px">
                                    <Text fontWeight="700" style={{ fontSize: '10px', color: isFromCustomer ? '#3B82F6' : '#22C55E' }}>
                                        {isFromCustomer ? '👤 Mijoz tomonidan' : '👨‍🍳 Oshpaz tomonidan'}
                                    </Text>
                                </Box>
                                {isFromCustomer && !matchedOrder && (
                                    <Box bgColor="#FEF9C3" borderRadius="6px" px="8px" py="2px">
                                        <Text fontWeight="700" style={{ fontSize: '10px', color: '#B45309' }}>⚠ Oshpaz tasdiqlamagan</Text>
                                    </Box>
                                )}
                                {isFromCustomer && matchedOrder && !hasAmountMismatch && (
                                    <Box bgColor="#F0FFF4" borderRadius="6px" px="8px" py="2px">
                                        <Text fontWeight="700" style={{ fontSize: '10px', color: '#22C55E' }}>✅ Tasdiqlangan</Text>
                                    </Box>
                                )}
                                {hasAmountMismatch && (
                                    <Box bgColor="#FEE2E2" borderRadius="6px" px="8px" py="2px">
                                        <Text fontWeight="700" style={{ fontSize: '10px', color: '#EF4444' }}>⚠ Summa mos emas!</Text>
                                    </Box>
                                )}
                            </Box>

                            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb="6px">
                                <Box>
                                    <Text fontWeight="800" color="#1C110D" style={{ fontSize: '14px' }}>
                                        {o.customerName || `+998${o.customerPhone}`}
                                    </Text>
                                    <Text color="#9B8E8A" style={{ fontSize: '11px' }}>👨‍🍳 {o.chefName || o.chefPhone}</Text>
                                    <Text color="#B0A8A4" style={{ fontSize: '10px' }}>{dateStr(o.createdAt)}</Text>
                                </Box>
                                <Box textAlign="right" display="flex" flexDir="column" alignItems="flex-end" gap="4px">
                                    <Text fontWeight="800" color="#22C55E" style={{ fontSize: '15px' }}>{fmt(o.amount)}</Text>
                                    <Text color="#C03F0C" fontWeight="700" style={{ fontSize: '11px' }}>
                                        Komissiya: {fmt(Math.round(Number(o.amount) * 0.1))}
                                    </Text>
                                    {o.status && (
                                        <Box bgColor={sc.bg} borderRadius="20px" px="8px" py="2px">
                                            <Text style={{ fontSize: '11px', fontWeight: '700', color: sc.color }}>
                                                {STATUS_LABELS[o.status] || o.status}
                                            </Text>
                                        </Box>
                                    )}
                                </Box>
                            </Box>

                            {/* Summa farqi ko'rsatish + ogohlantirish/bloklash */}
                            {hasAmountMismatch && (
                                <Box bgColor="#FEE2E2" borderRadius="10px" px="12px" py="8px" mt="6px">
                                    <Text color="#EF4444" fontWeight="700" style={{ fontSize: '12px' }}>
                                        Mijoz aytgan: {fmt(o.amount)} | Oshpaz kiritgan: {fmt(matchedOrder.amount)} | Farq: {fmt(Number(o.amount) - Number(matchedOrder.amount))}
                                    </Text>
                                    <Box display="flex" gap="8px" mt="8px">
                                        <Box cursor="pointer" bgColor="#FEF9C3" borderRadius="8px" px="10px" py="6px"
                                            border="1px solid #FDE047"
                                            onClick={() => sendWarning(o.chefPhone)}>
                                            <Text color="#B45309" fontWeight="700" style={{ fontSize: '11px' }}>⚠️ Ogohlantirish yuborish</Text>
                                        </Box>
                                        <Box cursor="pointer" bgColor="#FEE2E2" borderRadius="8px" px="10px" py="6px"
                                            border="1px solid #FCA5A5"
                                            onClick={() => { if (window.confirm(`${o.chefName || o.chefPhone} ni bloklaysizmi?`)) blockChef(o.chefPhone); }}>
                                            <Text color="#EF4444" fontWeight="700" style={{ fontSize: '11px' }}>🚫 Bloklash</Text>
                                        </Box>
                                    </Box>
                                </Box>
                            )}

                            {o.note && (
                                <Box bgColor="#FFF5F0" borderRadius="8px" px="10px" py="6px" mt="6px">
                                    <Text color="#6B6560" style={{ fontSize: '12px' }}>{o.note}</Text>
                                </Box>
                            )}
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
};
export default AdminOrdersPage;