import { Box, Text } from '@chakra-ui/react';

const BlockedPage = () => (
    <Box minH="100dvh" bgColor="#FFF5F0" display="flex" flexDir="column"
        alignItems="center" justifyContent="center" px="24px" textAlign="center">
        <Box fontSize="64px" mb="16px">🚫</Box>
        <Text fontWeight="800" color="#1C110D" mb="8px"
            style={{ fontSize: 'clamp(20px, 5vw, 24px)' }}>
            Kirish taqiqlangan
        </Text>
        <Text color="#9B8E8A" mb="24px"
            style={{ fontSize: 'clamp(13px, 3.5vw, 15px)', lineHeight: '1.6' }}>
            Sizning akkauntingiz administrator tomonidan bloklangan.
            Muammo bo'lsa admin bilan bog'laning.
        </Text>
        <Box bgColor="white" borderRadius="16px" px="20px" py="14px"
            boxShadow="0 2px 12px rgba(0,0,0,0.08)" display="inline-flex"
            alignItems="center" gap="10px">
            <Text fontSize="20px">📞</Text>
            <Box textAlign="left">
                <Text color="#9B8E8A" style={{ fontSize: '11px' }}>Admin</Text>
                <Text fontWeight="700" color="#1C110D" style={{ fontSize: '14px' }}>
                    @dacha_chef_bot
                </Text>
            </Box>
        </Box>
    </Box>
);

export default BlockedPage;
