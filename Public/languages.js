const languages = [
  {
    iso_639_1: "aa",
    english_name: "Afar",
    name: "Qafár af",
  },
  {
    iso_639_1: "af",
    english_name: "Afrikaans",
    name: "",
  },
  {
    iso_639_1: "ak",
    english_name: "Akan",
    name: "Akan",
  },
  {
    iso_639_1: "an",
    english_name: "Aragonese",
    name: "Aragonés",
  },
  {
    iso_639_1: "as",
    english_name: "Assamese",
    name: "অসমীয়া",
  },
  {
    iso_639_1: "av",
    english_name: "Avaric",
    name: "Авар мацӀ",
  },
  {
    iso_639_1: "ae",
    english_name: "Avestan",
    name: "Avesta",
  },
  {
    iso_639_1: "ay",
    english_name: "Aymara",
    name: "Aymar aru",
  },
  {
    iso_639_1: "az",
    english_name: "Azerbaijani",
    name: "Azərbaycan",
  },
  {
    iso_639_1: "ba",
    english_name: "Bashkir",
    name: "Башҡорт теле",
  },
  {
    iso_639_1: "bm",
    english_name: "Bambara",
    name: "Bamanankan",
  },
  {
    iso_639_1: "bn",
    english_name: "Bengali",
    name: "বাংলা",
  },
  {
    iso_639_1: "bi",
    english_name: "Bislama",
    name: "Bislama",
  },
  {
    iso_639_1: "bo",
    english_name: "Tibetan",
    name: "བོད་ཡིག",
  },
  {
    iso_639_1: "bs",
    english_name: "Bosnian",
    name: "Bosanski",
  },
  {
    iso_639_1: "br",
    english_name: "Breton",
    name: "Brezhoneg",
  },
  {
    iso_639_1: "ca",
    english_name: "Catalan",
    name: "Català",
  },
  {
    iso_639_1: "cs",
    english_name: "Czech",
    name: "Český",
  },
  {
    iso_639_1: "ch",
    english_name: "Chamorro",
    name: "Finu' Chamorro",
  },
  {
    iso_639_1: "ce",
    english_name: "Chechen",
    name: "Нохчийн мотт",
  },
  {
    iso_639_1: "cu",
    english_name: "Slavic",
    name: "Словѣньскъ",
  },
  {
    iso_639_1: "cv",
    english_name: "Chuvash",
    name: "Чӑваш чӗлхи",
  },
  {
    iso_639_1: "kw",
    english_name: "Cornish",
    name: "Kernewek",
  },
  {
    iso_639_1: "co",
    english_name: "Corsican",
    name: "Corsu",
  },
  {
    iso_639_1: "cr",
    english_name: "Cree",
    name: "ᓀᐦᐃᔭᐍᐏᐣ",
  },
  {
    iso_639_1: "cy",
    english_name: "Welsh",
    name: "Cymraeg",
  },
  {
    iso_639_1: "da",
    english_name: "Danish",
    name: "Dansk",
  },
  {
    iso_639_1: "de",
    english_name: "German",
    name: "Deutsch",
  },
  {
    iso_639_1: "dv",
    english_name: "Divehi",
    name: "ދިވެހި",
  },
  {
    iso_639_1: "dz",
    english_name: "Dzongkha",
    name: "རྫོང་ཁ",
  },
  // {
  //   iso_639_1: "en",
  //   english_name: "English",
  //   name: "",
  // },
  {
    iso_639_1: "eo",
    english_name: "Esperanto",
    name: "",
  },
  {
    iso_639_1: "et",
    english_name: "Estonian",
    name: "Eesti",
  },
  {
    iso_639_1: "eu",
    english_name: "Basque",
    name: "Euskera",
  },
  {
    iso_639_1: "fo",
    english_name: "Faroese",
    name: "Føroyskt",
  },
  {
    iso_639_1: "fj",
    english_name: "Fijian",
    name: "Vosa Vakaviti",
  },
  {
    iso_639_1: "fi",
    english_name: "Finnish",
    name: "Suomi",
  },
  {
    iso_639_1: "fr",
    english_name: "French",
    name: "Français",
  },
  {
    iso_639_1: "fy",
    english_name: "Frisian",
    name: "Frysk",
  },
  {
    iso_639_1: "ff",
    english_name: "Fulah",
    name: "Fulfulde",
  },
  {
    iso_639_1: "gd",
    english_name: "Gaelic",
    name: "Gàidhlig",
  },
  {
    iso_639_1: "ga",
    english_name: "Irish",
    name: "Gaeilge",
  },
  {
    iso_639_1: "gl",
    english_name: "Galician",
    name: "Galego",
  },
  {
    iso_639_1: "gv",
    english_name: "Manx",
    name: "Gaelg",
  },
  {
    iso_639_1: "gn",
    english_name: "Guarani",
    name: "Avañe'ẽ",
  },
  {
    iso_639_1: "gu",
    english_name: "Gujarati",
    name: "ગુજરાતી",
  },
  {
    iso_639_1: "ht",
    english_name: "Haitian; Haitian Creole",
    name: "Kreyòl ayisyen",
  },
  {
    iso_639_1: "ha",
    english_name: "Hausa",
    name: "",
  },
  {
    iso_639_1: "sh",
    english_name: "Serbo-Croatian",
    name: "Srpskohrvatski",
  },
  {
    iso_639_1: "hz",
    english_name: "Herero",
    name: "Otjiherero",
  },
  {
    iso_639_1: "ho",
    english_name: "Hiri Motu",
    name: "Hiri Motu",
  },
  {
    iso_639_1: "hr",
    english_name: "Croatian",
    name: "Hrvatski",
  },
  {
    iso_639_1: "hu",
    english_name: "Hungarian",
    name: "Magyar",
  },
  {
    iso_639_1: "ig",
    english_name: "Igbo",
    name: "Asụsụ Igbo",
  },
  {
    iso_639_1: "io",
    english_name: "Ido",
    name: "Ido",
  },
  {
    iso_639_1: "ii",
    english_name: "Yi",
    name: "ꆈꌠꉙ",
  },
  {
    iso_639_1: "iu",
    english_name: "Inuktitut",
    name: "ᐃᓄᒃᑎᑐᑦ",
  },
  {
    iso_639_1: "ie",
    english_name: "Interlingue",
    name: "Interlingue",
  },
  {
    iso_639_1: "ia",
    english_name: "Interlingua",
    name: "Interlingua",
  },
  {
    iso_639_1: "id",
    english_name: "Indonesian",
    name: "Bahasa indonesia",
  },
  {
    iso_639_1: "ik",
    english_name: "Inupiaq",
    name: "Iñupiaq",
  },
  {
    iso_639_1: "is",
    english_name: "Icelandic",
    name: "Íslenska",
  },
  {
    iso_639_1: "it",
    english_name: "Italian",
    name: "Italiano",
  },
  {
    iso_639_1: "jv",
    english_name: "Javanese",
    name: "Basa Jawa",
  },
  {
    iso_639_1: "ja",
    english_name: "Japanese",
    name: "日本語",
  },
  {
    iso_639_1: "kl",
    english_name: "Kalaallisut",
    name: "Kalaallisut",
  },
  {
    iso_639_1: "kn",
    english_name: "Kannada",
    name: "",
  },
  {
    iso_639_1: "ks",
    english_name: "Kashmiri",
    name: "कश्मीरी",
  },
  {
    iso_639_1: "ka",
    english_name: "Georgian",
    name: "ქართული",
  },
  {
    iso_639_1: "kr",
    english_name: "Kanuri",
    name: "Kanuri",
  },
  {
    iso_639_1: "kk",
    english_name: "Kazakh",
    name: "Қазақ",
  },
  {
    iso_639_1: "km",
    english_name: "Khmer",
    name: "ភាសាខ្មែរ",
  },
  {
    iso_639_1: "ki",
    english_name: "Kikuyu",
    name: "Gĩkũyũ",
  },
  {
    iso_639_1: "rw",
    english_name: "Kinyarwanda",
    name: "",
  },
  {
    iso_639_1: "ky",
    english_name: "Kirghiz",
    name: "",
  },
  {
    iso_639_1: "kv",
    english_name: "Komi",
    name: "Коми кыв",
  },
  {
    iso_639_1: "kg",
    english_name: "Kongo",
    name: "KiKongo",
  },
  {
    iso_639_1: "ko",
    english_name: "Korean",
    name: "한국어/조선말",
  },
  {
    iso_639_1: "kj",
    english_name: "Kuanyama",
    name: "Kuanyama",
  },
  {
    iso_639_1: "ku",
    english_name: "Kurdish",
    name: "Kurdî",
  },
  {
    iso_639_1: "lo",
    english_name: "Lao",
    name: "ພາສາລາວ",
  },
  {
    iso_639_1: "la",
    english_name: "Latin",
    name: "",
  },
  {
    iso_639_1: "lv",
    english_name: "Latvian",
    name: "Latviešu",
  },
  {
    iso_639_1: "li",
    english_name: "Limburgish",
    name: "Limburgs",
  },
  {
    iso_639_1: "ln",
    english_name: "Lingala",
    name: "Lingála",
  },
  {
    iso_639_1: "lt",
    english_name: "Lithuanian",
    name: "Lietuvių",
  },
  {
    iso_639_1: "lb",
    english_name: "Letzeburgesch",
    name: "Lëtzebuergesch",
  },
  {
    iso_639_1: "lu",
    english_name: "Luba-Katanga",
    name: "Tshiluba",
  },
  {
    iso_639_1: "lg",
    english_name: "Ganda",
    name: "Luganda",
  },
  {
    iso_639_1: "mh",
    english_name: "Marshall",
    name: "Kajin M̧ajeļ",
  },
  {
    iso_639_1: "ml",
    english_name: "Malayalam",
    name: "മലയാളം",
  },
  {
    iso_639_1: "mr",
    english_name: "Marathi",
    name: "मराठी",
  },
  {
    iso_639_1: "mg",
    english_name: "Malagasy",
    name: "Malagasy",
  },
  {
    iso_639_1: "mt",
    english_name: "Maltese",
    name: "Malti",
  },
  {
    iso_639_1: "mo",
    english_name: "Moldavian",
    name: "Лимба молдовеняскэ",
  },
  {
    iso_639_1: "mn",
    english_name: "Mongolian",
    name: "Монгол",
  },
  {
    iso_639_1: "mi",
    english_name: "Maori",
    name: "Te Reo Māori",
  },
  {
    iso_639_1: "ms",
    english_name: "Malay",
    name: "Bahasa melayu",
  },
  {
    iso_639_1: "my",
    english_name: "Burmese",
    name: "ဗမာစာ",
  },
  {
    iso_639_1: "na",
    english_name: "Nauru",
    name: "Dorerin Naoero",
  },
  {
    iso_639_1: "nv",
    english_name: "Navajo",
    name: "Diné bizaad",
  },
  {
    iso_639_1: "nr",
    english_name: "Ndebele",
    name: "IsiNdebele",
  },
  {
    iso_639_1: "nd",
    english_name: "Ndebele",
    name: "IsiNdebele",
  },
  {
    iso_639_1: "ng",
    english_name: "Ndonga",
    name: "Owambo",
  },
  {
    iso_639_1: "ne",
    english_name: "Nepali",
    name: "नेपाली",
  },
  {
    iso_639_1: "nl",
    english_name: "Dutch",
    name: "Nederlands",
  },
  {
    iso_639_1: "nn",
    english_name: "Norwegian Nynorsk",
    name: "Nynorsk",
  },
  {
    iso_639_1: "nb",
    english_name: "Norwegian Bokmål",
    name: "Bokmål",
  },
  {
    iso_639_1: "no",
    english_name: "Norwegian",
    name: "Norsk",
  },
  {
    iso_639_1: "ny",
    english_name: "Chichewa; Nyanja",
    name: "ChiCheŵa",
  },
  {
    iso_639_1: "oc",
    english_name: "Occitan",
    name: "Occitan",
  },
  {
    iso_639_1: "oj",
    english_name: "Ojibwa",
    name: "ᐊᓂᔑᓈᐯᒧᐎᓐ",
  },
  {
    iso_639_1: "or",
    english_name: "Oriya",
    name: "ଓଡ଼ିଆ",
  },
  {
    iso_639_1: "om",
    english_name: "Oromo",
    name: "Afaan Oromoo",
  },
  {
    iso_639_1: "os",
    english_name: "Ossetian; Ossetic",
    name: "Ирон æвзаг",
  },
  {
    iso_639_1: "pa",
    english_name: "Punjabi",
    name: "ਪੰਜਾਬੀ",
  },
  {
    iso_639_1: "pi",
    english_name: "Pali",
    name: "पाऴि",
  },
  {
    iso_639_1: "pl",
    english_name: "Polish",
    name: "Polski",
  },
  {
    iso_639_1: "pt",
    english_name: "Portuguese",
    name: "Português",
  },
  {
    iso_639_1: "qu",
    english_name: "Quechua",
    name: "Runa Simi",
  },
  {
    iso_639_1: "rm",
    english_name: "Raeto-Romance",
    name: "Rumantsch grischun",
  },
  {
    iso_639_1: "ro",
    english_name: "Romanian",
    name: "Română",
  },
  {
    iso_639_1: "rn",
    english_name: "Rundi",
    name: "Kirundi",
  },
  {
    iso_639_1: "ru",
    english_name: "Russian",
    name: "Pусский",
  },
  {
    iso_639_1: "sg",
    english_name: "Sango",
    name: "Yângâ tî sängö",
  },
  {
    iso_639_1: "sa",
    english_name: "Sanskrit",
    name: "संस्कृतम्",
  },
  {
    iso_639_1: "si",
    english_name: "Sinhalese",
    name: "සිංහල",
  },
  {
    iso_639_1: "sk",
    english_name: "Slovak",
    name: "Slovenčina",
  },
  {
    iso_639_1: "sl",
    english_name: "Slovenian",
    name: "Slovenščina",
  },
  {
    iso_639_1: "se",
    english_name: "Northern Sami",
    name: "Davvisámegiella",
  },
  {
    iso_639_1: "sm",
    english_name: "Samoan",
    name: "Gagana fa'a Samoa",
  },
  {
    iso_639_1: "sn",
    english_name: "Shona",
    name: "ChiShona",
  },
  {
    iso_639_1: "sd",
    english_name: "Sindhi",
    name: "सिन्धी",
  },
  {
    iso_639_1: "so",
    english_name: "Somali",
    name: "",
  },
  {
    iso_639_1: "st",
    english_name: "Sotho",
    name: "Sesotho",
  },
  {
    iso_639_1: "es",
    english_name: "Spanish",
    name: "Español",
  },
  {
    iso_639_1: "sq",
    english_name: "Albanian",
    name: "Shqip",
  },
  {
    iso_639_1: "sc",
    english_name: "Sardinian",
    name: "Sardu",
  },
  {
    iso_639_1: "sr",
    english_name: "Serbian",
    name: "Srpski",
  },
  {
    iso_639_1: "ss",
    english_name: "Swati",
    name: "SiSwati",
  },
  {
    iso_639_1: "su",
    english_name: "Sundanese",
    name: "Basa Sunda",
  },
  {
    iso_639_1: "sw",
    english_name: "Swahili",
    name: "Kiswahili",
  },
  {
    iso_639_1: "sv",
    english_name: "Swedish",
    name: "Svenska",
  },
  {
    iso_639_1: "ty",
    english_name: "Tahitian",
    name: "Reo Tahiti",
  },
  {
    iso_639_1: "ta",
    english_name: "Tamil",
    name: "தமிழ்",
  },
  {
    iso_639_1: "tt",
    english_name: "Tatar",
    name: "Татар теле",
  },
  {
    iso_639_1: "te",
    english_name: "Telugu",
    name: "తెలుగు",
  },
  {
    iso_639_1: "tg",
    english_name: "Tajik",
    name: "тоҷикӣ",
  },
  {
    iso_639_1: "tl",
    english_name: "Tagalog",
    name: "Wikang Tagalog",
  },
  {
    iso_639_1: "th",
    english_name: "Thai",
    name: "ภาษาไทย",
  },
  {
    iso_639_1: "ti",
    english_name: "Tigrinya",
    name: "ትግርኛ",
  },
  {
    iso_639_1: "to",
    english_name: "Tonga",
    name: "Faka Tonga",
  },
  {
    iso_639_1: "tn",
    english_name: "Tswana",
    name: "Setswana",
  },
  {
    iso_639_1: "ts",
    english_name: "Tsonga",
    name: "Xitsonga",
  },
  {
    iso_639_1: "tk",
    english_name: "Turkmen",
    name: "Türkmen",
  },
  {
    iso_639_1: "tr",
    english_name: "Turkish",
    name: "Türkçe",
  },
  {
    iso_639_1: "tw",
    english_name: "Twi",
    name: "Twi",
  },
  {
    iso_639_1: "ug",
    english_name: "Uighur",
    name: "Uyƣurqə",
  },
  {
    iso_639_1: "uk",
    english_name: "Ukrainian",
    name: "Український",
  },
  {
    iso_639_1: "ur",
    english_name: "Urdu",
    name: "اردو",
  },
  {
    iso_639_1: "uz",
    english_name: "Uzbek",
    name: "Ozbek",
  },
  {
    iso_639_1: "ve",
    english_name: "Venda",
    name: "Tshivenḓa",
  },
  {
    iso_639_1: "vi",
    english_name: "Vietnamese",
    name: "Tiếng Việt",
  },
  {
    iso_639_1: "vo",
    english_name: "Volapük",
    name: "Volapük",
  },
  {
    iso_639_1: "wa",
    english_name: "Walloon",
    name: "Walon",
  },
  {
    iso_639_1: "wo",
    english_name: "Wolof",
    name: "",
  },
  {
    iso_639_1: "xh",
    english_name: "Xhosa",
    name: "IsiXhosa",
  },
  {
    iso_639_1: "yi",
    english_name: "Yiddish",
    name: "ייִדיש",
  },
  {
    iso_639_1: "za",
    english_name: "Zhuang",
    name: "Saɯ cueŋƅ",
  },
  {
    iso_639_1: "zu",
    english_name: "Zulu",
    name: "IsiZulu",
  },
  {
    iso_639_1: "ab",
    english_name: "Abkhazian",
    name: "Аҧсуа бызшәа",
  },
  {
    iso_639_1: "zh",
    english_name: "Mandarin",
    name: "普通话",
  },
  {
    iso_639_1: "ps",
    english_name: "Pushto",
    name: "پښتو",
  },
  {
    iso_639_1: "am",
    english_name: "Amharic",
    name: "አማርኛ",
  },
  {
    iso_639_1: "ar",
    english_name: "Arabic",
    name: "العربية",
  },
  {
    iso_639_1: "be",
    english_name: "Belarusian",
    name: "Беларуская мова",
  },
  {
    iso_639_1: "bg",
    english_name: "Bulgarian",
    name: "Български език",
  },
  {
    iso_639_1: "cn",
    english_name: "Cantonese",
    name: "广州话 / 廣州話",
  },
  {
    iso_639_1: "mk",
    english_name: "Macedonian",
    name: "Македонски јазик",
  },
  {
    iso_639_1: "ee",
    english_name: "Ewe",
    name: "Èʋegbe",
  },
  {
    iso_639_1: "el",
    english_name: "Greek",
    name: "Ελληνικά",
  },
  {
    iso_639_1: "fa",
    english_name: "Persian",
    name: "فارسی",
  },
  {
    iso_639_1: "he",
    english_name: "Hebrew",
    name: "עִבְרִית",
  },
  {
    iso_639_1: "hi",
    english_name: "Hindi",
    name: "हिन्दी",
  },
  {
    iso_639_1: "hy",
    english_name: "Armenian",
    name: "Հայերեն",
  },
  {
    iso_639_1: "yo",
    english_name: "Yoruba",
    name: "Èdè Yorùbá",
  },
];

// 45 languages in which the Harry Potter and Lord of the Rings movies have translations = good benchmark of which languages are worth caching
// I dont want to cache catalogs in all obscure languages, because they mostly dont have translations and only duplicated EN version (fallback) would be cached

const cacheLanguages = ["en", "de", "it", "fr", "cs", "zh", "es"];

// , "sk", "pl", "nl", "hu", "pt", "ru"
// "sv",
// "tr",
// "fa",
// "fi",
// "el",
// "da",
// "th",
// "he",
// "sr",
// "ja",
// "no",
// "et",
// "ko",
// "lv",
// "ro",
// "uk",
// "ca",
// "hr",
// "bg",
// "lt",
// "is",
// "nb",
// "vi",
// "ar",
// "gl",
// "id",
// "sl",
// "mk",
// "ka",
// "eu",
// "eo",
// "hi",

module.exports = {
  cacheLanguages,
};
