
import { CANDY_COLORS } from '../constants';

const PRAISES = ["Хо-хо-хо!", "Морозно!", "Отлично!", "Волшебно!", "Вкусно!", "Ледяной!", "Ух ты!", "Спасибо!", "Свежо"];

// Генерация уровня (Чистая математика, без ИИ)
const generateOfflineLevel = (level: number) => {
    const isCollectLevel = Math.random() < 0.6; 
    const levelType = isCollectLevel ? 'collect' : 'score';

    let targetScore = 0;
    const targetFruits = [];

    if (levelType === 'score') {
        // УПРОЩЕНО: Меньше очков для победы
        targetScore = 800 + (level * 150); 
    } else {
        targetScore = 300 + (level * 50);

        const targetsCount = Math.min(4, 2 + Math.floor((level) / 5));
        const availableColors = [...CANDY_COLORS].sort(() => 0.5 - Math.random());
        
        for (let i = 0; i < targetsCount; i++) {
            const color = availableColors[i];
            const count = 6 + Math.floor(level * 0.5); 
            targetFruits.push({ color, count });
        }
    }

    const stories = [
        { ru: "Дядя Макар проверяет списки.", en: "Uncle Makar checks the lists." },
        { ru: "Сани требуют подзарядки фруктами.", en: "The sleigh needs a fruit charge." },
        { ru: "Снеговики помогают в саду.", en: "Snowmen are helping in the garden." },
        { ru: "Маскировка Деда почти идеальна.", en: "Grandpa's disguise is almost perfect." },
        { ru: "Нужно наполнить ледяной погреб.", en: "We need to fill the ice cellar." },
        { ru: "Эльфы устроили соревнование.", en: "Elves started a competition." },
        { ru: "Макар готовит волшебный компот.", en: "Makar is brewing magic juice." },
        { ru: "Северное сияние освещает сад.", en: "Northern lights light up the garden." },
        { ru: "Замерзшие ветки хранят плоды.", en: "Frozen branches hold the fruits." },
        { ru: "Дядя Макар надевает шубу.", en: "Uncle Makar puts on his coat." }
    ];

    const story = stories[level % stories.length] || { ru: "Зима близко...", en: "Winter is coming..." };

    let objective = { ru: "", en: "" };
    if (levelType === 'score') {
        objective = { 
            ru: `Уровень ${level}: Набери ${targetScore} очков!`,
            en: `Level ${level}: Get ${targetScore} points!`
        };
    } else {
        objective = {
            ru: `Уровень ${level}: Собери фрукты!`,
            en: `Level ${level}: Collect fruits!`
        };
    }

    return { 
      levelType,
      objective: objective,
      storySegment: story,
      targetScore,
      targetFruits
    };
};

export const getLevelObjective = async (level: number) => {
  return generateOfflineLevel(level);
};

export const getAICommentary = async (scoreDelta: number) => {
  return PRAISES[Math.floor(Math.random() * PRAISES.length)];
};
