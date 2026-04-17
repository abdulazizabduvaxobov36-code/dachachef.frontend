import { Box, Button, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FaArrowLeft, FaCamera, FaUser, FaPhone, FaCheck } from "react-icons/fa";
import Store from "../store";

const EditProfilePage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const storedData = (() => {
        const s = JSON.parse(localStorage.getItem("customerData") || "null");
        if (s?.phone) return s;
        const sess = Store.getSession();
        if (sess?.role === "customer" && sess?.data?.phone) return sess.data;
        return {};
    })();
    const oldPhone = storedData.phone;
    const [firstName, setFirstName] = useState(storedData.firstName || "");
    const [lastName, setLastName] = useState(storedData.lastName || "");
    const [phone, setPhone] = useState(storedData.phone || "");
    const [image, setImage] = useState(storedData.image || null);
    const fileRef = useRef();
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const onlyLetters = (val) => /^[A-Za-zА-Яа-яЁёʻʼ\s]*$/.test(val);
    const validate = () => {
        const e = {};
        if (!firstName.trim()) e.firstName = t("customer.firstNameError");
        else if (!onlyLetters(firstName)) e.firstName = t("errors.onlyLetters");
        else if (firstName.trim().length < 2) e.firstName = t("errors.minLength");
        if (!lastName.trim()) e.lastName = t("customer.lastNameError");
        else if (!onlyLetters(lastName)) e.lastName = t("errors.onlyLetters");
        else if (lastName.trim().length < 2) e.lastName = t("errors.minLength");
        if (!phone.trim()) e.phone = t("customer.phoneError");
        else if (phone.replace(/\D/g, "").length !== 9) e.phone = t("errors.phoneLength");
        return e;
    };
    const handleImage = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setImage(reader.result);
        reader.readAsDataURL(file);
    };
    const handleSave = async () => {
        const e = validate();
        setErrors(e);
        setTouched({ firstName: true, lastName: true, phone: true });
        if (Object.keys(e).length === 0) {
            // Eski ma'lumotlarni saqlab, yangilarini ustiga yozamiz
            const old = JSON.parse(localStorage.getItem("customerData") || "null") || {};
            const updated = { ...old, firstName, lastName, phone, image };
            localStorage.setItem("customerData", JSON.stringify(updated));
            Store.setSession("customer", updated);
            Store.saveCustomerInfo(phone, { firstName, lastName, image });

            // Telefon raqami o'zgargan bo'lsa, eski saved accountni tozalash
            if (oldPhone && oldPhone !== phone) {
                localStorage.removeItem(`saved_customer_${oldPhone}`);
                sessionStorage.removeItem('session');
            }

            // Backend ga ham yangilash
            try {
                const AUTH_BASE = import.meta.env?.VITE_API_URL || '';
                await fetch(`${AUTH_BASE}/customers/${phone}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ firstName, lastName, phone, image }),
                });
            } catch { }
            window.dispatchEvent(new Event("customerData-updated"));
            navigate("/profile");
        }
    };
    const hasErr = (key) => errors[key] && touched[key];
    const renderField = (key, label, icon, value, setter, isNum) => (
        <Box mb="14px">
            <Text mb="5px" fontWeight="600"
                style={{ fontSize: "clamp(12px, 3.2vw, 13px)", color: hasErr(key) ? "#E53E3E" : "#9B614B" }}>
                {label}
            </Text>
            <Box display="flex" alignItems="center" bgColor={hasErr(key) ? "#FFF5F5" : "#FFF5F0"}
                borderRadius="14px" px="14px" border="1.5px solid"
                borderColor={hasErr(key) ? "#E53E3E" : "#F0E6E0"} transition="border-color 0.2s"
                style={{ height: "clamp(44px, 12vw, 50px)" }}>
                <Box color={hasErr(key) ? "#E53E3E" : "#C03F0C"} mr="8px" flexShrink={0}>{icon}</Box>
                {key === "phone" && <Text mr="4px" flexShrink={0} style={{ fontSize: "clamp(12px, 3.2vw, 13px)", color: "#9B614B" }}>+998</Text>}
                <input value={value}
                    onChange={(e) => {
                        const v = isNum ? e.target.value.replace(/\D/g, "").slice(0, 9) : e.target.value;
                        setter(v);
                        if (touched[key]) setErrors(prev => ({ ...prev, [key]: "" }));
                    }}
                    onBlur={() => setTouched(prev => ({ ...prev, [key]: true }))}
                    placeholder={label}
                    style={{ width: "100%", border: "none", outline: "none", fontSize: "16px", color: "#1C110D", background: "transparent" }} />
            </Box>
            {hasErr(key) && <Text mt="4px" style={{ fontSize: "clamp(10px, 2.8vw, 12px)", color: "#E53E3E" }}>⚠ {errors[key]}</Text>}
        </Box>
    );
    return (
        <Box minH="100dvh" bgColor="#FFF5F0">
            <Box bgColor="white" px={{ base: "14px", sm: "18px" }} py={{ base: "12px", sm: "14px" }}
                display="flex" alignItems="center" gap="12px" boxShadow="0 1px 0 #F0EBE6">
                <Box bgColor="#FFF0EC" borderRadius="full" display="flex" alignItems="center"
                    justifyContent="center" cursor="pointer" onClick={() => navigate(-1)}
                    style={{ width: "clamp(32px, 9vw, 38px)", height: "clamp(32px, 9vw, 38px)" }}>
                    <FaArrowLeft style={{ fontSize: "clamp(12px, 3vw, 14px)", color: "#1C110D" }} />
                </Box>
                <Text fontWeight="bold" color="#1C110D" style={{ fontSize: "clamp(15px, 4.2vw, 18px)" }}>
                    {t("editProfile.title")}
                </Text>
            </Box>
            <Box pb="100px">
                <Box display="flex" justifyContent="center" mt={{ base: "20px", sm: "28px" }} mb={{ base: "18px", sm: "24px" }}>
                    <Box position="relative">
                        {image ? (
                            <img src={image} alt="profile"
                                style={{ width: "clamp(70px, 20vw, 88px)", height: "clamp(70px, 20vw, 88px)", borderRadius: "50%", objectFit: "cover", border: "3px solid white", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }} />
                        ) : (
                            <Box borderRadius="full" bgColor="#F0E6E0" display="flex" alignItems="center"
                                justifyContent="center" border="3px solid white" boxShadow="0 4px 12px rgba(0,0,0,0.1)"
                                style={{ width: "clamp(70px, 20vw, 88px)", height: "clamp(70px, 20vw, 88px)" }}>
                                <FaUser style={{ fontSize: "clamp(24px, 6.5vw, 32px)", color: "#C03F0C" }} />
                            </Box>
                        )}
                        <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImage} />
                        <Box position="absolute" bottom="0" right="0" bgColor="#C03F0C"
                            borderRadius="full" display="flex" alignItems="center" justifyContent="center"
                            cursor="pointer" boxShadow="0 2px 6px rgba(192,63,12,0.4)"
                            onClick={() => fileRef.current?.click()}
                            style={{ width: "clamp(22px, 6vw, 26px)", height: "clamp(22px, 6vw, 26px)" }}>
                            <FaCamera style={{ fontSize: "clamp(9px, 2.5vw, 11px)", color: "white" }} />
                        </Box>
                    </Box>
                </Box>
                <Box mx={{ base: "14px", sm: "16px" }} bgColor="white" borderRadius="20px"
                    p={{ base: "16px", sm: "20px" }} boxShadow="0 3px 12px rgba(0,0,0,0.07)" mb="12px">
                    {renderField("firstName", t("editProfile.firstName"), <FaUser size={13} />, firstName, setFirstName, false)}
                    {renderField("lastName", t("editProfile.lastName"), <FaUser size={13} />, lastName, setLastName, false)}
                    {renderField("phone", t("editProfile.phone"), <FaPhone size={13} />, phone, setPhone, true)}
                </Box>
                {Object.keys(errors).some(k => errors[k] && touched[k]) && (
                    <Box mx={{ base: "14px", sm: "16px" }} bgColor="#FFF5F5" borderRadius="12px"
                        px="14px" py="10px" border="1px solid #FECDCA">
                        <Text fontWeight="600" style={{ fontSize: "clamp(12px, 3.2vw, 13px)", color: "#E53E3E" }}>
                            ⚠ {t("errors.fillAll")}
                        </Text>
                    </Box>
                )}
            </Box>
            <Box className="fixed-bottom" px={{ base: "14px", sm: "16px" }} py={{ base: "12px", sm: "14px" }}
                bgColor="white" borderTop="1px solid #F0F0F0" zIndex={10}>
                <Button w="100%" bgColor="#C03F0C" color="white" fontWeight="bold"
                    style={{ height: "clamp(46px, 13vw, 54px)", borderRadius: "18px", fontSize: "clamp(14px, 3.8vw, 15px)" }}
                    _hover={{ bgColor: "#a0300a", transform: "scale(1.02)" }} transition="all 0.2s"
                    leftIcon={<FaCheck size={13} />} onClick={handleSave}>
                    {t("editProfile.saveBtn")}
                </Button>
            </Box>
        </Box>
    );
};
export default EditProfilePage;