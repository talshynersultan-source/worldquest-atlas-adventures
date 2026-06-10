import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const aiHintInput = z.object({
  city: z.string().min(1),
  country: z.string().min(1),
  monument: z.string().min(1),
  questionRu: z.string().min(1),
  questionEn: z.string().min(1),
  acceptedAnswers: z.array(z.string()).min(1),
});

const randomQuizInput = z.object({
  previousCountry: z.string().optional(),
  recentCountries: z.array(z.string()).optional(),
  recentCities: z.array(z.string()).optional(),
  recentMonuments: z.array(z.string()).optional(),
});

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: { message?: string };
};

type RandomQuiz = {
  country: string;
  city: string;
  monument: string;
  questionRu: string;
  questionEn: string;
  acceptedAnswers: string[];
  explanation: string;
  hint: string;
  stickers: string[];
  searchQuery: string;
};

type CommonsPage = {
  title?: string;
  imageinfo?: Array<{
    thumburl?: string;
    url?: string;
    descriptionurl?: string;
    mime?: string;
  }>;
};

const fallbackQuizzes: RandomQuiz[] = [
  {
    country: "Japan",
    city: "Kyoto",
    monument: "Fushimi Inari Shrine",
    questionRu: "Как называется эта известная достопримечательность Японии?",
    questionEn: "What is this famous landmark in Japan called?",
    acceptedAnswers: ["fushimi inari shrine", "fushimi inari", "фусими инари", "храм фусими инари"],
    explanation: "Фусими Инари известен тысячами красных ворот тории в Киото.",
    hint: "Посмотри на длинную дорожку с ярко-красными воротами тории.",
    stickers: ["🇯🇵", "⛩️", "🗻", "🌸"],
    searchQuery: "Fushimi Inari Shrine Kyoto photograph",
  },
  {
    country: "India",
    city: "Agra",
    monument: "Taj Mahal",
    questionRu: "Как называется этот беломраморный памятник в Индии?",
    questionEn: "What is this white marble landmark in India called?",
    acceptedAnswers: ["taj mahal", "тадж махал", "тадж-махал"],
    explanation: "Тадж-Махал — беломраморный мавзолей в Агре и одна из самых известных достопримечательностей Индии.",
    hint: "Посмотри на белый мрамор, большой купол и симметричные башни.",
    stickers: ["🇮🇳", "🕌", "🪷", "🌶️"],
    searchQuery: "Taj Mahal Agra photograph",
  },
  {
    country: "Kazakhstan",
    city: "Astana",
    monument: "Khan Shatyr",
    questionRu: "Как называется это здание в форме шатра в Астане?",
    questionEn: "What is this tent-shaped landmark in Astana called?",
    acceptedAnswers: ["khan shatyr", "han shatyr", "хан шатыр", "ханшатыр"],
    explanation: "Хан Шатыр — огромное здание в форме шатра в Астане.",
    hint: "Посмотри на форму здания: оно похоже на огромный белый шатёр.",
    stickers: ["🇰🇿", "🏕️", "🌾", "🏙️"],
    searchQuery: "Khan Shatyr Astana photograph",
  },
  {
    country: "France",
    city: "Paris",
    monument: "Eiffel Tower",
    questionRu: "Как называется эта высокая железная башня в Париже?",
    questionEn: "Как называется эта высокая железная башня в Париже?",
    acceptedAnswers: ["eiffel tower", "tour eiffel", "эйфелева башня", "башня эйфеля"],
    explanation: "Эйфелева башня — один из главных символов Парижа и Франции.",
    hint: "Посмотри на высокую железную башню с четырьмя большими опорами.",
    stickers: ["🇫🇷", "🗼", "🥐", "🎨"],
    searchQuery: "Eiffel Tower Paris photograph",
  },
  {
    country: "Italy",
    city: "Rome",
    monument: "Colosseum",
    questionRu: "Как называется этот древний амфитеатр в Риме?",
    questionEn: "Как называется этот древний амфитеатр в Риме?",
    acceptedAnswers: ["colosseum", "coliseum", "колизей"],
    explanation: "Колизей — древнеримский амфитеатр, где проходили зрелища и бои.",
    hint: "Посмотри на овальную форму и много каменных арок вокруг.",
    stickers: ["🇮🇹", "🏛️", "🍝", "🎭"],
    searchQuery: "Colosseum Rome photograph",
  },
  {
    country: "China",
    city: "Beijing",
    monument: "Great Wall of China",
    questionRu: "Как называется эта длинная каменная стена в Китае?",
    questionEn: "Как называется эта длинная каменная стена в Китае?",
    acceptedAnswers: ["great wall of china", "great wall", "великая китайская стена", "китайская стена"],
    explanation: "Великая Китайская стена тянется через горы и равнины на тысячи километров.",
    hint: "Посмотри на длинную стену, которая змейкой идёт по горам.",
    stickers: ["🇨🇳", "🐉", "🏮", "⛩️"],
    searchQuery: "Great Wall of China photograph",
  },
  {
    country: "United States",
    city: "New York",
    monument: "Statue of Liberty",
    questionRu: "Как называется эта статуя с факелом в Нью-Йорке?",
    questionEn: "Как называется эта статуя с факелом в Нью-Йорке?",
    acceptedAnswers: ["statue of liberty", "liberty statue", "статуя свободы"],
    explanation: "Статуя Свободы стоит на острове Либерти и является символом Нью-Йорка.",
    hint: "Посмотри на статую: в поднятой руке она держит факел.",
    stickers: ["🇺🇸", "🗽", "🌉", "🏙️"],
    searchQuery: "Statue of Liberty New York photograph",
  },
  {
    country: "Brazil",
    city: "Rio de Janeiro",
    monument: "Christ the Redeemer",
    questionRu: "Как называется эта огромная статуя с распростёртыми руками в Рио?",
    questionEn: "Как называется эта огромная статуя с распростёртыми руками в Рио?",
    acceptedAnswers: ["christ the redeemer", "cristo redentor", "христос-искупитель", "христос искупитель"],
    explanation: "Статуя Христа-Искупителя стоит на горе Корковаду над Рио-де-Жанейро.",
    hint: "Посмотри на статую на горе: её руки широко раскрыты.",
    stickers: ["🇧🇷", "🗿", "🌴", "⚽"],
    searchQuery: "Christ the Redeemer Rio de Janeiro photograph",
  },
  {
    country: "United Kingdom",
    city: "London",
    monument: "Tower Bridge",
    questionRu: "Как называется этот разводной мост с двумя башнями в Лондоне?",
    questionEn: "Как называется этот разводной мост с двумя башнями в Лондоне?",
    acceptedAnswers: ["tower bridge", "тауэрский мост", "тауэр бридж"],
    explanation: "Тауэрский мост — известный разводной мост через Темзу в Лондоне.",
    hint: "Посмотри на мост с двумя башнями и голубыми деталями.",
    stickers: ["🇬🇧", "🏰", "🎡", "☂️"],
    searchQuery: "Tower Bridge London photograph",
  },
  {
    country: "Egypt",
    city: "Giza",
    monument: "Great Sphinx of Giza",
    questionRu: "Как называется эта древняя фигура с телом льва в Гизе?",
    questionEn: "Как называется эта древняя фигура с телом льва в Гизе?",
    acceptedAnswers: ["great sphinx of giza", "sphinx", "сфинкс", "великий сфинкс"],
    explanation: "Великий сфинкс Гизы — древняя статуя с телом льва и головой человека.",
    hint: "Посмотри на фигуру: тело как у льва, а голова человеческая.",
    stickers: ["🇪🇬", "𓂀", "🏜️", "☀️"],
    searchQuery: "Great Sphinx of Giza photograph",
  },
  {
    country: "Greece",
    city: "Athens",
    monument: "Parthenon",
    questionRu: "Как называется этот древний храм на Акрополе в Афинах?",
    questionEn: "Как называется этот древний храм на Акрополе в Афинах?",
    acceptedAnswers: ["parthenon", "парфенон"],
    explanation: "Парфенон — древнегреческий храм на Афинском акрополе.",
    hint: "Посмотри на древний храм с высокими колоннами на холме.",
    stickers: ["🇬🇷", "🏛️", "🌊", "🫒"],
    searchQuery: "Parthenon Athens photograph",
  },
  {
    country: "Spain",
    city: "Barcelona",
    monument: "Sagrada Familia",
    questionRu: "Как называется этот необычный собор в Барселоне?",
    questionEn: "Как называется этот необычный собор в Барселоне?",
    acceptedAnswers: ["sagrada familia", "саграда фамилия", "собор святого семейства"],
    explanation: "Саграда Фамилия — знаменитый собор Антонио Гауди в Барселоне.",
    hint: "Посмотри на очень высокие башни и необычные узорные фасады.",
    stickers: ["🇪🇸", "🏰", "🎨", "🌊"],
    searchQuery: "Sagrada Familia Barcelona photograph",
  },
  {
    country: "Turkey",
    city: "Istanbul",
    monument: "Hagia Sophia",
    questionRu: "Как называется это здание с большим куполом в Стамбуле?",
    questionEn: "Как называется это здание с большим куполом в Стамбуле?",
    acceptedAnswers: ["hagia sophia", "ayasofya", "айя-софия", "собор святой софии"],
    explanation: "Айя-София — историческое здание с огромным куполом в Стамбуле.",
    hint: "Посмотри на большой центральный купол и минареты вокруг здания.",
    stickers: ["🇹🇷", "🕌", "🌉", "☕"],
    searchQuery: "Hagia Sophia Istanbul photograph",
  },
  {
    country: "Mexico",
    city: "Chichen Itza",
    monument: "El Castillo",
    questionRu: "Как называется эта ступенчатая пирамида майя в Чичен-Ице?",
    questionEn: "Как называется эта ступенчатая пирамида майя в Чичен-Ице?",
    acceptedAnswers: ["el castillo", "temple of kukulcan", "эль кастильо", "храм кукулькана"],
    explanation: "Эль-Кастильо — пирамида храма Кукулькана в древнем городе Чичен-Ица.",
    hint: "Посмотри на ступенчатую пирамиду с лестницами по сторонам.",
    stickers: ["🇲🇽", "🌵", "🛕", "🎺"],
    searchQuery: "El Castillo Chichen Itza photograph",
  },
  {
    country: "Peru",
    city: "Cusco Region",
    monument: "Machu Picchu",
    questionRu: "Как называется этот древний город инков высоко в горах Перу?",
    questionEn: "Как называется этот древний город инков высоко в горах Перу?",
    acceptedAnswers: ["machu picchu", "мачу-пикчу", "мачу пикчу"],
    explanation: "Мачу-Пикчу — древний город инков в Андах.",
    hint: "Посмотри на каменные террасы и горы вокруг древнего города.",
    stickers: ["🇵🇪", "⛰️", "🛕", "☀️"],
    searchQuery: "Machu Picchu Peru photograph",
  },
  {
    country: "Australia",
    city: "Sydney",
    monument: "Sydney Opera House",
    questionRu: "Как называется это здание с белыми крышами-парусами в Сиднее?",
    questionEn: "Как называется это здание с белыми крышами-парусами в Сиднее?",
    acceptedAnswers: ["sydney opera house", "сиднейская опера", "сиднейский оперный театр"],
    explanation: "Сиднейский оперный театр знаменит крышами, похожими на паруса.",
    hint: "Посмотри на белые крыши, похожие на паруса у воды.",
    stickers: ["🇦🇺", "🪃", "🏛️", "🌊"],
    searchQuery: "Sydney Opera House photograph",
  },
  {
    country: "Germany",
    city: "Bavaria",
    monument: "Neuschwanstein Castle",
    questionRu: "Как называется этот сказочный замок в Баварии?",
    questionEn: "Как называется этот сказочный замок в Баварии?",
    acceptedAnswers: ["neuschwanstein castle", "neuschwanstein", "нойшванштайн", "замок нойшванштайн"],
    explanation: "Нойшванштайн — знаменитый замок в Баварских Альпах.",
    hint: "Посмотри на белый замок с башнями на холме среди гор.",
    stickers: ["🇩🇪", "🏰", "🎻", "🌲"],
    searchQuery: "Neuschwanstein Castle photograph",
  },
  {
    country: "United Arab Emirates",
    city: "Dubai",
    monument: "Burj Khalifa",
    questionRu: "Как называется этот сверхвысокий небоскрёб в Дубае?",
    questionEn: "Как называется этот сверхвысокий небоскрёб в Дубае?",
    acceptedAnswers: ["burj khalifa", "бурдж-халифа", "бурдж халифа"],
    explanation: "Бурдж-Халифа — самый высокий небоскрёб в мире.",
    hint: "Посмотри на очень высокий и тонкий небоскрёб с острым верхом.",
    stickers: ["🇦🇪", "🏙️", "🏜️", "✨"],
    searchQuery: "Burj Khalifa Dubai photograph",
  },
];

function cleanText(text: string, maxLength = 220) {
  return text
    .replace(/\s+/g, " ")
    .replace(/^["'«]+|["'»]+$/g, "")
    .trim()
    .slice(0, maxLength);
}

function countryStickers(country: string) {
  const key = country.toLowerCase();
  const stickerMap: Record<string, string[]> = {
    australia: ["🇦🇺", "🪃", "🏛️", "🌊"],
    brazil: ["🇧🇷", "🗿", "🌴", "⚽"],
    china: ["🇨🇳", "🐉", "🏮", "⛩️"],
    egypt: ["🇪🇬", "𓂀", "🏜️", "☀️"],
    france: ["🇫🇷", "🗼", "🥐", "🎨"],
    germany: ["🇩🇪", "🏰", "🎻", "🌲"],
    greece: ["🇬🇷", "🏛️", "🌊", "🫒"],
    india: ["🇮🇳", "🕌", "🪷", "🌶️"],
    italy: ["🇮🇹", "🏛️", "🍝", "🎭"],
    japan: ["🇯🇵", "⛩️", "🗻", "🌸"],
    kazakhstan: ["🇰🇿", "🏕️", "🌾", "🏙️"],
    mexico: ["🇲🇽", "🌵", "🛕", "🎺"],
    morocco: ["🇲🇦", "🕌", "🏜️", "🧿"],
    peru: ["🇵🇪", "⛰️", "🛕", "☀️"],
    spain: ["🇪🇸", "🏰", "🎨", "🌊"],
    thailand: ["🇹🇭", "🛕", "🌺", "🐘"],
    turkey: ["🇹🇷", "🕌", "🌉", "☕"],
    "south korea": ["🇰🇷", "🏯", "🌸", "🎎"],
    "united kingdom": ["🇬🇧", "🏰", "🎡", "☂️"],
    "united states": ["🇺🇸", "🗽", "🌉", "🏙️"],
  };
  return stickerMap[key] ?? ["🌍", "🧭", "📍", "✨"];
}

function normalizeStickers(value: unknown, country: string) {
  if (!Array.isArray(value)) return countryStickers(country);
  const stickers = value
    .map((item) => cleanText(String(item), 8))
    .filter(Boolean)
    .slice(0, 4);
  return stickers.length ? stickers : countryStickers(country);
}

function keywordTokens(text: string) {
  return text
    .toLowerCase()
    .replace(/file:/g, " ")
    .split(/[^a-zа-яё0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 4 && !["photo", "image", "photograph", "commons"].includes(token));
}

function titleMatchesLandmark(title: string, landmark: string) {
  const titleTokens = keywordTokens(title);
  const landmarkTokens = keywordTokens(landmark);
  if (!landmarkTokens.length) return true;
  return landmarkTokens.some((token) => titleTokens.includes(token));
}

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function includesKey(values: string[] | undefined, value: string) {
  const key = normalizeKey(value);
  return (values ?? []).some((item) => normalizeKey(item) === key);
}

function isRecentQuiz(quiz: RandomQuiz, data: z.infer<typeof randomQuizInput>) {
  return (
    includesKey(data.recentCountries, quiz.country)
    || includesKey(data.recentCities, quiz.city)
    || includesKey(data.recentMonuments, quiz.monument)
  );
}

function getGeminiConfig() {
  return {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  };
}

async function askGemini(prompt: string, maxOutputTokens = 160, jsonMode = false) {
  const { apiKey, model } = getGeminiConfig();

  if (!apiKey) return null;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens,
          ...(jsonMode ? { responseMimeType: "application/json" } : {}),
        },
      }),
    },
  );

  const payload = (await response.json()) as GeminiResponse;

  if (!response.ok) {
    const message = payload.error?.message || "Gemini API request failed.";
    throw new Error(message);
  }

  return payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join(" ")
    .trim() ?? null;
}

function parseJsonObject(text: string) {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Gemini returned no JSON object.");
  return JSON.parse(match[0]) as Partial<RandomQuiz>;
}

function normalizeQuiz(raw: Partial<RandomQuiz>): RandomQuiz {
  const quiz = {
    country: cleanText(raw.country || "Japan", 80),
    city: cleanText(raw.city || "Kyoto", 80),
    monument: cleanText(raw.monument || "Fushimi Inari Shrine", 100),
    questionRu: cleanText(raw.questionRu || "Как называется эта достопримечательность?", 180),
    questionEn: cleanText(raw.questionEn || "Как называется эта достопримечательность?", 180),
    acceptedAnswers: Array.isArray(raw.acceptedAnswers) ? raw.acceptedAnswers : [],
    explanation: cleanText(raw.explanation || "Это известная достопримечательность.", 220),
    hint: cleanText(raw.hint || `Она находится в городе ${raw.city || "этой страны"}.`, 160),
    stickers: normalizeStickers(raw.stickers, raw.country || "World"),
    searchQuery: cleanText(raw.searchQuery || raw.monument || "famous landmark photograph", 140),
  };

  const answers = quiz.acceptedAnswers
    .map((answer) => cleanText(String(answer), 80).toLowerCase())
    .filter(Boolean);

  return {
    ...quiz,
    acceptedAnswers: Array.from(new Set([quiz.monument.toLowerCase(), ...answers])),
  };
}

async function getCommonsImage(searchQuery: string, landmark: string) {
  const apiUrl = new URL("https://commons.wikimedia.org/w/api.php");
  apiUrl.searchParams.set("action", "query");
  apiUrl.searchParams.set("format", "json");
  apiUrl.searchParams.set("generator", "search");
  apiUrl.searchParams.set("gsrnamespace", "6");
  apiUrl.searchParams.set("gsrlimit", "12");
  apiUrl.searchParams.set("gsrsearch", searchQuery);
  apiUrl.searchParams.set("prop", "imageinfo");
  apiUrl.searchParams.set("iiprop", "url|mime");
  apiUrl.searchParams.set("iiurlwidth", "1400");
  apiUrl.searchParams.set("origin", "*");

  const response = await fetch(apiUrl, {
    headers: { "user-agent": "WorldQuestAtlas/1.0 educational quiz" },
  });
  const payload = await response.json() as { query?: { pages?: Record<string, CommonsPage> } };
  const pages = Object.values(payload.query?.pages ?? {}).filter((page) => {
    const info = page.imageinfo?.[0];
    return info?.mime?.startsWith("image/") && (info.thumburl || info.url);
  });
  const matchingPages = pages.filter((page) => titleMatchesLandmark(page.title || "", landmark));
  const pagePool = matchingPages.length ? matchingPages : [];
  const page = pagePool[Math.floor(Math.random() * pagePool.length)];
  const info = page?.imageinfo?.[0];

  if (!page || !info) return null;

  return {
    imageUrl: info.thumburl || info.url || "",
    imageSourceUrl: info.descriptionurl || "https://commons.wikimedia.org",
    imageTitle: page.title || "Wikimedia Commons image",
  };
}

export const getGeminiHint = createServerFn({ method: "POST" })
  .inputValidator(aiHintInput)
  .handler(async ({ data }) => {
    const prompt = [
      "You are a friendly AI guide inside a geography quiz for students.",
      "Write one short hint in Russian.",
      "Do not reveal the direct answer or any accepted answer.",
      "Do not use markdown. Keep it under 24 words.",
      "",
      `Landmark: ${data.monument}`,
      `City: ${data.city}`,
      `Country: ${data.country}`,
      `Question in Russian: ${data.questionRu}`,
      `Question in English: ${data.questionEn}`,
      `Accepted answers to avoid revealing: ${data.acceptedAnswers.join(", ")}`,
    ].join("\n");

    const hint = await askGemini(prompt, 80);

    if (!hint) {
      return {
        hint: "AI hint is ready in the code. Add GEMINI_API_KEY in Vercel environment variables.",
        configured: false,
      };
    }

    return {
      hint: cleanText(hint),
      configured: true,
    };
  });

export const getRandomGeminiQuiz = createServerFn({ method: "POST" })
  .inputValidator(randomQuizInput)
  .handler(async ({ data }) => {
    const allCountries = [
      "Kazakhstan", "Japan", "India", "Egypt", "Mexico", "Brazil", "Turkey", "Spain",
      "France", "Italy", "China", "United Kingdom", "United States", "South Korea",
      "Thailand", "Greece", "Australia", "Morocco", "Peru", "Germany", "Canada",
      "Argentina", "Chile", "Colombia", "Portugal", "Netherlands", "Belgium", "Austria",
      "Switzerland", "Czech Republic", "Poland", "Hungary", "Romania", "Bulgaria",
      "Croatia", "Serbia", "Norway", "Sweden", "Finland", "Denmark", "Iceland",
      "Ireland", "Ukraine", "Georgia", "Armenia", "Azerbaijan", "Uzbekistan",
      "Kyrgyzstan", "Mongolia", "Indonesia", "Malaysia", "Singapore", "Vietnam",
      "Cambodia", "Laos", "Myanmar", "Philippines", "Nepal", "Sri Lanka", "Pakistan",
      "Iran", "Iraq", "Jordan", "Israel", "Saudi Arabia", "United Arab Emirates",
      "Qatar", "Oman", "Ethiopia", "Kenya", "Tanzania", "South Africa", "Madagascar",
      "Tunisia", "Algeria", "Nigeria", "Ghana", "Senegal", "New Zealand", "Fiji",
    ];
    const countryPool = allCountries.filter((country) => (
      country !== data.previousCountry && !includesKey(data.recentCountries, country)
    ));
    const country = countryPool[Math.floor(Math.random() * countryPool.length)] || "Japan";

    const prompt = [
      "Create one random geography quiz item for a landmarks game.",
      "Pick a real, visually recognizable landmark in the given country.",
      "Return only valid JSON. No markdown.",
      "All player-facing text must be in Russian: questionRu, questionEn, explanation, and hint.",
      "The Russian question should ask the player to identify the landmark from a photo.",
      "Make questionRu the only useful player-facing question. Put the same Russian text in questionEn.",
      "Add one very clear Russian hint for a child, starting with 'Посмотри на...'.",
      "The hint must point to a visible detail in the photo: shape, color, material, towers, dome, bridge, statue pose, or landscape.",
      "The hint must be specific enough to help, but must not reveal the exact landmark name.",
      "Add four small country-related emoji stickers.",
      "Include accepted answers in English and Russian when possible.",
      "Do not use any country, city, or landmark from the avoid lists.",
      "",
      `Country: ${country}`,
      `Avoid countries: ${(data.recentCountries ?? []).join(", ") || "none"}`,
      `Avoid cities: ${(data.recentCities ?? []).join(", ") || "none"}`,
      `Avoid landmarks: ${(data.recentMonuments ?? []).join(", ") || "none"}`,
      "",
      "JSON shape:",
      "{",
      '  "country": "Country name",',
      '  "city": "City or region",',
      '  "monument": "Landmark name",',
      '  "questionRu": "Russian question",',
      '  "questionEn": "Same Russian question",',
      '  "acceptedAnswers": ["answer 1", "answer 2"],',
      '  "explanation": "One short explanation in Russian",',
      '  "hint": "Посмотри на one clear visual clue, without the answer",',
      '  "stickers": ["emoji 1", "emoji 2", "emoji 3", "emoji 4"],',
      '  "searchQuery": "Specific Wikimedia Commons image search query"',
      "}",
    ].join("\n");

    let quiz: RandomQuiz | null = null;
    const availableFallbacks = fallbackQuizzes.filter((item) => !isRecentQuiz(item, data));
    const fallbackPool = availableFallbacks.length ? availableFallbacks : fallbackQuizzes;
    const fallbackQuiz = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const geminiText = await askGemini(prompt, 520, true);
        const candidate = geminiText ? normalizeQuiz(parseJsonObject(geminiText)) : null;
        if (candidate && !isRecentQuiz(candidate, data)) {
          quiz = candidate;
          break;
        }
      } catch (error) {
        console.error("[Gemini random quiz] Generation attempt failed:", error);
      }
    }

    if (!quiz) {
      quiz = fallbackQuiz;
    }

    const image = await getCommonsImage(quiz.searchQuery || `${quiz.monument} ${quiz.country} photograph`, quiz.monument);

    return {
      ...quiz,
      imageUrl: image?.imageUrl || "",
      imageSourceUrl: image?.imageSourceUrl || "",
      imageTitle: image?.imageTitle || "",
    };
  });
