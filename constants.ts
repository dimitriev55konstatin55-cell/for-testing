
import { CandyColor, Achievement } from './types';

export const GRID_SIZE = 8;
export const CANDY_COLORS: CandyColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
export const JAR_MAX = 20;

export const COLOR_MAP: Record<CandyColor, string> = {
  red: 'bg-red-500 shadow-[0_4px_0_rgb(185,28,28)]',
  blue: 'bg-blue-500 shadow-[0_4px_0_rgb(29,78,216)]',
  green: 'bg-emerald-500 shadow-[0_4px_0_rgb(5,150,105)]',
  yellow: 'bg-yellow-400 shadow-[0_4px_0_rgb(202,138,4)]',
  purple: 'bg-purple-500 shadow-[0_4px_0_rgb(126,34,206)]',
  orange: 'bg-orange-500 shadow-[0_4px_0_rgb(194,65,12)]',
};

export const JAR_COLOR_MAP: Record<CandyColor, string> = {
  red: 'bg-red-400/80',
  blue: 'bg-blue-400/80',
  green: 'bg-emerald-400/80',
  yellow: 'bg-yellow-300/80',
  purple: 'bg-purple-400/80',
  orange: 'bg-orange-400/80',
};

export const EMOJI_MAP: Record<CandyColor, string> = {
  red: '🍓',
  blue: '🫐',
  green: '🍏',
  yellow: '🍋',
  purple: '🍇',
  orange: '🍊',
};

export const TRANSLATIONS = {
  ru: {
    play: "ИГРАТЬ",
    shop: "МАГАЗИН",
    boosters: "УСИЛИТЕЛИ",
    achievements: "ТРОФЕИ",
    settings: "НАСТРОЙКИ",
    back: "НАЗАД",
    audio: "ЗВУКИ",
    music: "МУЗЫКА",
    hints: "ПОДСКАЗКИ",
    timer: "ТАЙМЕР",
    timer_desc: "Лимит времени в день (мин)",
    played_today: "СЫГРАНО СЕГОДНЯ",
    min: "МИН",
    no_limit: "Без лимита",
    loading: "Загрузка...",
    level: "УРОВЕНЬ",
    score_mode: "НАБОР ОЧКОВ",
    collect_mode: "СБОР ФРУКТОВ",
    collect_goal: "Надо собрать:",
    go: "ВПЕРЁД!",
    score: "СЧЕТ",
    moves: "ХОДЫ",
    win: "УРА!",
    lose: "ОХ!",
    win_desc: "КОМПОТ ГОТОВ!",
    lose_desc: "МАЛО ФРУКТОВ...",
    next: "ДАЛЕЕ",
    retry: "ЗАНОВО",
    your_items: "ВАШИ ЗАПАСЫ",
    empty: "Пусто! Загляните в магазин.",
    sale: "🎄 Новогодний сезон 🎄",
    buy: "КУПИТЬ",
    you_have: "У вас:",
    coins: "монет",
    not_enough: "Не хватает монет!",
    language: "ЯЗЫК",
    season_subtitle: "❄️ Новогодний сезон ❄️",
    locked: "На сегодня всё!",
    locked_desc: "Дядя Макар отдыхает. Возвращайся завтра!",
    tutorial_skip: "ПРОПУСТИТЬ",
    tutorial_1_title: "ПРИВЕТ!",
    tutorial_1_desc: "Помоги Деду Макару собрать фрукты!",
    tutorial_2_title: "СВАЙПАЙ!",
    tutorial_2_desc: "Тяни фрукт в соседнюю клетку для обмена.",
    tutorial_3_title: "КОМПОТ",
    tutorial_3_desc: "Заполни банку и нажми на неё для магии!",
    ok: "OK",
    got_it: "ПОНЯЛ",
    lets_go: "ПОГНАЛИ!",
    claimed: "ПОЛУЧЕНО",
    reward: "ЗАБРАТЬ",
    progress: "ПРОГРЕСС",
    you_here: "ТЫ ТУТ",
    no_moves: "Нет ходов! Перемешиваем..."
  },
  en: {
    play: "PLAY",
    shop: "SHOP",
    boosters: "BOOSTERS",
    achievements: "TROPHIES",
    settings: "SETTINGS",
    back: "BACK",
    audio: "SOUNDS",
    music: "MUSIC",
    hints: "HINTS",
    timer: "TIMER",
    timer_desc: "Daily time limit (min)",
    played_today: "PLAYED TODAY",
    min: "MIN",
    no_limit: "No limit",
    loading: "Loading...",
    level: "LEVEL",
    score_mode: "SCORE MODE",
    collect_mode: "COLLECT MODE",
    collect_goal: "Collect:",
    go: "GO!",
    score: "SCORE",
    moves: "MOVES",
    win: "YAY!",
    lose: "OH NO!",
    win_desc: "JUICE IS READY!",
    lose_desc: "OUT OF MOVES...",
    next: "NEXT",
    retry: "RETRY",
    your_items: "INVENTORY",
    empty: "Empty! Check the shop.",
    sale: "🎄 Holiday Season 🎄",
    buy: "BUY",
    you_have: "Owned:",
    coins: "coins",
    not_enough: "Not enough coins!",
    language: "LANGUAGE",
    season_subtitle: "❄️ Holiday Season ❄️",
    locked: "That's all for today!",
    locked_desc: "Santa needs a rest. Come back tomorrow!",
    tutorial_skip: "SKIP",
    tutorial_1_title: "HELLO!",
    tutorial_1_desc: "Help Santa collect fruits for gifts!",
    tutorial_2_title: "SWIPE!",
    tutorial_2_desc: "Drag a fruit to an adjacent cell to swap.",
    tutorial_3_title: "JUICE",
    tutorial_3_desc: "Fill the jar and tap it for magic!",
    ok: "OK",
    got_it: "GOT IT",
    lets_go: "LET'S GO!",
    claimed: "CLAIMED",
    reward: "CLAIM",
    progress: "PROGRESS",
    you_here: "YOU",
    no_moves: "No moves! Shuffling..."
  }
};

// Removed emojis from icons, we will use ID to map to SVG components in App.tsx
export const SHOP_ITEMS = [
  { id: 'smallPack', moves: 3, price: 349, salePrice: 279, title: 'Mandarin', titleRu: 'Мандарин', desc: '+3 Moves', descRu: '+3 Хода' },
  { id: 'mediumPack', moves: 10, price: 980, salePrice: 857, title: 'Gift', titleRu: 'Подарок', desc: '+10 Moves', descRu: '+10 Ходов' },
  { id: 'largePack', moves: 20, price: 1740, salePrice: 1649, title: 'Sleigh', titleRu: 'Сани', desc: '+20 Moves', descRu: '+20 Ходов' },
  { id: 'magicSnowflake', moves: 0, price: 459, salePrice: 385, title: 'Snowflake', titleRu: 'Снежинка', desc: '1 Jar 100%', descRu: '1 банка на 100%' },
  { id: 'santaBag', moves: 0, price: 2250, salePrice: 1752, title: 'Sack', titleRu: 'Мешок', desc: 'ALL Jars 100%', descRu: 'ВСЕ банки на 100%' },
  { id: 'bomb', moves: 0, price: 389, salePrice: 329, title: 'Bomb', titleRu: 'Бомба', desc: 'Explodes 3x3', descRu: 'Взрыв 3x3' },
];

export const MUSIC = [ 
  'music/mav.mp3'
  
];

export const SFX = {
  click: 'music/click.wav', 
  swap: 'music/swap.wav', 
  match: 'music/match.wav', 
  win: 'music/win.wav', 
  lose: 'music/lose.wav', 
  coin: 'music/coin.wav', 
  buy: 'music/buy.mp3',
  explode: 'music/explode.mp3'
};

// Helper to generate tiered achievements with translations
const createTieredAchievement = (
  groupId: string, 
  baseTitle: string, 
  baseTitleEn: string,
  baseDesc: string, 
  baseDescEn: string,
  baseReq: number, 
): Achievement[] => {
  const tiers = [
    { name: 'I', mult: 1, reward: 100 },
    { name: 'II', mult: 2.5, reward: 200 },
    { name: 'III', mult: 5, reward: 350 },
    { name: 'IV', mult: 10, reward: 500 },
    { name: 'V', mult: 25, reward: 700 }
  ];

  return tiers.map((tier, index) => ({
    id: `${groupId}_${index + 1}`,
    groupId,
    level: index + 1,
    title: `${baseTitle} ${tier.name}`, 
    titleEn: `${baseTitleEn} ${tier.name}`,
    description: `${baseDesc} (${Math.floor(baseReq * tier.mult)})`,
    descriptionEn: `${baseDescEn} (${Math.floor(baseReq * tier.mult)})`,
    unlocked: false,
    claimed: false,
    requirement: Math.floor(baseReq * tier.mult),
    current: 0,
    reward: tier.reward
  }));
};

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  ...createTieredAchievement('level', 'Покоритель', 'Conqueror', 'Достичь уровня', 'Reach level', 5),
  ...createTieredAchievement('score', 'Сборщик', 'Collector', 'Набрать очков', 'Total Score', 10000),
  ...createTieredAchievement('red', 'Клубника', 'Strawberry', 'Собрать красных', 'Collect red', 100),
  ...createTieredAchievement('blue', 'Черника', 'Blueberry', 'Собрать синих', 'Collect blue', 100),
  ...createTieredAchievement('green', 'Яблоко', 'Apple', 'Собрать зеленых', 'Collect green', 100),
  ...createTieredAchievement('yellow', 'Лимон', 'Lemon', 'Собрать желтых', 'Collect yellow', 100),
  ...createTieredAchievement('purple', 'Виноград', 'Grape', 'Собрать фиолетовых', 'Collect purple', 100),
  ...createTieredAchievement('orange', 'Апельсин', 'Orange', 'Собрать оранжевых', 'Collect orange', 100),
  ...createTieredAchievement('jars', 'Бармен', 'Bartender', 'Использовать банок', 'Use Jars', 10),
  ...createTieredAchievement('moves', 'Трудоголик', 'Hard Worker', 'Сделать ходов', 'Moves made', 200),
];
