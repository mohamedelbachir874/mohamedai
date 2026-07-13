# 🛡️ Mohamed AI — مساعد Kali Linux للأمن السيبراني

مساعد ذكاء اصطناعي مجاني بالكامل، متخصص في الأمن السيبراني ونظام Kali Linux. يدعم تحليل الصور، Lab Mode للشروحات العملية، ومكتبة 84+ أداة.

![Mohamed AI](public/logo.svg)

## ✨ المميزات

- 🤖 **مساعد ذكاء اصطناعي** — مدعوم بـ GLM-4 + GLM-4 Vision
- 🧪 **Lab Mode** — شروحات عملية تفصيلية (Recon → Exploit → Post-Exploit + Defense)
- 📋 **تحليل الصور** — الصق screenshots بـ Ctrl+V أو ارفعها من المعرض
- 📚 **مكتبة 84+ أداة** — Nmap, Metasploit, Burp Suite, SQLmap, Hashcat, Aircrack-ng وغيرها
- 🎨 **تصميم Hacker داكن** — خلفية Matrix متحركة + ألوان أخضر نيون
- 🆓 **مجاني بالكامل** — بدون حدود أو اشتراك
- 📱 **Responsive** — يعمل على الموبايل والديسكتوب
- 🔍 **بحث فوري** في مكتبة الأدوات + فلترة حسب 14 فئة

## 🛠️ التقنيات المستخدمة

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **AI**: z-ai-web-dev-sdk (GLM-4 + GLM-4 Vision)
- **Database**: Prisma ORM + SQLite (local) / PostgreSQL (production)
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Markdown**: React Markdown

## 🚀 التشغيل المحلي

### المتطلبات
- Node.js 18+ أو Bun
- npm / yarn / bun

### الخطوات

```bash
# 1. استنساخ المشروع
git clone https://github.com/USERNAME/mohamed-ai.git
cd mohamed-ai

# 2. تثبيت الحزم
bun install  # أو npm install

# 3. إعداد متغيرات البيئة
cp .env.example .env

# 4. إعداد قاعدة البيانات
bun run db:push

# 5. زرع بيانات أدوات Kali
bun run scripts/seed.ts

# 6. تشغيل خادم التطوير
bun run dev
```

افتح المتصفح على `http://localhost:3000`

## 📦 الرفع على Vercel (مجاني)

### الطريقة 1: عبر GitHub

1. **ارفع الكود على GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Mohamed AI"
   git branch -M main
   git remote add origin https://github.com/USERNAME/mohamed-ai.git
   git push -u origin main
   ```

2. **اذهب لـ [vercel.com](https://vercel.com)** وسجّل بحساب GitHub

3. **اضغط "Add New Project"** → اختر الـ repo `mohamed-ai`

4. **إعدادات Vercel**:
   - Framework Preset: Next.js
   - Build Command: `next build` (افتراضي)
   - Install Command: `bun install` أو `npm install`
   - Environment Variables: أضف `DATABASE_URL`

5. **اضغط "Deploy"** — خلصت! 🎉

راح يطلع لك رابط مثل: `mohamed-ai-xyz.vercel.app`

### تغيير اسم الرابط الفرعي (مجاني)

1. في Vercel → Project → Settings → Domains
2. اضغط "Add" واكتب الاسم اللي تبيه (مثلاً `mohamed-ai`)
3. راح يصير: `mohamed-ai.vercel.app`

### ربط دومين خاص (mohamedai.com)

1. اشترِ الدومين من [Namecheap](https://namecheap.com) أو [Cloudflare](https://cloudflare.com)
2. في Vercel → Settings → Domains → أضف `mohamedai.com`
3. Vercel يعطيك DNS records — انسخها لمزود الدومين:
   - `A record` → `76.76.21.21`
   - `CNAME record` → `cname.vercel-dns.com`
4. انتظر 24-48 ساعة للتفعيل

## 🗃️ قاعدة البيانات على Vercel

SQLite ما يشتغل على Vercel (لأنه serverless). استخدم PostgreSQL:

### الطريقة الأسهل: Vercel Postgres (مجاني)

1. في Vercel → Storage → Create Database → Postgres
2. راح يعطيك `DATABASE_URL` — انسخه
3. في Environment Variables → أضف `DATABASE_URL` بالقيمة الجديدة
4. عدّل `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
5. شغّل `bun run db:push` محلياً بقاعدة البيانات الجديدة
6. شغّل `bun run scripts/seed.ts` لزرع أدوات Kali

## 📁 بنية المشروع

```
mohamed-ai/
├── prisma/
│   └── schema.prisma          # نماذج قاعدة البيانات
├── public/
│   └── logo.svg
├── scripts/
│   └── seed.ts                # زرع بيانات أدوات Kali
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/route.ts      # API المساعد الذكي
│   │   │   ├── tools/route.ts     # API مكتبة الأدوات
│   │   │   ├── upload/route.ts    # API رفع الصور
│   │   │   └── tools/[id]/route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx           # الصفحة الرئيسية
│   ├── lib/
│   │   ├── kali-data.ts       # بيانات 84+ أداة
│   │   ├── db.ts              # Prisma client
│   │   └── utils.ts
│   └── components/ui/         # مكونات shadcn/ui
├── .env.example
├── package.json
└── README.md
```

## 📜 الأوامر المتاحة

```bash
bun run dev          # خادم التطوير
bun run build        # بناء للإنتاج
bun run start        # تشغيل نسخة الإنتاج
bun run lint         # فحص الكود
bun run db:push      # مزامنة قاعدة البيانات
bun run db:generate  # توليد Prisma Client
bun run scripts/seed.ts  # زرع بيانات أدوات Kali
```

## ⚠️ ملاحظة قانونية

هذا المشروع لأغراض **تعليمية** في الأمن السيبراني. استخدم الأدوات فقط على:
- أنظمتك الخاصة
- مختبرات خاصة (Kali + VMs)
- أنظمة بإذن كتابي صريح من المالك

المساعد لا يدعم الهجمات على أنظمة لا تملكها.

## 👨‍💻 المطور

**Mohamed** — مطور ومهتم بالأمن السيبراني

---

⭐ إذا عجبك المشروع، اعمل star على GitHub!
