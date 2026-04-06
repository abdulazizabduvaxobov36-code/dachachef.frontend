import { Box, Button, Text } from '@chakra-ui/react';
import { FaArrowLeft, FaCommentDots, FaStar, FaUser, FaTimes } from 'react-icons/fa';
import HeroHeader from '../Images/Hero Header.png';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import Store from '../store';

const AUTH_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const StarRating = ({ value, onChange, readonly }) => {
    return (
        <Box display="flex" gap="6px">
            {[1, 2, 3, 4, 5].map(star => (
                <Box key={star} cursor={readonly ? 'default' : 'pointer'}
                    onClick={() => !readonly && onChange && onChange(star)}>
                    <FaStar style={{
                        fontSize: '28px',
                        color: star <= value ? '#F4B400' : '#E0DAD7',
                        transition: 'color 0.15s'
                    }} />
                </Box>
            ))}
        </Box>
    );
};

const ChefViewPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { id } = useParams();
    const [chef, setChef] = useState(Store.getChefs()[Number(id)] || null);
    const [zoomed, setZoomed] = useState(null);

    // Baho qo'shish
    const [reviews, setReviews] = useState([]);
    const [avgRating, setAvgRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [myRating, setMyRating] = useState(0);
    const [myComment, setMyComment] = useState('');
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewSuccess, setReviewSuccess] = useState(false);
    const [reviewError, setReviewError] = useState('');
    const [myExistingReview, setMyExistingReview] = useState(null);

    const session = Store.getSession();
    const isCustomer = session?.role === 'customer';
    const customerPhone = session?.data?.phone || '';
    const customerName = session?.data?.firstName || session?.data?.name || '';
    const [hasDoneOrder, setHasDoneOrder] = useState(false);

    useEffect(() => {
        const refresh = () => setChef(Store.getChefs()[Number(id)] || null);
        window.addEventListener("chefs-updated", refresh);
        const unsub = Store.listenChefs(chefs => { const u = chefs[Number(id)]; if (u) setChef(u); });
        return () => { window.removeEventListener("chefs-updated", refresh); unsub?.(); };
    }, [id]);

    // Baholarni yuklash + bajarilgan buyurtma bormi tekshirish
    useEffect(() => {
        if (!chef?.phone) return;
        loadReviews();
        if (isCustomer && customerPhone) {
            loadMyReview();
            checkDoneOrder();
        }
    }, [chef?.phone]);

    const checkDoneOrder = async () => {
        try {
            const AUTH_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:5000';
            const res = await fetch(`${AUTH_BASE}/orders/chef/${chef.phone}`);
            const data = await res.json();
            const done = (data.orders || []).some(
                o => o.status === 'done' && o.customerPhone === customerPhone
            );
            setHasDoneOrder(done);
        } catch {
            // Backend xato bo'lsa, baho qo'yishga ruxsat bermaymiz
            setHasDoneOrder(false);
        }
    };

    const loadReviews = async () => {
        try {
            const res = await fetch(`${AUTH_BASE}/reviews/${chef.phone}`);
            const data = await res.json();
            setReviews(data.reviews || []);
            setAvgRating(data.avgRating || 0);
            setTotalReviews(data.totalReviews || 0);
        } catch { }
    };

    const loadMyReview = async () => {
        try {
            const res = await fetch(`${AUTH_BASE}/reviews/${chef.phone}/customer/${customerPhone}`);
            const data = await res.json();
            if (data) {
                setMyExistingReview(data);
                setMyRating(data.rating);
                setMyComment(data.comment || '');
            }
        } catch { }
    };

    const handleSubmitReview = async () => {
        if (!myRating) { setReviewError(t('review.ratingRequired') || 'Iltimos yulduz tanlang'); return; }
        setReviewLoading(true);
        setReviewError('');
        try {
            const res = await fetch(`${AUTH_BASE}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chefPhone: chef.phone,
                    chefName: `${chef.name} ${chef.surname}`,
                    customerPhone,
                    customerName,
                    rating: myRating,
                    comment: myComment,
                }),
            });
            if (res.ok) {
                setReviewSuccess(true);
                loadReviews();
                setTimeout(() => {
                    setShowReviewModal(false);
                    setReviewSuccess(false);
                }, 1500);
            } else {
                setReviewError(t('review.saveError') || 'Xato yuz berdi');
            }
        } catch {
            setReviewError(t('review.serverError') || 'Server bilan aloqa yo\'q');
        }
        setReviewLoading(false);
    };

    const chefPosts = Store.getPosts().filter(p => p.chefPhone === chef?.phone);

    if (!chef) return (
        <Box minH="100dvh" display="flex" alignItems="center" justifyContent="center" bgColor="#FFF5F0">
            <Box textAlign="center" p="24px">
                <Text color="#9B8E8A" mb="16px" style={{ fontSize: "16px" }}>{t("chefProfile.notFound")}</Text>
                <Button bgColor="#C03F0C" color="white" borderRadius="14px" h="44px" px="24px" onClick={() => navigate(-1)}>{t("customer.back")}</Button>
            </Box>
        </Box>
    );

    const fullName = `${chef.name} ${chef.surname}`;
    const isOnline = chef.phone ? Store.isOnline("chef", chef.phone) : false;

    return (
        <Box minH="100dvh" bgColor="#FFF5F0" display="flex" flexDir="column">
            {/* Zoomed image */}
            {zoomed && (
                <Box position="fixed" inset="0" bgColor="rgba(0,0,0,0.92)" zIndex={500}
                    display="flex" alignItems="center" justifyContent="center"
                    onClick={() => setZoomed(null)}>
                    <Box position="absolute" top="16px" right="16px" w="36px" h="36px"
                        borderRadius="full" bgColor="rgba(255,255,255,0.15)"
                        display="flex" alignItems="center" justifyContent="center" cursor="pointer">
                        <FaTimes style={{ color: "white", fontSize: "16px" }} />
                    </Box>
                    <img src={zoomed} alt="" style={{ maxWidth: "95vw", maxHeight: "90vh", objectFit: "contain", borderRadius: "14px" }} onClick={e => e.stopPropagation()} />
                </Box>
            )}

            {/* Back btn */}
            <Box position="absolute" top="14px" left="14px" zIndex={10}>
                <Box w="38px" h="38px" borderRadius="full" bgColor="rgba(255,255,255,0.9)"
                    display="flex" alignItems="center" justifyContent="center" cursor="pointer"
                    boxShadow="0 2px 10px rgba(0,0,0,0.15)" onClick={() => navigate(-1)}>
                    <FaArrowLeft style={{ fontSize: "14px", color: "#1C110D" }} />
                </Box>
            </Box>

            {/* Cover */}
            <img src={HeroHeader} alt="" style={{ width: "100%", height: "200px", objectFit: "cover", display: "block" }} />

            {/* Avatar */}
            <Box display="flex" flexDir="column" alignItems="center" mt="-44px" px="16px">
                <Box position="relative" cursor="pointer" onClick={() => chef.image && setZoomed(chef.image)} mb="10px">
                    {chef.image
                        ? <img src={chef.image} alt="" style={{ width: "88px", height: "88px", borderRadius: "50%", objectFit: "cover", border: "4px solid white", boxShadow: "0 4px 14px rgba(0,0,0,0.15)" }} />
                        : <Box w="88px" h="88px" borderRadius="full" bgColor="#C03F0C" border="4px solid white" boxShadow="0 4px 14px rgba(0,0,0,0.12)" display="flex" alignItems="center" justifyContent="center">
                            <FaUser size={32} color="white" />
                        </Box>
                    }
                    <Box position="absolute" bottom="4px" right="4px" w="14px" h="14px" borderRadius="full"
                        bgColor={isOnline ? "#22C55E" : "#D1D5DB"} border="2px solid white" />
                </Box>

                <Text fontWeight="800" color="#1C110D" style={{ fontSize: "22px" }}>{fullName}</Text>
                <Box display="flex" alignItems="center" gap="8px" mt="4px">
                    {isOnline && <Box bgColor="#ECFDF5" borderRadius="8px" px="8px" py="2px">
                        <Text color="#22C55E" fontWeight="700" style={{ fontSize: "11px" }}>● {t("common.online")}</Text>
                    </Box>}
                    <Text color="#9B8E8A" style={{ fontSize: "13px" }}>{chef.exp} {t("common.experience")}</Text>
                </Box>
                {/* Reyting */}
                <Box display="flex" alignItems="center" gap="4px" mt="4px">
                    <FaStar color="#F4B400" style={{ fontSize: "13px" }} />
                    <Text color="#9B8E8A" style={{ fontSize: "13px" }}>
                        {avgRating > 0 ? avgRating : '5.0'} {totalReviews > 0 && `(${totalReviews})`}
                    </Text>
                </Box>
            </Box>

            {/* Stats */}
            <Box mx="16px" mt="16px" bgColor="white" borderRadius="18px" p="16px"
                display="flex" justifyContent="space-around" boxShadow="0 2px 10px rgba(0,0,0,0.06)">
                {[
                    { label: t("chefProfile.experience"), value: `${chef.exp || 0} ${t("common.years")}` },
                    { label: t("common.rating"), value: avgRating > 0 ? String(avgRating) : '5.0' },
                    { label: t("common.orders"), value: String(totalReviews) },
                ].map((s, i) => (
                    <Box key={i} textAlign="center">
                        <Text fontWeight="800" color="#1C110D" style={{ fontSize: "17px" }}>{s.value}</Text>
                        <Text color="#9B8E8A" style={{ fontSize: "11px" }}>{s.label}</Text>
                    </Box>
                ))}
            </Box>

            {/* About */}
            <Box mx="16px" mt="12px" bgColor="white" borderRadius="18px" p="16px" boxShadow="0 2px 10px rgba(0,0,0,0.06)">
                <Text fontWeight="700" color="#1C110D" mb="8px" style={{ fontSize: "15px" }}>{t("chefProfile.about")}</Text>
                <Text color="#6B6560" lineHeight="1.7" style={{ fontSize: "13px" }}>{t("chefProfile.aboutText")}</Text>
            </Box>

            {/* Gallery */}
            {chefPosts.length > 0 && (
                <Box mx="16px" mt="12px">
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb="10px">
                        <Text fontWeight="700" color="#1C110D" style={{ fontSize: "15px" }}>Taomlar</Text>
                        <Text color="#9B8E8A" style={{ fontSize: "12px" }}>{chefPosts.length} ta</Text>
                    </Box>
                    <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap="6px">
                        {chefPosts.map((post, i) => (
                            <Box key={i} borderRadius="12px" overflow="hidden" cursor="pointer"
                                position="relative" onClick={() => setZoomed(post.image)}>
                                <img src={post.image} alt={post.dishName}
                                    style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
                                <Box position="absolute" bottom="0" left="0" right="0"
                                    bgColor="rgba(0,0,0,0.55)" px="6px" py="4px">
                                    <Text color="white" fontWeight="600" noOfLines={1} style={{ fontSize: "11px" }}>
                                        {post.dishName}
                                    </Text>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}

            {/* BAHOLAR BO'LIMI */}
            <Box mx="16px" mt="12px" mb="8px">
                <Box display="flex" justifyContent="space-between" alignItems="center" mb="10px">
                    <Text fontWeight="700" color="#1C110D" style={{ fontSize: "15px" }}>
                        {t('review.title') || 'Mijozlar baholari'}
                    </Text>
                    {isCustomer && (
                        <Box cursor="pointer" bgColor="#FFF0EC" borderRadius="12px" px="12px" py="6px"
                            border="1.5px solid #F5C5B0"
                            onClick={() => setShowReviewModal(true)}>
                            <Text color="#C03F0C" fontWeight="700" style={{ fontSize: "12px" }}>
                                {myExistingReview
                                    ? (t('review.editBtn') || 'Bahoni o\'zgartirish')
                                    : (t('review.addBtn') || '+ Baho qo\'shish')}
                            </Text>
                        </Box>
                    )}
                </Box>

                {reviews.length === 0 ? (
                    <Box bgColor="white" borderRadius="16px" p="20px" textAlign="center"
                        boxShadow="0 2px 10px rgba(0,0,0,0.06)">
                        <Text color="#B0A8A4" style={{ fontSize: "13px" }}>
                            {t('review.noReviews') || 'Hali baho yo\'q'}
                        </Text>
                    </Box>
                ) : (
                    <Box display="flex" flexDir="column" gap="10px">
                        {reviews.map((r, i) => (
                            <Box key={i} bgColor="white" borderRadius="16px" p="14px"
                                boxShadow="0 2px 10px rgba(0,0,0,0.06)">
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb="6px">
                                    <Text fontWeight="700" color="#1C110D" style={{ fontSize: "14px" }}>
                                        {r.customerName || `+998${r.customerPhone}`}
                                    </Text>
                                    <Box display="flex" gap="2px">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <FaStar key={s} style={{ fontSize: "12px", color: s <= r.rating ? '#F4B400' : '#E0DAD7' }} />
                                        ))}
                                    </Box>
                                </Box>
                                {r.comment && (
                                    <Text color="#6B6560" style={{ fontSize: "13px", lineHeight: "1.5" }}>
                                        {r.comment}
                                    </Text>
                                )}
                                <Text color="#B0A8A4" style={{ fontSize: "11px" }} mt="6px">
                                    {new Date(r.createdAt).toLocaleDateString('uz-UZ')}
                                </Text>
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>

            {/* Action buttons */}
            <Box mx="16px" mt="8px" mb="24px">
                <Button w="100%" h="52px" bgColor="#C03F0C" color="white" borderRadius="16px"
                    fontWeight="700" style={{ fontSize: "15px" }} _hover={{ bgColor: "#a0300a" }}
                    leftIcon={<FaCommentDots size={16} />}
                    onClick={() => navigate('/orderspage', { state: { chefName: fullName, chefPhone: chef.phone } })}>
                    {t("chefProfile.sms")}
                </Button>
            </Box>

            {/* BAHO QO'SHISH MODAL */}
            {showReviewModal && (
                <Box position="fixed" inset="0" bgColor="rgba(0,0,0,0.6)" zIndex={300}
                    display="flex" alignItems="flex-end" justifyContent="center"
                    onClick={() => setShowReviewModal(false)}>
                    <Box bgColor="white" w="100%" maxW="430px" borderRadius="24px 24px 0 0"
                        p="24px" onClick={e => e.stopPropagation()}>
                        <Text fontWeight="800" color="#1C110D" mb="4px" style={{ fontSize: "18px" }}>
                            {t('review.modalTitle') || 'Oshpazni baholang'}
                        </Text>
                        <Text color="#9B614B" mb="16px" style={{ fontSize: "13px" }}>
                            {fullName}
                        </Text>

                        {/* Yulduzlar */}
                        <Box mb="16px">
                            <Text fontWeight="600" color="#9B614B" mb="10px" style={{ fontSize: "13px" }}>
                                {t('review.ratingLabel') || 'Baho (1-5 yulduz)'}
                            </Text>
                            <Box display="flex" justifyContent="center">
                                <StarRating value={myRating} onChange={setMyRating} />
                            </Box>
                            {reviewError && (
                                <Text color="#E53E3E" mt="6px" textAlign="center" style={{ fontSize: "12px" }}>
                                    ⚠ {reviewError}
                                </Text>
                            )}
                        </Box>

                        {/* Izoh */}
                        <Box mb="16px">
                            <Text fontWeight="600" color="#9B614B" mb="6px" style={{ fontSize: "13px" }}>
                                {t('review.commentLabel') || 'Izoh (ixtiyoriy)'}
                            </Text>
                            <Box bgColor="#FFF5F0" borderRadius="14px" p="12px"
                                border="1.5px solid #F0E6E0">
                                <textarea
                                    value={myComment}
                                    onChange={e => setMyComment(e.target.value)}
                                    placeholder={t('review.commentPlaceholder') || 'Oshpaz haqida fikringizni yozing...'}
                                    rows={3}
                                    style={{
                                        width: '100%', border: 'none', outline: 'none',
                                        fontSize: '14px', color: '#1C110D', background: 'transparent',
                                        resize: 'none', fontFamily: 'inherit'
                                    }}
                                />
                            </Box>
                        </Box>

                        {/* Muvaffaqiyat */}
                        {reviewSuccess && (
                            <Box mb="12px" bgColor="#F0FFF4" borderRadius="14px" px="14px" py="10px"
                                border="1px solid #BBF7D0" textAlign="center">
                                <Text fontWeight="700" color="#22C55E" style={{ fontSize: "14px" }}>
                                    ✅ {t('review.success') || 'Bahoyingiz saqlandi!'}
                                </Text>
                            </Box>
                        )}

                        <Box display="flex" gap="10px">
                            <Button flex="1" bgColor="#F5F0EE" color="#9B614B" borderRadius="26px"
                                style={{ height: "50px", fontSize: "14px" }}
                                onClick={() => { setShowReviewModal(false); setReviewError(''); }}>
                                {t('chefHome.cancel') || 'Bekor'}
                            </Button>
                            <Button flex="1" bgColor="#C03F0C" color="white" borderRadius="26px"
                                fontWeight="700" _hover={{ bgColor: '#a0300a' }}
                                isLoading={reviewLoading}
                                style={{ height: "50px", fontSize: "14px" }}
                                onClick={handleSubmitReview}>
                                {t('review.saveBtn') || 'Saqlash'}
                            </Button>
                        </Box>
                    </Box>
                </Box>
            )}
        </Box>
    );
};
export default ChefViewPage;