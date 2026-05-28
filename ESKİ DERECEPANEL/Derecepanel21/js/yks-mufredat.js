/**
 * YKS (Yükseköğretim Kurumları Sınavı) Müfredat Verisi
 * TYT - Temel Yeterlilik Testi
 * AYT - Alan Yeterlilik Testi
 * 
 * Güncel MEB Müfredatına Uygun - 2024-2025 YKS Sistemi
 * TYT konu çerçevesi: Kitapseç TYT konuları ve soru dağılımı özeti (blog) ile uyumlu
 * @version 1.2.0
 */

// Zorluk seviyeleri
const Zorluk = { KOLAY: 'Kolay', ORTA: 'Orta', ZOR: 'Zor', COK_ZOR: 'Çok Zor' };

// Yardımcı fonksiyon
const createKazanim = (kod, ad, zorluk, agirlik, kazanimlar) => ({
  kod, ad, zorluk, agirlik, kazanimlar
});

// ============================================
// TYT TÜRKÇE (40 Soru - 60 Dakika) — Kitapseç konu başlıkları
// ============================================
const TYT_TURKCE = {
  kod: 'TYT_TUR',
  ad: 'TYT Türkçe',
  soru: 40,
  sure: 60,
  yuzde: 32,
  konular: {
    sozcukteAnlam: {
      kod: 'TYT_TUR_01', ad: 'Sözcükte Anlam', zorluk: Zorluk.ORTA, yuzde: 10,
      kazanimlar: {
        gercekMecaz: createKazanim('01_01', 'Gerçek, Mecaz ve Terim Anlam', Zorluk.ORTA, 2, [
          'Bağlamda anlam genişlemesi ve daralması',
          'Terim, mecaz ve çağrışım ayrımı'
        ]),
        esZitYakin: createKazanim('01_02', 'Anlam İlişkileri', Zorluk.ORTA, 2, [
          'Eş anlamlı, zıt anlamlı, yakın anlamlı sözcükler',
          'Sözcükte çok anlamlılık ve eş seslilik'
        ]),
        cumleParagraf: createKazanim('01_03', 'Sözcük ve Bağlam', Zorluk.ZOR, 2, [
          'Noktalama ve vurgu ile anlam farkları',
          'Sözcüğün paragraf içindeki görevi'
        ])
      },
      onKosul: [], sonraki: ['sozYorumu']
    },
    sozYorumu: {
      kod: 'TYT_TUR_02', ad: 'Söz Yorumu', zorluk: Zorluk.ORTA, yuzde: 3,
      kazanimlar: {
        dolayliAnlatim: createKazanim('02_01', 'İma ve Üslup', Zorluk.ZOR, 2, [
          'Yazarın tutumu, üslup ve ton',
          'Dolaylı anlatım, kinaye ve ironi'
        ])
      },
      onKosul: ['sozcukteAnlam'], sonraki: ['deyimAtasozu']
    },
    deyimAtasozu: {
      kod: 'TYT_TUR_03', ad: 'Deyim ve Atasözü', zorluk: Zorluk.ORTA, yuzde: 3,
      kazanimlar: {
        deyim: createKazanim('03_01', 'Deyimler', Zorluk.ORTA, 2, [
          'Deyimin yapısı, anlamı ve kullanım alanları',
          'Deyim–atasözü ayrımı'
        ]),
        atasozu: createKazanim('03_02', 'Atasözleri', Zorluk.ORTA, 2, [
          'Öğüt ve yargı içeren kalıplaşmış söz',
          'Anlam ve örnek cümle ile pekiştirme'
        ])
      },
      onKosul: ['sozYorumu'], sonraki: ['cumledeAnlam']
    },
    cumledeAnlam: {
      kod: 'TYT_TUR_04', ad: 'Cümlede Anlam', zorluk: Zorluk.ORTA, yuzde: 8,
      kazanimlar: {
        iliski: createKazanim('04_01', 'Cümleler Arası Anlam İlişkileri', Zorluk.ORTA, 2, [
          'Neden–sonuç, amaç–sonuç, koşul, karşılaştırma, zıtlık',
          'Bağlaç ve edatla kurulan anlam bağları'
        ]),
        anlamOgeleri: createKazanim('04_02', 'Vurgu ve Anlatım', Zorluk.ZOR, 2, [
          'Dolaylı anlatım, kinaye, ikileme',
          'Cümle tamamlama ve sıralama'
        ])
      },
      onKosul: ['deyimAtasozu'], sonraki: ['paragraf']
    },
    paragraf: {
      kod: 'TYT_TUR_05', ad: 'Paragraf', zorluk: Zorluk.ORTA, yuzde: 28,
      kazanimlar: {
        anlatimTeknikleri: createKazanim('05_01', 'Paragrafta Anlatım Teknikleri', Zorluk.ORTA, 3, [
          'Betimleme, öyküleme, açıklama, tartışma, kanıtlama',
          'Örnekleme, karşılaştırma, tanık gösterme'
        ]),
        dusunceGelistirme: createKazanim('05_02', 'Düşünceyi Geliştirme Yolları', Zorluk.ORTA, 3, [
          'Tanım, örnekleme, karşıt görüş, sonuç çıkarma',
          'Paragrafın giriş–gelişme–sonuç işlevi'
        ]),
        yapi: createKazanim('05_03', 'Paragrafta Yapı', Zorluk.ORTA, 3, [
          'Ana düşünce ile yardımcı düşüncelerin ilişkisi',
          'Paragraf bütünlüğü ve geçiş ifadeleri'
        ]),
        konuAnaDusunce: createKazanim('05_04', 'Konu ve Ana Düşünce', Zorluk.ZOR, 3, [
          'Konu cümlesi ve ana fikir',
          'Başlık–konu–ana düşünce uyumu'
        ]),
        yardimciDusunce: createKazanim('05_05', 'Yardımcı Düşünce', Zorluk.ZOR, 3, [
          'Örnek, açıklama, karşı argüman olarak yardımcı düşünce',
          'Çıkarım ve sonuç cümleleri'
        ])
      },
      onKosul: ['cumledeAnlam'], sonraki: ['sesBilgisi']
    },
    sesBilgisi: {
      kod: 'TYT_TUR_06', ad: 'Ses Bilgisi', zorluk: Zorluk.KOLAY, yuzde: 2,
      kazanimlar: {
        sesOlaylari: createKazanim('06_01', 'Ses Olayları', Zorluk.KOLAY, 2, [
          'Ünlü daralması, ünlü düşmesi, ünsüz benzeşmesi, ünsüz yumuşaması',
          'Türeme ve kök yapısı ile ses bilgisi'
        ])
      },
      onKosul: ['paragraf'], sonraki: ['yazimKurallari']
    },
    yazimKurallari: {
      kod: 'TYT_TUR_07', ad: 'Yazım Kuralları', zorluk: Zorluk.KOLAY, yuzde: 5,
      kazanimlar: {
        tdk: createKazanim('07_01', 'TDK Yazım İlkeleri', Zorluk.KOLAY, 2, [
          'Büyük harf, bitişik ve ayrı yazım',
          'Kısaltmalar ve sayıların yazımı'
        ])
      },
      onKosul: ['sesBilgisi'], sonraki: ['noktalamaIsaretleri']
    },
    noktalamaIsaretleri: {
      kod: 'TYT_TUR_08', ad: 'Noktalama İşaretleri', zorluk: Zorluk.ORTA, yuzde: 5,
      kazanimlar: {
        isaretler: createKazanim('08_01', 'Noktalama', Zorluk.ORTA, 2, [
          'Nokta, virgül, iki nokta, tire, üç nokta, tırnak, parantez',
          'Ünlem, soru işareti ve noktalı virgülün işlevleri'
        ])
      },
      onKosul: ['yazimKurallari'], sonraki: ['sozcukteYapiEkler']
    },
    sozcukteYapiEkler: {
      kod: 'TYT_TUR_09', ad: 'Sözcükte Yapı / Ekler', zorluk: Zorluk.ORTA, yuzde: 5,
      kazanimlar: {
        ekler: createKazanim('09_01', 'Yapım ve Çekim Ekleri', Zorluk.ORTA, 2, [
          'Kök, gövde, ek; çekim eki sırası',
          'Yapım ekleri ile sözcük türü değişimi'
        ])
      },
      onKosul: ['noktalamaIsaretleri'], sonraki: ['sozcukTurleri']
    },
    sozcukTurleri: {
      kod: 'TYT_TUR_10', ad: 'Sözcük Türleri', zorluk: Zorluk.ZOR, yuzde: 8,
      kazanimlar: {
        isimler: createKazanim('10_01', 'İsimler', Zorluk.ORTA, 2, [
          'Özel–cins, somut–soyut, tekil–çoğul, adıl tamlaması'
        ]),
        zamirler: createKazanim('10_02', 'Zamirler', Zorluk.ORTA, 2, [
          'İşaret, kişi, belgisiz, soru zamirleri; -ki zamiri'
        ]),
        sifatlar: createKazanim('10_03', 'Sıfatlar', Zorluk.ORTA, 2, [
          'Niteleme–belirtme, sıfat–zarf ayrımı, sıfat tamlaması'
        ]),
        zarflar: createKazanim('10_04', 'Zarflar', Zorluk.ORTA, 2, [
          'Zaman, yer-yön, durum, miktar, soru zarfları'
        ]),
        edatBaglacUnlem: createKazanim('10_05', 'Edat – Bağlaç – Ünlem', Zorluk.ZOR, 2, [
          'Edatların cümlede rolleri; bağlaç türleri ve anlam ilişkileri',
          'Ünlemin duygu ve vurgu işlevi'
        ])
      },
      onKosul: ['sozcukteYapiEkler'], sonraki: ['fiiller']
    },
    fiiller: {
      kod: 'TYT_TUR_11', ad: 'Fiiller', zorluk: Zorluk.ZOR, yuzde: 8,
      kazanimlar: {
        kipKisiYapi: createKazanim('11_01', 'Fiilde Anlam (Kip–Kişi–Yapı)', Zorluk.ZOR, 2, [
          'Olumlu–olumsuz, işteş, dönüşlü yapı; kip ve kişi ekleri',
          'Ek fiille kurulan çekimli fiil yapıları'
        ]),
        ekFiil: createKazanim('11_02', 'Ek Fiil', Zorluk.ORTA, 2, [
          'İ–di, -miş, -se, -ken ek fiilleri ve anlam farkları'
        ]),
        fiilimsi: createKazanim('11_03', 'Fiilimsi', Zorluk.ZOR, 2, [
          'İsim-fiil, sıfat-fiil, zarf-fiil; yükleme ve yan cümle kurma'
        ]),
        fiildeCati: createKazanim('11_04', 'Fiilde Çatı', Zorluk.ZOR, 2, [
          'Etken, edilgen, dönüşlü, işteş çatı anlamları'
        ])
      },
      onKosul: ['sozcukTurleri'], sonraki: ['sozcukGruplari']
    },
    sozcukGruplari: {
      kod: 'TYT_TUR_12', ad: 'Sözcük Grupları', zorluk: Zorluk.ORTA, yuzde: 3,
      kazanimlar: {
        gruplar: createKazanim('12_01', 'Sözcük Grupları', Zorluk.ORTA, 2, [
          'Tamlama, edat grubu, zarf tümleci, yükleme tamamlayıcıları',
          'Öbeklenme ve anlam bütünlüğü'
        ])
      },
      onKosul: ['fiiller'], sonraki: ['cumleninOgeleri']
    },
    cumleninOgeleri: {
      kod: 'TYT_TUR_13', ad: 'Cümlenin Ögeleri', zorluk: Zorluk.ZOR, yuzde: 4,
      kazanimlar: {
        ogeler: createKazanim('13_01', 'Öge Çözümlemesi', Zorluk.ZOR, 2, [
          'Yüklem, özne, nesne, dolaylı tümleç, zarf ve edat tümleci',
          'Yüklem–özne uyumu; edilgen yapılarda özne'
        ])
      },
      onKosul: ['sozcukGruplari'], sonraki: ['cumleTurleri']
    },
    cumleTurleri: {
      kod: 'TYT_TUR_14', ad: 'Cümle Türleri', zorluk: Zorluk.ZOR, yuzde: 4,
      kazanimlar: {
        yapi: createKazanim('14_01', 'Yapı ve Anlamına Göre Cümle', Zorluk.ZOR, 2, [
          'Basit, birleşik, sıralı, bağlı cümleler',
          'Olumlu–olumsuz, soru, ünlem, dilek cümleleri'
        ])
      },
      onKosul: ['cumleninOgeleri'], sonraki: ['anlatimBozuklugu']
    },
    anlatimBozuklugu: {
      kod: 'TYT_TUR_15', ad: 'Anlatım Bozukluğu', zorluk: Zorluk.ZOR, yuzde: 4,
      kazanimlar: {
        bozukluk: createKazanim('15_01', 'Anlatım Bozuklukları', Zorluk.ZOR, 2, [
          'Anlam ve söz dizimi kaynaklı bozukluklar',
          'Mantık, uyum ve gereksiz sözcük hataları; düzeltme stratejileri'
        ])
      },
      onKosul: ['cumleTurleri'], sonraki: []
    }
  },
  kaynaklar: ['MEB Türk Dili ve Edebiyatı (9–12)', 'TDK Yazım Kılavuzu', 'Kitapseç TYT konu listesi özeti'],
  tavsiyeler: ['Paragraf ağırlığını göz önünde bulundurun', 'Ses bilgisini yazım–sözcük yapısı ile birlikte tekrarlayın']
};

// ============================================
// TYT SOSYAL — Tarih (5 soru) — Kitapseç ünite başlıkları
// ============================================
const TYT_TARI = {
  kod: 'TYT_TAR',
  ad: 'TYT Tarih',
  soru: 5,
  sure: 30,
  yuzde: 25,
  konular: {
    tarihVeZaman: {
      kod: 'TYT_TAR_01', ad: 'Tarih ve Zaman', zorluk: Zorluk.KOLAY, yuzde: 5,
      kazanimlar: {
        bilim: createKazanim('01_01', 'Tarih Bilimi', Zorluk.KOLAY, 2, [
          'Tarihin konusu, zaman ve mekân, nedensellik',
          'Birincil ve ikincil kaynaklar, tarih yazıcılığı'
        ]),
        kronoloji: createKazanim('01_02', 'Tarihsel Dönemlendirme', Zorluk.ORTA, 2, [
          'Kronoloji, dönem ve çağ kavramları',
          'Takvim sistemleri ve tarih öncesi'
        ])
      },
      onKosul: [], sonraki: ['insanliginIlkDonemleri']
    },
    insanliginIlkDonemleri: {
      kod: 'TYT_TAR_02', ad: 'İnsanlığın İlk Dönemleri', zorluk: Zorluk.ORTA, yuzde: 5,
      kazanimlar: {
        uygarlik: createKazanim('02_01', 'İlk Uygarlıklar', Zorluk.ORTA, 2, [
          'Tarım devrimi, şehirleşme, yazının bulunuşu',
          'Mezopotamya, Mısır, Anadolu’da ilk kültürler'
        ])
      },
      onKosul: ['tarihVeZaman'], sonraki: ['ortaCagdaDunya']
    },
    ortaCagdaDunya: {
      kod: 'TYT_TAR_03', ad: 'Orta Çağ\'da Dünya', zorluk: Zorluk.ORTA, yuzde: 4,
      kazanimlar: {
        avrupaBizans: createKazanim('03_01', 'Orta Çağ Avrupası ve Bizans', Zorluk.ORTA, 2, [
          'Feodal yapı, kilise ve siyaset',
          'Bizans’ın konumu ve kültürel mirası'
        ])
      },
      onKosul: ['insanliginIlkDonemleri'], sonraki: ['turkDunyasiIlkOrta']
    },
    turkDunyasiIlkOrta: {
      kod: 'TYT_TAR_04', ad: 'İlk ve Orta Çağlarda Türk Dünyası', zorluk: Zorluk.ZOR, yuzde: 5,
      kazanimlar: {
        devletler: createKazanim('04_01', 'İlk Türk Devletleri', Zorluk.ZOR, 2, [
          'Asya Hunları, Göktürkler, Uygurlar; göç ve kültür',
          'Orhun yazıtları ve Türk yönetim geleneği'
        ])
      },
      onKosul: ['ortaCagdaDunya'], sonraki: ['islamMedeniyetininDogusu']
    },
    islamMedeniyetininDogusu: {
      kod: 'TYT_TAR_05', ad: 'İslam Medeniyetinin Doğuşu', zorluk: Zorluk.ORTA, yuzde: 5,
      kazanimlar: {
        hzMuhammed: createKazanim('05_01', 'İslam’ın Doğuşu ve Yayılışı', Zorluk.ORTA, 2, [
          'Hicret, dört halife dönemi, Emeviler ve Abbâsîler',
          'İslam medeniyetinde bilim, hukuk ve kültür'
        ])
      },
      onKosul: ['turkDunyasiIlkOrta'], sonraki: ['turklerIslamIlkDevletler']
    },
    turklerIslamIlkDevletler: {
      kod: 'TYT_TAR_06', ad: 'Türklerin İslamiyet’i Kabulü ve İlk Türk İslam Devletleri', zorluk: Zorluk.ZOR, yuzde: 5,
      kazanimlar: {
        karahanliSelcuklu: createKazanim('06_01', 'Türk-İslam Devletleri', Zorluk.ZOR, 2, [
          'Karahanlılar, Gazneliler, Büyük Selçuklu Devleti',
          'Anadolu’ya Türk göçleri ve kültürel etkiler'
        ])
      },
      onKosul: ['islamMedeniyetininDogusu'], sonraki: ['selcukluTurkiyesi']
    },
    selcukluTurkiyesi: {
      kod: 'TYT_TAR_07', ad: 'Yerleşme ve Devletleşme Sürecinde Selçuklu Türkiyesi', zorluk: Zorluk.ZOR, yuzde: 4,
      kazanimlar: {
        anadoluSelcuklu: createKazanim('07_01', 'Anadolu Selçukluları', Zorluk.ZOR, 2, [
          'Anadolu Selçuklu siyaseti, ticaret yolları, mimari',
          'Moğol istilası ve beylikler çağının başlaması'
        ])
      },
      onKosul: ['turklerIslamIlkDevletler'], sonraki: ['osmanliSiyasetiBeylikten']
    },
    osmanliSiyasetiBeylikten: {
      kod: 'TYT_TAR_08', ad: 'Beylikten Devlete Osmanlı Siyaseti', zorluk: Zorluk.ZOR, yuzde: 5,
      kazanimlar: {
        kurulus: createKazanim('08_01', 'Kuruluş ve Genişleme', Zorluk.ZOR, 2, [
          'Osmanlı’nın kuruluşu, Rumeli’ye açılım',
          'Devlet teşkilatının temelleri ve fetih politikası'
        ])
      },
      onKosul: ['selcukluTurkiyesi'], sonraki: ['osmanliAskerler']
    },
    osmanliAskerler: {
      kod: 'TYT_TAR_09', ad: 'Devletleşme Sürecinde Savaşçılar ve Askerler', zorluk: Zorluk.ORTA, yuzde: 4,
      kazanimlar: {
        askeri: createKazanim('09_01', 'Askeri Yapı ve Kapıkulu', Zorluk.ORTA, 2, [
          'Timar, kapıkulu ocakları, savaş teknolojisi',
          'Savaşların devletleşmeye etkisi'
        ])
      },
      onKosul: ['osmanliSiyasetiBeylikten'], sonraki: ['osmanliMedeniyetiBeylikten']
    },
    osmanliMedeniyetiBeylikten: {
      kod: 'TYT_TAR_10', ad: 'Beylikten Devlete Osmanlı Medeniyeti', zorluk: Zorluk.ORTA, yuzde: 4,
      kazanimlar: {
        kultur: createKazanim('10_01', 'Kültür ve Hukuk', Zorluk.ORTA, 2, [
          'Şehir hayatı, vakıflar, mimari ve sanat',
          'Kanunî düzen: örfi ve şer’i hukuk unsurları'
        ])
      },
      onKosul: ['osmanliAskerler'], sonraki: ['dunyaGucuOsmanli']
    },
    dunyaGucuOsmanli: {
      kod: 'TYT_TAR_11', ad: 'Dünya Gücü Osmanlı', zorluk: Zorluk.ZOR, yuzde: 5,
      kazanimlar: {
        yukselis: createKazanim('11_01', 'Yükseliş Dönemi', Zorluk.ZOR, 2, [
          'Kanuni dönemi, Akdeniz ve İran cepheleri',
          'İdari merkeziyetçilik ve eyalet sistemi'
        ])
      },
      onKosul: ['osmanliMedeniyetiBeylikten'], sonraki: ['merkezTeskilat']
    },
    merkezTeskilat: {
      kod: 'TYT_TAR_12', ad: 'Sultan ve Osmanlı Merkez Teşkilatı', zorluk: Zorluk.ORTA, yuzde: 4,
      kazanimlar: {
        divan: createKazanim('12_01', 'Merkezi İdare', Zorluk.ORTA, 2, [
          'Divan-ı hümayun, vezirlik, defterhane',
          'Sultanın konumu ve taht kavgalarının etkileri'
        ])
      },
      onKosul: ['dunyaGucuOsmanli'], sonraki: ['toplumDuzeniKlasik']
    },
    toplumDuzeniKlasik: {
      kod: 'TYT_TAR_13', ad: 'Klasik Çağda Osmanlı Toplum Düzeni', zorluk: Zorluk.ORTA, yuzde: 4,
      kazanimlar: {
        millet: createKazanim('13_01', 'Toplum ve İktisadi Hayat', Zorluk.ORTA, 2, [
          'Millet sistemi, loncalar, tarım ve ticaret',
          'Şehir örgütlenmesi ve toplumsal katmanlar'
        ])
      },
      onKosul: ['merkezTeskilat'], sonraki: ['degisenDunyaOsmanli']
    },
    degisenDunyaOsmanli: {
      kod: 'TYT_TAR_14', ad: 'Değişen Dünya Dengeleri Karşısında Osmanlı Siyaseti', zorluk: Zorluk.ZOR, yuzde: 4,
      kazanimlar: {
        gerileme: createKazanim('14_01', 'Gerileme ve Islahatlar', Zorluk.ZOR, 2, [
          'Kapitalizm ve Avrupa yükselişi karşısında Osmanlı',
          'Islahat fermânları ve merkezi otorite sorunu'
        ])
      },
      onKosul: ['toplumDuzeniKlasik'], sonraki: ['avrupaOsmanli']
    },
    avrupaOsmanli: {
      kod: 'TYT_TAR_15', ad: 'Değişim Çağında Avrupa ve Osmanlı', zorluk: Zorluk.ZOR, yuzde: 4,
      kazanimlar: {
        aydinlanma: createKazanim('15_01', 'Modernleşme Tartışmaları', Zorluk.ZOR, 2, [
          'Aydınlanma, sanayi ve siyasi düşünce akımları',
          'Osmanlı aydınları ve yenilikçilik hareketleri'
        ])
      },
      onKosul: ['degisenDunyaOsmanli'], sonraki: ['dengeStratejisi']
    },
    dengeStratejisi: {
      kod: 'TYT_TAR_16', ad: 'Uluslararası İlişkilerde Denge Stratejisi (1774–1914)', zorluk: Zorluk.ZOR, yuzde: 5,
      kazanimlar: {
        diplomasi: createKazanim('16_01', 'Diplomasi ve Savaşlar', Zorluk.ZOR, 2, [
          'Nizam-ı cedid’ten Tanzimat’a reformlar',
          'Kırım savaşı, 93 harbi, Balkan sorunu'
        ])
      },
      onKosul: ['avrupaOsmanli'], sonraki: ['devrimlerDevletToplum']
    },
    devrimlerDevletToplum: {
      kod: 'TYT_TAR_17', ad: 'Devrimler Çağında Değişen Devlet–Toplum İlişkileri', zorluk: Zorluk.ZOR, yuzde: 4,
      kazanimlar: {
        mesrutiyet: createKazanim('17_01', 'Meşrutiyet ve Partiler', Zorluk.ZOR, 2, [
          'I. ve II. Meşrutiyet, meclis hayatı',
          'Jön Türkler ve anayasal düşünce'
        ])
      },
      onKosul: ['dengeStratejisi'], sonraki: ['sermayeEmek']
    },
    sermayeEmek: {
      kod: 'TYT_TAR_18', ad: 'Sermaye ve Emek', zorluk: Zorluk.ORTA, yuzde: 4,
      kazanimlar: {
        iktisat: createKazanim('18_01', 'Ekonomik Dönüşüm', Zorluk.ORTA, 2, [
          'Sanayi, demiryolları, bankacılık ve dış borç',
          'Tarımda değişim ve işçi–esnaf dinamikleri'
        ])
      },
      onKosul: ['devrimlerDevletToplum'], sonraki: ['gundelikHayat']
    },
    gundelikHayat: {
      kod: 'TYT_TAR_19', ad: 'XIX. ve XX. Yüzyılda Değişen Gündelik Hayat', zorluk: Zorluk.ORTA, yuzde: 4,
      kazanimlar: {
        sosyal: createKazanim('19_01', 'Kent, Basın, Eğitim', Zorluk.ORTA, 2, [
          'Modernleşen şehir hayatı, okuryazarlık',
          'Matbuat ve yeni yaşam tarzları'
        ])
      },
      onKosul: ['sermayeEmek'], sonraki: ['xxYuzyilBasiOsmanli']
    },
    xxYuzyilBasiOsmanli: {
      kod: 'TYT_TAR_20', ad: 'XX. Yüzyıl Başlarında Osmanlı Devleti ve Dünya', zorluk: Zorluk.ZOR, yuzde: 5,
      kazanimlar: {
        savaslar: createKazanim('20_01', 'Trablusgarp ve Balkan Savaşları', Zorluk.ZOR, 2, [
          'İttihat ve Terakki, savaş ekonomisi',
          'I. Dünya Savaşı ve cepheler'
        ])
      },
      onKosul: ['gundelikHayat'], sonraki: ['milliMucadele']
    },
    milliMucadele: {
      kod: 'TYT_TAR_21', ad: 'Milli Mücadele', zorluk: Zorluk.ZOR, yuzde: 5,
      kazanimlar: {
        kongreler: createKazanim('21_01', 'Kongreler ve Cepheler', Zorluk.ZOR, 2, [
          'Mondros, işgaller, Kuvayımilliye, Büyük Millet Meclisi',
          'Doğu ve Güney cepheleri, Sakarya ve Büyük Taarruz'
        ])
      },
      onKosul: ['xxYuzyilBasiOsmanli'], sonraki: ['ataturkculuk']
    },
    ataturkculuk: {
      kod: 'TYT_TAR_22', ad: 'Atatürkçülük ve Türk İnkılabı', zorluk: Zorluk.ZOR, yuzde: 6,
      kazanimlar: {
        cumhuriyet: createKazanim('22_01', 'Cumhuriyet ve İnkılaplar', Zorluk.ZOR, 2, [
          'Lozan, çok partili denemeler, inkılapların ilke ve amaçları',
          'Atatürk ilkeleri ve çağdaşlaşma süreci'
        ])
      },
      onKosul: ['milliMucadele'], sonraki: []
    }
  },
  kaynaklar: ['MEB Tarih (9–11)', 'Kitapseç TYT tarih konu listesi özeti'],
  tavsiyeler: ['Ünite başlıklarını kronoloji ile eşleştirin', 'Harita ve kavram–olay eşleştirmesi yapın']
};

// ============================================
// TYT Coğrafya (5 soru) — Kitapseç konu başlıkları
// ============================================
const TYT_COG = {
  kod: 'TYT_COG',
  ad: 'TYT Coğrafya',
  soru: 5,
  sure: 30,
  yuzde: 25,
  konular: {
    dogaVeInsan: {
      kod: 'TYT_COG_01', ad: 'Doğa ve İnsan', zorluk: Zorluk.KOLAY, yuzde: 9,
      kazanimlar: {
        cografya: createKazanim('01_01', 'Coğrafyanın Konusu', Zorluk.KOLAY, 2, [
          'Doğal ve beşeri ögeler, çevre–insan etkileşimi',
          'Sürdürülebilirlik ve kaynak kullanımı'
        ])
      },
      onKosul: [], sonraki: ['dunyaSekliHareket']
    },
    dunyaSekliHareket: {
      kod: 'TYT_COG_02', ad: 'Dünya’nın Şekli ve Hareketleri', zorluk: Zorluk.ORTA, yuzde: 5,
      kazanimlar: {
        hareket: createKazanim('02_01', 'Dönme ve Yıllık Hareket', Zorluk.ORTA, 2, [
          'Dünya’nın şekli, eksen eğikliği, mevsimler',
          'Gündönümü ve ekinoks; güneş ışınlarının geliş açısı'
        ])
      },
      onKosul: ['dogaVeInsan'], sonraki: ['cografiKonum']
    },
    cografiKonum: {
      kod: 'TYT_COG_03', ad: 'Coğrafi Konum', zorluk: Zorluk.ORTA, yuzde: 5,
      kazanimlar: {
        konum: createKazanim('03_01', 'Matematik ve Özel Konum', Zorluk.ORTA, 2, [
          'Paralel ve meridyenler, enlem–boylam',
          'Türkiye’nin jeopolitik konumu'
        ])
      },
      onKosul: ['dunyaSekliHareket'], sonraki: ['haritaBilgisi']
    },
    haritaBilgisi: {
      kod: 'TYT_COG_04', ad: 'Harita Bilgisi', zorluk: Zorluk.ORTA, yuzde: 6,
      kazanimlar: {
        harita: createKazanim('04_01', 'Harita Türleri ve Ölçek', Zorluk.ORTA, 2, [
          'Ölçek hesaplama, yükselti ve eğim',
          'İzograf ve profil okuma'
        ])
      },
      onKosul: ['cografiKonum'], sonraki: ['atmosferSicaklik']
    },
    atmosferSicaklik: {
      kod: 'TYT_COG_05', ad: 'Atmosfer ve Sıcaklık', zorluk: Zorluk.ORTA, yuzde: 5,
      kazanimlar: {
        sicaklik: createKazanim('05_01', 'Atmosferin Sıcaklık Dağılışı', Zorluk.ORTA, 2, [
          'Güneşlenme süresi, yükselti etkisi',
          'Albedo ve sıcaklık farklarının nedenleri'
        ])
      },
      onKosul: ['haritaBilgisi'], sonraki: ['iklimler']
    },
    iklimler: {
      kod: 'TYT_COG_06', ad: 'İklimler', zorluk: Zorluk.ZOR, yuzde: 6,
      kazanimlar: {
        iklim: createKazanim('06_01', 'İklim Elemanları ve Kuşaklar', Zorluk.ZOR, 2, [
          'Basınç ve rüzgar sistemleri ile ilişki',
          'Köppen ve Türkiye iklim tipleri özeti'
        ])
      },
      onKosul: ['atmosferSicaklik'], sonraki: ['basincRuzgar']
    },
    basincRuzgar: {
      kod: 'TYT_COG_07', ad: 'Basınç ve Rüzgarlar', zorluk: Zorluk.ORTA, yuzde: 5,
      kazanimlar: {
        ruzgar: createKazanim('07_01', 'Genel Sirkülasyon', Zorluk.ORTA, 2, [
          'Alçak ve yüksek basınç merkezleri',
          'Muson ve geçici rüzgar tipleri'
        ])
      },
      onKosul: ['iklimler'], sonraki: ['nemYagisBuharlasma']
    },
    nemYagisBuharlasma: {
      kod: 'TYT_COG_08', ad: 'Nem, Yağış ve Buharlaşma', zorluk: Zorluk.ORTA, yuzde: 5,
      kazanimlar: {
        yagis: createKazanim('08_01', 'Nemlilik ve Yağış Türleri', Zorluk.ORTA, 2, [
          'Bağıl nem, yoğuşma, yağış rejimi',
          'Buharlaşma ve yeraltı suyu ilişkisi'
        ])
      },
      onKosul: ['basincRuzgar'], sonraki: ['icDisKuvvetler']
    },
    icDisKuvvetler: {
      kod: 'TYT_COG_09', ad: 'İç Kuvvetler / Dış Kuvvetler', zorluk: Zorluk.ZOR, yuzde: 5,
      kazanimlar: {
        levha: createKazanim('09_01', 'Relief Oluşumu', Zorluk.ZOR, 2, [
          'Volkanizma, deprem, orojenez',
          'Aşındırma, taşınma, birikim şekilleri'
        ])
      },
      onKosul: ['nemYagisBuharlasma'], sonraki: ['suToprakBitki']
    },
    suToprakBitki: {
      kod: 'TYT_COG_10', ad: 'Su – Toprak ve Bitkiler', zorluk: Zorluk.ZOR, yuzde: 5,
      kazanimlar: {
        hidro: createKazanim('10_01', 'Su Kaynakları ve Toprak', Zorluk.ZOR, 2, [
          'Akarsu rejimi, göller, yeraltı suyu',
          'Toprak tipleri ve bitki örtüsü ilişkisi'
        ])
      },
      onKosul: ['icDisKuvvetler'], sonraki: ['nufus']
    },
    nufus: {
      kod: 'TYT_COG_11', ad: 'Nüfus', zorluk: Zorluk.ORTA, yuzde: 5,
      kazanimlar: {
        nufus: createKazanim('11_01', 'Nüfus Özellikleri', Zorluk.ORTA, 2, [
          'Nüfus piramidi, doğum–ölüm, göç',
          'Türkiye nüfusunun dağılışı'
        ])
      },
      onKosul: ['suToprakBitki'], sonraki: ['goc']
    },
    goc: {
      kod: 'TYT_COG_12', ad: 'Göç', zorluk: Zorluk.ORTA, yuzde: 5,
      kazanimlar: {
        goc: createKazanim('12_01', 'Göç Türleri ve Nedenleri', Zorluk.ORTA, 2, [
          'İç ve dış göç, push–pull faktörleri',
          'Göçün sosyoekonomik sonuçları'
        ])
      },
      onKosul: ['nufus'], sonraki: ['yerlesme']
    },
    yerlesme: {
      kod: 'TYT_COG_13', ad: 'Yerleşme', zorluk: Zorluk.ORTA, yuzde: 5,
      kazanimlar: {
        yerlesme: createKazanim('13_01', 'Yerleşme Düzeni', Zorluk.ORTA, 2, [
          'Kırsal–kentsel farklar, fonksiyonel bölgeler',
          'Türkiye’de şehirleşme'
        ])
      },
      onKosul: ['goc'], sonraki: ['turkiyeYerSekilleri']
    },
    turkiyeYerSekilleri: {
      kod: 'TYT_COG_14', ad: 'Türkiye’nin Yer Şekilleri', zorluk: Zorluk.ZOR, yuzde: 5,
      kazanimlar: {
        bolgelerFiziki: createKazanim('14_01', 'Bölgesel Fiziki Coğrafya', Zorluk.ZOR, 2, [
          'Dağlar, ovalar, platolar; kıyı tipleri',
          'Deprem ve volkan riski'
        ])
      },
      onKosul: ['yerlesme'], sonraki: ['ekonomikFaaliyetler']
    },
    ekonomikFaaliyetler: {
      kod: 'TYT_COG_15', ad: 'Ekonomik Faaliyetler', zorluk: Zorluk.ORTA, yuzde: 5,
      kazanimlar: {
        sektor: createKazanim('15_01', 'Birincil ve İkincil Faaliyetler', Zorluk.ORTA, 2, [
          'Tarım, hayvancılık, madencilik, sanayi',
          'Enerji kaynakları ve üretim dağılışı'
        ])
      },
      onKosul: ['turkiyeYerSekilleri'], sonraki: ['bolgeler']
    },
    bolgeler: {
      kod: 'TYT_COG_16', ad: 'Bölgeler', zorluk: Zorluk.ZOR, yuzde: 5,
      kazanimlar: {
        istatistik: createKazanim('16_01', 'İstatistiki Bölgeler', Zorluk.ZOR, 2, [
          'Türkiye’nin bölgelerinin ekonomik ve sosyal özellikleri',
          'Bölgesel kalkınma farkları'
        ])
      },
      onKosul: ['ekonomikFaaliyetler'], sonraki: ['uluslararasiUlasim']
    },
    uluslararasiUlasim: {
      kod: 'TYT_COG_17', ad: 'Uluslararası Ulaşım Hatları', zorluk: Zorluk.ORTA, yuzde: 4,
      kazanimlar: {
        ulasim: createKazanim('17_01', 'Kara, Deniz, Hava ve Boru Hatları', Zorluk.ORTA, 2, [
          'Boğazlar ve ticaret yolları',
          'Lojistik ve küresel ticaret akışları'
        ])
      },
      onKosul: ['bolgeler'], sonraki: ['cevreToplumAfet']
    },
    cevreToplumAfet: {
      kod: 'TYT_COG_18', ad: 'Çevre ve Toplum / Doğal Afetler', zorluk: Zorluk.ZOR, yuzde: 10,
      kazanimlar: {
        cevre: createKazanim('18_01', 'Çevre Sorunları', Zorluk.ZOR, 2, [
          'Küresel ısınma, kuraklık, kirlilik',
          'Deprem, sel, heyelan risk yönetimi'
        ])
      },
      onKosul: ['uluslararasiUlasim'], sonraki: []
    }
  },
  kaynaklar: ['MEB Coğrafya (9–11)', 'Kitapseç TYT coğrafya konu listesi özeti'],
  tavsiyeler: ['Harita ve iklim grafikleri üzerinden tekrar yapın', 'Türkiye fiziki–beşeri bağlantılarını kurun']
};

// ============================================
// TYT Felsefe (5 soru) — Kitapseç konu başlıkları
// ============================================
const TYT_FELSEFE = {
  kod: 'TYT_FEL',
  ad: 'TYT Felsefe',
  soru: 5,
  sure: 30,
  yuzde: 25,
  konular: {
    felsefeninKonusu: {
      kod: 'TYT_FEL_01', ad: 'Felsefe’nin Konusu', zorluk: Zorluk.ORTA, yuzde: 8,
      kazanimlar: {
        tanim: createKazanim('01_01', 'Felsefi Soru ve Yöntem', Zorluk.KOLAY, 2, [
          'Felsefenin ortaya çıkışı, felsefi düşünme özellikleri',
          'Kavram analizi, argümantasyon, eleştirel düşünme'
        ]),
        dallar: createKazanim('01_02', 'Felsefe Dalları', Zorluk.ORTA, 2, [
          'Metafizik, epistemoloji, etik, estetik, siyaset felsefesi ve mantık'
        ])
      },
      onKosul: [], sonraki: ['bilgiFelsefesi']
    },
    bilgiFelsefesi: {
      kod: 'TYT_FEL_02', ad: 'Bilgi Felsefesi', zorluk: Zorluk.ZOR, yuzde: 8,
      kazanimlar: {
        epistemoloji: createKazanim('02_01', 'Bilginin Kaynağı ve Güvenirliği', Zorluk.ZOR, 2, [
          'Rasyonalizm, ampirisizm, eleştiri',
          'Doğruluk, kanıt ve bilimsel yöntem tartışmaları'
        ])
      },
      onKosul: ['felsefeninKonusu'], sonraki: ['varlikFelsefesi']
    },
    varlikFelsefesi: {
      kod: 'TYT_FEL_03', ad: 'Varlık Felsefesi', zorluk: Zorluk.ZOR, yuzde: 8,
      kazanimlar: {
        ontoloji: createKazanim('03_01', 'Varlığın Mahiyeti', Zorluk.ZOR, 2, [
          'Madde–öz, nedensellik, özgür irade',
          'İdealizm, materyalizm, dualizm karşılaştırması'
        ])
      },
      onKosul: ['bilgiFelsefesi'], sonraki: ['ahlakFelsefesi']
    },
    ahlakFelsefesi: {
      kod: 'TYT_FEL_04', ad: 'Ahlak Felsefesi', zorluk: Zorluk.ORTA, yuzde: 8,
      kazanimlar: {
        etik: createKazanim('04_01', 'İyi ve Kötü', Zorluk.ORTA, 2, [
          'Ödev ahlakı, sonuç ahlakı, erdem etiği',
          'Evrenselcilik–görecilik tartışması'
        ])
      },
      onKosul: ['varlikFelsefesi'], sonraki: ['sanatFelsefesi']
    },
    sanatFelsefesi: {
      kod: 'TYT_FEL_05', ad: 'Sanat Felsefesi', zorluk: Zorluk.ORTA, yuzde: 8,
      kazanimlar: {
        estetik: createKazanim('05_01', 'Güzel ve Sanat', Zorluk.ORTA, 2, [
          'Estetik değer, taklit ve yaratıcılık',
          'Sanat eserinin öznesi ve yorumu'
        ])
      },
      onKosul: ['ahlakFelsefesi'], sonraki: ['dinFelsefesi']
    },
    dinFelsefesi: {
      kod: 'TYT_FEL_06', ad: 'Din Felsefesi', zorluk: Zorluk.ZOR, yuzde: 8,
      kazanimlar: {
        din: createKazanim('06_01', 'Din ve Felsefe İlişkisi', Zorluk.ZOR, 2, [
          'Tanrı’nın varlığı tartışmaları (ontolojik, kozmolojik, ahlaki)',
          'Ateizm, agnostisizm ve din felsefesi sorunsalı'
        ])
      },
      onKosul: ['sanatFelsefesi'], sonraki: ['siyasetFelsefesi']
    },
    siyasetFelsefesi: {
      kod: 'TYT_FEL_07', ad: 'Siyaset Felsefesi', zorluk: Zorluk.ZOR, yuzde: 8,
      kazanimlar: {
        siyaset: createKazanim('07_01', 'Devlet, İktidar, Adalet', Zorluk.ZOR, 2, [
          'Sözleşme teorileri, meşruiyet, insan hakları',
          'Demokrasi, özgürlük ve eşitlik kavramları'
        ])
      },
      onKosul: ['dinFelsefesi'], sonraki: ['bilimFelsefesi']
    },
    bilimFelsefesi: {
      kod: 'TYT_FEL_08', ad: 'Bilim Felsefesi', zorluk: Zorluk.ZOR, yuzde: 8,
      kazanimlar: {
        bilim: createKazanim('08_01', 'Bilimsel Açıklama ve Paradigma', Zorluk.ZOR, 2, [
          'Bilimsel yöntem, hipotez ve teoriler',
          'Popper, Kuhn çerçevesinde bilim felsefesi (temel düzey)'
        ])
      },
      onKosul: ['siyasetFelsefesi'], sonraki: ['ilkCagFelsefesi']
    },
    ilkCagFelsefesi: {
      kod: 'TYT_FEL_09', ad: 'İlk Çağ Felsefesi', zorluk: Zorluk.ORTA, yuzde: 8,
      kazanimlar: {
        doga: createKazanim('09_01', 'Doğa Filozofları ve Sofistler', Zorluk.ORTA, 2, [
          'Thales’ten öncesi doğa soruları, çokluk ve birlik',
          'Sofistler ve ahlaki görecilik tartışması'
        ])
      },
      onKosul: ['bilimFelsefesi'], sonraki: ['felsefe2ve15yy']
    },
    felsefe2ve15yy: {
      kod: 'TYT_FEL_10', ad: '2. Yüzyıl ve 15. Yüzyıl Felsefeleri', zorluk: Zorluk.ZOR, yuzde: 7,
      kazanimlar: {
        skolastik: createKazanim('10_01', 'Hıristiyan Skolastiği ve İslam Felsefesi', Zorluk.ZOR, 2, [
          'Skolastik düşünce, rasyonalite ve vahiy ilişkisi',
          'Kindi, Farabi, İbn Sina hattında bilgi ve varlık'
        ])
      },
      onKosul: ['ilkCagFelsefesi'], sonraki: ['felsefe15ve17yy']
    },
    felsefe15ve17yy: {
      kod: 'TYT_FEL_11', ad: '15. Yüzyıl ve 17. Yüzyıl Felsefeleri', zorluk: Zorluk.ZOR, yuzde: 7,
      kazanimlar: {
        modern: createKazanim('11_01', 'Rönesans ve Erken Modern Felsefe', Zorluk.ZOR, 2, [
          'Descartes, Spinoza, Leibniz: akıl, tanrı ve doğa',
          'Empirizm ve rasyonalizm karşıtlığı'
        ])
      },
      onKosul: ['felsefe2ve15yy'], sonraki: ['felsefe18ve19yy']
    },
    felsefe18ve19yy: {
      kod: 'TYT_FEL_12', ad: '18. Yüzyıl ve 19. Yüzyıl Felsefeleri', zorluk: Zorluk.ZOR, yuzde: 7,
      kazanimlar: {
        aydinlanma: createKazanim('12_01', 'Aydınlanma ve Alman İdealizmi', Zorluk.ZOR, 2, [
          'Kant ve eleştiri felsefesi',
          'Hegel ve tarih felsefesi (öz özne)'
        ])
      },
      onKosul: ['felsefe15ve17yy'], sonraki: ['felsefe20yy']
    },
    felsefe20yy: {
      kod: 'TYT_FEL_13', ad: '20. Yüzyıl Felsefesi', zorluk: Zorluk.COK_ZOR, yuzde: 7,
      kazanimlar: {
        cagdas: createKazanim('13_01', 'Çağdaş Akımlar', Zorluk.COK_ZOR, 2, [
          'Fenomenoloji, varoluşçuluk, yapısalcılık (özet)',
          'Postmodernizm ve felsefede dil dönüşümü (temel)'
        ])
      },
      onKosul: ['felsefe18ve19yy'], sonraki: []
    }
  },
  kaynaklar: ['MEB Felsefe (10–12)', 'Kitapseç TYT felsefe konu listesi özeti'],
  tavsiyeler: ['Kavram–düşünür eşleştirmesi yapın', 'Metin tabanlı çıkmış soruları kavram okumasını güçlendirir']
};

// ============================================
// TYT Din Kültürü ve Ahlak Bilgisi (5 soru) — Kitapseç konu başlıkları
// ============================================
const TYT_DIN = {
  kod: 'TYT_DIN',
  ad: 'TYT Din Kültürü ve Ahlak Bilgisi',
  soru: 5,
  sure: 30,
  yuzde: 25,
  konular: {
    bilgiInanc: {
      kod: 'TYT_DIN_01', ad: 'Bilgi ve İnanç', zorluk: Zorluk.ORTA, yuzde: 11,
      kazanimlar: {
        iman: createKazanim('01_01', 'İman Esasları ve Kaynaklar', Zorluk.ORTA, 2, [
          'İmanın anlamı, Kur’an ve sünnetle ilişki',
          'Akıl–nakil dengesi ve dinî bilgi'
        ])
      },
      onKosul: [], sonraki: ['islamIbadet']
    },
    islamIbadet: {
      kod: 'TYT_DIN_02', ad: 'İslam ve İbadet', zorluk: Zorluk.ORTA, yuzde: 11,
      kazanimlar: {
        ibadet: createKazanim('02_01', 'İbadetlerin Anlamı', Zorluk.ORTA, 2, [
          'Namaz, oruç, zekât, hac: hikmet ve toplumsal boyut',
          'İbadet–ahlak ilişkisi'
        ])
      },
      onKosul: ['bilgiInanc'], sonraki: ['ahlakDegerler']
    },
    ahlakDegerler: {
      kod: 'TYT_DIN_03', ad: 'Ahlak ve Değerler', zorluk: Zorluk.ORTA, yuzde: 10,
      kazanimlar: {
        ahlak: createKazanim('03_01', 'İslam Ahlakı', Zorluk.ORTA, 2, [
          'Güzel ahlak, özdenetim, komşu hakları',
          'Günümüz ahlaki meselelere dinî perspektif'
        ])
      },
      onKosul: ['islamIbadet'], sonraki: ['allahInsan']
    },
    allahInsan: {
      kod: 'TYT_DIN_04', ad: 'Allah–İnsan İlişkisi', zorluk: Zorluk.ZOR, yuzde: 10,
      kazanimlar: {
        rububiyet: createKazanim('04_01', 'Rububiyet, Uluhiyet, Esma-i Hüsna', Zorluk.ZOR, 2, [
          'Kul–Rabb ilişkisi, dua ve tevekkül',
          'İnsanın yaratılış amacı ve özgürlük sorumluluğu'
        ])
      },
      onKosul: ['ahlakDegerler'], sonraki: ['hzMuhammed']
    },
    hzMuhammed: {
      kod: 'TYT_DIN_05', ad: 'Hz. Muhammed (S.A.V.)', zorluk: Zorluk.ORTA, yuzde: 10,
      kazanimlar: {
        sirah: createKazanim('05_01', 'Hayatı ve Öğretileri', Zorluk.ORTA, 2, [
          'Mekke–Medine dönemi, örnek şahsiyet',
          'Hadis ve sünnetin yeri'
        ])
      },
      onKosul: ['allahInsan'], sonraki: ['vahiyAkil']
    },
    vahiyAkil: {
      kod: 'TYT_DIN_06', ad: 'Vahiy ve Akıl', zorluk: Zorluk.ZOR, yuzde: 10,
      kazanimlar: {
        tevil: createKazanim('06_01', 'Vahiy, Akıl ve Yorum', Zorluk.ZOR, 2, [
          'Kur’an’ın anlaşılması, tefsir ve tevil sınırları',
          'İctihad ve fıkıh usulüne giriş (temel)'
        ])
      },
      onKosul: ['hzMuhammed'], sonraki: ['mezhepler']
    },
    mezhepler: {
      kod: 'TYT_DIN_07', ad: 'İslam Düşüncesinde Yorumlar, Mezhepler', zorluk: Zorluk.ZOR, yuzde: 9,
      kazanimlar: {
        mezhep: createKazanim('07_01', 'Mezhepler ve İtikadi Görüşler', Zorluk.ZOR, 2, [
          'Fıkıh ve kelâm mezhepleri; ittifak ve ihtilaf',
          'İtikad esasları ve Ehl-i sünnet çizgisi'
        ])
      },
      onKosul: ['vahiyAkil'], sonraki: ['dinKulturMedeniyet']
    },
    dinKulturMedeniyet: {
      kod: 'TYT_DIN_08', ad: 'Din, Kültür ve Medeniyet', zorluk: Zorluk.ORTA, yuzde: 10,
      kazanimlar: {
        medeniyet: createKazanim('08_01', 'İslam Medeniyeti', Zorluk.ORTA, 2, [
          'Din–kültür etkileşimi, hoşgörü ve müşterek değerler',
          'Sanat, mimari ve günlük hayatta din'
        ])
      },
      onKosul: ['mezhepler'], sonraki: ['islamBilimEstetikBaris']
    },
    islamBilimEstetikBaris: {
      kod: 'TYT_DIN_09', ad: 'İslam ve Bilim, Estetik, Barış', zorluk: Zorluk.ORTA, yuzde: 10,
      kazanimlar: {
        bilim: createKazanim('09_01', 'Bilim ve Estetik', Zorluk.ORTA, 2, [
          'İslam’da bilim anlayışı, araştırma etiği',
          'Sanatta güzellik ve tezhip–hat gibi örnekler'
        ]),
        baris: createKazanim('09_02', 'Barış ve Adalet', Zorluk.ORTA, 2, [
          'Savaş ve barış, hak ve adalet ilkeleri',
          'Güncel meselelerde dinî perspektif'
        ])
      },
      onKosul: ['dinKulturMedeniyet'], sonraki: ['yasayanDinler']
    },
    yasayanDinler: {
      kod: 'TYT_DIN_10', ad: 'Yaşayan Dinler', zorluk: Zorluk.ORTA, yuzde: 9,
      kazanimlar: {
        dinler: createKazanim('10_01', 'Dünya Dinleri', Zorluk.ORTA, 2, [
          'Hristiyanlık, Yahudilik ve diğer inançlar (temel bilgi)',
          'Ortak değerler ve diyalog kültürü'
        ])
      },
      onKosul: ['islamBilimEstetikBaris'], sonraki: []
    }
  },
  kaynaklar: ['MEB Din Kültürü ve Ahlak Bilgisi (9–12)', 'Kitapseç TYT DKAB konu listesi özeti'],
  tavsiyeler: ['Kur’an–sünnet–ictihat ilişkisini şema ile özetleyin', 'İbadet ve ahlak konularında örnek vaka okuyun']
};

// TYT Matematik: 40 soru — konu sırası yaygın TYT ders işleyişine göre (geometri ayrı TYT Geometri testindedir)
const TYT_MAT = {
  kod: 'TYT_MAT',
  ad: 'TYT Matematik',
  soru: 40,
  yuzde: 32,
  sure: 60,
  konular: {
    temelKavramlar: {
      kod: 'TYT_MAT_01', ad: 'Temel Kavramlar', zorluk: Zorluk.KOLAY, yuzde: 3,
      kazanimlar: {
        sayiKumeleri: createKazanim('01_01', 'Sayı Kümeleri', Zorluk.KOLAY, 2, [
          'Doğal sayılar (ℕ), tam sayılar (ℤ), rasyonel sayılar (ℚ), gerçek sayı (ℝ) fikri',
          'Sayı doğrusu üzerinde gösterim ve sıralama',
          'Aralık gösterimi ve basit birleşim/kesişim'
        ]),
        dortIslem: createKazanim('01_02', 'Temel İşlem Özellikleri', Zorluk.KOLAY, 2, [
          'Toplama ve çarpmanın değişme, birleşme, etkisiz eleman özellikleri',
          'Çarpma üzerinden toplamanın dağılması',
          'Kesir ve ondalıkla işlem kuralları (özet)'
        ])
      },
      onKosul: [], sonraki: ['sayiBasamaklari']
    },
    sayiBasamaklari: {
      kod: 'TYT_MAT_02', ad: 'Sayı Basamakları', zorluk: Zorluk.ORTA, yuzde: 3,
      kazanimlar: {
        cozumleme: createKazanim('02_01', 'Basamak Çözümlemesi', Zorluk.ORTA, 2, [
          'İki veya daha çok basamaklı doğal sayıyı basamak değerleriyle yazma',
          'ab, abc gibi soyut sayılarda rakam toplamı ve sayı değeri ilişkisi'
        ]),
        problemler: createKazanim('02_02', 'Basamak ve Rakam Problemleri', Zorluk.ZOR, 2, [
          'Rakamlar yer değiştirirse sayının değişimi',
          'Basamak toplamı ve çarpımına dayalı denklemler'
        ])
      },
      onKosul: ['temelKavramlar'], sonraki: ['bolmeBolunebilme']
    },
    bolmeBolunebilme: {
      kod: 'TYT_MAT_03', ad: 'Bölme ve Bölünebilme', zorluk: Zorluk.ORTA, yuzde: 3,
      kazanimlar: {
        bolme: createKazanim('03_01', 'Bölme Algoritması ve Kalan', Zorluk.ORTA, 2, [
          'Euclidean bölme: bölüm, kalan, bölünebilme ilişkisi (a = b·q + r)',
          'Kalanın özellikleri ve modüler düşünme (basit)'
        ]),
        kurallar: createKazanim('03_02', 'Bölünebilme Kuralları', Zorluk.ORTA, 2, [
          '2, 3, 4, 5, 6, 8, 9, 10, 11 ile bölünebilme',
          'Asal çarpanlara ayırma ve pozitif tam bölen sayısı'
        ])
      },
      onKosul: ['sayiBasamaklari'], sonraki: ['ebobEkok']
    },
    ebobEkok: {
      kod: 'TYT_MAT_04', ad: 'EBOB – EKOK', zorluk: Zorluk.ORTA, yuzde: 3,
      kazanimlar: {
        tanim: createKazanim('04_01', 'EBOB ve EKOK Tanımı', Zorluk.ORTA, 2, [
          'En büyük ortak bölen (EBOB) ve en küçük ortak kat (EKOK)',
          'Asal çarpanlara ayırma yöntemi ile EBOB–EKOK bulma'
        ]),
        ozellik: createKazanim('04_02', 'Özellikler ve Problemler', Zorluk.ZOR, 2, [
          'EBOB(a,b)·EKOK(a,b) = a·b (aralarında asal özelinde EKOK)',
          'Periyot, eşzamanlı olay ve ortak bölünme problemleri'
        ])
      },
      onKosul: ['bolmeBolunebilme'], sonraki: ['rasyonelSayilar']
    },
    rasyonelSayilar: {
      kod: 'TYT_MAT_05', ad: 'Rasyonel Sayılar', zorluk: Zorluk.ORTA, yuzde: 3,
      kazanimlar: {
        kesir: createKazanim('05_01', 'Kesir İşlemleri', Zorluk.ORTA, 2, [
          'Genişletme ve sadeleştirme, payda eşitleme',
          'Karşılaştırma ve sıralama (ortak payda veya ondalık)'
        ]),
        dortIslem: createKazanim('05_02', 'Dört İşlem ve Ondalık', Zorluk.ORTA, 2, [
          'Rasyonel sayılarla toplama, çıkarma, çarpma, bölme',
          'Ondalık gösterim ve paydada sadeleştirme',
          'Paydası sıfır olan ifadelerde tanımsızlık'
        ])
      },
      onKosul: ['ebobEkok'], sonraki: ['basitEsitsizlikler']
    },
    basitEsitsizlikler: {
      kod: 'TYT_MAT_06', ad: 'Basit Eşitsizlikler', zorluk: Zorluk.ORTA, yuzde: 3,
      kazanimlar: {
        birinci: createKazanim('06_01', 'Birinci Derece Eşitsizlik', Zorluk.ORTA, 2, [
          'Eşitsizlikte işlem kuralları (negatif çarpımda yön değişimi)',
          'Birinci derece eşitsizlik sistemleri ve sayı doğrusunda çözüm'
        ]),
        mutlakBasit: createKazanim('06_02', 'Basit Mutlak Değerli Eşitsizlik', Zorluk.ZOR, 2, [
          '|x|<a ve |x|>a tipi temel çözüm (a>0)',
          'Birleşim ve kesişim ile çözüm kümesi'
        ])
      },
      onKosul: ['rasyonelSayilar'], sonraki: ['mutlakDeger']
    },
    mutlakDeger: {
      kod: 'TYT_MAT_07', ad: 'Mutlak Değer', zorluk: Zorluk.ZOR, yuzde: 3,
      kazanimlar: {
        tanim: createKazanim('07_01', 'Tanım ve Özellikler', Zorluk.ORTA, 2, [
          '|x| tanımı, geometrik olarak uzaklık yorumu',
          '|x| = |-x|, |x·y| = |x|·|y|, |x|/|y| = |x/y| (y≠0)'
        ]),
        denklem: createKazanim('07_02', 'Mutlak Değerli Denklem ve Eşitsizlik', Zorluk.ZOR, 2, [
          '|x-a| = b tipi çözüm, kritik noktalara göre inceleme',
          'İç içe ve toplam mutlak değer (TYT seviyesinde)'
        ])
      },
      onKosul: ['basitEsitsizlikler'], sonraki: ['usluSayilar']
    },
    usluSayilar: {
      kod: 'TYT_MAT_08', ad: 'Üslü Sayılar', zorluk: Zorluk.ZOR, yuzde: 4,
      kazanimlar: {
        kurallar: createKazanim('08_01', 'Üs Kuralları', Zorluk.ORTA, 2, [
          'aⁿ·aᵐ, (aⁿ)ᵐ, (ab)ⁿ, (a/b)ⁿ kuralları',
          'Negatif ve sıfır üs; üssün üssü'
        ]),
        bilinmeyen: createKazanim('08_02', 'Üstel Denklemler', Zorluk.ZOR, 2, [
          'Taban eşitleme, ortak çarpan çıkarma',
          'Üstel fonksiyonun grafik fikri (artış/azalış)'
        ])
      },
      onKosul: ['mutlakDeger'], sonraki: ['kokluSayilar']
    },
    kokluSayilar: {
      kod: 'TYT_MAT_09', ad: 'Köklü Sayılar', zorluk: Zorluk.ZOR, yuzde: 4,
      kazanimlar: {
        kok: createKazanim('09_01', 'Kök Özellikleri ve Sadeleştirme', Zorluk.ORTA, 2, [
          '√a·√b = √(ab), √a/√b = √(a/b) (tanım kümesine dikkat)',
          'Kök dışına çıkarma ve kök içi çarpan ayırma'
        ]),
        usluKok: createKazanim('09_02', 'Üslü ve Köklü Birlikte', Zorluk.ZOR, 2, [
          'a^(1/n) ile kök ilişkisi',
          'Eşlenik çarpım ile paydadaki kökten kurtulma'
        ])
      },
      onKosul: ['usluSayilar'], sonraki: ['carpanlaraAyirma']
    },
    carpanlaraAyirma: {
      kod: 'TYT_MAT_10', ad: 'Çarpanlara Ayırma', zorluk: Zorluk.ZOR, yuzde: 4,
      kazanimlar: {
        temel: createKazanim('10_01', 'Temel Yöntemler', Zorluk.ORTA, 2, [
          'Ortak çarpan parantezine alma ve gruplandırma',
          'Özdeşlikler: iki kare farkı, tam kare, iki terim toplamı/küpü (temel)'
        ]),
        ikinci: createKazanim('10_02', 'İkinci Derece Üç Terimli', Zorluk.ZOR, 2, [
          'ax²+bx+c için çapraz çarpım (a,b,c tam sayı)',
          'Rasyonel ifadelerde sadeleştirme ve tanım kümesi'
        ])
      },
      onKosul: ['kokluSayilar'], sonraki: ['oranOranti']
    },
    oranOranti: {
      kod: 'TYT_MAT_11', ad: 'Oran Orantı', zorluk: Zorluk.ORTA, yuzde: 3,
      kazanimlar: {
        oran: createKazanim('11_01', 'Oran ve Birimli Oran', Zorluk.KOLAY, 2, [
          'İki nicelik arasında oran; birimleri sadeleştirme',
          'Orantı sabiti ve doğru orantı grafiği fikri'
        ]),
        oranti: createKazanim('11_02', 'Doğru ve Ters Orantı', Zorluk.ORTA, 2, [
          'y = kx ve y = k/x tipi ilişkiler',
          'Çoklu orantı ve ölçekleme problemleri'
        ])
      },
      onKosul: ['carpanlaraAyirma'], sonraki: ['denklemCozme']
    },
    denklemCozme: {
      kod: 'TYT_MAT_12', ad: 'Denklem Çözme', zorluk: Zorluk.ZOR, yuzde: 4,
      kazanimlar: {
        birinci: createKazanim('12_01', 'Birinci Derece Denklemler', Zorluk.ORTA, 2, [
          'Tek bilinmeyenli doğrusal denklemler ve denklem sistemleri (yerine koyma, yok etme)',
          'Paydalı ve parantezli denklemlerde tanımsızlık'
        ]),
        ikinci: createKazanim('12_02', 'İkinci Derece Denklemler (TYT)', Zorluk.ZOR, 2, [
          'Diskriminant, köklerin toplamı ve çarpımı',
          'Çarpanlara ayırma veya tam kare ile çözüm'
        ])
      },
      onKosul: ['oranOranti'], sonraki: ['problemlerGenel']
    },
    problemlerGenel: {
      kod: 'TYT_MAT_13', ad: 'Problemler', zorluk: Zorluk.ORTA, yuzde: 3,
      kazanimlar: {
        modelleme: createKazanim('13_01', 'Problem Çözme Stratejileri', Zorluk.ORTA, 2, [
          'Veriyi matematik diline çevirme (bilinm seçimi)',
          'Geri doğrulama ve birim tutarlılığı',
          'Şekil–tablo ile organize etme'
        ])
      },
      onKosul: ['denklemCozme'], sonraki: ['sayiProblemleri']
    },
    sayiProblemleri: {
      kod: 'TYT_MAT_14', ad: 'Sayı Problemleri', zorluk: Zorluk.ORTA, yuzde: 3,
      kazanimlar: {
        iki: createKazanim('14_01', 'İki veya Üç Sayı', Zorluk.ORTA, 2, [
          'Aralarındaki ilişki verilen sayıları bulma',
          'Tek/çift, ardışık, basamak kısıtı içeren sayı soruları'
        ])
      },
      onKosul: ['problemlerGenel'], sonraki: ['kesirProblemleri']
    },
    kesirProblemleri: {
      kod: 'TYT_MAT_15', ad: 'Kesir Problemleri', zorluk: Zorluk.ORTA, yuzde: 2,
      kazanimlar: {
        pay: createKazanim('15_01', 'Kesirle İfade Edilen Miktarlar', Zorluk.ORTA, 2, [
          'Bütünün kesir kadarını ve kesrin bütününü bulma',
          'Art arda kesir alma ve kalan kesir problemleri'
        ])
      },
      onKosul: ['sayiProblemleri'], sonraki: ['yasProblemleri']
    },
    yasProblemleri: {
      kod: 'TYT_MAT_16', ad: 'Yaş Problemleri', zorluk: Zorluk.ORTA, yuzde: 3,
      kazanimlar: {
        fark: createKazanim('16_01', 'Yaş Farkı ve Zaman', Zorluk.ORTA, 2, [
          'Yaş farkının sabit kalması; geçmiş/gelecek yaş ilişkisi',
          'Baba–çocuk, kardeş yaş ortalamaları'
        ])
      },
      onKosul: ['kesirProblemleri'], sonraki: ['hareketProblemleri']
    },
    hareketProblemleri: {
      kod: 'TYT_MAT_17', ad: 'Hareket Hız Problemleri', zorluk: Zorluk.ZOR, yuzde: 3,
      kazanimlar: {
        temel: createKazanim('17_01', 'Yol, Hız, Zaman', Zorluk.ORTA, 2, [
          's = v·t ilişkisi ve birim uyumu',
          'Karşı yönde gelenlerde göreli hız (temel)'
        ]),
        ortalama: createKazanim('17_02', 'Ortalama Hız ve Bekleme', Zorluk.ZOR, 2, [
          'Farklı hızlarda parça parça yol ve ortalama hız',
          'Durmak ve gecikme içeren problemler'
        ])
      },
      onKosul: ['yasProblemleri'], sonraki: ['isciProblemleri']
    },
    isciProblemleri: {
      kod: 'TYT_MAT_18', ad: 'İşçi Emek Problemleri', zorluk: Zorluk.ORTA, yuzde: 3,
      kazanimlar: {
        is: createKazanim('18_01', 'İş ve Süre', Zorluk.ORTA, 2, [
          'Birim zamanda iş; birden fazla işçinin birlikte çalışması',
          'İşin bırakılması ve devretme'
        ])
      },
      onKosul: ['hareketProblemleri'], sonraki: ['yuzdeProblemleri']
    },
    yuzdeProblemleri: {
      kod: 'TYT_MAT_19', ad: 'Yüzde Problemleri', zorluk: Zorluk.ORTA, yuzde: 3,
      kazanimlar: {
        hesap: createKazanim('19_01', 'Yüzde Artış ve Azalış', Zorluk.ORTA, 2, [
          'Bir sayının yüzde kaçı; yüzde kaç fazlası/eksisi',
          'Üst üste yüzde değişimi ve çarpan gösterimi'
        ])
      },
      onKosul: ['isciProblemleri'], sonraki: ['karZararProblemleri']
    },
    karZararProblemleri: {
      kod: 'TYT_MAT_20', ad: 'Kar Zarar Problemleri', zorluk: Zorluk.ORTA, yuzde: 3,
      kazanimlar: {
        maliyet: createKazanim('20_01', 'Maliyet, Satış, Kar', Zorluk.ORTA, 2, [
          'Alış–satış fiyatı, kar yüzdesi ve zarar',
          'İskonto ve zam içeren zincir problemler'
        ])
      },
      onKosul: ['yuzdeProblemleri'], sonraki: ['karisimProblemleri']
    },
    karisimProblemleri: {
      kod: 'TYT_MAT_21', ad: 'Karışım Problemleri', zorluk: Zorluk.ZOR, yuzde: 3,
      kazanimlar: {
        konsantrasyon: createKazanim('21_01', 'Karışım ve Yoğunluk', Zorluk.ZOR, 2, [
          'Tuzlu su, alkol–su karışımları; yoğunluk ve kütle',
          'Karıştırma ve seyreltme ile yüzde değişimi'
        ])
      },
      onKosul: ['karZararProblemleri'], sonraki: ['grafikProblemleri']
    },
    grafikProblemleri: {
      kod: 'TYT_MAT_22', ad: 'Grafik Problemleri', zorluk: Zorluk.ZOR, yuzde: 2,
      kazanimlar: {
        okuma: createKazanim('22_01', 'Grafik ve Tablodan Çıkarım', Zorluk.ORTA, 2, [
          'Çizgi, sütun, pasta grafiklerinden veri okuma',
          'Eğim ve artış/azalış yorumu (doğrusal bölümler)'
        ])
      },
      onKosul: ['karisimProblemleri'], sonraki: ['rutinOlmayanProblemler']
    },
    rutinOlmayanProblemler: {
      kod: 'TYT_MAT_23', ad: 'Rutin Olmayan Problemler', zorluk: Zorluk.COK_ZOR, yuzde: 2,
      kazanimlar: {
        strateji: createKazanim('23_01', 'Yaratıcı ve Çok Adımlı Çözüm', Zorluk.COK_ZOR, 2, [
          'Verilenleri sadeleştirme, tersine düşünme, örnek deneme',
          'Olimpiyat tarzına yakın kısa TYT soruları'
        ])
      },
      onKosul: ['grafikProblemleri'], sonraki: ['kumelerKartezyen']
    },
    kumelerKartezyen: {
      kod: 'TYT_MAT_24', ad: 'Kümeler – Kartezyen Çarpım', zorluk: Zorluk.ORTA, yuzde: 3,
      kazanimlar: {
        kume: createKazanim('24_01', 'Kümeler ve İşlemler', Zorluk.ORTA, 2, [
          'Küme gösterimleri, alt küme, eşitlik',
          'Birleşim, kesişim, fark, tümleme ve evrensel küme'
        ]),
        kart: createKazanim('24_02', 'Kartezyen Çarpım', Zorluk.ZOR, 2, [
          'A×B elemanları ve sıralı ikili sayısı',
          'İki ve üç kümenin birleşim–kesişim sayımı (Venn ile)'
        ])
      },
      onKosul: ['rutinOlmayanProblemler'], sonraki: ['mantik']
    },
    mantik: {
      kod: 'TYT_MAT_25', ad: 'Mantık', zorluk: Zorluk.ORTA, yuzde: 3,
      kazanimlar: {
        onerme: createKazanim('25_01', 'Önermeler', Zorluk.ORTA, 2, [
          'Önermenin doğruluk değeri; değil, ve, veya bağlaçları',
          'Koşullu önerme, karşıt ve ters; iki yönlü koşul'
        ]),
        tablo: createKazanim('25_02', 'Doğruluk Tablosu ve İki Önerme', Zorluk.ZOR, 2, [
          'İki önermenin bileşikleri için doğruluk tablosu',
          'Paragraf ve sayısal mantık sorularında tutarlılık'
        ])
      },
      onKosul: ['kumelerKartezyen'], sonraki: ['fonksiyonlar']
    },
    fonksiyonlar: {
      kod: 'TYT_MAT_26', ad: 'Fonksiyonlar', zorluk: Zorluk.ZOR, yuzde: 4,
      kazanimlar: {
        tanim: createKazanim('26_01', 'Fonksiyon Kavramı', Zorluk.ORTA, 2, [
          'Tanım ve görüntü kümesi, f(x) gösterimi',
          'İçine, örten, bire bir (temel örnekler)'
        ]),
        grafik: createKazanim('26_02', 'Grafik ve İşlemler', Zorluk.ZOR, 2, [
          'Grafikten değer okuma, artan–azalan aralığı (sezgisel)',
          'f+g, f−g, f·g, f/g ve bileşke (basit)'
        ])
      },
      onKosul: ['mantik'], sonraki: ['polinomlar']
    },
    polinomlar: {
      kod: 'TYT_MAT_27', ad: 'Polinomlar', zorluk: Zorluk.ZOR, yuzde: 4,
      kazanimlar: {
        islem: createKazanim('27_01', 'Polinom İşlemleri', Zorluk.ORTA, 2, [
          'Polinom toplama, çarpma; derece ve katsayı',
          'P(x) polinomunda P(a) değeri ve kalan teoremi'
        ]),
        kok: createKazanim('27_02', 'Kök ve Çarpanlar', Zorluk.ZOR, 2, [
          'Kök–çarpan bağlantısı (TYT düzeyi)',
          'İkinci derece polinomda köklerin toplamı ve çarpımı'
        ])
      },
      onKosul: ['fonksiyonlar'], sonraki: ['ikinciDereceDenklemler']
    },
    ikinciDereceDenklemler: {
      kod: 'TYT_MAT_28', ad: '2. Dereceden Denklemler', zorluk: Zorluk.ZOR, yuzde: 4,
      kazanimlar: {
        disk: createKazanim('28_01', 'Diskriminant ve Kökler', Zorluk.ZOR, 2, [
          'Δ = b²−4ac ile kök sayısı ve işareti',
          'Köklerin toplamı ve çarpımı (Vieta)'
        ]),
        isaret: createKazanim('28_02', 'İşaret Tablosu ve Parabol', Zorluk.ZOR, 2, [
          'ax²+bx+c işaretinin x’e göre analizi',
          'Parabolün tepe noktası ve eksen kesimleri'
        ])
      },
      onKosul: ['polinomlar'], sonraki: ['permutasyonKombinasyon']
    },
    permutasyonKombinasyon: {
      kod: 'TYT_MAT_29', ad: 'Permütasyon ve Kombinasyon', zorluk: Zorluk.ZOR, yuzde: 4,
      kazanimlar: {
        sayma: createKazanim('29_01', 'Sayma ve Sıralama', Zorluk.ORTA, 2, [
          'Çarpım ve toplama kuralı; n! ve permütasyon formülü',
          'Tekrarlı ve tekrarsız dizilişler (düz çizgi ve dairesel fikir)'
        ]),
        komb: createKazanim('29_02', 'Kombinasyon', Zorluk.ZOR, 2, [
          'C(n,r) tanımı ve özellikleri',
          'Pascal üçgeni ve binom katsayıları ile ilişki (temel)'
        ])
      },
      onKosul: ['ikinciDereceDenklemler'], sonraki: ['olasilik']
    },
    olasilik: {
      kod: 'TYT_MAT_30', ad: 'Olasılık', zorluk: Zorluk.ZOR, yuzde: 4,
      kazanimlar: {
        temel: createKazanim('30_01', 'Olasılık Aksiyomları', Zorluk.ORTA, 2, [
          'Örnek uzay, olay, P(A) = s(A)/s(E)',
          'Birleşim, tümleme, ayrık olaylar'
        ]),
        kosullu: createKazanim('30_02', 'Koşullu Olasılık', Zorluk.ZOR, 2, [
          'P(A|B) tanımı; bağımsız olaylar ve çarpım kuralı',
          'Basit Bayes ve tablo ile olasılık'
        ])
      },
      onKosul: ['permutasyonKombinasyon'], sonraki: ['veriIstatistik']
    },
    veriIstatistik: {
      kod: 'TYT_MAT_31', ad: 'Veri – İstatistik', zorluk: Zorluk.ORTA, yuzde: 3,
      kazanimlar: {
        merkez: createKazanim('31_01', 'Merkezi Eğilim', Zorluk.ORTA, 2, [
          'Aritmetik ortalama, medyan, mod; aşırı değer etkisi',
          'Histogram ve frekans tablosu'
        ]),
        yayilim: createKazanim('31_02', 'Yayılım ve Grafik', Zorluk.ORTA, 2, [
          'Açıklık, standart sapma fikri (tanım düzeyi)',
          'Kutu grafiği ve çeyrekler (temel okuma)'
        ])
      },
      onKosul: ['olasilik'], sonraki: []
    }
  },
  kaynaklar: ['MEB Matematik Öğretim Programı (9–10)', 'ÖSYM TYT Matematik testi yapısı'],
  tavsiyeler: [
    'Sayı–cebir–problem–mantık–istatistik zincirini sırayla pekiştirin',
    'TYT’de düzlem geometrisi ayrı “Geometri” testindedir; bu liste matematik testi konularını kapsar',
    'Çok soru ve hızlı tekrar'
  ]
};

// ============================================
// TYT GEOMETRİ (10 Soru) — Kitapseç konu başlıkları (TYT matematik testinden ayrı blok)
// ============================================
const TYT_GEOMETRI = {
  kod: 'TYT_GEO',
  ad: 'TYT Geometri',
  soru: 10,
  sure: 30,
  yuzde: 8,
  konular: {
    temelKavramlar: {
      kod: 'TYT_GEO_01', ad: 'Temel Kavramlar', zorluk: Zorluk.KOLAY, yuzde: 8,
      kazanimlar: {
        noktaDogru: createKazanim('01_01', 'Öklid Düzlemi', Zorluk.KOLAY, 2, [
          'Nokta, doğru, düzlem, ışın, doğru parçası',
          'Açı komşuluğu, tümler ve bütünler açı'
        ])
      },
      onKosul: [], sonraki: ['dogrudaAcilar']
    },
    dogrudaAcilar: {
      kod: 'TYT_GEO_02', ad: 'Doğruda Açılar', zorluk: Zorluk.ORTA, yuzde: 8,
      kazanimlar: {
        paralel: createKazanim('02_01', 'Paralel Doğrular ve Açılar', Zorluk.ORTA, 2, [
          'İç–dış ters ve karşılıklı açılar',
          'Üçgende dış açı özelliği'
        ])
      },
      onKosul: ['temelKavramlar'], sonraki: ['ucgendeAcilar']
    },
    ucgendeAcilar: {
      kod: 'TYT_GEO_03', ad: 'Üçgende Açılar', zorluk: Zorluk.ZOR, yuzde: 9,
      kazanimlar: {
        aciToplami: createKazanim('03_01', 'İç ve Dış Açılar', Zorluk.ZOR, 2, [
          'İç açılar toplamı, dış açı teoremi',
          'Özel üçgenler: dik, ikizkenar, eşkenar (açı özellikleri)'
        ])
      },
      onKosul: ['dogrudaAcilar'], sonraki: ['aciortaKenarorta']
    },
    aciortaKenarorta: {
      kod: 'TYT_GEO_04', ad: 'Açıortay ve Kenarortay', zorluk: Zorluk.ZOR, yuzde: 7,
      kazanimlar: {
        aciorta: createKazanim('04_01', 'Açıortay Teoremleri', Zorluk.ZOR, 2, [
          'İç ve dış açıortay uzunluk formülleri (temel)',
          'Kenarortay ve ağırlık merkezi'
        ])
      },
      onKosul: ['ucgendeAcilar'], sonraki: ['eslikBenzerlik']
    },
    eslikBenzerlik: {
      kod: 'TYT_GEO_05', ad: 'Eşlik ve Benzerlik', zorluk: Zorluk.ZOR, yuzde: 9,
      kazanimlar: {
        es: createKazanim('05_01', 'Üçgenlerde Eşlik', Zorluk.ZOR, 2, [
          'KKK, KAK, AKK eşlik kuralları',
          'Benzerlik oranı ve paralel doğru paketi'
        ])
      },
      onKosul: ['aciortaKenarorta'], sonraki: ['ucgendeAlanBenzerlik']
    },
    ucgendeAlanBenzerlik: {
      kod: 'TYT_GEO_06', ad: 'Üçgende Alan ve Benzerlik', zorluk: Zorluk.ZOR, yuzde: 9,
      kazanimlar: {
        alan: createKazanim('06_01', 'Alan Formülleri', Zorluk.ZOR, 2, [
          'Taban × yükseklik / 2, iki kenar ve aradaki açı',
          'Benzer üçgenlerde alan oranı = k²'
        ])
      },
      onKosul: ['eslikBenzerlik'], sonraki: ['aciKenarBagintilari']
    },
    aciKenarBagintilari: {
      kod: 'TYT_GEO_07', ad: 'Açı–Kenar Bağıntıları', zorluk: Zorluk.ZOR, yuzde: 7,
      kazanimlar: {
        sinCos: createKazanim('07_01', 'Sinüs ve Kosinüs Teoremleri', Zorluk.ZOR, 2, [
          'Sinüs teoremi ile kenar–açı hesapları',
          'Kosinüs teoremi ve özel üçgen bağlantısı'
        ])
      },
      onKosul: ['ucgendeAlanBenzerlik'], sonraki: ['cokgenlerOzelDortgen']
    },
    cokgenlerOzelDortgen: {
      kod: 'TYT_GEO_08', ad: 'Çokgenler ve Özel Dörtgenler', zorluk: Zorluk.ZOR, yuzde: 9,
      kazanimlar: {
        dortgen: createKazanim('08_01', 'Dörtgenler', Zorluk.ZOR, 2, [
          'İç açılar toplamı, paralelkenar, dikdörtgen, kare, yamuk, deltoid, eşkenar dörtgen',
          'Çokgende köşegen ve alan yaklaşımları'
        ])
      },
      onKosul: ['aciKenarBagintilari'], sonraki: ['cemberDaire']
    },
    cemberDaire: {
      kod: 'TYT_GEO_09', ad: 'Çember ve Daire', zorluk: Zorluk.ZOR, yuzde: 9,
      kazanimlar: {
        cember: createKazanim('09_01', 'Çemberde Açı ve Uzunluk', Zorluk.ZOR, 2, [
          'Merkez–çevre açıları, teğet–kirve özellikleri',
          'Dairede çevre ve alan, yay uzunluğu'
        ])
      },
      onKosul: ['cokgenlerOzelDortgen'], sonraki: ['analitikGeometri']
    },
    analitikGeometri: {
      kod: 'TYT_GEO_10', ad: 'Analitik Geometri', zorluk: Zorluk.ZOR, yuzde: 8,
      kazanimlar: {
        noktaDogruAnalitik: createKazanim('10_01', 'Nokta ve Doğru', Zorluk.ZOR, 2, [
          'İki nokta arası uzaklık, doğrunun denklemi',
          'Dönüşüm geometrisi: öteleme, simetri (temel)'
        ])
      },
      onKosul: ['cemberDaire'], sonraki: ['katiCisimler']
    },
    katiCisimler: {
      kod: 'TYT_GEO_11', ad: 'Katı Cisimler', zorluk: Zorluk.ZOR, yuzde: 9,
      kazanimlar: {
        hacim: createKazanim('11_01', 'Prizma, Küp, Silindir, Piramit, Koni, Küre', Zorluk.ZOR, 2, [
          'Yüzey alanı ve hacim formülleri',
          'Kesit alanları ve benzer cisimler'
        ])
      },
      onKosul: ['analitikGeometri'], sonraki: ['cemberinAnalitigi']
    },
    cemberinAnalitigi: {
      kod: 'TYT_GEO_12', ad: 'Çemberin Analitiği', zorluk: Zorluk.COK_ZOR, yuzde: 8,
      kazanimlar: {
        daireDenklem: createKazanim('12_01', 'Çember Denklemi', Zorluk.COK_ZOR, 2, [
          'Merkez ve yarıçapla çember denklemi',
          'Doğru ile teğetlik, kesişim ve güç doğrusu (temel)'
        ])
      },
      onKosul: ['katiCisimler'], sonraki: []
    }
  },
  kaynaklar: ['MEB Geometri (9–10)', 'Kitapseç TYT geometri konu listesi özeti'],
  tavsiyeler: ['Şekil çizerek tekrar edin', 'TYT’de geometri soruları ayrı testte; analitik–sentetik birlikte çalışın']
};

const TYT_FEN = {
  kod: 'TYT_FEN',
  ad: 'TYT Fen Bilimleri',
  soru: 20,
  yuzde: 16,
  sure: 40,
  altDersler: {
    fizik: {
      kod: 'TYT_FIZ',
      ad: 'TYT Fizik',
      soru: 7,
      yuzde: 35,
      konular: {
        fizikBilimineGiris: {
          kod: 'TYT_FIZ_01', ad: 'Fizik Bilimine Giriş', zorluk: Zorluk.KOLAY, yuzde: 8,
          kazanimlar: {
            bilim: createKazanim('F01_01', 'Fiziksel Nicelikler ve Birimler', Zorluk.KOLAY, 2, [
              'SI birim sistemi, ön ekler, bilimsel gösterim',
              'Ölçme, doğruluk–kesinlik, grafik okuma'
            ])
          },
          onKosul: [], sonraki: ['maddeOzellikleri']
        },
        maddeOzellikleri: {
          kod: 'TYT_FIZ_02', ad: 'Madde ve Özellikleri', zorluk: Zorluk.ORTA, yuzde: 10,
          kazanimlar: {
            hal: createKazanim('F02_01', 'Madde ve Hal Değişimi', Zorluk.ORTA, 2, [
              'Yoğunluk, kütle–hacim ilişkisi',
              'Katı–sıvı–gaz modelleri ve tanecikli yapı'
            ])
          },
          onKosul: ['fizikBilimineGiris'], sonraki: ['siviKaldirma']
        },
        siviKaldirma: {
          kod: 'TYT_FIZ_03', ad: 'Sıvıların Kaldırma Kuvveti', zorluk: Zorluk.ORTA, yuzde: 8,
          kazanimlar: {
            arsimed: createKazanim('F03_01', 'Arşimet İlkesi', Zorluk.ORTA, 2, [
              'Kaldırma kuvveti ve batma–yüzme koşulları',
              'Görünen ağırlık ve sıvı yükselmesi'
            ])
          },
          onKosul: ['maddeOzellikleri'], sonraki: ['basinc']
        },
        basinc: {
          kod: 'TYT_FIZ_04', ad: 'Basınç', zorluk: Zorluk.ORTA, yuzde: 8,
          kazanimlar: {
            basincFormul: createKazanim('F04_01', 'Basınç Türleri', Zorluk.ORTA, 2, [
              'Katı ve sıvı basıncı, Pascal prensibi',
              'Atmosfer basıncı ve manometre mantığı'
            ])
          },
          onKosul: ['siviKaldirma'], sonraki: ['isiSicaklikGenlesme']
        },
        isiSicaklikGenlesme: {
          kod: 'TYT_FIZ_05', ad: 'Isı, Sıcaklık ve Genleşme', zorluk: Zorluk.ORTA, yuzde: 10,
          kazanimlar: {
            isi: createKazanim('F05_01', 'Isı ve İç Enerji', Zorluk.ORTA, 2, [
              'Sıcaklık, ısı, hal değişimi ve buharlaşma',
              'Genleşme katsayısı ve termometre'
            ])
          },
          onKosul: ['basinc'], sonraki: ['hareketKuvvet']
        },
        hareketKuvvet: {
          kod: 'TYT_FIZ_06', ad: 'Hareket ve Kuvvet', zorluk: Zorluk.ZOR, yuzde: 12,
          kazanimlar: {
            newton: createKazanim('F06_01', 'Newton Yasaları', Zorluk.ZOR, 2, [
              'İvme, kuvvet, sürtünme ve eğik düzlem',
              'Momentum ve çarpışmalar (temel)'
            ])
          },
          onKosul: ['isiSicaklikGenlesme'], sonraki: ['dinamik']
        },
        dinamik: {
          kod: 'TYT_FIZ_07', ad: 'Dinamik', zorluk: Zorluk.ZOR, yuzde: 8,
          kazanimlar: {
            dairesel: createKazanim('F07_01', 'Dairesel Hareket', Zorluk.ZOR, 2, [
              'Merkezcil kuvvet ve ivme',
              'Dönerek hareket ve basit harmonik hareket fikri'
            ])
          },
          onKosul: ['hareketKuvvet'], sonraki: ['isGucEnerji']
        },
        isGucEnerji: {
          kod: 'TYT_FIZ_08', ad: 'İş, Güç ve Enerji', zorluk: Zorluk.ZOR, yuzde: 10,
          kazanimlar: {
            enerji: createKazanim('F08_01', 'Mekanik Enerji', Zorluk.ZOR, 2, [
              'İş–güç tanımı, verim',
              'Kinetik–potansiyel enerji, enerji korunumu'
            ])
          },
          onKosul: ['dinamik'], sonraki: ['elektrik']
        },
        elektrik: {
          kod: 'TYT_FIZ_09', ad: 'Elektrik', zorluk: Zorluk.ZOR, yuzde: 10,
          kazanimlar: {
            devre: createKazanim('F09_01', 'Elektrostatik ve Devreler', Zorluk.ZOR, 2, [
              'Yük, Coulomb kuvveti, elektrik alan (temel)',
              'Ohm yasası, seri–paralel direnç, Kirchhoff fikri'
            ]),
            enerjiEl: createKazanim('F09_02', 'Elektriksel Enerji ve Güç', Zorluk.ORTA, 2, [
              'P = VI, Joule ısısı, ampul ve direnç davranışı'
            ])
          },
          onKosul: ['isGucEnerji'], sonraki: ['manyetizma']
        },
        manyetizma: {
          kod: 'TYT_FIZ_10', ad: 'Manyetizma', zorluk: Zorluk.ZOR, yuzde: 8,
          kazanimlar: {
            mıknatıs: createKazanim('F10_01', 'Mıknatıs ve Akımın Manyetik Etkisi', Zorluk.ZOR, 2, [
              'Manyetik alan çizgileri, sol-el kuralı',
              'Elektromıknatıs ve basit motor–jeneratör mantığı'
            ])
          },
          onKosul: ['elektrik'], sonraki: ['dalgalar']
        },
        dalgalar: {
          kod: 'TYT_FIZ_11', ad: 'Dalgalar', zorluk: Zorluk.ORTA, yuzde: 8,
          kazanimlar: {
            dalga: createKazanim('F11_01', 'Dalga Nicelikleri', Zorluk.ORTA, 2, [
              'Frekans, periyot, dalga boyu, hız ilişkisi',
              'Ses dalgalarında gürültü ve titreşim'
            ])
          },
          onKosul: ['manyetizma'], sonraki: ['optik']
        },
        optik: {
          kod: 'TYT_FIZ_12', ad: 'Optik', zorluk: Zorluk.ZOR, yuzde: 10,
          kazanimlar: {
            optik: createKazanim('F12_01', 'Yansıma ve Kırılma', Zorluk.ZOR, 2, [
              'Yansıma yasaları, düzlem ve küresel aynalar',
              'Kırılma indisi, Snell yasası, mercekler ve göz'
            ])
          },
          onKosul: ['dalgalar'], sonraki: []
        }
      }
    },
    kimya: {
      kod: 'TYT_KIM',
      ad: 'TYT Kimya',
      soru: 7,
      yuzde: 35,
      konular: {
        kimyaBilimi: {
          kod: 'TYT_KIM_01', ad: 'Kimya Bilimi', zorluk: Zorluk.KOLAY, yuzde: 9,
          kazanimlar: {
            kimya: createKazanim('K01_01', 'Kimyanın Temel Kavramları', Zorluk.KOLAY, 2, [
              'Saf madde, karışım, element ve bileşik',
              'Fiziksel ve kimyasal değişim'
            ])
          },
          onKosul: [], sonraki: ['atomPeriyodik']
        },
        atomPeriyodik: {
          kod: 'TYT_KIM_02', ad: 'Atom ve Periyodik Sistem', zorluk: Zorluk.ZOR, yuzde: 11,
          kazanimlar: {
            atom: createKazanim('K02_01', 'Atom Modelleri ve Elektron Dizilimi', Zorluk.ZOR, 2, [
              'Proton, nötron, elektron; izotop',
              'Periyodik özellikler: metal–ametal, elektronegatiflik eğilimi'
            ])
          },
          onKosul: ['kimyaBilimi'], sonraki: ['kimyasalEtkilesim']
        },
        kimyasalEtkilesim: {
          kod: 'TYT_KIM_03', ad: 'Kimyasal Türler Arası Etkileşimler', zorluk: Zorluk.ZOR, yuzde: 10,
          kazanimlar: {
            bag: createKazanim('K03_01', 'Kimyasal Bağlar', Zorluk.ZOR, 2, [
              'İyonik, kovalent, metalik bağ; molekül geometrisi (temel)',
              'Polarlık ve ara molekül etkileşimleri'
            ])
          },
          onKosul: ['atomPeriyodik'], sonraki: ['maddeninHalleri']
        },
        maddeninHalleri: {
          kod: 'TYT_KIM_04', ad: 'Maddenin Halleri', zorluk: Zorluk.ORTA, yuzde: 9,
          kazanimlar: {
            hal: createKazanim('K04_01', 'Hal Değişimleri ve Grafikleri', Zorluk.ORTA, 2, [
              'Erime, donma, kaynama; ısı alışverişi',
              'Hal grafiklerinden nicelik okuma'
            ])
          },
          onKosul: ['kimyasalEtkilesim'], sonraki: ['dogaVeKimya']
        },
        dogaVeKimya: {
          kod: 'TYT_KIM_05', ad: 'Doğa ve Kimya', zorluk: Zorluk.ORTA, yuzde: 8,
          kazanimlar: {
            cevre: createKazanim('K05_01', 'Çevre Kimyası', Zorluk.ORTA, 2, [
              'Su döngüsü, kirlilik türleri, sürdürülebilirlik',
              'Günlük hayatta kimyasal maddeler'
            ])
          },
          onKosul: ['maddeninHalleri'], sonraki: ['temelKanunlar']
        },
        temelKanunlar: {
          kod: 'TYT_KIM_06', ad: 'Kimyanın Temel Kanunları', zorluk: Zorluk.ZOR, yuzde: 9,
          kazanimlar: {
            kanun: createKazanim('K06_01', 'Kütle Korunumu ve Sabit Oranlar', Zorluk.ZOR, 2, [
              'Kimyasal tepkime denklemlerinin denkleştirilmesi',
              'Mol kavramı ve Avogadro sayısı'
            ])
          },
          onKosul: ['dogaVeKimya'], sonraki: ['kimyasalHesaplamalar']
        },
        kimyasalHesaplamalar: {
          kod: 'TYT_KIM_07', ad: 'Kimyasal Hesaplamalar', zorluk: Zorluk.ZOR, yuzde: 10,
          kazanimlar: {
            stokiyometri: createKazanim('K07_01', 'Stokiyometri', Zorluk.ZOR, 2, [
              'Sınırlayıcı reaktif, verim yüzdesi',
              'Çözelti molaritesi ve seyreltme'
            ])
          },
          onKosul: ['temelKanunlar'], sonraki: ['karisimlar']
        },
        karisimlar: {
          kod: 'TYT_KIM_08', ad: 'Karışımlar', zorluk: Zorluk.ORTA, yuzde: 9,
          kazanimlar: {
            cozelti: createKazanim('K08_01', 'Homojen ve Heterojen Karışımlar', Zorluk.ORTA, 2, [
              'Asit–baz–tuz çözelti kavramı (özet)',
              'Ayırma ve saflaştırma yöntemleri'
            ])
          },
          onKosul: ['kimyasalHesaplamalar'], sonraki: ['asitBazTuz']
        },
        asitBazTuz: {
          kod: 'TYT_KIM_09', ad: 'Asit, Baz ve Tuz', zorluk: Zorluk.ZOR, yuzde: 10,
          kazanimlar: {
            ph: createKazanim('K09_01', 'Asit–Baz Tanımları ve pH', Zorluk.ZOR, 2, [
              'Arrhenius ve Brønsted–Lowry (temel)',
              'Nötrleşme tepkimeleri ve tuz oluşumu'
            ])
          },
          onKosul: ['karisimlar'], sonraki: ['kimyaHerYerde']
        },
        kimyaHerYerde: {
          kod: 'TYT_KIM_10', ad: 'Kimya Her Yerde', zorluk: Zorluk.ORTA, yuzde: 8,
          kazanimlar: {
            gunluk: createKazanim('K10_01', 'Günlük Hayat ve Endüstri', Zorluk.ORTA, 2, [
              'Polimer, ilaç, gübre, yakıtlar (örnek düzeyi)',
              'Güvenlik sembolleri ve etik kullanım'
            ])
          },
          onKosul: ['asitBazTuz'], sonraki: []
        }
      }
    },
    biyoloji: {
      kod: 'TYT_BIY',
      ad: 'TYT Biyoloji',
      soru: 6,
      yuzde: 30,
      konular: {
        canliOrtak: {
          kod: 'TYT_BIY_01', ad: 'Canlıların Ortak Özellikleri', zorluk: Zorluk.KOLAY, yuzde: 9,
          kazanimlar: {
            canli: createKazanim('B01_01', 'Yaşamın Özellikleri', Zorluk.KOLAY, 2, [
              'Hücre, metabolizma, homeostazi, uyarıya cevap',
              'Üreme, gelişim, evrimsel uyum'
            ])
          },
          onKosul: [], sonraki: ['temelBilesenler']
        },
        temelBilesenler: {
          kod: 'TYT_BIY_02', ad: 'Canlıların Temel Bileşenleri', zorluk: Zorluk.ORTA, yuzde: 10,
          kazanimlar: {
            organik: createKazanim('B02_01', 'Organik Bileşikler', Zorluk.ORTA, 2, [
              'Karbonhidrat, lipit, protein, nükleik asit',
              'Enzimler ve enerji ilişkisi'
            ])
          },
          onKosul: ['canliOrtak'], sonraki: ['hucreOrganeller']
        },
        hucreOrganeller: {
          kod: 'TYT_BIY_03', ad: 'Hücre ve Organelleri', zorluk: Zorluk.ZOR, yuzde: 11,
          kazanimlar: {
            organel: createKazanim('B03_01', 'Hücre Yapısı', Zorluk.ZOR, 2, [
              'Prokaryot–ökaryot ayrımı; organel işlevleri',
              'Bitki ve hayvan hücresi farkları'
            ])
          },
          onKosul: ['temelBilesenler'], sonraki: ['maddeGecisi']
        },
        maddeGecisi: {
          kod: 'TYT_BIY_04', ad: 'Hücre Zarından Madde Geçişi', zorluk: Zorluk.ZOR, yuzde: 10,
          kazanimlar: {
            zar: createKazanim('B04_01', 'Osmoz ve Taşıma', Zorluk.ZOR, 2, [
              'Pasif ve aktif taşıma, osmoz, endositoz–ekzositoz',
              'Hücre zarı seçici geçirgenliği'
            ])
          },
          onKosul: ['hucreOrganeller'], sonraki: ['siniflandirma']
        },
        siniflandirma: {
          kod: 'TYT_BIY_05', ad: 'Canlıların Sınıflandırılması', zorluk: Zorluk.ORTA, yuzde: 9,
          kazanimlar: {
            takson: createKazanim('B05_01', 'Sistematik', Zorluk.ORTA, 2, [
              'Üç alan / beş âlem yaklaşımı (MEB çerçevesi)',
              'Virüsler ve canlılık tartışması'
            ])
          },
          onKosul: ['maddeGecisi'], sonraki: ['mitozEsseysiz']
        },
        mitozEsseysiz: {
          kod: 'TYT_BIY_06', ad: 'Mitoz ve Eşeysiz Üreme', zorluk: Zorluk.ZOR, yuzde: 10,
          kazanimlar: {
            mitoz: createKazanim('B06_01', 'Hücre Döngüsü ve Mitoz', Zorluk.ZOR, 2, [
              'İnterfaz, mitoz evreleri, kromozom sayısı',
              'Eşeysiz üreme çeşitleri'
            ])
          },
          onKosul: ['siniflandirma'], sonraki: ['mayozEseyli']
        },
        mayozEseyli: {
          kod: 'TYT_BIY_07', ad: 'Mayoz ve Eşeyli Üreme', zorluk: Zorluk.ZOR, yuzde: 10,
          kazanimlar: {
            mayoz: createKazanim('B07_01', 'Mayoz ve Gamet', Zorluk.ZOR, 2, [
              'Mayoz I–II, çaprazlama ve çeşitlilik',
              'Eşeyli üreme ve döllenme'
            ])
          },
          onKosul: ['mitozEsseysiz'], sonraki: ['kalitim']
        },
        kalitim: {
          kod: 'TYT_BIY_08', ad: 'Kalıtım', zorluk: Zorluk.COK_ZOR, yuzde: 11,
          kazanimlar: {
            mendel: createKazanim('B08_01', 'Genetik ve Mendel Kanunları', Zorluk.COK_ZOR, 2, [
              'Gen, alel, dominant–resesif',
              'Punnett karesi ve kalıtım problemleri'
            ])
          },
          onKosul: ['mayozEseyli'], sonraki: ['ekosistem']
        },
        ekosistem: {
          kod: 'TYT_BIY_09', ad: 'Ekosistem Ekolojisi', zorluk: Zorluk.ORTA, yuzde: 10,
          kazanimlar: {
            besin: createKazanim('B09_01', 'Ekosistem Bileşenleri', Zorluk.ORTA, 2, [
              'Üretici–tüketici–ayıklayıcı, besin zinciri ve ağı',
              'Madde döngüleri ve enerji akışı'
            ])
          },
          onKosul: ['kalitim'], sonraki: ['cevreSorunlari']
        },
        cevreSorunlari: {
          kod: 'TYT_BIY_10', ad: 'Güncel Çevre Sorunları', zorluk: Zorluk.ORTA, yuzde: 10,
          kazanimlar: {
            iklim: createKazanim('B10_01', 'Çevre ve Sürdürülebilirlik', Zorluk.ORTA, 2, [
              'Küresel ısınma, biyoçeşitlilik kaybı, kirlilik',
              'Bireysel ve toplumsal önlemler'
            ])
          },
          onKosul: ['ekosistem'], sonraki: []
        }
      }
    }
  },
  kaynaklar: ['MEB Fizik, Kimya, Biyoloji Öğretim Programı (9–11)', 'Kitapseç TYT fen konu listesi özeti'],
  tavsiyeler: ['Grafik ve birim dönüşümlerine ağırlık verin', 'Kimyada mol ve stokiyometriyi fen problemleriyle bağlayın']
};

// ============================================
// AYT MATEMATİK (40 Soru) — Konu sırası ÖSYM/YKS hazırlık yayınları ile uyumlu blok
// ============================================
const AYT_MAT = {
  kod: 'AYT_MAT',
  ad: 'AYT Matematik',
  soru: 40,
  yuzde: 100,
  konular: {
    ilkOnSoru: {
      kod: 'AYT_MAT_01',
      ad: 'İlk 10 Soru',
      zorluk: Zorluk.ORTA,
      yuzde: 5,
      kazanimlar: {
        tytKoprusu: createKazanim('01_01', 'TYT Köprüsü ve Temel İşlemler', Zorluk.ORTA, 2, [
          'Doğal, tam ve rasyonel sayılarla dört işlem',
          'Üslü ve köklü ifadelerde sadeleştirme',
          'Oran-orantı, yüzde ve karışım problemleri',
          'Mutlak değerin temel özellikleri ve basit denklemler'
        ]),
        kumelerMantik: createKazanim('01_02', 'Kümeler ve Mantık', Zorluk.ORTA, 2, [
          'Kümelerde birleşim, kesişim, fark, tümleme',
          'Sayı kümeleri ile küme işlemleri',
          'Önerme, bileşik önerme, koşullu önerme (temel)'
        ]),
        problemler: createKazanim('01_03', 'Sözel ve Sayısal Problemler', Zorluk.ZOR, 1, [
          'Yaş, işçi, havuz, hız-zaman-mesafe tipi sorular',
          'Grafik ve tablodan veri okuma (özet)'
        ])
      },
      onKosul: ['TYT_MAT'],
      sonraki: ['fonksiyonlar']
    },
    fonksiyonlar: {
      kod: 'AYT_MAT_02',
      ad: 'Fonksiyonlar',
      zorluk: Zorluk.ZOR,
      yuzde: 7,
      kazanimlar: {
        temel: createKazanim('02_01', 'Fonksiyon Kavramı', Zorluk.ORTA, 2, [
          'Tanım ve görüntü kümeleri, fonksiyon grafiği',
          'İçine, örten, bire bir fonksiyon',
          'f(x) ile öteleme, yansıtma, ölçekleme (grafikten)'
        ]),
        bileşkeTers: createKazanim('02_02', 'Bileşke ve Ters Fonksiyon', Zorluk.ZOR, 2, [
          'f∘g bileşkesi ve tanım kümesi',
          'Bire bir fonksiyonda f⁻¹ bulma ve grafik simetrisi'
        ]),
        parcali: createKazanim('02_03', 'Parçalı Tanımlı Fonksiyonlar', Zorluk.ZOR, 2, [
          'Parçalı fonksiyonun grafiği ve değer bulma',
          'Mutlak değerli fonksiyonlar (|f(x)|, f(|x|))'
        ]),
        ikinciDereceGrafik: createKazanim('02_04', 'İkinci Dereceden Fonksiyon ve Parabol', Zorluk.ZOR, 1, [
          'Tepe noktası, eksen kesimleri, kol yönü',
          'Parabolün denklemi ve grafik yorumu'
        ])
      },
      onKosul: ['ilkOnSoru'],
      sonraki: ['polinomlar']
    },
    polinomlar: {
      kod: 'AYT_MAT_03',
      ad: 'Polinomlar',
      zorluk: Zorluk.ZOR,
      yuzde: 7,
      kazanimlar: {
        tanim: createKazanim('03_01', 'Polinom Tanımı ve İşlemler', Zorluk.ORTA, 2, [
          'Polinom derecesi, katsayılar, toplama ve çarpma',
          'Polinom çarpanlarına ayırma (ortak çarpan, kimlikler)'
        ]),
        bolme: createKazanim('03_02', 'Bölme ve Kalan', Zorluk.ZOR, 2, [
          'Polinom bölme, kalan teoremi, Horner (özet)',
          'P(x) polinomunun x−a ile bölümünden kalan: P(a)'
        ]),
        kokler: createKazanim('03_03', 'Kökler ve Çarpanlar', Zorluk.COK_ZOR, 2, [
          'Rasyonel kök teoremi (fikir), çok katlı kök',
          'Kök–katsayı ilişkileri (Vieta, ikinci derece özel)'
        ]),
        grafik: createKazanim('03_04', 'Polinom Grafiği', Zorluk.ZOR, 1, [
          'x ekseni kesimleri, işaret değişimi, çift/tek derece davranışı'
        ])
      },
      onKosul: ['fonksiyonlar'],
      sonraki: ['ikinciDereceDenklemler']
    },
    ikinciDereceDenklemler: {
      kod: 'AYT_MAT_04',
      ad: '2. Dereceden Denklemler',
      zorluk: Zorluk.ZOR,
      yuzde: 7,
      kazanimlar: {
        kokler: createKazanim('04_01', 'Kökler ve Diskriminant', Zorluk.ORTA, 2, [
          'ax²+bx+c=0 için diskriminant ve kök sayısı',
          'Köklerin toplamı ve çarpımı (Vieta)',
          'İkinci derece denklem sistemleri (temel)'
        ]),
        parabol: createKazanim('04_02', 'Parabol ve İkinci Derece İfadeler', Zorluk.ZOR, 2, [
          'İkinci derece üç terimlinin işaret tablosu',
          'Parabolün tepe noktası ve denklemin katsayılarla ilişkisi'
        ]),
        parametre: createKazanim('04_03', 'Parametreli Denklemler', Zorluk.COK_ZOR, 2, [
          'Kök işaretine göre m parametresi aralığı',
          'Ortak kök ve kök koşulu problemleri'
        ]),
        irrasyonel: createKazanim('04_04', 'İkinci Dereceye Dönüşen Denklemler', Zorluk.ZOR, 1, [
          'Değişken dönüşümü ile çözülebilen denklemler (ör. x² yerine t)',
          'Mutlak değerli ikinci derece (sınırlı)'
        ])
      },
      onKosul: ['polinomlar'],
      sonraki: ['esitsizlikler']
    },
    esitsizlikler: {
      kod: 'AYT_MAT_05',
      ad: 'Eşitsizlikler',
      zorluk: Zorluk.ZOR,
      yuzde: 6,
      kazanimlar: {
        birinci: createKazanim('05_01', 'Birinci ve İkinci Derece Eşitsizlikler', Zorluk.ORTA, 2, [
          'İşaret tablosu ile çözüm kümesi',
          'İkinci derece eşitsizliklerde parabol ve aralık seçimi'
        ]),
        mutlakRasyonel: createKazanim('05_02', 'Mutlak Değer ve Rasyonel Eşitsizlik', Zorluk.ZOR, 2, [
          '|f(x)|<a, |f(x)|>a tipi çözümler',
          'Rasyonel fonksiyonlarda tanım ve işaret analizi'
        ]),
        koklu: createKazanim('05_03', 'Köklü ve Üstel Eşitsizlikler', Zorluk.COK_ZOR, 2, [
          '√f(x) gibi ifadelerde tanım ve çözüm',
          'Üstel ve logaritmik eşitsizlik (tanım kümesi ile)'
        ])
      },
      onKosul: ['ikinciDereceDenklemler'],
      sonraki: ['karmasikSayilar']
    },
    karmasikSayilar: {
      kod: 'AYT_MAT_06',
      ad: 'Karmaşık Sayılar',
      zorluk: Zorluk.ZOR,
      yuzde: 6,
      kazanimlar: {
        dortIslem: createKazanim('06_01', 'Dört İşlem ve Eşlenik', Zorluk.ORTA, 2, [
          'Sanal birim i, karmaşık sayı düzlemi',
          'Toplama, çarpım, bölme ve eşlenik ile payda rasyonelleştirme'
        ]),
        modulArg: createKazanim('06_02', 'Modül ve Argüman', Zorluk.ZOR, 2, [
          '|z|, arg(z), kutupsal gösterim (r,θ)',
          'cis θ ile çarpım ve geometrik yorum'
        ]),
        moivre: createKazanim('06_03', 'De Moivre ve Kökler', Zorluk.COK_ZOR, 2, [
          'De Moivre ile zⁿ ve n. dereceden kökler',
          'Birim kökler (temel örnekler)'
        ]),
        denklem: createKazanim('06_04', 'Karmaşık Katsayılı Denklemler', Zorluk.ZOR, 1, [
          'İkinci derece denklemin kökleri (Δ<0 yorumu)',
          'z ile ifade edilen denklemlerde bilinmeyen bulma'
        ])
      },
      onKosul: ['esitsizlikler'],
      sonraki: ['saymaOlasilik']
    },
    saymaOlasilik: {
      kod: 'AYT_MAT_07',
      ad: 'Permütasyon – Kombinasyon – Binom – Olasılık',
      zorluk: Zorluk.ZOR,
      yuzde: 8,
      kazanimlar: {
        sayma: createKazanim('07_01', 'Sayma ve Sıralama', Zorluk.ORTA, 2, [
          'Çarpım ve toplama kuralı, tekrarlı ve tekrarsız permütasyon',
          'Kombinasyon ve nın r li seçimi'
        ]),
        binom: createKazanim('07_02', 'Binom Açılımı', Zorluk.ZOR, 2, [
          '(a+b)ⁿ açılımı ve Pascal üçgeni',
          'Belirli bir terimin katsayısını bulma'
        ]),
        olasilik: createKazanim('07_03', 'Olasılık', Zorluk.ZOR, 2, [
          'Örnek uzay, olasılık fonksiyonu, birleşim ve tümleme',
          'Koşullu olasılık ve Bayes (temel)',
          'Bağımsız olaylar ve çarpım kuralı'
        ]),
        dagilim: createKazanim('07_04', 'Basit Dağılımlar', Zorluk.COK_ZOR, 2, [
          'Beklenen değer ve varyans (tanım)',
          'Binom dağılımı (özet)'
        ])
      },
      onKosul: ['karmasikSayilar'],
      sonraki: ['logaritma']
    },
    logaritma: {
      kod: 'AYT_MAT_08',
      ad: 'Logaritma',
      zorluk: Zorluk.ZOR,
      yuzde: 6,
      kazanimlar: {
        tanim: createKazanim('08_01', 'Logaritma Tanımı ve Özellikleri', Zorluk.ORTA, 2, [
          'logₐ x tanımı, taban değiştirme',
          'Çarpım, bölüm, kuvvet kuralları'
        ]),
        denklem: createKazanim('08_02', 'Logaritmik Denklem ve Eşitsizlik', Zorluk.ZOR, 2, [
          'Tanım kümesi şartı (içi pozitif)',
          'Üstel–logaritmik denklem sistemleri (temel)'
        ]),
        ustel: createKazanim('08_03', 'Üstel Fonksiyon ve Grafik', Zorluk.ZOR, 2, [
          'aˣ, eˣ, logₐ x grafikleri ve monotonluk',
          'Logaritmik türeve hazırlık (özellikler)'
        ])
      },
      onKosul: ['saymaOlasilik'],
      sonraki: ['trigonometri']
    },
    trigonometri: {
      kod: 'AYT_MAT_09',
      ad: 'Trigonometri',
      zorluk: Zorluk.COK_ZOR,
      yuzde: 8,
      kazanimlar: {
        birimCember: createKazanim('09_01', 'Birim Çember ve Oranlar', Zorluk.ORTA, 2, [
          'sin, cos, tan, cot tanımları ve periyot',
          'Yay uzunluğu ve sektör alanı (radyan)'
        ]),
        ozdeslik: createKazanim('09_02', 'Özdeşlikler ve Dönüşümler', Zorluk.COK_ZOR, 3, [
          'Toplama–çıkarma, iki kat ve yarım açı formülleri',
          'sin x+cos x gibi ifadeleri tek açıya indirgeme'
        ]),
        denklem: createKazanim('09_03', 'Trigonometrik Denklem ve Eşitsizlik', Zorluk.COK_ZOR, 2, [
          'Temel trigonometrik denklemlerin çözüm kümesi',
          'Periyot ve genel çözüm aralığı'
        ]),
        tersTrig: createKazanim('09_04', 'Ters Trigonometrik Fonksiyonlar', Zorluk.ZOR, 1, [
          'arcsin, arccos, arctan tanım aralıkları (özet)'
        ])
      },
      onKosul: ['logaritma'],
      sonraki: ['analitikGeometri']
    },
    analitikGeometri: {
      kod: 'AYT_MAT_10',
      ad: 'Analitik Geometri',
      zorluk: Zorluk.COK_ZOR,
      yuzde: 8,
      kazanimlar: {
        dogru: createKazanim('10_01', 'Doğru Analitiği', Zorluk.ZOR, 2, [
          'İki nokta arası uzaklık, bölüm noktası',
          'Doğrunun denklemi, paralel ve dik doğrular',
          'Bir noktadan doğruya uzaklık'
        ]),
        cember: createKazanim('10_02', 'Çember Analitiği', Zorluk.COK_ZOR, 2, [
          'Çember denklemi (merkez–yarıçap), teğet',
          'Kiriş gücü, teğet–kiriş uzunluğu (analitik bağlam)'
        ]),
        konik: createKazanim('10_03', 'Konikler (Parabol, Elips, Hiperbol)', Zorluk.COK_ZOR, 2, [
          'Parabol, elips, hiperbol standart denklemleri',
          'Odak, doğrudanlık, asimptot (hiperbol)'
        ]),
        geometrikYer: createKazanim('10_04', 'Geometrik Yer ve Optimizasyon', Zorluk.COK_ZOR, 2, [
          'Uzaklığa dayalı yer problemleri',
          'İki doğru arası açı (eğim ile)'
        ])
      },
      onKosul: ['trigonometri'],
      sonraki: ['limit']
    },
    limit: {
      kod: 'AYT_MAT_11',
      ad: 'Limit',
      zorluk: Zorluk.COK_ZOR,
      yuzde: 7,
      kazanimlar: {
        tanim: createKazanim('11_01', 'Limit Tanımı ve Kurallar', Zorluk.ZOR, 2, [
          'x→a, x→±∞ limit kavramı',
          'Limit kuralları ve bileşke fonksiyon limiti'
        ]),
        belirsiz: createKazanim('11_02', 'Belirsizlikler ve Özel Limitler', Zorluk.COK_ZOR, 3, [
          '0/0, ∞/∞ belirsizlikleri; L’Hôpital (uygulama)',
          'Trigonometrik özel limitler'
        ]),
        sonsuz: createKazanim('11_03', 'Sonsuz Limit ve Asimptot', Zorluk.ZOR, 2, [
          'Dikey ve yatay asimptot fikri',
          'Limit ile grafik davranışı'
        ])
      },
      onKosul: ['analitikGeometri'],
      sonraki: ['sureklilik']
    },
    sureklilik: {
      kod: 'AYT_MAT_12',
      ad: 'Süreklilik',
      zorluk: Zorluk.COK_ZOR,
      yuzde: 5,
      kazanimlar: {
        tanim: createKazanim('12_01', 'Süreklilik Tanımı', Zorluk.ZOR, 2, [
          'Bir noktada süreklilik: lim f = f(a)',
          'Sürekli fonksiyonların aralık üzerinde özellikleri'
        ]),
        sureksizlik: createKazanim('12_02', 'Süreksizlik Türleri', Zorluk.COK_ZOR, 2, [
          'Sıçrama, sürekli uzatılabilir süreksizlik',
          'Parçalı fonksiyonlarda sınır noktalarında süreklilik'
        ]),
        araDeger: createKazanim('12_03', 'Ara Değer ve Kavramlar', Zorluk.ZOR, 1, [
          'Ara değer teoreminin yorumu (uygulama fikri)',
          'Kapalı aralıkta sürekli fonksiyonun en büyük–en küçük değeri'
        ])
      },
      onKosul: ['limit'],
      sonraki: ['turev']
    },
    turev: {
      kod: 'AYT_MAT_13',
      ad: 'Türev ve Uygulamaları',
      zorluk: Zorluk.COK_ZOR,
      yuzde: 10,
      kazanimlar: {
        tanim: createKazanim('13_01', 'Türev Tanımı ve Kurallar', Zorluk.ZOR, 2, [
          'Tanım (fark oranı limiti), teğet eğimi',
          'Çarpım, bölüm, zincir kuralı; üstel ve logaritmik türev'
        ]),
        uygulama: createKazanim('13_02', 'Artan–Azalan ve Ekstremum', Zorluk.COK_ZOR, 3, [
          'Birinci türev testi, lokal ve mutlak ekstremum',
          'İkinci türev testi, büküm noktaları'
        ]),
        geometrik: createKazanim('13_03', 'Teğet, Normal ve Optimizasyon', Zorluk.COK_ZOR, 3, [
          'Teğet ve normal doğru denklemi',
          'Optimizasyon ve ilgili oran (bağlı nicelikler)'
        ]),
        fiziksel: createKazanim('13_04', 'Hız ve İvme', Zorluk.ZOR, 2, [
          'Konum–hız–ivme ilişkisi (türev uygulaması)'
        ])
      },
      onKosul: ['sureklilik'],
      sonraki: ['integral']
    },
    integral: {
      kod: 'AYT_MAT_14',
      ad: 'İntegral ve Uygulamaları',
      zorluk: Zorluk.COK_ZOR,
      yuzde: 10,
      kazanimlar: {
        belirsiz: createKazanim('14_01', 'Belirsiz İntegral', Zorluk.COK_ZOR, 2, [
          'Antiderivatif, temel integrasyon kuralları',
          'Değişken değiştirme ve kısmi integral (temel)'
        ]),
        belirli: createKazanim('14_02', 'Belirli İntegral ve Alan', Zorluk.COK_ZOR, 3, [
          'Belirli integral özellikleri, alan hesabı',
          'İki eğri arasındaki alan'
        ]),
        hacim: createKazanim('14_03', 'Hacim ve Uygulamalar', Zorluk.COK_ZOR, 3, [
          'x ekseni etrafında dönen cismin hacmi',
          'Yay uzunluğu (özet)'
        ]),
        improper: createKazanim('14_04', 'İmproper İntegral', Zorluk.COK_ZOR, 2, [
          'Sınırsız aralıkta ve sınırsız fonksiyonda integral (tanım)'
        ])
      },
      onKosul: ['turev'],
      sonraki: []
    }
  },
  kaynaklar: ['MEB Matematik Öğretim Programı (12. sınıf)', 'ÖSYM YKS AYT Matematik testi yapısı'],
  tavsiyeler: [
    'Konu sırası: köprü → cebir → analiz öncesi → analiz (limit–süreklilik–türev–integral)',
    'Çok sayıda çözülmüş soru ve grafik yorumu',
    'Türev–integral bağını (FTC) pekiştirin'
  ]
};

const AYT_GEO = {
  kod: 'AYT_GEO',
  ad: 'AYT Geometri',
  soru: 10,
  yuzde: 100,
  konular: {
    s9Ucgenler: {
      kod: 'AYT_GEO_01',
      ad: '9. Sınıf — Üçgenler',
      zorluk: Zorluk.ZOR,
      yuzde: 18,
      kazanimlar: {
        eslik: createKazanim('G01_01', 'Üçgenlerin Eşliği', Zorluk.ZOR, 3, [
          'K-K-K, K-A-K, A-K-A eşlik kuralları',
          'Üçgen eşliğini ispat ve kurma'
        ]),
        benzerlik: createKazanim('G01_02', 'Üçgenlerin Benzerliği', Zorluk.COK_ZOR, 3, [
          'Benzerlik oranı, A-A ve K-A-K benzerlikleri',
          'Benzerlikte alan–kenar ilişkisi (kare oranı)'
        ]),
        yardimci: createKazanim('G01_03', 'Üçgenin Yardımcı Elemanları', Zorluk.COK_ZOR, 3, [
          'Açıortay ve kenarortay teoremleri (temel)',
          'Yükseklik ve diklik kavramı'
        ]),
        dikUcgenTrig: createKazanim('G01_04', 'Dik Üçgen ve Trigonometri', Zorluk.COK_ZOR, 3, [
          'Pisagor, öklid ve yükseklik bağıntıları',
          'Dar açılı trigonometrik oranlar (sin, cos, tan, cot)'
        ]),
        alan: createKazanim('G01_05', 'Üçgenin Alanı', Zorluk.ZOR, 2, [
          'Taban × yükseklik / 2, iki kenar ve aradaki açı',
          'Üçgen alanı ve benzerlikle ilişki'
        ])
      },
      onKosul: ['TYT_MAT'],
      sonraki: ['s10DortgenCokgen']
    },
    s10DortgenCokgen: {
      kod: 'AYT_GEO_02',
      ad: '10. Sınıf — Dörtgenler ve Çokgenler',
      zorluk: Zorluk.ZOR,
      yuzde: 14,
      kazanimlar: {
        dortgen: createKazanim('G02_01', 'Dörtgenler ve Özellikleri', Zorluk.ZOR, 3, [
          'Paralelkenar, dikdörtgen, kare, eşkenar dörtgen, yamuk',
          'Köşegen ve açı özellikleri'
        ]),
        ozelDortgen: createKazanim('G02_02', 'Özel Dörtgenler', Zorluk.COK_ZOR, 3, [
          'Deltoid, dik yamuk, ikizkenar yamuk özellikleri',
          'Çokgen iç açıları ve dış açıları toplamı'
        ])
      },
      onKosul: ['s9Ucgenler'],
      sonraki: ['s10KatıCisim']
    },
    s10KatıCisim: {
      kod: 'AYT_GEO_03',
      ad: '10. Sınıf — Geometrik Cisimler',
      zorluk: Zorluk.COK_ZOR,
      yuzde: 12,
      kazanimlar: {
        yuzeyHacim: createKazanim('G03_01', 'Katı Cisimlerin Yüzey Alanları ve Hacimleri', Zorluk.COK_ZOR, 4, [
          'Prizma, piramit, koni, silindir, küp için alan–hacim',
          'Kesit düzlemi ile oluşan şekiller (temel)'
        ])
      },
      onKosul: ['s10DortgenCokgen'],
      sonraki: ['s11Trigonometri']
    },
    s11Trigonometri: {
      kod: 'AYT_GEO_04',
      ad: '11. Sınıf — Trigonometri (Geometri)',
      zorluk: Zorluk.COK_ZOR,
      yuzde: 12,
      kazanimlar: {
        yonluAci: createKazanim('G04_01', 'Yönlü Açılar', Zorluk.ZOR, 2, [
          'Birim çember, açıların ölçüsü ve yönü',
          'Derece–radyan dönüşümü (temel)'
        ]),
        trigFonks: createKazanim('G04_02', 'Trigonometrik Fonksiyonlar', Zorluk.COK_ZOR, 3, [
          'sin, cos, tan, cot tanımları ve işaretleri',
          'Trigonometrik özdeşlikler (temel) ve basit denklemler'
        ])
      },
      onKosul: ['s10KatıCisim'],
      sonraki: ['s11Analitik']
    },
    s11Analitik: {
      kod: 'AYT_GEO_05',
      ad: '11. Sınıf — Analitik Geometri',
      zorluk: Zorluk.COK_ZOR,
      yuzde: 14,
      kazanimlar: {
        dogruAnalitik: createKazanim('G05_01', 'Doğrunun Analitik İncelenmesi', Zorluk.COK_ZOR, 4, [
          'Nokta ve doğru denklemleri, eğim',
          'İki doğrunun paralel/dik olma koşulları',
          'Bir noktaya uzaklık ve doğru kümeleri (temel)'
        ])
      },
      onKosul: ['s11Trigonometri'],
      sonraki: ['s11CemberDaire']
    },
    s11CemberDaire: {
      kod: 'AYT_GEO_06',
      ad: '11. Sınıf — Çember ve Daire',
      zorluk: Zorluk.COK_ZOR,
      yuzde: 14,
      kazanimlar: {
        temel: createKazanim('G06_01', 'Çemberin Temel Elemanları', Zorluk.ZOR, 2, [
          'Kiriş, teğet, kesen; kiriş–merkez açı ilişkisi'
        ]),
        cemberAci: createKazanim('G06_02', 'Çemberde Açılar', Zorluk.COK_ZOR, 3, [
          'Merkez, çevre, iç ve dış açılar',
          'Kirişlerin kesiştiği açılar'
        ]),
        teget: createKazanim('G06_03', 'Çemberde Teğet', Zorluk.COK_ZOR, 3, [
          'Teğet–kip uzunlukları, teğet–çember merkezi ilişkisi'
        ]),
        cevreAlan: createKazanim('G06_04', 'Dairenin Çevresi ve Alanı', Zorluk.ZOR, 2, [
          'Yay uzunluğu, daire dilimi alanı',
          'Çember ve doğru konumları (kesişim, teğetlik)'
        ])
      },
      onKosul: ['s11Analitik'],
      sonraki: ['s11Uzay']
    },
    s11Uzay: {
      kod: 'AYT_GEO_07',
      ad: '11. Sınıf — Uzay Geometri',
      zorluk: Zorluk.COK_ZOR,
      yuzde: 8,
      kazanimlar: {
        katiCisim: createKazanim('G07_01', 'Katı Cisimler', Zorluk.COK_ZOR, 3, [
          'Çok yüzlü cisimler, prizma ve piramit',
          'Yüzey alanı ve hacim; gövde çaprazı (temel)'
        ])
      },
      onKosul: ['s11CemberDaire'],
      sonraki: ['s12Trigonometri']
    },
    s12Trigonometri: {
      kod: 'AYT_GEO_08',
      ad: '12. Sınıf — Trigonometri (Geometri)',
      zorluk: Zorluk.COK_ZOR,
      yuzde: 8,
      kazanimlar: {
        toplamFark: createKazanim('G08_01', 'Toplam – Fark ve İki Kat Açı Formülleri', Zorluk.COK_ZOR, 3, [
          'sin(a±b), cos(a±b), tan(a±b)',
          'sin2x, cos2x, tan2x dönüşümleri'
        ]),
        trigDenklem: createKazanim('G08_02', 'Trigonometrik Denklemler', Zorluk.COK_ZOR, 3, [
          'Birim çember üzerinde çözüm kümesi',
          'Basit trigonometrik denklem tipleri'
        ])
      },
      onKosul: ['s11Uzay'],
      sonraki: ['s12Donusum']
    },
    s12Donusum: {
      kod: 'AYT_GEO_09',
      ad: '12. Sınıf — Dönüşümler ve Çember Analitiği',
      zorluk: Zorluk.COK_ZOR,
      yuzde: 12,
      kazanimlar: {
        donusum: createKazanim('G09_01', 'Analitik Düzlemde Temel Dönüşümler', Zorluk.COK_ZOR, 3, [
          'Öteleme, simetri, dönme (temel matris veya geometrik)',
          'Nokta ve doğru dönüşümleri'
        ]),
        cemberAnalitik: createKazanim('G09_02', 'Çemberin Analitik İncelenmesi', Zorluk.COK_ZOR, 3, [
          '(x-a)²+(y-b)²=r² çember denklemi',
          'Teğet ve kesen doğruların çemberle analitik ilişkisi'
        ])
      },
      onKosul: ['s12Trigonometri'],
      sonraki: []
    }
  },
  kaynaklar: ['MEB Geometri Öğretim Programı (9–12)', 'Kitapseç AYT Geometri konu listesi'],
  tavsiyeler: ['Çizim ve şekil yorumu', 'Analitik–sentetik birlikte çalışın', 'Çember–üçgen ilişkisini pekiştirin']
};

// ============================================
// AYT FEN BİLİMLERİ (AYT Sayısal)
// ============================================
const AYT_FIZ = {
  kod: 'AYT_FIZ',
  ad: 'AYT Fizik',
  soru: 14,
  yuzde: 100,
  konular: {
    s9GirisMadde: {
      kod: 'AYT_FIZ_01',
      ad: '9. Sınıf — Fizik Bilimine Giriş ve Madde',
      zorluk: Zorluk.ORTA,
      yuzde: 6,
      kazanimlar: {
        bilimselYontem: createKazanim('F01_01', 'Fizik Bilimine Giriş', Zorluk.KOLAY, 2, [
          'Ölçme, birimler, anlamlı rakam',
          'Model, deney ve grafik yorumu'
        ]),
        katilarAkiskanlar: createKazanim('F01_02', 'Katılar ve Akışkanlar', Zorluk.ORTA, 2, [
          'Basınç, kaldırma kuvveti (Arşimet)',
          'Akışkanlarda hız ve süreklilik (temel)'
        ])
      },
      onKosul: ['TYT_FEN'],
      sonraki: ['s9HareketEnerji']
    },
    s9HareketEnerji: {
      kod: 'AYT_FIZ_02',
      ad: '9. Sınıf — Hareket, Kuvvet ve Enerji',
      zorluk: Zorluk.ZOR,
      yuzde: 10,
      kazanimlar: {
        birBoyutHareket: createKazanim('F02_01', 'Bir Boyutta Hareket', Zorluk.ZOR, 2, [
          'Konum, yer değiştirme, hız, ivme',
          'Grafikten kinematik okuma'
        ]),
        kuvvetNewton: createKazanim('F02_02', 'Kuvvet ve Newton Yasaları', Zorluk.ZOR, 3, [
          'Net kuvvet, sürtünme, eğik düzlem',
          'Newton’un üç yasası ve uygulamaları'
        ]),
        isEnerji: createKazanim('F02_03', 'İş, Enerji ve Güç', Zorluk.ZOR, 3, [
          'İş–enerji teoremi, kinetik ve potansiyel enerji',
          'Mekanik enerji korunumu, verim'
        ])
      },
      onKosul: ['s9GirisMadde'],
      sonraki: ['s9Isi']
    },
    s9Isi: {
      kod: 'AYT_FIZ_03',
      ad: '9. Sınıf — Isı ve Sıcaklık',
      zorluk: Zorluk.ZOR,
      yuzde: 6,
      kazanimlar: {
        isiSicaklik: createKazanim('F03_01', 'Isı, Sıcaklık ve İç Enerji', Zorluk.ZOR, 2, [
          'Hal değişimi, ısı sığası, buharlaşma gizil ısısı',
          'Isıl denge ve enerji iletimi (iletim–taşınım–ışınım)'
        ]),
        genlesme: createKazanim('F03_02', 'Genleşme', Zorluk.ORTA, 2, [
          'Doğrusal, yüzeysel ve hacimsel genleşme katsayıları'
        ])
      },
      onKosul: ['s9HareketEnerji'],
      sonraki: ['s10ElektrikDalgaOptik']
    },
    s10ElektrikDalgaOptik: {
      kod: 'AYT_FIZ_04',
      ad: '10. Sınıf — Elektrik, Dalgalar ve Optik',
      zorluk: Zorluk.COK_ZOR,
      yuzde: 10,
      kazanimlar: {
        elektrikTemel: createKazanim('F04_01', 'Elektrik Yükleri ve Devreler', Zorluk.COK_ZOR, 3, [
          'Coulomb kuvveti, elektrik alan ve potansiyel (temel)',
          'Ohm yasası, seri–paralel devreler, Kirchhoff (temel)'
        ]),
        manyetikEtki: createKazanim('F04_02', 'Akım ve Manyetik Alan İlişkisi', Zorluk.COK_ZOR, 2, [
          'Düz iletken üzerinde manyetik kuvvet, sol-el kuralı',
          'Basit elektromıknatıs ve motor prensibi'
        ]),
        dalgaOzet: createKazanim('F04_03', 'Dalga ve Deprem Dalgaları', Zorluk.ZOR, 2, [
          'Dalga hızı, frekans, dalga boyu',
          'Su dalgası ve deprem dalgaları (P-S fikri)'
        ]),
        optikOzet: createKazanim('F04_04', 'Optik (Özet)', Zorluk.COK_ZOR, 2, [
          'Yansıma, kırılma, indis, aynalar ve mercekler (temel)'
        ])
      },
      onKosul: ['s9Isi'],
      sonraki: ['s11KuvvetHareket']
    },
    s11KuvvetHareket: {
      kod: 'AYT_FIZ_05',
      ad: '11. Sınıf — Kuvvet ve Hareket',
      zorluk: Zorluk.COK_ZOR,
      yuzde: 22,
      kazanimlar: {
        vektorBagil: createKazanim('F05_01', 'Vektörler ve Bağıl Hareket', Zorluk.COK_ZOR, 3, [
          'Vektör toplama, bileşenler, birim vektörler',
          'Bağıl hız (bir boyut ve düzlemde temel)'
        ]),
        newtonIvmeli: createKazanim('F05_02', 'Newton ve İvmeli Hareket', Zorluk.COK_ZOR, 3, [
          'İki boyutta hareket, projectile (atış) hareketi',
          'Sürtünme ve merkezcil kuvvet (temel)'
        ]),
        enerjiItme: createKazanim('F05_03', 'Enerji, İtme ve Momentum', Zorluk.COK_ZOR, 3, [
          'İtme–momentum, elastik–inelastik çarpışma (temel)',
          'Tork, denge ve basit makineler'
        ])
      },
      onKosul: ['s10ElektrikDalgaOptik'],
      sonraki: ['s11ElektrikManyetizma']
    },
    s11ElektrikManyetizma: {
      kod: 'AYT_FIZ_06',
      ad: '11. Sınıf — Elektrik ve Manyetizma',
      zorluk: Zorluk.COK_ZOR,
      yuzde: 20,
      kazanimlar: {
        alanPotansiyel: createKazanim('F06_01', 'Elektriksel Kuvvet, Alan ve Potansiyel', Zorluk.COK_ZOR, 4, [
          'Coulomb ve elektrik alan (nokta yük, düzgün alan)',
          'Elektriksel potansiyel ve potansiyel farkı'
        ]),
        sigac: createKazanim('F06_02', 'Düzgün Elektrik Alan ve Sığa', Zorluk.COK_ZOR, 3, [
          'Yalıtkan ve iletken plakalar, sığa ve enerji depolama',
          'Seri–paralel sığa bağlantıları'
        ]),
        manyetizmaInduksiyon: createKazanim('F06_03', 'Manyetizma ve İndüksiyon', Zorluk.COK_ZOR, 4, [
          'Manyetik alan, akım üzerindeki kuvvet',
          'Faraday indüksiyonu, Lenz kuralı, alternatif akım ve transformatör (temel)'
        ])
      },
      onKosul: ['s11KuvvetHareket'],
      sonraki: ['s12CemberselBHH']
    },
    s12CemberselBHH: {
      kod: 'AYT_FIZ_07',
      ad: '12. Sınıf — Çembersel Hareket ve Basit Harmonik Hareket',
      zorluk: Zorluk.COK_ZOR,
      yuzde: 14,
      kazanimlar: {
        cembersel: createKazanim('F07_01', 'Düzgün Çembersel Hareket ve Açısal Büyüklükler', Zorluk.COK_ZOR, 3, [
          'Merkezcil ivme ve kuvvet, açısal hız ve ivme',
          'Dönerek öteleme, açısal momentum (temel)'
        ]),
        kepler: createKazanim('F07_02', 'Kütle Çekim ve Kepler Yasaları', Zorluk.COK_ZOR, 2, [
          'Yerçekimi ivmesi ve yörüngeler (temel)',
          'Kepler kanunları ve gezegen hareketi'
        ]),
        bhh: createKazanim('F07_03', 'Basit Harmonik Hareket', Zorluk.COK_ZOR, 3, [
          'Yay–kütle sistemi, periyot ve enerji',
          'Basit sarkaç ve grafik yorumu'
        ])
      },
      onKosul: ['s11ElektrikManyetizma'],
      sonraki: ['s12DalgaModern']
    },
    s12DalgaModern: {
      kod: 'AYT_FIZ_08',
      ad: '12. Sınıf — Dalga Mekaniği ve Modern Fizik',
      zorluk: Zorluk.COK_ZOR,
      yuzde: 12,
      kazanimlar: {
        dalgaMekanigi: createKazanim('F08_01', 'Dalga Mekaniği ve Elektromanyetik Dalgalar', Zorluk.COK_ZOR, 3, [
          'Girişim, kırınım, Doppler olayı',
          'Elektromanyetik spektrum ve dalga özellikleri'
        ]),
        atomRadyoaktivite: createKazanim('F08_02', 'Atom Fiziğine Giriş ve Radyoaktivite', Zorluk.COK_ZOR, 3, [
          'Atom modelleri, çekirdek tepkimeleri (alfa–beta–gamma)',
          'Yarı ömür ve korunum yasaları (temel)'
        ]),
        modern: createKazanim('F08_03', 'Modern Fizik ve Uygulamalar', Zorluk.COK_ZOR, 3, [
          'Özel görelilik (temel sonuçlar), fotoelektrik ve Compton (temel)',
          'Büyük patlama kozmolojisi ve parçacık fiziği (özet)'
        ])
      },
      onKosul: ['s12CemberselBHH'],
      sonraki: []
    }
  },
  kaynaklar: ['MEB Fizik Öğretim Programı (9–12)', 'Kitapseç AYT Fizik konu listesi'],
  tavsiyeler: ['Birim analizi ve vektör çizimi', 'Elektrik–manyetizmayı şema ile çalışın', 'Grafik–alan altı iş–enerji ilişkisi']
};

const AYT_KIM = {
  kod: 'AYT_KIM',
  ad: 'AYT Kimya',
  soru: 13,
  yuzde: 100,
  konular: {
    s9KimyaTemel: {
      kod: 'AYT_KIM_01',
      ad: '9. Sınıf — Kimya Bilimi, Atom ve Bağlar',
      zorluk: Zorluk.ZOR,
      yuzde: 18,
      kazanimlar: {
        kimyaBilimi: createKazanim('K01_01', 'Kimya Bilimi', Zorluk.ORTA, 2, [
          'Nicelik, birim, ölçme ve güvenlik',
          'Saf madde, karışım, homojen–heterojen ayrımı'
        ]),
        atomPeriyodik: createKazanim('K01_02', 'Atom ve Periyodik Sistem', Zorluk.COK_ZOR, 3, [
          'Elektron dizilimi, periyodik özellikler (atom yarıçapı, iyonlaşma enerjisi, elektronegatiflik)',
          'İyon ve izotop kavramları'
        ]),
        etkilesimMaddeninHalleri: createKazanim('K01_03', 'Kimyasal Türler Arası Etkileşimler ve Maddenin Halleri', Zorluk.COK_ZOR, 3, [
          'İyonik, kovalent, metalik bağ; VSEPR ve polarlık (temel)',
          'Hal değişimleri, grafik yorumu ve stokiyometriye köprü'
        ])
      },
      onKosul: ['TYT_FEN'],
      sonraki: ['s10KarisimAsit']
    },
    s10KarisimAsit: {
      kod: 'AYT_KIM_02',
      ad: '10. Sınıf — Karışımlar ve Asit–Baz–Tuz',
      zorluk: Zorluk.COK_ZOR,
      yuzde: 16,
      kazanimlar: {
        karisimlar: createKazanim('K02_01', 'Karışımlar', Zorluk.COK_ZOR, 3, [
          'Çözelti, molarite, seyreltme ve karışım hesapları',
          'Ayırma ve saflaştırma (temel)'
        ]),
        asitBazTuz: createKazanim('K02_02', 'Asitler, Bazlar ve Tuzlar', Zorluk.COK_ZOR, 3, [
          'Arrhenius ve Brønsted–Lowry; pH ve pOH',
          'Nötralleşme tepkimeleri ve tuz hidrolizi (temel)'
        ]),
        kimyaHerYerde: createKazanim('K02_03', 'Kimya Her Yerde', Zorluk.ORTA, 2, [
          'Günlük hayat ve endüstride kimya örnekleri',
          'Çevre ve sürdürülebilirlik bağlamı'
        ])
      },
      onKosul: ['s9KimyaTemel'],
      sonraki: ['s11ModernGazCozeltiler']
    },
    s11ModernGazCozeltiler: {
      kod: 'AYT_KIM_03',
      ad: '11. Sınıf — Modern Atom, Gazlar ve Çözeltiler',
      zorluk: Zorluk.COK_ZOR,
      yuzde: 22,
      kazanimlar: {
        modernAtom: createKazanim('K03_01', 'Modern Atom Teorisi', Zorluk.COK_ZOR, 3, [
          'Kuantum sayıları, orbital ve elektron konfigürasyonu',
          'Hibritleşme ve molekül geometrisi (VSEPR)'
        ]),
        gazlar: createKazanim('K03_02', 'Gazlar', Zorluk.COK_ZOR, 3, [
          'İdeal gaz denklemi, kısmi basınç, gaz karışımları',
          'Grafiklerden nicelik okuma (P–V–T)'
        ]),
        siviCozeltiler: createKazanim('K03_03', 'Sıvı Çözeltiler ve Çözünürlük', Zorluk.COK_ZOR, 3, [
          'Çözünürlük, doygunluk, Ksp (çözünürlük dengesi)',
          'İyon çarpımı ve çökelti oluşumu'
        ])
      },
      onKosul: ['s10KarisimAsit'],
      sonraki: ['s11TepkimeEnerjiDenge']
    },
    s11TepkimeEnerjiDenge: {
      kod: 'AYT_KIM_04',
      ad: '11. Sınıf — Tepkimelerde Enerji, Hız ve Denge',
      zorluk: Zorluk.COK_ZOR,
      yuzde: 22,
      kazanimlar: {
        enerji: createKazanim('K04_01', 'Kimyasal Tepkimelerde Enerji', Zorluk.COK_ZOR, 3, [
          'Entalpi, Hess yasası, oluş entalpisi',
          'Bağ enerjisi ve tepkime ısısı yorumu'
        ]),
        hiz: createKazanim('K04_02', 'Kimyasal Tepkimelerde Hız', Zorluk.COK_ZOR, 3, [
          'Tepkime hızı, çarpışma teorisi (temel), aktivasyon enerjisi',
          'Katalizör ve grafikten hız analizi'
        ]),
        denge: createKazanim('K04_03', 'Kimyasal Tepkimelerde Denge', Zorluk.COK_ZOR, 4, [
          'Kc, Kp ve heterojen denge',
          'Le Chatelier ile denge kayması; asit–baz ve tampon (AYT derinliği)'
        ])
      },
      onKosul: ['s11ModernGazCozeltiler'],
      sonraki: ['s12ElektroOrg']
    },
    s12ElektroOrg: {
      kod: 'AYT_KIM_05',
      ad: '12. Sınıf — Elektrokimya ve Organik Kimya',
      zorluk: Zorluk.COK_ZOR,
      yuzde: 22,
      kazanimlar: {
        elektrokimya: createKazanim('K05_01', 'Kimya ve Elektrik', Zorluk.COK_ZOR, 4, [
          'Redoks, yarım tepkimeler ve elektrot potansiyeli',
          'Galvanik hücre, elektroliz ve Faraday hesapları (temel)'
        ]),
        karbonKimyasi: createKazanim('K05_02', 'Karbon Kimyasına Giriş ve Organik Bileşikler', Zorluk.COK_ZOR, 4, [
          'İsimlendirme, izomerlik, fonksiyonel gruplar',
          'Alkan, alken, alkin, aromatikler ve temel tepkimeler (yerine girme, katılma, oksidasyon)'
        ]),
        enerjiGelisme: createKazanim('K05_03', 'Enerji Kaynakları ve Bilimsel Gelişmeler', Zorluk.ORTA, 2, [
          'Yakıtlar, yenilenebilir enerji ve çevresel etki',
          'Nanokimya ve malzeme örnekleri (özet)'
        ])
      },
      onKosul: ['s11TepkimeEnerjiDenge'],
      sonraki: []
    }
  },
  kaynaklar: ['MEB Kimya Öğretim Programı (9–12)', 'Kitapseç AYT Kimya konu listesi'],
  tavsiyeler: ['Mol ve konsantrasyon hesabını günlük tekrarlayın', 'Redoks ve organik tepkimeleri ok-yaz denkleştirin', 'Grafik ve tablo sorularına alışın']
};

const AYT_BIY = {
  kod: 'AYT_BIY',
  ad: 'AYT Biyoloji',
  soru: 13,
  yuzde: 100,
  konular: {
    s9YasamVeCesitlilik: {
      kod: 'AYT_BIY_01',
      ad: '9. Sınıf — Yaşam Bilimi, Hücre ve Çeşitlilik',
      zorluk: Zorluk.ZOR,
      yuzde: 14,
      kazanimlar: {
        bilimVeBiyoloji: createKazanim('B01_01', 'Bilimsel Bilginin Doğası ve Biyoloji', Zorluk.ORTA, 2, [
          'Bilimsel yöntem, hipotez ve deney tasarımı',
          'Teori, kanun ve model ayrımı'
        ]),
        canliOrtak: createKazanim('B01_02', 'Canlıların Ortak Özellikleri ve Hücre', Zorluk.ZOR, 3, [
          'Prokaryot–ökaryot; organel yapı ve işlev özeti',
          'Hücre zarı ve madde geçişi (özet)'
        ]),
        ortakBilesenler: createKazanim('B01_03', 'Ortak Bileşikler ve Sınıflandırma', Zorluk.ZOR, 3, [
          'Karbonhidrat, lipit, protein, nükleik asit',
          'Canlıların çeşitliliği ve sınıflandırma ilkeleri'
        ]),
        cevre: createKazanim('B01_04', 'Güncel Çevre Sorunları', Zorluk.ORTA, 2, [
          'Biyoçeşitlilik, kirlilik ve iklim değişikliği (temel)'
        ])
      },
      onKosul: ['TYT_FEN'],
      sonraki: ['s10UremeKalitimEko']
    },
    s10UremeKalitimEko: {
      kod: 'AYT_BIY_02',
      ad: '10. Sınıf — Üreme, Kalıtım ve Ekosistem',
      zorluk: Zorluk.COK_ZOR,
      yuzde: 18,
      kazanimlar: {
        ureme: createKazanim('B02_01', 'Mitoz, Eşeysiz Üreme, Mayoz ve Eşeyli Üreme', Zorluk.COK_ZOR, 4, [
          'Hücre döngüsü, mitoz ve mayoz karşılaştırması',
          'Gamet, döllenme ve büyüme–gelişme (temel)'
        ]),
        kalitim: createKazanim('B02_02', 'Kalıtımın Genel İlkeleri', Zorluk.COK_ZOR, 4, [
          'Mendel genetiği, kan grupları ve kalıtım problemleri',
          'Mutasyon ve çeşitlilik'
        ]),
        ekosistem: createKazanim('B02_03', 'Ekosistem Ekolojisi', Zorluk.COK_ZOR, 3, [
          'Besin zinciri–ağı, enerji akışı ve madde döngüleri',
          'Populasyon ve topluluk düzeyi etkileşimler (temel)'
        ])
      },
      onKosul: ['s9YasamVeCesitlilik'],
      sonraki: ['s11InsanFizyolojiEko']
    },
    s11InsanFizyolojiEko: {
      kod: 'AYT_BIY_03',
      ad: '11. Sınıf — İnsan Fizyolojisi ve Ekoloji',
      zorluk: Zorluk.COK_ZOR,
      yuzde: 36,
      kazanimlar: {
        sinirEndokrinDuyu: createKazanim('B03_01', 'Denetleyici ve Düzenleyici Sistem, Duyu Organları', Zorluk.COK_ZOR, 4, [
          'Sinir sistemi, nöron ve sinaps; refleks yayı',
          'Endokrin bezler ve hormonlar; homeostazi',
          'Göz ve kulak yapısı–işlevi'
        ]),
        destekHareket: createKazanim('B03_02', 'Destek ve Hareket Sistemi', Zorluk.ZOR, 2, [
          'Kemik, eklem ve kas tipleri; kas kasılması'
        ]),
        sindirimDolasim: createKazanim('B03_03', 'Sindirim ve Dolaşım (Bağışıklık ile ilişki)', Zorluk.COK_ZOR, 4, [
          'Sindirim enzimleri ve emilim',
          'Kalp–damar, kan grupları ve bağışıklık (temel)'
        ]),
        solunumBosaltimUreme: createKazanim('B03_04', 'Solunum, Üriner ve Üreme Sistemleri', Zorluk.COK_ZOR, 4, [
          'Gaz alışverişi ve solunum kontrolü',
          'Böbrek ve idrar oluşumu',
          'Üreme organları ve embriyonik gelişim (temel)'
        ]),
        komunitPop: createKazanim('B03_05', 'Komünite ve Popülasyon Ekolojisi', Zorluk.COK_ZOR, 3, [
          'Populasyon büyümesi, taşıma kapasitesi',
          'Komünitede rekabet, av–avcı, parazitlik (temel)'
        ])
      },
      onKosul: ['s10UremeKalitimEko'],
      sonraki: ['s12GenEnerjiBitki']
    },
    s12GenEnerjiBitki: {
      kod: 'AYT_BIY_04',
      ad: '12. Sınıf — Genden Proteine, Enerji ve Bitki Biyolojisi',
      zorluk: Zorluk.COK_ZOR,
      yuzde: 32,
      kazanimlar: {
        genetikKod: createKazanim('B04_01', 'Nükleik Asitler, Genetik Şifre ve Protein Sentezi', Zorluk.COK_ZOR, 4, [
          'DNA–RNA yapısı, replikasyon ve transkripsiyon–translasyon',
          'Genetik kod, mutasyon ve gen düzenlemesi (temel)'
        ]),
        enerji: createKazanim('B04_02', 'Canlılık ve Enerji; Fotosentez, Kemosentez, Hücresel Solunum', Zorluk.COK_ZOR, 4, [
          'ATP ve metabolik yol özetleri',
          'Fotosentez reaksiyonları ve solunum tipleri (aerobik–anaerobik)'
        ]),
        bitki: createKazanim('B04_03', 'Bitki Biyolojisi', Zorluk.COK_ZOR, 3, [
          'Bitki dokuları, kök–gövde–yaprak',
          'Bitki hormonları ve üreme (temel)'
        ]),
        canliCevre: createKazanim('B04_04', 'Canlılar ve Çevre', Zorluk.ORTA, 2, [
          'Biyoçeşitlilik koruma ve sürdürülebilirlik',
          'İklim ve ekosistem hizmetleri (özet)'
        ])
      },
      onKosul: ['s11InsanFizyolojiEko'],
      sonraki: []
    }
  },
  kaynaklar: ['MEB Biyoloji Öğretim Programı (9–12)', 'Kitapseç AYT Biyoloji konu listesi'],
  tavsiyeler: ['Şema ve süreç akışları çizin', 'Genetik ve ekoloji için grafik yorumu', 'Fizyolojide organ–görev eşlemesi']
};

// ============================================
// AYT SÖZEL DERSLER
// ============================================

const AYT_EDEB = {
  kod: 'AYT_EDEB',
  ad: 'AYT Türk Dili ve Edebiyatı',
  soru: 24,
  yuzde: 100,
  konular: {
    metinTurleriS9: {
      kod: 'AYT_EDB_01',
      ad: '9. Sınıf — Metin Türleri',
      zorluk: Zorluk.ZOR,
      yuzde: 14,
      kazanimlar: {
        turler: createKazanim('E01_01', 'Hikâye, Şiir, Masal, Fabl, Roman', Zorluk.ZOR, 3, [
          'Türün özgün özellikleri, öykü unsurları',
          'Roman türleri ve anlatıcı türleri (temel)'
        ]),
        tiyatro: createKazanim('E01_02', 'Tiyatro', Zorluk.ZOR, 2, [
          'Trajedi, komedi, dram; diyalog ve sahne ögesi'
        ]),
        biyografiOtobiyografi: createKazanim('E01_03', 'Biyografi ve Otobiyografi', Zorluk.ORTA, 2, [
          'Gerçek yaşam anlatısı, öznel–nesnel anlatım'
        ]),
        mektupEpostaGunlukBlog: createKazanim('E01_04', 'Mektup, E-Posta, Günlük, Blog', Zorluk.ORTA, 2, [
          'Üslup, hitap ve amaç–alıcıya göre metin'
        ])
      },
      onKosul: ['TYT_TURKCE'],
      sonraki: ['metinTurleriS10']
    },
    metinTurleriS10: {
      kod: 'AYT_EDB_02',
      ad: '10. Sınıf — Metin Türleri',
      zorluk: Zorluk.ZOR,
      yuzde: 14,
      kazanimlar: {
        turler: createKazanim('E02_01', 'Hikâye, Şiir, Destan, Efsane, Roman', Zorluk.ZOR, 3, [
          'Sözlü ve yazılı anlatı geleneği',
          'Destan–efsane farkı ve motifler'
        ]),
        tiyatro: createKazanim('E02_02', 'Tiyatro', Zorluk.ZOR, 2, ['Perde, sahne ve diyalog yapısı']),
        aniHatira: createKazanim('E02_03', 'Anı ve Hatıra', Zorluk.ORTA, 2, ['Yaşanmışlık ve anlatı güvenirliği']),
        haberGezi: createKazanim('E02_04', 'Haber Metni ve Gezi Yazısı', Zorluk.ZOR, 2, [
          '5N1K, objektiflik; gezide gözlem ve betimleme'
        ])
      },
      onKosul: ['metinTurleriS9'],
      sonraki: ['metinTurleriS11']
    },
    metinTurleriS11: {
      kod: 'AYT_EDB_03',
      ad: '11. Sınıf — Metin Türleri',
      zorluk: Zorluk.COK_ZOR,
      yuzde: 14,
      kazanimlar: {
        turler: createKazanim('E03_01', 'Hikâye, Şiir, Makale', Zorluk.COK_ZOR, 3, [
          'Makalede tez, argüman ve kanıt',
          'Şiirde ses ve anlam düzlemi'
        ]),
        sohbetFikra: createKazanim('E03_02', 'Sohbet ve Fıkra', Zorluk.ZOR, 2, ['Söyleyiş özellikleri, mizah ve gönderme']),
        romanTiyatro: createKazanim('E03_03', 'Roman ve Tiyatro', Zorluk.ZOR, 2, ['Tema, çatışma, karakter']),
        elestriMulakatRoportaj: createKazanim('E03_04', 'Eleştiri, Mülakat, Röportaj', Zorluk.COK_ZOR, 3, [
          'Eleştiride ölçüt; röportajda soru–cevap düzeni'
        ])
      },
      onKosul: ['metinTurleriS10'],
      sonraki: ['metinTurleriS12']
    },
    metinTurleriS12: {
      kod: 'AYT_EDB_04',
      ad: '12. Sınıf — Metin Türleri',
      zorluk: Zorluk.COK_ZOR,
      yuzde: 12,
      kazanimlar: {
        turler: createKazanim('E04_01', 'Hikâye, Şiir, Roman', Zorluk.COK_ZOR, 3, [
          'Anlatı teknikleri ve zaman kullanımı',
          'Şiirde biçim–içerik ilişkisi'
        ]),
        tiyatro: createKazanim('E04_02', 'Tiyatro', Zorluk.ZOR, 2, ['Trajik ve komik çözümleme']),
        deneme: createKazanim('E04_03', 'Deneme', Zorluk.COK_ZOR, 3, [
          'Öznel düşünce, konu sınırlığı, düşünceyi geliştirme'
        ]),
        soylevNutuk: createKazanim('E04_04', 'Söylev ve Nutuk', Zorluk.ZOR, 2, [
          'Topluluk ikna edebiyatı, retorik unsurlar'
        ])
      },
      onKosul: ['metinTurleriS11'],
      sonraki: ['edebiyatTarihiVeSanatlar']
    },
    edebiyatTarihiVeSanatlar: {
      kod: 'AYT_EDB_05',
      ad: 'Türk ve Dünya Edebiyatı (Tarih ve Sanatlar)',
      zorluk: Zorluk.COK_ZOR,
      yuzde: 28,
      kazanimlar: {
        islamOncesiSonrasi: createKazanim('E05_01', 'İslamiyet Öncesi ve Sonrası Türk Edebiyatı', Zorluk.COK_ZOR, 4, [
          'Göktürk–Uygur; Karahanlı–Gazneli hatları',
          'Tema ve üslup özellikleri'
        ]),
        halkDivan: createKazanim('E05_02', 'Halk ve Divan Edebiyatı', Zorluk.COK_ZOR, 4, [
          'Anonim halk şiiri, aşık geleneği; divan nazım şekilleri ve aruz',
          'Önemli şair ve eserler (temel)'
        ]),
        tanzimatServetMilli: createKazanim('E05_03', 'Tanzimat, Servet-i Fünün, Fecr-i Ati, Milli Edebiyat', Zorluk.COK_ZOR, 4, [
          'Batılılaşma, roman ve tiyatro gelişimi',
          'Milli duygunun edebiyata yansıması'
        ]),
        cumhuriyet: createKazanim('E05_04', 'Cumhuriyet Dönemi ve Garip Sonrası', Zorluk.COK_ZOR, 4, [
          'Toplumsal gerçekçilik, modernizm akımları',
          'Önemli yazar–şair ve eser eşleştirmesi'
        ]),
        batıAkımları: createKazanim('E05_05', 'Batı Edebiyatı Akımları', Zorluk.COK_ZOR, 3, [
          'Klasikizm, romantizm, realizm, sembolizm (temel kavramlar)',
          'Temsil yazar ve eserler (özet)'
        ]),
        edebiSanatlar: createKazanim('E05_06', 'Edebi Sanatlar ve Şiir Bilgisi', Zorluk.COK_ZOR, 3, [
          'Tesbih, istiare, teşbih, kinaye, ironi vb.',
          'Nazım biçimleri ve ölçü'
        ])
      },
      onKosul: ['metinTurleriS12'],
      sonraki: ['anlamVeDil']
    },
    anlamVeDil: {
      kod: 'AYT_EDB_06',
      ad: 'Anlam Bilgisi ve Dil Bilgisi (AYT)',
      zorluk: Zorluk.ZOR,
      yuzde: 18,
      kazanimlar: {
        anlam: createKazanim('E06_01', 'Anlam Bilgisi', Zorluk.ZOR, 4, [
          'Sözcükte, cümlede ve paragrafta anlam',
          'Düşünceyi geliştirme yolları ve mantık bağları'
        ]),
        dilbilgisi: createKazanim('E06_02', 'Ses Bilgisi, Yazım ve Noktalama', Zorluk.ORTA, 2, [
          'TDK ilkeleri, büyük harf ve birleşik yazım',
          'Noktalama işaretlerinin anlama etkisi'
        ]),
        sozVarligi: createKazanim('E06_03', 'Söz Varlığı ve Cümle Bilgisi', Zorluk.ZOR, 3, [
          'Sözcük türleri, fiilimsi ve cümle öğeleri',
          'Anlatım bozuklukları (temel)'
        ])
      },
      onKosul: ['edebiyatTarihiVeSanatlar'],
      sonraki: []
    }
  },
  kaynaklar: ['MEB Türk Dili ve Edebiyatı Öğretim Programı (9–12)', 'Kitapseç AYT Türk Dili ve Edebiyatı metin türleri listesi'],
  tavsiyeler: ['Metin türü özelliklerini tablo ile özetleyin', 'Eser–yazar–dönem üçlüsünü tekrarlayın', 'Şiirde sanat ve aruz bilgisini pekiştirin']
};

const AYT_TARI_ORIAK_KONULAR = {
  tar9Temel: {
    kod: 'AYT_TAR_01',
    ad: '9. Sınıf — Tarih Bilimi ve İlk Uygarlıklar',
    zorluk: Zorluk.ZOR,
    yuzde: 12,
    kazanimlar: {
      tarihBilimi: createKazanim('T01_01', 'Tarih Bilimi', Zorluk.ORTA, 3, [
        'Tarihin konusu, zaman ve kronoloji',
        'Birincil–ikincil kaynak, eleştiri ve yorum'
      ]),
      uygarlikVeIlk: createKazanim('T01_02', 'Uygarlığın Doğuşu ve İlk Uygarlıklar', Zorluk.ZOR, 3, [
        'Neolitik devrim, yazı ve şehir',
        'Mezopotamya, Mısır, Anadolu uygarlıkları (temel)'
      ]),
      ilkTurkDevletleri: createKazanim('T01_03', 'İlk Türk Devletleri', Zorluk.COK_ZOR, 3, [
        'Asya ve İç Asya’da Türk siyasi teşekkülleri',
        'Kültür, ordu ve vergi yönetimi (temel)'
      ]),
      islamTarihi: createKazanim('T01_04', 'İslam Tarihi ve Uygarlığı (13. Yüzyıla Kadar)', Zorluk.COK_ZOR, 3, [
        'Hz. Muhammed dönemi ve dört halife',
        'Emevi–Abbasi ve bilim–kültür gelişmeleri'
      ]),
      turkIslam: createKazanim('T01_05', 'Türk–İslam Devletleri (10–13. Yüzyıllar)', Zorluk.COK_ZOR, 3, [
        'Karahanlılar, Gazneliler, Büyük Selçuklu Devleti',
        'Yerleşme, devletleşme ve kültür hayatı'
      ]),
      turkiye11_13: createKazanim('T01_06', 'Türkiye Tarihi (11–13. Yüzyıllar)', Zorluk.COK_ZOR, 3, [
        'Anadolu Selçuklu ve Beylikler dönemi',
        'Ticaret yolları ve şehir hayatı'
      ])
    },
    onKosul: ['TYT_TARI'],
    sonraki: ['tar10Osmanli']
  },
  tar10Osmanli: {
    kod: 'AYT_TAR_02',
    ad: '10. Sınıf — Osmanlı’da Beylikten İmparatorluğa',
    zorluk: Zorluk.COK_ZOR,
    yuzde: 14,
    kazanimlar: {
      beyliktenDevlete: createKazanim('T02_01', 'Beylikten Devlete', Zorluk.COK_ZOR, 3, [
        'Osmanlı’nın kuruluşu ve genişleme politikası',
        'Devlet teşkilatının temel yapısı'
      ]),
      dunyaGucu1453: createKazanim('T02_02', 'Dünya Gücü: Osmanlı (1453–1600)', Zorluk.COK_ZOR, 4, [
        'İstanbul’un fethi ve sonuçları',
        'Yavuz ve Kanuni dönemi; denizcilik ve fetihler'
      ]),
      arayis17: createKazanim('T02_03', 'Arayış Yılları (17. Yüzyıl)', Zorluk.ZOR, 3, [
        'Siyasi ve askeri krizler, reform arayışları',
        'Avrupa ile güç dengeleri'
      ]),
      avrupa18: createKazanim('T02_04', 'Avrupa ve Osmanlı (18. Yüzyıl)', Zorluk.COK_ZOR, 3, [
        'Islahatlar, Nizam-ı Cedid ve diplomasi',
        'Rus ve Avusturya ile mücadele'
      ]),
      enUzunYuzyil: createKazanim('T02_05', 'En Uzun Yüzyıl (1800–1922)', Zorluk.COK_ZOR, 3, [
        'Tanzimat, Meşrutiyet ve bölüşme süreçleri',
        'Trablusgarp ve Balkan savaşları'
      ])
    },
    onKosul: ['tar9Temel'],
    sonraki: ['tar11Modern']
  },
  tar11Modern: {
    kod: 'AYT_TAR_03',
    ad: '11. Sınıf — Modernleşme, Milli Mücadele ve Cumhuriyet',
    zorluk: Zorluk.COK_ZOR,
    yuzde: 38,
    kazanimlar: {
      osmanliSiyaset1595: createKazanim('T03_01', 'Değişen Dünya Dengeleri Karşısında Osmanlı (1595–1774)', Zorluk.COK_ZOR, 2, [
        'İç ve dış isyanlar, sınır politikaları'
      ]),
      degisimAvrupa: createKazanim('T03_02', 'Değişim Çağında Avrupa ve Osmanlı', Zorluk.COK_ZOR, 2, [
        'Aydınlanma, sanayi ve sömürgecilik'
      ]),
      uluslararasi1774: createKazanim('T03_03', 'Uluslararası İlişkilerde Denge (1774–1914)', Zorluk.COK_ZOR, 3, [
        'Kırım ve 93 Harbi, Mısır ve Kavalalı meselesi',
        'Meşrutiyet ve anayasal denemeler'
      ]),
      devrimlerDevletToplum: createKazanim('T03_04', 'Devrimler Çağında Devlet–Toplum', Zorluk.ZOR, 2, [
        'Fransız ve Sanayi devrimlerinin yansımaları'
      ]),
      sermayeEmek: createKazanim('T03_05', 'Sermaye ve Emek', Zorluk.ZOR, 2, [
        'Kapitalizm, emek hareketleri (temel)'
      ]),
      gunlukHayat19_20: createKazanim('T03_06', '19. ve 20. Yüzyılda Gündelik Hayat', Zorluk.ZOR, 2, [
        'Kentleşme, iletişim ve yaşam tarzı değişimi'
      ]),
      inkilapProgrami: createKazanim('T03_07', 'T.C. İnkılap Tarihi ve Atatürkçülük (Program Üniteleri)', Zorluk.COK_ZOR, 4, [
        'Kurtuluş Savaşı hazırlığı, kongreler, TBMM',
        'Cepheler, antlaşmalar, Lozan ve ulusal egemenlik'
      ]),
      xxBaslari: createKazanim('T03_08', '20. Yüzyıl Başlarında Osmanlı ve Dünya', Zorluk.COK_ZOR, 3, [
        'I. Dünya Savaşı ve Osmanlı’nın durumu',
        'Mondros ve işgaller'
      ]),
      milliMucadele: createKazanim('T03_09', 'Milli Mücadele', Zorluk.COK_ZOR, 4, [
        'Cepheler, diplomatik başarı, misak ve meşruiyet'
      ]),
      ataturkculuk: createKazanim('T03_10', 'Atatürkçülük ve Türk İnkılabı', Zorluk.COK_ZOR, 4, [
        'Siyasi, hukuk, eğitim, ekonomi inkılapları',
        'Atatürk ilkeleri ve çağdaşlaşma'
      ])
    },
    onKosul: ['tar10Osmanli'],
    sonraki: ['tar11CagdasDunya']
  },
  tar11CagdasDunya: {
    kod: 'AYT_TAR_04',
    ad: '11. Sınıf — İki Savaş Arası, II. Dünya Savaşı ve Sonrası',
    zorluk: Zorluk.COK_ZOR,
    yuzde: 18,
    kazanimlar: {
      ikiSavasArasi: createKazanim('T04_01', 'İki Savaş Arasındaki Dönemde Türkiye ve Dünya', Zorluk.COK_ZOR, 3, [
        'Büyük Buhran, faşizm ve komünizm',
        'Türkiye’de çok partili denemeler ve dış politika'
      ]),
      ikinciDsSureci: createKazanim('T04_02', 'II. Dünya Savaşı Sürecinde Türkiye ve Dünya', Zorluk.COK_ZOR, 3, [
        'Savaşın sebepleri ve cepheler',
        'Türkiye’nin tarafsızlığı ve stratejik kararlar'
      ]),
      ikinciDsSonrasi: createKazanim('T04_03', 'II. Dünya Savaşı Sonrasında Türkiye ve Dünya', Zorluk.COK_ZOR, 3, [
        'BM, Soğuk Savaş ve bloklaşma',
        'Türkiye’de çok partili hayat ve ekonomik gelişmeler'
      ]),
      toplumsalDevrim: createKazanim('T04_04', 'Toplumsal Devrim Çağında Dünya ve Türkiye', Zorluk.COK_ZOR, 3, [
        'İnsan hakları, sosyal hareketler, küreselleşme öncesi'
      ]),
      yuzyilinEsigi: createKazanim('T04_05', 'Yüzyılın Eşiğinde Türkiye ve Dünya', Zorluk.COK_ZOR, 3, [
        'Avrupa Birliği süreci, bölgesel çatışmalar',
        'Bilgi toplumu ve çevre sorunları'
      ])
    },
    onKosul: ['tar11Modern'],
    sonraki: []
  }
};

const AYT_TAR1 = {
  kod: 'AYT_TAR1',
  ad: 'AYT Tarih-1',
  soru: 10,
  yuzde: 100,
  konular: AYT_TARI_ORIAK_KONULAR,
  kaynaklar: ['MEB Tarih Öğretim Programı (9–11)', 'Kitapseç AYT Tarih-1 konu listesi'],
  tavsiyeler: ['Kronoloji çizelgesi çıkarın', 'Harita ve antlaşma isimlerini eşleştirin', 'Neden–sonuç zinciri kurun']
};

const AYT_TAR2 = {
  kod: 'AYT_TAR2',
  ad: 'AYT Tarih-2',
  soru: 11,
  yuzde: 100,
  konular: AYT_TARI_ORIAK_KONULAR,
  kaynaklar: ['MEB Tarih Öğretim Programı (9–11)', 'Kitapseç AYT Tarih-2 konu listesi'],
  tavsiyeler: ['TAR-1 ile aynı müfredat çerçevesinde tekrar', 'ÖSYM soru köklerine göre konu dağılımını izleyin']
};

const AYT_COG_ORIAK_KONULAR = {
  dogalSistemler: {
    kod: 'AYT_COG_01',
    ad: 'Doğal Sistemler',
    zorluk: Zorluk.COK_ZOR,
    yuzde: 20,
    kazanimlar: {
      dogaInsan: createKazanim('C01_01', 'Doğa ve İnsan', Zorluk.ORTA, 2, [
        'Coğrafyanın doğa–insan ilişkisini inceleme biçimi',
        'Doğal kaynaklar ve sürdürülebilirlik (giriş)'
      ]),
      dunyaSekli: createKazanim('C01_02', 'Dünya’nın Şekli ve Hareketleri', Zorluk.ZOR, 3, [
        'Dönme, yıllık hareket ve mevsimler',
        'Işıma ve sıcaklık dağılışının coğrafi sonuçları'
      ]),
      cografiKonum: createKazanim('C01_03', 'Coğrafi Konum', Zorluk.ZOR, 2, [
        'Matematik, özel ve stratejik konum',
        'Paralel ve meridyenlerin etkisi'
      ]),
      harita: createKazanim('C01_04', 'Harita Bilgisi', Zorluk.ZOR, 3, [
        'Ölçek, projeksiyon ve koordinat',
        'İzohips, eğim ve bakı yorumu'
      ]),
      iklim: createKazanim('C01_05', 'İklim Bilgisi', Zorluk.COK_ZOR, 3, [
        'İklim elemanları ve iklim tipleri',
        'Küresel iklim değişikliği ve etkileri'
      ]),
      yerinSekillenmesi: createKazanim('C01_06', 'Yerin Şekillenmesi', Zorluk.COK_ZOR, 3, [
        'İç ve dış kuvvetler, volkan ve deprem',
        'Aşınım, birikim ve akarsu rejimi'
      ]),
      doganinVarliklari: createKazanim('C01_07', 'Doğanın Varlıkları', Zorluk.ZOR, 2, [
        'Toprak tipleri, bitki örtüsü ve ekosistemler',
        'Su kaynakları ve hidrografya'
      ])
    },
    onKosul: ['TYT_COG'],
    sonraki: ['beseriSistemler']
  },
  beseriSistemler: {
    kod: 'AYT_COG_02',
    ad: 'Beşeri Sistemler',
    zorluk: Zorluk.COK_ZOR,
    yuzde: 18,
    kazanimlar: {
      beseriYapi: createKazanim('C02_01', 'Beşeri Yapı', Zorluk.ZOR, 2, [
        'Nüfus piramidi, doğurganlık ve ölüm',
        'Nüfus politikaları'
      ]),
      nufus: createKazanim('C02_02', 'Nüfusun Gelişimi, Dağılışı ve Niteliği', Zorluk.COK_ZOR, 3, [
        'Yerleşme tipleri ve şehirleşme',
        'Kırsal–kentsel farklılıklar'
      ]),
      goc: createKazanim('C02_03', 'Göçlerin Nedenleri ve Sonuçları', Zorluk.COK_ZOR, 3, [
        'İç ve dış göç, mülteci ve ekonomik etkiler',
        'Göç haritaları ve istatistik yorumu'
      ]),
      gecimTarzlari: createKazanim('C02_04', 'Geçim Tarzları', Zorluk.ZOR, 2, [
        'Ekonomik faaliyetlerle ilişki',
        'Kültürel çeşitlilik ve toplumsal yapı'
      ])
    },
    onKosul: ['dogalSistemler'],
    sonraki: ['mekansalTurkiye']
  },
  mekansalTurkiye: {
    kod: 'AYT_COG_03',
    ad: 'Mekansal Bir Sentez: Türkiye',
    zorluk: Zorluk.COK_ZOR,
    yuzde: 22,
    kazanimlar: {
      yeryuzu: createKazanim('C03_01', 'Türkiye’nin Yeryüzü Şekilleri ve Özellikleri', Zorluk.COK_ZOR, 3, [
        'Dağlar, ovalar, platolar ve kıyı tipleri',
        'Jeolojik yapı ve doğal kaynaklar'
      ]),
      iklimTr: createKazanim('C03_02', 'Türkiye İklimi ve Özellikleri', Zorluk.COK_ZOR, 3, [
        'İklim elemanlarının bölgelere göre değişimi',
        'Bitki örtüsü ve toprak çeşitleri'
      ]),
      dogalVarlik: createKazanim('C03_03', 'Türkiye’nin Doğal Varlıkları', Zorluk.ZOR, 2, [
        'Su, maden, enerji ve tarım potansiyeli',
        'Doğal afet riskleri'
      ]),
      yerlesmeNufus: createKazanim('C03_04', 'Türkiye’de Yerleşme, Nüfus ve Göç', Zorluk.COK_ZOR, 3, [
        'Nüfus yoğunluğu ve göç hareketleri',
        'Kentsel–kırsal yerleşme ve bölgesel farklar'
      ])
    },
    onKosul: ['beseriSistemler'],
    sonraki: ['kureselOrtam']
  },
  kureselOrtam: {
    kod: 'AYT_COG_04',
    ad: 'Küresel Ortam: Bölgeler ve Ülkeler',
    zorluk: Zorluk.COK_ZOR,
    yuzde: 16,
    kazanimlar: {
      bolgeTurleri: createKazanim('C04_01', 'Bölge Türleri ve Sınırları', Zorluk.COK_ZOR, 2, [
        'Fiziki, ekonomik ve siyasi bölgeler',
        'Bölgeselleşme ve işbirliği örgütleri'
      ]),
      konumEtkilesim: createKazanim('C04_02', 'Konum ve Etkileşim', Zorluk.COK_ZOR, 3, [
        'Ülkeler arası ticaret ve ulaşım koridorları',
        'Jeopolitik ve küresel güç merkezleri'
      ]),
      cografiKesifler: createKazanim('C04_03', 'Coğrafi Keşifler', Zorluk.ZOR, 2, [
        'Tarihsel süreç ve sonuçları',
        'Küreselleşmenin kökenine etkisi'
      ])
    },
    onKosul: ['mekansalTurkiye'],
    sonraki: ['cevreToplum']
  },
  cevreToplum: {
    kod: 'AYT_COG_05',
    ad: 'Çevre ve Toplum',
    zorluk: Zorluk.COK_ZOR,
    yuzde: 12,
    kazanimlar: {
      etkilesim: createKazanim('C05_01', 'Doğa ile İnsan Arasındaki Etkileşim', Zorluk.COK_ZOR, 3, [
        'Ekosistem hizmetleri, kirlenme ve taşıma kapasitesi',
        'Sürdürülebilir kalkınma ve çevre etiği'
      ]),
      afet: createKazanim('C05_02', 'Doğal Afetler', Zorluk.COK_ZOR, 3, [
        'Afet türleri, risk haritaları ve önlem',
        'İklim değişikliği ile afet sıklığı'
      ])
    },
    onKosul: ['kureselOrtam'],
    sonraki: ['ekonomikFaaliyetler']
  },
  ekonomikFaaliyetler: {
    kod: 'AYT_COG_06',
    ad: 'Ekonomik Faaliyetler',
    zorluk: Zorluk.COK_ZOR,
    yuzde: 12,
    kazanimlar: {
      birincil: createKazanim('C06_01', 'Birincil Faaliyetler', Zorluk.COK_ZOR, 3, [
        'Tarım türleri, hayvancılık ve ormancılık',
        'Su ürünleri ve avcılık'
      ]),
      ikincilUcuncul: createKazanim('C06_02', 'İkincil ve Üçüncül Faaliyetler', Zorluk.COK_ZOR, 3, [
        'Sanayi türleri, enerji ve ulaşım',
        'Ticaret, turizm ve hizmet sektörü'
      ]),
      bolgeselKalkinma: createKazanim('C06_03', 'Bölgesel Kalkınma ve Projeler', Zorluk.ZOR, 2, [
        'Türkiye’de kalkınma projeleri ve işlevsel bölgeler',
        'Küresel ve bölgesel ekonomik örgütler'
      ])
    },
    onKosul: ['cevreToplum'],
    sonraki: []
  }
};

const AYT_COG1 = {
  kod: 'AYT_COG1',
  ad: 'AYT Coğrafya-1',
  soru: 6,
  yuzde: 100,
  konular: AYT_COG_ORIAK_KONULAR,
  kaynaklar: ['MEB Coğrafya Öğretim Programı (10–12)', 'Kitapseç AYT Coğrafya-1 konu başlıkları'],
  tavsiyeler: ['Harita ve ölçek alıştırması', 'Türkiye’nin bölgesel özelliklerini tablo yapın', 'İklim–bitki–toprak ilişkisini kurun']
};

const AYT_COG2 = {
  kod: 'AYT_COG2',
  ad: 'AYT Coğrafya-2',
  soru: 11,
  yuzde: 100,
  konular: AYT_COG_ORIAK_KONULAR,
  kaynaklar: ['MEB Coğrafya Öğretim Programı (10–12)', 'Kitapseç AYT Coğrafya-2 konu başlıkları'],
  tavsiyeler: ['COĞ-1 ile aynı ünite çerçevesinde tekrar', 'Ekonomik faaliyet ve çevre sorularına ağırlık verin']
};

const AYT_FEL_GRUP = {
  kod: 'AYT_FEL_GRUP',
  ad: 'AYT Felsefe Grubu (Felsefe + Mantık + Psikoloji + Sosyoloji)',
  soru: 12,
  yuzde: 100,
  altDersler: {
    felsefe: {
      kod: 'AYT_FEL',
      ad: 'Felsefe',
      soru: 4,
      yuzde: 34,
      konular: {
        alan: {
          kod: 'FL_01', ad: 'Felsefenin Alanı', zorluk: Zorluk.ORTA, yuzde: 25,
          kazanimlar: {
            felsefeNedir: createKazanim('FL01_01', 'Felsefe ve Önerme', Zorluk.ORTA, 2, [
              'Felsefi soruşturma, argüman ve çelişki',
              'Bilgi, inanç ve kanıt ayrımı (temel)'
            ])
          },
          onKosul: [],
          sonraki: ['bilgiFelsefesi']
        },
        bilgiFelsefesi: {
          kod: 'FL_02', ad: 'Bilgi Felsefesi', zorluk: Zorluk.COK_ZOR, yuzde: 25,
          kazanimlar: {
            epistemoloji: createKazanim('FL02_01', 'Bilgi Teorileri', Zorluk.COK_ZOR, 2, [
              'Akılcılık, deneycilik, şüphecilik (temel)',
              'Doğruluk, gerekçe ve Gettier problemi (özet)'
            ])
          },
          onKosul: ['alan'],
          sonraki: ['bilimFelsefesi']
        },
        bilimFelsefesi: {
          kod: 'FL_03', ad: 'Bilim Felsefesi', zorluk: Zorluk.COK_ZOR, yuzde: 25,
          kazanimlar: {
            bilim: createKazanim('FL03_01', 'Bilimsel Yöntem ve Paradigma', Zorluk.COK_ZOR, 2, [
              'Yanlışlanabilirlik, model ve teoriler',
              'Tümevarım–tümdengelim tartışması (temel)'
            ])
          },
          onKosul: ['bilgiFelsefesi'],
          sonraki: ['varlikAhlak']
        },
        varlikAhlak: {
          kod: 'FL_04', ad: 'Varlık, Ahlak, Siyaset, Sanat ve Din Felsefesi', zorluk: Zorluk.COK_ZOR, yuzde: 25,
          kazanimlar: {
            ontoloji: createKazanim('FL04_01', 'Varlık Felsefesi', Zorluk.COK_ZOR, 2, [
              'Varlık–hiçlik, madde–öz (temel kavramlar)',
              'Özgürlük ve determinizm (özet)'
            ]),
            ahlak: createKazanim('FL04_02', 'Ahlak Felsefesi', Zorluk.COK_ZOR, 2, [
              'Ödev ahlakı, sonuç ahlakı, erdem etiği',
              'Hak ve adalet kavramları'
            ]),
            siyasetSanatDin: createKazanim('FL04_03', 'Siyaset, Sanat ve Din Felsefesi', Zorluk.COK_ZOR, 2, [
              'Devlet, meşruiyet ve adalet',
              'Estetik değer ve yorum; din felsefesinde akıl–vahiy (temel)'
            ])
          },
          onKosul: ['bilimFelsefesi'],
          sonraki: []
        }
      }
    },
    mantik: {
      kod: 'AYT_MAN',
      ad: 'Mantık',
      soru: 3,
      yuzde: 25,
      konular: {
        mantigaGiris: {
          kod: 'MN_01', ad: 'Mantığa Giriş ve Klasik Mantık', zorluk: Zorluk.ZOR, yuzde: 40,
          kazanimlar: {
            onerme: createKazanim('MN01_01', 'Önerme ve Bileşik Önermeler', Zorluk.ZOR, 2, [
              'Doğruluk değerleri, çelişki ve değişmezlik',
              'Koşullu önerme ve önerme türleri'
            ]),
            cikarsama: createKazanim('MN01_02', 'Doğrudan ve Dolaylı Çıkarımlar', Zorluk.COK_ZOR, 2, [
              'Kıyas kuralları (temel)',
              'Yanlış çıkarım türleri'
            ])
          },
          onKosul: [],
          sonraki: ['mantikVeDil']
        },
        mantikVeDil: {
          kod: 'MN_02', ad: 'Mantık ve Dil', zorluk: Zorluk.COK_ZOR, yuzde: 30,
          kazanimlar: {
            dil: createKazanim('MN02_01', 'Kavram ve Tanım', Zorluk.COK_ZOR, 2, [
              'İç ve dış kapsam',
              'Belirsizlik ve çok anlamlılık'
            ])
          },
          onKosul: ['mantigaGiris'],
          sonraki: ['sembolikMantik']
        },
        sembolikMantik: {
          kod: 'MN_03', ad: 'Sembolik Mantık', zorluk: Zorluk.COK_ZOR, yuzde: 30,
          kazanimlar: {
            sembolik: createKazanim('MN03_01', 'Önerme Cebiri (Temel)', Zorluk.COK_ZOR, 2, [
              'Doğruluk tabloları ve geçerlik',
              'Çıkarım kuralları (modus ponens/tollens)'
            ])
          },
          onKosul: ['mantikVeDil'],
          sonraki: []
        }
      }
    },
    psikoloji: {
      kod: 'AYT_PSI',
      ad: 'Psikoloji',
      soru: 3,
      yuzde: 21,
      konular: {
        psikolojiBiliminiTaniyalim: {
          kod: 'PS_01', ad: 'Psikoloji Bilimini Tanıyalım', zorluk: Zorluk.ORTA, yuzde: 25,
          kazanimlar: {
            bilim: createKazanim('PS01_01', 'Psikolojinin Konusu ve Yöntemi', Zorluk.ORTA, 2, [
              'Deneysel ve gözlemsel yöntem',
              'Etik ilkeler ve uzmanlık alanları'
            ])
          },
          onKosul: [],
          sonraki: ['temelSurecler']
        },
        temelSurecler: {
          kod: 'PS_02', ad: 'Psikolojinin Temel Süreçleri', zorluk: Zorluk.ZOR, yuzde: 25,
          kazanimlar: {
            algı: createKazanim('PS02_01', 'Algı ve Dikkat', Zorluk.ZOR, 2, [
              'Duyu eşikleri ve algı örgütlenmesi',
              'Dikkat türleri ve dağınıklık'
            ])
          },
          onKosul: ['psikolojiBiliminiTaniyalim'],
          sonraki: ['ogrenmeBellekDusunme']
        },
        ogrenmeBellekDusunme: {
          kod: 'PS_03', ad: 'Öğrenme, Bellek, Düşünme', zorluk: Zorluk.COK_ZOR, yuzde: 30,
          kazanimlar: {
            ogrenme: createKazanim('PS03_01', 'Öğrenme Kuramları', Zorluk.COK_ZOR, 2, [
              'Klasik ve edimsel koşullanma',
              'Gözlem öğrenmesi ve bilişsel öğrenme (özet)'
            ]),
            bellek: createKazanim('PS03_02', 'Bellek Türleri ve Unutma', Zorluk.COK_ZOR, 2, [
              'Kısa–uzun süreli bellek, çalışma belleği',
              'Bellek hataları ve öğrenmeyi pekiştirme'
            ]),
            dusunme: createKazanim('PS03_03', 'Düşünme ve Problem Çözme', Zorluk.COK_ZOR, 2, [
              'Kavram oluşturma, yargı ve muhakeme',
              'Yaratıcılık ve zeka (temel)'
            ])
          },
          onKosul: ['temelSurecler'],
          sonraki: ['ruhSagligi']
        },
        ruhSagligi: {
          kod: 'PS_04', ad: 'Ruh Sağlığının Temelleri', zorluk: Zorluk.ZOR, yuzde: 20,
          kazanimlar: {
            saglik: createKazanim('PS04_01', 'Stres, Başa Çıkma ve Ruh Sağlığı', Zorluk.ZOR, 2, [
              'Kaygı ve depresyon (temel kavramlar)',
              'Terapi ekolleri ve ön yargı (özet)'
            ])
          },
          onKosul: ['ogrenmeBellekDusunme'],
          sonraki: []
        }
      }
    },
    sosyoloji: {
      kod: 'AYT_SOS',
      ad: 'Sosyoloji',
      soru: 2,
      yuzde: 20,
      konular: {
        sosyolojiyeGiris: {
          kod: 'SO_01', ad: 'Sosyolojiye Giriş', zorluk: Zorluk.ORTA, yuzde: 20,
          kazanimlar: {
            giris: createKazanim('SO01_01', 'Toplum, Kültür ve Sosyolojik Düşünce', Zorluk.ORTA, 2, [
              'Sosyolojinin kurucuları ve temel kavramlar',
              'Toplumsal olgu ve yöntem'
            ])
          },
          onKosul: [],
          sonraki: ['bireyVeToplum']
        },
        bireyVeToplum: {
          kod: 'SO_02', ad: 'Birey ve Toplum', zorluk: Zorluk.ZOR, yuzde: 20,
          kazanimlar: {
            birey: createKazanim('SO02_01', 'Sosyalleşme ve Kimlik', Zorluk.ZOR, 2, [
              'Ajanlık ve yapı ilişkisi',
              'Sapma ve kontrol mekanizmaları (temel)'
            ])
          },
          onKosul: ['sosyolojiyeGiris'],
          sonraki: ['toplumsalYapi']
        },
        toplumsalYapi: {
          kod: 'SO_03', ad: 'Toplumsal Yapı', zorluk: Zorluk.COK_ZOR, yuzde: 20,
          kazanimlar: {
            yapi: createKazanim('SO03_01', 'Tabakalaşma ve Kurumlar', Zorluk.COK_ZOR, 2, [
              'Sınıf, statü ve rol',
              'Aile, eğitim, din ve ekonomi kurumları'
            ])
          },
          onKosul: ['bireyVeToplum'],
          sonraki: ['toplumsalDegisme']
        },
        toplumsalDegisme: {
          kod: 'SO_04', ad: 'Toplumsal Değişme ve Gelişme', zorluk: Zorluk.COK_ZOR, yuzde: 20,
          kazanimlar: {
            degisme: createKazanim('SO04_01', 'Modernleşme ve Küreselleşme', Zorluk.COK_ZOR, 2, [
              'Kentleşme ve göçün toplumsal sonuçları',
              'Kalkınma göstergeleri ve eşitsizlik'
            ])
          },
          onKosul: ['toplumsalYapi'],
          sonraki: ['toplumKultur']
        },
        toplumKultur: {
          kod: 'SO_05', ad: 'Toplum ve Kültür', zorluk: Zorluk.ZOR, yuzde: 10,
          kazanimlar: {
            kultur: createKazanim('SO05_01', 'Kültür, Norm ve Değer', Zorluk.ZOR, 2, [
              'Kültürel çeşitlilik ve küresel etkileşim',
              'Toplumsal cinsiyet ve medya (temel)'
            ])
          },
          onKosul: ['toplumsalDegisme'],
          sonraki: ['toplumsalKurumlar']
        },
        toplumsalKurumlar: {
          kod: 'SO_06', ad: 'Toplumsal Kurumlar', zorluk: Zorluk.ZOR, yuzde: 10,
          kazanimlar: {
            kurum: createKazanim('SO06_01', 'Politika, Hukuk ve Ekonomi', Zorluk.ZOR, 2, [
              'Demokrasi, güç ve meşruiyet',
              'İş bölümü ve örgütler (özet)'
            ])
          },
          onKosul: ['toplumKultur'],
          sonraki: []
        }
      }
    }
  },
  kaynaklar: ['MEB Felsefe Öğretim Programı (12)', 'MEB Psikoloji, Sosyoloji, Mantık (12)', 'Kitapseç AYT Felsefe konu listesi'],
  tavsiyeler: ['Kavram–düşünür eşlemesi', 'Mantıkta örnek çıkarım çözün', 'Sosyolojide güncel olaylara kavram uygulayın']
};

const AYT_DKAB = {
  kod: 'AYT_DKAB',
  ad: 'AYT Din Kültürü ve Ahlak Bilgisi',
  soru: 6,
  yuzde: 100,
  konular: {
    inancIbadetAhlak: {
      kod: 'AYT_DKAB_01',
      ad: 'İnanç, İbadet ve Ahlak',
      zorluk: Zorluk.ZOR,
      yuzde: 22,
      kazanimlar: {
        inanc: createKazanim('DK01_01', 'İnanç', Zorluk.ZOR, 2, [
          'İman esasları ve temel kavramlar',
          'İnanç–ahlak ilişkisi'
        ]),
        ibadet: createKazanim('DK01_02', 'İbadet', Zorluk.ZOR, 2, [
          'İbadetlerin anlamı ve birlikte düşünülmesi',
          'Namaz, oruç, zekât ve hac (temel hüküm ve hikmet)'
        ]),
        ahlak: createKazanim('DK01_03', 'Ahlak ve Değerler', Zorluk.ZOR, 2, [
          'Güzel ahlak örnekleri ve toplumsal sorumluluk',
          'Hak ve adalet kavramları'
        ])
      },
      onKosul: ['TYT_DIN'],
      sonraki: ['kulturVahiy']
    },
    kulturVahiy: {
      kod: 'AYT_DKAB_02',
      ad: 'Kültür, Hz. Muhammed ve Vahiy–Akil',
      zorluk: Zorluk.COK_ZOR,
      yuzde: 22,
      kazanimlar: {
        dinKultur: createKazanim('DK02_01', 'Din, Kültür ve Medeniyet', Zorluk.ZOR, 2, [
          'Din ve kültür etkileşimi',
          'İslam medeniyetinin temel dinamikleri'
        ]),
        hzMuhammed: createKazanim('DK02_02', 'Hz. Muhammed (s.a.v.)', Zorluk.COK_ZOR, 2, [
          'Örnek şahsiyet ve iletişim',
          'Ahlaki ve sosyal öğretiler (temel)'
        ]),
        vahiyAkil: createKazanim('DK02_03', 'Vahiy ve Akıl', Zorluk.COK_ZOR, 2, [
          'Vahyin rehberliği ve akıl yürütme',
          'İlim ve düşünce hayatı'
        ]),
        dunyaAhiret: createKazanim('DK02_04', 'Dünya ve Ahiret', Zorluk.ZOR, 2, [
          'Sorumluluk bilinci ve ahiret inancı',
          'İbadet ve ahlakın bütünlüğü'
        ])
      },
      onKosul: ['inancIbadetAhlak'],
      sonraki: ['kurAnMeseleler']
    },
    kurAnMeseleler: {
      kod: 'AYT_DKAB_03',
      ad: 'Kur’an, İnanç Meseleleri ve Dinler',
      zorluk: Zorluk.COK_ZOR,
      yuzde: 22,
      kazanimlar: {
        kuranMuhammed: createKazanim('DK03_01', 'Kur’an’a Göre Hz. Muhammed', Zorluk.COK_ZOR, 2, [
          'Ayette örnek şahsiyet',
          'Ahlaki ve sosyal mesajlar'
        ]),
        inancMeseleleri: createKazanim('DK03_02', 'İnançla İlgili Meseleler', Zorluk.COK_ZOR, 2, [
          'Güncel tartışmalara temel çerçeve',
          'Özgürlük ve sorumluluk dengesi'
        ]),
        yahudiHristiyan: createKazanim('DK03_03', 'Yahudilik ve Hristiyanlık', Zorluk.ZOR, 2, [
          'Kutsal kitap ve peygamber inancı',
          'Ortak değerler ve farklılıklar (temel)'
        ])
      },
      onKosul: ['kulturVahiy'],
      sonraki: ['islamBilimAnadolu']
    },
    islamBilimAnadolu: {
      kod: 'AYT_DKAB_04',
      ad: 'İslam ve Bilim; Anadolu ve Tasavvuf',
      zorluk: Zorluk.COK_ZOR,
      yuzde: 18,
      kazanimlar: {
        islamBilim: createKazanim('DK04_01', 'İslam ve Bilim', Zorluk.COK_ZOR, 2, [
          'Bilimsel gelişmelere İslam’ın yaklaşımı',
          'Etik sınırlar ve sorumlu bilim'
        ]),
        anadoluIslam: createKazanim('DK04_02', 'Anadolu’da İslam', Zorluk.COK_ZOR, 2, [
          'Kültürel ve mimari miras',
          'Birlikte yaşama ve hoşgörü örnekleri'
        ]),
        tasavvuf: createKazanim('DK04_03', 'İslam Düşüncesinde Tasavvufi Yorumlar', Zorluk.ZOR, 2, [
          'Temel kavramlar ve temsilciler (özet)',
          'Ahlak ve nefis terbiyesi'
        ])
      },
      onKosul: ['kurAnMeseleler'],
      sonraki: ['gunelDinler']
    },
    gunelDinler: {
      kod: 'AYT_DKAB_05',
      ad: 'Güncel Meseleler ve Dinler',
      zorluk: Zorluk.ZOR,
      yuzde: 16,
      kazanimlar: {
        guncel: createKazanim('DK05_01', 'Güncel Dinî Meseleler', Zorluk.ZOR, 2, [
          'Çağdaş yaşamda din ve etik',
          'Medya ve iletişimle dinî bilgi'
        ]),
        hintCin: createKazanim('DK05_02', 'Hint ve Çin Dinleri', Zorluk.ZOR, 2, [
          'Temel inanç ve ibadet yapıları',
          'Kültürel etkileşim'
        ])
      },
      onKosul: ['islamBilimAnadolu'],
      sonraki: []
    }
  },
  kaynaklar: ['MEB Din Kültürü ve Ahlak Bilgisi Öğretim Programı (12)', 'Kitapseç AYT Din Kültürü konu listesi'],
  tavsiyeler: ['Kavramları kaynak metinle ilişkilendirin', 'Güncel örnekleri ahlak çerçevesinde tartışın', 'TYT Din ile karıştırmayın; AYT ayrı 6 sorudur']
};

// ============================================
// TÜM YKS MÜFREDATI BİRLEŞİK NESNE
// ============================================
const YKS_MUFRADAT = {
  tyt: {
    turkce: TYT_TURKCE,
    tarih: TYT_TARI,
    cografya: TYT_COG,
    felsefe: TYT_FELSEFE,
    dinKulturu: TYT_DIN,
    matematik: TYT_MAT,
    geometri: TYT_GEOMETRI,
    fenBilimleri: TYT_FEN
  },
  ayt: {
    matematik: AYT_MAT,
    geometri: AYT_GEO,
    fizik: AYT_FIZ,
    kimya: AYT_KIM,
    biyoloji: AYT_BIY,
    edebiyat: AYT_EDEB,
    tarih1: AYT_TAR1,
    tarih2: AYT_TAR2,
    cografya1: AYT_COG1,
    cografya2: AYT_COG2,
    felsefeGrup: AYT_FEL_GRUP,
    dinKulturuAyt: AYT_DKAB
  },
  meta: {
    versiyon: '1.2.0',
    guncellenmeTarihi: '2025-2026',
    kaynak: 'MEB müfredatı; TYT ve AYT çatısı Kitapseç blog (AYT konuları ve soru dağılımı) ile hizalanmıştır',
    aciklama: 'YKS (TYT+AYT) Tam Müfredat Verisi'
  }
};

// Tüm müfredat nesneleri (isteğe bağlı: konsol / Node için)
var YKS_MUFRADAT_DEFAULT_EXPORT = {
  Zorluk,
  // TYT
  TYT_TURKCE, TYT_TARI, TYT_COG, TYT_FELSEFE, TYT_DIN, TYT_MAT, TYT_GEOMETRI, TYT_FEN,
  // AYT
  AYT_MAT, AYT_GEO, AYT_FIZ, AYT_KIM, AYT_BIY,
  // AYT Sözel
  AYT_EDEB, AYT_TAR1, AYT_TAR2, AYT_COG1, AYT_COG2, AYT_FEL_GRUP, AYT_DKAB,
  // Unified
  YKS_MUFRADAT
};

// —— Tarayıcı: ders/konu/kavram seçicileri (YksMufredatApi) ——
function __konuListesiFrom(konular) {
  var out = [];
  if (!konular) return out;
  Object.keys(konular).forEach(function (k) {
    var t = konular[k];
    if (t && t.ad) out.push({ id: k, name: t.ad });
  });
  return out;
}

function __kavramListesiFromTopic(topic) {
  var out = [];
  if (!topic || !topic.kazanimlar) return out;
  Object.keys(topic.kazanimlar).forEach(function (kid) {
    var kz = topic.kazanimlar[kid];
    if (kz && kz.ad) out.push({ id: kid, name: kz.ad });
  });
  return out;
}

function __felGrupTopics() {
  var out = [];
  var ag = AYT_FEL_GRUP.altDersler;
  if (!ag) return out;
  Object.keys(ag).forEach(function (brKey) {
    var branch = ag[brKey];
    var kons = branch.konular;
    if (!kons) return;
    Object.keys(kons).forEach(function (tk) {
      var t = kons[tk];
      if (t && t.ad) out.push({ id: brKey + '.' + tk, name: branch.ad + ' › ' + t.ad });
    });
  });
  return out;
}

function __felGrupTopicById(topicId) {
  var p = String(topicId || '').split('.');
  if (p.length < 2) return null;
  var br = AYT_FEL_GRUP.altDersler[p[0]];
  return br && br.konular ? br.konular[p[1]] : null;
}

function createYksMufredatApi() {
  var fen = TYT_FEN.altDersler;
  var tytFiz = fen && fen.fizik ? fen.fizik.konular : {};
  var tytKim = fen && fen.kimya ? fen.kimya.konular : {};
  var tytBiyo = fen && fen.biyoloji ? fen.biyoloji.konular : {};

  var registry = {
    'tyt-tr': { name: 'TYT Türkçe', sinav: 'TYT', konular: TYT_TURKCE.konular },
    'tyt-tar': { name: 'TYT Tarih', sinav: 'TYT', konular: TYT_TARI.konular },
    'tyt-cog': { name: 'TYT Coğrafya', sinav: 'TYT', konular: TYT_COG.konular },
    'tyt-fel': { name: 'TYT Felsefe', sinav: 'TYT', konular: TYT_FELSEFE.konular },
    'tyt-din': { name: 'TYT Din Kültürü ve Ahlak Bilgisi', sinav: 'TYT', konular: TYT_DIN.konular },
    'tyt-mat': { name: 'TYT Matematik', sinav: 'TYT', konular: TYT_MAT.konular },
    'tyt-geo': { name: 'TYT Geometri', sinav: 'TYT', konular: TYT_GEOMETRI.konular },
    'tyt-fiz': { name: 'TYT Fizik', sinav: 'TYT', konular: tytFiz },
    'tyt-kim': { name: 'TYT Kimya', sinav: 'TYT', konular: tytKim },
    'tyt-biyo': { name: 'TYT Biyoloji', sinav: 'TYT', konular: tytBiyo },
    'ayt-mat': { name: 'AYT Matematik', sinav: 'AYT', konular: AYT_MAT.konular },
    'ayt-geo': { name: 'AYT Geometri', sinav: 'AYT', konular: AYT_GEO.konular },
    'ayt-fiz': { name: 'AYT Fizik', sinav: 'AYT', konular: AYT_FIZ.konular },
    'ayt-kim': { name: 'AYT Kimya', sinav: 'AYT', konular: AYT_KIM.konular },
    'ayt-biyo': { name: 'AYT Biyoloji', sinav: 'AYT', konular: AYT_BIY.konular },
    'ayt-edeb': { name: 'AYT Türk Dili ve Edebiyatı', sinav: 'AYT', konular: AYT_EDEB.konular },
    'ayt-tar1': { name: 'AYT Tarih-1', sinav: 'AYT', konular: AYT_TAR1.konular },
    'ayt-tar2': { name: 'AYT Tarih-2', sinav: 'AYT', konular: AYT_TAR2.konular },
    'ayt-cog1': { name: 'AYT Coğrafya-1', sinav: 'AYT', konular: AYT_COG1.konular },
    'ayt-cog2': { name: 'AYT Coğrafya-2', sinav: 'AYT', konular: AYT_COG2.konular },
    'ayt-fel-grup': { name: 'AYT Felsefe Grubu', sinav: 'AYT', konular: null, felGrup: true },
    'ayt-din': { name: 'AYT Din Kültürü ve Ahlak Bilgisi', sinav: 'AYT', konular: AYT_DKAB.konular }
  };

  function getTopicObj(subjectId, topicId) {
    var r = registry[subjectId];
    if (!r || !topicId) return null;
    if (r.felGrup) return __felGrupTopicById(topicId);
    return r.konular && r.konular[topicId] ? r.konular[topicId] : null;
  }

  /** sid|topicId|conceptId → { konu, kavram } — öğrenci karne / matrix için O(1) önbellek */
  var konuLabelCache = { _built: false };

  function warmKonuLabelCache() {
    if (konuLabelCache._built) return konuLabelCache;
    konuLabelCache._built = true;
    Object.keys(registry).forEach(function (sid) {
      var r = registry[sid];
      if (!r) return;
      konuLabelCache[sid] = { konu: r.name || sid, kavram: "" };
      var topics = r.felGrup ? __felGrupTopics() : __konuListesiFrom(r.konular);
      topics.forEach(function (t) {
        if (!t || !t.id) return;
        var key2 = sid + "|" + t.id;
        konuLabelCache[key2] = { konu: t.name || t.id, kavram: "" };
        var tObj = getTopicObj(sid, t.id);
        if (!tObj || !tObj.kazanimlar) return;
        Object.keys(tObj.kazanimlar).forEach(function (cid) {
          var kz = tObj.kazanimlar[cid];
          konuLabelCache[sid + "|" + t.id + "|" + cid] = {
            konu: t.name || t.id,
            kavram: kz && kz.ad ? kz.ad : cid,
          };
        });
      });
    });
    return konuLabelCache;
  }

  function resolveKonuCell(cell, layoutSid, yazi) {
    warmKonuLabelCache();
    var out = { konu: "", kavram: "" };
    var y = String(yazi == null ? "" : yazi).trim();
    if (y) {
      var dash = y.indexOf(" — ");
      if (dash >= 0) {
        out.konu = y.slice(0, dash).trim();
        out.kavram = y.slice(dash + 3).trim();
      } else {
        var dot = y.indexOf(" · ");
        if (dot >= 0) {
          out.konu = y.slice(0, dot).trim();
          out.kavram = y.slice(dot + 3).trim();
        } else {
          out.konu = y;
        }
      }
      return out;
    }
    var raw = String(cell == null ? "" : cell).trim();
    if (!raw) return out;
    if (konuLabelCache[raw]) {
      return { konu: konuLabelCache[raw].konu, kavram: konuLabelCache[raw].kavram };
    }
    var parts = raw.split("|");
    var sid = String((parts[0] || "").trim() || String(layoutSid || "").trim());
    var tid = String((parts[1] || "").trim());
    var cid = String((parts[2] || "").trim());
    if (sid && tid) {
      var key3 = cid ? sid + "|" + tid + "|" + cid : sid + "|" + tid;
      if (konuLabelCache[key3]) {
        return { konu: konuLabelCache[key3].konu, kavram: konuLabelCache[key3].kavram };
      }
    }
    if (registry[raw]) {
      return { konu: registry[raw].name || raw, kavram: "" };
    }
    if (!/^(tyt-|ayt-|ydt$)/i.test(raw)) {
      out.konu = raw;
    }
    return out;
  }

  function subjectDisplayName(subjectId) {
    var sid = String(subjectId || "").trim();
    if (!sid) return "—";
    warmKonuLabelCache();
    var r = registry[sid];
    if (r && r.name) return r.name;
    return sid;
  }

  return {
    getSubjects: function () {
      return Object.keys(registry).map(function (id) {
        return { id: id, name: registry[id].name, sinav: registry[id].sinav };
      });
    },
    getSubject: function (subjectId) {
      var r = registry[subjectId];
      if (!r) return null;
      return { id: subjectId, name: r.name, sinav: r.sinav };
    },
    getTopics: function (subjectId) {
      var r = registry[subjectId];
      if (!r) return [];
      if (r.felGrup) return __felGrupTopics();
      return __konuListesiFrom(r.konular);
    },
    getConcepts: function (subjectId, topicId) {
      var t = getTopicObj(subjectId, topicId);
      return __kavramListesiFromTopic(t);
    },
    warmKonuLabelCache: warmKonuLabelCache,
    resolveKonuCell: resolveKonuCell,
    subjectDisplayName: subjectDisplayName,
    resolveConceptsMulti: function (subjectId, topicId, conceptIds) {
      var sub = this.getSubject(subjectId);
      var topics = this.getTopics(subjectId);
      var topicName = '';
      for (var i = 0; i < topics.length; i++) {
        if (topics[i].id === topicId) {
          topicName = topics[i].name;
          break;
        }
      }
      var names = [];
      (conceptIds || []).forEach(function (cid) {
        var t = getTopicObj(subjectId, topicId);
        var kz = t && t.kazanimlar && t.kazanimlar[cid];
        names.push(kz && kz.ad ? kz.ad : cid);
      });
      return {
        subject: sub ? sub.name : '',
        topic: topicName,
        conceptNames: names,
        conceptJoined: names.join(' · ')
      };
    }
  };
}

var __yksMufredatApiSingleton = createYksMufredatApi();

if (typeof globalThis !== 'undefined') {
  globalThis.YksMufredatApi = __yksMufredatApiSingleton;
  globalThis.YksMufredat = { subjects: __yksMufredatApiSingleton.getSubjects() };
}

try {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('yks-mufredat:ready'));
  }
} catch (eReady) {}
