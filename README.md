# EventHub Ticketing Platform

EventHub adalah platform ticketing berbasis web untuk menemukan event, melakukan pemesanan tiket, memilih kursi, memproses pembayaran simulasi, dan memvalidasi kehadiran peserta. Platform ini juga menyediakan dashboard operasional bagi organizer dan administrator untuk mengelola event, tiket, pesanan, venue, pengguna, serta proses check-in.

Proyek ini dikembangkan oleh **Kelompok 12** untuk memenuhi tugas mata kuliah **Basis Data** yang diampu oleh **Arta Kusuma Hernanda, S.T., M.T.**

Referensi studi kasus: [Ticketing B - Kelompok 12](https://github.com/partadox/praktikum-mysql-case/blob/main/kelompok12_ticketing_b.md)

## Daftar Isi

- [Tim Pengembang](#tim-pengembang)
- [Fitur Utama](#fitur-utama)
- [Hak Akses Pengguna](#hak-akses-pengguna)
- [Tech Stack](#tech-stack)
- [Struktur Proyek](#struktur-proyek)
- [Cara Menjalankan](#cara-menjalankan)
- [Konfigurasi Supabase](#konfigurasi-supabase)
- [Script yang Tersedia](#script-yang-tersedia)
- [Struktur Database](#struktur-database)
- [Deployment](#deployment)
- [Status Pengembangan](#status-pengembangan)
- [Kontribusi](#kontribusi)

## Tim Pengembang

**Kelompok 12**

| NRP | Nama |
| --- | --- |
| 5024241085 | Anak Agung Ngurah Agung Kresna Ananta |
| 5024241029 | Jordi |
| 5024241013 | Muhammad Sayyid Tsabit |
| 5024241011 | Rahmat Maulana Ansori |

## Fitur Utama

### Pembeli

- Registrasi dan login menggunakan email/password.
- Login menggunakan Google OAuth.
- Melihat dan mencari event yang telah dipublikasikan.
- Memfilter event berdasarkan kategori dan lokasi.
- Melihat detail event, venue, harga, dan ketersediaan tiket.
- Memilih ticket tier dan kursi yang masih tersedia.
- Membuat booking hingga maksimal 10 tiket dalam satu transaksi.
- Menyelesaikan pembayaran melalui alur pembayaran simulasi.
- Melihat daftar tiket, status pembayaran, detail kursi, dan kode tiket.
- Memperbarui profil dan foto profil.

### Organizer

- Melihat statistik penjualan, pendapatan, dan transaksi.
- Membuat event sebagai draft atau langsung memublikasikannya.
- Mengedit informasi, jadwal, venue, kategori, dan banner event.
- Mengelola ticket tier, harga, kapasitas, dan jumlah tiket terjual.
- Melihat pesanan dan daftar peserta berdasarkan event.
- Melakukan check-in secara manual atau menggunakan pemindai QR browser.
- Memilih konteks event untuk memfilter data dashboard.

### Administrator

- Melihat ringkasan operasional seluruh platform.
- Mengakses seluruh event dan pesanan.
- Mengelola venue beserta kapasitasnya.
- Mengubah role pengguna menjadi `buyer`, `organizer`, atau `admin`.
- Memantau jumlah pengguna, organizer, event, tiket terjual, dan pendapatan.

## Hak Akses Pengguna

| Role | Akses |
| --- | --- |
| `buyer` | Katalog event, booking, pembayaran simulasi, tiket, dan profil |
| `organizer` | Seluruh akses buyer serta dashboard event miliknya |
| `admin` | Dashboard tingkat platform, seluruh event, venue, dan manajemen role |

Dashboard hanya dapat diakses oleh `organizer` dan `admin`. Halaman pengelolaan venue dan role hanya dapat diakses oleh `admin`. Pembatasan akses diterapkan pada routing frontend dan Row Level Security Supabase.

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite 8
- React Router 7
- Tailwind CSS 4
- shadcn/ui dan Radix UI
- Recharts
- Lucide React

### Backend dan Infrastruktur

- Supabase PostgreSQL
- Supabase Authentication
- Supabase Storage
- PostgreSQL Functions/RPC
- Row Level Security
- Vercel

## Struktur Proyek

```text
EventHub/
|-- public/                         # Aset statis publik
|-- src/
|   |-- assets/                     # Gambar dan aset frontend
|   |-- components/
|   |   |-- dashboard/              # Statistik, grafik, dan transaksi terbaru
|   |   |-- layout/                 # Navbar, sidebar, route guard, dan layout
|   |   `-- ui/                     # Komponen UI reusable
|   |-- context/
|   |   |-- AuthContext.tsx         # Session, user, dan profile aktif
|   |   `-- EventContext.tsx        # Event aktif pada dashboard
|   |-- hooks/                      # Custom React hooks
|   |-- lib/
|   |   |-- database.types.ts       # Tipe database Supabase
|   |   |-- supabase-client.ts      # Supabase client
|   |   `-- ...                     # Helper profile, banner, error, dan scope
|   |-- pages/                      # Halaman publik dan dashboard
|   |-- App.tsx                     # Konfigurasi routing aplikasi
|   |-- index.css                   # Tema dan global styles
|   `-- main.tsx                    # Entry point React
|-- supabase/
|   |-- docs/                       # Snapshot skema database
|   |-- migrations/                 # Migrasi, function, trigger, dan RLS
|   `-- config.toml                 # Konfigurasi Supabase CLI
|-- .env.example                    # Template environment variables
|-- components.json                # Konfigurasi shadcn/ui
|-- vercel.json                     # SPA rewrite untuk Vercel
`-- vite.config.ts                  # Konfigurasi Vite dan alias
```

## Cara Menjalankan

### Prasyarat

Pastikan perangkat telah memiliki:

- [Node.js](https://nodejs.org/) versi LTS.
- npm.
- Project Supabase yang telah memiliki skema EventHub.
- Git untuk melakukan clone repository.

### 1. Clone repository

```bash
git clone https://github.com/Kresnananta/EventHub-Basdat.git
cd EventHub-Basdat
```

### 2. Install dependencies

```bash
npm install
```

### 3. Siapkan environment variables

Salin `.env.example` menjadi `.env`, kemudian isi kredensial Supabase:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Nilai tersebut dapat ditemukan melalui **Supabase Dashboard > Project Settings > API**. Jangan memasukkan `service_role` key ke aplikasi frontend atau melakukan commit terhadap file `.env`.

### 4. Jalankan development server

```bash
npm run dev
```

Buka alamat yang ditampilkan Vite, umumnya [http://localhost:5173](http://localhost:5173).

### 5. Build production

```bash
npm run build
npm run preview
```

## Konfigurasi Supabase

EventHub menggunakan Supabase untuk database, autentikasi, storage, dan fungsi transaksi. Konfigurasi project Supabase perlu mencakup:

1. Tabel dan relasi yang sesuai dengan snapshot pada `supabase/docs/schema.sql`.
2. Migrasi pada folder `supabase/migrations/`.
3. Bucket publik `banners` untuk banner event.
4. Bucket `avatars` untuk foto profil.
5. Google OAuth provider apabila login Google akan digunakan.
6. Site URL dan redirect URL yang sesuai untuk local development dan deployment.

> [!IMPORTANT]
> Migrasi saat ini berisi perubahan lanjutan dan belum menyediakan baseline `CREATE TABLE` lengkap. Karena itu, menjalankan `supabase db reset` pada database kosong belum dapat membangun seluruh skema secara mandiri. Gunakan project Supabase tim atau siapkan baseline schema terlebih dahulu.

## Script yang Tersedia

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Menjalankan development server Vite |
| `npm run build` | Melakukan type-check dan membuat production build |
| `npm run lint` | Menjalankan ESLint pada seluruh source code |
| `npm run preview` | Menjalankan preview hasil production build |

## Struktur Database

Entitas utama yang digunakan:

| Tabel | Fungsi |
| --- | --- |
| `profiles` | Profil pengguna dan role |
| `categories` | Kategori event |
| `venues` | Informasi venue dan kapasitas |
| `events` | Informasi event dan organizer |
| `ticket_tiers` | Jenis, harga, dan kapasitas tiket |
| `sections` | Bagian tempat duduk untuk ticket tier |
| `seats` | Daftar kursi pada setiap section |
| `orders` | Transaksi pemesanan dan pembayaran |
| `tickets` | Tiket individual, kode tiket, dan status check-in |

Beberapa proses penting dijalankan melalui PostgreSQL RPC:

- `book_ticket`: membuat order dan tiket serta mengunci pilihan kursi.
- `confirm_demo_payment`: mengonfirmasi pembayaran simulasi.
- `create_ticket_tier_seating`: membuat section dan kursi untuk ticket tier.
- `get_ticket_tier_seats`: mengambil ketersediaan kursi.
- `get_my_ticket_seats`: mengambil kursi milik pengguna aktif.
- `admin_update_profile_role`: memperbarui role pengguna oleh admin.

Diagram dan snapshot skema tersedia pada:

- [`supabase/docs/schema.png`](./supabase/docs/schema.png)
- [`supabase/docs/schema.sql`](./supabase/docs/schema.sql)

## Deployment

Repository telah menyediakan `vercel.json` untuk mengarahkan seluruh route SPA ke `index.html`.

Saat melakukan deployment:

1. Hubungkan repository ke Vercel.
2. Tambahkan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.
3. Tambahkan domain deployment ke daftar redirect URL Supabase Auth.
4. Gunakan `npm run build` sebagai build command.
5. Gunakan `dist` sebagai output directory.

## Status Pengembangan

### Sudah tersedia

- Alur publik pencarian hingga detail event.
- Authentication dan profile management.
- Event, venue, ticket tier, order, dan role management.
- Booking dengan pemilihan kursi.
- Pembayaran simulasi dengan batas waktu order.
- Tiket pengguna dan check-in.
- Dashboard organizer dan admin.
- Supabase RLS untuk beberapa resource utama.

### Batasan saat ini

- Pembayaran masih berupa simulasi dan belum terhubung ke payment gateway.
- Menu `Surveys` dan `Widgets` belum diimplementasikan.
- Automated test belum tersedia.
- Baseline migration dan seed database belum lengkap.
- Pemeriksaan ESLint masih memiliki sejumlah temuan yang perlu diselesaikan.
- Pemindai QR bergantung pada dukungan `BarcodeDetector` dari browser.

## Kontribusi

Panduan pembagian pekerjaan, struktur folder, dan aturan kolaborasi tersedia di [`CONTRIBUTE.md`](./CONTRIBUTE.md).

Sebelum mengirim perubahan:

```bash
npm run build
npm run lint
```

Pastikan perubahan database disimpan sebagai migration baru dan tidak memasukkan kredensial atau file `.env` ke repository.
