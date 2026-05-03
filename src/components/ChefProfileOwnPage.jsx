import { Box, Text, Button } from '@chakra-ui/react';
import { FaHome, FaCommentDots, FaUser, FaEdit, FaSignOutAlt, FaGlobe, FaImage, FaPlus, FaTimes } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef } from 'react';
import HeroHeader from '/images/Hero Header.png';
import Store from '../store';

const ChefProfileOwnPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t, i18n } = useTranslation();
    const [chefProfile, setChefProfile] = useState({});
    const [posts, setPosts] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [ordersCount, setOrdersCount] = useState(0);

    // Post modal
    const fileRef = useRef();
    const [showPostModal, setShowPostModal] = useState(false);
    const [postImg, setPostImg] = useState(null);
    const [postName, setPostName] = useState('');
    const [postImgPreview, setPostImgPreview] = useState(null);
    const [publishLoading, setPublishLoading] = useState(false);
    const [postError, setPostError] = useState('');

    const myPhone = chefProfile.phone || '';

    const fetchPosts = (phone) => {
        if (!phone) return;
        const API = import.meta.env?.VITE_API_URL || '';
        fetch(`${API}/posts/chef/${phone}`)
            .then(r => r.ok ? r.json() : null)
            .then(bp => {
                if (!Array.isArray(bp)) return;
                setPosts(bp.map(p => ({ ...p, id: p._id || p.id })));
            }).catch(() => {});
    };

    useEffect(() => {
        const raw = JSON.parse(localStorage.getItem("chefProfile") || "null");
        const sess = Store.getSession();
        const p = (raw?.phone ? raw : (sess?.role === "chef" && sess?.data?.phone ? sess.data : {}));
        if (p.phone) localStorage.setItem("chefProfile", JSON.stringify(p));
        setChefProfile(p);
        if (p.phone) fetchPosts(p.phone);
    }, []);

    useEffect(() => {
        const onUpdate = () => {
            const raw = JSON.parse(localStorage.getItem("chefProfile") || "null");
            const sess2 = Store.getSession();
            const p = (raw?.phone ? raw : (sess2?.role === "chef" ? sess2.data : {}));
            setChefProfile(p);
        };
        window.addEventListener("chefs-updated", onUpdate);
        return () => window.removeEventListener("chefs-updated", onUpdate);
    }, []);

    // Posts polling
    useEffect(() => {
        if (!myPhone) return;
        fetchPosts(myPhone);
        const iv = setInterval(() => fetchPosts(myPhone), 5000);
        return () => clearInterval(iv);
    }, [myPhone]);

    const fetchRatings = async (phone) => {
        if (!phone) return;
        const AUTH_BASE = import.meta.env?.VITE_API_URL || '';
        try {
            const response = await fetch(`${AUTH_BASE}/reviews/${phone}`);
            if (response.ok) {
                const data = await response.json();
                const serverReviews = data.reviews || [];
                const rated = serverReviews.filter(r => r.rating > 0);
                setAverageRating(rated.length > 0 ? +(rated.reduce((s, r) => s + r.rating, 0) / rated.length).toFixed(1) : data.avgRating || 0);
            }
        } catch { }
    };

    const fetchOrdersCount = async (phone) => {
        if (!phone) return;
        try {
            const AUTH_BASE = import.meta.env?.VITE_API_URL || '';
            const res = await fetch(`${AUTH_BASE}/orders/chef/${phone}`);
            if (!res.ok) return;
            const data = await res.json();
            if (Array.isArray(data?.orders)) setOrdersCount(data.orders.length);
        } catch { }
    };

    useEffect(() => {
        if (!myPhone) return;
        fetchRatings(myPhone);
        fetchOrdersCount(myPhone);
        const iv = setInterval(() => { fetchRatings(myPhone); fetchOrdersCount(myPhone); }, 5000);
        return () => clearInterval(iv);
    }, [myPhone]);

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => { setPostImg(reader.result); setPostImgPreview(reader.result); };
        reader.readAsDataURL(file);
    };

    const handlePublish = async () => {
        if (!postImg || !postName.trim()) { setPostError("Iltimos, rasm va taom nomini kiriting."); return; }
        setPublishLoading(true);
        setPostError('');
        const API = import.meta.env?.VITE_API_URL || '';
        const postData = {
            chefPhone: myPhone,
            chefName: `${chefProfile.name || ''} ${chefProfile.surname || ''}`.trim(),
            chefImage: chefProfile.image || null,
            image: postImg,
            dishName: postName.trim(),
        };
        try {
            const res = await fetch(`${API}/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData),
            });
            if (!res.ok) throw new Error();
            await fetchPosts(myPhone);
            setShowPostModal(false);
            setPostImg(null); setPostImgPreview(null); setPostName('');
        } catch {
            setPostError("Postni saqlab bo'lmadi. Internetni tekshiring.");
        }
        setPublishLoading(false);
    };

    const handleDeletePost = (post) => {
        setPosts(prev => prev.filter(x => (x.id || x._id) !== (post.id || post._id)));
        const API = import.meta.env?.VITE_API_URL || '';
        fetch(`${API}/posts/${post.id || post._id}`, { method: 'DELETE' }).catch(() => {});
    };

    const fullName = chefProfile.name ? `${chefProfile.name || ""} ${chefProfile.surname || ""}`.trim() : t("chefProfileOwn.defaultName");
    const exp = chefProfile.exp ? String(chefProfile.exp) : '';
    const totalUnread = Store.getTotalUnreadForChef(chefProfile.phone || '');

    const handleLogout = () => {
        if (chefProfile.phone) Store.setOffline("chef", chefProfile.phone);
        localStorage.removeItem("chefProfile");
        Store.clearSession();
        navigate("/");
    };

    return (
        <Box minH="100dvh" bgColor="#FFF5F0" display="flex" flexDir="column" pb="80px">
            {/* Cover + Avatar */}
            <Box position="relative" mb="52px">
                <img src={HeroHeader} alt="" style={{ width: "100%", height: "140px", objectFit: "cover", display: "block" }} />
                <Box position="absolute" bottom="-44px" left="50%" transform="translateX(-50%)">
                    {chefProfile.image
                        ? <img src={chefProfile.image} alt="" style={{ width: "88px", height: "88px", borderRadius: "50%", objectFit: "cover", border: "4px solid white", boxShadow: "0 4px 16px rgba(0,0,0,0.15)", display: "block" }} />
                        : <Box w="88px" h="88px" borderRadius="full" bgColor="#C03F0C"
                            border="4px solid white" boxShadow="0 4px 16px rgba(0,0,0,0.15)"
                            display="flex" alignItems="center" justifyContent="center">
                            <FaUser size={32} color="white" />
                        </Box>
                    }
                </Box>
            </Box>

            {/* Name + stats */}
            <Box textAlign="center" px="16px" mb="20px">
                <Text fontWeight="800" color="#1C110D" style={{ fontSize: "22px" }}>{fullName}</Text>
                {exp && <Text color="#9B8E8A" mt="2px" style={{ fontSize: "14px" }}>{exp} {t("chefProfileOwn.expSuffix")}</Text>}

                {/* Stats row */}
                <Box display="flex" justifyContent="center" gap="32px" mt="16px">
                    {[
                        { value: averageRating > 0 ? averageRating : "–", label: t("common.rating"), icon: "⭐" },
                        { value: ordersCount, label: t("common.orders"), icon: "📦" },
                        { value: exp || "–", label: t("common.experience2"), icon: "⏱" },
                    ].map((s, i) => (
                        <Box key={i} textAlign="center">
                            <Text fontWeight="800" color="#1C110D" style={{ fontSize: "18px" }}>{s.value}</Text>
                            <Text color="#9B8E8A" style={{ fontSize: "11px" }}>{s.label}</Text>
                        </Box>
                    ))}
                </Box>

                <Button mt="14px" h="40px" px="24px" borderRadius="25px"
                    bgColor="#C03F0C" color="white" fontWeight="700" style={{ fontSize: "13px" }}
                    _hover={{ bgColor: "#a0300a" }} leftIcon={<FaEdit size={12} />}
                    onClick={() => navigate("/chef-edit-profile")}>
                    {t("chefProfileOwn.editBtn")}
                </Button>
            </Box>

            {/* Content */}
            <Box px="16px" display="flex" flexDir="column" gap="10px">
                {/* About */}
                <Box bgColor="white" borderRadius="18px" p="16px" boxShadow="0 1px 6px rgba(0,0,0,0.05)">
                    <Text fontWeight="700" color="#1C110D" mb="8px" style={{ fontSize: "15px" }}>{t("chefProfile.about")}</Text>
                    <Text color="#6B6560" lineHeight="1.7" style={{ fontSize: "13px" }}>{chefProfile.bio || t("chefProfile.aboutText")}</Text>
                </Box>

                {/* Gallery */}
                <Box bgColor="white" borderRadius="18px" p="16px" boxShadow="0 1px 6px rgba(0,0,0,0.05)">
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb="12px">
                        <Box display="flex" alignItems="center" gap="8px">
                            <Text fontWeight="700" color="#1C110D" style={{ fontSize: "15px" }}>{t("chefProfileOwn.gallery")}</Text>
                            {posts.length > 0 && (
                                <Box bgColor="#FFF0EC" borderRadius="8px" px="8px" py="2px">
                                    <Text color="#C03F0C" fontWeight="700" style={{ fontSize: "11px" }}>{posts.length} ta</Text>
                                </Box>
                            )}
                        </Box>
                        <Box cursor="pointer" display="flex" alignItems="center" gap="5px"
                            bgColor="#C03F0C" borderRadius="10px" px="10px" py="6px"
                            onClick={() => setShowPostModal(true)}>
                            <FaPlus style={{ fontSize: "10px", color: "white" }} />
                            <Text color="white" fontWeight="700" style={{ fontSize: "12px" }}>Post</Text>
                        </Box>
                    </Box>
                    {posts.length === 0
                        ? <Box textAlign="center" py="24px">
                            <FaImage style={{ fontSize: "32px", color: "#E0DAD7", margin: "0 auto 8px", display: "block" }} />
                            <Text color="#B0A8A4" style={{ fontSize: "13px" }}>{t("chefProfileOwn.noPost")}</Text>
                        </Box>
                        : <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap="8px">
                            {posts.map((p, i) => (
                                <Box key={p.id || p._id || i} position="relative" borderRadius="10px" overflow="hidden">
                                    <Box style={{ paddingBottom: '100%', position: 'relative', background: '#F0E6E0' }}>
                                        <img src={p.image} alt={p.dishName}
                                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                    </Box>
                                    <Box position="absolute" bottom="0" left="0" right="0"
                                        bgColor="rgba(0,0,0,0.5)" px="5px" py="3px">
                                        <Text color="white" fontWeight="600" noOfLines={1} style={{ fontSize: '10px' }}>{p.dishName}</Text>
                                    </Box>
                                    <Box position="absolute" top="4px" right="4px" w="20px" h="20px"
                                        bgColor="rgba(0,0,0,0.6)" borderRadius="full"
                                        display="flex" alignItems="center" justifyContent="center"
                                        cursor="pointer" onClick={() => handleDeletePost(p)}>
                                        <FaTimes style={{ fontSize: "8px", color: "white" }} />
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    }
                </Box>

                {/* Language */}
                <Box bgColor="white" borderRadius="18px" p="16px" boxShadow="0 1px 6px rgba(0,0,0,0.05)">
                    <Box display="flex" alignItems="center" gap="6px" mb="12px">
                        <FaGlobe style={{ color: "#C03F0C", fontSize: "14px" }} />
                        <Text fontWeight="700" color="#1C110D" style={{ fontSize: "14px" }}>{t("chefProfileOwn.language")}</Text>
                    </Box>
                    <Box display="flex" gap="8px">
                        {[{ code: "uz", label: "🇺🇿 O'zbek" }, { code: "ru", label: "🇷🇺 Русский" }].map(lg => (
                            <Box key={lg.code} flex="1" cursor="pointer" borderRadius="12px" py="10px" textAlign="center"
                                bgColor={i18n.language === lg.code ? "#C03F0C" : "#F5F3F1"}
                                border={`1.5px solid ${i18n.language === lg.code ? "#C03F0C" : "#E8E8E8"}`}
                                transition="all 0.2s"
                                onClick={() => { i18n.changeLanguage(lg.code); localStorage.setItem("appLang", lg.code); }}>
                                <Text fontWeight="700" color={i18n.language === lg.code ? "white" : "#555"} style={{ fontSize: "13px" }}>{lg.label}</Text>
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* Logout */}
                <Button w="100%" h="52px" bgColor="transparent" color="#EF4444"
                    border="1.5px solid #EF4444" fontWeight="700" borderRadius="16px"
                    style={{ fontSize: "15px" }} leftIcon={<FaSignOutAlt size={14} />}
                    _hover={{ bgColor: "#EF4444", color: "white" }} transition="all 0.2s"
                    onClick={handleLogout}>
                    {t("chefProfileOwn.logout")}
                </Button>
            </Box>

            {/* Post Modal */}
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImageSelect} />
            {showPostModal && (
                <Box position="fixed" inset="0" bgColor="rgba(0,0,0,0.6)" zIndex={200}
                    display="flex" alignItems="flex-end" justifyContent="center"
                    onClick={() => { setShowPostModal(false); setPostImg(null); setPostImgPreview(null); setPostName(''); setPostError(''); }}>
                    <Box bgColor="white" w="100%" maxW="430px" borderRadius="24px 24px 0 0"
                        p="24px" onClick={e => e.stopPropagation()}>
                        <Text fontWeight="800" color="#1C110D" mb="16px" style={{ fontSize: "18px" }}>
                            Yangi post
                        </Text>
                        <Box w="100%" borderRadius="14px" border="2px dashed #F0E6E0" bgColor="#FAFAFA"
                            display="flex" alignItems="center" justifyContent="center"
                            cursor="pointer" overflow="hidden" onClick={() => fileRef.current?.click()}
                            style={{ height: "180px" }}>
                            {postImgPreview
                                ? <img src={postImgPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                : <Box textAlign="center">
                                    <FaImage style={{ fontSize: "32px", color: "#C03F0C", margin: "0 auto 8px" }} />
                                    <Text color="#9B614B" style={{ fontSize: "13px" }}>Rasm tanlash</Text>
                                </Box>
                            }
                        </Box>
                        <Box mt="12px">
                            <Box display="flex" alignItems="center" bgColor="#FFF5F0" borderRadius="14px"
                                px="14px" border="1.5px solid #F0E6E0" style={{ height: "48px" }}>
                                <input value={postName} onChange={e => setPostName(e.target.value)}
                                    placeholder="Taom nomi"
                                    style={{ width: "100%", border: "none", outline: "none", fontSize: "15px", color: "#1C110D", background: "transparent" }} />
                            </Box>
                        </Box>
                        {postError && (
                            <Box mt="8px" px="10px" py="8px" bgColor="#FFF5F5" border="1px solid #F5C2C7" borderRadius="12px">
                                <Text style={{ fontSize: "13px", color: "#C53030" }}>{postError}</Text>
                            </Box>
                        )}
                        <Box display="flex" gap="10px" mt="16px">
                            <Button flex="1" bgColor="#F5F0EE" color="#9B614B" borderRadius="26px"
                                style={{ height: "50px", fontSize: "14px" }}
                                onClick={() => { setShowPostModal(false); setPostImg(null); setPostImgPreview(null); setPostName(''); setPostError(''); }}>
                                Bekor
                            </Button>
                            <Button flex="1"
                                bgColor={postImg && postName.trim() ? "#C03F0C" : "#E8D6CF"}
                                color="white" borderRadius="26px" fontWeight="700"
                                isLoading={publishLoading}
                                style={{ height: "50px", fontSize: "14px" }}
                                onClick={handlePublish} isDisabled={!postImg || !postName.trim() || publishLoading}>
                                Nashr etish
                            </Button>
                        </Box>
                    </Box>
                </Box>
            )}

            {/* Bottom Nav */}
            <Box className="fixed-bottom" borderTop="1px solid #EBEBEB"
                display="flex" justifyContent="space-around" alignItems="center" py="10px">
                {[
                    { icon: FaHome, route: '/chef-home', labelKey: 'nav.home', badge: 0 },
                    { icon: FaCommentDots, route: '/chef-messages', labelKey: 'nav.messages', badge: totalUnread },
                    { icon: FaUser, route: '/chef-profile', labelKey: 'nav.profile', badge: 0 },
                ].map(tab => (
                    <Box key={tab.route} display="flex" flexDir="column" alignItems="center" gap="3px"
                        cursor="pointer" px="18px" onClick={() => navigate(tab.route)}>
                        <Box position="relative" display="inline-block">
                            <tab.icon style={{ fontSize: "22px", color: location.pathname === tab.route ? "#C03F0C" : "#B0A8A4" }} />
                            {tab.badge > 0 && <Box position="absolute" top="-6px" right="-8px" minW="17px" h="17px" px="3px"
                                bgColor="#C03F0C" borderRadius="full" display="flex" alignItems="center"
                                justifyContent="center" color="white" fontWeight="800" style={{ fontSize: "9px" }}>
                                {tab.badge > 9 ? "9+" : tab.badge}
                            </Box>}
                        </Box>
                        <Text fontWeight="700" style={{ fontSize: "10px", color: location.pathname === tab.route ? "#C03F0C" : "#B0A8A4" }}>{t(tab.labelKey)}</Text>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};
export default ChefProfileOwnPage;