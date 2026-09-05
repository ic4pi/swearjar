import type { Product, Show } from '@/types';

// Activism series - Tourette's awareness designs
export const products: Product[] = [
  {
    id: '1',
    name: 'Tic & Talk Hoodie',
    description: 'Start conversations. Spread awareness. Stay comfortable.',
    price: 45,
    image: '/product_sweater_1.jpg',
    category: 'apparel',
    series: 'activism',
    variants: ['Unisex Hoodie', 'Unisex T-Shirt'],
    printfulUrl: 'https://www.printful.com/'
  },
  {
    id: '2',
    name: '1 in 100 Hoodie',
    description: '1 in 100 school-aged kids have Tourette\'s. Wear the stat, start the conversation.',
    price: 45,
    image: '/product_sweater_1.jpg',
    category: 'apparel',
    series: 'activism',
    variants: ['Unisex Hoodie'],
    printfulUrl: 'https://www.printful.com/'
  },
  {
    id: '3',
    name: 'Warrior Hoodie',
    description: 'For the fighters. For the advocates. For everyone.',
    price: 48,
    image: '/product_sweater_1.jpg',
    category: 'apparel',
    series: 'activism',
    variants: ['Unisex Hoodie', 'Unisex T-Shirt'],
    printfulUrl: 'https://www.printful.com/'
  },
  {
    id: '4',
    name: 'Awareness Ambassador Hoodie',
    description: 'Be an ambassador for understanding. Wear it proudly.',
    price: 45,
    image: '/product_sweater_1.jpg',
    category: 'apparel',
    series: 'activism',
    variants: ['Unisex Hoodie'],
    printfulUrl: 'https://www.printful.com/'
  },
  {
    id: '9',
    name: "Tourette's Awareness Hoodie",
    description: "Design by Smart_Ppl. Wear the awareness, start the conversation.",
    price: 45,
    image: '/product_sweater_1.jpg',
    category: 'apparel',
    series: 'activism',
    variants: ['Unisex Hoodie']
  }
];

// Funny series - no category, just laughs
export const funnyProducts: Product[] = [
  {
    id: '5',
    name: 'Laugh Out Loud Hoodie',
    description: 'No cause, no message. Just funny.',
    price: 45,
    image: '/product_sweater_1.jpg',
    category: 'apparel',
    series: 'funny',
    variants: ['Unisex Hoodie', 'Unisex T-Shirt'],
    printfulUrl: 'https://www.printful.com/'
  },
  {
    id: '6',
    name: 'Stage Ready Hoodie',
    description: 'Comfortable enough for the green room, funny enough for the front row.',
    price: 45,
    image: '/product_sweater_1.jpg',
    category: 'apparel',
    series: 'funny',
    variants: ['Unisex Hoodie'],
    printfulUrl: 'https://www.printful.com/'
  },
  {
    id: '7',
    name: 'Comedy Club Hoodie',
    description: 'For anyone who thinks they could probably do five minutes too.',
    price: 45,
    image: '/product_sweater_1.jpg',
    category: 'apparel',
    series: 'funny',
    variants: ['Unisex Hoodie', 'Unisex T-Shirt'],
    printfulUrl: 'https://www.printful.com/'
  },
  {
    id: '8',
    name: 'Zachariah Tippett Original Hoodie',
    description: 'The original. The classic. The statement.',
    price: 48,
    image: '/product_sweater_1.jpg',
    category: 'apparel',
    series: 'funny',
    variants: ['Unisex Hoodie'],
    printfulUrl: 'https://www.printful.com/'
  }
];

export const accessoryProducts: Product[] = [
  {
    id: 'a1',
    name: 'Sticker Pack',
    description: 'Spread awareness everywhere you go. 5 premium vinyl stickers.',
    price: 8,
    image: '/product_sticker_1.jpg',
    category: 'accessories',
    variants: ['Standard Pack'],
    printfulUrl: 'https://www.printful.com/'
  },
  {
    id: 'a2',
    name: 'Morning Mug',
    description: 'Start your day with a smile and a cause. 11oz ceramic.',
    price: 16,
    image: '/shop_mug.jpg',
    category: 'accessories',
    variants: ['11oz Mug'],
    printfulUrl: 'https://www.printful.com/'
  },
  {
    id: 'a3',
    name: 'Enamel Pin Set',
    description: 'Wear your support. Collectible quality pins.',
    price: 12,
    image: '/product_pin_1.jpg',
    category: 'accessories',
    variants: ['Set of 3'],
    printfulUrl: 'https://www.printful.com/'
  },
  {
    id: 'a4',
    name: 'Tote Bag',
    description: 'Carry the message. Durable canvas, bold design.',
    price: 22,
    image: '/product_tote_1.jpg',
    category: 'accessories',
    variants: ['Standard Tote'],
    printfulUrl: 'https://www.printful.com/'
  }
];

export const shows: Show[] = [
  {
    id: '1',
    date: 'Mar 15, 2026', // Full date - won't repeat after this date
    venue: 'The Laugh Lounge',
    location: 'Austin, TX',
    link: '#'
  },
  {
    id: '2',
    date: 'Mar 28, 2026', // Full date - won't repeat after this date
    venue: 'Comedy Cellar',
    location: 'San Antonio, TX',
    link: '#'
  },
  {
    id: '3',
    date: 'Sunday', // Day of week - repeats every Sunday
    venue: 'Virtual Livestream',
    location: 'Twitch',
    link: '#'
  },
  {
    id: '4',
    date: 'Monday', // Day of week - repeats every Monday
    venue: 'The Improv',
    location: 'Dallas, TX',
    link: '#'
  },
  {
    id: '5',
    date: 'Friday', // Day of week - repeats every Friday
    venue: 'Comedy Club',
    location: 'Houston, TX',
    link: '#'
  }
];

export const aboutMeText = `Hello Humans! my name is Zachariah Tippett but, you can call me Tourette's and I have Tourette's Syndrome

Ever since I was a kid, I always wanted to make people laugh! At 15 I started writing jokes, stories, etc. Now I'm 26 and am a full-time stand-up comedian! My dreams are coming true with a big twist! I've been able to come up with a way to make people laugh as well as spread awareness and education to everyone about Tourette's syndrome!

Let's be honest TS is a subject not talked about enough! especially with these fun facts. Did you know 1 in 100 school-aged children have TS! Also, not everyone with TS swears, only 10% of people with TS do! I've been performing at Clubs, events, colleges just anywhere I can go so I can spread the word about Tourette's Syndrome one laugh at a time.`;

export const cashAppTag = '$TourettesInc';
export const emailAddress = 'tourettesinc@gmail.com';
export const location = 'San Antonio, Texas';
