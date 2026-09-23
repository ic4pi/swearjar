export const FALLBACK_SETTINGS: Record<string, string> = {
  cashAppTag: "$TourettesInc",
  contactEmail: "tourettesinc@gmail.com",
  bookingEmail: "tourettesinc@gmail.com",
  location: "San Antonio, Texas",
  patreonUrl: "",
  instagramUrl: "",
  tiktokUrl: "",
  youtubeUrl: "",
  twitchUrl: "",
  heroVideoUrl: "",
};

export function formatPrice(priceCents: number): string {
  return `$${(priceCents / 100).toFixed(priceCents % 100 === 0 ? 0 : 2)}`;
}

export function mailto(email: string, subject: string, body = ""): string {
  const q = new URLSearchParams({ subject, ...(body ? { body } : {}) });
  return `mailto:${email}?${q.toString()}`;
}

export const CATEGORY_META = {
  activism: {
    title: "Multipurpose Apparel",
    tagline: "Wear the awareness. Start the conversation.",
    hand: "for the mission",
  },
  funny: {
    title: "Just Funny",
    tagline: "No cause. No message. Just funny.",
    hand: "for the laughs",
  },
  odds: {
    title: "Odds & Ends",
    tagline: "Stickers, pins, and whatever else showed up.",
    hand: "random sh*t",
  },
} as const;

export type CategoryKey = keyof typeof CATEGORY_META;

export const ABOUT_TEXT = `Hello Humans! My name is Zachariah Tippett, but you can call me Tourette's — and I have Tourette's Syndrome.

Ever since I was a kid, I always wanted to make people laugh. At 15 I started writing jokes, stories, everything. Now I'm 26 and a full-time stand-up comedian — my dreams are coming true with a big twist. I've found a way to make people laugh while spreading awareness and education about Tourette's Syndrome.

Let's be honest: TS is not talked about enough. I've been performing at clubs, events, colleges — anywhere I can go — spreading the word about Tourette's Syndrome one laugh at a time.`;
