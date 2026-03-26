# 🎟️ EventHub Ticketing Platform

EventHub adalah platform modern untuk mengatur, menjual, dan membeli tiket acara (event). Proyek ini dibagi menjadi beberapa ruang lingkup pekerjaan untuk mempermudah tim bekerja secara paralel.

## 👥 Alur Kolaborasi & Tabel Pekerjaan (Jobdesk)

Untuk menghindari bentrok kode (*merge conflicts*) saat bekerja dalam satu tim, berikut adalah pembagian wilayah kerja (folder) dan tanggung jawab utama masing-masing anggota tim:

---

### 1. 🎨 Frontend - Userpage (Sisi Pembeli)
**Fokus:** Merancang antarmuka publik seperti Landing Page, Halaman Pencarian Katalog Event, Detail Event, hingga Flow Pembayaran dan Keranjang.
- **Titik Mulai (Entry Point):** `src/App.tsx` (Bagian *Public Routes* / Rute Publik di luar Layout Dashboard).
- **Wilayah Folder Kerja Utama:**
  - `src/pages/` (Contoh: `Landing.tsx`, `EventDetail.tsx`, `Checkout.tsx`).
  - `src/components/user/` 👉 *(Folder khusus komponen UI sisi user, misal: Navbar publik, Footer, TicketCard)*.
- **Langkah Pertama:** Mulai rancang UI untuk `Landing.tsx`.

### 2. 📊 Frontend - Dashboard (Sisi Penyelenggara/Admin)
**Fokus:** Membangun antarmuka bagi Admin atau Penyelenggara agar bisa membuat event, melihat statistik pesanan, mengelola tiket, dan mengecek laporan.
- **Titik Mulai (Entry Point):** `src/components/layout/DashboardLayout.tsx` dan `src/pages/Dashboard.tsx`.
- **Wilayah Folder Kerja Utama:**
  - `src/components/layout/` (Mengelola Sidebar, Header, dan sistem layouting Dashboard).
  - `src/components/dashboard/` (Mengambil bagian khusus komponen visual analitik, chart, maupun tabel rekap data).
  - `src/pages/` (Halaman khusus dashboard seperti `Tickets.tsx` atau `Orders.tsx`).

### 3. & 4. ⚙️ Backend & Database (Supabase BaaS)
**Fokus:** Mengelola penyimpanan data relasional, autentikasi pengguna (Login/Session), dan aturan keamanan data (*Row Level Security*). Karena kita menggunakan **Supabase**, tim tidak perlu menyusun server logika Node.js dari awal; database dan API sudah terintegrasi secara instan.
- **Wilayah Kerja & Tanggung Jawab Utama:**
  - **Portal Dasbor Supabase:** Tim ini merancang tabel PostgreSQL langsung melalui antarmuka/SQL Editor Supabase, mengatur sistem *Auth*, dan membuat *Policies* privasi data.
  - **Setup Client Supabase:** Tim ini bertugas menginisialisasi *Supabase-js* di proyek frontend (biasanya membuat file koneksi di `src/lib/supabase.ts` atau `src/services/`).
  - **Dokumentasi Skema (Schema Design):** Mendesain tabel fundamental seperti `users`, `events`, `ticket_tiers`, dan `transactions` lalu membagikan referensi tipe datanya (TypeScript *Interfaces*) ke tim Frontend.
- **Tech Stack Utama:** Supabase (PostgreSQL Native terinklusi dengan Auto-generated REST API & Supabase Auth).

---

## 📂 Struktur Direktori (File Structure)

Berikut adalah panduan anatomi folder utama (`src/`) agar kolaborasi tetap rapi dan setiap anggota tim tahu harus menaruh atau mencari file di mana:

```text
src/
├── components/          # Semua unit komponen UI (Visual & Fungsional)
│   ├── dashboard/       # Potongan UI khusus halaman Admin/Organiser (Charts, Stat Cards, dsb)
│   ├── layout/          # Bingkai/kerangka tata letak halaman (DashboardLayout, AppSidebar, Header)
│   ├── ui/              # Komponen standar "bisu" alias reusable base dari Shadcn UI (Button, Input, dll)
│   └── user/            # Komponen khusus untuk sisi pengunjung/pembeli tiket (Navbar Publik, EventCard)
│
├── pages/               # Halaman utuh (PAGES) yang dipanggil oleh React Router dalam App.tsx
│   ├── Dashboard.tsx    # Halaman untuk rute `/dashboard`
│   ├── Landing.tsx      # Halaman untuk rute `/` (publik)
│   └── ...              # Tambahkan file halaman lainnya di sini (EventDetail.tsx, Checkout.tsx, Orders.tsx)
│
├── App.tsx              # File routing utama tempat menyusun jalur lalu-lintas URL (React Router)
├── index.css            # Pengaturan global style, Tailwind directives, dan Setup Variabel Tema Warna
└── main.tsx             # Titik injektor utama React (Me-render App.tsx ke DOM index.html)
```

---

## 🚀 Panduan Setup & Menjalankan Proyek Lokal

Bagi anggota tim **Frontend**, ikuti langkah-langkah di bawah ini untuk memulai pekerjaan di *local machine* masing-masing:

**1. Pull/Clone Repository**
```bash
# Lakukan git clone jika pertama kali
git clone <url-repository>
cd EventHub
```

**2. Install Dependencies Pustaka**
Pastikan Node.js sudah terinstal. Jalankan perintah ini di terminal:
```bash
npm install
```

**3. Jalankan Server Development**
```bash
npm run dev
```

**4. Akses Aplikasi di Browser**
*Buka URL lokal yang muncul (biasanya `http://localhost:5173`).*
- Untuk Tim **Userpage**: Akses titik masuk root di `/`
- Untuk Tim **Dashboard**: Tinjau hasil kerja Anda melalu rute `/dashboard`

---

## 🛠 Aturan Kontribusi (Khusus Tim Frontend)
1. **Penggunaan Shadcn UI:** Jangan membuat struktur desain komponen bawaan sistem (seperti Button, Input, Select) secara mentah dari *scratch* (`<button class="...">`). Manfaatkan standar library komponen yang ada (di folder `src/components/ui/`).
2. **Setup Rute Baru:** Jika Anda membuat fitur halaman utuh yang baru, wajib mendaftarkan *path* rutenya ke dalam blok `<Routes>` yang ada di file utama `src/App.tsx`.
3. **Penyelarasan Desain (*Light Mode*):** Projek ini mematuhi standar **Light Mode** ekslusif secara bawaan dan secara spesifik menggunakan warna utama (purple/blue aesthetics). Variabel palet dasarnya ada di file `src/index.css`. Jangan pernah mengubah skema dasar CSS tanpa diskusi tim.
