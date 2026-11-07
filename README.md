# Özel Yeni Sekme (Custom New Tab) Uzantısı

Bu proje, Chromium tabanlı tarayıcılarda (Google Chrome, Microsoft Edge, Brave, Opera vb.) yeni sekme açıldığında açılan sayfayı tamamen kişiselleştirebilmeniz için tasarlanmış modern bir Manifest V3 tarayıcı uzantısı ve bağımsız web sayfasıdır.

---

## 🌟 Özellikler

1. **Google Arama Çubuğu**:
   - Modern Glassmorphism (buzlu cam) tasarımı ve odaklanma animasyonu.
   - Doğrudan Google araması yapabilir veya bir web adresi (`github.com`) yazdığınızda doğrudan adrese gidebilir.
   - Sayfa açıldığında otomatik olarak arama kutusuna odaklanır (`/` kısayoluyla da odaklanabilirsiniz).

2. **Canlı Dijital Saat**:
   - Sayfanın üst kısmında büyük, estetik saat ve dakika göstergesi.
   - Özelleştirme panelinden 12/24 saat formatı ve saniyeleri gösterme/gizleme seçenekleri.

3. **Hızlı Erişim Linkleri (Kısayollar)**:
   - Arama çubuğunun hemen altında favori siteleriniz.
   - Google Favicon servisi ile sitelerin logolarını otomatik çeker; yüklenemezse renkli harf rozeti gösterir.
   - Yeni kısayol ekleme, var olanları düzenleme veya silme.

4. **Türkçe Güncel Tarih (Sol Alt)**:
   - Gün, ay, yıl ve gün adını Türkçe formatta canlı gösterir (örn: *Cumartesi, 7 Kasım 2026*).

5. **Özelleştirme Paneli (Sağ Alt)**:
   - "Özelleştir" butonuna tıkladığınızda sağdan akıcı bir şekilde açılan ayar çekmecesi.
   - **Kendi Resmini Yükle**: Bilgisayarınızdan istediğiniz resmi (4K duvar kağıtları dahil) yükleyin veya sürükleyip bırakın. Veriler tarayıcının `IndexedDB` veritabanında saklanır, boyut sınırına takılmaz.
   - **Hazır Temalar**: Kozmik Mor, Derin Okyanus, Gün Batımı Işıltısı, Koyu Minimal gibi hazır renk gradyanları.
   - **Karartma ve Bulanıklık Ayarı**: Parlak duvar kağıtlarında yazıların ve arama çubuğunun her zaman net okunması için karartma opaklığını ve arka plan bulanıklığını dilediğiniz gibi ayarlayın.
   - **Varsayılana Sıfırla**: Tek tıkla varsayılan görünüme geri dönebilme.

---

## 🚀 Tarayıcıya Uzantı Olarak Nasıl Eklenir?

### Google Chrome & Brave:
1. Tarayıcınızın adres çubuğuna `chrome://extensions` yazıp Enter'a basın.
2. Sağ üst köşedeki **"Geliştirici modu" (Developer mode)** anahtarını açın.
3. Sol üstte beliren **"Paketlenmemiş öğe yükle" (Load unpacked)** butonuna tıklayın.
4. Açılan pencerede bu klasörü (`c:\Users\Founte\Documents\Karışık\Yeni Sekme Projesi`) seçin.
5. Artık yeni sekme (`Ctrl + T`) açtığınızda özel sayfanız açılacaktır!

### Microsoft Edge:
1. Adres çubuğuna `edge://extensions` yazın.
2. Sol menüdeki **"Geliştirici modu"** anahtarını açın.
3. **"Paketlenmemiş olanı yükle"** butonuna basıp bu klasörü seçin.

---

## 💻 Önizleme ve Doğrudan Kullanım

Uzantıyı yüklemeden önce veya herhangi bir tarayıcıda doğrudan test etmek için klasördeki `newtab.html` dosyasına çift tıklayarak tarayıcınızda açabilirsiniz.
