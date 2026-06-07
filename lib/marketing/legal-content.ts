export type LegalSection = {
  title: string;
  paragraphs: string[];
};

export type LegalDocument = {
  title: string;
  intro: string;
  updated: string;
  sections: LegalSection[];
};

export const PRIVACY_POLICY: LegalDocument = {
  title: "Gizlilik Politikası",
  updated: "Mayıs 2026",
  intro:
    "DerecePanel olarak koçluk sürecinizde girdiğiniz öğrenci ve deneme verilerinin size ait olduğunu biliyoruz. Bu metin, hangi bilgileri neden topladığımızı ve bunları nasıl koruduğumuzu sade bir dille anlatır.",
  sections: [
    {
      title: "Hangi verileri işliyoruz?",
      paragraphs: [
        "Hesap bilgileriniz (ad, e-posta, telefon), koç veya kurum profiliniz ve panelde oluşturduğunuz öğrenci kayıtları bu kapsamdadır. Öğrencilere ait ad-soyad, sınıf, hedef bölüm, deneme netleri, konu tamamlanma durumu, haftalık program atamaları ve görüşme notları gibi eğitim verileri de platformda tutulur.",
        "Teknik tarafında oturum çerezleri, cihaz/tarayıcı bilgisi ve hata kayıtları — yalnızca güvenlik ve performans için — sınırlı şekilde loglanabilir.",
      ],
    },
    {
      title: "Verileri ne için kullanıyoruz?",
      paragraphs: [
        "Topladığımız bilgilerin tek amacı DerecePanel hizmetini sunmak: deneme analizi, program atama, raporlama, simülasyon ve içerik modüllerinin çalışması. Verilerinizi reklam ağına satmıyoruz ve rastgele pazarlama listeleriyle paylaşmıyoruz.",
        "Demo talep formunda ilettiğiniz iletişim bilgileri yalnızca sizinle görüşme planlamak ve teklif sunmak için kullanılır.",
      ],
    },
    {
      title: "Veriler kimlerle paylaşılır?",
      paragraphs: [
        "Sunucu, e-posta veya yedekleme gibi zorunlu altyapı hizmetlerinde yalnızca hizmeti sağlayan tedarikçilerle, gizlilik yükümlülüğü altında paylaşım yapılabilir.",
        "Yasal bir zorunluluk (mahkeme kararı, resmi talep) olmadıkça üçüncü taraflara veri aktarmayız. Kurumsal paketlerde kurum içi alt hesaplar, yetkilendirdiğiniz koçlarla sınırlı kalır.",
      ],
    },
    {
      title: "Ne kadar süre saklanır?",
      paragraphs: [
        "Hesabınız aktif olduğu sürece verileriniz panelde kalır. Hesap kapatma talebinde, yasal saklama yükümlülüklerimiz dışında makul sürede silme veya anonimleştirme yapılır.",
        "Yedekler periyodik olarak döndürülür; silme işlemi yedeklerin tamamen devre dışı kalması birkaç haftayı bulabilir.",
      ],
    },
    {
      title: "Haklarınız (KVKK kapsamında)",
      paragraphs: [
        "Verilerinize erişme, yanlış bilgiyi düzeltme, belirli işlemlere itiraz etme ve silinmesini isteme hakkına sahipsiniz. Talebinizi demo formu veya hesabınızdaki iletişim kanalları üzerinden iletebilirsiniz; makul sürede yanıt veririz.",
        "Şikâyetiniz için Kişisel Verileri Koruma Kurumu’na başvuru hakkınız saklıdır.",
      ],
    },
    {
      title: "Güvenlik",
      paragraphs: [
        "Veriler aktarımında HTTPS kullanıyoruz; erişimler rol bazlı sınırlandırılır. Hiçbir sistem %100 garanti veremese de, yetkisiz erişimi önlemek için düzenli gözden geçirme yapıyoruz.",
      ],
    },
  ],
};

export const TERMS_OF_SERVICE: LegalDocument = {
  title: "Kullanım Şartları",
  updated: "Mayıs 2026",
  intro:
    "DerecePanel’i kullanmaya başladığınızda aşağıdaki koşulları kabul etmiş sayılırsınız. Kısa ve net tutmaya çalıştık; anlamadığınız bir madde olursa demo görüşmesinde birlikte üzerinden geçebiliriz.",
  sections: [
    {
      title: "Hizmetin kapsamı",
      paragraphs: [
        "DerecePanel; YKS koçları, danışmanlar ve eğitim kurumları için öğrenci takibi, deneme analizi, programlama, simülasyon ve içerik üretim araçları sunan bir bulut yazılımıdır. Özellikler paketinize göre değişebilir; beta modüller önceden haber verilerek güncellenebilir.",
      ],
    },
    {
      title: "Hesap ve güvenlik",
      paragraphs: [
        "Panel erişimi size veya kurumunuz tarafından yetkilendirilmiş kişilere aittir. Şifrenizi kimseyle paylaşmamalısınız; hesabınız altında yapılan işlemlerden siz sorumlusunuz.",
        "Öğrenci verisi girdiğinizde, veli/öğrenci bilgilendirme yükümlülüklerinin size ait olduğunu kabul edersiniz.",
      ],
    },
    {
      title: "Kabul edilebilir kullanım",
      paragraphs: [
        "Platformu yürürlükteki mevzuata, öğrenci gizliliğine ve dürüst koçluk ilkelerine uygun kullanmalısınız. Sisteme zarar verecek saldırılar, yetkisiz kopyalama girişimleri veya hizmeti başkalarının kullanımını engelleyecek davranışlar yasaktır.",
        "Bu kurallara aykırı kullanımda hesabı askıya alma veya sonlandırma hakkımız saklıdır.",
      ],
    },
    {
      title: "Abonelik ve ödeme",
      paragraphs: [
        "Ücretli paketlerde fiyatlar sitede veya teklif formunda belirtilen tutarlara göre faturalandırılır; fiyatlar KDV hariçtir. Yıllık ödemelerde duyurulan indirim koşulları geçerlidir.",
        "Deneme süresi bitiminde ücretsiz paket sınırlarına düşebilir veya abonelik yenilemeniz gerekir. İptal, dönem sonuna kadar geçerli olur; kısmi iade politikası teklif ve sözleşmede ayrıca yazılır.",
      ],
    },
    {
      title: "Fikri mülkiyet",
      paragraphs: [
        "DerecePanel arayüzü, yazılımı ve markası bize aittir. Panelde ürettiğiniz içerik (reçete, test, not) size aittir; bize yalnızca hizmeti sunmak için sınırlı barındırma lisansı vermiş olursunuz.",
      ],
    },
    {
      title: "Analiz çıktıları ve sorumluluk",
      paragraphs: [
        "Net trendi, triage uyarıları, simülasyon ve tercih senaryoları karar destek aracıdır; tek başına bağlayıcı sonuç sayılmaz. Öğrenci yönlendirme kararı koç ve kurum sorumluluğundadır.",
        "Hizmet kesintisi, veri kaybı veya dolaylı zararlarda yasaların izin verdiği ölçüde sorumluluğumuz sınırlıdır.",
      ],
    },
    {
      title: "Değişiklikler",
      paragraphs: [
        "Bu şartları güncelleyebiliriz. Önemli değişiklikleri e-posta veya panel içi bildirimle duyururuz. Güncellemeden sonra kullanmaya devam etmeniz yeni metni kabul ettiğiniz anlamına gelir.",
      ],
    },
  ],
};

export const KVKK_AYDINLATMA: LegalDocument = {
  title: "KVKK Aydınlatma Metni",
  updated: "Mayıs 2026",
  intro:
    "6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) kapsamında, veri sorumlusu sıfatıyla DerecePanel olarak kişisel verilerinizin hangi amaçlarla işlendiğini aşağıda açıklıyoruz.",
  sections: [
    {
      title: "Veri sorumlusu",
      paragraphs: [
        "DerecePanel; koç, kurum ve öğrenci kullanıcılarına yönelik eğitim yönetim platformudur. Kişisel verileriniz, hizmetin ifası ve mevzuattan doğan yükümlülükler çerçevesinde işlenir.",
      ],
    },
    {
      title: "İşlenen kişisel veriler",
      paragraphs: [
        "Kimlik ve iletişim bilgileri (ad, soyad, e-posta), hesap güvenliği verileri (şifre — şifrelenmiş saklanır), kullanıcı rolü (öğrenci, koç, kurum) ve platform kullanım kayıtları işlenebilir.",
        "Koç ve kurum hesaplarında öğrencilere ait eğitim verileri, hizmetin doğası gereği veri sorumlusunun talimatıyla işlenir.",
      ],
    },
    {
      title: "İşleme amaçları ve hukuki sebepler",
      paragraphs: [
        "Verileriniz; üyelik oluşturma, kimlik doğrulama, panel hizmetlerinin sunulması, destek taleplerinin yanıtlanması ve bilgi güvenliği amaçlarıyla işlenir.",
        "Hukuki sebepler: sözleşmenin kurulması ve ifası, meşru menfaat, açık rızanız (gerektiğinde) ve kanuni yükümlülükler.",
      ],
    },
    {
      title: "Aktarım ve saklama süresi",
      paragraphs: [
        "Verileriniz yalnızca hizmet altyapısı sağlayıcılarıyla, gerekli güvenlik önlemleri alınarak paylaşılabilir. Yurt dışına aktarım söz konusu olduğunda KVKK’ya uygun mekanizmalar uygulanır.",
        "Hesabınız aktif olduğu sürece veriler saklanır; silme talebinde yasal saklama süreleri hariç makul sürede silinir.",
      ],
    },
    {
      title: "Haklarınız",
      paragraphs: [
        "KVKK md. 11 kapsamında; verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltme, silme, itiraz ve zararın giderilmesini talep etme haklarına sahipsiniz.",
        "Taleplerinizi info@derecepanel.com adresine iletebilirsiniz.",
      ],
    },
  ],
};
