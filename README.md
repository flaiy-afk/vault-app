# VAULT — Personal Finance & Smart Investment Manager

## Fitur keuangan
- Pencatatan pemasukan tidak tetap dan pembagian otomatis ke 3 pos.
- Pengeluaran dipotong dari saldo operasional.
- Round-up: nilai debit operasional dibulatkan, selisih dialihkan ke Uang Dingin.
- Pengeluaran dapat dicatat manual atau melalui scan foto struk.
- OCR membaca nama toko, tanggal, perkiraan daftar barang, dan total; seluruh hasil bisa diperiksa dan diedit sebelum disimpan.
- Foto struk hanya diproses sementara di browser dan tidak disimpan ke riwayat. Riwayat menyimpan data transaksi, kategori, rincian barang, nominal, dan metode input.
- Detail transaksi dapat dibuka dari menu Riwayat; transaksi pengeluaran dapat diedit atau dihapus. Perubahan saldo dihitung ulang dari riwayat transaksi.
- Rasio pembagian dapat diubah (total harus 100%).
- Data disimpan lokal di browser (localStorage).
- Ekspor backup JSON dan hapus data.

## Budget Harian
- Pengguna menentukan berapa hari saldo operasional harus bertahan.
- Jatah harian dihitung dari saldo operasional tersisa dan sisa hari dalam periode. Pengeluaran hari ini diperhitungkan agar tidak terpotong dua kali dari jatah hari ini.
- VAULT menampilkan pengeluaran hari ini, sisa jatah, dan peringatan jika melewati jatah. Perubahan transaksi pengeluaran ikut memperbarui perhitungan.

## Scan struk (OCR)
- Menggunakan Tesseract.js dengan bahasa Indonesia + Inggris.
- File foto diproses di browser perangkat; aplikasi tidak mengunggah foto ke server VAULT.
- Library OCR dan model bahasa diambil dari CDN saat pertama kali digunakan, sehingga pemindaian pertama memerlukan internet. Setelah itu ketersediaan offline bergantung pada cache browser/CDN.
- OCR dapat keliru membaca angka, nama barang, dan tanggal. Selalu periksa serta koreksi total dan rincian sebelum menekan Simpan.
- Untuk privasi, file foto tidak dimasukkan ke localStorage atau riwayat transaksi.

## Indodax Balanced Market Scanner
- Daftar pair diambil otomatis dari `https://indodax.com/api/pairs`; pair IDR diprioritaskan berdasarkan volume IDR 24 jam dari `https://indodax.com/api/summaries`.
- Untuk menjaga beban API, aplikasi menganalisis maksimal 80 pair IDR teratas berdasarkan volume 24 jam, dengan empat request candle bersamaan.
- OHLC/candle diambil dari `https://indodax.com/tradingview/history_v2`.
- Parameter timeframe: 15 menit (`15`), 1 jam (`60`), 4 jam (`240`), 1 hari (`1D`).
- Hasil default menampilkan Top 5; pengguna dapat memilih Top 3 atau semua pair yang lolos skor minimum.
- Tidak membutuhkan API Key, API Secret, atau izin trading.
- Analisis dilakukan hanya saat tombol **Analisis market sekarang** ditekan.
- **Rumus Balanced tidak diubah** (0–100): RSI(14), jarak harga dari support 30 candle, volume 5 candle terakhir dibanding rerata 20 candle sebelumnya, konfirmasi EMA20, dan arah candle terakhir.
- Setiap hasil memiliki tombol **Mau Entry**. Pengguna memasukkan nominal pembelian dan harga entry aktual.
- VAULT memeriksa ulang saldo Uang Dingin saat konfirmasi. Jika nominal melebihi saldo, entry ditolak dan saldo/riwayat tidak berubah. Jika cukup, saldo Uang Dingin dikurangi dan transaksi dicatat di Riwayat serta Portofolio.
- Entry tetap merupakan pencatatan pembelian yang dilakukan manual oleh pengguna di Indodax. Tidak ada auto-buy, auto-sell, pembuatan order, atau koneksi private API.

## Menjalankan di Android
1. Ekstrak ZIP.
2. Upload folder `finance_smart_manager` ke hosting statis HTTPS.
3. Buka URL di Chrome Android.
4. Pilih menu ⋮ → Tambahkan ke layar utama / Install.
5. Aplikasi dapat dibuka seperti aplikasi biasa. Hosting statis hanya menyajikan file; tidak ada VPS yang perlu hidup 24 jam.

## Catatan dan batasan
- Scanner otomatis membatasi pemindaian ke 80 pair IDR dengan volume 24 jam tertinggi, bukan seluruh pair tanpa batas. Jika daftar pair atau candle gagal diakses, periksa koneksi, CORS browser, dan rate limit API.
- Nilai harga pada hasil scanner adalah harga candle terakhir; saat entry, masukkan harga beli aktual agar kuantitas tercatat sesuai transaksi nyata.
- Data keuangan tersimpan di browser/perangkat ini. Membersihkan data browser atau berganti perangkat dapat menghilangkan data. Ekspor backup JSON secara berkala.
- Saldo SeaBank tetap dicatat manual; aplikasi tidak membaca atau memindahkan dana.
- Entry dan exit crypto tetap dilakukan manual di aplikasi Indodax.
- Public API menyediakan data pasar tanpa autentikasi. Dokumentasi Indodax mencantumkan OHLC melalui `tradingview/history_v2`; cek pasangan dan data yang tersedia di exchange.
- Browser dapat membatasi request lintas-origin (CORS), dan API dapat menerapkan rate limit. Jika akses langsung dari browser ditolak, diperlukan proxy/backend; jangan memasukkan API Secret ke frontend.
- Skor adalah sistem ranking heuristik, **bukan probabilitas profit atau sinyal pasti**. Support sederhana, RSI, volume, dan EMA harus diperiksa manual bersama spread, likuiditas, volatilitas, dan kondisi pasar.
