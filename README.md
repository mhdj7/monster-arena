# 🐉 مانستر آرنا (Monster Arena)

بازی وب جمع‌آوری و مبارزه‌ی کارت‌های هیولا — نسخه‌ی لوکال.

A web game about collecting, training, fusing and battling monster cards, with an
8-tier league system and bot opponents. Built with Next.js (App Router) +
TypeScript + Tailwind CSS + Prisma/SQLite.

## امکانات (Features)

- **۱۲ هیولای پایه** + ده‌ها گونه‌ی تکامل‌یافته، با ۶ اتریبیوت (۳ مهاجم / ۳ مدافع).
- **مبارزه‌ی رسمی ۳v۳** (روزانه، روی رتبه‌ی لیگ اثر دارد) و **رینگ زیرزمینی ۱v۱**
  (مصرف انرژی + خستگی). موتور مبارزه اتوماتیک و کلش‌به‌کلش است (اول به ۳ امتیاز).
- **انرژی** (= سطح + ۲)، **تمرین موقت/دائمی**، و **سطح‌بندی** با XP از مبارزه و تمرین.
- **فیوژن**: هر هیولا ۸ مسیر ارتقا دارد (۱ تا ۷ مشخص، گزینه‌ی ۸ تبدیل کاملاً رندوم).
- **۱۵ منبع**، **اقتصاد و فروشگاه** (خرید منابع و کارت هیولا).
- **لیدربورد و لیگ ۸ سطحی**، آپدیت ماهانه (۳۰٪ صعود / ۴۰٪ ماندن / ۳۰٪ نزول) و
  **جعبه‌ی پاداش هفتگی**.
- حریف‌ها به‌صورت بات در دیتابیس شبیه‌سازی شده‌اند.

## اجرا (Getting started)

```bash
npm install
cp .env.example .env          # DATABASE_URL="file:./dev.db"
npx prisma migrate dev        # ساخت دیتابیس و اعمال migrationها
npm run db:seed               # پر کردن دیتابیس (هیولاها، منابع، بات‌ها، فروشگاه)
npm run dev                   # http://localhost:3000
```

> زمان «روز» در بازی شبیه‌سازی‌شده است: با دکمه‌ی **«پایان روز / روز بعد»** در خانه،
> انرژی هیولاها پر، خستگی صفر، بافرهای موقت پاک، و رویدادهای هفتگی/ماهانه اعمال می‌شوند.

## اسکریپت‌ها (Scripts)

| دستور | کار |
|------|------|
| `npm run dev` | اجرای محیط توسعه |
| `npm run build` / `npm start` | بیلد و اجرای production |
| `npm run lint` | اجرای ESLint |
| `npm run db:seed` | پر کردن دیتابیس |
| `npm run db:reset` | ریست کامل دیتابیس + seed |

## ساختار (Structure)

- `prisma/schema.prisma` — مدل داده (هیولاها، کارت‌ها، منابع، فیوژن، بازیکن‌ها، مبارزات).
- `prisma/seed.ts` — دیتای اولیه.
- `src/lib/game/` — منطق بازی: `constants.ts`, `stats.ts`, `battle.ts`, `queries.ts`.
- `src/app/actions.ts` — Server Actions (مبارزه، تمرین، فیوژن، خرید، پایان روز).
- `src/app/*` — صفحات: خانه، کلکسیون، مبارزه، تمرین، فیوژن، فروشگاه، لیدربورد.
- `src/components/` — کامپوننت‌های UI.
