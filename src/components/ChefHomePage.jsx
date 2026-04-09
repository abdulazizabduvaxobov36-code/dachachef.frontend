import { Box, Text, Button } from '@chakra-ui/react';
import { FaHome, FaCommentDots, FaUser, FaBell, FaTimes, FaPhone, FaPlus, FaImage, FaCheck, FaMoneyBillWave } from 'react-icons/fa';
import { useState, useRef, useEffect, useCallback } from 'react';
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
    const [activeTab, setActiveTab] = useState('orders');
    const [showNotifPanel, setShowNotifPanel] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [publishLoading, setPublishLoading] = useState(false);

    // ─── BUYURTMA MODAL ───────────────────────────────────────
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [orderCustomerName, setOrderCustomerName] = useState('');
    const [orderDishName, setOrderDishName] = useState(''); // Olib tashlandi, chunki oshpaz bir nechta taom tayyorlaydi
    const [orderAmount, setOrderAmount] = useState('');
    const [orderNote, setOrderNote] = useState('');
    const [orderLoading, setOrderLoading] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [orderError, setOrderError] = useState('');
    const [customerOrderCount, setCustomerOrderCount] = useState(0); // Mijozning oldingi buyurtmalari soni
    const [chefTotalEarned, setChefTotalEarned] = useState(0); // Oshpazning jami pul yig'ishi
    const [chefTotalCommission, setChefTotalCommission] = useState(0); // Oshpazning jami komissiyasi

    // Oshpazning jami pul yig'ishini olish
    const fetchChefTotalEarned = async () => {
        if (!myPhone) return;
        const AUTH_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const r = await fetch(`${AUTH_BASE}/orders/chef/${myPhone}`);
        if (!r.ok) return;
        const data = await r.json();
        if (data && data.summary) {
            setChefTotalEarned(data.summary.totalNet || 0); // Oshpazga qolgan pul
            setChefTotalCommission(data.summary.totalCommission || 0); // Oshpazning jami komissiyasi
        }
    };

    // Mijozning barcha buyurtmalarini olish
    const fetchCustomerAllOrders = async (customerPhone) => {
        if (!customerPhone) return;
        const data = await Store.getCustomerAllOrders(customerPhone);
        if (data) {
            setCustomerOrderCount(data.totalOrders || 0);
        }
    };

    // Mijozning oldingi buyurtmalar sonini olish
    const fetchCustomerOrderCount = async (customerPhone) => {
        if (!customerPhone || !myPhone) return;
        const data = await Store.getCustomerOrdersForChef(customerPhone, myPhone);
        if (data) {
            setCustomerOrderCount(data.ordersCount || 0);
        }
    };

    // Mijoz ismi o'zgarganda buyurtmalar sonini yangilash
    const handleCustomerNameChange = (value) => {
        setOrderCustomerName(value);
        if (value && value.trim()) {
            fetchCustomerOrderCount(value); // Endi faqat o'sha oshpazga berilganlar
        } else {
            setCustomerOrderCount(0);
        }
    };

    const handleAddOrder = async () => {
        if (!orderAmount.trim() || Number(orderAmount) <= 0) {
            setOrderError(t('order.amountError') || "Summa kiritilmagan");
            return;
        }
        setOrderLoading(true);
        setOrderError('');
        try {
            const AUTH_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await fetch(`${AUTH_BASE}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerPhone: orderCustomerName || 'noma\'lum',
                    customerName: orderCustomerName,
                    chefPhone: myPhone,
                    chefName: `${chefProfile.name || ''} ${chefProfile.surname || ''}`.trim(),
                    amount: Number(orderAmount),
                    note: orderNote,
                }),
            });
            if (res.ok) {
                setOrderSuccess(true);
                setTimeout(() => {
                    setShowOrderModal(false);
                    setOrderSuccess(false);
                    setOrderCustomerName('');
                    setOrderAmount('');
                    setOrderNote('');
                }, 1500);
            } else {
                setOrderError(t('order.saveError') || "Saqlashda xato");
            }
        } catch {
            setOrderError(t('order.serverError') || "Server bilan aloqa yo'q");
        }
        setOrderLoading(false);
    };

    const getOrders = () => {
        const keys = Object.keys(localStorage).filter(k =>
            k.startsWith("chat_") && k.includes(`_${myPhone}`)
        );
        return keys.map(k => {
            const chatId = k.replace("chat_", "");
            if (localStorage.getItem(`accepted_${chatId}`)) return null;
            const msgs = Store.getMessages(chatId);
            if (msgs.length === 0) return null;
            const customerPhone = chatId.replace(`_${myPhone}`, "");
            const preview = msgs.slice(-4);
            const unread = Store.getUnread(chatId, myPhone);
            return { chatId, customerPhone, msgs, preview, unread, lastMsg: msgs[msgs.length - 1] };
        }).filter(Boolean);
    };

    const [orders, setOrders] = useState(getOrders);

    const refreshNotifs = () => setNotifications(Store.getChefNotifications(myPhone));

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
        
        // Oshpazning jami pul yig'ishini yuklash
        fetchChefTotalEarned();
        
        return () => { unsub && unsub(); window.removeEventListener('posts-updated', refresh); };
    }, [myPhone]);

    useEffect(() => {
        const onMsg = () => { setOrders(getOrders()); refreshNotifs(); };
        window.addEventListener("message-received", onMsg);
        if (myPhone) {
            refreshNotifs();
            const cleanup = Store.startHeartbeat("chef", myPhone);
            let lastOrdersKey = JSON.stringify(getOrders().map(o => o.chatId + o.msgs.length + o.unread));
            let lastNotifsKey = JSON.stringify(Store.getChefNotifications(myPhone).map(n => n.chatId + n.unread));
            const pollOrders = setInterval(() => {
                const newOrders = getOrders();
                const newKey = JSON.stringify(newOrders.map(o => o.chatId + o.msgs.length + o.unread));
                if (newKey !== lastOrdersKey) { lastOrdersKey = newKey; setOrders(newOrders); }
                const newNotifs = Store.getChefNotifications(myPhone);
                const newNKey = JSON.stringify(newNotifs.map(n => n.chatId + n.unread));
                if (newNKey !== lastNotifsKey) { lastNotifsKey = newNKey; setNotifications(newNotifs); }
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

    const acceptAndRemove = (chatId, customerPhone, e) => {
        e.stopPropagation();
        localStorage.setItem(`accepted_${chatId}`, '1');
        Store.clearUnread(chatId, myPhone);
        setOrders(getOrders());
        navigate('/chef-messages', { state: { chatId, customerPhone } });
    };

    return (
        <Box minH="100dvh" bgColor="#FFF5F0" display="flex" flexDir="column">
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
                        <Box cursor="pointer" p="4px" onClick={() => setShowNotifPanel(v => !v)}>
                            <FaBell style={{ fontSize: "clamp(18px, 5vw, 22px)", color: totalUnread > 0 ? "#C03F0C" : "#555" }} />
                            {totalUnread > 0 && (
                                <Box position="absolute" top="-4px" right="-4px" minW="16px" h="16px" px="3px"
                                    bgColor="#C03F0C" borderRadius="full" display="flex" alignItems="center"
                                    justifyContent="center" color="white" fontWeight="bold" style={{ fontSize: "9px" }}>
                                    {totalUnread > 9 ? "9+" : totalUnread}
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
                                {notifications.length === 0 ? (
                                    <Box py="20px" textAlign="center">
                                        <Text color="#9B614B" style={{ fontSize: "clamp(11px, 3vw, 12px)" }}>{t("glabal.noNotif")}</Text>
                                    </Box>
                                ) : notifications.map((n, i) => (
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
                <Box display="flex" px="16px" pt="14px" pb="10px" gap="8px">
                    {[
                        { key: 'orders', label: `${t("chefHome.title")}${orders.length > 0 ? ` (${orders.length})` : ""}` },
                        { key: 'posts', label: `${t("chefHome.posts")}${posts.length > 0 ? ` (${posts.length})` : ""}` }
                    ].map(tab => (
                        <Button key={tab.key} borderRadius="20px" fontWeight="600"
                            bgColor={activeTab === tab.key ? '#C03F0C' : 'white'}
                            color={activeTab === tab.key ? 'white' : '#9B614B'}
                            border="1.5px solid" borderColor={activeTab === tab.key ? '#C03F0C' : '#F0E6E0'}
                            _hover={{ opacity: 0.9 }} onClick={() => setActiveTab(tab.key)}
                            style={{ height: "38px", fontSize: "13px", padding: "0 16px", borderRadius: "20px" }}>
                            {tab.label}
                        </Button>
                    ))}
                    <Button ml="auto" bgColor="#FFF0EC" color="#C03F0C"
                        border="1.5px solid #F5C5B0" borderRadius="20px" fontWeight="600"
                        _hover={{ bgColor: '#FFE0D0' }}
                        style={{ height: "clamp(32px, 9vw, 38px)", fontSize: "clamp(11px, 3vw, 13px)", padding: "0 clamp(10px, 2.5vw, 14px)" }}
                        onClick={() => setShowPostModal(true)}>
                        <FaPlus style={{ marginRight: "5px", fontSize: "10px" }} /> Post
                    </Button>
                </Box>

                {/* BUYURTMALAR */}
                {activeTab === 'orders' && (
                    <Box px="16px" display="flex" flexDir="column" gap="10px">
                        {/* BUYURTMA QO'SHISH TUGMASI */}
                        <Button w="100%" bgColor="#22C55E" color="white" borderRadius="16px"
                            fontWeight="700" _hover={{ bgColor: '#16a34a' }}
                            style={{ height: "50px", fontSize: "15px" }}
                            onClick={() => setShowOrderModal(true)}>
                            <FaMoneyBillWave style={{ marginRight: "8px" }} />
                            {t('order.addBtn') || "Buyurtma qo'shish (naqd to'lov)"}
                        </Button>

                        {orders.length === 0 && (
                            <Box textAlign="center" py="40px">
                                <FaCommentDots style={{ fontSize: "36px", color: "#E8D6CF", display: "block", margin: "0 auto 12px" }} />
                                <Text color="#9B614B" style={{ fontSize: "clamp(13px, 3.5vw, 14px)" }}>{t("chefHome.empty")}</Text>
                            </Box>
                        )}
                        {orders.map(order => (
                            <Box key={order.chatId} bgColor="white" borderRadius="18px"
                                p="14px" boxShadow="0 2px 12px rgba(192,63,12,0.06)">
                                <Box display="flex" alignItems="center" gap={{ base: "10px", sm: "12px" }} mb="10px">
                                    <Box borderRadius="full" bgColor="#C03F0C" flexShrink={0}
                                        display="flex" alignItems="center" justifyContent="center"
                                        color="white" fontWeight="bold"
                                        style={{ width: "clamp(38px, 10vw, 46px)", height: "clamp(38px, 10vw, 46px)", fontSize: "clamp(14px, 3.8vw, 17px)" }}>
                                        {order.customerPhone?.charAt(0) || "M"}
                                    </Box>
                                    <Box flex="1" minW={0}>
                                        <Text fontWeight="bold" color="#1C110D" style={{ fontSize: "clamp(13px, 3.5vw, 14px)" }}>
                                            +998{order.customerPhone}
                                        </Text>
                                        <Box display="flex" alignItems="center" gap="6px">
                                            <Text color="#9B614B" style={{ fontSize: "clamp(10px, 2.5vw, 11px)" }}>
                                                {order.msgs.length} {t("chefHome.messages")}
                                            </Text>
                                            {order.unread > 0 && (
                                                <Box bgColor="#C03F0C" color="white" borderRadius="full"
                                                    px="6px" py="1px" style={{ fontSize: "9px", fontWeight: "bold" }}>
                                                    {order.unread} {t("chefHome.newMsg")}
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>
                                    <Box as="a" href={`tel:+998${order.customerPhone}`}
                                        borderRadius="full" bgColor="#FFF0EC"
                                        display="flex" alignItems="center" justifyContent="center"
                                        style={{ width: "clamp(30px, 8vw, 36px)", height: "clamp(30px, 8vw, 36px)" }}>
                                        <FaPhone style={{ fontSize: "clamp(10px, 2.8vw, 12px)", color: "#C03F0C" }} />
                                    </Box>
                                </Box>
                                <Box bgColor="#FFF5F0" borderRadius="14px" p="10px"
                                    display="flex" flexDir="column" gap="5px" mb="10px">
                                    {order.preview.map((msg, i) => (
                                        <Box key={i} display="flex" justifyContent={msg.sender === 'chef' ? 'flex-end' : 'flex-start'}>
                                            <Box px="10px" py="5px" maxW="80%"
                                                borderRadius={msg.sender === 'chef' ? '10px 10px 2px 10px' : '10px 10px 10px 2px'}
                                                bgColor={msg.sender === 'chef' ? '#C03F0C' : 'white'}
                                                boxShadow="0 1px 3px rgba(0,0,0,0.08)">
                                                <Text style={{ fontSize: "clamp(11px, 3vw, 12px)", color: msg.sender === 'chef' ? 'white' : '#1C110D' }}>
                                                    {msg.text}
                                                </Text>
                                            </Box>
                                        </Box>
                                    ))}
                                    {order.msgs.length > 4 && (
                                        <Text textAlign="center" color="#9B614B" style={{ fontSize: "clamp(10px, 2.5vw, 11px)" }}>
                                            +{order.msgs.length - 4} {t("chefHome.moreMsg")}
                                        </Text>
                                    )}
                                </Box>
                                <Box mt="8px">
                                    <Button w="100%" size="sm"
                                        bgColor="#22C55E" color="white" borderRadius="26px"
                                        fontWeight="700" _hover={{ bgColor: '#16a34a' }}
                                        leftIcon={<FaCheck style={{ fontSize: "12px" }} />}
                                        style={{ height: "42px", fontSize: "14px" }}
                                        onClick={(e) => acceptAndRemove(order.chatId, order.customerPhone, e)}>
                                        {t("chefHome.accept")}
                                    </Button>
                                </Box>
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
                        
                        {/* Oshpazning jami pul yig'ishi */}
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

                        {/* Mijoz ismi */}
                        <Box mb="12px">
                            <Text fontWeight="600" color="#9B614B" mb="6px" style={{ fontSize: "12px" }}>
                                {t('order.customerName') || "Mijoz ismi (ixtiyoriy)"}
                            </Text>
                            <Box display="flex" alignItems="center" bgColor="#FFF5F0" borderRadius="14px"
                                px="14px" border="1.5px solid #F0E6E0" style={{ height: "48px" }}>
                                <input value={orderCustomerName} onChange={e => handleCustomerNameChange(e.target.value)}
                                    placeholder={t('order.customerPlaceholder') || "Masalan: Jasur"}
                                    style={{ width: "100%", border: "none", outline: "none", fontSize: "15px", color: "#1C110D", background: "transparent" }} />
                                {customerOrderCount > 0 && (
                                    <Text color="#C03F0C" fontWeight="600" style={{ fontSize: "11px", whiteSpace: "nowrap", marginLeft: "8px" }}>
                                        ({customerOrderCount} ta buyurtma)
                                    </Text>
                                )}
                            </Box>
                        </Box>

                        
                        {/* Summa — MAJBURIY */}
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

                        {/* Komissiya hisob (preview) */}
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

                        {/* Muvaffaqiyat */}
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
                                onClick={() => { setShowOrderModal(false); setOrderError(''); }}>
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