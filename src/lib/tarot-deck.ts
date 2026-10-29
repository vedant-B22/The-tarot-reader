export interface TarotCard {
  id: string;
  name: string;
  arcana: 'Major' | 'Wands' | 'Cups' | 'Swords' | 'Pentacles';
  number: number;
  keywords: string[];
  upright: string;
  guidance: string;
  affirmation: string;
  theme: string;
  element: string;
}

export const TAROT_DECK: TarotCard[] = [
  {
    id: 'major-0',
    name: 'The Fool',
    arcana: 'Major',
    number: 0,
    keywords: ['New Beginnings', 'Innocence', 'Leap of Faith', 'Pure Potential'],
    upright: 'You stand at the edge of a fresh chapter. The universe invites you to trust the unknown, shed old doubts, and take a bold step forward with curiosity.',
    guidance: 'Release overthinking. Embrace the courage to be a beginner again today.',
    affirmation: 'I trust where the universe leads me, stepping forward with an open heart.',
    theme: 'Fresh Start',
    element: 'Air'
  },
  {
    id: 'major-1',
    name: 'The Magician',
    arcana: 'Major',
    number: 1,
    keywords: ['Manifestation', 'Resourcefulness', 'Inspired Action', 'Willpower'],
    upright: 'Everything you need to turn inspiration into tangible reality is already in your hands. Align your thoughts, spoken words, and effort.',
    guidance: 'Direct your focus on one clear intention today. Your ability to create solutions is at its peak.',
    affirmation: 'I have the power, talent, and resources to bring my vision to life.',
    theme: 'Creation',
    element: 'Fire'
  },
  {
    id: 'major-2',
    name: 'The High Priestess',
    arcana: 'Major',
    number: 2,
    keywords: ['Intuition', 'Inner Wisdom', 'Divine Feminine', 'Subconscious'],
    upright: 'A reminder that the answers you seek do not lie in external noise, but in quiet inner stillness. Look past surface appearances.',
    guidance: 'Pay attention to your gut instincts, quiet hunches, and recurring signs today.',
    affirmation: 'I honor my inner wisdom and trust the sacred voice of my intuition.',
    theme: 'Intuition',
    element: 'Water'
  },
  {
    id: 'major-3',
    name: 'The Empress',
    arcana: 'Major',
    number: 3,
    keywords: ['Abundance', 'Fertility', 'Nurturing', 'Sensory Joy'],
    upright: 'Abundance flows when you nurture yourself and your creative projects with gentle patience. Life is blossoming around you.',
    guidance: 'Treat yourself with gentleness. Surround yourself with comforting sensory beauty and care.',
    affirmation: 'I am surrounded by abundance and allow my creations to bloom naturally.',
    theme: 'Abundance',
    element: 'Earth'
  },
  {
    id: 'major-4',
    name: 'The Emperor',
    arcana: 'Major',
    number: 4,
    keywords: ['Structure', 'Stability', 'Leadership', 'Healthy Boundaries'],
    upright: 'You are called to step into your sovereign authority. Organize your priorities, establish protective boundaries, and lead with clarity.',
    guidance: 'Bring discipline to chaotic areas. Stand firm in what you know is healthy and right.',
    affirmation: 'I anchor myself in strength, self-respect, and clear boundaries.',
    theme: 'Stability',
    element: 'Fire'
  },
  {
    id: 'major-5',
    name: 'The Hierophant',
    arcana: 'Major',
    number: 5,
    keywords: ['Wisdom', 'Mentorship', 'Tradition', 'Spiritual Study'],
    upright: 'Seek out foundational principles, trusted mentors, or time-tested lessons. True learning deepens when you respect the journey of mastery.',
    guidance: 'Ask someone whose wisdom you admire, or reflect deeply on your core ethical beliefs.',
    affirmation: 'I seek truth that aligns with my highest principles and personal growth.',
    theme: 'Wisdom',
    element: 'Earth'
  },
  {
    id: 'major-6',
    name: 'The Lovers',
    arcana: 'Major',
    number: 6,
    keywords: ['Harmony', 'Alignment', 'Choices', 'Heart Connection'],
    upright: 'A sacred mirror of connection and choice. This card asks you to make choices rooted in your authentic values rather than fear or approval.',
    guidance: 'Choose what feels true to your soul, whether in romance, friendship, or personal decisions.',
    affirmation: 'I choose love, mutual respect, and authentic alignment in all relationships.',
    theme: 'Connection',
    element: 'Air'
  },
  {
    id: 'major-7',
    name: 'The Chariot',
    arcana: 'Major',
    number: 7,
    keywords: ['Determination', 'Triumph', 'Focus', 'Overcoming Obstacles'],
    upright: 'Opposing forces try to pull you in two directions, but your willpower keeps the reins steady. Victory comes through channeled determination.',
    guidance: 'Do not let distractions derail your trajectory. Keep your eyes locked on your finish line.',
    affirmation: 'My focus is unwavering. I navigate challenges with grit and poise.',
    theme: 'Determination',
    element: 'Water'
  },
  {
    id: 'major-8',
    name: 'Strength',
    arcana: 'Major',
    number: 8,
    keywords: ['Compassion', 'Gentle Power', 'Patience', 'Quiet Courage'],
    upright: 'True power does not shout or dominate—it tames wild anxieties through calm gentleness, love, and patience.',
    guidance: 'React with soft understanding instead of defensive frustration today.',
    affirmation: 'My gentleness is my greatest armor; I meet turmoil with grace.',
    theme: 'Inner Fortitude',
    element: 'Fire'
  },
  {
    id: 'major-9',
    name: 'The Hermit',
    arcana: 'Major',
    number: 9,
    keywords: ['Soul Searching', 'Introspection', 'Solitude', 'Guiding Lantern'],
    upright: 'Step back from the chatter of social feeds and external opinions. Your inner lantern shines brightest when you give yourself room to breathe.',
    guidance: 'Take 15 minutes of uninterrupted quiet time today to check in with your heart.',
    affirmation: 'In the stillness of my own company, clarity reveals itself effortlessly.',
    theme: 'Introspection',
    element: 'Earth'
  },
  {
    id: 'major-10',
    name: 'Wheel of Fortune',
    arcana: 'Major',
    number: 10,
    keywords: ['Cycles', 'Karmic Shift', 'Destiny', 'Turning Point'],
    upright: 'The cosmic wheel is turning in your favor. What felt stagnant or difficult is shifting toward unexpected opportunities and breakthroughs.',
    guidance: 'Flow with changes rather than clinging to what is phasing out. Destiny is arranging events.',
    affirmation: 'I welcome positive shifts and trust the sacred rhythm of my life cycles.',
    theme: 'Destiny',
    element: 'Fire'
  },
  {
    id: 'major-11',
    name: 'Justice',
    arcana: 'Major',
    number: 11,
    keywords: ['Fairness', 'Truth', 'Accountability', 'Clarity'],
    upright: 'The scales seek equilibrium. Truth comes to light, and fairness prevails. Act with impeccable honesty and evaluate situations objectively.',
    guidance: 'Weigh both sides before making a judgment. Fairness begins within your own actions.',
    affirmation: 'I live with integrity, speaking and acting with balanced fairness.',
    theme: 'Truth',
    element: 'Air'
  },
  {
    id: 'major-12',
    name: 'The Hanged Man',
    arcana: 'Major',
    number: 12,
    keywords: ['Surrender', 'New Perspective', 'Pause', 'Spiritual Letting Go'],
    upright: 'Sometimes progress requires pausing and looking at the world upside down. Letting go of stubborn control opens doors effort could not.',
    guidance: 'Stop forcing a stubborn situation. Surrender the outcome and look from a fresh angle.',
    affirmation: 'I release the need to control every outcome, welcoming new perspectives.',
    theme: 'Perspective',
    element: 'Water'
  },
  {
    id: 'major-13',
    name: 'Death (Transformation)',
    arcana: 'Major',
    number: 13,
    keywords: ['Endings', 'Rebirth', 'Metamorphosis', 'Shedding the Old'],
    upright: 'Not physical harm, but the sacred death of what has outlived its purpose. A snake sheds its skin so it can grow; you are shedding an old chapter.',
    guidance: 'Say goodbye to an old habit or emotional weight without regret. Rebirth is arriving.',
    affirmation: 'I gracefully release the old to make room for my most vibrant self.',
    theme: 'Transformation',
    element: 'Water'
  },
  {
    id: 'major-14',
    name: 'Temperance',
    arcana: 'Major',
    number: 14,
    keywords: ['Balance', 'Alchemy', 'Patience', 'Harmonious Flow'],
    upright: 'Blending opposites into harmonious gold. You are learning the art of moderation, emotional healing, and balanced energy exchange.',
    guidance: 'Avoid extremes in spending, eating, or emotional reactions. Find the gentle middle road.',
    affirmation: 'I am balanced, centered, and at peace within my mind and body.',
    theme: 'Harmony',
    element: 'Fire'
  },
  {
    id: 'major-15',
    name: 'The Devil (Liberation)',
    arcana: 'Major',
    number: 15,
    keywords: ['Shadow Work', 'Unchaining', 'Awakening', 'Breaking Illusions'],
    upright: 'A mirror reflecting unhealthy attachments, self-limiting stories, or addictions. The chains around your neck are loose—you can lift them off at any moment.',
    guidance: 'Identify where you give your power away to fear or validation. Take your sovereignty back.',
    affirmation: 'I am the master of my own choices; no fear or habit holds power over me.',
    theme: 'Liberation',
    element: 'Earth'
  },
  {
    id: 'major-16',
    name: 'The Tower',
    arcana: 'Major',
    number: 16,
    keywords: ['Breakthrough', 'Truth Lightning', 'Liberation', 'Fresh Foundation'],
    upright: 'A flash of lightning topples facades built on shaky pretenses. While disruptive, this sudden revelation protects you from deeper illusions.',
    guidance: 'Do not grieve the fall of what was false. The ground is now clear to build true gold.',
    affirmation: 'Breakdowns make way for breakthroughs; I rebuild on unshakeable truth.',
    theme: 'Breakthrough',
    element: 'Fire'
  },
  {
    id: 'major-17',
    name: 'The Star',
    arcana: 'Major',
    number: 17,
    keywords: ['Hope', 'Inspiration', 'Renewal', 'Divine Blessings'],
    upright: 'Peace descends after the storm. A radiant card of renewed faith, cosmic healing, and clear vision. Your future is glowing with promise.',
    guidance: 'Let yourself dream and believe again. Healing is active and working in your favor.',
    affirmation: 'I am inspired, blessed, and guided by my brightest inner light.',
    theme: 'Hope',
    element: 'Air'
  },
  {
    id: 'major-18',
    name: 'The Moon',
    arcana: 'Major',
    number: 18,
    keywords: ['Illusion', 'Subconscious', 'Dreams', 'Unveiling'],
    upright: 'Things are not as simple as they appear in the shadows. Your imagination may be magnifying anxieties. Seek daylight and clarity before acting.',
    guidance: 'Do not jump to worst-case conclusions. Wait for the fog to lift before deciding.',
    affirmation: 'I navigate mysteries with calm discernment, letting truth dispel my fears.',
    theme: 'Clarity',
    element: 'Water'
  },
  {
    id: 'major-19',
    name: 'The Sun',
    arcana: 'Major',
    number: 19,
    keywords: ['Vitality', 'Joy', 'Success', 'Radiance'],
    upright: 'One of the most joyful cards in the deck! Warmth, celebration, vitality, and triumphant clarity illuminate everything you touch.',
    guidance: 'Share your warmth generously. Step into the spotlight without shrinking yourself.',
    affirmation: 'Joy is my birthright; I shine brightly and attract golden abundance.',
    theme: 'Vitality',
    element: 'Fire'
  },
  {
    id: 'major-20',
    name: 'Judgement',
    arcana: 'Major',
    number: 20,
    keywords: ['Calling', 'Reckoning', 'Self-Forgiveness', 'Awakening'],
    upright: 'The trumpet sounds your spiritual wake-up call. Forgive past mistakes, integrate their hard-earned lessons, and rise into your higher purpose.',
    guidance: 'Release past guilt. You are invited into a higher, more aligned expression of yourself.',
    affirmation: 'I forgive my past and answer the higher calling of my destiny.',
    theme: 'Awakening',
    element: 'Fire'
  },
  {
    id: 'major-21',
    name: 'The World',
    arcana: 'Major',
    number: 21,
    keywords: ['Wholeness', 'Completion', 'Triumph', 'Next Level'],
    upright: 'A major cycle reaches sweet fulfillment. You have traveled the full journey, learned the lessons, and stand in integrated wholeness.',
    guidance: 'Celebrate how far you have come. Take a victory lap before starting the next cycle.',
    affirmation: 'I am complete, fulfilled, and ready to welcome my next glorious adventure.',
    theme: 'Fulfillment',
    element: 'Earth'
  },
  {
    id: 'cups-ace',
    name: 'Ace of Cups',
    arcana: 'Cups',
    number: 1,
    keywords: ['Emotional Renewal', 'Love Overflow', 'Intuitive Spark', 'Compassion'],
    upright: 'Your emotional cup overflows with fresh empathy, romantic possibility, and creative inspiration. Open your heart to giving and receiving love.',
    guidance: 'Say yes to connections that feel emotionally nourishing and peaceful.',
    affirmation: 'My heart is open to unconditional love, peace, and emotional healing.',
    theme: 'Love',
    element: 'Water'
  },
  {
    id: 'wands-ace',
    name: 'Ace of Wands',
    arcana: 'Wands',
    number: 1,
    keywords: ['Inspiration', 'Creative Spark', 'Passion', 'Bold Opportunity'],
    upright: 'A surge of energetic vitality and creative ambition strikes like lightning. The spark is lit—now is the moment to fuel the flame.',
    guidance: 'Act on the project or idea that is exciting your spirit right now.',
    affirmation: 'I channel divine passion into bold, inspired action.',
    theme: 'Passion',
    element: 'Fire'
  },
  {
    id: 'swords-ace',
    name: 'Ace of Swords',
    arcana: 'Swords',
    number: 1,
    keywords: ['Mental Clarity', 'Truth', 'Breakthrough Idea', 'Cutting Confusion'],
    upright: 'A sharp, crystal-clear breakthrough cuts through weeks of mental fog and indecision. Speak your truth with honest confidence.',
    guidance: 'Be direct and honest with yourself and others today. Truth liberates.',
    affirmation: 'My mind is razor-sharp, clear, and anchored in honest truth.',
    theme: 'Clarity',
    element: 'Air'
  },
  {
    id: 'pentacles-ace',
    name: 'Ace of Pentacles',
    arcana: 'Pentacles',
    number: 1,
    keywords: ['Tangible Opportunity', 'Financial Seed', 'Stability', 'Manifested Luck'],
    upright: 'A golden seed of financial, academic, or career opportunity is placed in your hands. Plant it in solid soil and care for it with daily discipline.',
    guidance: 'Take practical, grounded steps toward your career and financial security.',
    affirmation: 'I plant seeds of wealth, health, and stability that flourish with time.',
    theme: 'Opportunity',
    element: 'Earth'
  }
];

export function getDailyCard(): TarotCard {
  // Deterministic daily card based on date string so it remains consistent for all visitors on that day,
  // but can also be drawn randomly if requested!
  const today = new Date().toISOString().split('T')[0];
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = (hash << 5) - hash + today.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % TAROT_DECK.length;
  return TAROT_DECK[index];
}

export function getRandomCard(): TarotCard {
  const index = Math.floor(Math.random() * TAROT_DECK.length);
  return TAROT_DECK[index];
}
