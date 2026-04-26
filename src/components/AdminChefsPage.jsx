import { Box, Text } from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaLock, FaUnlock, FaTrash, FaSync } from 'react-icons/fa';
import Store from '../store';

const API = import.meta.env.VITE_API_URL || '';
const dateStr = (d) => {
    if (!d) return '—';
    const dt = new Date(typeof d === 'number' && d < 1e12 ? d * 1000 : d);
    return dt.toLocaleDateString('uz-UZ') + ' ' + dt.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
};

const AdminChefsPage = () => {
    const navigate = useNavigate();
    const [chefs, setChefs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState('all');
    const deletedRef = useRef(new Set());

    useEffect(() => {
        if (sessionStorage.getItem('adminAuthed') !== '1') { navigate('/admin'); return; }
        loadChefs();
        const iv = setInterval(loadChefs, 15000);
        return () => clearInterval(iv);
    }, []);

    const loadChefs = async () => {
        setLoading(true);
        try {
            const r = await fetch(`${API}/admin/chefs`);
            if (r.ok) {
                const d = await r.json();
                const list = Array.isArray(d) ? d : (d.chefs || Store.getChefs());
                setChefs(list.filter(c => !deletedRef.current.has(c.phone)));
            } else setChefs(Store.getChefs().filter(c => !deletedRef.current.has(c.phone)));
        } catch { setChefs(Store.getChefs().filter(c => !deletedRef.current.has(c.phone))); }
        setLoading(false);
    };

    const toggleBlock = async (chef) => {
        const wasBlocked = !!chef.isBlocked;
        const action = wasBlocked ? 'blokdan chiqarasizmi' : 'bloklamoqchimisiz';
        if (!window.confirm(`${chef.name} ${chef.surname} ni ${action}?`)) return;
        try {
            const r = await fetch(`${API}/chefs/${chef.phone}/block`, { method: 'PATCH' });
            if (r.ok) {
                const { isBlocked } = await r.json();
                setChefs(prev => prev.map(c => c.phone === chef.phone ? { ...c, isBlocked } : c));
            }
        } catch {
            alert('Xato yuz berdi. Internet aloqasini tekshiring.');
        }
    };

    const deleteChef = async (chef) => {
        if (!window.confirm(`${chef.name} ${chef.surname} ni o'chirasizmi? Bu amal qaytarib bo'lmaydi.`)) return;
        deletedRef.current.add(chef.phone);
        Store.removeChef(chef.phone);
        localStorage.removeItem(`chef_${chef.phone}`);
        localStorage.removeItem(`saved_chef_${chef.phone}`);
        setChefs(prev => prev.filter(c => c.phone !== chef.phone));
        try {
            await fetch(`${API}/chefs/${chef.phone}`, { method: 'DELETE' });
        } catch { }
    };

    const applyFilter = (list) => {
        const q = search.trim().toLowerCase();
        return list.filter(c => {
            if (q && !(
                (c.name || '').toLowerCase().includes(q) ||
                (c.surname || '').toLowerCase().includes(q) ||
                (c.phone || '').includes(q)
            )) return false;
            if (tab === 'blocked') return !!c.isBlocked;
            return true;
        });
    };

    const filtered = applyFilter(chefs);
    const blockedCount = chefs.filter(c => c.isBlocked).length;

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
                    <Text fontWeight="800" color="#1C110D" style={{ fontSize: '18px' }}>👨‍🍳 Oshpazlar</Text>
                    <Text color="#9B8E8A" style={{ fontSize: '12px' }}>Jami: {chefs.length} ta</Text>
                </Box>
                <Box cursor="pointer" onClick={loadChefs} bgColor="#FFF0EC" borderRadius="10px"
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
                        Hammasi ({chefs.length})
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
                        placeholder="Ism, familiya yoki telefon bo'yicha qidirish..."
                        style={{ width: '100%', border: 'none', outline: 'none', fontSize: '14px', color: '#1C110D', background: 'transparent' }}
                    />
                </Box>
            </Box>

            {loading && <Box textAlign="center" py="20px"><Text color="#9B8E8A" style={{ fontSize: '13px' }}>Yuklanmoqda...</Text></Box>}

            <Box px="16px" pb="24px" display="flex" flexDir="column" gap="10px">
                {filtered.length === 0 && !loading && (
                    <Box bgColor="white" borderRadius="16px" p="24px" textAlign="center">
                        <Text color="#B0A8A4">
                            {tab === 'blocked' ? 'Bloklangan oshpaz yo\'q' : 'Hali oshpaz yo\'q'}
                        </Text>
                    </Box>
                )}
                {filtered.map((chef, i) => (
                    <Box key={chef.phone || i} bgColor="white" borderRadius="16px" p="14px"
                        boxShadow="0 2px 8px rgba(0,0,0,0.05)"
                        border={chef.isBlocked ? '1.5px solid #FCA5A5' : '1.5px solid transparent'}>
                        <Box display="flex" alignItems="center" gap="12px" mb="10px">
                            <Box w="46px" h="46px" borderRadius="12px" flexShrink={0}
                                overflow="hidden" bgColor="#F0E6E0"
                                display="flex" alignItems="center" justifyContent="center">
                                {chef.image
                                    ? <img src={chef.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <Text fontWeight="800" color="#C03F0C" style={{ fontSize: '18px' }}>{(chef.name || '?').charAt(0)}</Text>}
                            </Box>
                            <Box flex="1" minW={0}>
                                <Box display="flex" alignItems="center" gap="6px" flexWrap="wrap">
                                    <Text fontWeight="800" color="#1C110D" style={{ fontSize: '14px' }}>
                                        {chef.name} {chef.surname}
                                    </Text>
                                    {chef.isBlocked && (
                                        <Box bgColor="#FEE2E2" borderRadius="6px" px="6px" py="1px">
                                            <Text color="#EF4444" fontWeight="700" style={{ fontSize: '10px' }}>BLOKLANGAN</Text>
                                        </Box>
                                    )}
                                </Box>
                                <Text color="#9B8E8A" style={{ fontSize: '12px' }}>📞 +998{chef.phone}</Text>
                                <Text color="#B0A8A4" style={{ fontSize: '11px' }}>
                                    {chef.exp ? `${chef.exp} yil tajriba` : ''}{chef.registeredAt ? ` · ${dateStr(chef.registeredAt)}` : ''}
                                </Text>
                            </Box>
                        </Box>
                        <Box display="flex" gap="8px">
                            <Box flex="1" cursor="pointer" borderRadius="10px" py="8px"
                                bgColor={chef.isBlocked ? '#ECFDF5' : '#FEF2F2'}
                                display="flex" alignItems="center" justifyContent="center" gap="6px"
                                onClick={() => toggleBlock(chef)}>
                                {chef.isBlocked
                                    ? <><FaUnlock style={{ fontSize: '11px', color: '#22C55E' }} /><Text color="#22C55E" fontWeight="700" style={{ fontSize: '12px' }}>Blokdan chiqar</Text></>
                                    : <><FaLock style={{ fontSize: '11px', color: '#EF4444' }} /><Text color="#EF4444" fontWeight="700" style={{ fontSize: '12px' }}>Bloklash</Text></>}
                            </Box>
                            <Box flex="1" cursor="pointer" borderRadius="10px" py="8px"
                                bgColor="#FFF5F0"
                                display="flex" alignItems="center" justifyContent="center" gap="6px"
                                onClick={() => deleteChef(chef)}>
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
export default AdminChefsPage;
