import { Box, Text, Button } from '@chakra-ui/react';
import { FaHome, FaCommentDots, FaUser, FaBell, FaTimes, FaPhone, FaPlus, FaImage, FaMoneyBillWave } from 'react-icons/fa';
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Store from '../store';

const ChefHomePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const fileRef = useRef();
    const notifRef = useRef();

    const session = Store.getSession();
    if (session?.role === 'chef' && session?.data) {
        const existing = localStorage.getItem('chefProfile');
        if (!existing || existing === '{}') {
            localStorage.setItem('chefProfile', JSON.stringify(session.data));
        }
    }
    const chefProfile = JSON.parse(localStorage.getItem("chefProfile")) || (session?.role === 'chef' ? session.data : {});
    const myPhone = chefProfile.phone || "";

    const [posts, setPosts] = useState([]);
    const [showPostModal, setShowPostModal] = useState(false);
    const [postImg, setPostImg] = useState(null);
    const [postName, setPostName] = useState("");
    const [postImgPreview, setPostImgPreview] = useState(null);
    const [activeTab, setActiveTab] = useState('sorovlar');
    const [showNotifPanel, setShowNotifPanel] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [publishLoading, setPublishLoading] = useState(false);
    const [reviewNotifs, setReviewNotifs] = useState([]);
    const [newReviewToast, setNewReviewToast] = useState(null);
    const [unseenReviews, setUnseenReviews] = useState([]);
    const lastReviewCountRef = useRef(null);

    // ─── BUYURTMA MODAL ───────────────────────────────────────
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [orderCustomerName, setOrderCustomerName] = useState('');
    const [orderAmount, setOrderAmount] = useState('');
    const [orderNote, setOrderNote] = useState('');
    const [orderLoading, setOrderLoading] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [orderError, setOrderError] = useState('');
    const [orderNameError, setOrderNameError] = useState('');
    const [chefTotalEarned, setChefTotalEarned] = useState(0);
    const [chefTotalCommission, setChefTotalCommission] = useState(0);
    const [chefOrders, setChefOrders] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [requestActionState, setRequestActionState] = useState({}); // {orderId: 'loading'|'accepted'|'rejected'}

    const fetchPendingRequests = async () => {
        if (!myPhone) return;
        const API_BASE = import.meta.env?.VITE_API_URL || '';
        let apiPending = [];

        try {
            const res = await fetch(`${API_BASE}/orders/chef/${myPhone}`);
            if (res.ok) {
                const data = await res.json();
                const allOrders = Array.isArray(data) ? data : (data.orders || []);
                apiPending = allOrders.filter(o => o.status === 'pending' && o.source === 'customer');
            }
        } catch { }

        // custOrders_ localStorage dan ham pending larni olish
        const localCustOrders = JSON.parse(localStorage.getItem(`custOrders_${myPhone}`) || '[]');
        const localPending = localCustOrders.filter(o => o.status === 'pending');

        // Eski pendingOrder_ formatidan ham olish
        const oldFormatPending = Object.keys(localStorage)
            .filter(key => key.startsWith('pendingOrder_') && key.endsWith(`_${myPhone}`))
            .map(key => {
                try {
                    const val = localStorage.getItem(key);
                    // Agar JSON bo'lsa, orderData; aks holda faqat flag
                    let od;
                    try { od = JSON.parse(val); } catch { od = null; }
                    if (od && od.customerPhone) {
                        return {
                            ...od,
                            _id: od._id || `local_${key}`,
                            id: od.id || `local_${key}`,
                            status: 'pending', source: 'customer'
                        };
                    }
                    return null;
                } catch { return null; }
            })
            .filter(Boolean);

        // Birlashtirish — dublikatlarni oldini olish (customerPhone + time matching)
        const seen = new Set();
        const merged = [];
        [...apiPending, ...localPending, ...oldFormatPending].forEach(o => {
            const key = `${o.customerPhone}_${o.chefPhone || myPhone}`;
            if (!seen.has(key)) {
                seen.add(key);
                merged.push({ ...o, _id: o._id || o.id || `local_${o.customerPhone}` });
            }
        });

        setPendingRequests(merged);
    };

    const handleAcceptRequest = async (order) => {
        const orderId = order._id || order.id || `local_${order.customerPhone}`;
        setRequestActionState(s => ({ ...s, [orderId]: 'loading' }));

        // Offline-first: localStorage ni yangilash
        const custOrders = JSON.parse(localStorage.getItem(`custOrders_${myPhone}`) || '[]');
        const updatedOrders = custOrders.map(o =>
            o.customerPhone === order.customerPhone && o.status === 'pending'
                ? { ...o, status: 'accepted' } : o
        );
        localStorage.setItem(`custOrders_${myPhone}`, JSON.stringify(updatedOrders));
        localStorage.removeItem(`pendingOrder_${order.customerPhone}_${myPhone}`);
        localStorage.removeItem(`pendingCustOrder_${order.customerPhone}_${myPhone}`);

        // Chat xabari
        const chatId = Store.makeChatId(order.customerPhone, myPhone);
        Store.sendMessage(chatId, {
            text: `✅ Buyurtmangiz qabul qilindi! ${Number(order.amount || order.price || 0).toLocaleString()} so'm`,
            sender: 'chef', from: myPhone, to: order.customerPhone,
        });

        // Backend ga yuborish (fire-and-forget)
        const API_BASE = import.meta.env?.VITE_API_URL || '';
        try {
            if (orderId && !String(orderId).startsWith('local_')) {
                await fetch(`${API_BASE}/orders/${orderId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'accepted' }),
                });
            }
            // Oshpaz hisoboti sifatida yangi buyurtma yaratish (source='chef')
            const chefFullName = `${chefProfile.name || ''} ${chefProfile.surname || ''}`.trim();
            await fetch(`${API_BASE}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerPhone: order.customerPhone,
                    customerName: order.customerName || `+998${order.customerPhone}`,
                    chefPhone: myPhone,
                    chefName: chefFullName,
                    amount: order.amount || order.price || 0,
                    note: order.note || '',
                    source: 'chef',
                    status: 'done',
                    createdAt: new Date().toISOString(),
                }),
            });
        } catch { }

        setRequestActionState(s => ({ ...s, [orderId]: 'accepted' }));
        fetchPendingRequests();
        fetchChefTotalEarned();
    };

    const handleRejectRequest = async (order) => {
        const orderId = order._id || order.id || `local_${order.customerPhone}`;
        setRequestActionState(s => ({ ...s, [orderId]: 'loading' }));

        // Offline-first: localStorage ni yangilash
        const custOrders = JSON.parse(localStorage.getItem(`custOrders_${myPhone}`) || '[]');
        const updatedOrders = custOrders.map(o =>
            o.customerPhone === order.customerPhone && o.status === 'pending'
                ? { ...o, status: 'rejected' } : o
        );
        localStorage.setItem(`custOrders_${myPhone}`, JSON.stringify(updatedOrders));
        localStorage.removeItem(`pendingOrder_${order.customerPhone}_${myPhone}`);
        localStorage.removeItem(`pendingCustOrder_${order.customerPhone}_${myPhone}`);

        // Chat xabari
        const chatId = Store.makeChatId(order.customerPhone, myPhone);
        Store.sendMessage(chatId, {
            text: `❌ Buyurtma rad etildi. Boshqa vaqt urinib ko'ring.`,
            sender: 'chef', from: myPhone, to: order.customerPhone,
        });

        // Backend ga yuborish (fire-and-forget)
        const API_BASE = import.meta.env?.VITE_API_URL || '';
        try {
            if (orderId && !String(orderId).startsWith('local_')) {
                await fetch(`${API_BASE}/orders/${orderId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'rejected' }),
                });
            }
        } catch { }

        setRequestActionState(s => ({ ...s, [orderId]: 'rejected' }));
        fetchPendingRequests();
    };

    const fetchChefTotalEarned = async () => {
        if (!myPhone) return;
        try {
            const API_BASE = import.meta.env?.VITE_API_URL || '';
            const r = await fetch(`${API_BASE}/orders/chef/${myPhone}`);
            if (!r.ok) return;
            const data = await r.json();
            if (data?.summary) {
                setChefTotalEarned(data.summary.totalNet || 0);
                setChefTotalCommission(data.summary.totalCommission || 0);
            }
            if (Array.isArray(data?.orders)) {
                setChefOrders(data.orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
            }
        } catch { }
    };

    const handleAddOrder = async () => {
        if (!orderCustomerName.trim()) {
            setOrderNameError(t('order.customerRequired'));
            return;
        }
        if (!orderAmount.trim() || Number(orderAmount) <= 0) {
            setOrderError(t('order.amountError'));
            return;
        }
        setOrderLoading(true);
        setOrderError('');
        setOrderNameError('');

        const API_BASE = import.meta.env?.VITE_API_URL || '';
        const chefFullName = `${chefProfile.name || ''} ${chefProfile.surname || ''}`.trim();
        const input = orderCustomerName.trim();
        const digitsOnly = input.replace(/\D/g, '');
        const isPhone = digitsOnly.length === 9;
        const orderData = {
            customerPhone: isPhone ? digitsOnly : `name_${Date.now()}`,
            customerName: input || "noma'lum",
            chefPhone: myPhone,
            chefName: chefFullName,
            amount: Number(orderAmount),
            note: orderNote,
            source: 'chef',
            status: 'done',
            createdAt: new Date().toISOString(),
        };

        // Offline-first: localStorage ga saqlash
        const existingReported = JSON.parse(localStorage.getItem(`chefReportedOrders_${myPhone}`) || '[]');
        localStorage.setItem(`chefReportedOrders_${myPhone}`, JSON.stringify([orderData, ...existingReported]));

        // Backend ga yuborish
        try {
            const res = await fetch(`${API_BASE}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });
            if (!res.ok) throw new Error();
        } catch {
            // Offline — localStorage da saqlanib qoldi, keyinroq sync bo'ladi
        }

        setOrderSuccess(true);
        fetchChefTotalEarned();
        setTimeout(() => {
            setShowOrderModal(false);
            setOrderSuccess(false);
            setOrderCustomerName('');
            setOrderAmount('');
            setOrderNote('');
            setOrderNameError('');
        }, 1500);
        setOrderLoading(false);
    };

    const fetchReviewNotifs = async () => {
        if (!myPhone) return;
        const lsKey = `reviews_${myPhone}`;
        const seenTs = Number(localStorage.getItem(`reviewsSeenTs_${myPhone}`) || 0);
        const localReviews = JSON.parse(localStorage.getItem(lsKey) || '[]');
        try {
            const API = import.meta.env?.VITE_API_URL || '';
            const res = await fetch(`${API}/reviews/${myPhone}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            const serverReviews = data.reviews || [];
            const merged = [
                ...localReviews.filter(lr =>
                    !serverReviews.some(sr => sr.createdAt === lr.createdAt && sr.customerPhone === lr.customerPhone)
                ),
                ...serverReviews,
            ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            if (lastReviewCountRef.current !== null && merged.length > lastReviewCountRef.current) {
                const newest = merged[0];
                setNewReviewToast(newest);
                setTimeout(() => setNewReviewToast(null), 5000);
            }
            lastReviewCountRef.current = merged.length;
            setReviewNotifs(merged);
            const unseen = merged.filter(r => new Date(r.createdAt).getTime() > seenTs);
            setUnseenReviews(unseen);
        } catch {
            if (localReviews.length > 0) {
                if (lastReviewCountRef.current !== null && localReviews.length > lastReviewCountRef.current) {
                    setNewReviewToast(localReviews[0]);
                    setTimeout(() => setNewReviewToast(null), 5000);
                }
                lastReviewCountRef.current = localReviews.length;
                setReviewNotifs(localReviews);
                const unseen = localReviews.filter(r => new Date(r.createdAt).getTime() > seenTs);
                setUnseenReviews(unseen);
            }
        }
    };

    const refreshNotifs = () => setNotifications(Store.getChefNotifications(myPhone));

    // TelegramId ni backendga saqlash (ogohlantirish ishlashi uchun)
    useEffect(() => {
        if (!myPhone) return;
        const tgId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
        if (!tgId) return;
        const API_BASE = import.meta.env?.VITE_API_URL || '';
        fetch(`${API_BASE}/chefs/${myPhone}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telegramId: String(tgId) }),
        }).catch(() => {});
    }, [myPhone]);

    // Bloklangan oshpazni darhol chiqarish (cache + backend)
    useEffect(() => {
        if (!myPhone) return;
        // Avval cache dan tekshir (darhol)
        const cacheKey = `blk_chef_${myPhone}`;
        const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
        if (cached?.blocked && Date.now() - cached.at < 5 * 60 * 1000) {
            navigate('/blocked', { replace: true }); return;
        }
        // Keyin backenddan tekshir (yangilash)
        const API_BASE = import.meta.env?.VITE_API_URL || '';
        fetch(`${API_BASE}/chefs/${myPhone}`)
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (!data) return;
                if (data.isBlocked) {
                    localStorage.setItem(cacheKey, JSON.stringify({ blocked: true, at: Date.now() }));
                    navigate('/blocked', { replace: true });
                } else {
                    localStorage.removeItem(cacheKey);
                }
            })
            .catch(() => { });
    }, [myPhone]);

    useEffect(() => {
        const refresh = () => {
            if (!myPhone) return;
            setPosts(Store.getPosts().filter(p => p.chefPhone === myPhone));
        };
        const unsub = Store.listenPosts((allPosts) => {
            if (!myPhone) return;
            setPosts(allPosts.filter(p => p.chefPhone === myPhone));
        });
        window.addEventListener('posts-updated', refresh);
        refresh();
        fetchChefTotalEarned();
        fetchReviewNotifs();
        fetchPendingRequests();
        return () => { unsub && unsub(); window.removeEventListener('posts-updated', refresh); };
    }, [myPhone]);

    useEffect(() => {
        const onMsg = () => { refreshNotifs(); };
        window.addEventListener("message-received", onMsg);
        if (myPhone) {
            refreshNotifs();
            const cleanup = Store.startHeartbeat("chef", myPhone);
            let lastNotifsKey = JSON.stringify(Store.getChefNotifications(myPhone).map(n => n.chatId + n.unread));
            let reviewPollCount = 0;
            const pollOrders = setInterval(() => {
                const newNotifs = Store.getChefNotifications(myPhone);
                const newNKey = JSON.stringify(newNotifs.map(n => n.chatId + n.unread));
                if (newNKey !== lastNotifsKey) { lastNotifsKey = newNKey; setNotifications(newNotifs); }
                reviewPollCount++;
                if (reviewPollCount % 5 === 0) { fetchReviewNotifs(); fetchChefTotalEarned(); }
                if (reviewPollCount % 3 === 0) { fetchPendingRequests(); }
            }, 1000);
            return () => { cleanup(); clearInterval(pollOrders); window.removeEventListener("message-received", onMsg); };
        }
        return () => window.removeEventListener("message-received", onMsg);
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifPanel(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const totalUnread = notifications.reduce((s, n) => s + n.unread, 0);

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => { setPostImg(reader.result); setPostImgPreview(reader.result); };
        reader.readAsDataURL(file);
    };

    const [postError, setPostError] = useState("");

    const handlePublish = async () => {
        if (!postImg || !postName.trim()) {
            setPostError(t('chefHome.postRequired') || "Iltimos, rasm va taom nomini kiriting.");
            return;
        }
        setPublishLoading(true);
        setPostError("");
        try {
            await Store.addPost({
                chefPhone: chefProfile.phone || myPhone,
                chefName: `${chefProfile.name || ""} ${chefProfile.surname || ""}`.trim(),
                chefImage: chefProfile.image || null,
                image: postImg,
                dishName: postName.trim(),
            });
            setShowPostModal(false);
            setPostImg(null); setPostImgPreview(null); setPostName("");
        } catch (e) {
            setPostError(t('chefHome.postError') || "Postni saqlab bo'lmadi.");
        }
        setPublishLoading(false);
    };

    return (
        <Box minH="100dvh" bgColor="#FFF5F0" display="flex" flexDir="column">

            {/* SMS kabi yangi izoh ogohlantirishi */}
            {newReviewToast && (
                <Box position="fixed" top="16px" left="50%" zIndex={999}
                    style={{ transform: 'translateX(-50%)', animation: 'slideDown 0.3s ease' }}
                    maxW="380px" w="calc(100% - 32px)"
                    bgColor="white" borderRadius="16px" px="16px" py="12px"
                    boxShadow="0 8px 32px rgba(0,0,0,0.18)"
                    border="1.5px solid #F4B400"
                    display="flex" alignItems="center" gap="12px"
                    cursor="pointer"
                    onClick={() => { setNewReviewToast(null); setActiveTab('reviews'); }}>
                    <Box w="40px" h="40px" borderRadius="full" bgColor="#FFF8E0" flexShrink={0}
                        display="flex" alignItems="center" justifyContent="center" style={{ fontSize: '20px' }}>
                        ⭐
                    </Box>
                    <Box flex="1" minW={0}>
                        <Text fontWeight="800" color="#1C110D" style={{ fontSize: '13px' }}>
                            Yangi izoh keldi!
                        </Text>
                        <Text color="#6B6560" noOfLines={1} style={{ fontSize: '12px' }}>
                            {newReviewToast.customerName || 'Mijoz'}{newReviewToast.rating > 0 ? ` · ${'★'.repeat(newReviewToast.rating)}` : ''}{newReviewToast.comment ? `: ${newReviewToast.comment}` : ''}
                        </Text>
                    </Box>
                    <Box onClick={e => { e.stopPropagation(); setNewReviewToast(null); }}
                        color="#B0A8A4" style={{ fontSize: '16px', flexShrink: 0 }}>✕</Box>
                </Box>
            )}
            <style>{`
                @keyframes slideDown { from { opacity:0; transform:translateX(-50%) translateY(-20px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
                .tabs-scroll::-webkit-scrollbar { display: none; }
            `}</style>

            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center"
                px="16px" py="14px" bgColor="white" boxShadow="0 1px 0 #EBEBEB">
                <Box display="flex" alignItems="center" gap="10px">
                    <Box position="relative" flexShrink={0}>
                        {chefProfile.image
                            ? <img src={chefProfile.image} alt="" style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
                            : <Box w="40px" h="40px" borderRadius="full" bgColor="#C03F0C" display="flex" alignItems="center" justifyContent="center">
                                <FaUser style={{ fontSize: "18px", color: "white" }} />
                            </Box>
                        }
                        <Box position="absolute" bottom="0" right="0" w="10px" h="10px" borderRadius="full" bgColor="#22C55E" border="2px solid white" />
                    </Box>
                    <Box>
                        <Text color="#9B8E8A" style={{ fontSize: "11px" }}>{t("entrance.chefBtn")}</Text>
                        <Text fontWeight="800" color="#1C110D" style={{ fontSize: "17px" }}>
                            {chefProfile.name || ""} {chefProfile.surname || ""}
                        </Text>
                    </Box>
                </Box>
                <Box display="flex" alignItems="center" gap={{ base: "10px", sm: "12px" }}>
                    <Box display="flex" alignItems="center" gap="4px" bgColor="#F0FFF4"
                        borderRadius="full" px={{ base: "7px", sm: "8px" }} py="3px">
                        <Box w="6px" h="6px" borderRadius="full" bgColor="#22C55E" />
                        <Text color="#22C55E" fontWeight="600" style={{ fontSize: "clamp(9px, 2.5vw, 11px)" }}>{t("common.online")}</Text>
                    </Box>
                    <Box position="relative" ref={notifRef}>
                        <Box cursor="pointer" p="4px" onClick={() => {
                            setShowNotifPanel(v => {
                                if (!v) {
                                    localStorage.setItem(`reviewsSeenTs_${myPhone}`, Date.now().toString());
                                    setUnseenReviews([]);
                                }
                                return !v;
                            });
                        }}>
                            <FaBell style={{ fontSize: "clamp(18px, 5vw, 22px)", color: (totalUnread > 0 || unseenReviews.length > 0) ? "#C03F0C" : "#555" }} />
                            {(totalUnread + unseenReviews.length) > 0 && (
                                <Box position="absolute" top="-4px" right="-4px" minW="16px" h="16px" px="3px"
                                    bgColor="#C03F0C" borderRadius="full" display="flex" alignItems="center"
                                    justifyContent="center" color="white" fontWeight="bold" style={{ fontSize: "9px" }}>
                                    {(totalUnread + unseenReviews.length) > 9 ? "9+" : (totalUnread + unseenReviews.length)}
                                </Box>
                            )}
                        </Box>
                        {showNotifPanel && (
                            <Box position="absolute" top="38px" right="0" w={{ base: "270px", sm: "290px" }}
                                bgColor="white" borderRadius="18px" boxShadow="0 8px 32px rgba(0,0,0,0.14)"
                                overflow="hidden" zIndex={200}>
                                <Box px="14px" py="10px" borderBottom="1px solid #F2F2F2"
                                    display="flex" justifyContent="space-between" alignItems="center">
                                    <Text fontWeight="bold" color="#1C110D" style={{ fontSize: "clamp(12px, 3.2vw, 13px)" }}>{t("chefMessages.title")}</Text>
                                    {totalUnread > 0 && (
                                        <Box bgColor="#FFF0EC" color="#C03F0C" borderRadius="full" px="8px" py="2px"
                                            style={{ fontSize: "10px", fontWeight: "bold" }}>{totalUnread} {t("chefHome.newMsg")}</Box>
                                    )}
                                </Box>
                                {notifications.length === 0 && unseenReviews.length === 0 ? (
                                    <Box py="20px" textAlign="center">
                                        <Text color="#9B614B" style={{ fontSize: "clamp(11px, 3vw, 12px)" }}>{t("glabal.noNotif")}</Text>
                                    </Box>
                                ) : null}
                                {unseenReviews.slice(0, 3).map((r, i) => (
                                    <Box key={`rev-${i}`} display="flex" alignItems="flex-start" gap="10px"
                                        px="12px" py="10px" cursor="pointer"
                                        borderBottom="1px solid #F5F5F5"
                                        bgColor="#FFFBF5"
                                        _hover={{ bgColor: "#FFF5F2" }}
                                        onClick={() => {
                                            localStorage.setItem(`reviewsSeenTs_${myPhone}`, Date.now().toString());
                                            setUnseenReviews([]);
                                            setShowNotifPanel(false);
                                            setActiveTab('reviews');
                                        }}>
                                        <Box borderRadius="full" bgColor="#F4B400" flexShrink={0}
                                            display="flex" alignItems="center" justifyContent="center"
                                            color="white" fontWeight="bold"
                                            style={{ width: "34px", height: "34px", fontSize: "14px" }}>
                                            ★
                                        </Box>
                                        <Box flex="1" minW={0}>
                                            <Text fontWeight="bold" color="#1C110D" style={{ fontSize: "12px" }}>
                                                {r.customerName || `+998${r.customerPhone}`}
                                            </Text>
                                            <Text color="#9B614B" noOfLines={1} style={{ fontSize: "11px" }}>
                                                {r.rating > 0 ? `${'★'.repeat(r.rating)} ` : ''}{r.comment || t('chefHome.reviews')}
                                            </Text>
                                        </Box>
                                    </Box>
                                ))}
                                {notifications.map((n, i) => (
                                    <Box key={i} display="flex" alignItems="center" gap="10px"
                                        px="12px" py="10px" cursor="pointer"
                                        borderBottom={i < notifications.length - 1 ? "1px solid #F5F5F5" : "none"}
                                        _hover={{ bgColor: "#FFF5F2" }}
                                        onClick={() => { setShowNotifPanel(false); navigate('/chef-messages', { state: { chatId: n.chatId, customerPhone: n.customerPhone } }); }}>
                                        <Box borderRadius="full" bgColor="#C03F0C" flexShrink={0}
                                            display="flex" alignItems="center" justifyContent="center"
                                            color="white" fontWeight="bold"
                                            style={{ width: "clamp(34px, 9vw, 40px)", height: "clamp(34px, 9vw, 40px)", fontSize: "clamp(13px, 3.5vw, 15px)" }}>
                                            {n.customerPhone?.charAt(0) || "M"}
                                        </Box>
                                        <Box flex="1" minW={0}>
                                            <Text fontWeight="bold" color="#1C110D" style={{ fontSize: "clamp(12px, 3.2vw, 13px)" }}>+998{n.customerPhone}</Text>
                                            <Text color="#9B614B" noOfLines={1} style={{ fontSize: "clamp(10px, 2.5vw, 11px)" }}>{n.lastMsg}</Text>
                                        </Box>
                                        <Box bgColor="#C03F0C" color="white" borderRadius="full" fontWeight="bold"
                                            minW="20px" h="20px" display="flex" alignItems="center" justifyContent="center"
                                            px="3px" flexShrink={0} style={{ fontSize: "10px" }}>
                                            {n.unread > 9 ? "9+" : n.unread}
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Box>
                </Box>
            </Box>

            <Box flex="1" pb="80px">
                {/* Tabs */}
                <Box display="flex" alignItems="center" pt="14px" pb="10px">
                    {/* Scrollable tab buttons */}
                    <Box className="tabs-scroll" display="flex" gap="8px" overflowX="auto" flex="1" pl="16px" pr="4px"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
                    {[
                        { key: 'sorovlar', label: `So'rovlar${pendingRequests.length > 0 ? ` (${pendingRequests.length})` : ""}` },
                        { key: 'reviews', label: `${t("chefHome.reviews")}${reviewNotifs.length > 0 ? ` (${reviewNotifs.length})` : ""}` },
                        { key: 'posts', label: `${t("chefHome.posts")}${posts.length > 0 ? ` (${posts.length})` : ""}` }
                    ].map(tab => (
                        <Button key={tab.key} borderRadius="20px" fontWeight="600" flexShrink={0}
                            bgColor={activeTab === tab.key ? '#C03F0C' : 'white'}
                            color={activeTab === tab.key ? 'white' : '#9B614B'}
                            border="1.5px solid" borderColor={activeTab === tab.key ? '#C03F0C' : '#F0E6E0'}
                            _hover={{ opacity: 0.9 }} onClick={() => setActiveTab(tab.key)}
                            style={{ height: "38px", fontSize: "13px", padding: "0 16px", borderRadius: "20px" }}>
                            {tab.label}
                        </Button>
                    ))}
                    </Box>
                    {/* Post button — outside scrollable area, always visible */}
                    <Box px="8px" flexShrink={0}>
                        <Button bgColor="#FFF0EC" color="#C03F0C"
                            border="1.5px solid #F5C5B0" borderRadius="20px" fontWeight="600"
                            _hover={{ bgColor: '#FFE0D0' }}
                            style={{ height: "38px", fontSize: "13px", padding: "0 14px", whiteSpace: "nowrap" }}
                            onClick={() => setShowPostModal(true)}>
                            <FaPlus style={{ marginRight: "5px", fontSize: "10px" }} /> Post
                        </Button>
                    </Box>
                </Box>

                {/* SO'ROVLAR + HISOBOT — bitta sahifada */}
                {activeTab === 'sorovlar' && (
                    <Box px="16px" display="flex" flexDir="column" gap="10px">

                        {/* Naqd to'lov qo'shish tugmasi */}
                        <Button w="100%" bgColor="#22C55E" color="white" borderRadius="16px"
                            fontWeight="700" _hover={{ bgColor: '#16a34a' }}
                            style={{ height: "50px", fontSize: "15px" }}
                            onClick={() => setShowOrderModal(true)}>
                            <FaMoneyBillWave style={{ marginRight: "8px" }} />
                            {t('order.addBtn') || "Buyurtma qo'shish (naqd to'lov)"}
                        </Button>

                        {/* Kutayotgan so'rovlar */}
                        {pendingRequests.length > 0 && (
                            <Box display="flex" alignItems="center" gap="8px" mt="4px">
                                <Text fontWeight="700" color="#1C110D" style={{ fontSize: "14px" }}>Kutayotgan so'rovlar</Text>
                                <Box bgColor="#FDE68A" borderRadius="10px" px="8px" py="2px">
                                    <Text color="#92400E" fontWeight="700" style={{ fontSize: "11px" }}>{pendingRequests.length} ta</Text>
                                </Box>
                            </Box>
                        )}

                        {pendingRequests.map(request => {
                            const orderId = request._id || request.id || `local_${request.customerPhone}`;
                            const actionState = requestActionState[orderId];
                            return (
                                <Box key={orderId} bgColor="white" borderRadius="18px"
                                    p="14px" boxShadow="0 2px 12px rgba(192,63,12,0.10)"
                                    border="1.5px solid #FDE68A">
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb="10px">
                                        <Box bgColor="#FFFBEB" borderRadius="8px" px="10px" py="4px" border="1px solid #FDE68A">
                                            <Text color="#92400E" fontWeight="700" style={{ fontSize: "11px" }}>🆕 Yangi buyurtma</Text>
                                        </Box>
                                        <Text color="#B0A8A4" style={{ fontSize: "11px" }}>
                                            {new Date(request.createdAt).toLocaleDateString('uz-UZ')} {new Date(request.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </Box>
                                    <Box display="flex" alignItems="center" gap="12px" mb="10px">
                                        <Box w="44px" h="44px" borderRadius="full" bgColor="#F59E0B" flexShrink={0}
                                            display="flex" alignItems="center" justifyContent="center"
                                            color="white" fontWeight="bold" style={{ fontSize: "17px" }}>
                                            {(request.customerName || request.customerPhone || 'M').charAt(0).toUpperCase()}
                                        </Box>
                                        <Box flex="1" minW={0}>
                                            <Text fontWeight="800" color="#1C110D" style={{ fontSize: "14px" }}>
                                                {request.customerName || "Noma'lum mijoz"}
                                            </Text>
                                            <Text color="#9B614B" style={{ fontSize: "12px" }}>
                                                📞 +998{request.customerPhone}
                                            </Text>
                                        </Box>
                                    </Box>
                                    {request.note && (
                                        <Box bgColor="#FFF5F0" borderRadius="10px" px="10px" py="8px" mb="10px">
                                            <Text color="#6B6560" style={{ fontSize: "13px" }}>💬 {request.note}</Text>
                                        </Box>
                                    )}
                                    {actionState === 'accepted' ? (
                                        <Box bgColor="#F0FFF4" borderRadius="12px" py="10px" textAlign="center" border="1px solid #BBF7D0">
                                            <Text color="#22C55E" fontWeight="700" style={{ fontSize: "13px" }}>✅ Qabul qilindi</Text>
                                        </Box>
                                    ) : actionState === 'rejected' ? (
                                        <Box bgColor="#FEF2F2" borderRadius="12px" py="10px" textAlign="center" border="1px solid #FECDCA">
                                            <Text color="#EF4444" fontWeight="700" style={{ fontSize: "13px" }}>❌ Rad etildi</Text>
                                        </Box>
                                    ) : (
                                        <Box display="flex" gap="8px">
                                            <Button flex="1" bgColor="#22C55E" color="white" borderRadius="12px"
                                                fontSize="13px" fontWeight="700" h="42px"
                                                isLoading={actionState === 'loading'}
                                                _hover={{ bgColor: '#16a34a' }}
                                                onClick={() => handleAcceptRequest(request)}>
                                                ✅ Qabul qilish
                                            </Button>
                                            <Button flex="1" bgColor="#EF4444" color="white" borderRadius="12px"
                                                fontSize="13px" fontWeight="700" h="42px"
                                                isLoading={actionState === 'loading'}
                                                _hover={{ bgColor: '#dc2626' }}
                                                onClick={() => handleRejectRequest(request)}>
                                                ❌ Rad etish
                                            </Button>
                                        </Box>
                                    )}
                                </Box>
                            );
                        })}

                        {pendingRequests.length === 0 && (
                            <Box textAlign="center" py="32px">
                                <FaMoneyBillWave style={{ fontSize: "36px", color: "#E8D6CF", display: "block", margin: "0 auto 12px" }} />
                                <Text color="#9B614B" style={{ fontSize: "14px" }}>Hali so'rov yo'q</Text>
                                <Text color="#B0A8A4" mt="6px" style={{ fontSize: "12px" }}>Mijozlar buyurtma yuborganda bu yerda ko'rinadi</Text>
                            </Box>
                        )}
                    </Box>
                )}

                {/* IZOHLAR */}
                {activeTab === 'reviews' && (
                    <Box px="16px" display="flex" flexDir="column" gap="10px">
                        {reviewNotifs.length > 0 && (
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb="2px">
                                <Box display="flex" alignItems="center" gap="8px">
                                    <Text fontWeight="700" color="#1C110D" style={{ fontSize: "15px" }}>Izohlar</Text>
                                    <Box bgColor="#FFF0EC" borderRadius="10px" px="8px" py="3px">
                                        <Text color="#C03F0C" fontWeight="700" style={{ fontSize: "12px" }}>{reviewNotifs.length} ta</Text>
                                    </Box>
                                </Box>
                                <Box cursor="pointer" bgColor="#FFF0EC" borderRadius="12px" px="12px" py="6px"
                                    border="1.5px solid #F5C5B0"
                                    onClick={() => navigate('/chef-all-reviews', {
                                        state: {
                                            chefPhone: myPhone,
                                            chefName: `${chefProfile.name || ''} ${chefProfile.surname || ''}`.trim()
                                        }
                                    })}>
                                    <Text color="#C03F0C" fontWeight="700" style={{ fontSize: "12px" }}>Hammasi →</Text>
                                </Box>
                            </Box>
                        )}

                        {reviewNotifs.length === 0 ? (
                            <Box textAlign="center" py="40px">
                                <Box style={{ fontSize: '36px', marginBottom: '10px' }}>💬</Box>
                                <Text color="#9B614B" style={{ fontSize: "14px" }}>{t("chefHome.noReviews")}</Text>
                            </Box>
                        ) : reviewNotifs.slice(0, 3).map((r, i) => (
                            <Box key={r._id || r.createdAt || i} bgColor="white" borderRadius="18px" p="14px"
                                boxShadow="0 2px 12px rgba(192,63,12,0.06)">
                                <Box display="flex" alignItems="center" gap="10px" mb={r.comment ? "8px" : "0"}>
                                    <Box w="38px" h="38px" borderRadius="full" bgColor="#C03F0C" flexShrink={0}
                                        display="flex" alignItems="center" justifyContent="center"
                                        color="white" fontWeight="700" style={{ fontSize: "15px" }}>
                                        {(r.customerName?.charAt(0) || 'M').toUpperCase()}
                                    </Box>
                                    <Box flex="1" minW={0}>
                                        <Text fontWeight="700" color="#1C110D" style={{ fontSize: "14px" }}>
                                            {r.customerName || `+998${r.customerPhone}`}
                                        </Text>
                                        <Box display="flex" alignItems="center" gap="6px">
                                            {r.rating > 0 && (
                                                <Box display="flex" gap="1px">
                                                    {[1, 2, 3, 4, 5].map(s => (
                                                        <span key={s} style={{ fontSize: '12px', color: s <= r.rating ? '#F4B400' : '#E0DAD7' }}>★</span>
                                                    ))}
                                                </Box>
                                            )}
                                            <Text color="#B0A8A4" style={{ fontSize: "11px" }}>
                                                {new Date(r.createdAt).toLocaleDateString('uz-UZ')}
                                            </Text>
                                        </Box>
                                    </Box>
                                </Box>
                                {r.comment && (
                                    <Box bgColor="#FFF5F0" borderRadius="10px" px="12px" py="8px">
                                        <Text color="#4A3728" style={{ fontSize: "13px", lineHeight: "1.6" }}>{r.comment}</Text>
                                    </Box>
                                )}
                            </Box>
                        ))}
                    </Box>
                )}

                {/* POSTLAR */}
                {activeTab === 'posts' && (
                    <Box px="16px">
                        {posts.length === 0 && (
                            <Box textAlign="center" py="40px">
                                <FaImage style={{ fontSize: "36px", color: "#E8D6CF", display: "block", margin: "0 auto 12px" }} />
                                <Text color="#9B614B" style={{ fontSize: "clamp(13px, 3.5vw, 14px)" }}>{t("chefHome.noPost")}</Text>
                            </Box>
                        )}
                        <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap="10px">
                            {posts.map(p => (
                                <Box key={p.id} borderRadius="16px" overflow="hidden" bgColor="white"
                                    boxShadow="0 2px 10px rgba(192,63,12,0.08)" position="relative">
                                    <img src={p.image} alt={p.dishName}
                                        style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
                                    <Box px="10px" py="8px">
                                        <Text fontWeight="600" color="#1C110D" noOfLines={1}
                                            style={{ fontSize: "clamp(12px, 3.2vw, 13px)" }}>{p.dishName}</Text>
                                    </Box>
                                    <Box position="absolute" top="6px" right="6px" w="22px" h="22px"
                                        bgColor="rgba(0,0,0,0.5)" borderRadius="full"
                                        display="flex" alignItems="center" justifyContent="center"
                                        cursor="pointer" onClick={() => Store.deletePost(p.id)}>
                                        <FaTimes style={{ fontSize: "9px", color: "white" }} />
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                )}
            </Box>

            {/* BUYURTMA QO'SHISH MODAL */}
            {showOrderModal && (
                <Box position="fixed" inset="0" bgColor="rgba(0,0,0,0.6)" zIndex={200}
                    display="flex" alignItems="flex-end" justifyContent="center"
                    onClick={() => setShowOrderModal(false)}>
                    <Box bgColor="white" w="100%" maxW="430px" borderRadius="24px 24px 0 0"
                        p="24px" onClick={e => e.stopPropagation()}>
                        <Text fontWeight="800" color="#1C110D" mb="4px" style={{ fontSize: "18px" }}>
                            {t('order.addTitle') || "Yangi buyurtma"}
                        </Text>
                        <Text color="#9B614B" mb="16px" style={{ fontSize: "13px" }}>
                            {t('order.addDesc') || "Mijoz naqd to'lagandan keyin kiriting"}
                        </Text>

                        {chefTotalEarned > 0 && (
                            <Box mb="12px" p="8px" bgColor="#F0FFF4" borderRadius="12px" border="1px solid #BBF7D0">
                                <Text fontWeight="600" color="#22C55E" style={{ fontSize: "12px" }}>
                                    Sizning jami daromadingiz: {chefTotalEarned.toLocaleString()} so'm
                                </Text>
                                {chefTotalCommission > 0 && (
                                    <Text fontWeight="600" color="#C03F0C" style={{ fontSize: "11px", marginTop: "4px" }}>
                                        Komissiya: {chefTotalCommission.toLocaleString()} so'm
                                    </Text>
                                )}
                            </Box>
                        )}

                        <Box mb="12px">
                            <Text fontWeight="600" mb="6px" style={{ fontSize: "12px", color: orderNameError ? "#E53E3E" : "#9B614B" }}>
                                {t('order.customerName')} <span style={{ color: '#C03F0C' }}>*</span>
                            </Text>
                            <Box display="flex" alignItems="center" borderRadius="14px"
                                px="14px" border={`1.5px solid ${orderNameError ? '#E53E3E' : '#F0E6E0'}`}
                                bgColor={orderNameError ? "#FFF5F5" : "#FFF5F0"} style={{ height: "48px" }}>
                                <input
                                    value={orderCustomerName}
                                    onChange={e => { setOrderCustomerName(e.target.value); setOrderNameError(''); }}
                                    placeholder={t('order.customerPlaceholder')}
                                    style={{ width: "100%", border: "none", outline: "none", fontSize: "15px", color: "#1C110D", background: "transparent" }} />
                            </Box>
                            {orderNameError && <Text color="#E53E3E" mt="4px" style={{ fontSize: "12px" }}>⚠ {orderNameError}</Text>}
                        </Box>

                        <Box mb="12px">
                            <Text fontWeight="600" color="#9B614B" mb="6px" style={{ fontSize: "12px" }}>
                                {t('order.amount') || "Mijoz to'lagan summa (so'm)"} <span style={{ color: '#C03F0C' }}>*</span>
                            </Text>
                            <Box display="flex" alignItems="center" bgColor="#FFF5F0" borderRadius="14px"
                                px="14px" border={`1.5px solid ${orderError ? '#E53E3E' : '#F0E6E0'}`} style={{ height: "48px" }}>
                                <input value={orderAmount} onChange={e => { setOrderAmount(e.target.value.replace(/\D/g, '')); setOrderError(''); }}
                                    placeholder="50000"
                                    style={{ width: "100%", border: "none", outline: "none", fontSize: "15px", color: "#1C110D", background: "transparent" }} />
                                <Text color="#9B614B" fontWeight="600" style={{ fontSize: "13px" }}>so'm</Text>
                            </Box>
                            {orderError && <Text color="#E53E3E" mt="4px" style={{ fontSize: "12px" }}>⚠ {orderError}</Text>}
                        </Box>

                        {orderAmount && Number(orderAmount) > 0 && (
                            <Box mb="14px" bgColor="#F0FFF4" borderRadius="14px" px="14px" py="10px"
                                border="1px solid #BBF7D0">
                                <Box display="flex" justifyContent="space-between" mb="4px">
                                    <Text color="#9B614B" style={{ fontSize: "12px" }}>{t('order.totalLabel') || "Jami:"}</Text>
                                    <Text fontWeight="700" color="#1C110D" style={{ fontSize: "13px" }}>
                                        {Number(orderAmount).toLocaleString()} so'm
                                    </Text>
                                </Box>
                                <Box display="flex" justifyContent="space-between" mb="4px">
                                    <Text color="#9B614B" style={{ fontSize: "12px" }}>{t('order.commissionLabel') || "Komissiya (10%):"}</Text>
                                    <Text fontWeight="700" color="#C03F0C" style={{ fontSize: "13px" }}>
                                        -{Math.round(Number(orderAmount) * 0.1).toLocaleString()} so'm
                                    </Text>
                                </Box>
                                <Box display="flex" justifyContent="space-between">
                                    <Text color="#9B614B" style={{ fontSize: "12px" }}>{t('order.netLabel') || "Sizga qoladi:"}</Text>
                                    <Text fontWeight="800" color="#22C55E" style={{ fontSize: "14px" }}>
                                        {Math.round(Number(orderAmount) * 0.9).toLocaleString()} so'm
                                    </Text>
                                </Box>
                            </Box>
                        )}

                        {orderSuccess && (
                            <Box mb="12px" bgColor="#F0FFF4" borderRadius="14px" px="14px" py="10px"
                                border="1px solid #BBF7D0" textAlign="center">
                                <Text fontWeight="700" color="#22C55E" style={{ fontSize: "14px" }}>
                                    ✅ {t('order.success') || "Buyurtma saqlandi!"}
                                </Text>
                            </Box>
                        )}

                        <Box display="flex" gap="10px" mt="4px">
                            <Button flex="1" bgColor="#F5F0EE" color="#9B614B" borderRadius="26px"
                                style={{ height: "50px", fontSize: "14px" }}
                                onClick={() => { setShowOrderModal(false); setOrderError(''); setOrderNameError(''); }}>
                                {t('chefHome.cancel') || "Bekor"}
                            </Button>
                            <Button flex="1" bgColor="#22C55E" color="white" borderRadius="26px"
                                fontWeight="700" _hover={{ bgColor: '#16a34a' }}
                                isLoading={orderLoading}
                                style={{ height: "50px", fontSize: "14px" }}
                                onClick={handleAddOrder}>
                                {t('order.saveBtn') || "Saqlash"}
                            </Button>
                        </Box>
                    </Box>
                </Box>
            )}

            {/* Post Modal */}
            {showPostModal && (
                <Box position="fixed" inset="0" bgColor="rgba(0,0,0,0.6)" zIndex={200}
                    display="flex" alignItems="flex-end" justifyContent="center"
                    onClick={() => setShowPostModal(false)}>
                    <Box bgColor="white" w="100%" maxW="430px" className="bottom-sheet"
                        onClick={e => e.stopPropagation()}>
                        <Text fontWeight="bold" color="#1C110D" mb={{ base: "14px", sm: "16px" }}
                            style={{ fontSize: "clamp(16px, 4.5vw, 18px)" }}>
                            {t("chefHome.newPost")}
                        </Text>
                        <Box w="100%" borderRadius="14px" border="2px dashed #F0E6E0" bgColor="#FAFAFA"
                            display="flex" alignItems="center" justifyContent="center"
                            cursor="pointer" overflow="hidden" onClick={() => fileRef.current?.click()}
                            style={{ height: "clamp(150px, 40vw, 190px)" }}>
                            {postImgPreview ? (
                                <img src={postImgPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                                <Box textAlign="center">
                                    <FaImage style={{ fontSize: "clamp(26px, 7vw, 32px)", color: "#C03F0C", margin: "0 auto 8px" }} />
                                    <Text color="#9B614B" style={{ fontSize: "clamp(12px, 3.2vw, 13px)" }}>{t("chefHome.selectImage")}</Text>
                                </Box>
                            )}
                        </Box>
                        <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImageSelect} />
                        <Box mt="12px">
                            <Text fontWeight="600" color="#9B614B" mb="6px" style={{ fontSize: "clamp(12px, 3.2vw, 13px)" }}>{t("chefHome.dishName")}</Text>
                            <Box display="flex" alignItems="center" bgColor="#FFF5F0" borderRadius="14px"
                                px="14px" border="1.5px solid #F0E6E0" style={{ height: "clamp(42px, 11vw, 48px)" }}>
                                <input value={postName} onChange={e => setPostName(e.target.value)}
                                    placeholder={t("chefHome.dishPlaceholder")}
                                    style={{ width: "100%", border: "none", outline: "none", fontSize: "16px", color: "#1C110D", background: "transparent" }} />
                            </Box>
                        </Box>
                        {postError && (
                            <Box mt="10px" px="10px" py="8px" bgColor="#FFF5F5" border="1px solid #F5C2C7" borderRadius="12px">
                                <Text fontSize="13px" color="#C53030">{postError}</Text>
                            </Box>
                        )}
                        <Box display="flex" gap={{ base: "8px", sm: "10px" }} mt={{ base: "14px", sm: "16px" }}>
                            <Button flex="1" bgColor="#F5F0EE" color="#9B614B" borderRadius="26px"
                                style={{ height: "50px", fontSize: "14px" }}
                                onClick={() => { setShowPostModal(false); setPostImg(null); setPostImgPreview(null); setPostName(""); }}>
                                {t("chefHome.cancel")}
                            </Button>
                            <Button flex="1"
                                bgColor={postImg && postName.trim() ? "#C03F0C" : "#E8D6CF"}
                                color="white" borderRadius="26px" fontWeight="700"
                                isLoading={publishLoading}
                                loadingText={t("chefHome.loading")}
                                style={{ height: "50px", fontSize: "14px" }}
                                onClick={handlePublish} isDisabled={!postImg || !postName.trim() || publishLoading}>
                                {t("chefHome.publish")}
                            </Button>
                        </Box>
                    </Box>
                </Box>
            )}

            {/* Bottom Nav */}
            <Box className="fixed-bottom" bgColor="white" borderTop="1px solid #F0EBE6"
                display="flex" justifyContent="space-around" alignItems="center"
                py="10px" zIndex={10}>
                {[
                    { icon: FaHome, route: '/chef-home', labelKey: 'nav.home', badge: 0 },
                    { icon: FaCommentDots, route: '/chef-messages', labelKey: 'nav.messages', badge: totalUnread },
                    { icon: FaUser, route: '/chef-profile', labelKey: 'nav.profile', badge: 0 },
                ].map(tab => (
                    <Box key={tab.route} display="flex" flexDir="column" alignItems="center"
                        cursor="pointer" px={{ base: "14px", sm: "20px" }} onClick={() => navigate(tab.route)}
                        position="relative">
                        <Box position="relative" display="inline-block">
                            <tab.icon style={{ fontSize: "clamp(18px, 5vw, 22px)", color: location.pathname === tab.route ? '#C03F0C' : '#B0A8A4' }} />
                            {tab.badge > 0 && (
                                <Box position="absolute" top="-5px" right="-8px"
                                    minW="16px" h="16px" px="3px"
                                    bgColor="#C03F0C" borderRadius="full"
                                    display="flex" alignItems="center" justifyContent="center"
                                    color="white" fontWeight="bold" style={{ fontSize: "9px" }}>
                                    {tab.badge > 9 ? "9+" : tab.badge}
                                </Box>
                            )}
                        </Box>
                        <Text mt="3px" fontWeight="bold"
                            style={{ fontSize: "clamp(9px, 2.5vw, 11px)", color: location.pathname === tab.route ? '#C03F0C' : '#B0A8A4' }}>
                            {t(tab.labelKey)}
                        </Text>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

export default ChefHomePage;
