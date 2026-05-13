import { Box, Text } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Store from '../store';
import { FaArrowLeft, FaLock, FaUnlock, FaTrash, FaBell, FaStar, FaPhone } from 'react-icons/fa';

const API = import.meta.env.VITE_API_URL || '';

const dateStr = (d) => {
    if (!d) return '—';
    const dt = new Date(typeof d === 'number' && d < 1e12 ? d * 1000 : d);
    return dt.toLocaleDateString('uz-UZ') + ' ' + dt.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
};

const AdminChefDetailPage = () => {
    const navigate = useNavigate();
    const { phone } = useParams();

    const [chef, setChef] = useState(null);
    const [posts, setPosts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [avgRating, setAvgRating] = useState(0);
    const [loading, setLoading] = useState(true);
    const [zoomed, setZoomed] = useState(null);

    // Action states (no window.confirm)
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [confirmBlock, setConfirmBlock] = useState(false);
    const [notifyMsg, setNotifyMsg] = useState('');
    const [showNotify, setShowNotify] = useState(false);
    const [notifySending, setNotifySending] = useState(false);
    const [notifyResult, setNotifyResult] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        if (sessionStorage.getItem('adminAuthed') !== '1') { navigate('/admin'); return; }
        loadAll();
    }, [phone]);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [chefRes, postsRes, reviewsRes] = await Promise.allSettled([
                fetch(`${API}/chefs/${phone}`),
                fetch(`${API}/posts/chef/${phone}`),
                fetch(`${API}/reviews/${phone}`),
            ]);
            if (chefRes.status === 'fulfilled' && chefRes.value.ok)
                setChef(await chefRes.value.json());
            if (postsRes.status === 'fulfilled' && postsRes.value.ok)
                setPosts(await postsRes.value.json());
            if (reviewsRes.status === 'fulfilled' && reviewsRes.value.ok) {
                const d = await reviewsRes.value.json();
                setReviews(d.reviews || []);
                setAvgRating(d.avgRating || 0);
            }
        } catch { }
        setLoading(false);
    };

    const handleBlock = async () => {
        if (!confirmBlock) { setConfirmBlock(true); setTimeout(() => setConfirmBlock(false), 3000); return; }
        setConfirmBlock(false);
        try {
            const r = await fetch(`${API}/chefs/${phone}/block`, { method: 'PATCH' });
            if (r.ok) {
                const { isBlocked } = await r.json();
                setChef(prev => ({ ...prev, isBlocked }));
            }
        } catch { }
    };

    const handleDelete = async () => {
        if (!confirmDelete) { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000); return; }
        setDeleteLoading(true);
        try {
            await fetch(`${API}/chefs/${phone}`, { method: 'DELETE' });
        } catch { }
        setDeleteLoading(false);
        navigate('/admin/chefs');
    };

    const handleNotify = async () => {
        if (!notifyMsg.trim()) return;
        setNotifySending(true);
        try {
            const r = await fetch(`${API}/chefs/${phone}/notify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: notifyMsg.trim() }),
            });
            setNotifyResult(r.ok ? '✅ Xabar yuborildi!' : '❌ Yuborilmadi');
        } catch { setNotifyResult('❌ Xato'); }
        setNotifySending(false);
        setNotifyMsg('');
        setTimeout(() => { setNotifyResult(''); setShowNotify(false); }, 2000);
    };

    if (loading) return (
        <Box minH="100dvh" bgColor="#FFF5F0" display="flex" alignItems="center" justifyContent="center">
            <Text color="#9B8E8A" style={{ fontSize: '14px' }}>Yuklanmoqda...</Text>
        </Box>
    );

    if (!chef) return (
        <Box minH="100dvh" bgColor="#FFF5F0" display="flex" flexDir="column" alignItems="center" justifyContent="center" px="20px">
            <Text color="#9B8E8A" mb="16px">Oshpaz topilmadi</Text>
            <Box cursor="pointer" onClick={() => navigate('/admin/chefs')} bgColor="#C03F0C" borderRadius="12px" px="20px" py="10px">
                <Text color="white" fontWeight="700">← Orqaga</Text>
            </Box>
        </Box>
    );

    const ratedReviews = reviews.filter(r => r.rating > 0);
    const commentReviews = reviews.filter(r => r.comment?.trim());
    const negativeReviews = reviews.filter(r => r.rating > 0 && r.rating <= 2);

    return (
        <Box minH="100dvh" bgColor="#FFF5F0">
            {/* Zoom modal */}
            {zoomed && (
                <Box position="fixed" inset="0" bgColor="rgba(0,0,0,0.92)" zIndex={500}
                    display="flex" alignItems="center" justifyContent="center"
                    onClick={() => setZoomed(null)}>
                    <img src={zoomed} alt="" style={{ maxWidth: '95vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '14px' }} />
                </Box>
            )}

            {/* Header */}
            <Box bgColor="white" px="16px" py="14px" boxShadow="0 1px 0 #EBEBEB"
                display="flex" alignItems="center" gap="12px" position="sticky" top="0" zIndex={10}>
                <Box cursor="pointer" w="36px" h="36px" borderRadius="full" bgColor="#F5F3F1"
                    display="flex" alignItems="center" justifyContent="center"
                    onClick={() => navigate('/admin/chefs')}>
                    <FaArrowLeft style={{ fontSize: '14px', color: '#1C110D' }} />
                </Box>
                <Box flex="1" minW={0}>
                    <Text fontWeight="800" color="#1C110D" noOfLines={1} style={{ fontSize: '17px' }}>
                        {chef.name} {chef.surname}
                    </Text>
                    <Text color="#9B8E8A" style={{ fontSize: '11px' }}>Oshpaz profili</Text>
                </Box>
                {chef.isBlocked && (
                    <Box bgColor="#FEE2E2" borderRadius="8px" px="8px" py="3px">
                        <Text color="#EF4444" fontWeight="700" style={{ fontSize: '10px' }}>BLOKLANGAN</Text>
                    </Box>
                )}
            </Box>

            <Box px="16px" pt="16px" pb="32px" display="flex" flexDir="column" gap="12px">

                {/* Chef info card */}
                <Box bgColor="white" borderRadius="18px" p="16px" boxShadow="0 2px 10px rgba(0,0,0,0.06)"
                    border={chef.isBlocked ? '1.5px solid #FCA5A5' : '1.5px solid transparent'}>
                    <Box display="flex" alignItems="center" gap="14px" mb="14px">
                        <Box w="68px" h="68px" borderRadius="16px" overflow="hidden" flexShrink={0}
                            bgColor="#F0E6E0" display="flex" alignItems="center" justifyContent="center">
                            {chef.image
                                ? <img src={chef.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <Text fontWeight="800" color="#C03F0C" style={{ fontSize: '26px' }}>{(chef.name || '?').charAt(0)}</Text>}
                        </Box>
                        <Box flex="1" minW={0}>
                            <Text fontWeight="800" color="#1C110D" style={{ fontSize: '17px' }}>
                                {chef.name} {chef.surname}
                            </Text>
                            <Box display="flex" alignItems="center" gap="5px" mt="3px">
                                <FaPhone style={{ fontSize: '10px', color: '#9B8E8A' }} />
                                <Text color="#9B8E8A" style={{ fontSize: '12px' }}>+998{chef.phone}</Text>
                            </Box>
                            {chef.exp && (
                                <Text color="#C03F0C" fontWeight="600" mt="2px" style={{ fontSize: '12px' }}>
                                    {chef.exp} yil tajriba
                                </Text>
                            )}
                        </Box>
                    </Box>

                    {/* Stats row */}
                    <Box display="flex" gap="8px" mb="14px">
                        {[
                            { label: 'Postlar', value: posts.length, color: '#7C3AED', bg: '#F5F3FF' },
                            { label: 'Baholar', value: ratedReviews.length, color: '#F59E0B', bg: '#FFFBEB' },
                            { label: 'Reyting', value: avgRating > 0 ? avgRating.toFixed(1) : '—', color: '#22C55E', bg: '#F0FFF4' },
                            { label: 'Salbiy', value: negativeReviews.length, color: '#EF4444', bg: '#FEF2F2' },
                        ].map((s, i) => (
                            <Box key={i} flex="1" bgColor={s.bg} borderRadius="12px" p="8px" textAlign="center">
                                <Text fontWeight="800" style={{ fontSize: '15px', color: s.color }}>{s.value}</Text>
                                <Text color="#9B8E8A" style={{ fontSize: '9px' }}>{s.label}</Text>
                            </Box>
                        ))}
                    </Box>

                    {chef.bio && (
                        <Box bgColor="#FFF5F0" borderRadius="12px" px="12px" py="10px" mb="14px">
                            <Text color="#6B6560" style={{ fontSize: '13px', lineHeight: '1.6' }}>{chef.bio}</Text>
                        </Box>
                    )}

                    <Box display="flex" alignItems="center" gap="6px" mb="14px">
                        <Box w="8px" h="8px" borderRadius="full" bgColor={chef.telegramId ? '#22C55E' : '#D1D5DB'} />
                        <Text color="#9B8E8A" style={{ fontSize: '11px' }}>
                            Telegram: {chef.telegramId ? `ID ${chef.telegramId}` : 'Ulanmagan (bildirishnomalar kelmaydi)'}
                        </Text>
                    </Box>

                    <Text color="#B0A8A4" style={{ fontSize: '10px' }}>
                        Ro'yxatdan o'tgan: {dateStr(chef.registeredAt || chef.createdAt)}
                    </Text>
                </Box>

                {/* Komanda va dacha ma'lumotlari */}
                {(() => {
                    const team = Store.getChefTeam(chef.phone);
                    const prefs = Store.getChefDachaPrefs(chef.phone);
                    const ROLE_LABELS = {
                        ovqat: '👨‍🍳 Ovqat pishirishga yordam',
                        idish: '🍽 Idish yuvadi',
                        podacha: '🍱 Podacha qiladi',
                        boshqa: '⚙️ Boshqa'
                    };
                    const DISTRICTS = {
                        andijon_shahar: 'Andijon shahri', asaka: 'Asaka', oltinkol: "Oltinko'l",
                        baliqchi: 'Baliqchi', boston: "Bo'ston", buloqboshi: 'Buloqboshi',
                        izboskan: 'Izboskan', jalolquduq: 'Jalolquduq', xojaobod: "Xo'jaobod",
                        marhamat: 'Marhamat', mashrabov: 'Mashrabov', paxtaobod: 'Paxtaobod',
                        qurgontepa: "Qo'rg'ontepa", shahrixon: 'Shahrixon', ulugmor: "Ulug'nor",
                        xonobod: 'Xonobod', imomota: 'Imom Ota'
                    };
                    const totalTeam = team && !Array.isArray(team)
                        ? Object.values(team).reduce((a, b) => a + (b || 0), 0)
                        : 0;
                    const hasTeam = totalTeam > 0;
                    const hasPrefs = prefs.canGo.length > 0 || prefs.cannotGo.length > 0;
                    if (!hasTeam && !hasPrefs) return null;
                    return (
                        <Box bgColor="white" borderRadius="18px" p="14px" boxShadow="0 2px 10px rgba(0,0,0,0.06)">
                            {hasTeam && (
                                <Box mb={hasPrefs ? "14px" : "0"}>
                                    <Text fontWeight="700" color="#1C110D" mb="8px" style={{ fontSize: '13px' }}>
                                        👥 Komanda ({totalTeam + 1} ta odam)
                                    </Text>
                                    {team && Object.entries(team).map(([key, count]) =>
                                        count > 0 ? (
                                            <Box key={key} display="flex" alignItems="center" gap="6px" mb="4px">
                                                <Text fontSize="12px" color="#1C110D">{ROLE_LABELS[key] || key}</Text>
                                                <Box ml="auto" bgColor="#FFF0EC" borderRadius="full" px="8px" py="1px">
                                                    <Text fontSize="11px" fontWeight="700" color="#C03F0C">{count} ta</Text>
                                                </Box>
                                            </Box>
                                        ) : null
                                    )}
                                </Box>
                            )}
                            {hasPrefs && (
                                <Box>
                                    <Text fontWeight="700" color="#1C110D" mb="8px" style={{ fontSize: '13px' }}>
                                        🏡 Dacha imkoniyatlari
                                    </Text>
                                    {prefs.canGo.length > 0 && (
                                        <Box mb="6px">
                                            <Text fontSize="12px" fontWeight="600" color="#276749" mb="4px">✓ Boradi:</Text>
                                            <Text fontSize="12px" color="#1C110D">
                                                {prefs.canGo.map(id => DISTRICTS[id] || id).join(', ')}
                                            </Text>
                                        </Box>
                                    )}
                                    {prefs.cannotGo.length > 0 && (
                                        <Box>
                                            <Text fontSize="12px" fontWeight="600" color="#C53030" mb="4px">✗ Bormaydi:</Text>
                                            <Text fontSize="12px" color="#1C110D">
                                                {prefs.cannotGo.map(id => DISTRICTS[id] || id).join(', ')}
                                            </Text>
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </Box>
                    );
                })()}

                {/* Action buttons */}
                <Box bgColor="white" borderRadius="18px" p="14px" boxShadow="0 2px 10px rgba(0,0,0,0.06)">
                    <Text fontWeight="700" color="#1C110D" mb="10px" style={{ fontSize: '13px' }}>Admin amallar</Text>
                    <Box display="flex" gap="8px" mb="8px">
                        {/* Block/Unblock */}
                        <Box flex="1" cursor="pointer" borderRadius="12px" py="10px"
                            bgColor={confirmBlock ? (chef.isBlocked ? '#22C55E' : '#EF4444') : (chef.isBlocked ? '#ECFDF5' : '#FEF2F2')}
                            display="flex" alignItems="center" justifyContent="center" gap="6px"
                            onClick={handleBlock}>
                            {chef.isBlocked
                                ? <><FaUnlock style={{ fontSize: '11px', color: confirmBlock ? 'white' : '#22C55E' }} />
                                    <Text fontWeight="700" style={{ fontSize: '12px', color: confirmBlock ? 'white' : '#22C55E' }}>
                                        {confirmBlock ? 'Tasdiqlash?' : 'Blokdan chiqar'}
                                    </Text></>
                                : <><FaLock style={{ fontSize: '11px', color: confirmBlock ? 'white' : '#EF4444' }} />
                                    <Text fontWeight="700" style={{ fontSize: '12px', color: confirmBlock ? 'white' : '#EF4444' }}>
                                        {confirmBlock ? 'Tasdiqlash?' : 'Bloklash'}
                                    </Text></>}
                        </Box>
                        {/* Delete */}
                        <Box flex="1" cursor="pointer" borderRadius="12px" py="10px"
                            bgColor={confirmDelete ? '#EF4444' : '#FFF5F0'}
                            display="flex" alignItems="center" justifyContent="center" gap="6px"
                            onClick={handleDelete}>
                            <FaTrash style={{ fontSize: '11px', color: confirmDelete ? 'white' : '#C03F0C' }} />
                            <Text fontWeight="700" style={{ fontSize: '12px', color: confirmDelete ? 'white' : '#C03F0C' }}>
                                {deleteLoading ? 'O\'chirilmoqda...' : confirmDelete ? "Ha, o'chirish" : "O'chirish"}
                            </Text>
                        </Box>
                    </Box>

                    {/* Notify */}
                    <Box cursor="pointer" borderRadius="12px" py="10px"
                        bgColor={showNotify ? '#FFFBEB' : '#FFFBEB'}
                        border="1px solid #FDE68A"
                        display="flex" alignItems="center" justifyContent="center" gap="6px"
                        onClick={() => { setShowNotify(v => !v); setNotifyResult(''); }}>
                        <FaBell style={{ fontSize: '11px', color: '#D97706' }} />
                        <Text color="#D97706" fontWeight="700" style={{ fontSize: '12px' }}>
                            {showNotify ? 'Yopish' : 'Ogohlantirish yuborish'}
                        </Text>
                    </Box>

                    {showNotify && (
                        <Box mt="10px">
                            {notifyResult ? (
                                <Box bgColor={notifyResult.startsWith('✅') ? '#F0FFF4' : '#FEF2F2'}
                                    borderRadius="10px" px="14px" py="10px" textAlign="center">
                                    <Text fontWeight="700" style={{ fontSize: '13px' }}>{notifyResult}</Text>
                                </Box>
                            ) : (
                                <Box display="flex" gap="8px">
                                    <Box flex="1" bgColor="#F5F5F5" borderRadius="12px" px="12px"
                                        style={{ height: '44px' }} display="flex" alignItems="center">
                                        <input
                                            value={notifyMsg}
                                            onChange={e => setNotifyMsg(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleNotify()}
                                            placeholder="Ogohlantirish matni..."
                                            style={{ width: '100%', border: 'none', outline: 'none', fontSize: '13px', background: 'transparent', color: '#1C110D' }}
                                        />
                                    </Box>
                                    <Box cursor="pointer" bgColor={notifyMsg.trim() ? '#D97706' : '#E5E7EB'}
                                        borderRadius="12px" px="14px"
                                        display="flex" alignItems="center" justifyContent="center"
                                        onClick={handleNotify}>
                                        <Text color="white" fontWeight="700" style={{ fontSize: '12px' }}>
                                            {notifySending ? '...' : 'Yuborish'}
                                        </Text>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    )}
                </Box>

                {/* Posts gallery */}
                <Box bgColor="white" borderRadius="18px" p="14px" boxShadow="0 2px 10px rgba(0,0,0,0.06)">
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb="12px">
                        <Text fontWeight="700" color="#1C110D" style={{ fontSize: '15px' }}>🍽️ Taomlar</Text>
                        <Box bgColor="#F5F3FF" borderRadius="10px" px="10px" py="4px">
                            <Text color="#7C3AED" fontWeight="700" style={{ fontSize: '12px' }}>{posts.length} ta</Text>
                        </Box>
                    </Box>
                    {posts.length === 0 ? (
                        <Box py="20px" textAlign="center">
                            <Text color="#B0A8A4" style={{ fontSize: '13px' }}>Post yo'q</Text>
                        </Box>
                    ) : (
                        <Box overflowY={posts.length > 6 ? 'auto' : 'visible'}
                            style={posts.length > 6 ? {
                                maxHeight: 'calc((100vw - 76px) / 3 * 2 + 12px)',
                                scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch'
                            } : {}}>
                            <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap="6px">
                                {posts.map((post, i) => (
                                    <Box key={post._id || post.id || i} position="relative"
                                        borderRadius="10px" overflow="hidden" cursor="pointer"
                                        onClick={() => setZoomed(post.image)}>
                                        <Box style={{ paddingBottom: '100%', position: 'relative', background: '#F0E6E0' }}>
                                            <img src={post.image} alt={post.dishName}
                                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                        </Box>
                                        <Box position="absolute" bottom="0" left="0" right="0"
                                            bgColor="rgba(0,0,0,0.55)" px="6px" py="3px">
                                            <Text color="white" fontWeight="600" noOfLines={1} style={{ fontSize: '10px' }}>
                                                {post.dishName}
                                            </Text>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    )}
                </Box>

                {/* Reviews */}
                <Box bgColor="white" borderRadius="18px" p="14px" boxShadow="0 2px 10px rgba(0,0,0,0.06)">
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb="12px">
                        <Text fontWeight="700" color="#1C110D" style={{ fontSize: '15px' }}>⭐ Baholar va izohlar</Text>
                        <Box display="flex" gap="6px">
                            {negativeReviews.length > 0 && (
                                <Box bgColor="#FEF2F2" borderRadius="10px" px="8px" py="3px">
                                    <Text color="#EF4444" fontWeight="700" style={{ fontSize: '11px' }}>
                                        {negativeReviews.length} ta salbiy
                                    </Text>
                                </Box>
                            )}
                            <Box bgColor="#FFFBEB" borderRadius="10px" px="8px" py="3px">
                                <Text color="#F59E0B" fontWeight="700" style={{ fontSize: '11px' }}>
                                    {avgRating > 0 ? `★ ${avgRating.toFixed(1)}` : '—'}
                                </Text>
                            </Box>
                        </Box>
                    </Box>

                    {reviews.length === 0 ? (
                        <Box py="20px" textAlign="center">
                            <Text color="#B0A8A4" style={{ fontSize: '13px' }}>Hali izoh yo'q</Text>
                        </Box>
                    ) : (
                        <Box display="flex" flexDir="column" gap="8px">
                            {[...reviews].sort((a, b) => (a.rating || 5) - (b.rating || 5)).map((r, i) => {
                                const isNegative = r.rating > 0 && r.rating <= 2;
                                const isMedium = r.rating === 3;
                                return (
                                    <Box key={r._id || r.createdAt || i}
                                        bgColor={isNegative ? '#FEF2F2' : isMedium ? '#FFFBEB' : '#F8F8F8'}
                                        borderRadius="14px" p="12px"
                                        border={isNegative ? '1px solid #FCA5A5' : isMedium ? '1px solid #FDE68A' : '1px solid transparent'}>
                                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb="6px">
                                            <Box display="flex" alignItems="center" gap="8px">
                                                <Box w="30px" h="30px" borderRadius="full" flexShrink={0}
                                                    bgColor={isNegative ? '#EF4444' : '#C03F0C'}
                                                    display="flex" alignItems="center" justifyContent="center"
                                                    color="white" fontWeight="700" style={{ fontSize: '12px' }}>
                                                    {(r.customerName || r.customerPhone || 'M').charAt(0).toUpperCase()}
                                                </Box>
                                                <Box>
                                                    <Text fontWeight="700" color="#1C110D" style={{ fontSize: '13px' }}>
                                                        {r.customerName || `+998${r.customerPhone}`}
                                                    </Text>
                                                    <Text color="#B0A8A4" style={{ fontSize: '10px' }}>
                                                        {dateStr(r.createdAt)}
                                                    </Text>
                                                </Box>
                                            </Box>
                                            {r.rating > 0 && (
                                                <Box display="flex" gap="1px" alignItems="center">
                                                    {[1, 2, 3, 4, 5].map(s => (
                                                        <FaStar key={s} style={{
                                                            fontSize: '11px',
                                                            color: s <= r.rating ? '#F4B400' : '#E0DAD7'
                                                        }} />
                                                    ))}
                                                </Box>
                                            )}
                                        </Box>
                                        {r.comment && (
                                            <Text color={isNegative ? '#B91C1C' : '#4A3728'}
                                                style={{ fontSize: '13px', lineHeight: '1.5', marginLeft: '38px' }}>
                                                "{r.comment}"
                                            </Text>
                                        )}
                                        {isNegative && (
                                            <Box mt="6px" ml="38px" bgColor="#FEE2E2" borderRadius="8px" px="8px" py="4px" display="inline-block">
                                                <Text color="#EF4444" fontWeight="700" style={{ fontSize: '10px' }}>⚠️ Salbiy izoh</Text>
                                            </Box>
                                        )}
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>
    );
};
export default AdminChefDetailPage;