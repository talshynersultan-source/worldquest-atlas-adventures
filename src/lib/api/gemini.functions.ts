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
    searchQuery: "Taj Mahal Agra photograph",
  },
  {
    country: "Kazakhstan",
    city: "Astana",
    monument: "Baiterek",
    questionRu: "Как называется эта башня-символ Астаны?",
    questionEn: "What is this tower symbol of Astana called?",
    acceptedAnswers: ["baiterek", "bayterek", "байтерек", "бәйтерек"],
    explanation: "Baiterek is a landmark tower in Astana, Kazakhstan.",
    searchQuery: "Baiterek Astana photograph",
  },
];

function cleanText(text: string, maxLength = 220) {
  return text
    .replace(/\s+/g, " ")
    .replace(/^["'«]+|["'»]+$/g, "")
    .trim()
    .slice(0, maxLength);
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

async function getCommonsImage(searchQuery: string) {
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
  const page = pages[Math.floor(Math.random() * pages.length)];
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

    const image = await getCommonsImage(quiz.searchQuery || `${quiz.monument} ${quiz.country} photograph`);

    return {
      ...quiz,
      imageUrl: image?.imageUrl || "",
      imageSourceUrl: image?.imageSourceUrl || "",
      imageTitle: image?.imageTitle || "",
    };
  });
