# How To Operate

- Buka file HTML di browser Anda dengan menggunakan http-server atau add-on LiveServer milik VSCode.
- Operasikan slider yang ada untuk mengatur transformasi per komponen dari objek pada scene.
- Gunakan slider kamera untuk mengatur viewpoint.
- Tekan tombol toggle animasi untuk mengaktifkan/menonaktifkan animasi.
- Tekan tombol toggle render mode untuk mengganti mode rendering (wireframe/shading)
- Tekan tombol toggle viewpoint untuk memindahkan kamera ke puncak kepala objek MAN
- Tekan tombol change light type untuk mengganti tipe pencahayaan

# Proses pembentukan objek

- Objek dibentuk menggunakan sebuah kubus template yang ditransformasi sesuai dengan rancangan
- Objek hirarkikal dibentuk dengan bantuan struktur data Tree dan transformasi per segmen di aplikasikan dengan melakukan preorder traversal
- Objek ruangan dibentuk dengan kubus yang diibalik normalnya

# Proses rendering

- Kubus templat akan dirender berulang-ulang untuk masing-masing balok yang ada pada scene. Bentuknya disesuaikan dengan matriks transformasi yang disimpan pada Tree
- Data yang masuk buffer sesuai dengan urutan berikut: verteks, normal, koordinat tekstur
- Tekstur di-load secara asinkronus mengikuti sumber [berikut](https://webgl2fundamentals.org/webgl/lessons/webgl-3d-textures.html). Tekstur menggunakan parameter gl.NEAREST untuk min dan mag filter sehingga dapat me-render gambar pixel art
- Transformasi-transformasi seperti perspektif kamera dan sebagainya dilakukan kalkulasinya sebelum dan sesudah ada di shader
- Proses pencahayaan mengikuti sumber kode yang terdapat di SceLE dengan menggunakan point, direct, dan spotlight
- Masing-masing mode pencahayaan diaplikasikan secara terpisah ditambah dengan satu mode yang mengkombinasikan keseluruhan tipe pencahayaan dengan blending mode adisi (+)
- Animasi dilakukan dengan menginkremen variabel sudut intrinsik yang tersimpan pada matriks rotasi yang dimasukkan saat membuat model setiap pemanggilan method render

# Log Pekerjaan
Kami menggunakan basis program untuk WS2 dengan tambahan sesuai dengan uraian pekerjaan berikut.

## Muhammad Kenta
- Mengimplementasikan pergerakan kamera tambahan
- Mengimplementasikan lighting tambahan
- Mengimplementasikan mode rendering wireframe
- UI/UX dan dokumentasi

## Giffari Faqih
- Mengimplementasikan model hirarkikal tambahan
- Mengimplementasikan interaksi dan animasi untuk model hirarkikal tambahan
- Mengimplementasikan texturing
- Recording video

