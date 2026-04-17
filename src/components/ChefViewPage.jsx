import { Box, Text, Button } from '@chakra-ui/react';
import { FaArrowLeft, FaCommentDots, FaStar, FaUser, FaTimes, FaComment, FaShoppingBag } from 'react-icons/fa';
import HeroHeader from '/images/Hero Header.png';
import { useNavigate, useParams } from 'react-router-dom';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Store from '../store';

const API = import.meta.env?.VITE_API_URL || 'http://localhost:5000';

const ChefViewPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const { id } = useParams();
    const [chef, setChef] = useState(Store.getChefs()[Number(id)] || null);
    const [zoomed, setZoomed] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [avgRating, setAvgRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [chefOrdersCount, setChefOrdersCount] = useState(0);

    const session = Store.getSession();
    const isCustomer = session?.role === 'customer';
    const customerPhone = session?.data?.phone || 'http://localhost:5000';
    const customerName = session?.data?.firstName || session?.data?.name || 'http://localhost:5000';

    const [chefPosts, setChefPosts] = useState([]);
    const [customerOrders, setCustomerOrders] = useState([]);

    // Inline review modal state
    const [reviewModal, setReviewModal] = useState(null); // null | 'comment' | 'rating'
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewSuccess, setReviewSuccess] = useState(false);
    const [reviewError, setReviewError] = useState('');

    // Order modal state
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [orderAmount, setOrderAmount] = useState('');
    const [orderNote, setOrderNote] = useState('');
    const [orderLoading, setOrderLoading] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [orderError, setOrderError] = useState('');
    const [hasPendingOrder, setHasPendingOrder] = useState(false);

    useEffect(() => {
        const refresh = () => setChef(Store.getChefs()[Number(id)] || null);
        window.addEventListener('chefs-updated', refresh);
        const unsub = Store.listenChefs(chefs => { const u = chefs[Number(id)]; if (u) setChef(u); });
        return () => { window.removeEventListener('chefs-updated', refresh); unsub?.(); };
    }, [id]);

    // Reactive posts — updates when chef publishes new post
    useEffect(() => {
        if (!chef?.phone) return;
        setChefPosts(Store.getPosts().filter(p => p.chefPhone === chef.phone));
        const unsub = Store.listenPosts(all => setChefPosts(all.filter(p => p.chefPhone === chef.phone)));
        return () => unsub?.();
    }, [chef?.phone]);

    useEffect(() => {
        if (!chef?.phone) return;
        loadReviews();
        const iv = setInterval(loadReviews, 3000);
        return () => clearInterval(iv);
    }, [chef?.phone]);

    useEffect(() => {
        if (!chef?.phone) return;
        const fetchOrders = async () => {
            try {
                const res = await fetch(`${API}/orders/chef/${chef.phone}`);
                if (!res.ok) return;
                const data = await res.json();
                if (Array.isArray(data?.orders)) setChefOrdersCount(data.orders.length);
            } catch { }
        };
        fetchOrders();
        const iv = setInterval(fetchOrders, 10000);
        return () => clearInterval(iv);
    }, [chef?.phone]);

    // Customer orders from this chef
    useEffect(() => {
        if (!isCustomer || !customerPhone || !chef?.phone) return;
        const loadOrders = async () => {
            try {
                const res = await fetch(`${API}/orders/customer/${customerPhone}/all`);
                if (!res.ok) throw new Error();
                const data = await res.json();
                setCustomerOrders((data.orders || []).filter(o => o.chefPhone === chef.phone));
            } catch { }
        };
        loadOrders();
    }, [isCustomer, customerPhone, chef?.phone]);

    const loadReviews = async () => {
        try {
            const res = await fetch(`${API}/reviews/${chef.phone}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            // Backend review lari + localStorage dagi pending review larni birlashtirish
            const serverReviews = data.reviews || [];
            const lsKey = `reviews_${chef.phone}`;
            const localReviews = JSON.parse(localStorage.getItem(lsKey) || '[]');
            // Serverda yo'q bo'lgan locallarni qo'shamiz
            const merged = [...localReviews.filter(lr =>
                !serverReviews.some(sr => sr.createdAt === lr.createdAt && sr.customerPhone === lr.customerPhone)
            ), ...serverReviews];
            setReviews(merged);
            setAvgRating(data.avgRating || 0);
            setTotalReviews(merged.length);
        } catch {
            // Server offline — localStorage dan yuklaymiz
            const lsKey = `reviews_${chef.phone}`;
            const local = JSON.parse(localStorage.getItem(lsKey) || '[]');
            if (local.length > 0) {
                setReviews(local);
                setTotalReviews(local.length);
                const rated = local.filter(r => r.rating > 0);
                if (rated.length > 0)
                    setAvgRating(+(rated.reduce((s, r) => s + r.rating, 0) / rated.length).toFixed(1));
            }
        }
    };

    const openModal = (type) => {
        setReviewModal(type);
        setRating(0);
        setComment('');
        setReviewError('');
        setReviewSuccess(false);
    };

    const closeModal = () => {
        setReviewModal(null);
        setRating(0);
        setComment('');
        setReviewError('');
        setReviewSuccess(false);
    };

    const handleReviewSubmit = async () => {
        const isRating = reviewModal === 'rating';
        if (isRating && rating === 0) { setReviewError(t('chefView.errStar')); return; }
        if (!comment.trim() && !isRating) { setReviewError(t('chefView.errComment')); return; }
        setReviewLoading(true);
        setReviewError('');

        const reviewData = {
            chefPhone: chef.phone,
            chefName: `${chef.name} ${chef.surname}`,
            customerPhone,
            customerName,
            rating: isRating ? rating : 0,
            comment: comment.trim(),
            type: isRating ? 'rating' : 'comment',
            createdAt: new Date().toISOString(),
        };

        // LocalStorage ga saqlaymiz (offline fallback)
        const lsKey = `reviews_${chef.phone}`;
        const existing = JSON.parse(localStorage.getItem(lsKey) || '[]');
        existing.unshift(reviewData);
        localStorage.setItem(lsKey, JSON.stringify(existing));

        // Ekranda darhol ko'rsatamiz
        setReviews(prev => [reviewData, ...prev]);
        const newTotal = reviews.length + 1;
        const newRated = [...reviews, reviewData].filter(r => r.rating > 0);
        if (newRated.length > 0) {
            setAvgRating(+(newRated.reduce((s, r) => s + r.rating, 0) / newRated.length).toFixed(1));
        }
        setTotalReviews(newTotal);
        setReviewSuccess(true);
        setTimeout(() => closeModal(), 1400);

        // Backend ga yuborishga harakat
        try {
            const res = await fetch(`${API}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reviewData),
            });
            if (res.ok) {
                // Backend saqladi — LocalStorage dagi backupni tozalab, serverdan qayta yuklaymiz
                localStorage.removeItem(lsKey);
                loadReviews();
            }
        } catch { /* server offline — localStorage da saqlanib qoldi */ }

        setReviewLoading(false);
    };

    // Pending order check
    useEffect(() => {
        if (!isCustomer || !chef?.phone) return;
        const key = `pendingOrder_${customerPhone}_${chef.phone}`;
        setHasPendingOrder(!!localStorage.getItem(key));
    }, [isCustomer, chef?.phone, customerPhone]);

    const handleOrderSubmit = async () => {
        if (!orderAmount || isNaN(Number(orderAmount)) || Number(orderAmount) <= 0) {
            setOrderError("Iltimos, to'g'ri summa kiriting");
            return;
        }
        setOrderLoading(true);
        setOrderError('');

        const amount = Number(orderAmount);
        const API_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:5000';

        try {
            const res = await fetch(`${API_BASE}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerPhone,
                    customerName,
                    chefPhone: chef.phone,
                    chefName: `${chef.name} ${chef.surname}`,
                    amount,
                    note: orderNote.trim(),
                    source: 'customer',
                    status: 'pending',
                    createdAt: new Date().toISOString(),
                }),
            });
            if (res.ok) {
                // Pending flagni saqlash
                const key = `pendingOrder_${customerPhone}_${chef.phone}`;
                localStorage.setItem(key, '1');
                setHasPendingOrder(true);
                setOrderSuccess(true);
                // Chat orqali xabar yuborish
                const chatId = Store.makeChatId(customerPhone, chef.phone);
                Store.sendMessage(chatId, {
                    text: `📦 Buyurtma yuborildi: ${amount.toLocaleString()} so'm${orderNote ? ' — ' + orderNote : ''}`,
                    sender: 'customer',
                    from: customerPhone,
                    to: chef.phone,
                });
                setTimeout(() => {
                    setShowOrderModal(false);
                    setOrderSuccess(false);
                    setOrderAmount('');
                    setOrderNote('');
                }, 1800);
            } else {
                setOrderError("Xatolik yuz berdi, qaytadan urinib ko'ring");
            }
        } catch {
            setOrderError("Server bilan aloqa yo'q");
        }
        setOrderLoading(false);
    };

    if (!chef) return (
        <Box minH="100dvh" display="flex" alignItems="center" justifyContent="center" bgColor="#FFF5F0">
            <Box textAlign="center" p="24px">
                <Text color="#9B8E8A" mb="16px" style={{ fontSize: '16px' }}>{t('chefView.notFound')}</Text>
                <Button bgColor="#C03F0C" color="white" borderRadius="14px" h="44px" px="24px" onClick={() => navigate(-1)}>{t('chefView.back')}</Button>
            </Box>
        </Box>
    );

    const fullName = `${chef.name} ${chef.surname}`;
    const isOnline = chef.phone ? Store.isOnline('chef', chef.phone) : false;


    return (
        <Box minH="100dvh" bgColor="#FFF5F0" display="flex" flexDir="column">
            {/* Zoom modal */}
            {zoomed && (
                <Box position="fixed" inset="0" bgColor="rgba(0,0,0,0.92)" zIndex={500}
                    display="flex" alignItems="center" justifyContent="center" onClick={() => setZoomed(null)}>
                    <Box position="absolute" top="16px" right="16px" w="36px" h="36px"
                        borderRadius="full" bgColor="rgba(255,255,255,0.15)"
                        display="flex" alignItems="center" justifyContent="center" cursor="pointer">
                        <FaTimes style={{ color: 'white', fontSize: '16px' }} />
                    </Box>
                    <img src={zoomed} alt="" style={{ maxWidth: '95vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '14px' }} onClick={e => e.stopPropagation()} />
                </Box>
            )}

            {/* Order Modal */}
            {showOrderModal && (
                <Box position="fixed" inset="0" zIndex={400} display="flex" flexDir="column" justifyContent="flex-end">
                    <Box position="absolute" inset="0" bgColor="rgba(0,0,0,0.5)" onClick={() => { setShowOrderModal(false); setOrderError(''); setOrderAmount(''); setOrderNote(''); }} />
                    <Box position="relative" bgColor="white" borderTopRadius="24px"
                        px="20px" pt="20px" pb="32px" zIndex={1}
                        boxShadow="0 -8px 32px rgba(0,0,0,0.14)">
                        <Box w="36px" h="4px" bgColor="#E0DAD7" borderRadius="full" mx="auto" mb="16px" />
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb="16px">
                            <Text fontWeight="800" color="#1C110D" style={{ fontSize: '17px' }}>📦 Buyurtma berish</Text>
                            <Box w="32px" h="32px" borderRadius="full" bgColor="#F5F5F5"
                                display="flex" alignItems="center" justifyContent="center"
                                cursor="pointer" onClick={() => { setShowOrderModal(false); setOrderError(''); setOrderAmount(''); setOrderNote(''); }}>
                                <FaTimes style={{ fontSize: '13px', color: '#666' }} />
                            </Box>
                        </Box>

                        <Box bgColor="#FFF5F0" borderRadius="12px" px="14px" py="10px" mb="14px"
                            display="flex" alignItems="center" gap="10px">
                            {chef.image
                                ? <img src={chef.image} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                                : <Box w="36px" h="36px" borderRadius="full" bgColor="#C03F0C" display="flex" alignItems="center" justifyContent="center">
                                    <FaUser size={16} color="white" />
                                </Box>
                            }
                            <Box>
                                <Text color="#9B614B" style={{ fontSize: '10px', fontWeight: '700' }}>Oshpaz</Text>
                                <Text fontWeight="800" color="#1C110D" style={{ fontSize: '14px' }}>{fullName}</Text>
                            </Box>
                        </Box>

                        <Box mb="12px">
                            <Text fontWeight="700" color="#1C110D" mb="8px" style={{ fontSize: '13px' }}>
                                Kelishilgan summa (so'm) *
                            </Text>
                            <input
                                type="number"
                                value={orderAmount}
                                onChange={e => { setOrderAmount(e.target.value); setOrderError(''); }}
                                placeholder="Masalan: 150000"
                                style={{
                                    width: '100%', border: '1.5px solid #F0E6E0', outline: 'none',
                                    fontSize: '16px', color: '#1C110D', background: '#FFF5F0',
                                    fontFamily: 'inherit', borderRadius: '12px', padding: '12px 14px',
                                    boxSizing: 'border-box',
                                }}
                            />
                        </Box>

                        <Box mb="14px">
                            <Text fontWeight="700" color="#1C110D" mb="8px" style={{ fontSize: '13px' }}>
                                Izoh (ixtiyoriy)
                            </Text>
                            <textarea
                                value={orderNote}
                                onChange={e => setOrderNote(e.target.value)}
                                placeholder="Taom nomi yoki qo'shimcha ma'lumot..."
                                rows={2}
                                style={{
                                    width: '100%', border: '1.5px solid #F0E6E0', outline: 'none',
                                    fontSize: '14px', color: '#1C110D', background: '#FFF5F0',
                                    resize: 'none', fontFamily: 'inherit', borderRadius: '12px',
                                    padding: '10px', boxSizing: 'border-box',
                                }}
                            />
                        </Box>

                        <Box bgColor="#FFFBEB" borderRadius="10px" px="12px" py="8px" mb="12px" border="1px solid #FDE68A">
                            <Text color="#92400E" style={{ fontSize: '12px', fontWeight: '600' }}>
                                ⚠️ Faqat oshpaz bilan oldindan kelishib, rozilashgandan keyin buyurtma bering
                            </Text>
                        </Box>

                        {orderError && (
                            <Box bgColor="#FFF5F5" borderRadius="10px" px="12px" py="8px" mb="10px" border="1px solid #FECDCA">
                                <Text color="#E53E3E" fontWeight="600" style={{ fontSize: '12px' }}>⚠ {orderError}</Text>
                            </Box>
                        )}

                        {orderSuccess ? (
                            <Box bgColor="#F0FFF4" borderRadius="12px" px="14px" py="12px" border="1px solid #BBF7D0" textAlign="center">
                                <Text color="#22C55E" fontWeight="700" style={{ fontSize: '14px' }}>✅ Buyurtma yuborildi! Oshpaz tasdiqlashini kuting.</Text>
                            </Box>
                        ) : (
                            <Button w="100%" h="48px" bgColor="#C03F0C" color="white" borderRadius="14px"
                                fontWeight="700" style={{ fontSize: '14px' }}
                                isLoading={orderLoading}
                                onClick={handleOrderSubmit}>
                                📦 Buyurtma yuborish
                            </Button>
                        )}
                    </Box>
                </Box>
            )}

            {/* Inline Review Modal (bottom sheet) */}
            {reviewModal && (
                <Box position="fixed" inset="0" zIndex={400} display="flex" flexDir="column" justifyContent="flex-end">
                    {/* Overlay */}
                    <Box position="absolute" inset="0" bgColor="rgba(0,0,0,0.5)" onClick={closeModal} />
                    {/* Sheet */}
                    <Box position="relative" bgColor="white" borderTopRadius="24px"
                        px="20px" pt="20px" pb="32px" zIndex={1}
                        boxShadow="0 -8px 32px rgba(0,0,0,0.14)">
                        {/* Handle */}
                        <Box w="36px" h="4px" bgColor="#E0DAD7" borderRadius="full" mx="auto" mb="16px" />
                        {/* Header */}
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb="16px">
                            <Text fontWeight="800" color="#1C110D" style={{ fontSize: '17px' }}>
                                {reviewModal === 'rating' ? `⭐ ${t('chefView.modalRating')}` : `💬 ${t('chefView.modalComment')}`}
                            </Text>
                            <Box w="32px" h="32px" borderRadius="full" bgColor="#F5F5F5"
                                display="flex" alignItems="center" justifyContent="center"
                                cursor="pointer" onClick={closeModal}>
                                <FaTimes style={{ fontSize: '13px', color: '#666' }} />
                            </Box>
                        </Box>

                        {/* Chef nomi */}
                        <Box bgColor="#FFF5F0" borderRadius="12px" px="14px" py="10px" mb="14px"
                            display="flex" alignItems="center" gap="10px">
                            {chef.image
                                ? <img src={chef.image} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                                : <Box w="36px" h="36px" borderRadius="full" bgColor="#C03F0C"
                                    display="flex" alignItems="center" justifyContent="center">
                                    <FaUser size={16} color="white" />
                                </Box>
                            }
                            <Box>
                                <Text color="#9B614B" style={{ fontSize: '10px', fontWeight: '700' }}>{t('chefView.chefLabel')}</Text>
                                <Text fontWeight="800" color="#1C110D" style={{ fontSize: '14px' }}>{fullName}</Text>
                            </Box>
                        </Box>

                        {/* Yulduzlar */}
                        {reviewModal === 'rating' && (
                            <Box mb="14px">
                                <Text fontWeight="700" color="#1C110D" mb="10px" style={{ fontSize: '13px' }}>{t('chefView.ratingHeader')}</Text>
                                <Box display="flex" justifyContent="center" gap="10px">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <Box key={star} cursor="pointer" onClick={() => setRating(star)}>
                                            <FaStar style={{
                                                fontSize: '34px',
                                                color: star <= rating ? '#F4B400' : '#E0DAD7',
                                                transition: 'color 0.15s'
                                            }} />
                                        </Box>
                                    ))}
                                </Box>
                                {rating > 0 && (
                                    <Text textAlign="center" color="#C03F0C" fontWeight="700" mt="8px" style={{ fontSize: '13px' }}>
                                        {[t('chefView.r1'), t('chefView.r1'), t('chefView.r2'), t('chefView.r3'), t('chefView.r4'), t('chefView.r5')][rating]}
                                    </Text>
                                )}
                            </Box>
                        )}

                        {/* Izoh */}
                        {true && (
                            <Box mb="12px">
                                <Text fontWeight="700" color="#1C110D" mb="8px" style={{ fontSize: '13px' }}>
                                    {reviewModal === 'rating' ? t('chefView.commentOpt') : t('chefView.commentReq')}
                                </Text>
                                <textarea
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    placeholder={t('chefView.placeholder')}
                                    rows={3}
                                    style={{
                                        width: '100%', border: '1.5px solid #F0E6E0', outline: 'none',
                                        fontSize: '14px', color: '#1C110D', background: '#FFF5F0',
                                        resize: 'none', fontFamily: 'inherit', borderRadius: '12px',
                                        padding: '10px',
                                    }}
                                />
                            </Box>
                        )}

                        {reviewError && (
                            <Box bgColor="#FFF5F5" borderRadius="10px" px="12px" py="8px" mb="10px"
                                border="1px solid #FECDCA">
                                <Text color="#E53E3E" fontWeight="600" style={{ fontSize: '12px' }}>⚠ {reviewError}</Text>
                            </Box>
                        )}

                        {reviewSuccess ? (
                            <Box bgColor="#F0FFF4" borderRadius="12px" px="14px" py="12px"
                                border="1px solid #BBF7D0" textAlign="center">
                                <Text color="#22C55E" fontWeight="700" style={{ fontSize: '14px' }}>✅ {t('chefView.saved')}</Text>
                            </Box>
                        ) : (
                            <Button w="100%" h="48px"
                                bgColor="#C03F0C"
                                color="white" borderRadius="14px" fontWeight="700"
                                style={{ fontSize: '14px' }}
                                isLoading={reviewLoading}
                                onClick={handleReviewSubmit}>
                                {reviewModal === 'rating' ? `⭐ ${t('chefView.submitRating')}` : `💬 ${t('chefView.submitComment')}`}
                            </Button>
                        )}
                    </Box>
                </Box>
            )}

            <Box position="absolute" top="14px" left="14px" zIndex={10}>
                <Box w="38px" h="38px" borderRadius="full" bgColor="rgba(255,255,255,0.9)"
                    display="flex" alignItems="center" justifyContent="center" cursor="pointer"
                    boxShadow="0 2px 10px rgba(0,0,0,0.15)" onClick={() => navigate(-1)}>
                    <FaArrowLeft style={{ fontSize: '14px', color: '#1C110D' }} />
                </Box>
            </Box>

            <img src={HeroHeader} alt="" style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }} />

            {/* Avatar */}
            <Box display="flex" flexDir="column" alignItems="center" mt="-44px" px="16px">
                <Box position="relative" cursor="pointer" onClick={() => chef.image && setZoomed(chef.image)} mb="10px">
                    {chef.image
                        ? <img src={chef.image} alt="" style={{ width: '88px', height: '88px', borderRadius: '50%', objectFit: 'cover', border: '4px solid white', boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }} />
                        : <Box w="88px" h="88px" borderRadius="full" bgColor="#C03F0C" border="4px solid white" boxShadow="0 4px 14px rgba(0,0,0,0.12)" display="flex" alignItems="center" justifyContent="center">
                            <FaUser size={32} color="white" />
                        </Box>
                    }
                    <Box position="absolute" bottom="4px" right="4px" w="14px" h="14px" borderRadius="full"
                        bgColor={isOnline ? '#22C55E' : '#D1D5DB'} border="2px solid white" />
                </Box>
                <Text fontWeight="800" color="#1C110D" style={{ fontSize: '22px' }}>{fullName}</Text>
                <Box display="flex" alignItems="center" gap="8px" mt="4px">
                    {isOnline && <Box bgColor="#ECFDF5" borderRadius="8px" px="8px" py="2px">
                        <Text color="#22C55E" fontWeight="700" style={{ fontSize: '11px' }}>● Online</Text>
                    </Box>}
                    <Text color="#9B8E8A" style={{ fontSize: '13px' }}>{chef.exp} {t('chefView.expSuffix')}</Text>
                </Box>
                <Box display="flex" alignItems="center" gap="4px" mt="4px">
                    <FaStar color="#F4B400" style={{ fontSize: '13px' }} />
                    <Text color="#9B8E8A" style={{ fontSize: '13px' }}>
                        {avgRating > 0 ? avgRating : '5.0'} {totalReviews > 0 && `(${totalReviews})`}
                    </Text>
                </Box>
            </Box>

            {/* Stats */}
            <Box mx="16px" mt="16px" bgColor="white" borderRadius="18px" p="16px"
                display="flex" justifyContent="space-around" boxShadow="0 2px 10px rgba(0,0,0,0.06)">
                {[
                    { label: t('chefView.statsExp'), value: `${chef.exp || 0} ${t('common.years')}` },
                    { label: t('chefView.statsRating'), value: avgRating > 0 ? String(avgRating) : '5.0' },
                    { label: t('common.orders'), value: String(chefOrdersCount) },
                ].map((s, i) => (
                    <Box key={i} textAlign="center">
                        <Text fontWeight="800" color="#1C110D" style={{ fontSize: '17px' }}>{s.value}</Text>
                        <Text color="#9B8E8A" style={{ fontSize: '11px' }}>{s.label}</Text>
                    </Box>
                ))}
            </Box>

            {/* Bio */}
            {chef.bio && chef.bio.trim() && (
                <Box mx="16px" mt="12px" bgColor="white" borderRadius="18px" p="16px" boxShadow="0 2px 10px rgba(0,0,0,0.06)">
                    <Text fontWeight="700" color="#1C110D" mb="8px" style={{ fontSize: '15px' }}>{t('chefView.about')}</Text>
                    <Text color="#6B6560" lineHeight="1.7" style={{ fontSize: '13px' }}>{chef.bio}</Text>
                </Box>
            )}

            {/* Gallery */}
            {chefPosts.length > 0 && (
                <Box mx="16px" mt="12px">
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb="10px">
                        <Text fontWeight="700" color="#1C110D" style={{ fontSize: '15px' }}>{t('chefView.dishes')}</Text>
                        <Text color="#9B8E8A" style={{ fontSize: '12px' }}>{chefPosts.length} {t('chefView.dishCount')}</Text>
                    </Box>
                    <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap="6px">
                        {chefPosts.map((post, i) => (
                            <Box key={i} borderRadius="12px" overflow="hidden" cursor="pointer"
                                position="relative" onClick={() => setZoomed(post.image)}>
                                <img src={post.image} alt={post.dishName}
                                    style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                                <Box position="absolute" bottom="0" left="0" right="0"
                                    bgColor="rgba(0,0,0,0.55)" px="6px" py="4px">
                                    <Text color="white" fontWeight="600" noOfLines={1} style={{ fontSize: '11px' }}>
                                        {post.dishName}
                                    </Text>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}

            {/* Customer orders from this chef */}
            {isCustomer && customerOrders.length > 0 && (
                <Box mx="16px" mt="12px">
                    <Text fontWeight="700" color="#1C110D" mb="10px" style={{ fontSize: '15px' }}>{t('chefView.myOrders')}</Text>
                    <Box display="flex" flexDir="column" gap="8px">
                        {customerOrders.map((o, i) => (
                            <Box key={i} bgColor="white" borderRadius="14px" p="12px"
                                boxShadow="0 2px 8px rgba(0,0,0,0.06)"
                                display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Text fontWeight="700" color="#1C110D" style={{ fontSize: '14px' }}>
                                        {o.dishName || t('order.defaultDish')}
                                    </Text>
                                    <Text color="#9B8E8A" style={{ fontSize: '12px' }}>
                                        {new Date(o.createdAt).toLocaleDateString()}
                                    </Text>
                                </Box>
                                <Text fontWeight="800" color="#22C55E" style={{ fontSize: '15px' }}>
                                    {Number(o.amount).toLocaleString()} so'm
                                </Text>
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}

            {/* Izohlar */}
            <Box mx="16px" mt="12px" mb="8px">
                <Box display="flex" justifyContent="space-between" alignItems="center" mb="10px">
                    <Text fontWeight="700" color="#1C110D" style={{ fontSize: '15px' }}>{t('chefView.reviews')}</Text>
                    {reviews.length > 0 && (
                        <Box cursor="pointer" bgColor="#FFF0EC" borderRadius="12px" px="12px" py="6px"
                            border="1.5px solid #F5C5B0"
                            onClick={() => navigate('/chef-all-reviews', { state: { chefPhone: chef.phone, chefName: fullName } })}>
                            <Text color="#C03F0C" fontWeight="700" style={{ fontSize: '12px' }}>{t('chefView.allReviews')}</Text>
                        </Box>
                    )}
                </Box>

                {reviews.length === 0 ? (
                    <Box bgColor="white" borderRadius="16px" p="20px" textAlign="center"
                        boxShadow="0 2px 10px rgba(0,0,0,0.06)">
                        <Text color="#B0A8A4" style={{ fontSize: '13px' }}>{t('chefView.noReviews')}</Text>
                    </Box>
                ) : (
                    <Box display="flex" flexDir="column" gap="10px">
                        {reviews.slice(0, 3).map((r, i) => (
                            <Box key={i} bgColor="white" borderRadius="16px" p="14px"
                                boxShadow="0 2px 10px rgba(0,0,0,0.06)">
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb="6px">
                                    <Text fontWeight="700" color="#1C110D" style={{ fontSize: '14px' }}>
                                        {r.customerName || `+998${r.customerPhone}`}
                                    </Text>
                                    {r.rating > 0 && (
                                        <Box display="flex" gap="2px">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <FaStar key={s} style={{ fontSize: '12px', color: s <= r.rating ? '#F4B400' : '#E0DAD7' }} />
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                                {r.comment && (
                                    <Text color="#6B6560" style={{ fontSize: '13px', lineHeight: '1.5' }}>{r.comment}</Text>
                                )}
                                <Text color="#B0A8A4" style={{ fontSize: '11px' }} mt="6px">
                                    {new Date(r.createdAt).toLocaleDateString('uz-UZ')}
                                </Text>
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>

            {/* Action buttons: Izoh + Xabar yozish + Buyurtma */}
            <Box mx="16px" mt="8px" mb="28px" display="flex" flexDir="column" gap="10px">
                {/* Izoh tugmalari — kichik, yonma-yon */}
                {isCustomer && (
                    <Box display="flex" gap="8px">
                        <Box flex="1" bgColor="#C03F0C" borderRadius="14px" px="14px" py="11px"
                            cursor="pointer" boxShadow="0 2px 8px rgba(192,63,12,0.18)"
                            display="flex" alignItems="center" justifyContent="center" gap="7px"
                            onClick={() => openModal('comment')}>
                            <FaComment size={14} color="white" />
                            <Text fontWeight="700" color="white" style={{ fontSize: '13px' }}>{t('chefView.addComment')}</Text>
                        </Box>
                        <Box flex="1" bgColor="#C03F0C" borderRadius="14px" px="14px" py="11px"
                            cursor="pointer" boxShadow="0 2px 8px rgba(192,63,12,0.18)"
                            display="flex" alignItems="center" justifyContent="center" gap="7px"
                            onClick={() => openModal('rating')}>
                            <FaStar size={14} color="white" />
                            <Text fontWeight="700" color="white" style={{ fontSize: '13px' }}>{t('chefView.addRating')}</Text>
                        </Box>
                    </Box>
                )}
                {/* Xabar yozish */}
                <Button w="100%" h="50px"
                    bgColor="#C03F0C" color="white" borderRadius="14px"
                    fontWeight="700" style={{ fontSize: '15px' }}
                    _hover={{ bgColor: '#a0300a' }}
                    leftIcon={<FaCommentDots size={16} />}
                    onClick={() => navigate('/orderspage', { state: { chefName: fullName, chefPhone: chef.phone } })}>
                    {t('chefView.writeMsg')}
                </Button>
                {/* Buyurtma berish — faqat mijozlar uchun */}
                {isCustomer && (
                    <Button w="100%" h="50px"
                        bgColor={hasPendingOrder ? '#9B8E8A' : '#22C55E'}
                        color="white" borderRadius="14px"
                        fontWeight="700" style={{ fontSize: '15px' }}
                        _hover={{ bgColor: hasPendingOrder ? '#9B8E8A' : '#16a34a' }}
                        leftIcon={<FaShoppingBag size={16} />}
                        disabled={hasPendingOrder}
                        onClick={() => { if (!hasPendingOrder) { setOrderAmount(''); setOrderNote(''); setOrderError(''); setOrderSuccess(false); setShowOrderModal(true); } }}>
                        {hasPendingOrder ? '⏳ Buyurtma kutilmoqda...' : '📦 Buyurtma berish'}
                    </Button>
                )}
            </Box>
        </Box>
    );
};
export default ChefViewPage;