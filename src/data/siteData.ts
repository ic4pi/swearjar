import type { Product, Show, Video } from '@/types';

export const products: Product[] = [
  {
    id: '1',
    name: 'Zack Tippett Logo Tee',
    description: 'Classic logo tee. Bold design, premium comfort. Wear the message.',
    price: 28,
    image: '/product_tshirt_1.jpg',
    category: 'apparel',
    variants: ['Men\'s T-Shirt', 'Women\'s T-Shirt', 'Unisex Sweater'],
    printfulUrl: 'https://www.printful.com/'
  },
  {
    id: '2',
    name: 'Tic & Talk Hoodie',
    description: 'Start conversations. Spread awareness. Stay comfortable.',
    price: 45,
    image: '/product_sweater_1.jpg',
    category: 'apparel',
    variants: ['Men\'s T-Shirt', 'Women\'s T-Shirt', 'Unisex Sweater'],
    printfulUrl: 'https://www.printful.com/'
  },
  {
    id: '3',
    name: 'Laugh. Learn. Support. Tee',
    description: 'Our mantra on a tee. Premium quality, meaningful message.',
    price: 28,
    image: '/product_tshirt_1.jpg',
    category: 'apparel',
    variants: ['Men\'s T-Shirt', 'Women\'s T-Shirt', 'Unisex Sweater'],
    printfulUrl: 'https://www.printful.com/'
  },
  {
    id: '4',
    name: 'Tourette\'s Warrior Sweatshirt',
    description: 'For the fighters. For the advocates. For everyone.',
    price: 48,
    image: '/product_sweater_1.jpg',
    category: 'apparel',
    variants: ['Men\'s T-Shirt', 'Women\'s T-Shirt', 'Unisex Sweater'],
    printfulUrl: 'https://www.printful.com/'
  }
];

export const funnyProducts: Product[] = [
  {
    id: '5',
    name: 'Comedy & Causes Tee',
    description: 'Where laughter meets purpose. Quality you can feel.',
    price: 28,
    image: '/product_tshirt_1.jpg',
    category: 'apparel',
    variants: ['Men\'s T-Shirt', 'Women\'s T-Shirt', 'Unisex Sweater'],
    printfulUrl: 'https://www.printful.com/'
  },
  {
    id: '6',
    name: 'Awareness Ambassador Hoodie',
    description: 'Be an ambassador for understanding. Wear it proudly.',
    price: 45,
    image: '/product_sweater_1.jpg',
    category: 'apparel',
    variants: ['Men\'s T-Shirt', 'Women\'s T-Shirt', 'Unisex Sweater'],
    printfulUrl: 'https://www.printful.com/'
  },
  {
    id: '7',
    name: 'One Laugh at a Time Tee',
    description: 'Changing perceptions through comedy. One shirt at a time.',
    price: 28,
    image: '/product_tshirt_1.jpg',
    category: 'apparel',
    variants: ['Men\'s T-Shirt', 'Women\'s T-Shirt', 'Unisex Sweater'],
    printfulUrl: 'https://www.printful.com/'
  },
  {
    id: '8',
    name: 'Zack Tippett Original',
    description: 'The original. The classic. The statement.',
    price: 30,
    image: '/product_tshirt_1.jpg',
    category: 'apparel',
    variants: ['Men\'s T-Shirt', 'Women\'s T-Shirt', 'Unisex Sweater'],
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

export const videos: Video[] = [
  {
    id: '1',
    title: 'My Tourette\'s Story - Stand Up Set',
    thumbnail: '/video_reel.jpg',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  }
];

export const aboutMeText = `Hello Humans! my name is Zachariah Tippett but, you can call me Tourette's and I have Tourette's Syndrome

Ever since I was a kid, I always wanted to make people laugh! At 15 I started writing jokes, stories, etc. Now I'm 26 and am a full-time stand-up comedian! My dreams are coming true with a big twist! I've been able to come up with a way to make people laugh as well as spread awareness and education to everyone about Tourette's syndrome!

Let's be honest TS is a subject not talked about enough! especially with these fun facts. Did you know 1 in 100 school-aged children have TS! Also, not everyone with TS swears, only 10% of people with TS do! I've been performing at Clubs, events, colleges just anywhere I can go so I can spread the word about Tourette's Syndrome one laugh at a time.`;

export const cashAppTag = '$TourettesInc';
export const emailAddress = 'tourettesinc@gmail.com';
export const location = 'San Antonio, Texas';
