/**
 * Everything the Home page says. Edit this file to change copy, stores, products or FAQs.
 * Structure follows devlinwholesale.co.uk. `image` fields are optional: leave them empty to show
 * the built-in colour swatches, or point them at real photos (e.g. /images/carpet.jpg in /public).
 */

export const BRAND = {
  name: 'Devlin',
  tagline: 'Carpets & Flooring',
  fullName: 'Devlin Carpets & Flooring',
  strapline: 'Wholesale prices, direct to the public',
  mainPhone: '0116 456 0022',
  social: {
    facebook: 'https://www.facebook.com/DevlinWholesale/',
    instagram: 'https://www.instagram.com/devlinwholesale/',
    x: 'https://x.com/devlinwholesale',
  },
};

export const NAV = [
  { href: '#products', label: 'Products' },
  { href: '#services', label: 'Services' },
  { href: '#projects', label: 'Projects' },
  { href: '#about', label: 'About' },
  { href: '#stores', label: 'Our stores' },
  { href: '#faq', label: 'FAQs' },
];

export const SLIDES = [
  {
    kicker: 'Expert flooring solutions',
    title: 'Welcome to Devlin Carpets & Flooring',
    text: 'Backed by decades of trusted experience, with wholesale prices across the UK.',
  },
  {
    kicker: 'Carpet, laminate, LVT, vinyl & more',
    title: 'Flooring for any interior',
    text: 'Stylish options for every room, from cosy bedrooms to busy kitchens and hallways.',
  },
  {
    kicker: 'Trusted in UK homes and commercial spaces',
    title: 'Reliable flooring',
    text: 'Quality products from leading brands, with honest advice from our in-store team.',
  },
];

export type Product = { key: string; title: string; text: string; image?: string };

export const PRODUCTS: Product[] = [
  { key: 'carpet', title: 'Carpets', text: 'Twists, saxonies, loops and wool blends in every colour, for bedrooms, stairs and living rooms.' },
  { key: 'lvt', title: 'Luxury Vinyl Tile', text: 'Realistic wood and stone looks that are warm, quiet and waterproof. Ideal for kitchens and bathrooms.' },
  { key: 'wood', title: 'Engineered Wood', text: 'Real timber surfaces on a stable core, in oaks and finishes that suit classic and modern homes.' },
  { key: 'grass', title: 'Artificial Grass', text: 'Soft, natural-looking lawns that stay green all year with almost no upkeep.' },
  { key: 'natural', title: 'Natural Flooring', text: 'Sisal, seagrass, jute and coir for texture and character in hallways and living spaces.' },
  { key: 'laminate', title: 'Laminate', text: 'Hard-wearing, easy-clean boards at great prices, with click-fit systems and water-resistant ranges.' },
  { key: 'lvr', title: 'Luxury Vinyl Roll', text: 'Cushioned, practical vinyl on a roll for fewer seams in kitchens, bathrooms and utility rooms.' },
];

export const ABOUT = {
  years: 35,
  heading: 'years of mastery',
  text: 'Devlin is a family-run flooring business offering premium carpets and hard flooring at wholesale prices, direct to the public. Buying in bulk keeps our prices low, and our teams across four Midlands showrooms help you choose the right floor for your home or business.',
  tabs: [
    {
      id: 'about',
      label: 'About us',
      title: 'Providing the best flooring',
      text: 'From a single store to four showrooms, we have grown by giving customers a huge choice, fair prices and straight answers. Visit any store to see full ranges and talk to people who know flooring.',
    },
    {
      id: 'mission',
      label: 'Mission & vision',
      title: 'Quality floors, fairly priced',
      text: 'Our mission is to make quality flooring affordable for everyone, with advice you can trust and service that makes choosing a new floor simple.',
    },
    {
      id: 'goals',
      label: 'Our goals',
      title: 'Our company goals',
      text: 'Keep prices competitive through bulk buying, keep growing our ranges from trusted brands, and make every visit, measure and quote easy for our customers.',
    },
  ],
};

export const BRANDS = ['Westex', 'Brintons', 'Abingdon', 'Brockway', 'Cormar', 'Alternative Flooring', 'Karndean', 'Amtico', 'Moduleo', 'Invictus'];

export type Service = { key: string; title: string; text: string; action?: 'measure' | 'chat' };

export const SERVICES: Service[] = [
  { key: 'advice', title: 'Professional advice', text: 'Our in-store experts help you compare ranges and pick the right floor for your room, budget and lifestyle.', action: 'chat' },
  { key: 'measure', title: 'Measuring', text: 'A free measuring service, so you order exactly what you need. Book a visit online in a minute.', action: 'measure' },
  { key: 'prep', title: 'Floor preparation', text: 'Good floors start with a sound subfloor. We can refer you to specialists for levelling and repairs.' },
  { key: 'plan', title: 'Planning & estimating', text: 'Free planning and clear in-store quotes, including underlay and accessories, with no surprises.' },
  { key: 'fitters', title: 'Independent fitters', text: 'We can refer you to independent fitters. Fitting is arranged directly between you and the fitter.', action: 'chat' },
  { key: 'care', title: 'Floor care', text: 'Cleaning and care advice for carpet, vinyl, wood and laminate so your floor looks great for years.' },
];

export const PROJECTS = [
  { key: 'lvt', title: 'LVT installation', place: 'Kitchen & diner' },
  { key: 'lvr', title: 'LVR installation', place: 'Utility room' },
  { key: 'carpet', title: 'Carpet installation', place: 'Stairs & landing' },
  { key: 'carpet2', title: 'Carpet installation', place: 'Commercial office' },
  { key: 'laminate', title: 'Laminate installation', place: 'Living room' },
  { key: 'grass', title: 'Artificial grass', place: 'Rear garden' },
];

/** SAMPLE reviews: replace with real customer quotes (with their permission) before going live. */
export const TESTIMONIALS = [
  { quote: 'A huge range to choose from, great value and honest advice. They told us exactly what we needed and nothing more.', name: 'Sample review', role: 'Facilities manager, healthcare' },
  { quote: 'Measured, quoted and ordered within the week. The flooring looks fantastic and the price beat everyone else we tried.', name: 'Sample review', role: 'General manager, hospitality' },
];

export const STATS = [
  { value: '0.5M+', label: 'Projects completed' },
  { value: '4.9★', label: 'Rated across our stores' },
  { value: '35+', label: 'Years of experience' },
  { value: '2019', label: 'Founder & CEO Lifetime Achievement Award' },
];

export type Store = { name: string; address: string; phone: string; whatsapp: string; hours: [string, string][] };

export const STORES: Store[] = [
  {
    name: 'Leicester',
    address: 'Laundon Way, Groby, Leicestershire LE6 0YG',
    phone: '0116 456 0022',
    whatsapp: '07789 383947',
    hours: [['Mon to Fri', '9am to 6pm'], ['Saturday', '9am to 5pm'], ['Sunday', '10am to 4pm']],
  },
  {
    name: 'Tamworth',
    address: 'Atherstone St, Fazeley, Staffordshire B78 3RW',
    phone: '01827 265526',
    whatsapp: '07789 383947',
    hours: [['Mon to Fri', '9am to 7pm'], ['Saturday', '9am to 5pm'], ['Sunday', '10am to 4pm']],
  },
  {
    name: 'Minworth',
    address: 'Stockton Cl, Sutton Coldfield, West Midlands B76 1DH',
    phone: '0121 313 2303',
    whatsapp: '07967 551357',
    hours: [['Mon to Fri', '9am to 6pm'], ['Saturday', '9am to 5pm'], ['Sunday', '10am to 4pm']],
  },
  {
    name: 'Lichfield',
    address: 'Prospect Drive, Lichfield, Staffordshire WS14 9UX',
    phone: '01543 263486',
    whatsapp: '07789 383947',
    hours: [['Mon to Fri', '9am to 6pm'], ['Saturday', '9am to 5pm'], ['Sunday', 'Closed']],
  },
];

export const FAQS: { q: string; a: string }[] = [
  { q: 'What is a twist carpet?', a: 'Twist carpets have tightly twisted fibres that give a textured, hard-wearing finish. They hide footprints well, which makes them a good all-round choice for busy rooms, stairs and hallways.' },
  { q: 'What is a saxony carpet?', a: 'Saxony carpets have a deeper, softer pile for a luxurious feel underfoot. They suit bedrooms and lounges where comfort matters more than heavy foot traffic.' },
  { q: 'Wool or synthetic carpet: which is better?', a: 'Wool is naturally resilient, warm and long-lasting. Synthetics such as polypropylene and nylon are very stain-resistant and often cheaper. Many ranges blend the two. Our team can help you weigh up comfort, durability and budget.' },
  { q: 'Do I need new underlay?', a: 'We usually recommend it. Good underlay makes carpet feel softer, improves insulation and noise reduction, and helps your new carpet last longer.' },
  { q: 'How do you keep your prices so competitive?', a: 'We buy in bulk directly from manufacturers and pass the savings on, so you get wholesale-style prices as a member of the public.' },
  { q: 'Do you install the flooring?', a: 'We do not fit floors ourselves. We can refer you to independent fitters, and the fitting is arranged directly between you and the fitter.' },
  { q: 'How can I keep the cost of new carpet down?', a: 'Accurate measuring avoids over-ordering, and roll ends or remnants can be great value for smaller rooms. Ask in store about current offers.' },
  { q: 'How should I care for my carpet?', a: 'Vacuum regularly, blot spills straight away rather than rubbing, and use door mats to trap grit. A professional clean every 12 to 18 months keeps it looking fresh.' },
  { q: 'How should I care for vinyl flooring?', a: 'Sweep or vacuum to remove grit, then clean with a damp mop and a pH-neutral cleaner. Avoid harsh chemicals and use felt pads under furniture legs.' },
  { q: 'How should I care for laminate?', a: 'Use a soft brush or vacuum and a well-wrung mop. Wipe up spills quickly, never flood the floor with water, and protect it from sharp furniture legs.' },
  { q: 'What is shading or pile reversal?', a: 'Some carpets show lighter and darker patches where the pile has been pressed in different directions. It is a natural feature of cut-pile carpets, not a fault, and is most visible in plain, velvety finishes.' },
  { q: 'Are the independent fitters part of Devlin?', a: 'No. Independent fitters run their own businesses. We are happy to refer you and help with communication, but any fitting agreement is between you and the fitter.' },
];
