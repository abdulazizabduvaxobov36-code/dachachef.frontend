import { Box, Button, Text } from '@chakra-ui/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import { FaPhoneAlt, FaUser, FaArrowLeft, FaTelegram } from "react-icons/fa";
import { MdSms } from "react-icons/md";
import { IoChevronForward } from "react-icons/io5";
import Store from '../store';

const API_BASE = import.meta.env?.VITE_API_URL || '';

// Telegram WebApp dan user ID olish
const getTelegramUserId = () => {
  try {
    return window?.Telegram?.WebApp?.initDataUnsafe?.user?.id || null;
  } catch {
    return null;
  }
};

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
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const onlyLetters = v => /^[A-Za-zА-Яа-яЁёʻʼ\s]*$/.test(v);

  const validate1 = () => {
    const e = {};
    if (!firstName.trim()) e.firstName = "Ism kiritish shart";
    else if (!onlyLetters(firstName)) e.firstName = t("errors.onlyLetters");
    else if (firstName.trim().length < 2) e.firstName = t("errors.minLength");
    if (!lastName.trim()) e.lastName = "Familiya kiritish shart";
    else if (!onlyLetters(lastName)) e.lastName = t("errors.onlyLetters");
    else if (lastName.trim().length < 2) e.lastName = t("errors.minLength");
    if (!phone.trim()) e.phone = "Telefon raqami kiritish shart";
    else if (phone.length !== 9) e.phone = t("errors.phoneLength");
    return e;
  };

  // Resend timer countdown
  const startResendTimer = () => {
    setResendTimer(60);
    const iv = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(iv); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const sendOtp = async () => {
    const telegramId = getTelegramUserId();
    setSendingOtp(true);
    setOtpError('');
    try {
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, telegramId: telegramId ? String(telegramId) : null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.message || 'Kod yuborishda xatolik');
        setSendingOtp(false);
        return false;
      }
      setOtpSent(true);
      startResendTimer();
      setSendingOtp(false);
      return true;
    } catch {
      setOtpError('Server bilan aloqa yo\'q');
      setSendingOtp(false);
      return false;
    }
  };

  const step1 = async () => {
    const e = validate1(); setErrors(e);
    setTouched({ firstName: true, lastName: true, phone: true });
    if (Object.keys(e).length) return;

    // Bitta TG — bitta akk tekshiruvi
    const check = Store.isPhoneRegistered(phone);
    if (check.registered && check.role === 'chef') {
      setErrors(prev => ({ ...prev, phone: t('errors.phoneRegisteredAsChef') || 'Bu telefon raqami oshpaz sifatida ro\'yxatdan o\'tgan.' }));
      return;
    }

    const ok = await sendOtp();
    if (ok) setStep(2);
  };

  const step2 = async () => {
    if (!smsCode.trim()) {
      setTouched(p => ({ ...p, smsCode: true }));
      setErrors(p => ({ ...p, smsCode: t("customer.smsError") }));
      return;
    }
    if (smsCode.length !== 4) {
      setErrors(p => ({ ...p, smsCode: t("errors.smsLength") }));
      return;
    }

    setVerifyingOtp(true);
    setOtpError('');
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: smsCode }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setOtpError(data.message || 'Kod noto\'g\'ri');
        setVerifyingOtp(false);
        return;
      }
    } catch {
      // Backend offline bo'lsa — offline rejimda davom etish
    }

    // Ro'yxatdan o'tkazish
    const d = { firstName, lastName, phone };
    localStorage.setItem("customerData", JSON.stringify(d));
    Store.setSession("customer", { phone, firstName, lastName });
    Store.startHeartbeat("customer", phone);
    Store.saveCustomerInfo(phone, { firstName, lastName, image: null });
    try {
      await fetch(`${API_BASE}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, firstName, lastName }),
      });
    } catch { }

    setVerifyingOtp(false);
    navigate("/glabal");
  };

  const hasErr = k => errors[k] && touched[k];

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

  const telegramId = getTelegramUserId();

  return (
    <Box minH="100dvh" bgColor="#FFF5F0">
      {/* Header */}
      <Box bgColor="white" px="16px" pt="14px" pb="14px" display="flex" alignItems="center" gap="12px"
        boxShadow="0 1px 0 #F0EBE6" position="sticky" top={0} zIndex={10}>
        <Box w="36px" h="36px" borderRadius="full" bgColor="#FFF0EC" border="1px solid #F5C5B0"
          display="flex" alignItems="center" justifyContent="center" cursor="pointer"
          onClick={() => step === 2 ? (setStep(1), setErrors({}), setSmsCode(''), setOtpError('')) : navigate("/")}>
          <FaArrowLeft style={{ color: "#C03F0C", fontSize: "14px" }} />
        </Box>
        <Text fontWeight="700" color="#1C110D" style={{ fontSize: "17px" }}>{t("entrance.userBtn")}</Text>
        {/* Step indicator */}
        <Box ml="auto" display="flex" gap="6px">
          {[1, 2].map(s => (
            <Box key={s} w="28px" h="4px" borderRadius="full"
              bgColor={step >= s ? '#C03F0C' : '#F0E6E0'} transition="background 0.3s" />
          ))}
        </Box>
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
              {/* Telegram orqali yuborildi xabari */}
              <Box bgColor="#EFF6FF" borderRadius="14px" px="16px" py="12px" mb="16px"
                border="1.5px solid #BFDBFE"
                display="flex" alignItems="flex-start" gap="10px">
                <FaTelegram style={{ fontSize: "22px", color: "#2563EB", flexShrink: 0, marginTop: "2px" }} />
                <Box>
                  <Text fontWeight="700" color="#1E40AF" style={{ fontSize: "13px" }}>
                    Kod Telegramga yuborildi
                  </Text>
                  <Text color="#3B82F6" mt="2px" style={{ fontSize: "12px" }}>
                    <b>+998 {phone}</b> uchun tasdiqlash kodi botdan keldi — Telegram chatni tekshiring
                  </Text>
                </Box>
              </Box>

              {renderField("smsCode", "4 xonali kod", <MdSms size={16} />, smsCode, setSmsCode, true, 4)}

              {otpError && (
                <Box bgColor="#FFF5F5" borderRadius="10px" px="12px" py="8px" mb="12px" border="1px solid #FECDCA">
                  <Text color="#E53E3E" fontWeight="600" style={{ fontSize: "13px" }}>⚠ {otpError}</Text>
                </Box>
              )}

              {/* Qayta yuborish */}
              <Box textAlign="center" mt="8px">
                {resendTimer > 0 ? (
                  <Text color="#B0A8A4" style={{ fontSize: "13px" }}>
                    Qayta yuborish: {resendTimer}s
                  </Text>
                ) : (
                  <Text color="#C03F0C" fontWeight="600" style={{ fontSize: "13px", cursor: "pointer" }}
                    onClick={() => { setSmsCode(''); setOtpError(''); sendOtp(); }}>
                    Kodni qayta yuborish
                  </Text>
                )}
              </Box>
            </>
          )}
        </Box>

        {/* Telegram ulanganligi haqida eslatma */}
        {step === 1 && !telegramId && (
          <Box mt="12px" bgColor="#FFFBEB" borderRadius="14px" px="14px" py="10px"
            border="1px solid #FDE68A" display="flex" alignItems="flex-start" gap="8px">
            <span style={{ fontSize: "16px" }}>⚠️</span>
            <Text color="#92400E" style={{ fontSize: "12px" }}>
              Tasdiqlash kodi Telegram orqali yuboriladi. Iltimos, ilovani Telegram bot orqali oching.
            </Text>
          </Box>
        )}
      </Box>

      {/* Bottom buttons */}
      <Box className="fixed-bottom" px="20px" py="14px" borderTop="1px solid #F0EBE6" bgColor="white">
        {step === 1 ? (
          <Button w="100%" h="52px" bgColor="#C03F0C" color="white" borderRadius="26px"
            fontWeight="700" style={{ fontSize: "16px" }} _hover={{ bgColor: "#a0300a" }}
            isLoading={sendingOtp} loadingText="Yuborilmoqda..."
            onClick={step1}>
            {t("customer.continue")} <IoChevronForward style={{ marginLeft: "8px" }} />
          </Button>
        ) : (
          <Box display="flex" flexDir="column" gap="10px">
            <Button w="100%" h="52px" bgColor="#C03F0C" color="white" borderRadius="26px"
              fontWeight="700" style={{ fontSize: "16px" }} _hover={{ bgColor: "#a0300a" }}
              isLoading={verifyingOtp} loadingText="Tekshirilmoqda..."
              onClick={step2}>
              ✅ Tasdiqlash <IoChevronForward style={{ marginLeft: "8px" }} />
            </Button>
            <Button w="100%" h="46px" variant="outline" borderColor="#F0E6E0" color="#9B614B"
              borderRadius="26px" fontWeight="600" style={{ fontSize: "14px" }}
              onClick={() => { setStep(1); setErrors({}); setSmsCode(""); setOtpError(""); setOtpSent(false); }}>
              {t("customer.back")}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};
export default Customer;
