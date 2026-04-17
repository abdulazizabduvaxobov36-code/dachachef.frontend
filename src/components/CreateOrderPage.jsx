import { Box, Button, Text } from '@chakra-ui/react';
import { useState } from 'react';
import { FaArrowLeft, FaShoppingBag, FaCheckCircle } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import Store from '../store';

const CreateOrderPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const chefName = location.state?.chefName || 'Oshpaz';
    const chefPhone = location.state?.chefPhone || '';
    const chefId = location.state?.chefId ?? null;

    // Mijoz ma'lumotlari
    const sess = Store.getSession();
    const customerDataLS = JSON.parse(localStorage.getItem('customerData') || 'null');
    const myPhone = customerDataLS?.phone || (sess?.role === 'customer' ? sess?.data?.phone : null) || 'guest';
    const myName = customerDataLS?.firstName
        ? `${customerDataLS.firstName} ${customerDataLS.lastName || ''}`.trim()
        : (sess?.data?.firstName ? `${sess.data.firstName} ${sess.data.lastName || ''}`.trim() : 'Mijoz');

    const [taom, setTaom] = useState('');
    const [narx, setNarx] = useState('');
    const [vaqt, setVaqt] = useState('');
    const [izoh, setIzoh] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!taom.trim()) { setError("Taom nomini kiriting!"); return; }
        if (!narx.trim()) { setError("Narxni kiriting!"); return; }
        if (!vaqt.trim()) { setError("Vaqtni kiriting!"); return; }
        setError('');
        setLoading(true);

        try {
            const BASE = import.meta.env?.VITE_API_URL || 'http://localhost:5000';
            const orderData = {
                customerPhone: myPhone,
                customerName: myName,
                chefPhone: chefPhone,
                chefName: chefName,
                taom: taom.trim(),
                amount: Number(narx.replace(/\D/g, '')),
                vaqt: vaqt.trim(),
                izoh: izoh.trim(),
                status: 'pending',
            };

            const res = await fetch(`${BASE}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });

            // Chat orqali oshpazga xabar yuborish
            const chatId = Store.makeChatId(myPhone, chefPhone);
            const orderMsg = `📦 Buyurtma:\nTaom: ${taom}\nNarx: ${Number(narx.replace(/\D/g, '')).toLocaleString()} so'm\nVaqt: ${vaqt}${izoh ? '\nIzoh: ' + izoh : ''}`;
            Store.sendMessage(chatId, { text: orderMsg, sender: 'customer', from: myPhone, to: chefPhone });

            setSent(true);
        } catch (e) {
            // Agar server yo'q bo'lsa ham chat orqali yuborilsin
            const chatId = Store.makeChatId(myPhone, chefPhone);
            const orderMsg = `📦 Buyurtma:\nTaom: ${taom}\nNarx: ${Number(narx.replace(/\D/g, '')).toLocaleString()} so'm\nVaqt: ${vaqt}${izoh ? '\nIzoh: ' + izoh : ''}`;
            Store.sendMessage(chatId, { text: orderMsg, sender: 'customer', from: myPhone, to: chefPhone });
            setSent(true);
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <Box minH="100vh" bgColor="#FFF5F0" display="flex" flexDirection="column" alignItems="center" justifyContent="center" p={4}>
                <Box textAlign="center" maxW="360px">
                    <FaCheckCircle size={64} color="#22C55E" style={{ margin: '0 auto 16px' }} />
                    <Text fontSize="22px" fontWeight="800" color="#1C110D" mb={2}>
                        Buyurtma yuborildi!
                    </Text>
                    <Text color="#9B614B" mb={6} fontSize="14px">
                        <b>{chefName}</b> sizning buyurtmangizni ko'rdi. Tez orada javob beradi.
                    </Text>
                    <Button
                        w="100%"
                        bgColor="#C03F0C"
                        color="white"
                        borderRadius="20px"
                        padding="15px"
                        fontSize="15px"
                        fontWeight="bold"
                        _hover={{ bgColor: '#a0300a' }}
                        onClick={() => navigate('/orderspage', { state: { chefPhone, chefName } })}
                    >
                        Chatga o'tish
                    </Button>
                    <Button
                        w="100%"
                        variant="ghost"
                        color="#C03F0C"
                        mt={3}
                        onClick={() => navigate('/glabal')}
                    >
                        Bosh sahifaga qaytish
                    </Button>
                </Box>
            </Box>
        );
    }

    return (
        <Box minH="100vh" bgColor="#FFF5F0" display="flex" flexDirection="column" alignItems="center" p={{ base: 2, sm: 4 }}>
            {/* Header */}
            <Box display="flex" alignItems="center" justifyContent="space-between" w="100%" maxW="430px" mb={6}>
                <Button
                    style={{ width: "clamp(32px, 9vw, 40px)", height: "clamp(32px, 9vw, 40px)" }}
                    bgColor="white"
                    borderRadius="50%"
                    onClick={() => navigate(-1)}
                >
                    <FaArrowLeft style={{ color: "#1C110D" }} />
                </Button>
                <Text style={{ fontSize: "clamp(16px, 4.5vw, 20px)" }} fontWeight="bold" color="#1C110D" textAlign="center">
                    Buyurtma berish
                </Text>
                <Box w="40px" />
            </Box>

            <Box w="100%" maxW="430px" bgColor="white" borderRadius="20px" p={5} boxShadow="0 2px 12px rgba(0,0,0,0.07)">
                {/* Oshpaz nomi */}
                <Box mb={5} p={3} bgColor="#FFF0EC" borderRadius="12px" display="flex" alignItems="center" gap={3}>
                    <FaShoppingBag color="#C03F0C" size={20} />
                    <Box>
                        <Text fontSize="12px" color="#9B614B">Buyurtma berilmoqda:</Text>
                        <Text fontSize="15px" fontWeight="700" color="#1C110D">{chefName}</Text>
                    </Box>
                </Box>

                {/* Taom nomi */}
                <Box mb={4}>
                    <Text fontSize="13px" fontWeight="600" color="#1C110D" mb={1}>
                        Taom nomi <span style={{ color: '#C03F0C' }}>*</span>
                    </Text>
                    <input
                        placeholder="Masalan: Osh, Manti, Lag'mon..."
                        value={taom}
                        onChange={e => setTaom(e.target.value)}
                        style={{
                            width: '100%', padding: '12px 14px', borderRadius: '12px',
                            border: '1.5px solid #ECE9E9', fontSize: '14px', color: '#1C110D',
                            outline: 'none', boxSizing: 'border-box', background: '#FAFAFA'
                        }}
                    />
                </Box>

                {/* Narx */}
                <Box mb={4}>
                    <Text fontSize="13px" fontWeight="600" color="#1C110D" mb={1}>
                        Kelishilgan narx (so'm) <span style={{ color: '#C03F0C' }}>*</span>
                    </Text>
                    <input
                        placeholder="Masalan: 50000"
                        value={narx}
                        onChange={e => setNarx(e.target.value)}
                        type="number"
                        style={{
                            width: '100%', padding: '12px 14px', borderRadius: '12px',
                            border: '1.5px solid #ECE9E9', fontSize: '14px', color: '#1C110D',
                            outline: 'none', boxSizing: 'border-box', background: '#FAFAFA'
                        }}
                    />
                </Box>

                {/* Vaqt */}
                <Box mb={4}>
                    <Text fontSize="13px" fontWeight="600" color="#1C110D" mb={1}>
                        Tayyorlanish vaqti <span style={{ color: '#C03F0C' }}>*</span>
                    </Text>
                    <input
                        placeholder="Masalan: Bugun soat 18:00"
                        value={vaqt}
                        onChange={e => setVaqt(e.target.value)}
                        style={{
                            width: '100%', padding: '12px 14px', borderRadius: '12px',
                            border: '1.5px solid #ECE9E9', fontSize: '14px', color: '#1C110D',
                            outline: 'none', boxSizing: 'border-box', background: '#FAFAFA'
                        }}
                    />
                </Box>

                {/* Izoh */}
                <Box mb={5}>
                    <Text fontSize="13px" fontWeight="600" color="#1C110D" mb={1}>
                        Qo'shimcha izoh
                    </Text>
                    <textarea
                        placeholder="Maxsus so'rovlar, manzil, yetkazib berish va boshqalar..."
                        value={izoh}
                        onChange={e => setIzoh(e.target.value)}
                        rows={3}
                        style={{
                            width: '100%', padding: '12px 14px', borderRadius: '12px',
                            border: '1.5px solid #ECE9E9', fontSize: '14px', color: '#1C110D',
                            outline: 'none', boxSizing: 'border-box', background: '#FAFAFA',
                            resize: 'vertical', fontFamily: 'inherit'
                        }}
                    />
                </Box>

                {/* Xato */}
                {error && (
                    <Box mb={3} p={3} bgColor="#FEE2E2" borderRadius="10px">
                        <Text fontSize="13px" color="#C53030" fontWeight="600">{error}</Text>
                    </Box>
                )}

                {/* Yuborish */}
                <Button
                    w="100%"
                    bgColor="#C03F0C"
                    color="white"
                    borderRadius="20px"
                    padding="16px"
                    fontSize="15px"
                    fontWeight="bold"
                    _hover={{ bgColor: '#a0300a' }}
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? 'Yuborilmoqda...' : 'Buyurtmani yuborish'}
                </Button>
            </Box>
        </Box>
    );
};

export default CreateOrderPage;