export const CATEGORY_COLORS: Record<string, string> = {
    'บรรจุภัณฑ์': 'bg-orange-50 text-orange-800 border-orange-200', // Changed to Orange
    'เครื่องสำอาง': 'bg-pink-100 text-pink-800 border-pink-200',
    'อาหาร': 'bg-orange-100 text-orange-800 border-orange-200',
    'เครื่องดื่ม': 'bg-teal-100 text-teal-800 border-teal-200',
    'เครื่องเขียน': 'bg-purple-100 text-purple-800 border-purple-200',
    'ของใช้ในบ้าน': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'อิเล็กทรอนิกส์': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    'อื่นๆ': 'bg-orange-50 text-orange-800 border-orange-200', // Changed to Orange (warm default)
};

export const CATEGORY_THEMES: Record<string, { border: string, text: string, lightBg: string, thinBorder: string }> = {
    'บรรจุภัณฑ์': { border: 'border-orange-500', text: 'text-orange-600', lightBg: 'bg-orange-50', thinBorder: 'border-orange-200' }, // Changed to Orange
    'เครื่องสำอาง': { border: 'border-pink-500', text: 'text-pink-600', lightBg: 'bg-pink-50', thinBorder: 'border-pink-200' },
    'อาหาร': { border: 'border-amber-500', text: 'text-amber-600', lightBg: 'bg-amber-50', thinBorder: 'border-amber-200' }, // Shifted Food to Amber for distinction
    'เครื่องดื่ม': { border: 'border-teal-500', text: 'text-teal-600', lightBg: 'bg-teal-50', thinBorder: 'border-teal-200' },
    'เครื่องเขียน': { border: 'border-purple-500', text: 'text-purple-600', lightBg: 'bg-purple-50', thinBorder: 'border-purple-200' },
    'ของใช้ในบ้าน': { border: 'border-indigo-500', text: 'text-indigo-600', lightBg: 'bg-indigo-50', thinBorder: 'border-indigo-200' },
    'อิเล็กทรอนิกส์': { border: 'border-cyan-500', text: 'text-cyan-600', lightBg: 'bg-cyan-50', thinBorder: 'border-cyan-200' },
    'อื่นๆ': { border: 'border-orange-400', text: 'text-orange-600', lightBg: 'bg-orange-50', thinBorder: 'border-orange-200' }, // Default to Orange-ish
};

export const getCategoryColor = (category?: string) => {
    return CATEGORY_COLORS[category || 'อื่นๆ'] || CATEGORY_COLORS['อื่นๆ'];
};

export const getCategoryTheme = (category?: string) => {
    return CATEGORY_THEMES[category || 'อื่นๆ'] || CATEGORY_THEMES['อื่นๆ'];
};

// Vibrant colors for price cards
export const PRICE_CARD_COLORS = [
    { bg: 'bg-red-500', text: 'text-white', border: 'border-red-600', subtext: 'text-red-100' },
    { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600', subtext: 'text-blue-100' },
    { bg: 'bg-green-500', text: 'text-white', border: 'border-green-600', subtext: 'text-green-100' },
    { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-600', subtext: 'text-orange-100' },
    { bg: 'bg-purple-500', text: 'text-white', border: 'border-purple-600', subtext: 'text-purple-100' },
    { bg: 'bg-teal-500', text: 'text-white', border: 'border-teal-600', subtext: 'text-teal-100' },
    { bg: 'bg-pink-500', text: 'text-white', border: 'border-pink-600', subtext: 'text-pink-100' },
    { bg: 'bg-indigo-500', text: 'text-white', border: 'border-indigo-600', subtext: 'text-indigo-100' },
];

export const getPriceCardColor = (index: number) => {
    return PRICE_CARD_COLORS[index % PRICE_CARD_COLORS.length];
};
