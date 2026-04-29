import { Box, Button, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import { useTranslation } from "react-i18next";
import { IoChevronForward } from "react-icons/io5";
import { FaCamera, FaUser, FaArrowLeft } from "react-icons/fa";
import Store from '../store';

const Chef = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileRef = useRef();
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [phone, setPhone] = useState("");
  const [exp, setExp] = useState("");
  const [bio, setBio] = useState("");
  const [image, setImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const onlyLetters = v => /^[A-Za-zА-Яа-яЁёʻʼ\s]*$/.test(v);

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Ism kiritish shart";
    else if (!onlyLetters(name)) e.name = "Ism faqat harflardan iborat bo'lishi kerak";
    else if (name.trim().length < 2) e.name = "Ism kamida 2 ta harfdan iborat bo'lishi kerak";
    if (!surname.trim()) e.surname = "Familiya kiritish shart";
    else if (!onlyLetters(surname)) e.surname = "Familiya faqat harflardan iborat bo'lishi kerak";
    else if (surname.trim().length < 2) e.surname = "Familiya kamida 2 ta harfdan iborat bo'lishi kerak";
    if (!phone.trim()) e.phone = "Telefon raqami kiritish shart";
    else if (phone.length !== 9) e.phone = "Telefon raqami 9 ta raqamdan iborat bo'lishi kerak";
    else if (!/^\d{9}$/.test(phone)) e.phone = "Telefon raqami faqat raqamlardan iborat bo'lishi kerak";
    if (!exp.trim()) e.exp = "Tajriba kiritish shart";
    else if (Number(exp) < 1 || Number(exp) > 60) e.exp = "Tajriba 1 dan 60 yilgacha bo'lishi mumkin";
    return e;
  };

  const submit = async () => {
    const e = validate();
    setErrors(e);
    setTouched({ name: true, surname: true, phone: true, exp: true });
    if (!Object.keys(e).length) {
      // Bitta TG — bitta akk tekshiruvi
      const check = Store.isPhoneRegistered(phone);
      if (check.registered && check.role === 'customer') {
        setErrors(prev => ({ ...prev, phone: t('errors.phoneRegisteredAsCustomer') || 'Bu telefon raqami mijoz sifatida ro\'yxatdan o\'tgan. Bitta telefondan faqat bitta akk ochish mumkin.' }));
        setTouched(prev => ({ ...prev, phone: true }));
        return;
      }
      const d = { name, surname, phone, exp, image, bio, id: Date.now() };
      localStorage.setItem("chefProfile", JSON.stringify(d));
      Object.keys(localStorage)
        .filter(k => k.startsWith('saved_chef_') && !k.endsWith(`_${phone}`))
        .forEach(k => localStorage.removeItem(k));
      Store.setSession("chef", d);
      Store.startHeartbeat("chef", phone);
      await Store.addChef(d);
      // Backend ga ham saqlash — kutmasdan, fon rejimida
      const AUTH_BASE = import.meta.env?.VITE_API_URL || '';
      fetch(`${AUTH_BASE}/chefs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, surname, phone, exp, image, bio }),
      }).catch(() => {});
      navigate("/chef-home");
    }
  };

  const hasErr = k => errors[k] && touched[k];

  // renderField — icon parametri null bo'lsa ko'rsatilmaydi
  const renderField = (key, label, icon, value, setter, isNum, maxLen, prefix, placeholder) => (
    <Box key={key} mb="14px">
      <Text fontWeight="600" color={hasErr(key) ? "#E53E3E" : "#9B614B"} mb="6px" style={{ fontSize: "12px" }}>{label}</Text>
      <Box display="flex" alignItems="center"
        bgColor={hasErr(key) ? "#FFF5F5" : "white"} borderRadius="14px" px="14px"
        border={`1.5px solid ${hasErr(key) ? "#E53E3E" : "#F0E6E0"}`} style={{ height: "52px" }}>
        {icon && <Box color={hasErr(key) ? "#E53E3E" : "#C03F0C"} flexShrink={0} mr="10px">{icon}</Box>}
        {prefix && <Text flexShrink={0} mr="4px" color="#9B614B" fontWeight="600" style={{ fontSize: "14px" }}>{prefix}</Text>}
        <input
          value={value}
          placeholder={placeholder || label}
          onChange={e => {
            const v = isNum ? e.target.value.replace(/\D/g, "").slice(0, maxLen) : e.target.value;
            setter(v);
            if (touched[key]) setErrors(p => ({ ...p, [key]: "" }));
          }}
          onBlur={() => setTouched(p => ({ ...p, [key]: true }))}
          style={{ width: "100%", border: "none", outline: "none", fontSize: "15px", color: "#1C110D", background: "transparent" }}
        />
      </Box>
      {hasErr(key) && <Text color="#E53E3E" mt="4px" style={{ fontSize: "12px" }}>⚠ {errors[key]}</Text>}
    </Box>
  );

  return (
    <Box minH="100dvh" bgColor="#FFF5F0">
      {/* Header */}
      <Box bgColor="white" px="16px" pt="14px" pb="14px" display="flex" alignItems="center" gap="12px"
        boxShadow="0 1px 0 #F0EBE6" position="sticky" top={0} zIndex={10}>
        <Box w="36px" h="36px" borderRadius="full" bgColor="#FFF0EC" border="1px solid #F5C5B0"
          display="flex" alignItems="center" justifyContent="center" cursor="pointer" onClick={() => navigate("/")}>
          <FaArrowLeft style={{ color: "#C03F0C", fontSize: "14px" }} />
        </Box>
        <Text fontWeight="700" color="#1C110D" style={{ fontSize: "17px" }}>{t("chef.pageTitle")}</Text>
      </Box>

      {/* Content */}
      <Box maxW="400px" mx="auto" px="20px" pt="24px" pb="100px">
        {/* Avatar */}
        <Box display="flex" flexDir="column" alignItems="center" mb="24px">
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => {
            const f = e.target.files[0];
            if (f) { const r = new FileReader(); r.onloadend = () => setImage(r.result); r.readAsDataURL(f); }
          }} />
          <Box cursor="pointer" onClick={() => fileRef.current?.click()}>
            <Box position="relative">
              {image
                ? <img src={image} alt="" style={{ width: "90px", height: "90px", borderRadius: "50%", objectFit: "cover", border: "3px solid #C03F0C" }} />
                : <Box w="90px" h="90px" borderRadius="full" bgColor="#FFF0EC" border="3px solid #F5C5B0"
                  display="flex" alignItems="center" justifyContent="center">
                  <FaUser style={{ fontSize: "36px", color: "#C03F0C" }} />
                </Box>
              }
              <Box position="absolute" bottom="0" right="0" w="28px" h="28px" borderRadius="full"
                bgColor="#C03F0C" display="flex" alignItems="center" justifyContent="center"
                boxShadow="0 2px 8px rgba(192,63,12,0.4)">
                <FaCamera style={{ fontSize: "12px", color: "white" }} />
              </Box>
            </Box>
          </Box>
          <Text fontWeight="600" color="#9B614B" mt="10px" style={{ fontSize: "13px" }}>{t("chef.profilePhoto")}</Text>
        </Box>

        {/* Shaxsiy ma'lumotlar */}
        <Box bgColor="white" borderRadius="20px" p="20px" boxShadow="0 2px 12px rgba(192,63,12,0.08)" mb="12px">
          <Text fontWeight="700" color="#C03F0C" mb="16px" style={{ fontSize: "11px", letterSpacing: "0.8px" }}>
            {t("chef.personalInfo").toUpperCase()}
          </Text>
          {renderField("name", t("chef.firstName"), null, name, setName)}
          {renderField("surname", t("chef.lastName"), null, surname, setSurname)}
          {renderField("phone", t("chef.phoneNumber"), null, phone, setPhone, true, 9, "+998")}
        </Box>

        {/* Tajriba */}
        <Box bgColor="white" borderRadius="20px" p="20px" boxShadow="0 2px 12px rgba(192,63,12,0.08)" mb="12px">
          <Text fontWeight="700" color="#C03F0C" mb="16px" style={{ fontSize: "11px", letterSpacing: "0.8px" }}>
            {t("chef.workExp").toUpperCase()}
          </Text>
          {renderField("exp", t("chef.workExp"), null, exp, setExp, true, 2, null, "5")}
        </Box>

        {/* Bio */}
        <Box bgColor="white" borderRadius="20px" p="20px" boxShadow="0 2px 12px rgba(192,63,12,0.08)">
          <Text fontWeight="700" color="#C03F0C" mb="12px" style={{ fontSize: "11px", letterSpacing: "0.8px" }}>
            {t("chef.bioLabel") || "O'ZI HAQIDA (IXTIYORIY)"}
          </Text>
          <Box bgColor="#FFF5F0" borderRadius="14px" p="12px" border="1.5px solid #F0E6E0">
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder={t("chef.bioPlaceholder") || "Mutaxassislik, taomlar, tajriba haqida yozing..."}
              rows={4}
              style={{
                width: "100%", border: "none", outline: "none",
                fontSize: "15px", color: "#1C110D", background: "transparent",
                resize: "none", fontFamily: "inherit"
              }}
            />
          </Box>
          <Text mt="8px" color="#9B8E8A" style={{ fontSize: "12px" }}>
            {t("chef.bioHint") || "Bu mijozlar siz haqingizda qisqacha ma'lumotni ko'radi."}
          </Text>
        </Box>
      </Box>

      {/* Bottom button */}
      <Box className="fixed-bottom" px="20px" py="14px" borderTop="1px solid #F0EBE6">
        <Button w="100%" h="52px" bgColor="#C03F0C" color="white" borderRadius="26px"
          fontWeight="700" style={{ fontSize: "16px" }} _hover={{ bgColor: "#a0300a" }} onClick={submit}>
          {t("chef.createProfile")} <IoChevronForward style={{ marginLeft: "8px" }} />
        </Button>
      </Box>
    </Box>
  );
};
export default Chef;