import { Box, Text, Button } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaHome, FaClipboardList, FaHeart, FaUser, FaSignOutAlt, FaGlobe, FaChevronRight } from "react-icons/fa";
import Store from "../store";
import HeroHeader from "/images/Hero Header.png";

const ProfilePage = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    const getCD = () => {
        const s = JSON.parse(localStorage.getItem("customerData") || "null");
        if (s?.phone) return s;
        const sess = Store.getSession();
        if (sess?.role === "customer" && sess?.data?.phone) return sess.data;
        return { firstName: "", lastName: "", phone: "", image: null };
    };
    const [customerData, setCustomerData] = useState(getCD);
    useEffect(() => {
        setCustomerData(getCD());
        // Tahrirlash sahifasidan qaytganda yangilansin
        const onUpdate = () => setCustomerData(getCD());
        window.addEventListener('customerData-updated', onUpdate);
        return () => window.removeEventListener('customerData-updated', onUpdate);
    }, []);
    useEffect(() => { if (customerData.phone) return Store.startHeartbeat("customer", customerData.phone); }, [customerData.phone]);

    const firstLetter = customerData.firstName?.charAt(0)?.toUpperCase() || "U";
    const fullName = `${customerData.firstName || ""} ${customerData.lastName || ""}`.trim();
    const myPhone = customerData.phone || "";

    const handleLogout = () => {
        if (customerData.phone) Store.setOffline("customer", customerData.phone);
        Store.clearSession();
        navigate("/");
    };

    const NavBar = () => (
        <Box className="fixed-bottom" borderTop="1px solid #EBEBEB"
            display="flex" justifyContent="space-around" alignItems="center" py="10px">
            {[
                { icon: FaHome, route: "/glabal", label: t("footer.home"), badge: 0 },
                { icon: FaClipboardList, route: "/orderspage", label: t("footer.orders"), badge: Store.getTotalUnreadForCustomer(myPhone) },
                { icon: FaHeart, route: "/like", label: t("footer.like"), badge: 0 },
                { icon: FaUser, route: "/profile", label: t("footer.profile"), badge: 0 },
            ].map(tab => (
                <Box key={tab.route} display="flex" flexDir="column" alignItems="center" gap="3px"
                    cursor="pointer" px="14px" onClick={() => navigate(tab.route)}>
                    <Box position="relative" display="inline-block">
                        <tab.icon style={{ fontSize: "22px", color: location.pathname === tab.route ? "#C03F0C" : "#B0A8A4" }} />
                        {tab.badge > 0 && (
                            <Box position="absolute" top="-6px" right="-8px" minW="17px" h="17px" px="3px"
                                bgColor="#C03F0C" borderRadius="full" display="flex" alignItems="center"
                                justifyContent="center" color="white" fontWeight="800" style={{ fontSize: "9px" }}>
                                {tab.badge > 9 ? "9+" : tab.badge}
                            </Box>
                        )}
                    </Box>
                    <Text fontWeight="700" style={{ fontSize: "10px", color: location.pathname === tab.route ? "#C03F0C" : "#B0A8A4" }}>{tab.label}</Text>
                </Box>
            ))}
        </Box>
    );

    return (
        <Box minH="100dvh" bgColor="#FFF5F0" display="flex" flexDir="column" pb="80px">
            {/* Cover + Avatar */}
            <Box position="relative" mb="52px">
                <img src={HeroHeader} alt="" style={{ width: "100%", height: "140px", objectFit: "cover", display: "block" }} />
                <Box position="absolute" bottom="-44px" left="50%" transform="translateX(-50%)">
                    {customerData.image
                        ? <img src={customerData.image} alt="" style={{ width: "88px", height: "88px", borderRadius: "50%", objectFit: "cover", border: "4px solid white", boxShadow: "0 4px 16px rgba(0,0,0,0.15)", display: "block" }} />
                        : <Box w="88px" h="88px" borderRadius="full" bgColor="#C03F0C"
                            border="4px solid white" boxShadow="0 4px 16px rgba(0,0,0,0.15)"
                            display="flex" alignItems="center" justifyContent="center">
                            <Text color="white" fontWeight="800" style={{ fontSize: "32px" }}>{firstLetter}</Text>
                        </Box>
                    }
                </Box>
            </Box>

            {/* Name */}
            <Box textAlign="center" px="16px" mb="20px">
                <Text fontWeight="800" color="#1C110D" style={{ fontSize: "22px" }}>{fullName || `+998${customerData.phone}`}</Text>
                <Text color="#9B8E8A" mt="2px" style={{ fontSize: "14px" }}>+998 {customerData.phone}</Text>
                <Button mt="12px" h="38px" px="20px" borderRadius="25px"
                    bgColor="#FFF0EC" color="#C03F0C" border="1.5px solid #F5C5B0"
                    fontWeight="700" style={{ fontSize: "13px" }} _hover={{ bgColor: "#FFE5DC" }}
                    onClick={() => navigate("/edit-profile")}>
                    ✏️ {t("profile.editText")}
                </Button>
            </Box>

            {/* Info cards */}
            <Box px="16px" display="flex" flexDir="column" gap="10px">
                {[
                    { label: t("editProfile.firstName"), value: customerData.firstName },
                    { label: t("editProfile.lastName"), value: customerData.lastName },
                    { label: t("editProfile.phone"), value: customerData.phone ? `+998 ${customerData.phone}` : "" },
                ].map((item, i) => (
                    <Box key={i} bgColor="white" borderRadius="16px" px="16px" py="14px"
                        display="flex" justifyContent="space-between" alignItems="center"
                        boxShadow="0 1px 6px rgba(0,0,0,0.05)">
                        <Box>
                            <Text color="#9B8E8A" style={{ fontSize: "11px", fontWeight: "600" }}>{item.label.toUpperCase()}</Text>
                            <Text color="#1C110D" fontWeight="600" mt="2px" style={{ fontSize: "15px" }}>{item.value || "—"}</Text>
                        </Box>
                        <FaChevronRight style={{ color: "#D1CCC9", fontSize: "12px" }} />
                    </Box>
                ))}

                {/* Til */}
                <Box bgColor="white" borderRadius="16px" px="16px" py="14px" boxShadow="0 1px 6px rgba(0,0,0,0.05)">
                    <Box display="flex" alignItems="center" gap="6px" mb="12px">
                        <FaGlobe style={{ fontSize: "14px", color: "#C03F0C" }} />
                        <Text fontWeight="700" color="#1C110D" style={{ fontSize: "13px" }}>{t("profile.language")}</Text>
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
                    {t("profile.logout")}
                </Button>
            </Box>
            <NavBar />
        </Box>
    );
};
export default ProfilePage;