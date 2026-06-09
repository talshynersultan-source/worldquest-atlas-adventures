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
    explanation: "Fushimi Inari Shrine is famous for thousands of red torii gates in Kyoto.",
    hint: "Look for thousands of bright red gates on a mountain path.",
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
    explanation: "The Taj Mahal is a marble mausoleum in Agra and one of India's most famous landmarks.",
    hint: "It is a white marble monument built beside the Yamuna River.",
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
    explanation: "Khan Shatyr is a huge tent-shaped entertainment center in Astana, Kazakhstan.",
    hint: "Its name means royal tent.",
    stickers: ["🇰🇿", "🏕️", "🌾", "🏙️"],
    searchQuery: "Khan Shatyr Astana photograph",
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
    questionEn: cleanText(raw.questionEn || "What is this landmark called?", 180),
    acceptedAnswers: Array.isArray(raw.acceptedAnswers) ? raw.acceptedAnswers : [],
    explanation: cleanText(raw.explanation || "This is a famous landmark.", 220),
    hint: cleanText(raw.hint || `It is in ${raw.city || "this city"}, ${raw.country || "this country"}.`, 160),
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
    const countryPool = [
      "Kazakhstan", "Japan", "India", "Egypt", "Mexico", "Brazil", "Turkey", "Spain",
      "France", "Italy", "China", "United Kingdom", "United States", "South Korea",
      "Thailand", "Greece", "Australia", "Morocco", "Peru", "Germany",
    ].filter((country) => country !== data.previousCountry);
    const country = countryPool[Math.floor(Math.random() * countryPool.length)] || "Japan";

    const prompt = [
      "Create one random geography quiz item for a landmarks game.",
      "Pick a real, visually recognizable landmark in the given country.",
      "Return only valid JSON. No markdown.",
      "The question should ask the player to identify the landmark from a photo.",
      "Make questionRu the only player-facing question. Do not repeat the same sentence in questionEn.",
      "Add one helpful hint that does not reveal the answer.",
      "Add four small country-related emoji stickers.",
      "Include accepted answers in English and Russian when possible.",
      "",
      `Country: ${country}`,
      "",
      "JSON shape:",
      "{",
      '  "country": "Country name",',
      '  "city": "City or region",',
      '  "monument": "Landmark name",',
      '  "questionRu": "Russian question",',
      '  "questionEn": "English question",',
      '  "acceptedAnswers": ["answer 1", "answer 2"],',
      '  "explanation": "One short explanation in Russian",',
      '  "hint": "One short hint without the answer",',
      '  "stickers": ["emoji 1", "emoji 2", "emoji 3", "emoji 4"],',
      '  "searchQuery": "Specific Wikimedia Commons image search query"',
      "}",
    ].join("\n");

    let quiz: RandomQuiz;
    const fallbackQuiz = fallbackQuizzes[Math.floor(Math.random() * fallbackQuizzes.length)];

    try {
      const geminiText = await askGemini(prompt, 420, true);
      quiz = geminiText ? normalizeQuiz(parseJsonObject(geminiText)) : fallbackQuiz;
    } catch (error) {
      console.error("[Gemini random quiz] Falling back to built-in quiz:", error);
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
