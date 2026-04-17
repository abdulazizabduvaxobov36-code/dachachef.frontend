import React, { useState } from 'react';
import { Box, Text, Button, Textarea, useToast } from '@chakra-ui/react';
import { FaStar } from 'react-icons/fa';

const RatingModal = ({ isOpen, onClose, order, onSubmitRating }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  if (!isOpen || !order) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: 'Xatolik',
        description: 'Iltimos, baho bering',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      await onSubmitRating(order._id, rating, review);
      onClose();
      setRating(0);
      setReview('');
      toast({
        title: 'Muvaffaqiyat',
        description: 'Baho muvaffaqiyatli yuborildi',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Baho qoldirishda xatolik:', error);
      toast({
        title: 'Xatolik',
        description: 'Baho qoldirishda xatolik. Iltimos, qayta urinib ko\'ring.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const StarButton = ({ filled, onClick }) => (
    <button
      onClick={onClick}
      aria-label="Star rating"
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '4px',
        fontSize: '32px',
        color: filled ? '#FFD700' : '#E0E0E0',
        transition: 'color 0.2s ease',
      }}
    >
      <FaStar size={32} color={filled ? '#FFD700' : '#E0E0E0'} />
    </button>
  );

  return (
    <Box
      position="fixed"
      inset="0"
      bgColor="rgba(0,0,0,0.6)"
      zIndex={200}
      display="flex"
      alignItems="center"
      justifyContent="center"
      onClick={onClose}
    >
      <Box
        bgColor="white"
        w="90%"
        maxW="400px"
        borderRadius="24px"
        p="24px"
        onClick={e => e.stopPropagation()}
        boxShadow="0 4px 6px rgba(0,0,0,0.1)"
      >
        <Text fontWeight="800" color="#1C110D" mb="16px" fontSize="18px">
          Oshpazga baho bering
        </Text>

        <Box mb="16px">
          <Text fontWeight="600" color="#9B614B" mb="8px" fontSize="14px">
            Oshpaz: {order.chefName || order.chefPhone || 'Noma\'lum'}
          </Text>
          <Text fontWeight="600" color="#9B614B" mb="8px" fontSize="14px">
            Buyurtma: {order.amount ? order.amount.toLocaleString() : '0'} so'm
          </Text>
        </Box>

        <Box mb="16px">
          <Text fontWeight="600" color="#9B614B" mb="8px" fontSize="14px">
            Baho:
          </Text>
          <Box display="flex" gap="4px" justifyContent="center" mb="16px">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarButton
                key={star}
                filled={star <= rating}
                onClick={() => setRating(star)}
              />
            ))}
          </Box>
          <Text textAlign="center" color="#9B614B" fontSize="12px">
            {rating === 0 ? 'Baho bering' : `${rating} yulduz`}
          </Text>
        </Box>

        <Box mb="20px">
          <Text fontWeight="600" color="#9B614B" mb="8px" fontSize="14px">
            Izoh (ixtiyoriy):
          </Text>
          <Textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Oshpaz haqida izoh qoldiring..."
            minH="80px"
            border="1.5px solid #F0E6E0"
            borderRadius="12px"
            p="12px"
            fontSize="14px"
            resize="vertical"
            _focus={{
              borderColor: '#C03F0C',
              outline: 'none',
            }}
          />
        </Box>

        <Box display="flex" gap="12px">
          <Button
            onClick={onClose}
            flex={1}
            p="12px"
            borderRadius="12px"
            border="1.5px solid #F0E6E0"
            bg="white"
            color="#9B614B"
            fontWeight="600"
            fontSize="14px"
            _hover={{ bgColor: '#F9F5F2' }}
          >
            Bekor qilish
          </Button>
          <Button
            onClick={handleSubmit}
            isDisabled={loading}
            flex={1}
            p="12px"
            borderRadius="12px"
            bg={loading ? '#E0E0E0' : '#C03F0C'}
            color="white"
            fontWeight="600"
            fontSize="14px"
            border="none"
            _hover={{ bg: loading ? '#E0E0E0' : '#A83208' }}
            cursor={loading ? 'not-allowed' : 'pointer'}
          >
            {loading ? 'Yuborilmoqda...' : 'Baho berish'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default RatingModal;