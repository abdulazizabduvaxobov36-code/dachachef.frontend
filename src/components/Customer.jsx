import { Box, Button, Text } from '@chakra-ui/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import { FaPhoneAlt, FaUser, FaArrowLeft } from "react-icons/fa";
import { MdSms } from "react-icons/md";
import { IoChevronForward } from "react-icons/io5";
import Store from '../store';

// ⚠️ Field ni komponent tashqarisida yoki inline JSX sifatida ishlatamiz
// Komponent ichida component bo'lsa React unmount/mount qiladi → fokus yo'qoladi

const Customer = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const onlyLetters = v => /^[A-Za-zА-Яа-яЁёʻʼ\s]*$/.test(v);

  const validate1 = () => {
    const e = {};
    if (!firstName.trim()) e.firstName = t("customer.firstNameError");
    else if (!onlyLetters(firstName)) e.firstName = t("errors.onlyLetters");
    else if (firstName.trim().length < 2) e.firstName = t("errors.minLength");
    if (!lastName.trim()) e.lastName = t("customer.lastNameError");
    else if (!onlyLetters(lastName)) e.lastName = t("errors.onlyLetters");
    else if (lastName.trim().length < 2) e.lastName = t("errors.minLength");
    if (!phone.trim()) e.phone = t("customer.phoneError");
    else if (phone.length !== 9) e.phone = t("errors.phoneLength");
    return e;
  };
  const validate2 = () => {
    const e = {};
    if (!smsCode.trim()) e.smsCode = t("customer.smsError");
    else if (smsCode.length !== 4) e.smsCode = t("errors.smsLength");
    return e;
  };

  const step1 = () => {
    const e = validate1(); setErrors(e);
    setTouched({ firstName: true, lastName: true, phone: true });
    if (!Object.keys(e).length) setStep(2);
  };
  const step2 = async () => {
    const e = validate2(); setErrors(e);
    setTouched(p => ({ ...p, smsCode: true }));
    if (!Object.keys(e).length) {
      const d = { firstName, lastName, phone };
      localStorage.setItem("customerData", JSON.stringify(d));
      Store.setSession("customer", { phone, firstName, lastName });
      Store.startHeartbeat("customer", phone);
      Store.saveCustomerInfo(phone, { firstName, lastName, image: null });
      // Backend ga ham saqlash
      try {
        const AUTH_BASE = import.meta.env?.VITE_API_URL || '';
        await fetch(`${AUTH_BASE}/customers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, firstName, lastName }),
        });
      } catch { }
      navigate("/glabal");
    }
  };

  const hasErr = k => errors[k] && touched[k];

  // Inline renderField — COMPONENT EMAS, oddiy JSX qaytaruvchi funksiya
  const renderField = (key, label, icon, value, setter, isNum, maxLen, prefix) => (
    <Box key={key} mb="16px">
      <Text fontWeight="600" color={hasErr(key) ? "#E53E3E" : "#9B614B"} mb="6px" style={{ fontSize: "12px" }}>{label}</Text>
      <Box display="flex" alignItems="center"
        bgColor={hasErr(key) ? "#FFF5F5" : "white"} borderRadius="14px" px="14px"
        border={`1.5px solid ${hasErr(key) ? "#E53E3E" : "#F0E6E0"}`} style={{ height: "52px" }}>
        <Box color={hasErr(key) ? "#E53E3E" : "#C03F0C"} flexShrink={0} mr="10px">{icon}</Box>
        {prefix && <Text flexShrink={0} mr="4px" color="#9B614B" fontWeight="600" style={{ fontSize: "14px" }}>{prefix}</Text>}
        <input
          value={value}
          placeholder={label}
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
        <Text fontWeight="700" color="#1C110D" style={{ fontSize: "17px" }}>{t("entrance.userBtn")}</Text>
      </Box>

      <Box maxW="400px" mx="auto" px="20px" pt="24px" pb="100px">

        <Box bgColor="white" borderRadius="20px" p="20px" boxShadow="0 2px 12px rgba(192,63,12,0.08)">
          <Text fontWeight="800" color="#1C110D" style={{ fontSize: "20px" }} mb="4px">{t("customer.welcome")}</Text>
          <Text color="#9B614B" style={{ fontSize: "13px" }} mb="20px">{t("customer.enterInfo")}</Text>

          {step === 1 ? (
            <>
              {renderField("firstName", t("customer.firstName"), <FaUser size={14} />, firstName, setFirstName)}
              {renderField("lastName", t("customer.lastName"), <FaUser size={14} />, lastName, setLastName)}
              {renderField("phone", t("customer.phone"), <FaPhoneAlt size={14} />, phone, setPhone, true, 9, "+998")}
            </>
          ) : (
            <>
              <Box bgColor="#FFF5F0" borderRadius="14px" px="16px" py="12px" mb="16px" textAlign="center">
                <Text color="#9B614B" style={{ fontSize: "13px" }}>
                  <b style={{ color: "#C03F0C" }}>+998 {phone}</b> {t("customer.smsSent")}
                </Text>
              </Box>
              {renderField("smsCode", t("customer.sms"), <MdSms size={16} />, smsCode, setSmsCode, true, 4)}
            </>
          )}
        </Box>
      </Box>

      {/* Bottom */}
      <Box className="fixed-bottom" px="20px" py="14px" borderTop="1px solid #F0EBE6">
        {step === 1 ? (
          <Button w="100%" h="52px" bgColor="#C03F0C" color="white" borderRadius="26px"
            fontWeight="700" style={{ fontSize: "16px" }} _hover={{ bgColor: "#a0300a" }} onClick={step1}>
            {t("customer.continue")} <IoChevronForward style={{ marginLeft: "8px" }} />
          </Button>
        ) : (
          <Box display="flex" flexDir="column" gap="10px">
            <Button w="100%" h="52px" bgColor="#C03F0C" color="white" borderRadius="26px"
              fontWeight="700" style={{ fontSize: "16px" }} _hover={{ bgColor: "#a0300a" }} onClick={step2}>
              {t("customer.continue")} <IoChevronForward style={{ marginLeft: "8px" }} />
            </Button>
            <Button w="100%" h="46px" variant="outline" borderColor="#F0E6E0" color="#9B614B"
              borderRadius="26px" fontWeight="600" style={{ fontSize: "14px" }}
              onClick={() => { setStep(1); setErrors({}); setSmsCode(""); }}>
              {t("customer.back")}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};
export default Customer;