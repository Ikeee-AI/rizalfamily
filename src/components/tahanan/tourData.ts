// Tour content and camera path for "Ang Tahanan" — the 3D Rizal home.
// Coordinates are authored in Blender space (X right, Y forward, Z up) and
// converted to three.js space (Y up) with `b2t`.

export type Vec3 = [number, number, number];

/** Blender (x, y, z) → three.js (x, z, -y) */
export function b2t([x, y, z]: Vec3): Vec3 {
  return [x, z, -y];
}

export type HotspotId =
  | 'gate'
  | 'store'
  | 'portraits'
  | 'lamp'
  | 'library'
  | 'lease'
  | 'fields'
  | 'dining';

export type Hotspot = {
  id: HotspotId;
  /** Node names in the GLB that belong to this hotspot (clickable). */
  nodes: string[];
  /** Where the floating marker sits (Blender coords). */
  marker: Vec3;
  label: string;
  eyebrow: string;
  title: string;
  body: string[];
  /** Section of the page with more detail. */
  readMore?: { id: string; label: string };
};

export const HOTSPOTS: Record<HotspotId, Hotspot> = {
  gate: {
    id: 'gate',
    nodes: ['Hotspot_FrontGate', 'Gate_Leaf_L', 'Gate_Leaf_R', 'FIG_Teodora_Gate', 'FIG_Guard_1', 'FIG_Guard_2'],
    marker: [7, -2.8, 2.9],
    label: 'The front gate',
    eyebrow: 'The Gate · 1871',
    title: 'The Day Teodora Was Taken',
    body: [
      'In 1871, Teodora Alonso was falsely accused, together with her brother, of an alleged poisoning attempt. She was led away from this house and made to travel on foot to the provincial jail in Santa Cruz, Laguna.',
      'She was imprisoned for over two years on scant evidence before she was finally freed. Her son José was about ten years old — an injustice he never forgot.',
    ],
    readMore: { id: 'mother', label: 'Read about Teodora' },
  },
  store: {
    id: 'store',
    nodes: ['Store_Sacks'],
    marker: [2.4, 3.6, 1.2],
    label: 'The harvest store',
    eyebrow: 'Ground Floor · The Bodega',
    title: 'Rice and Sugar from the Hacienda',
    body: [
      'The stone ground floor of a bahay na bato was for work, not living: carriages, tools and the harvest were kept here, safe from floods and heat.',
      'Francisco Mercado farmed land he leased as an inquilino from the Dominican-owned hacienda of Calamba. Sacks of rice and sugar from those fields paid the rent — and paid for his children’s schooling.',
    ],
    readMore: { id: 'father', label: 'Read about Francisco' },
  },
  portraits: {
    id: 'portraits',
    nodes: ['Portrait_Francisco', 'Portrait_Teodora'],
    marker: [7, 6.1, 5.75],
    label: 'Family portraits',
    eyebrow: 'The Sala · The Parents',
    title: 'Francisco and Teodora',
    body: [
      'Francisco Mercado Rizal (1818–1898), born in Biñan, studied Latin and philosophy before becoming a farmer. Industrious and reserved, he built this stone-and-wood house.',
      'Teodora Alonso Realonda (1826–1911), educated at the Colegio de Santa Rosa, was unusually learned for a woman of her time — and José’s first teacher.',
    ],
    readMore: { id: 'tree', label: 'Open the family tree' },
  },
  lamp: {
    id: 'lamp',
    nodes: ['Hotspot_OilLamp', 'Hotspot_Moth', 'FIG_Teodora_Lamp', 'FIG_Jose_Lamp'],
    marker: [2.0, 1.6, 4.75],
    label: 'The oil lamp',
    eyebrow: 'Evening Lessons',
    title: 'The Moth and the Flame',
    body: [
      'One evening, Teodora read her young son a story about a little moth whose mother warned it not to fly too close to the lamp. The young moth did not listen — it flew into the flame and died.',
      'Rizal recalled the story in his student memoirs. The moth had died — but for the sake of the light. It is one of the best-remembered scenes of his childhood.',
    ],
    readMore: { id: 'mother', label: 'Teodora, his first teacher' },
  },
  library: {
    id: 'library',
    nodes: ['Hotspot_Bookshelf', 'Hotspot_Bookshelf_Books', 'Study_Bookshelf_2'],
    marker: [1.3, 6.7, 5.95],
    label: 'The family library',
    eyebrow: 'The Study · Books',
    title: 'A House That Read',
    body: [
      'Teodora taught José his letters and prayers at home, long before any school did. Books were part of ordinary life in this household.',
      'The family’s collection is often described as one of the largest private libraries in Calamba — rare for a provincial home in the 1860s.',
    ],
    readMore: { id: 'life', label: 'What the family made possible' },
  },
  lease: {
    id: 'lease',
    nodes: ['Hotspot_LeasePapers', 'Hotspot_Desk', 'FIG_Francisco_Desk'],
    marker: [3.5, 8.7, 4.55],
    label: 'The lease papers',
    eyebrow: 'The Desk · 1887–1891',
    title: 'The Hacienda Dispute',
    body: [
      'The family’s land was leased from the Dominican friars who owned the Calamba hacienda. As rents rose, José helped the tenants — his own family among them — put their complaints in writing.',
      'The friars won in court. In 1891 the authorities evicted the Rizal family and other tenants and had their homes demolished. Several relatives were exiled.',
    ],
    readMore: { id: 'conflict', label: 'Read about the eviction' },
  },
  fields: {
    id: 'fields',
    nodes: ['Field_Rice', 'Field_Sugarcane'],
    marker: [6, 30, 2.5],
    label: 'The fields',
    eyebrow: 'Calamba · Laguna',
    title: 'Under Mount Makiling',
    body: [
      'Beyond the garden wall lay the rice paddies and cane fields that fed the family — land they worked but never owned.',
      'On the horizon rises Mount Makiling. Years later Rizal retold its most famous legend in his story “Mariang Makiling” (1890).',
    ],
    readMore: { id: 'conflict', label: 'Why the land mattered' },
  },
  dining: {
    id: 'dining',
    nodes: ['FIG_Francisco_Dine', 'FIG_Teodora_Dine', 'FIG_Paciano_Dine', 'FIG_Jose_Dine', 'FIG_Sister_Dine'],
    marker: [10.9, 8.4, 5.2],
    label: 'The family table',
    eyebrow: 'The Comedor · Eleven Children',
    title: 'A Full Table',
    body: [
      'Francisco and Teodora raised eleven children in this house — two sons, Paciano and José, and nine daughters: Saturnina, Narcisa, Olimpia, Lucía, María, Concepción, Josefa, Trinidad and Soledad.',
      'Not all of them grew up. Little Concepción died in 1865, at about three years old. José, then four, later remembered it as the first time he wept out of love and grief.',
    ],
    readMore: { id: 'tree', label: 'Meet all eleven children' },
  },
};

export type Stop = {
  key: string;
  pos: Vec3;
  target: Vec3;
  /** Extra points the camera passes through on the way TO the next stop. */
  via?: Vec3[];
  hotspot?: HotspotId;
  eyebrow: string;
  title: string;
  text: string;
  /** What the view shows, for screen readers. */
  alt?: string;
};

// Camera height ≈ eye level (1.7 m above floors; upper floor is at 3.45 m).
export const STOPS: Stop[] = [
  {
    key: 'arrival',
    pos: [-4, -16, 4.6],
    target: [7, 3, 4.2],
    eyebrow: 'Calamba, Laguna · c. 1870',
    title: 'Ang Tahanan',
    text: 'A reconstruction of the kind of bahay na bato the Rizal-Mercado family lived in: stone below, hardwood and capiz shell above. Scroll to walk through it.',
    alt: "A two-storey house with a stone ground floor and a timber upper floor lined with capiz-shell windows, behind a low stone wall, among coconut palms and cane fields.",
  },
  {
    key: 'gate',
    pos: [4.6, -9.2, 1.75],
    target: [7, -2.8, 1.6],
    via: [
      [7, -5, 1.75],
      [7, -0.6, 1.75],
      [7.2, 3.2, 1.75],
    ],
    hotspot: 'gate',
    eyebrow: 'Stop 1 · The Gate',
    title: 'The Front Gate',
    text: 'Every visitor — and, in 1871, the guardia civil — came through here.',
    alt: "The front gate in the stone wall. Two guardia civil in dark uniforms and brimmed hats, rifles raised, lead a bowed Teodora out toward the street.",
  },
  {
    key: 'store',
    pos: [6.4, 7.8, 1.7],
    target: [2.4, 3.6, 0.7],
    via: [
      [11.6, 5.2, 1.7],
      [13.7, 1.45, 1.9],
      [8.4, 1.45, 5.15],
    ],
    hotspot: 'store',
    eyebrow: 'Stop 2 · Ground Floor',
    title: 'The Harvest Store',
    text: 'Below the living quarters: the family’s stores from the hacienda fields.',
    alt: "A stone storeroom with barred windows, sacks of rice and sugar, wooden barrels and crates.",
  },
  {
    key: 'portraits',
    pos: [7, 2.3, 5.1],
    target: [7, 6.2, 4.95],
    hotspot: 'portraits',
    eyebrow: 'Stop 3 · The Sala',
    title: 'The Parents',
    text: 'Up the grand stair into the sala, where the family received guests.',
    alt: "Framed photographs of Francisco and Teodora hang above a carved wooden bench in the sala.",
  },
  {
    key: 'lamp',
    pos: [3.7, 0.7, 4.8],
    target: [2.0, 1.6, 4.2],
    via: [
      [5.6, 2.6, 5.05],
      [10.8, 3.6, 5.05],
      [10.8, 5.6, 5.05],
      [10.8, 6.9, 5.05],
      [9.2, 7.0, 5.15],
    ],
    hotspot: 'lamp',
    eyebrow: 'Stop 4 · By the Window',
    title: 'The Oil Lamp',
    text: 'Lessons happened here in the evenings, by lamplight.',
    alt: 'Teodora, in a white camisa and dark saya, sits beside a small table with an oil lamp, reading a book. Young José leans in to look at the page.',
  },
  {
    key: 'dining',
    pos: [7.55, 8.4, 5.3],
    target: [12.4, 8.4, 4.05],
    via: [
      [9.2, 6.9, 5.05],
      [10.8, 6.9, 5.05],
      [10.8, 5.6, 5.05],
      [4.0, 5.0, 5.05],
      [3.2, 5.6, 5.05],
      [3.2, 7.0, 5.05],
    ],
    hotspot: 'dining',
    eyebrow: 'Stop 5 · The Comedor',
    title: 'The Family Table',
    text: 'Eleven children grew up around meals like this one.',
    alt: 'Francisco, Teodora, Paciano, young José and one of the sisters sit around a long dining table.',
  },
  {
    key: 'library',
    pos: [2.6, 8.9, 5.05],
    target: [1.3, 6.6, 4.85],
    hotspot: 'library',
    eyebrow: 'Stop 6 · The Study',
    title: 'The Family Library',
    text: 'Glass-fronted cases of leather-bound books.',
    alt: "A tall carved cabinet with glass doors, filled with rows of books.",
  },
  {
    key: 'lease',
    pos: [4.9, 9.9, 5.05],
    target: [3.5, 8.7, 4.15],
    via: [
      [4.2, 10.1, 5.6],
      [3.8, 11.6, 5.2],
    ],
    hotspot: 'lease',
    eyebrow: 'Stop 7 · The Desk',
    title: 'Papers on the Desk',
    text: 'Leases, receipts — and, later, a lawsuit.',
    alt: "Francisco, white-haired in a white camisa, sits at a narrow desk bent over papers, with an inkwell beside him.",
  },
  {
    key: 'fields',
    pos: [6.2, 14.2, 5.0],
    target: [12, 400, 40],
    hotspot: 'fields',
    eyebrow: 'Stop 8 · The Azotea',
    title: 'The View from the Azotea',
    text: 'From the open stone terrace: the family’s fields and Mount Makiling.',
    alt: "From the stone terrace: rice paddies and palms stretching toward Mount Makiling on the horizon.",
  },
  {
    key: 'finale',
    pos: [-20, -24, 24],
    target: [8, 6, 2],
    eyebrow: 'End of the Tour',
    title: 'Test Yourself — or Explore',
    text: 'Answer six questions about what you saw, or walk the house freely.',
    alt: "An aerial view of the house, its gardens and the fields around it.",
  },
];

export type QuizQuestion = {
  q: string;
  options: string[];
  answer: number;
  explain: string;
};

export const QUIZ: QuizQuestion[] = [
  {
    q: 'Who was José Rizal’s first teacher?',
    options: ['His father, Francisco', 'His mother, Teodora', 'A Jesuit tutor', 'His brother, Paciano'],
    answer: 1,
    explain: 'Teodora taught him his letters and prayers at home.',
  },
  {
    q: 'In Teodora’s story, what happened to the young moth?',
    options: [
      'It escaped through the window',
      'It flew into the lamp’s flame',
      'It was caught by José',
      'It listened to its mother',
    ],
    answer: 1,
    explain: 'It ignored its mother’s warning and died in the flame — a story Rizal never forgot.',
  },
  {
    q: 'Who owned the hacienda land the family leased?',
    options: ['The Spanish Crown', 'The Rizal family', 'The Dominican friars', 'The town of Calamba'],
    answer: 2,
    explain: 'Francisco was an inquilino — a leaseholder — on the Dominican-owned estate.',
  },
  {
    q: 'In what year were the family evicted and their home demolished?',
    options: ['1871', '1882', '1891', '1896'],
    answer: 2,
    explain: 'After losing in court, the tenants were evicted in 1891.',
  },
  {
    q: 'Which mountain rises over Calamba?',
    options: ['Mount Banahaw', 'Mount Makiling', 'Mount Arayat', 'Mount Mayon'],
    answer: 1,
    explain: 'Rizal retold its legend in “Mariang Makiling” (1890).',
  },
  {
    q: 'How many children did Francisco and Teodora have?',
    options: ['Five', 'Seven', 'Nine', 'Eleven'],
    answer: 3,
    explain: 'Eleven: two sons, Paciano and José, and nine daughters.',
  },
];

/** Where "Explore freely" starts: the courtyard, facing the zaguán. */
export const EXPLORE_SPAWN: { pos: Vec3; yaw: number } = {
  pos: [7, -1.8, 0],
  yaw: 0,
};

/** Bounds of the walkable area (Blender XY). */
export const EXPLORE_BOUNDS = { minX: -28, maxX: 58, minY: -13, maxY: 48 };
