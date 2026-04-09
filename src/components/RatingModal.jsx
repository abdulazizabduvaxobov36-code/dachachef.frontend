import React, { useState } from 'react';
import { Box, Text, Button, Textarea, StarIcon } from '@chakra-ui/react';

const RatingModal = ({ isOpen, onClose, order, onSubmitRating }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !order) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Iltimos, baho bering');
      return;
    }

    setLoading(true);
    try {
      await onSubmitRating(order._id, rating, review);
      onClose();
      setRating(0);
      setReview('');
    } catch (error) {
      alert('Baho qoldirishda xatolik: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const StarButton = ({ filled, onClick }) => (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '4px',
        fontSize: '32px',
        color: filled ? '#FFD700' : '#E0E0E0',
      }}
    >
      {filled ? 'filled' : 'o'}
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
      >
        <Text fontWeight="800" color="#1C110D" mb="16px" style={{ fontSize: "18px" }}>
          Oshpazga baho bering
        </Text>

        <Box mb="16px">
          <Text fontWeight="600" color="#9B614B" mb="8px" style={{ fontSize: "14px" }}>
            Oshpaz: {order.chefName || order.chefPhone}
          </Text>
          <Text fontWeight="600" color="#9B614B" mb="8px" style={{ fontSize: "14px" }}>
            Buyurtma: {order.amount.toLocaleString()} so'm
          </Text>
        </Box>

        <Box mb="16px">
          <Text fontWeight="600" color="#9B614B" mb="8px" style={{ fontSize: "14px" }}>
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
          <Text textAlign="center" color="#9B614B" style={{ fontSize: "12px" }}>
            {rating === 0 ? 'Baho bering' : `${rating} yulduz`}
          </Text>
        </Box>

        <Box mb="20px">
          <Text fontWeight="600" color="#9B614B" mb="8px" style={{ fontSize: "14px" }}>
            Izoh (ixtiyoriy):
          </Text>
          <Textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Oshpaz haqida izoh qoldiring..."
            style={{
              width: "100%",
              minHeight: "80px",
              border: "1.5px solid #F0E6E0",
              borderRadius: "12px",
              padding: "12px",
              fontSize: "14px",
              resize: "vertical",
            }}
          />
        </Box>

        <Box display="flex" gap="12px">
          <Button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "12px",
              border: "1.5px solid #F0E6E0",
              background: "white",
              color: "#9B614B",
              fontWeight: "600",
              fontSize: "14px",
            }}
          >
            Bekor qilish
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "12px",
              background: loading ? "#E0E0E0" : "#C03F0C",
              color: "white",
              fontWeight: "600",
              fontSize: "14px",
              border: "none",
            }}
          >
            {loading ? 'Yuborilmoqda...' : 'Baho berish'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default RatingModal;
