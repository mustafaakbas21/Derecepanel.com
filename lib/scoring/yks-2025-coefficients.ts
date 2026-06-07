/**
 * YKS 2025 ham puan katsayıları — yerleştirme puanı = ham + OBP katkısı.
 * Kaynak: ÖSYM yerleştirme katsayıları (2025); referans doğrulama:
 * https://ertansinansahin.com/yks-tyt-ayt-puan-hesaplama-ve-siralama-hesaplama/
 */

export const YKS_SCORE_YEAR = 2025;

export type YksPuanTuru = "TYT" | "SAY" | "EA" | "SÖZ" | "DİL";

/** Satır kimliği → katsayı (puan-hesaplama-config row id) */
export type CoeffMap = Record<string, number>;

export type YksHamProfile = {
  base: number;
  coeffs: CoeffMap;
};

/** TYT ham — yalnızca TYT oturumu testleri */
export const HAM_TYT: YksHamProfile = {
  base: 145.47,
  coeffs: {
    "tyt-tr": 2.83,
    "tyt-sos": 2.99,
    "tyt-mat": 3.28,
    "tyt-fen": 2.53,
  },
};

/** SAY — TYT + AYT sayısal testleri */
export const HAM_SAY: YksHamProfile = {
  base: 132.87,
  coeffs: {
    "tyt-tr": 1.2,
    "tyt-sos": 1.27,
    "tyt-mat": 1.39,
    "tyt-fen": 1.07,
    "ayt-mat": 2.89,
    "ayt-fiz": 2.46,
    "ayt-kim": 2.53,
    "ayt-bio": 2.61,
  },
};

/** EA — TYT + eşit ağırlık AYT */
export const HAM_EA: YksHamProfile = {
  base: 129.34,
  coeffs: {
    "tyt-tr": 1.19,
    "tyt-sos": 1.26,
    "tyt-mat": 1.38,
    "tyt-fen": 1.07,
    "ea-mat": 2.88,
    "ea-edb": 2.94,
    "ea-tar1": 2.53,
    "ea-cog1": 2.85,
  },
};

/** SÖZ — TYT + sözel AYT */
export const HAM_SOZ: YksHamProfile = {
  base: 129.61,
  coeffs: {
    "tyt-tr": 1.13,
    "tyt-sos": 1.19,
    "tyt-mat": 1.31,
    "tyt-fen": 1.01,
    "soz-edb": 2.79,
    "soz-tar1": 2.39,
    "soz-cog1": 2.7,
    "soz-tar2": 3.8,
    "soz-cog2": 2.47,
    "soz-fel": 3.76,
    "soz-dkab": 2.36,
  },
};

/** DİL — TYT + YDT */
export const HAM_DIL: YksHamProfile = {
  base: 105.92,
  coeffs: {
    "tyt-tr": 1.53,
    "tyt-sos": 1.62,
    "tyt-mat": 1.77,
    "tyt-fen": 1.37,
    "ydt-dil": 2.6,
  },
};

export const HAM_BY_TUR: Record<YksPuanTuru, YksHamProfile> = {
  TYT: HAM_TYT,
  SAY: HAM_SAY,
  EA: HAM_EA,
  SÖZ: HAM_SOZ,
  DİL: HAM_DIL,
};

/** Puan türü → ilgili kartlar (en az bir satırda giriş varsa hesaplanır) */
export const CARD_IDS_BY_TUR: Record<YksPuanTuru, readonly string[]> = {
  TYT: ["tyt"],
  SAY: ["tyt", "say"],
  EA: ["tyt", "ea"],
  SÖZ: ["tyt", "soz"],
  DİL: ["tyt", "ydt"],
};
