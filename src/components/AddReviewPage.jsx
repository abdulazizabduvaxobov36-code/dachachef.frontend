import { Box, Text, Button } from '@chakra-ui/react';
import { FaArrowLeft, FaStar } from 'react-icons/fa';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Store from '../store';

const API = import.meta.env?.VITE_API_URL || 'http://localhost:5000';

const AddReviewPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { chefPhone, chefName, type } = location.state || {};
    const isRating = type === 'rating';

    const session = Store.getSession();
    const customerPhone = session?.data?.phone || 'http://localhost:5000';
    const customerName = session?.data?.firstName || session?.data?.name || 'http://localhost:5000';

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (isRating && rating === 0) { setError('Iltimos yulduz tanlang'); return; }
        if (!comment.trim() && !isRating) { setError('Izoh yozing'); return; }
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chefPhone,
                    chefName,
                    customerPhone,
                    customerName,
                    rating: isRating ? rating : 0,
                    comment: comment.trim(),
                    type: isRating ? 'rating' : 'comment',
                }),
            });
            if (res.ok) {
                setSuccess(true);
                setTimeout(() => navigate(-1), 1500);
            } else {
                setError('Xatolik yuz berdi');
            }
        } catch {
            setError('Server bilan aloqa yo\'q');
        }
        setLoading(false);
    };

    return (
        <Box minH="100dvh" bgColor="#FFF5F0">
            {/* Header */}
            <Box bgColor="white" px="16px" py="14px" display="flex" alignItems="center" gap="12px"
                boxShadow="0 1px 0 #F0EBE6">
                <Box w="36px" h="36px" borderRadius="full" bgColor="#FFF0EC"
                    display="flex" alignItems="center" justifyContent="center"
                    cursor="pointer" onClick={() => navigate(-1)}>
                    <FaArrowLeft style={{ fontSize: '14px', color: '#C03F0C' }} />
                </Box>
                <Text fontWeight="800" color="#1C110D" style={{ fontSize: '18px' }}>
                    {isRating ? 'Izoh + Baho' : 'Izoh yozish'}
                </Text>
            </Box>

            <Box px="16px" pt="20px" pb="100px">
                {/* Chef nomi */}
                <Box bgColor="white" borderRadius="16px" p="14px" mb="16px"
                    boxShadow="0 2px 8px rgba(0,0,0,0.06)">
                    <Text color="#9B614B" style={{ fontSize: '12px', fontWeight: '600' }}>OSHPAZ</Text>
                    <Text fontWeight="800" color="#1C110D" style={{ fontSize: '18px' }}>{chefName}</Text>
                </Box>

                {/* Yulduzlar — faqat rating uchun */}
                {isRating && (
                    <Box bgColor="white" borderRadius="16px" p="16px" mb="16px"
                        boxShadow="0 2px 8px rgba(0,0,0,0.06)">
                        <Text fontWeight="700" color="#1C110D" mb="12px" style={{ fontSize: '15px' }}>Baho bering</Text>
                        <Box display="flex" justifyContent="center" gap="8px">
                            {[1, 2, 3, 4, 5].map(star => (
                                <Box key={star} cursor="pointer" onClick={() => setRating(star)}>
                                    <FaStar style={{ fontSize: '36px', color: star <= rating ? '#F4B400' : '#E0DAD7', transition: 'color 0.15s' }} />
                                </Box>
                            ))}
                        </Box>
                        {rating > 0 && (
                            <Text textAlign="center" color="#C03F0C" fontWeight="700" mt="10px" style={{ fontSize: '14px' }}>
                                {['', 'Yomon', 'Qoniqarli', 'Yaxshi', 'Juda yaxshi', 'Ajoyib'][rating]}
                            </Text>
                        )}
                    </Box>
                )}

                {/* Izoh */}
                <Box bgColor="white" borderRadius="16px" p="16px" mb="16px"
                    boxShadow="0 2px 8px rgba(0,0,0,0.06)">
                    <Text fontWeight="700" color="#1C110D" mb="10px" style={{ fontSize: '15px' }}>
                        {isRating ? 'Izoh (ixtiyoriy)' : 'Izohingizni yozing'}
                    </Text>
                    <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Oshpaz haqida fikringizni yozing..."
                        rows={5}
                        style={{
                            width: '100%', border: '1.5px solid #F0E6E0', outline: 'none',
                            fontSize: '15px', color: '#1C110D', background: '#FFF5F0',
                            resize: 'none', fontFamily: 'inherit', borderRadius: '12px',
                            padding: '12px',
                        }}
                    />
                </Box>

                {error && (
                    <Box bgColor="#FFF5F5" borderRadius="12px" px="14px" py="10px" mb="12px"
                        border="1px solid #FECDCA">
                        <Text color="#E53E3E" fontWeight="600" style={{ fontSize: '13px' }}>⚠ {error}</Text>
                    </Box>
                )}

                {success && (
                    <Box bgColor="#F0FFF4" borderRadius="12px" px="14px" py="10px" mb="12px"
                        border="1px solid #BBF7D0" textAlign="center">
                        <Text color="#22C55E" fontWeight="700" style={{ fontSize: '14px' }}>✅ Saqlandi!</Text>
                    </Box>
                )}
            </Box>

            {/* Bottom button */}
            <Box position="fixed" bottom="0" left="50%" style={{ transform: 'translateX(-50%)' }}
                width="100%" maxW="430px" bgColor="white" px="16px" py="12px"
                borderTop="1px solid #F0EBE6">
                <Button w="100%" h="52px"
                    bgColor={isRating ? '#C03F0C' : '#1C110D'}
                    color="white" borderRadius="16px" fontWeight="700"
                    style={{ fontSize: '15px' }}
                    isLoading={loading}
                    onClick={handleSubmit}>
                    {isRating ? '⭐ Baho va izoh yuborish' : '💬 Izoh yuborish'}
                </Button>
            </Box>
        </Box>
    );
};
export default AddReviewPage;