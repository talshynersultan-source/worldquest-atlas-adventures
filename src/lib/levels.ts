import eiffel from "@/assets/eiffel.jpg";
import bigben from "@/assets/bigben.jpg";
import greatwall from "@/assets/greatwall.jpg";
import liberty from "@/assets/liberty.jpg";
import colosseum from "@/assets/colosseum.jpg";
import burj from "@/assets/burj.jpg";
import christ from "@/assets/christ.jpg";
import npcAmelie from "@/assets/npc-amelie.png";
import npcOliver from "@/assets/npc-oliver.png";
import npcMei from "@/assets/npc-mei.png";
import npcJack from "@/assets/npc-jack.png";
import npcMarco from "@/assets/npc-marco.png";
import npcLayla from "@/assets/npc-layla.png";
import npcBruno from "@/assets/npc-bruno.png";

export type Level = {
  id: number;
  image: string;
  flag: string;
  city: string;
  country: string;
  monument: string;
  npc: string;
  avatar: string;
  intro: string;
  fact: string;
  vocab: string[];
  questions: { q: string; answers: string[]; explain: string }[];
};

export const LEVELS: Level[] = [
  {
    id: 1, image: eiffel, flag: "🇫🇷", city: "Paris", country: "France", monument: "Eiffel Tower",
    npc: "Bonjour! I'm Amélie 🥖", avatar: npcAmelie,
    intro: "Welcome to the City of Light! Look up at this iron giant.",
    fact: "The Eiffel Tower was built in 1889 for the World's Fair and grows 6 inches taller in summer heat!",
    vocab: ["Tour Eiffel", "Paris"],
    questions: [
      { q: "What monument is shown in this image?", answers: ["eiffel tower", "eiffel", "tour eiffel", "эйфелева башня", "эйфелева", "эйфель"], explain: "It's the iconic Eiffel Tower." },
      { q: "Which country is it located in?", answers: ["france", "франция"], explain: "It stands in France." },
      { q: "Which city hosts this landmark?", answers: ["paris", "париж"], explain: "It's in Paris, the capital of France." },
    ],
  },
  {
    id: 2, image: bigben, flag: "🇬🇧", city: "London", country: "United Kingdom", monument: "Big Ben",
    npc: "Cheerio! I'm Oliver 🎩", avatar: npcOliver,
    intro: "Mind the gap! This clock tower has been chiming since 1859.",
    fact: "Big Ben is actually the name of the great bell inside the tower — the tower is called Elizabeth Tower.",
    vocab: ["Clock tower", "London"],
    questions: [
      { q: "What monument is shown in this image?", answers: ["big ben", "elizabeth tower", "биг бен", "бигбен"], explain: "That's Big Ben!" },
      { q: "Which country is it in?", answers: ["uk", "united kingdom", "england", "britain", "great britain", "великобритания", "англия", "британия"], explain: "It's in the United Kingdom." },
      { q: "Which city hosts it?", answers: ["london", "лондон"], explain: "Big Ben rises over London." },
    ],
  },
  {
    id: 3, image: greatwall, flag: "🇨🇳", city: "Beijing", country: "China", monument: "Great Wall of China",
    npc: "Nǐ hǎo! I'm Mei 🐉", avatar: npcMei,
    intro: "This stone serpent stretches across mountains for thousands of miles.",
    fact: "The Great Wall is over 21,000 km long — built across many dynasties to defend the empire.",
    vocab: ["Great Wall", "Beijing"],
    questions: [
      { q: "What monument is shown?", answers: ["great wall", "great wall of china", "the great wall", "великая китайская стена", "китайская стена", "стена"], explain: "The Great Wall of China." },
      { q: "Which country is it in?", answers: ["china", "китай"], explain: "It winds through northern China." },
      { q: "What is it famous for? (one word)", answers: ["length", "long", "defense", "wall", "длина", "стена", "защита", "длинная"], explain: "Famous for its incredible length and defensive purpose." },
    ],
  },
  {
    id: 4, image: liberty, flag: "🇺🇸", city: "New York", country: "United States", monument: "Statue of Liberty",
    npc: "Howdy! I'm Jack 🗽", avatar: npcJack,
    intro: "She holds her torch high, welcoming travelers to a new world.",
    fact: "The Statue of Liberty was a gift from France to the United States in 1886.",
    vocab: ["Liberty", "New York"],
    questions: [
      { q: "What monument is shown?", answers: ["statue of liberty", "liberty", "статуя свободы", "свобода"], explain: "The Statue of Liberty." },
      { q: "Which country is it in?", answers: ["usa", "us", "united states", "america", "united states of america", "сша", "америка", "соединенные штаты"], explain: "It stands in the USA." },
      { q: "Which city is it in?", answers: ["new york", "new york city", "nyc", "нью йорк", "нью-йорк", "ньюйорк"], explain: "It's in New York City harbor." },
    ],
  },
  {
    id: 5, image: colosseum, flag: "🇮🇹", city: "Rome", country: "Italy", monument: "Colosseum",
    npc: "Ciao! I'm Marco 🍕", avatar: npcMarco,
    intro: "Step into the arena where gladiators once roared with the crowd.",
    fact: "The Colosseum could hold up to 80,000 spectators and is nearly 2,000 years old!",
    vocab: ["Amphitheater", "Rome"],
    questions: [
      { q: "What monument is shown?", answers: ["colosseum", "coliseum", "колизей"], explain: "The mighty Colosseum." },
      { q: "Which country is it in?", answers: ["italy", "италия"], explain: "It's in Italy." },
      { q: "Which city hosts it?", answers: ["rome", "рим"], explain: "It stands in Rome." },
    ],
  },
  {
    id: 6, image: burj, flag: "🇦🇪", city: "Dubai", country: "United Arab Emirates", monument: "Burj Khalifa",
    npc: "Marhaba! I'm Layla ✨", avatar: npcLayla,
    intro: "Tilt your head all the way back — this is the tallest building on Earth.",
    fact: "Burj Khalifa stands 828 meters tall — taller than two Eiffel Towers stacked!",
    vocab: ["Skyscraper", "Dubai"],
    questions: [
      { q: "What monument is shown?", answers: ["burj khalifa", "burj", "бурдж халифа", "бурж халифа", "бурдж"], explain: "Burj Khalifa, the world's tallest." },
      { q: "Which country is it in?", answers: ["uae", "united arab emirates", "emirates", "оаэ", "эмираты", "объединенные арабские эмираты"], explain: "It's in the UAE." },
      { q: "Which city hosts it?", answers: ["dubai", "дубай"], explain: "It dominates the Dubai skyline." },
    ],
  },
  {
    id: 7, image: christ, flag: "🇧🇷", city: "Rio de Janeiro", country: "Brazil", monument: "Christ the Redeemer",
    npc: "Olá! I'm Bruno 🎉", avatar: npcBruno,
    intro: "Final stop! He stands with open arms over the city of samba.",
    fact: "Christ the Redeemer is 30 m tall and was named one of the New Seven Wonders of the World.",
    vocab: ["Statue", "Rio"],
    questions: [
      { q: "What monument is shown?", answers: ["christ the redeemer", "cristo redentor", "redeemer", "christ", "статуя христа", "христос искупитель", "христос"], explain: "Christ the Redeemer." },
      { q: "Which country is it in?", answers: ["brazil", "brasil", "бразилия"], explain: "It's in Brazil." },
      { q: "Which city hosts it?", answers: ["rio", "rio de janeiro", "рио", "рио де жанейро", "рио-де-жанейро"], explain: "Rio de Janeiro!" },
    ],
  },
];

export function checkAnswer(input: string, answers: string[]): "correct" | "close" | "wrong" {
  const norm = (s: string) =>
    s.toLowerCase().trim().replace(/ё/g, "е").replace(/[^a-z0-9а-я ]/g, "").replace(/\s+/g, " ");
  const a = norm(input);
  if (!a) return "wrong";
  if (answers.some((x) => norm(x) === a)) return "correct";
  if (answers.some((x) => norm(x).includes(a) || a.includes(norm(x)))) return "close";
  // Levenshtein-ish: allow 1-char difference
  for (const x of answers) {
    const nx = norm(x);
    if (Math.abs(nx.length - a.length) <= 1) {
      let diffs = 0;
      for (let i = 0, j = 0; i < nx.length || j < a.length; ) {
        if (nx[i] === a[j]) { i++; j++; continue; }
        diffs++;
        if (diffs > 1) break;
        if (nx.length > a.length) i++;
        else if (a.length > nx.length) j++;
        else { i++; j++; }
      }
      if (diffs <= 1) return "close";
    }
  }
  return "wrong";
}

export function rankFor(score: number): string {
  if (score >= 200) return "🏆 Geography Master";
  if (score >= 140) return "🧭 World Navigator";
  if (score >= 80) return "🌍 Explorer";
  return "🌱 Beginner Traveler";
}