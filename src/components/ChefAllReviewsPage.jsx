import { Box, Text, Button } from '@chakra-ui/react';
import { FaArrowLeft, FaStar } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

const ChefAllReviewsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const { chefProfile, ratings } = location.state || {};
    
    const [sortBy, setSortBy] = useState('newest'); // newest, highest, lowest

    const sortedRatings = [...(ratings || [])].sort((a, b) => {
        switch (sortBy) {
            case 'highest':
                return b.rating - a.rating;
            case 'lowest':
                return a.rating - b.rating;
            case 'newest':
            default:
                return new Date(b.createdAt) - new Date(a.createdAt);
        }
    });

    const fullName = chefProfile.name ? `${chefProfile.name || ""} ${chefProfile.surname || ""}`.trim() : t("chefProfileOwn.defaultName");
    const averageRating = ratings.length > 0 
        ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
        : 0;

    const handleBack = () => navigate('/chef-profile');

    return (
        <Box minH="100vh" bgColor="#FFF5F0" display="flex" flexDir="column">
            {/* Header */}
            <Box bgColor="white" px="16px" pt="14px" pb="12px" boxShadow="0 1px 0 #EBEBEB">
                <Box display="flex" alignItems="center" gap="12px">
                    <Button
                        w="40px" h="40px" borderRadius="50%"
                        bgColor="white"
                        onClick={handleBack}
                    >
                        <FaArrowLeft style={{ color: "#1C110D" }} />
                    </Button>
                    <Box flex="1">
                        <Text fontWeight="800" color="#1C110D" style={{ fontSize: "18px" }}>
                            {fullName} - Barcha izohlar
                        </Text>
                        <Text color="#9B8E8A" style={{ fontSize: "12px", marginTop: "2px" }}>
                            {ratings.length} ta izoh • ⭐ {averageRating}
                        </Text>
                    </Box>
                </Box>
            </Box>

            {/* Sort Options */}
            <Box px="16px" py="12px" bgColor="white" mt="2px">
                <Box display="flex" gap="8px" flexWrap="wrap">
                    {[
                        { value: 'newest', label: 'Eng yangi' },
                        { value: 'highest', label: 'Eng yuqori baho' },
                        { value: 'lowest', label: 'Eng past baho' }
                    ].map(option => (
                        <Button
                            key={option.value}
                            h="32px" px="12px" borderRadius="16px"
                            bgColor={sortBy === option.value ? "#C03F0C" : "#F5F3F1"}
                            color={sortBy === option.value ? "white" : "#6B6560"}
                            fontWeight="600"
                            style={{ fontSize: "12px" }}
                            _hover={{ bgColor: sortBy === option.value ? "#a0300a" : "#E8E8E8" }}
                            onClick={() => setSortBy(option.value)}
                        >
                            {option.label}
                        </Button>
                    ))}
                </Box>
            </Box>

            {/* Reviews List */}
            <Box flex="1" px="16px" py="16px" pb="80px">
                {ratings.length === 0 ? (
                    <Box textAlign="center" py="60px">
                        <Text color="#B0A8A4" style={{ fontSize: "14px" }}>
                            Hali izohlar yo'q
                        </Text>
                    </Box>
                ) : (
                    <Box display="flex" flexDir="column" gap="12px">
                        {sortedRatings.map((r, i) => (
                            <Box key={r._id || i} bgColor="white" borderRadius="16px" p="16px" boxShadow="0 2px 8px rgba(0,0,0,0.06)">
                                <Box display="flex" alignItems="flex-start" gap="12px">
                                    {/* Customer Avatar */}
                                    <Box w="40px" h="40px" borderRadius="full" bgColor="#C03F0C" flexShrink={0}
                                        display="flex" alignItems="center" justifyContent="center"
                                        color="white" fontWeight="700" style={{ fontSize: "16px" }}>
                                        {r.customerName?.charAt(0) || 'M'}
                                    </Box>
                                    
                                    {/* Review Content */}
                                    <Box flex="1">
                                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb="8px">
                                            <Box>
                                                <Text fontWeight="700" color="#1C110D" style={{ fontSize: "14px" }}>
                                                    {r.customerName || 'Mijoz'}
                                                </Text>
                                                <Box display="flex" gap="2px" mt="4px">
                                                    {[1, 2, 3, 4, 5].map(s => (
                                                        <FaStar key={s} color={s <= r.rating ? '#F4B400' : '#E0DAD7'} style={{ fontSize: "12px" }} />
                                                    ))}
                                                    <Text color="#9B8E8A" style={{ fontSize: "12px", marginLeft: "8px" }}>
                                                        {r.rating}/5
                                                    </Text>
                                                </Box>
                                            </Box>
                                            <Text color="#B0A8A4" style={{ fontSize: "11px" }}>
                                                {new Date(r.createdAt).toLocaleDateString('uz-UZ', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </Text>
                                        </Box>
                                        
                                        {r.comment && (
                                            <Text color="#6B6560" style={{ fontSize: "13px", lineHeight: "1.5" }}>
                                                {r.comment}
                                            </Text>
                                        )}
                                        
                                        {r.orderAmount && (
                                            <Box mt="8px" bgColor="#FFF5F0" borderRadius="8px" px="8px" py="4px" display="inline-block">
                                                <Text color="#9B614B" style={{ fontSize: "11px", fontWeight: "600" }}>
                                                    Buyurtma: {r.orderAmount.toLocaleString()} so'm
                                                </Text>
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default ChefAllReviewsPage;
