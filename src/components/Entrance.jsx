import { Box, Text, Button } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaUser, FaUserTie, FaTimes, FaChevronRight } from "react-icons/fa";
import { useEffect, useState } from "react";
import Store from "../store";

const Entrance = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [saved, setSaved] = useState([]);

    useEffect(() => {
        const s = Store.getSession();
        if (s?.role === "customer") { navigate("/glabal", { replace: true }); return; }
        if (s?.role === "chef") { navigate("/chef-home", { replace: true }); return; }
        setSaved(Store.getSavedAccounts());
    }, []);

    const login = (acc) => {
        // Oldingi sessiyani tozalash
        Store.clearSession();
        localStorage.removeItem("customerData");
        localStorage.removeItem("chefProfile");

        // Yangi sessiyani o'rnatish
        Store.setSession(acc.role, acc.data);
        Store.startHeartbeat(acc.role, acc.data.phone);
        if (acc.role === "customer") {
            localStorage.setItem("customerData", JSON.stringify(acc.data));
            navigate("/glabal");
        } else {
            localStorage.setItem("chefProfile", JSON.stringify(acc.data));
            navigate("/chef-home");
        }
    };

    const remove = (e, key) => {
        e.stopPropagation();
        const accData = Store.getSavedAccounts().find(a => a.key === key);
        Store.removeSavedAccount(key);
        if (accData?.role === 'chef' && accData?.data?.phone) {
            Store.removeChef(accData.data.phone);
        }
        setSaved(Store.getSavedAccounts());
    };

    return (
        <Box minH="100dvh" position="relative" overflow="hidden"
            bgImage="url(/images/Image.png)" bgSize="cover" bgPosition="center">
            <Box position="absolute" inset="0" bgColor="rgba(20,10,5,0.55)" />

            <Box position="relative" zIndex={1} minH="100dvh" display="flex" flexDir="column"
                alignItems="center" justifyContent="center" px="20px" py="32px" gap="0">

                {/* Logo */}
                <Box display="flex" flexDir="column" alignItems="center" mb="28px">
                    <Box w="64px" h="64px" borderRadius="20px" bgColor="#C03F0C"
                        display="flex" alignItems="center" justifyContent="center" mb="12px"
                        boxShadow="0 8px 24px rgba(192,63,12,0.4)">
                        <img src="/images/icons8-restaurant-48.png" alt="" style={{ width: "38px", height: "38px" }} />
                    </Box>
                    <Text fontWeight="800" color="white" style={{ fontSize: "28px", letterSpacing: "1px" }}>
                        {t("entrance.title")}
                    </Text>
                    <Text color="rgba(255,255,255,0.65)" mt="4px" style={{ fontSize: "14px" }}>
                        {t("entrance.subtitle")}
                    </Text>
                </Box>

                {/* Kirish tugmalari — "Platformaga kirish" text yo'q */}
                <Box w="100%" maxW="360px" display="flex" flexDir="column" gap="12px" mb="16px">
                    <Box display="flex" flexDir="column" gap="10px"
                        bg="rgba(255,255,255,0.08)" backdropFilter="blur(16px)"
                        borderRadius="22px" p="16px" border="1px solid rgba(255,255,255,0.15)">
                        <Button w="100%" h="54px" bg="#C03F0C" color="white" borderRadius="16px"
                            fontWeight="700" style={{ fontSize: "15px" }}
                            _hover={{ bg: "#a0300a" }} display="flex" alignItems="center" justifyContent="space-between" px="20px"
                            onClick={() => navigate("/customer")}>
                            <Box display="flex" alignItems="center" gap="10px">
                                <Box w="32px" h="32px" borderRadius="10px" bgColor="rgba(255,255,255,0.2)"
                                    display="flex" alignItems="center" justifyContent="center">
                                    <FaUser size={14} />
                                </Box>
                                <span>{t("entrance.userBtn")}</span>
                            </Box>
                            <FaChevronRight size={14} />
                        </Button>
                        <Button w="100%" h="54px" bg="rgba(255,255,255,0.12)" color="white" borderRadius="16px"
                            fontWeight="700" style={{ fontSize: "15px" }} border="1px solid rgba(255,255,255,0.2)"
                            _hover={{ bg: "rgba(255,255,255,0.2)" }} display="flex" alignItems="center" justifyContent="space-between" px="20px"
                            onClick={() => navigate("/chef")}>
                            <Box display="flex" alignItems="center" gap="10px">
                                <Box w="32px" h="32px" borderRadius="10px" bgColor="rgba(255,255,255,0.15)"
                                    display="flex" alignItems="center" justifyContent="center">
                                    <FaUserTie size={14} />
                                </Box>
                                <span>{t("entrance.chefBtn")}</span>
                            </Box>
                            <FaChevronRight size={14} />
                        </Button>

                    </Box>
                </Box>

                {/* Til tugmalari — paneldan TASHQARIDA, pastda */}
                <Box display="flex" gap="8px" w="100%" maxW="360px">
                    {[{ code: "uz", flag: "🇺🇿", l: "O'zbek" }, { code: "ru", flag: "🇷🇺", l: "Русский" }].map(lg => (
                        <Box key={lg.code} flex={1} cursor="pointer" py="9px" borderRadius="14px"
                            bgColor={i18n.language === lg.code ? "rgba(192,63,12,0.8)" : "rgba(255,255,255,0.12)"}
                            color="white" fontWeight="700" style={{ fontSize: "13px", textAlign: "center" }}
                            border={`1.5px solid ${i18n.language === lg.code ? "#C03F0C" : "rgba(255,255,255,0.2)"}`}
                            transition="all 0.2s"
                            onClick={() => { i18n.changeLanguage(lg.code); localStorage.setItem("appLang", lg.code); }}>
                            {lg.flag} {lg.l}
                        </Box>
                    ))}
                </Box>

                {/* Saqlangan akklar */}
                {saved.length > 0 && (
                    <Box w="100%" maxW="360px">
                        {/* "Eski akk bilan kirish" text */}
                        <Text color="rgba(255,255,255,0.55)" mb="10px"
                            style={{ fontSize: "12px", letterSpacing: "1px", textTransform: "uppercase" }}>
                            {t("entrance.oldAccount")}
                        </Text>
                        <Box display="flex" flexDir="column" gap="8px">
                            {saved.map(acc => {
                                const name = acc.role === "chef"
                                    ? `${acc.data.name || ""} ${acc.data.surname || ""}`.trim()
                                    : `${acc.data.firstName || ""} ${acc.data.lastName || ""}`.trim();
                                const phone = acc.data.phone || "";
                                const isChef = acc.role === "chef";
                                return (
                                    <Box key={acc.key} position="relative">
                                        {/* X tugmasi */}
                                        <Box position="absolute" top="50%" right="14px"
                                            style={{ transform: "translateY(-50%)", zIndex: 10 }}
                                            w="24px" h="24px" borderRadius="full"
                                            bgColor="rgba(0,0,0,0.35)"
                                            border="1px solid rgba(255,255,255,0.25)"
                                            display="flex" alignItems="center" justifyContent="center"
                                            cursor="pointer"
                                            onClick={e => remove(e, acc.key)}>
                                            <FaTimes style={{ fontSize: "8px", color: "white" }} />
                                        </Box>
                                        {/* Karta — xuddi yuqoridagi buttonlar o'lchamida */}
                                        <Box w="100%" h="54px"
                                            bgColor={isChef ? "#C0400D" : "rgba(255,255,255,0.12)"}
                                            borderRadius="16px"
                                            border={isChef ? "none" : "1px solid rgba(255,255,255,0.2)"}
                                            display="flex" alignItems="center" px="20px" gap="12px"
                                            cursor="pointer"
                                            _hover={{ opacity: 0.9 }}
                                            transition="opacity 0.2s"
                                            onClick={() => login(acc)}>
                                            {/* Avatar */}
                                            <Box flexShrink={0} w="32px" h="32px" borderRadius="10px"
                                                bgColor="rgba(255,255,255,0.2)"
                                                display="flex" alignItems="center" justifyContent="center"
                                                overflow="hidden">
                                                {acc.data.image
                                                    ? <img src={acc.data.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                    : (isChef ? <FaUserTie size={14} color="white" /> : <FaUser size={14} color="white" />)
                                                }
                                            </Box>
                                            {/* Ism */}
                                            <Box flex="1" minW={0}>
                                                <Text color="white" fontWeight="700" noOfLines={1} style={{ fontSize: "14px" }}>
                                                    {name || `+998${phone}`}
                                                </Text>
                                                <Text color="rgba(255,255,255,0.6)" style={{ fontSize: "11px" }}>
                                                    {isChef ? t("entrance.chefBtn") : t("entrance.userBtn")} · +998{phone}
                                                </Text>
                                            </Box>
                                            <FaChevronRight size={13} color="rgba(255,255,255,0.5)"
                                                style={{ flexShrink: 0, marginRight: "26px" }} />
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
};
export default Entrance;