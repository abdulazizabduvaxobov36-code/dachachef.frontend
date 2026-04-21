# 🤖 Telegram Bot Sozlash

## 1. Bot yaratish (@BotFather orqali)

1. Telegramda **@BotFather** ga yozing
2. `/newbot` yuboring
3. Bot nomini kiriting (masalan: `DachaChef`)
4. Bot username kiriting (masalan: `DachaChefBot`)
5. BotFather sizga **TOKEN** beradi — uni saqlang!

---

## 2. `.env` fayl yaratish

Loyiha papkasida `.env` fayl yarating va quyidagini yozing:

```
VITE_API_URL=http://localhost:5000
VITE_BOT_USERNAME=DachaChefBot
TELEGRAM_BOT_TOKEN=sizning_tokeningiz_shu_yerga
```

---

## 3. Ishga tushirish

```bash
# Kutubxonalarni o'rnatish
npm install

# Backend (1-terminal)
node server.js

# Frontend (2-terminal)
npm run dev
```

---

## 4. Qanday ishlaydi?

1. Foydalanuvchi **Telegramda botga** `/start` bosadi → "Xush kelibsiz!" xabari keladi
2. Foydalanuvchi **ilovani ochadi** va ro'yxatdan o'tadi
3. Telefon raqamini kiritib "Davom etish" bosadi
4. **4 xonali kod** Telegram botga keladi
5. Kodni ilovaga kiritadi → ro'yxatdan o'tish tugaydi ✅

---

## ⚠️ Muhim

- Foydalanuvchi `/start` bosmaganda kod yubora olmaydi!
- Shuning uchun ilovada "Botni ochish" tugmasi bor — u foydalanuvchini botga olib boradi