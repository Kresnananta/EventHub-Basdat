# 🎟️ EventHub Ticketing Platform

EventHub adalah platform modern berbasis web untuk merencanakan acara, mengelola penjualan tiket, hingga melakukan validasi kehadiran (*check-in*) pengunjung.

Proyek ini dikembangkan untuk memenuhi tugas mata kuliah **Basis Data** yang diampu oleh `Arta Kusuma Hernanda, S.T., M.T`.

Untuk panduan kolaborasi tim, pembagian *jobdesk*, dan struktur folder, silakan baca file **[CONTRIBUTE.md](./CONTRIBUTE.md)**.

## Anggota (Kelompok 12)
- 5024241085 - Anak Agung Ngurah Agung Kresna Ananta
- 5024241029 - Jordi
- 5024241013 - Muhammad Sayyid Tsabit
- 5024241011 - Rahmat Maulana Ansori


## Progres Saat Ini

Saat ini proyek sedang dalam tahap pengembangan.

**Progress yang telah diselesaikan:**
- [x] Inisialisasi Proyek Vite & Konfigurasi *Permanent Light Theme* (Aksen Ungu/Biru modern).
- [x] **Setup Routing:** Pemisahan jalur URL Publik (`/`) dan rute privat Dashboard (`/dashboard/*`).
- [x] **Dashboard Layout (`AppSidebar` & `Header`):** Kerangka navigasi admin lengkap dengan fitur *Event Context Switcher* (Dropdown pemilih Event).
- [x] **Halaman Overview (`Dashboard.tsx`):** Menampilkan *Stat Cards* (Volume Penjualan, Tiket Terjual), *Sales Chart* (Recharts), dan tabel pendek riwayat transaksi terbaru.
- [x] **Halaman Tickets (`Tickets.tsx`):** Tabel daftar jenis tiket (VIP, Early Bird, dll) beserta status kapasitas terjual dan sisa slot.
- [x] **Halaman Orders (`Orders.tsx`):** Direktori riwayat pesanan/pembelian seluruh pengguna dengan fitur spesifik *Client-Side Search* (Pencarian ID Order, Nama, dan Email).
- [x] **Halaman Attendees (`Attendees.tsx`):** Portal untuk tim pintu acara memvalidasi pengunjung secara manual (*Check-In*) menggunakan fitur pencarian tiket.
- [x] **Setup Supabase:** Inisiasi `supabase-js`, `database.types.ts`, dan *environment variables*.

**Fokus Selanjutnya:**
- [ ] Membangun UI Sisi Pengunjung / Pembeli (Landing Page, Halaman Pencarian Event, dan Detail Acara).
- [ ] Integrasi rute Halaman *Checkout* dan Keranjang (*Cart*).
- [ ] Menyambungkan Data Aktual (*Data Fetching*) ke Supabase untuk menggantikan data-data tiruan (*dummy*) di Dashboard.

---
*Laporan ini akan diperbarui seiring berjalannya pengembangan proyek.*

:0
