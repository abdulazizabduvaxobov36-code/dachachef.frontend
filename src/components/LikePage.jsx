import { Box, Text } from '@chakra-ui/react';
import { FiUser } from 'react-icons/fi';
import { FaStar, FaHeart, FaClipboardList, FaHome, FaUser } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import Store from '../store';

const LikePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const getCD = () => {
    const s = JSON.parse(localStorage.getItem('customerData') || 'null');
    if (s?.phone) return s;
    const sess = Store.getSession();
    if (sess?.role === 'customer' && sess?.data?.phone) return sess.data;
    return {};
  };
  const myPhone = getCD().phone || 'guest';

  const [allChefs, setAllChefs] = useState(Store.getChefs());
  const [likedPhones, setLikedPhones] = useState(JSON.parse(localStorage.getItem("likedChefs")) || []);
  const [search, setSearch] = useState("");
  const [animateKey, setAnimateKey] = useState(null);
  const [unreadCount, setUnreadCount] = useState(() => Store.getTotalUnreadForCustomer(myPhone));

  useEffect(() => {
    const refreshLikes = () => setLikedPhones(JSON.parse(localStorage.getItem("likedChefs")) || []);
    const refreshChefs = () => setAllChefs([...Store.getChefs()]);

    const onStorage = (e) => {
      if (e.key === 'registeredChefs') refreshChefs();
      else refreshLikes();
      setUnreadCount(Store.getTotalUnreadForCustomer(myPhone));
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("chefs-updated", refreshChefs);

    const unsub = Store.listenChefs((latest) => setAllChefs([...latest]));
    const poll = setInterval(refreshChefs, 1000);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("chefs-updated", refreshChefs);
      clearInterval(poll);
      unsub && unsub();
    };
  }, []);

  // Faqat liked oshpazlarni filter qil
  const likedChefs = allChefs.filter(c => likedPhones.includes(c.phone));
  const filtered = likedChefs.filter(c =>
    `${c.name} ${c.surname}`.toLowerCase().includes(search.toLowerCase())
  );

  const toggleLike = (phone, e) => {
    e.stopPropagation();
    const updated = likedPhones.filter(p => p !== phone);
    localStorage.setItem("likedChefs", JSON.stringify(updated));
    setLikedPhones(updated);
    setAnimateKey(phone);
    setTimeout(() => setAnimateKey(null), 300);
  };

  return (
    <Box display="flex" flexDirection="column" minH="100dvh" bgColor="#FFF5F0">
      <Box flex="1" pb="80px">

        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center"
          px={{ base: "14px", sm: "18px" }} py={{ base: "12px", sm: "14px" }}
          bgColor="white" boxShadow="0 2px 12px rgba(192,63,12,0.07)">
          <Box display="flex" alignItems="center" gap={{ base: "8px", sm: "10px" }}>
            <img src="src/Images/icons8-restaurant-48.png" alt=""
              style={{ width: "clamp(26px, 7vw, 34px)", height: "clamp(26px, 7vw, 34px)" }} />
            <Text fontWeight="bold" color="#1C110D" style={{ fontSize: "clamp(16px, 4.5vw, 20px)" }}>
              {t("glabal.logo")}
            </Text>
          </Box>
          <Box bgColor="#FFF0EC" borderRadius="full" px="10px" py="4px">
            <Text color="#C03F0C" fontWeight="bold" style={{ fontSize: "clamp(11px, 3vw, 13px)" }}>
              {likedChefs.length} ta ❤️
            </Text>
          </Box>
        </Box>

        {/* Search */}
        <Box mx={{ base: "14px", sm: "16px" }} my={{ base: "12px", sm: "14px" }}
          bgColor="white" borderRadius="18px" p={{ base: "14px", sm: "16px" }}
          boxShadow="0 4px 10px rgba(0,0,0,0.05)">
          <Text fontWeight="bold" color="#1C110D" mb={{ base: "8px", sm: "10px" }}
            style={{ fontSize: "clamp(14px, 4vw, 18px)" }}>
            {t("like.title")}
          </Text>
          <Box display="flex" alignItems="center" gap="10px" borderRadius="12px"
            bgColor="#FFF5F0" border="1px solid #F3E4DE"
            px="12px" style={{ height: "clamp(40px, 11vw, 48px)" }}>
            <FiUser color="#9B614B" style={{ fontSize: "clamp(15px, 4vw, 18px)", flexShrink: 0 }} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t("like.search")}
              style={{ width: "100%", height: "100%", outline: "none", border: "none", background: "transparent", fontSize: "16px" }} />
          </Box>
        </Box>

        {/* Chef cards */}
        <Box px={{ base: "14px", sm: "16px" }} display="flex" flexDir="column" gap={{ base: "8px", sm: "10px" }}>
          {filtered.length === 0 && (
            <Box display="flex" flexDir="column" alignItems="center" justifyContent="center" py="50px">
              <FaHeart size={52} color="#FFF0EC" />
              <Text mt="14px" color="#9B614B" style={{ fontSize: "clamp(13px, 3.5vw, 14px)" }}>
                {likedChefs.length === 0 ? t("like.noLikes") : t("like.notFound")}
              </Text>
            </Box>
          )}
          {filtered.map((chef, index) => {
            const fullName = `${chef.name} ${chef.surname}`;
            const isOnline = Store.isOnline("chef", chef.phone);
            const regIdx = allChefs.findIndex(c => c.phone === chef.phone);
            return (
              <Box key={chef.phone} bgColor="white" borderRadius={{ base: "16px", sm: "18px" }}
                p={{ base: "12px", sm: "14px" }} cursor="pointer"
                transition="transform 0.2s, box-shadow 0.2s"
                _hover={{ transform: "scale(1.02)", boxShadow: "0 8px 20px rgba(0,0,0,0.12)" }}
                boxShadow="0 2px 12px rgba(192,63,12,0.07)"
                onClick={() => navigate(`/chef-view/${regIdx}`)}>
                <Box display="flex" flexDir="row" alignItems="center" gap={{ base: "10px", sm: "14px" }}>
                  <Box position="relative" flexShrink={0}>
                    {chef.image ? (
                      <img src={chef.image} alt=""
                        style={{ width: "clamp(56px, 15vw, 70px)", height: "clamp(56px, 15vw, 70px)", borderRadius: "12px", objectFit: "cover" }} />
                    ) : (
                      <Box borderRadius="12px" bgColor="#FFF0EC"
                        display="flex" alignItems="center" justifyContent="center"
                        style={{ width: "clamp(56px, 15vw, 70px)", height: "clamp(56px, 15vw, 70px)" }}>
                        <Text fontWeight="bold" color="#C03F0C" style={{ fontSize: "clamp(18px, 5vw, 24px)" }}>
                          {chef.name?.charAt(0)}
                        </Text>
                      </Box>
                    )}
                    <Box position="absolute" bottom="3px" right="3px" w="10px" h="10px"
                      borderRadius="full" border="2px solid white"
                      bgColor={isOnline ? "#22C55E" : "#D1D5DB"} />
                  </Box>
                  <Box flex="1" minW={0}>
                    <Box display="flex" alignItems="center" gap="6px" flexWrap="wrap">
                      <Text fontWeight="bold" color="#1C110D" style={{ fontSize: "clamp(13px, 3.5vw, 15px)" }}>
                        {fullName}
                      </Text>
                      {isOnline && (
                        <Box bgColor="#F0FFF4" borderRadius="full" px="6px" py="1px">
                          <Text color="#22C55E" fontWeight="600" style={{ fontSize: "9px" }}>{t("common.online")}</Text>
                        </Box>
                      )}
                    </Box>
                    <Text color="#C03F0C" style={{ fontSize: "clamp(11px, 3vw, 13px)" }}>
                      {chef.exp} {t("common.experience")}
                    </Text>
                    <Box display="flex" alignItems="center" gap="4px" mt="2px">
                      <FaStar color="#F4B400" style={{ fontSize: "clamp(10px, 2.8vw, 12px)" }} />
                      <Text color="#9B614B" style={{ fontSize: "clamp(10px, 2.8vw, 12px)" }}>5.0</Text>
                    </Box>
                  </Box>
                  <Box cursor="pointer" transition="transform 0.3s"
                    transform={animateKey === chef.phone ? "scale(1.4)" : "scale(1)"}
                    onClick={e => toggleLike(chef.phone, e)}>
                    <FaHeart style={{ fontSize: "clamp(16px, 4.5vw, 20px)", color: "#C03F0C" }} />
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Bottom Nav */}
      <Box className="fixed-bottom" bgColor="white" borderTop="1px solid #F0EBE6"
        display="flex" justifyContent="space-around" alignItems="center"
        py={{ base: "8px", sm: "10px" }} zIndex={10}>
        {[
          { icon: FaHome, route: "/glabal", label: t("footer.home"), badge: 0 },
          { icon: FaClipboardList, route: "/orderspage", label: t("footer.orders"), badge: unreadCount },
          { icon: FaHeart, route: "/like", label: t("footer.like"), badge: 0 },
          { icon: FaUser, route: "/profile", label: t("footer.profile"), badge: 0 },
        ].map(tab => (
          <Box key={tab.route} display="flex" flexDir="column" alignItems="center"
            cursor="pointer" px={{ base: "10px", sm: "14px" }} onClick={() => navigate(tab.route)}>
            <Box position="relative" display="inline-block">
              <tab.icon style={{ fontSize: "clamp(18px, 5vw, 22px)", color: location.pathname === tab.route ? '#C03F0C' : '#B0A8A4' }} />
              {tab.badge > 0 && (
                <Box position="absolute" top="-5px" right="-8px" minW="16px" h="16px" px="3px"
                  bgColor="#C03F0C" borderRadius="full" display="flex" alignItems="center"
                  justifyContent="center" color="white" fontWeight="bold" style={{ fontSize: "9px" }}>
                  {tab.badge > 9 ? "9+" : tab.badge}
                </Box>
              )}
            </Box>
            <Text mt="3px" fontWeight="bold"
              style={{ fontSize: '10px', color: location.pathname === tab.route ? '#C03F0C' : '#B0A8A4' }}>
              {tab.label}
            </Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default LikePage;
