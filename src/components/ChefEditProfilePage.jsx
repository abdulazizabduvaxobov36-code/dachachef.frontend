import { Box, Button, Text } from '@chakra-ui/react';
import { FaArrowLeft, FaCamera, FaCheck, FaUser, FaPhone, FaBriefcase } from 'react-icons/fa';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Store from '../store';
import { useTranslation } from 'react-i18next';

const ChefEditProfilePage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const stored = (() => {
        const s = JSON.parse(localStorage.getItem('chefProfile') || 'null');
        if (s?.phone) return s;
        const sess = Store.getSession();
        if (sess?.role === 'chef' && sess?.data?.phone) return sess.data;
        return {};
    })();
    const [name, setName] = useState(stored.name || '');
    const [surname, setSurname] = useState(stored.surname || '');
    const [phone, setPhone] = useState(stored.phone || '');
    const oldPhone = stored.phone || '';
    const [exp, setExp] = useState(stored.exp || '');
    const [image, setImage] = useState(stored.image || null);
    const initialValues = { name: stored.name || '', surname: stored.surname || '', phone: stored.phone || '', exp: stored.exp || '', image: stored.image || null };
    const [dirty, setDirty] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const fileRef = useRef();
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const onlyLetters = (val) => /^[A-Za-zА-Яа-яЁёʻʼ\s]*$/.test(val);
    const validate = () => {
        const e = {};
        if (!name.trim()) e.name = t("errors.minLength");
        else if (!onlyLetters(name)) e.name = t("errors.onlyLetters");
        else if (name.trim().length < 2) e.name = t("errors.minLength");
        if (!surname.trim()) e.surname = t("errors.minLength");
        else if (!onlyLetters(surname)) e.surname = t("errors.onlyLetters");
        else if (surname.trim().length < 2) e.surname = t("errors.minLength");
        if (!exp || Number(exp) < 1 || Number(exp) > 60) e.exp = t("errors.expRange");
        return e;
    };

    const checkDirty = () => {
        const hasChanged = name !== initialValues.name || surname !== initialValues.surname || phone !== initialValues.phone || exp !== initialValues.exp || image !== initialValues.image;
        setDirty(hasChanged);
    };

    useEffect(() => {
        checkDirty();
    }, [name, surname, phone, exp, image]);

    const handleBack = () => {
        if (dirty) {
            const leave = window.confirm(t('chefEditProfile.unsavedConfirm') || 'O`zgartirishlar saqlanmadi. Chiqishni xohlaysizmi?');
            if (!leave) return;
        }
        navigate(-1);
    };
    const handleSave = async () => {
        if (saving) return;
        // Rasm hali yuklanayotgan bo'lsa, biroz kutamiz
        if (imageLoading) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        const e = validate();
        setErrors(e);
        setTouched({ name: true, surname: true, exp: true });
        if (Object.keys(e).length === 0) {
            setSaving(true);
            try {
                const oldData = JSON.parse(localStorage.getItem('chefProfile') || 'null') || {};
                const merged = { ...oldData, name, surname, phone, exp, image };

                // Avval localStorage ga saqlaymiz - backend xato bo'lsa ham ishlaydi
                localStorage.setItem('chefProfile', JSON.stringify(merged));

                // Telefon raqami o'zgargan bo'lsa, eski sessionni tozalash
                if (oldPhone && oldPhone !== phone) {
                    // Eski telefon raqami bilan saqlangan sessionlarni tozalash
                    localStorage.removeItem(`saved_chef_${oldPhone}`);
                    localStorage.removeItem(`chef_${oldPhone}`);
                    sessionStorage.removeItem('session');
                }

                // Yangi sessionni saqlash
                Store.setSession('chef', merged);

                // Store.updateChef ni chaqiramiz - bu localStorage dagi oshpazlar ro'yxatini yangilaydi
                await Store.updateChef(oldPhone || phone, merged);

                // Event yuboramiz - barcha sahifalar yangilansin
                window.dispatchEvent(new Event('chefs-updated'));

                // Backendga ham yuboramiz (xato bo'lsa ham navigate qilamiz)
                try {
                    const AUTH_BASE = import.meta.env?.VITE_API_URL || '/api';
                    const response = await fetch(`${AUTH_BASE}/chefs/${oldPhone || phone}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(merged),
                    });

                    if (!response.ok) {
                        throw new Error(`Server xatolik: ${response.status}`);
                    }

                    navigate('/chef-profile');
                } catch (error) {
                    console.error('Profil saqlashda xatolik:', error);
                    // Backend xato bo'lsa ham localStorage saqlangan ma'lumot bilan navigatsiya qilamiz
                    navigate('/chef-profile');
                }
            } catch (error) {
                console.error('Profil saqlashda umumiy xatolik:', error);
                navigate('/chef-profile');
            } finally {
                setSaving(false);
            }
        }
    };
    const hasErr = (key) => errors[key] && touched[key];
    const renderInput = (key, label, icon, value, setter, isNum, maxLen, prefix, placeholder) => (
        <Box mb="14px">
            <Text mb="5px" fontWeight="600"
                style={{ fontSize: "clamp(12px, 3.2vw, 13px)", color: hasErr(key) ? "#E53E3E" : "#9B614B" }}>
                {label}
            </Text>
            <Box display="flex" alignItems="center" bgColor={hasErr(key) ? "#FFF5F5" : "#FFF5F0"}
                borderRadius="14px" px="14px" border="1.5px solid"
                borderColor={hasErr(key) ? "#E53E3E" : "#FFF0EC"} transition="border-color 0.2s"
                style={{ height: "clamp(44px, 12vw, 50px)" }}>
                <Box color={hasErr(key) ? "#E53E3E" : "#C03F0C"} mr="8px" flexShrink={0}>{icon}</Box>
                {prefix && <Text mr="4px" flexShrink={0} style={{ fontSize: "clamp(12px, 3.2vw, 13px)", color: "#9B614B" }}>{prefix}</Text>}
                <input value={value}
                    onChange={(e) => {
                        const v = isNum ? e.target.value.replace(/\D/g, "").slice(0, maxLen) : e.target.value;
                        setter(v);
                        if (touched[key]) setErrors(prev => ({ ...prev, [key]: '' }));
                    }}
                    onBlur={() => setTouched(prev => ({ ...prev, [key]: true }))}
                    placeholder={placeholder || label}
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
                    justifyContent="center" cursor="pointer" onClick={handleBack}
                    style={{ width: "clamp(32px, 9vw, 38px)", height: "clamp(32px, 9vw, 38px)" }}>
                    <FaArrowLeft style={{ fontSize: "clamp(12px, 3vw, 14px)", color: "#1C110D" }} />
                </Box>
                <Text fontWeight="bold" color="#1C110D" style={{ fontSize: "clamp(15px, 4.2vw, 18px)" }}>
                    {t("chefEditProfile.title")}
                </Text>
            </Box>
            <Box pb="100px">
                <Box display="flex" justifyContent="center" mt={{ base: "20px", sm: "28px" }} mb={{ base: "18px", sm: "24px" }}>
                    <Box position="relative">
                        {image ? (
                            <img src={image} alt="profile"
                                style={{ width: "clamp(70px, 20vw, 88px)", height: "clamp(70px, 20vw, 88px)", borderRadius: "50%", objectFit: "cover", border: "3px solid white", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }} />
                        ) : (
                            <Box borderRadius="full" bgColor="#FFF0EC" display="flex" alignItems="center"
                                justifyContent="center" border="3px solid white" boxShadow="0 4px 12px rgba(0,0,0,0.1)"
                                style={{ width: "clamp(70px, 20vw, 88px)", height: "clamp(70px, 20vw, 88px)" }}>
                                <FaUser style={{ fontSize: "clamp(24px, 6.5vw, 32px)", color: "#C03F0C" }} />
                            </Box>
                        )}
                        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => {
                            const f = e.target.files[0]; if (!f) return;
                            setImageLoading(true);
                            const r = new FileReader();
                            r.onloadend = () => {
                                const imageUrl = r.result;
                                setImage(imageUrl);
                                setImageLoading(false);
                                if (!image || image !== imageUrl) {
                                    setDirty(true);
                                }
                            };
                            r.onerror = () => {
                                console.error('Rasmni yuklashda xato');
                                setImageLoading(false);
                            };
                            r.readAsDataURL(f);
                        }} />
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
                    p={{ base: "16px", sm: "20px" }} boxShadow="0 3px 12px rgba(0,0,0,0.07)">
                    {renderInput("name", t("chefEditProfile.firstNameLabel"), <FaUser size={13} />, name, setName, false, null, null)}
                    {renderInput("surname", t("chefEditProfile.lastNameLabel"), <FaUser size={13} />, surname, setSurname, false, null, null)}
                    {renderInput("phone", t("chefEditProfile.phoneLabel"), <FaPhone size={13} />, phone, setPhone, true, 9, "+998")}
                    {renderInput("exp", t("chefEditProfile.expLabel"), <FaBriefcase size={13} />, exp, setExp, true, 2, null, t("chefEditProfile.expPlaceholder"))}
                </Box>
                {Object.keys(errors).some(k => errors[k] && touched[k]) && (
                    <Box mx={{ base: "14px", sm: "16px" }} mt="10px" bgColor="#FFF5F5"
                        borderRadius="12px" px="14px" py="10px" border="1px solid #FECDCA">
                        <Text fontWeight="600" style={{ fontSize: "clamp(12px, 3.2vw, 13px)", color: "#E53E3E" }}>
                            ⚠ {t("errors.fillAll")}
                        </Text>
                    </Box>
                )}
            </Box>
            <Box className="fixed-bottom" px={{ base: "14px", sm: "16px" }} py={{ base: "12px", sm: "14px" }}
                bgColor="white" borderTop="1px solid #F0F0F0" zIndex={10}>
                <Button w="100%" bgColor="#C03F0C" color="white" fontWeight="bold"
                    data-save-button
                    style={{ height: "clamp(46px, 13vw, 54px)", borderRadius: "18px", fontSize: "clamp(14px, 3.8vw, 15px)" }}
                    _hover={{ bgColor: "#a0300a", transform: "scale(1.02)" }} transition="all 0.2s"
                    isLoading={saving || imageLoading}
                    loadingText={t('chefEditProfile.saving') || 'Saqlanmoqda'}
                    disabled={saving || imageLoading}
                    leftIcon={<FaCheck size={13} />} onClick={handleSave}>
                    {t("chefEditProfile.saveBtn")}
                </Button>
            </Box>
        </Box>
    );
};
export default ChefEditProfilePage;