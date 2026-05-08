import { Box, Text, Textarea, Button, VStack } from '@chakra-ui/react';
import { FaTelegram } from 'react-icons/fa';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || '';

const BlockedPage = () => {
    const navigate = useNavigate();
    const [msgText, setMsgText] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [myFeedbacks, setMyFeedbacks] = useState([]);
    const phoneRef = useRef(null);
    const roleRef = useRef(null);
    const nameRef = useRef(null);

    useEffect(() => {
        const chefProfile = JSON.parse(localStorage.getItem('chefProfile') || 'null');
        const customerData = JSON.parse(localStorage.getItem('customerData') || 'null');
        const isChef = !!chefProfile?.phone;
        phoneRef.current = chefProfile?.phone || customerData?.phone;
        roleRef.current = isChef ? 'chef' : 'customer';
        nameRef.current = isChef
            ? `${chefProfile?.name || ''} ${chefProfile?.surname || ''}`.trim()
            : `${customerData?.firstName || ''} ${customerData?.lastName || ''}`.trim();
    }, []);

    // Check if unblocked + load my feedbacks
    useEffect(() => {
        const check = async () => {
            const phone = phoneRef.current;
            if (!phone) return;
            const isChef = roleRef.current === 'chef';
            const cacheKey = isChef ? `blk_chef_${phone}` : `blk_customer_${phone}`;
            try {
                const r = await fetch(`${API}/${isChef ? 'chefs' : 'customers'}/${phone}`);
                if (r.ok) {
                    const data = await r.json();
                    if (!data?.isBlocked) {
                        localStorage.removeItem(cacheKey);
                        navigate(isChef ? '/chef-home' : '/glabal', { replace: true });
                        return;
                    }
                }
            } catch { }

            // Load feedbacks
            try {
                const fr = await fetch(`${API}/feedback/my/${phone}`);
                if (fr.ok) setMyFeedbacks(await fr.json());
            } catch { }
        };

        check();
        const iv = setInterval(check, 8000);
        return () => clearInterval(iv);
    }, []);

    const sendMsg = async () => {
        if (!msgText.trim() || !phoneRef.current) return;
        setSending(true);
        try {
            await fetch(`${API}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: phoneRef.current,
                    name: nameRef.current || '',
                    role: roleRef.current,
                    message: msgText.trim(),
                }),
            });
            setMsgText('');
            setSent(true);
            setTimeout(() => setSent(false), 3000);
            // Reload feedbacks
            const fr = await fetch(`${API}/feedback/my/${phoneRef.current}`);
            if (fr.ok) setMyFeedbacks(await fr.json());
        } catch { }
        setSending(false);
    };

    return (
        <Box minH="100dvh" bgColor="#FFF5F0" display="flex" flexDir="column"
            alignItems="center" px="24px" pt="40px" pb="32px">

            <Box style={{ fontSize: '60px', marginBottom: '12px' }}>🚫</Box>
            <Text fontWeight="800" color="#1C110D" mb="8px"
                style={{ fontSize: 'clamp(18px, 5vw, 22px)' }}>
                Kirish taqiqlangan
            </Text>
            <Text color="#9B8E8A" mb="4px" textAlign="center"
                style={{ fontSize: 'clamp(13px, 3.5vw, 15px)', lineHeight: '1.7', maxWidth: '280px' }}>
                Akkauntingiz administrator tomonidan bloklangan.
            </Text>
            <Text color="#B0A8A4" mb="28px" style={{ fontSize: '12px' }}>
                Admin blokdan chiqarsa sahifa avtomatik ochiladi
            </Text>

            {/* Admin Telegram link */}
            <a href="https://t.me/Abduvahobov__pg" target="_blank" rel="noreferrer"
                style={{ textDecoration: 'none', width: '100%', maxWidth: '360px', marginBottom: '16px' }}>
                <Box bgColor="white" borderRadius="18px" px="20px" py="14px"
                    boxShadow="0 4px 16px rgba(0,0,0,0.08)"
                    border="1.5px solid #E0F2FE"
                    display="flex" alignItems="center" gap="12px">
                    <Box bgColor="#229ED9" borderRadius="12px" w="44px" h="44px" flexShrink={0}
                        display="flex" alignItems="center" justifyContent="center">
                        <FaTelegram style={{ fontSize: '22px', color: 'white' }} />
                    </Box>
                    <Box textAlign="left">
                        <Text color="#9B8E8A" style={{ fontSize: '11px' }}>Admin bilan to'g'ridan-to'g'ri bog'lanish</Text>
                        <Text fontWeight="700" color="#229ED9" style={{ fontSize: '15px' }}>@Abduvahobov__pg</Text>
                    </Box>
                </Box>
            </a>

            {/* Message form */}
            <Box w="100%" maxW="360px" bgColor="white" borderRadius="20px"
                p="20px" boxShadow="0 4px 16px rgba(0,0,0,0.08)" mb="20px">
                <Text fontWeight="700" color="#1C110D" mb="12px" style={{ fontSize: '15px' }}>
                    Adminга xabar yozing
                </Text>
                <Textarea
                    value={msgText}
                    onChange={e => setMsgText(e.target.value)}
                    placeholder="Nimaga blokladingiz? yoki boshqa savol..."
                    rows={4}
                    style={{
                        width: '100%', borderRadius: '12px', border: '1.5px solid #F0E6E0',
                        padding: '10px 14px', fontSize: '14px', color: '#1C110D',
                        resize: 'none', outline: 'none', fontFamily: 'inherit',
                        background: '#FFF5F0',
                    }}
                />
                <Button
                    mt="10px" w="100%"
                    bgColor="#C03F0C" color="white"
                    borderRadius="12px" fontWeight="700" fontSize="14px"
                    isLoading={sending}
                    isDisabled={!msgText.trim()}
                    onClick={sendMsg}
                    _hover={{ bgColor: '#A0340A' }}
                >
                    {sent ? '✓ Yuborildi' : 'Yuborish'}
                </Button>
            </Box>

            {/* My feedbacks with admin replies */}
            {myFeedbacks.length > 0 && (
                <Box w="100%" maxW="360px">
                    <Text fontWeight="700" color="#1C110D" mb="10px" style={{ fontSize: '14px' }}>
                        Mening xabarlarim
                    </Text>
                    <VStack gap="10px" align="stretch">
                        {myFeedbacks.map(fb => (
                            <Box key={fb._id} bgColor="white" borderRadius="16px"
                                p="14px" boxShadow="0 2px 8px rgba(0,0,0,0.06)">
                                <Text color="#1C110D" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                                    {fb.message}
                                </Text>
                                <Text color="#B0A8A4" style={{ fontSize: '11px', marginTop: '4px' }}>
                                    {new Date(fb.createdAt).toLocaleString('uz-UZ')}
                                </Text>
                                {fb.reply ? (
                                    <Box mt="10px" bgColor="#FFF5F0" borderRadius="10px"
                                        p="10px" borderLeft="3px solid #C03F0C">
                                        <Text color="#9B614B" style={{ fontSize: '11px', marginBottom: '3px', fontWeight: '600' }}>
                                            Admin javobi:
                                        </Text>
                                        <Text color="#1C110D" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                                            {fb.reply}
                                        </Text>
                                    </Box>
                                ) : (
                                    <Text color="#B0A8A4" style={{ fontSize: '11px', marginTop: '6px' }}>
                                        ⏳ Javob kutilmoqda...
                                    </Text>
                                )}
                            </Box>
                        ))}
                    </VStack>
                </Box>
            )}
        </Box>
    );
};

export default BlockedPage;
