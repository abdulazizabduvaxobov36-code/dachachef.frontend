import { Box, Button, Text, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Input } from '@chakra-ui/react';
import { useState } from 'react';
import { FaArrowLeft, FaCommentDots, FaShoppingBag } from 'react-icons/fa';
import HeroHeader from '/images/Hero Header.png';
import Container10 from '/images/Container 10.png';
import Image2 from '/images/Image 2.png';
import Image3 from '/images/Image 3.png';
import Image4 from '/images/Image 4.png';
import Image5 from '/images/Image 5.png';
import Image6 from '/images/Image 6.png';
import Image7 from '/images/Image 7.png';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Store from '../store';

const ChefProfilePage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { id } = useParams();
    const chefIndex = Number(id);
    
    // Modal state
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [orderAmount, setOrderAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSubmitted, setOrderSubmitted] = useState(false);

    const chefNames = [
        "Javlon Karimov",
        "Sardor Aliyev", 
        "Bekzod Tursunov",
        "Akmal Xasanov",
        "Dilshod Ergashev",
        "Shoxrux Ismoilov",
        "Azizbek Qodirov",
        "Jasur Rahimov",
        "Umidjon Sobirov",
        "Mirjalol Rustamov"
    ];

    // Oshpazni store'dan topish
    const allChefs = Store.getChefs();
    const realChef = allChefs[chefIndex] || null;
    const chefName = realChef
        ? `${realChef.name} ${realChef.surname}`
        : (chefNames[chefIndex] || t("common.defaultChef"));
    
    // Oshpazning o'zi profilini ko'rayotganini tekshirish
    const session = Store.getSession();
    const isOwnProfile = session?.role === 'chef' && session?.data?.phone === realChef?.phone;

    // Mijoz ma'lumotlari
    const sess = Store.getSession();
    const customerDataLS = JSON.parse(localStorage.getItem('customerData') || 'null');
    const myPhone = customerDataLS?.phone || (sess?.role === 'customer' ? sess?.data?.phone : null) || 'guest';
    
    // Mijoz ma'lumotlarini session dan ham olish
    const customerFirstName = customerDataLS?.firstName || sess?.data?.firstName || '';
    const customerLastName = customerDataLS?.lastName || sess?.data?.lastName || '';

    // Mijoz login qilganmi?
    const isCustomerLoggedIn = sess?.role === 'customer' || customerDataLS?.phone;
    
    // Bu oshpaz bilan chat mavjudmi?
    const hasChatWithChef = realChef && isCustomerLoggedIn
        ? Store.getMessages(Store.makeChatId(myPhone, realChef.phone)).length > 0
        : false;

    const galleryImages = [Image2, Image3, Image4, Image5, Image6, Image7];

    // Buyurtma berish funksiyasi
    const handleOrderSubmit = async () => {
        if (!orderAmount || Number(orderAmount) <= 0) {
            alert('Iltimos, to\'g\'ri summa kiriting');
            return;
        }

        setIsSubmitting(true);
        
        try {
            const session = Store.getSession();
            if (!session || session.role !== 'customer') {
                alert('Iltimos, avval tizimga kiring');
                return;
            }

            const customerId = session.data.phone;
            const chefId = chefIndex.toString();

            // Avval localStorage ga saqlaymiz (offline uchun)
            const pendingOrderKey = `pendingOrder_${customerId}_${chefId}`;
            localStorage.setItem(pendingOrderKey, JSON.stringify({
                customerId,
                chefId,
                price: Number(orderAmount),
                source: 'customer',
                createdAt: Date.now(),
                agreedAmount: Number(orderAmount) // Kelishilgan summa
            }));

            // Backend ga yuboramiz
            const result = await Store.createOrder(customerId, chefId, Number(orderAmount), 'customer');
            
            if (result && result.ok) {
                setOrderSubmitted(true);
                setOrderAmount('');
                setTimeout(() => {
                    setIsOrderModalOpen(false);
                    setOrderSubmitted(false);
                }, 2000);
            } else {
                // Backend ishlamasa, localStorage da saqlab qolamiz
                setOrderSubmitted(true);
                setTimeout(() => {
                    setIsOrderModalOpen(false);
                    setOrderSubmitted(false);
                }, 2000);
            }
        } catch (error) {
            console.error('Buyurtma yuborishda xatolik:', error);
            alert('Buyurtmani yuborishda xatolik yuz berdi');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box minH="100vh" bgColor="#FFF5F0" display="flex" flexDirection="column" alignItems="center" p={{ base: 2, sm: 4 }}>

            <Box display="flex" alignItems="center" justifyContent="space-between" w="100%" maxW="430px" mb={6}>
                <Button
                    style={{ width: "clamp(32px, 9vw, 40px)", height: "clamp(32px, 9vw, 40px)" }}
                    bgColor="white"
                    borderRadius="50%"
                    onClick={() => navigate("/chefspage")}
                >
                    <FaArrowLeft style={{ color: "#1C110D" }} />
                </Button>

                <Text style={{ fontSize: "clamp(16px, 4.5vw, 20px)" }} fontWeight="bold" color="#1C110D" textAlign="center">
                    {t("chefProfile.title")}
                </Text>

                <Box w="40px" />
            </Box>

            <Box width="100%" maxW="430px" w="100%">

                <Box display="flex" flexDirection="column" alignItems="center">
                    <Box w="100%" borderRadius="20px" overflow="hidden">
                        <img
                            src={HeroHeader}
                            alt="Hero Header"
                            style={{ width: '100%', display: 'block', objectFit: 'cover', height: 'clamp(160px, 45vw, 210px)' }}
                        />
                    </Box>

                    <Box mt="-50px" mb="15px">
                        <img
                            src={Container10}
                            alt="Profile"
                            style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '3px solid white',
                                display: 'inline-block'
                            }}
                        />
                    </Box>

                    <Text style={{ fontSize: "clamp(18px, 5vw, 22px)" }} fontWeight="bold" color="#1C110D">
                        {chefName}
                    </Text>

                    <Text style={{ fontSize: "clamp(13px, 4vw, 16px)" }} color="#9B614B" fontWeight="medium" mt="5px">
                        {t("chefProfile.experience", { year: realChef?.exp || 12 })}
                    </Text>
                </Box>

                <Box mt="25px" px={{ base: 3, sm: 5 }}>
                    <Text fontSize={{ base: '18px', sm: '20px' }} fontWeight="bold" color="#1C110D">
                        {t("chefProfile.about")}
                    </Text>
                    <Text style={{ fontSize: "clamp(12px, 3.5vw, 14px)" }} color="#525252" mt="10px">
                        {realChef?.about || t("chefProfile.aboutText")}
                    </Text>
                </Box>

                <Box mx={{ base: 3, sm: 4 }} mt='30px'>
                    <Box display='flex' justifyContent='space-between' alignItems='center'>
                        <Text fontSize={{ base: '18px', sm: '20px' }} fontWeight='bold' color='#1C110D'>
                            {t("chefProfile.gallery")}
                        </Text>
                    </Box>
                    <Box display='grid' gridTemplateColumns={{ base: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }} gap='10px' mt='15px'>
                        {galleryImages.map((img, idx) => (
                            <img
                                key={idx}
                                src={img}
                                alt={`Gallery ${idx}`}
                                style={{ width: '100%', borderRadius: '12px', objectFit: 'cover' }}
                            />
                        ))}
                    </Box>
                </Box>

                <Box border='1px solid #ECE9E9' mt='30px'></Box>

                <Box display='flex' flexDirection={{ base: 'column', sm: 'row' }} justifyContent='space-between' alignItems='center' mt='15px' gap='10px' mx={{ base: 3, sm: 0 }} mb='30px'>

                    {/* Buyurtma berish tugmasi - birinchi */}
                    {isCustomerLoggedIn && realChef && (
                        <Button
                            w={{ base: '100%', sm: '48%' }}
                            bgColor='white'
                            color='#C03F0C'
                            border='2px solid #C03F0C'
                            borderRadius='20px'
                            padding='15px'
                            fontSize='15px'
                            fontWeight='bold'
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            gap="8px"
                            _hover={{ bgColor: '#FFF0EC' }}
                            onClick={() => {
                                console.log('Buyurtma berish tugmasi bosildi');
                                setIsOrderModalOpen(true);
                            }}
                        >
                            <FaShoppingBag />
                            {orderSubmitted ? 'Buyurtma berildi' : 'Buyurtma berish'}
                        </Button>
                    )}

                    {/* SMS / Xabar yozish tugmasi - ikkinchi */}
                    <Button
                        w={{ base: '100%', sm: '48%' }}
                        bgColor='#C03F0C'
                        color='white'
                        borderRadius='20px'
                        padding='15px'
                        fontSize='15px'
                        fontWeight='bold'
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        gap="8px"
                        _hover={{ bgColor: '#a0300a' }}
                        onClick={() => {
                            console.log('Xabar yozish tugmasi bosildi');
                            navigate('/orderspage', { state: { chefName: chefName, chefPhone: realChef?.phone, chefId: chefIndex } });
                        }}
                    >
                        <FaCommentDots />
                        {t("chefProfile.sms")}
                    </Button>

                    {/* Buyurtma berish modali */}
                    <Modal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)}>
                        <ModalOverlay />
                        <ModalContent>
                            <ModalHeader>
                                {orderSubmitted ? 'Buyurtma yuborildi!' : 'Buyurtma berish'}
                            </ModalHeader>
                            <ModalCloseButton />
                            {!orderSubmitted ? (
                                <ModalBody>
                                    {/* Mijoz ma'lumotlari */}
                                    <Box mb={4}>
                                        <Text mb={2} fontWeight="600" color="#1C110D">Ismingiz:</Text>
                                        <Input
                                            placeholder="Ismingiz"
                                            value={customerFirstName}
                                            size="md"
                                            mb={3}
                                        />
                                    </Box>
                                    <Box mb={4}>
                                        <Text mb={2} fontWeight="600" color="#1C110D">Familiyangiz:</Text>
                                        <Input
                                            placeholder="Familiyangiz"
                                            value={customerLastName}
                                            size="md"
                                            mb={3}
                                        />
                                    </Box>
                                    {/* Summa */}
                                    <Box mb={4}>
                                        <Text mb={2} fontWeight="600" color="#1C110D" fontSize="16px">Oshpaz bilan kelishilgan summa:</Text>
                                        <Input
                                            type="number"
                                            placeholder="Kelishilgan summa (so'm)"
                                            value={orderAmount}
                                            onChange={(e) => setOrderAmount(e.target.value)}
                                            size="lg"
                                            fontSize="16px"
                                            borderColor="#F59E0B"
                                            _focus={{ borderColor: "#D97706", boxShadow: "0 0 0 3px rgba(217, 119, 6, 0.1)" }}
                                            _hover={{ borderColor: "#D97706" }}
                                        />
                                    </Box>
                                    
                                    <Box mb={4} p={4} bgColor="#FEF3C7" borderRadius="12px" border="1px solid #FCD34D">
                                        <Text color="#92400E" fontSize="14px" fontWeight="600" mb={2} display="flex" alignItems="center" gap="6px">
                                            <span>⚠️</span> Diqqat:
                                        </Text>
                                        <Text color="#92400E" fontSize="13px" lineHeight="1.5">
                                            • Bu oshpazning aldab kam pul tashlashini oldini oladi<br/>
                                            • Kelishilgan summani aniq kiriting<br/>
                                            • Noto'g'ri ma'lumot berilganda javobgarlik qo'llaniladi
                                        </Text>
                                    </Box>
                                    
                                    {orderAmount && Number(orderAmount) > 0 && (
                                        <Box p={3} bgColor="#D1FAE5" borderRadius="8px">
                                            <Text color="#065F46" fontSize="14px" fontWeight="600">
                                                🍽 Oshpazga {Number(orderAmount).toLocaleString()} so'm buyurtma beriladi.
                                            </Text>
                                        </Box>
                                    )}
                                </ModalBody>
                            ) : (
                                <ModalBody>
                                    <Box p={4} bgColor="#D1FAE5" borderRadius="8px" textAlign="center">
                                        <Text color="#065F46" fontSize="16px" fontWeight="600" mb={2}>
                                            ✅ Buyurtma muvaffaqiyatli yuborildi!
                                        </Text>
                                        <Text color="#065F46" fontSize="14px">
                                            Oshpaz tez orada siz bilan bog'lanadi.
                                        </Text>
                                    </Box>
                                </ModalBody>
                            )}
                            <ModalFooter>
                                {!orderSubmitted && (
                                    <Button variant="ghost" onClick={() => setIsOrderModalOpen(false)}>
                                        Bekor qilish
                                    </Button>
                                )}
                                <Button 
                                    bgColor="#F59E0B" 
                                    color="white" 
                                    _hover={{ bgColor: "#D97706" }}
                                    onClick={orderSubmitted ? () => setIsOrderModalOpen(false) : handleOrderSubmit}
                                    isLoading={isSubmitting}
                                    loadingText="Yuborilmoqda..."
                                >
                                    {orderSubmitted ? 'Yopish' : 'Buyurtma berish'}
                                </Button>
                            </ModalFooter>
                        </ModalContent>
                    </Modal>
                </Box>

            </Box>
        </Box>
    );
};

export default ChefProfilePage;
