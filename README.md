# Kunlik Navbat

100 kunlik challenge uchun shaxsiy odatlar trekkeri. PWA: brauzerda ishlaydi, kompyuter va telefonga alohida ilova sifatida o'rnatiladi, internetsiz ham ishlaydi. Ma'lumotlar faqat qurilmada (IndexedDB) saqlanadi — server kerak emas.

**Texnologiyalar:** React + Vite + TypeScript, Tailwind CSS v4, Dexie.js, vite-plugin-pwa.

## 1. Lokal ishga tushirish

Node.js 20+ kerak.

```bash
npm install
npm run dev
```

Brauzerda `http://localhost:5173` ni oching.

Production build va tekshirish (PWA/service worker faqat build'da to'liq ishlaydi):

```bash
npm run build
npm run preview
```

Ikonkalarni qayta yaratish (SVG manbasi `scripts/generate-icons.mjs` ichida):

```bash
npm run icons
```

## 2. GitHub'ga yuklash

```bash
git init
git add .
git commit -m "Kunlik Navbat"
git branch -M main
git remote add origin https://github.com/<foydalanuvchi>/kunlik-navbat.git
git push -u origin main
```

(Avval github.com'da bo'sh `kunlik-navbat` repozitoriysini yarating.)

## 3. Vercel'ga joylash

1. [vercel.com](https://vercel.com) ga GitHub akkauntingiz bilan kiring.
2. **Add New → Project** va `kunlik-navbat` repozitoriysini tanlang.
3. Sozlamalar avtomatik aniqlanadi: Framework **Vite**, Build `npm run build`, Output `dist`.
4. **Deploy** ni bosing. Tayyor manzil: `https://kunlik-navbat.vercel.app` ko'rinishida bo'ladi.

Keyingi `git push` har safar avtomatik yangilaydi, ilova esa o'zi yangi versiyaga o'tadi.

## 4. Windows'ga ilova sifatida o'rnatish

1. Joylangan manzilni **Chrome** yoki **Edge** da oching.
2. Manzil qatorining o'ng tomonidagi **o'rnatish** belgisini bosing (yoki menyu → *Ilovani o'rnatish* / *Install Kunlik Navbat*). Ilova ichidagi **“Ilovani o'rnatish”** tugmasi ham xuddi shuni qiladi.
3. Ilova o'z oynasida, o'z ikonkasi bilan ochiladi; Start menyusi va vazifalar panelidan ishga tushirsa bo'ladi.

Telefonda: Android (Chrome) — menyu → *Ilovani o'rnatish*; iPhone (Safari) — Ulashish → *Bosh ekranga qo'shish*.

## Eslatmalar haqida

Bildirishnomalar serverdan emas, ilovaning o'zidan chiqadi, shuning uchun **ilova/brauzer ishlab turganda** ishlaydi. Windows'da Chrome/Edge sozlamalarida fon ilovalarini yoqing va o'rnatilgan ilovani kirishda ishga tushiring. iPhone'da faqat Bosh ekranga qo'shilgan ilovada (iOS 16.4+). Batafsil — ilovaning *Sozlamalar* sahifasida.

## Zaxira nusxa

*Sozlamalar → Zaxira nusxa* orqali JSON'ga eksport qiling va boshqa qurilmada shu yerdan tiklang. Muhim ma'lumotni vaqti-vaqti bilan eksport qilib turing: brauzer ma'lumotlarini tozalash IndexedDB'ni ham o'chiradi.

## Tuzilma

```
src/
  db/          Dexie sxemasi, standart ro'yxatlar, amallar, taymer, zaxira
  lib/         sana (03:00 almashuvi), statistika, bildirishnoma, mavzu
  hooks/       ma'lumotlar konteksti, taymer kuzatuvchisi, eslatmalar, o'rnatish
  components/  ro'yxat, bo'lim, kun ko'rinishi, vidjetlar, grafik, modal
  pages/       Bugun, Xarita, Statistika, Sozlamalar
```

## Eslatma: tarix qanday saqlanadi

Bandni o'chirish uni *arxivlaydi*: o'tgan kunlardagi belgilar va foizlar o'zgarmaydi. Yangi band faqat qo'shilgan kundan boshlab hisobga olinadi. Bandning nomini o'zgartirsangiz, tarixda ham yangi nom ko'rinadi.
