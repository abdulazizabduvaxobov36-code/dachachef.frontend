import { Box, Text, Button } from '@chakra-ui/react';
import { FaHome, FaCommentDots, FaUser, FaEdit, FaStar, FaSignOutAlt, FaGlobe, FaImage } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import HeroHeader from '/images/Hero Header.png';
import Store from '../store';

const ChefProfileOwnPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t, i18n } = useTranslation();
    const [chefProfile, setChefProfile] = useState({});
    const [posts, setPosts] = useState([]);
    const [ratings, setRatings] = useState([]);
    const [averageRating, setAverageRating] = useState(0);

    useEffect(() => {
        const raw = JSON.parse(localStorage.getItem("chefProfile") || "null");
        const sess = Store.getSession();
        const p = (raw?.phone ? raw : (sess?.role === "chef" && sess?.data?.phone ? sess.data : {}));
        if (p.phone) localStorage.setItem("chefProfile", JSON.stringify(p));
        setChefProfile(p);
        if (p.phone) setPosts(Store.getPosts().filter(x => x.chefPhone === p.phone));
    }, []);
    useEffect(() => {
        const onUpdate = () => {
            const raw = JSON.parse(localStorage.getItem("chefProfile") || "null");
            const sess2 = Store.getSession();
            const p = (raw?.phone ? raw : (sess2?.role === "chef" ? sess2.data : {}));
            setChefProfile(p);
            if (p.phone) setPosts(Store.getPosts().filter(x => x.chefPhone === p.phone));
        };
        const unsub = Store.listenPosts(all => { const p = JSON.parse(localStorage.getItem("chefProfile")) || {}; setPosts(all.filter(x => x.chefPhone === p.phone)); });
        window.addEventListener("chefs-updated", onUpdate);
        return () => { window.removeEventListener("chefs-updated", onUpdate); unsub?.(); };
    }, []);

    // Baholarni olish
    const fetchRatings = async () => {
        if (!chefProfile.phone) return;
        try {
            const AUTH_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const response = await fetch(`${AUTH_BASE}/reviews/${chefProfile.phone}`);
            if (response.ok) {
                const data = await response.json();
                const reviewsList = data.reviews || [];
                setRatings(reviewsList);
                setAverageRating(data.avgRating || 0);
                setAverageRating(data.avgRating || 0);
            }
        } catch (error) {
            console.error('Baholarni olishda xatolik:', error);
        }
    };

    useEffect(() => {
        fetchRatings();
    }, [chefProfile.phone]);

    const fullName = chefProfile.name ? `${chefProfile.name || ""} ${chefProfile.surname || ""}`.trim() : t("chefProfileOwn.defaultName");
    const exp = chefProfile.exp ? String(chefProfile.exp) : '';
    const totalUnread = Store.getTotalUnreadForChef(chefProfile.phone || '');

    const handleLogout = () => { if (chefProfile.phone) Store.setOffline("chef", chefProfile.phone); Store.clearSession(); navigate("/"); };

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
                        { value: averageRating > 0 ? Number(averageRating).toFixed(1) : "–", label: t("common.rating"), icon: "⭐" },
                        { value: ratings.length, label: t("common.orders"), icon: "📦" },
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
                    <Text color="#6B6560" lineHeight="1.7" style={{ fontSize: "13px" }}>{t("chefProfile.aboutText")}</Text>
                </Box>

                {/* Gallery */}
                <Box bgColor="white" borderRadius="18px" p="16px" boxShadow="0 1px 6px rgba(0,0,0,0.05)">
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb="12px">
                        <Text fontWeight="700" color="#1C110D" style={{ fontSize: "15px" }}>{t("chefProfileOwn.gallery")}</Text>
                        {posts.length > 0 && <Text color="#9B8E8A" style={{ fontSize: "12px" }}>{posts.length} ta</Text>}
                    </Box>
                    {posts.length === 0
                        ? <Box textAlign="center" py="24px">
                            <FaImage style={{ fontSize: "32px", color: "#E0DAD7", margin: "0 auto 8px", display: "block" }} />
                            <Text color="#B0A8A4" style={{ fontSize: "13px" }}>{t("chefProfileOwn.noPost")}</Text>
                        </Box>
                        : <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap="6px">
                            {posts.map((p, i) => (
                                <Box key={i} borderRadius="10px" overflow="hidden">
                                    <img src={p.image} alt={p.dishName} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
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

                {/* Baholar */}
                <Box bgColor="white" borderRadius="18px" p="16px" boxShadow="0 1px 6px rgba(0,0,0,0.05)">
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb="12px">
                        <Text fontWeight="700" color="#1C110D" style={{ fontSize: "15px" }}>Mijozlar baholari</Text>
                        <Box display="flex" alignItems="center" gap="8px">
                            <Box bgColor="#FFF0EC" borderRadius="10px" px="8px" py="3px">
                                <Text color="#C03F0C" fontWeight="700" style={{ fontSize: "12px" }}>{ratings.length} ta</Text>
                            </Box>
                            {ratings.length > 3 && (
                                <Button
                                    h="28px" px="12px" borderRadius="12px"
                                    bgColor="#C03F0C" color="white" fontWeight="600"
                                    style={{ fontSize: "11px" }}
                                    _hover={{ bgColor: "#a0300a" }}
                                    onClick={() => navigate('/chef-all-reviews', { state: { chefProfile, ratings } })}
                                >
                                    Hammasi
                                </Button>
                            )}
                        </Box>
                    </Box>
                    {ratings.length === 0 ? (
                        <Box textAlign="center" py="20px">
                            <Text color="#B0A8A4" style={{ fontSize: "13px" }}>Hali baho yo'q</Text>
                        </Box>
                    ) : (
                        <Box display="flex" flexDir="column" gap="10px">
                            {ratings.slice(0, 5).map((r, i) => (
                                <Box key={r._id || i} bgColor="#FFF5F0" borderRadius="14px" p="12px">
                                    <Box display="flex" alignItems="center" gap="10px" mb="6px">
                                        <Box w="34px" h="34px" borderRadius="full" bgColor="#C03F0C" flexShrink={0}
                                            display="flex" alignItems="center" justifyContent="center"
                                            color="white" fontWeight="700" style={{ fontSize: "14px" }}>
                                            {r.customerName?.charAt(0) || 'M'}
                                        </Box>
                                        <Box flex="1">
                                            <Text fontWeight="700" color="#1C110D" style={{ fontSize: "13px" }}>
                                                {r.customerName || 'Mijoz'}
                                            </Text>
                                            <Box display="flex" gap="2px">
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <FaStar key={s} color={s <= r.rating ? '#F4B400' : '#E0DAD7'} style={{ fontSize: "10px" }} />
                                                ))}
                                            </Box>
                                        </Box>
                                        <Text color="#B0A8A4" style={{ fontSize: "10px" }}>
                                            {new Date(r.createdAt).toLocaleDateString('uz-UZ')}
                                        </Text>
                                    </Box>
                                    {r.comment && (
                                        <Text color="#6B6560" style={{ fontSize: "12px", lineHeight: "1.5" }}>
                                            {r.comment}
                                        </Text>
                                    )}
                                </Box>
                            ))}
                        </Box>
                    )}
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