import { Box, Text } from '@chakra-ui/react';
import { FaArrowLeft, FaStar, FaComment } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const API = import.meta.env?.VITE_API_URL || 'http://localhost:5000';

const ChefAllReviewsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { chefPhone, chefName } = location.state || {};

    const [reviews, setReviews] = useState([]);
    const [avgRating, setAvgRating] = useState(0);
    const [loading, setLoading] = useState(true);
    // filter: 'all' | 'comment' | 'rating'
    const [filter, setFilter] = useState('all');
    const [showDropdown, setShowDropdown] = useState(false);

    const loadReviews = () => {
        if (!chefPhone) return;
        const lsKey = `reviews_${chefPhone}`;
        const localReviews = JSON.parse(localStorage.getItem(lsKey) || '[]');

        fetch(`${API}/reviews/${chefPhone}`)
            .then(r => r.json())
            .then(data => {
                const serverReviews = data.reviews || [];
                // Serverda yo'q bo'lgan local reviewlarni ham qo'shamiz
                const merged = [
                    ...localReviews.filter(lr =>
                        !serverReviews.some(sr => sr.createdAt === lr.createdAt && sr.customerPhone === lr.customerPhone)
                    ),
                    ...serverReviews,
                ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setReviews(merged);
                const rated = merged.filter(r => r.rating > 0);
                setAvgRating(rated.length > 0 ? +(rated.reduce((s, r) => s + r.rating, 0) / rated.length).toFixed(1) : data.avgRating || 0);
                setLoading(false);
            })
            .catch(() => {
                // Server offline — faqat localdan yuklaymiz
                if (localReviews.length > 0) {
                    setReviews(localReviews);
                    const rated = localReviews.filter(r => r.rating > 0);
                    setAvgRating(rated.length > 0 ? +(rated.reduce((s, r) => s + r.rating, 0) / rated.length).toFixed(1) : 0);
                }
                setLoading(false);
            });
    };

    useEffect(() => {
        if (!chefPhone) return;
        loadReviews();
        const iv = setInterval(loadReviews, 5000);
        return () => clearInterval(iv);
    }, [chefPhone]);

    if (!chefPhone) return (
        <Box minH="100dvh" display="flex" alignItems="center" justifyContent="center">
            <Text color="#9B8E8A">Ma'lumot topilmadi</Text>
        </Box>
    );

    const allReviews = reviews;
    const commentOnly = reviews.filter(r => !r.rating || r.rating === 0);
    const ratingReviews = reviews.filter(r => r.rating && r.rating > 0);

    const displayed = filter === 'all' ? allReviews : filter === 'comment' ? commentOnly : ratingReviews;

    const filterOptions = [
        { key: 'all', label: 'Hamma izohlar', count: allReviews.length },
        { key: 'comment', label: 'Izohlar', count: commentOnly.length },
        { key: 'rating', label: 'Izoh va baholar', count: ratingReviews.length },
    ];
    const currentFilter = filterOptions.find(f => f.key === filter);

    return (
        <Box minH="100dvh" bgColor="#FFF5F0">
            {/* Header */}
            <Box bgColor="white" px="16px" py="14px" display="flex" alignItems="center" gap="12px"
                boxShadow="0 1px 0 #F0EBE6" position="sticky" top="0" zIndex={50}>
                <Box w="36px" h="36px" borderRadius="full" bgColor="#FFF0EC"
                    display="flex" alignItems="center" justifyContent="center"
                    cursor="pointer" onClick={() => navigate(-1)}>
                    <FaArrowLeft style={{ fontSize: '14px', color: '#C03F0C' }} />
                </Box>
                <Box flex="1" minW={0}>
                    <Text fontWeight="800" color="#1C110D" noOfLines={1} style={{ fontSize: '17px' }}>{chefName}</Text>
                    <Text color="#9B8E8A" style={{ fontSize: '12px' }}>
                        {reviews.length} ta izoh {avgRating > 0 && `· ⭐ ${avgRating}`}
                    </Text>
                </Box>

                {/* Dropdown filter */}
                <Box position="relative">
                    <Box cursor="pointer" bgColor="#FFF0EC" borderRadius="12px" px="12px" py="7px"
                        border="1.5px solid #F5C5B0" display="flex" alignItems="center" gap="6px"
                        onClick={() => setShowDropdown(v => !v)}>
                        <Text color="#C03F0C" fontWeight="700" style={{ fontSize: '12px' }}>
                            {currentFilter?.label}
                        </Text>
                        <Text color="#C03F0C" style={{ fontSize: '10px' }}>▼</Text>
                    </Box>
                    {showDropdown && (
                        <Box position="absolute" top="44px" right="0" bgColor="white" borderRadius="16px"
                            boxShadow="0 8px 24px rgba(0,0,0,0.12)" zIndex={100} overflow="hidden"
                            border="1px solid #F0E6E0" minW="180px">
                            {filterOptions.map(opt => (
                                <Box key={opt.key} px="16px" py="12px" cursor="pointer"
                                    bgColor={filter === opt.key ? '#FFF0EC' : 'white'}
                                    _hover={{ bgColor: '#FFF5F2' }}
                                    display="flex" justifyContent="space-between" alignItems="center"
                                    onClick={() => { setFilter(opt.key); setShowDropdown(false); }}>
                                    <Text fontWeight={filter === opt.key ? '700' : '500'}
                                        color={filter === opt.key ? '#C03F0C' : '#1C110D'}
                                        style={{ fontSize: '13px' }}>
                                        {opt.label}
                                    </Text>
                                    <Box bgColor={filter === opt.key ? '#C03F0C' : '#F0E6E0'}
                                        color={filter === opt.key ? 'white' : '#9B614B'}
                                        borderRadius="full" px="7px" py="1px"
                                        style={{ fontSize: '11px', fontWeight: '700' }}>
                                        {opt.count}
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Tashqariga bossa dropdown yopilsin */}
            {showDropdown && (
                <Box position="fixed" inset="0" zIndex={49} onClick={() => setShowDropdown(false)} />
            )}

            {/* Reviews */}
            <Box px="16px" pt="14px" pb="80px" display="flex" flexDir="column" gap="10px">
                {loading ? (
                    <Box textAlign="center" py="40px">
                        <Text color="#B0A8A4" style={{ fontSize: '14px' }}>Yuklanmoqda...</Text>
                    </Box>
                ) : displayed.length === 0 ? (
                    <Box bgColor="white" borderRadius="16px" p="24px" textAlign="center"
                        boxShadow="0 2px 8px rgba(0,0,0,0.06)">
                        <Text color="#B0A8A4" style={{ fontSize: '14px' }}>Bu bo'limda izoh yo'q</Text>
                    </Box>
                ) : displayed.map((r, i) => (
                    <Box key={r._id || i} bgColor="white" borderRadius="16px" p="14px"
                        boxShadow="0 2px 8px rgba(0,0,0,0.06)">
                        <Box display="flex" alignItems="center" gap="10px" mb="8px">
                            <Box w="36px" h="36px" borderRadius="full" bgColor="#C03F0C" flexShrink={0}
                                display="flex" alignItems="center" justifyContent="center"
                                color="white" fontWeight="700" style={{ fontSize: '14px' }}>
                                {r.customerName?.charAt(0) || 'M'}
                            </Box>
                            <Box flex="1" minW={0}>
                                <Text fontWeight="700" color="#1C110D" style={{ fontSize: '14px' }}>
                                    {r.customerName || `+998${r.customerPhone}`}
                                </Text>
                                <Text color="#B0A8A4" style={{ fontSize: '11px' }}>
                                    {new Date(r.createdAt).toLocaleDateString('uz-UZ')}
                                </Text>
                            </Box>
                            {r.rating > 0 ? (
                                <Box display="flex" gap="2px">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <FaStar key={s} style={{ fontSize: '12px', color: s <= r.rating ? '#F4B400' : '#E0DAD7' }} />
                                    ))}
                                </Box>
                            ) : (
                                <Box bgColor="#FFF0EC" borderRadius="8px" px="8px" py="3px">
                                    <FaComment style={{ fontSize: '11px', color: '#C03F0C' }} />
                                </Box>
                            )}
                        </Box>
                        {r.comment && (
                            <Text color="#6B6560" style={{ fontSize: '13px', lineHeight: '1.6' }}>{r.comment}</Text>
                        )}
                    </Box>
                ))}
            </Box>
        </Box>
    );
};
export default ChefAllReviewsPage;