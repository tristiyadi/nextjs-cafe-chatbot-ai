# Panduan Fine-Tuning Kafi (Full Dockerize Windows)

Dokumen ini berisi panduan teknis langkah demi langkah untuk melakukan *fine-tuning* Kafi (AI Barista Kafe Nusantara) menggunakan QLoRA dan Unsloth. Pelatihan ini dieksekusi secara *Full Dockerize* sehingga sangat cocok untuk environment **OS Windows (menggunakan GPU via WSL2)**.

## Prasyarat Sistem
1. Pastikan Anda memiliki GPU dengan VRAM minimal 8GB (khususnya seri NVIDIA RTX/GTX).
2. **NVIDIA Driver** terbaru sudah diinstal ke dalam Windows Anda.
3. **Docker Desktop** sudah menggunakan **WSL 2 based engine** (Cek di Pengaturan Docker Desktop: `Settings > General`).

---

## Tahapan Eksekusi

### 1. Buat Dataset Training (Data Sintetik)
Gunakan *live menu* database PostgreSQL proyek ini untuk di-sintesis menjadi sebuah *file dataset chat* berisikan lebih dari 1000 iterasi pesanan Kafi.
* **Perintah**: 
  Di terminal / root proyek (`c:\dev\cafe-chatbot`), jalankan:
  ```bash
  npm run generate:training-data
  ```
  *(Atau secara spesifik `npx tsx scripts/generate-training-data.ts`)*
* **Hasil**: Anda akan memiliki satu file baru di `scripts/fine-tune/data/cafe-training-data.jsonl` sebelum memasuki langkah kedua.

### 2. Mulai Proses Fine-Tuning di Docker
Jalankan file `docker-compose.finetune.yml` yang otomatis akan me-*mount* folder `scripts/fine-tune` ini dan mengekspos Engine CUDA GPU secara penuh.

* **Perintah**:
  Buka terminal/powershell di root folder aplikasi Anda, lalu ketikkan:
  ```bash
  docker compose -f docker-compose.finetune.yml up --build
  ```
* **Catatan**: Proses ini akan berjalan sekitar **15 - 30 menit**. Biarkan log terminal Docker mengeluarkan informasi *train loss* sampai ia memproses *export* dan selesai dengan notifikasi `🎉 Fine-tuning pipeline complete!`.

### 3. Masukkan Model Baru ke Ollama
Setelah proses di Docker selesai, hasil *fine-tune* tersebut (adapter `.gguf` dan config Modelfile) otomatis disimpan di luar Docker, tepatnya di folder `scripts/fine-tune/output/`. Sekarang Anda perlu mengenalkan otak Kafi yang baru ini ke engine Ollama Anda.

* **Perintah**:
  Buka jendela Terminal (CMD/Powershell) **baru** di direktori proyek dan jalankan:
  ```bash
  
  # normal
  docker compose exec llm ollama create kafi-ft -f scripts/fine-tune/output/Modelfile.finetuned
  
  # alternatif copy by folder
  docker compose exec llm mkdir -p /root/kafi-ft
  docker cp scripts/fine-tune/output/. cafe-llm:/root/kafi-ft/
  docker compose exec llm ollama create kafi-ft -f /root/kafi-ft/Modelfile.finetuned

  # alternatif copy spesific file
  docker cp scripts/fine-tune/output/Modelfile.finetuned cafe-llm:/root/kafi-ft/
  docker cp scripts/fine-tune/output/unsloth.Q4_K_M.gguf cafe-llm:/root/kafi-ft/
  docker compose exec -w /root/kafi-ft llm ollama create kafi-ft -f Modelfile.finetuned

  # cek model
  docker compose exec llm ollama list
  ```

### 4. Aktifkan Model di Web App Anda
Setelah model bernama `kafi-ft` selesai dikenali Ollama, jadikan model ini default untuk proyek Kafe Nusantara Anda.

1. Buka file konfigurasi environment utama: `.env`
2. Ubah/Set nama local LLM agar sistem API menggunakannya:
   ```env
   LOCAL_LLM_MODEL=kafi-ft
   ```
3. Restart *local Next.js server* Anda (`npm run dev`).

Selesai! Kafi kini sudah memiliki basis data cerdas yang belajar langsung sesuai preferensi format jawaban dan item Kafe Anda.

---

## Opsi Alternatif: Google Colab (Jika PC Anda tidak memiliki GPU NVIDIA)

Jika komputer Anda tidak memiliki kartu grafis NVIDIA yang diwajibkan untuk menjalankan Docker di atas, proses fine-tuning bisa di-*bypass* ke internet menggunakan Google Colab.

### 1. Persiapkan File & Colab
1. Pastikan Anda sudah menjalankan langkah pertama (`npm run generate:training-data`).
2. Buka platform [Google Colab](https://colab.research.google.com/) dan buat *notebook* baru.
3. Wajib: Klik menu **Runtime > Change runtime type > Pilih T4 GPU**.

### 2. Upload File ke Colab
Pilih panel **Files/Folder 📁** di sebelah kiri layar Colab, kemudian tekan tombol *Upload* dan unggah dua file berikut ke *root directory* colab Anda:
* `scripts/fine-tune/train-linux.py` (Script training khusus yang telah disesuaikan konfigurasi letak path-nya)
* `scripts/fine-tune/data/cafe-training-data.jsonl` (File output dari proses *generate* data awal Anda)

### 3. Eksekusi Training
Di sebuah *cell* kode kosong Google Colab, salin instruksi berikut lalu tekan *Play*:
```bash
import subprocess
import sys

# Run the installation and training command in a non-blocking way
command = 'pip install --no-deps "xformers<0.0.27" "trl<0.9.0" peft accelerate bitsandbytes'
process = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, bufsize=1)

print("STDOUT:")
# Read stdout in real-time
for line in process.stdout:
    print(line, end='')
    sys.stdout.flush() # Ensure output is printed immediately

print("STDERR:")
# Read stderr in real-time (can also be combined into one loop if needed)
for line in process.stderr:
    print(line, end='')
    sys.stderr.flush()

# Wait for the process to finish and get the return code
process.wait()

if process.returncode != 0:
    print(f"Command failed with exit code {process.returncode}")
else:
    print("Command executed successfully.")
```
```python
# 1. Instal seluruh library
!pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
!pip install --no-deps "xformers<0.0.27" "trl<0.9.0" peft accelerate bitsandbytes

# 2. Jalankan skripsinya
!python train-linux.py
```

### 4. Tarik Sisa Hasil Panen
Tunggu Colab bekerja hingga memunculkan `🎉 Fine-tuning pipeline complete!`. 
Setelah sukses, file cerdas baru Anda akan muncul di tab *Files* kiri Colab. Klik titik tiga dan **Download** 2 file di bawah ini:
* `unsloth.Q4_K_M.gguf`
* `Modelfile.finetuned`

Letakkan hasil unduhan ini ke dalam folder kosong direktori lokal Windows Anda di `scripts/fine-tune/output/`. Terakhir, **loncat kembali ke Langkah 3** pada panduan Docker di atas untuk meng-*install* model tersebut ke dalam Ollama!
