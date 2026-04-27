import { Box, Text } from '@chakra-ui/react';
import { FaTelegram } from 'react-icons/fa';

const BlockedPage = () => (
    <Box minH="100dvh" bgColor="#FFF5F0" display="flex" flexDir="column"
        alignItems="center" justifyContent="center" px="24px" textAlign="center">
        <Box style={{ fontSize: '72px', marginBottom: '16px' }}>🚫</Box>
        <Text fontWeight="800" color="#1C110D" mb="10px"
            style={{ fontSize: 'clamp(20px, 5vw, 24px)' }}>
            Kirish taqiqlangan
        </Text>
        <Text color="#9B8E8A" mb="28px"
            style={{ fontSize: 'clamp(13px, 3.5vw, 15px)', lineHeight: '1.7', maxWidth: '280px' }}>
            Akkauntingiz administrator tomonidan bloklangan. Muammo bo'lsa admin bilan bog'laning.
        </Text>
        <a href="https://t.me/dacha_chef_bot" target="_blank" rel="noreferrer"
            style={{ textDecoration: 'none' }}>
            <Box bgColor="white" borderRadius="18px" px="22px" py="16px"
                boxShadow="0 4px 16px rgba(0,0,0,0.1)"
                border="1.5px solid #E0F2FE"
                display="flex" alignItems="center" gap="12px"
                style={{ cursor: 'pointer' }}>
                <Box bgColor="#229ED9" borderRadius="12px" w="44px" h="44px"
                    display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                    <FaTelegram style={{ fontSize: '22px', color: 'white' }} />
                </Box>
                <Box textAlign="left">
                    <Text color="#9B8E8A" style={{ fontSize: '11px' }}>Admin bilan bog'lanish</Text>
                    <Text fontWeight="700" color="#229ED9" style={{ fontSize: '15px' }}>
                        @dacha_chef_bot
                    </Text>
                </Box>
            </Box>
        </a>
    </Box>
);

export default BlockedPage;
