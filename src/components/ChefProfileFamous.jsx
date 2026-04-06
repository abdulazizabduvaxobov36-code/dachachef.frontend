import { Box, Button, Text } from '@chakra-ui/react';
import { FaArrowLeft, FaCommentDots, FaPhone } from 'react-icons/fa';
import HeroHeader from '../Images/Hero Header.png';
import Container10 from '../Images/Container 10.png';
import Image2 from '../Images/Image 2.png';
import Image3 from '../Images/Image 3.png';
import Image4 from '../Images/Image 4.png';
import Image5 from '../Images/Image 5.png';
import Image6 from '../Images/Image 6.png';
import Image7 from '../Images/Image 7.png';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const ChefProfileFamous = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { id } = useParams();
    const chefIndex = Number(id);

    const chefNames = [
        "Javlon Karimov",
        "Sardor Aliyev",
        "Bekzod Tursunov",
    ];

    const chefName = chefNames[chefIndex] || t("common.defaultChef");
    const galleryImages = [Image2, Image3, Image4, Image5, Image6, Image7];

    return (
        <Box minH="100vh" bgColor="#FFF5F0" display="flex" flexDirection="column" alignItems="center" p={{ base: 2, sm: 4 }}>

            <Box display="flex" alignItems="center" justifyContent="space-between" w="100%" maxW="430px" w="100%" mb={6}>
                <Button
                    style={{ width: "clamp(32px, 9vw, 40px)", height: "clamp(32px, 9vw, 40px)" }}
                    bgColor="white"
                    borderRadius="50%"
                    onClick={() => navigate("/glabal")}
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
                            style={{ width: '100%', display: 'block', objectFit: 'cover', height: 'clamp(160px, 45vw, 210px)', objectFit: 'cover' }}
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
                        {t("chefProfile.experience", { year: 12 })}
                    </Text>
                </Box>

                <Box mt="25px" px={{ base: 3, sm: 5 }}>
                    <Text fontSize={{ base: '18px', sm: '20px' }} fontWeight="bold" color="#1C110D">
                        {t("chefProfile.about")}
                    </Text>
                    <Text style={{ fontSize: "clamp(12px, 3.5vw, 14px)" }} color="#525252" mt="10px">
                        {t("chefProfile.aboutText")}
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

                <Box display='flex' flexDirection={{ base: 'column', sm: 'row' }} justifyContent='space-between' alignItems='center' mt='15px' gap='10px' mx={{ base: 3, sm: 0 }}>
                    <Button
                        w={{ base: '100%', sm: '48%' }}
                        bgColor='#F9F6F5'
                        border='2px solid #C03F0C'
                        color='#C03F0C'
                        borderRadius='20px'
                        padding='15px'
                        fontSize='15px'
                        fontWeight='bold'
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        gap="8px"
                    >
                        <FaPhone />
                        {t("chefProfile.call")}
                    </Button>

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
                    >
                        <FaCommentDots />
                        {t("chefProfile.sms")}
                    </Button>
                </Box>

            </Box>
        </Box>
    );
};

export default ChefProfileFamous;