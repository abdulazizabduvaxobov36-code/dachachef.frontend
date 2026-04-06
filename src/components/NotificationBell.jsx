import { Box, Text, Avatar, Flex } from "@chakra-ui/react";
import { FaBell } from "react-icons/fa";
import { useState } from "react";

const NotificationBell = ({ smsData, onClickChef }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const handleToggle = () => setDropdownOpen(!dropdownOpen);

    const totalSms = smsData.reduce((acc, item) => acc + item.count, 0);
    const displayCount = totalSms > 9 ? "9+" : totalSms;

    return (
        <Box position="relative">
            <Box
                onClick={handleToggle}
                cursor="pointer"
                position="relative"
                p="4px"
            >
                <FaBell size={28} color="#C03F0C" />

                {totalSms > 0 && (
                    <Box
                        position="absolute"
                        top="-4px"
                        right="-4px"
                        bg="#C03F0C"
                        color="white"
                        borderRadius="50%"
                        fontSize="10px"
                        fontWeight="bold"
                        w="18px"
                        h="18px"
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                    >
                        {displayCount}
                    </Box>
                )}
            </Box>

            {dropdownOpen && (
                <Box
                    position="absolute"
                    top="36px"
                    right="0"
                    w="280px"
                    bg="white"
                    borderRadius="12px"
                    boxShadow="0 6px 16px rgba(0,0,0,0.15)"
                    zIndex={50}
                >
                    {smsData.length === 0 ? (
                        <Text p="12px" fontSize="14px" color="#999" textAlign="center">
                            Hech qanday xabar yo'q
                        </Text>
                    ) : (
                        smsData.map((item, idx) => (
                            <Flex
                                key={idx}
                                align="center"
                                gap="10px"
                                p="10px"
                                cursor="pointer"
                                borderBottom="1px solid #F2F2F2"
                                _hover={{ bg: "#FFF1EC" }}
                                onClick={() => onClickChef(item.chefName)}
                            >
                                <Avatar
                                    name={item.chefName}
                                    size="sm"
                                />

                                <Box flex="1">
                                    <Text fontSize="14px" fontWeight="bold">
                                        {item.chefName}
                                    </Text>

                                    <Text
                                        fontSize="12px"
                                        color="gray.500"
                                        noOfLines={1}
                                    >
                                        {item.lastMessage || "Yangi xabar"}
                                    </Text>
                                </Box>

                                {item.count > 0 && (
                                    <Box
                                        bg="#C03F0C"
                                        color="white"
                                        borderRadius="full"
                                        fontSize="11px"
                                        px="6px"
                                        py="2px"
                                    >
                                        {item.count > 9 ? "9+" : item.count}
                                    </Box>
                                )}
                            </Flex>
                        ))
                    )}
                </Box>
            )}
        </Box>
    );
};

export default NotificationBell;