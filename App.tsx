import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GameState, CandyColor, Achievement, TargetFruit, Inventory, GameStats, LevelType } from './types';
import { 
  GRID_SIZE, COLOR_MAP, EMOJI_MAP, JAR_MAX, 
  CANDY_COLORS, MUSIC, SFX, INITIAL_ACHIEVEMENTS, 
  SHOP_ITEMS, TRANSLATIONS
} from './constants';
import { createBoard, checkForMatches, moveIntoSquareBelow, findPotentialMatch, shuffleBoard } from './gameLogic';
import { getLevelObjective, getAICommentary } from './services/geminiService';
import { 
  Trophy, Star, RefreshCw, Zap, Play,
  ChevronRight, Award, Volume2, VolumeX, Home,
  ShoppingBag, Plus, Clock, Lock,
  Crown, Flame, Settings, Music, Lightbulb, Bomb,
  Cloud, Package, Gem
} from 'lucide-react';
import JarIcon from './components/JarIcon';
import Snowfall from './components/Snowfall';
import { CoinIcon, SantaIcon, GiftIcon, ShopItemImage } from './components/Icons';
import { IsoTree, IsoMountain, IsoRock, SantaHouse, IsoSleigh } from './components/MapDecorations';

const STORAGE_KEY = 'fruit_crash_save_v7_ls'; 
const ACHIEVEMENTS_KEY = 'fruit_crash_achievements_v5_ls';

// --- Storage Helper Functions ---
const saveToStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.error("Storage save error", e);
  }
};

const loadFromStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.error("Storage load error", e);
    return null;
  }
};

const App: React.FC = () => {
  const getInitialGameState = (): GameState => {
    try {
      const saved = loadFromStorage(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const today = new Date().toISOString().split('T')[0];
        const lastDate = parsed.lastPlayedDate || today;
        const isNewDay = lastDate !== today;
        
        const defaultStats: GameStats = { red: 0, blue: 0, green: 0, yellow: 0, purple: 0, orange: 0 };
        const defaultInventory: any = { smallPack: 0, mediumPack: 0, largePack: 0, magicSnowflake: 0, santaBag: 0, bomb: 0 };
        const defaultSettings = { maxDailyMinutes: null, soundEnabled: true, musicEnabled: true, hintsEnabled: true, language: 'ru' };

        let wallet = parsed.coinsFromLevels ?? 0;
        let crystals = parsed.crystals ?? 0;
        if (parsed.inventory && typeof parsed.coinsFromLevels === 'undefined') {
             wallet = 0;
        }

        return {
          board: createBoard(),
          score: 0,
          totalScore: parsed.totalScore ?? 0,
          totalJarsUsed: parsed.totalJarsUsed ?? 0,
          totalMoves: parsed.totalMoves ?? 0,
          maxCombo: 0,
          moves: 25,
          level: parsed.level ?? 1,
          levelType: parsed.levelType ?? 'collect',
          objective: { ru: "Загрузка...", en: "Loading..." }, // Default bilingual
          storySegment: { ru: "Дед Мороз паркует сани...", en: "Santa is parking the sleigh..." }, // Default bilingual
          targetScore: 1000,
          targetFruits: [],
          jars: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0, orange: 0 },
          isProcessing: false,
          screen: 'menu',
          tick: 0,
          coinsFromLevels: wallet, 
          crystals,
          lastLevelReward: 0,
          inventory: { ...defaultInventory, ...parsed.inventory },
          tutorialSeen: parsed.tutorialSeen ?? false,
          settings: { ...defaultSettings, ...parsed.settings },
          minutesPlayedToday: isNewDay ? 0 : (parsed.minutesPlayedToday ?? 0),
          lastPlayedDate: today,
          stats: { ...defaultStats, ...parsed.stats }
        } as GameState;
      }
    } catch (e) {
      console.error("Ошибка загрузки сохранения:", e);
    }
    
    return {
      board: createBoard(),
      score: 0,
      totalScore: 0,
      totalJarsUsed: 0,
      totalMoves: 0,
      maxCombo: 0,
      moves: 25,
      level: 1,
      levelType: 'collect',
      objective: { ru: "Загрузка...", en: "Loading..." },
      storySegment: { ru: "Дед Мороз паркует сани...", en: "Santa is parking the sleigh..." },
      targetScore: 1000,
      targetFruits: [],
      jars: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0, orange: 0 },
      isProcessing: false,
      screen: 'menu',
      tick: 0,
      coinsFromLevels: 0,
      crystals: 0,
      lastLevelReward: 0,
      inventory: { smallPack: 0, mediumPack: 0, largePack: 0, magicSnowflake: 0, santaBag: 0, bomb: 0 } as any,
      tutorialSeen: false,
      settings: { maxDailyMinutes: null, soundEnabled: true, musicEnabled: true, hintsEnabled: true, language: 'ru' },
      minutesPlayedToday: 0,
      lastPlayedDate: new Date().toISOString().split('T')[0],
      stats: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0, orange: 0 }
    } as GameState;
  };

  const getInitialAchievements = (): Achievement[] => {
    try {
      const saved = loadFromStorage(ACHIEVEMENTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Achievement[];
        return INITIAL_ACHIEVEMENTS.map(initAch => {
          const savedAch = parsed.find(s => s.id === initAch.id);
          if (savedAch) {
            return { 
                ...initAch, 
                unlocked: savedAch.unlocked, 
                current: savedAch.current,
                claimed: savedAch.claimed ?? savedAch.unlocked 
            };
          }
          return initAch;
        });
      }
    } catch (e) {
      console.error("Ошибка загрузки достижений:", e);
    }
    return INITIAL_ACHIEVEMENTS;
  };

  const [gameState, setGameState] = useState<GameState>(getInitialGameState);
  const [achievements, setAchievements] = useState<Achievement[]>(getInitialAchievements);
  const [aiCommentary, setAiCommentary] = useState<string | null>(null);
  const [vortexColor, setVortexColor] = useState<CandyColor | null>(null);
  const [loadingText, setLoadingText] = useState("Дядя Макар паркует сани...");
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [hintData, setHintData] = useState<{ swap: number[], match: number[] } | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isShuffling, setIsShuffling] = useState(false);
  const [targetingMode, setTargetingMode] = useState<'bomb' | null>(null);
  const [bombAnim, setBombAnim] = useState<{ index: number, falling: boolean } | null>(null);
  const [shopTab, setShopTab] = useState<'featured' | 'boosters' | 'moves'>('featured');
  
  const touchStartRef = useRef<{ x: number, y: number, id: number } | null>(null);
  const timerRef = useRef<number | null>(null);
  const hintTimerRef = useRef<number | null>(null); 
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mapInteractionRef = useRef<{startX: number, startY: number} | null>(null);
  


// ... остальные стейты ...
  // FIX: Preload Audio correctly into a Ref to prevent delay
  const sfxRef = useRef<Record<string, HTMLAudioElement>>({});
  const hasInteractedRef = useRef(false);

  // --- ANALYTICS: GET TELEGRAM USER ID ---
  // Получаем ID игрока (или фейковый 777777, если открыто в браузере)
  const tgUserId = useMemo(() => {
    try {
        return (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id || 777777;
    } catch(e) { return 777777; }
  }, []);

  // Helper for Translation
  const t = (key: keyof typeof TRANSLATIONS.ru) => {
    const lang = gameState.settings.language || 'ru';
    return TRANSLATIONS[lang][key] || key;
  };

  // Sale Logic
  const isSaleActive = useMemo(() => {
    const now = new Date();
    // Months are 0-indexed in JS Date. 11 = Dec, 0 = Jan.
    const start = new Date(2025, 11, 1); // Dec 1, 2025
    const end = new Date(2026, 0, 14, 23, 59, 59); // Jan 14, 2026
    return now >= start && now <= end;
  }, []);

  const totalCoins = gameState.coinsFromLevels;
  const totalCrystals = (gameState as any).crystals || 0;

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (gameState.lastPlayedDate !== today) {
        setGameState(prev => ({ ...prev, minutesPlayedToday: 0, lastPlayedDate: today, screen: 'menu' })); 
    }
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
         if (gameState.screen !== 'blocked') {
             setGameState(prev => {
                 const newMinutes = prev.minutesPlayedToday + (1/60); 
                 if (prev.settings.maxDailyMinutes !== null && prev.settings.maxDailyMinutes > 0 && newMinutes >= prev.settings.maxDailyMinutes) {
                     return { ...prev, minutesPlayedToday: newMinutes, screen: 'blocked' };
                 }
                 return { ...prev, minutesPlayedToday: newMinutes };
             });
         }
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState.screen, gameState.settings.maxDailyMinutes]);

  const resetHintTimer = useCallback(() => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      setHintData(null); 
      
      if (gameState.screen === 'game' && !gameState.isProcessing && gameState.settings.hintsEnabled) {
          hintTimerRef.current = setTimeout(() => {
              const potential = findPotentialMatch(gameState.board);
              if (potential) {
                  setHintData(potential);
              }
          }, 5000); 
      }
  }, [gameState.screen, gameState.isProcessing, gameState.board, gameState.settings.hintsEnabled]);

  useEffect(() => {
      resetHintTimer();
      return () => { if (hintTimerRef.current) clearTimeout(hintTimerRef.current); };
  }, [resetHintTimer]);

  const saveProgress = useCallback(() => {
    const saveState = {
      level: gameState.level,
      levelType: gameState.levelType,
      totalScore: gameState.totalScore,
      totalJarsUsed: gameState.totalJarsUsed,
      totalMoves: gameState.totalMoves,
      coinsFromLevels: gameState.coinsFromLevels,
      crystals: (gameState as any).crystals,
      inventory: gameState.inventory,
      tutorialSeen: gameState.tutorialSeen,
      settings: gameState.settings,
      minutesPlayedToday: gameState.minutesPlayedToday,
      lastPlayedDate: gameState.lastPlayedDate,
      stats: gameState.stats
    };
    saveToStorage(STORAGE_KEY, JSON.stringify(saveState));
    saveToStorage(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
  }, [gameState, achievements]);

  useEffect(() => {
    saveProgress();
  }, [gameState.level, gameState.totalScore, gameState.coinsFromLevels, gameState.inventory, gameState.settings, saveProgress]);

  useEffect(() => {
      if (Math.floor(gameState.minutesPlayedToday) > 0) {
          saveProgress();
      }
  }, [Math.floor(gameState.minutesPlayedToday), saveProgress]);

  // FIX: Initialize SFX with Preload
  useEffect(() => {
     Object.keys(SFX).forEach(key => {
        try {
          const audio = new Audio(SFX[key as keyof typeof SFX]);
          audio.preload = 'auto'; // Force buffer
          audio.volume = 0.6; // Slightly louder sfx
          sfxRef.current[key] = audio;
        } catch(e) { console.error("Audio init error", e); }
      });
  }, []);

  const unlockAudio = useCallback(() => {
    if (hasInteractedRef.current) return;
    
    hasInteractedRef.current = true;
    audioRef.current = new Audio(MUSIC[currentTrackIndex])
    
    // Play Background Music Logic
    if (audioRef.current) {
        if (!audioRef.current.src) {
             audioRef.current.src = MUSIC[currentTrackIndex];
        }
        audioRef.current.volume = 0.3; // Lower music volume for balance
        audioRef.current.loop = true;
        const playPromise = audioRef.current.play();
             if (playPromise !== undefined) {
                 playPromise.catch(error => {
                     console.log("Auto-play prevented (expected until interaction):", error);
                 });
             }
    }
  }, [currentTrackIndex, gameState.settings.musicEnabled]);

  useEffect(() => {
      const handleUnlock = () => unlockAudio();
      window.addEventListener('click', handleUnlock);
      window.addEventListener('touchstart', handleUnlock);
      window.addEventListener('keydown', handleUnlock);
      return () => {
          window.removeEventListener('click', handleUnlock);
          window.removeEventListener('touchstart', handleUnlock);
          window.removeEventListener('keydown', handleUnlock);
      };
  }, [unlockAudio]);

  // Optimized SFX Player (re-use object)
  const playSFX = (key: keyof typeof SFX) => {
    if (!gameState.settings.soundEnabled) return;
    try {
      const baseAudio = sfxRef.current[key];
      if (baseAudio) {
        // Clone for polyphony (overlap sounds)
        const sound = baseAudio.cloneNode() as HTMLAudioElement;
        sound.volume = 0.6;
        sound.play().catch(e => console.warn("SFX play failed", e));
      } 
    } catch(e) {}
  };

  const playNextTrack = () => {
      const nextIndex = (currentTrackIndex + 1) % MUSIC.length;
      setCurrentTrackIndex(nextIndex);
  };

  useEffect(() => {
      if (!audioRef.current) return;
      if (!gameState.settings.musicEnabled) {
          audioRef.current.pause();
          return;
      }
      if (hasInteractedRef.current) {
          audioRef.current.src = MUSIC[currentTrackIndex];
          audioRef.current.play().catch(e => console.log("Track change play error", e));
      }
  }, [currentTrackIndex, gameState.settings.musicEnabled]);


  useEffect(() => {
    setAchievements(prev => prev.map(ach => {
      let currentVal = 0;
      switch (ach.groupId) {
        case 'level': currentVal = gameState.level; break;
        case 'score': currentVal = gameState.totalScore; break;
        case 'jars': currentVal = gameState.totalJarsUsed; break;
        case 'moves': currentVal = gameState.totalMoves; break;
        case 'red': currentVal = gameState.stats.red; break;
        case 'blue': currentVal = gameState.stats.blue; break;
        case 'green': currentVal = gameState.stats.green; break;
        case 'yellow': currentVal = gameState.stats.yellow; break;
        case 'purple': currentVal = gameState.stats.purple; break;
        case 'orange': currentVal = gameState.stats.orange; break;
        default: currentVal = ach.current;
      }
      return { ...ach, current: currentVal, unlocked: currentVal >= ach.requirement || ach.unlocked };
    }));
  }, [gameState.level, gameState.totalScore, gameState.totalJarsUsed, gameState.totalMoves, gameState.stats]);

  const claimAchievement = (id: string) => {
    setAchievements(prev => {
        const ach = prev.find(a => a.id === id);
        if (ach && ach.unlocked && !ach.claimed) {
            playSFX('coin');
            setGameState(gs => ({...gs, coinsFromLevels: gs.coinsFromLevels + ach.reward}));
            return prev.map(a => a.id === id ? { ...a, claimed: true } : a);
        }
        return prev;
    });
  };

  const visibleAchievements = useMemo(() => {
    const groups: Record<string, Achievement[]> = {};
    achievements.forEach(ach => {
      if (!groups[ach.groupId]) groups[ach.groupId] = [];
      groups[ach.groupId].push(ach);
    });

    return Object.keys(groups).map(groupId => {
      const group = groups[groupId];
      group.sort((a, b) => a.level - b.level);
      const active = group.find(a => !a.claimed);
      return active || group[group.length - 1];
    });
  }, [achievements]);

  // Robust Level Complete Check
  const isLevelComplete = useMemo(() => {
     if (gameState.levelType === 'score') {
         return gameState.score >= gameState.targetScore;
     }
     // Collect Mode: Ignore score, just check fruits
     return gameState.targetFruits.length > 0 && gameState.targetFruits.every(f => f.current >= f.target);
  }, [gameState.levelType, gameState.score, gameState.targetScore, gameState.targetFruits]);

  // --- GAME LOGIC LOOP ---
  const processBoardStep = useCallback(() => {
    // STOP processing if level is complete to prevent extra matches/spawning
    if (isLevelComplete) {
        setGameState(prev => ({ ...prev, isProcessing: false }));
        return;
    }

    let scoreGained = 0;
    let somethingHappened = false;

    setGameState(prev => {
      const matches = checkForMatches(prev.board);
      if (matches.length > 0) {
        somethingHappened = true;
        playSFX('match');
        const newBoard = [...prev.board];
        const newJars = { ...prev.jars };
        const newTargets = prev.targetFruits.map(t => ({...t}));
        const newStats = { ...prev.stats };

        matches.forEach(idx => {
          const candy = prev.board[idx];
          if (candy) {
            newStats[candy.color] = (newStats[candy.color] || 0) + 1;
            if (newJars[candy.color] < JAR_MAX) newJars[candy.color]++;
            const target = newTargets.find(t => t.color === candy.color);
            if (target) target.current++;
          }
          newBoard[idx] = null;
        });
        scoreGained = matches.length * 10;
        return {
          ...prev, board: newBoard, jars: newJars, targetFruits: newTargets,
          score: prev.score + scoreGained, totalScore: prev.totalScore + scoreGained,
          isProcessing: true, tick: prev.tick + 1, stats: newStats
        };
      }

      const hasNulls = prev.board.some(c => c === null);
      if (hasNulls) {
        somethingHappened = true;
        const { board: refilledBoard } = moveIntoSquareBelow(prev.board);
        return { ...prev, board: refilledBoard, isProcessing: true, tick: prev.tick + 1 };
      }
      
      // AUTO SHUFFLE IF NO MOVES
      if (!findPotentialMatch(prev.board)) {
          setIsShuffling(true);
          setTimeout(() => setIsShuffling(false), 1000);
          const shuffledBoard = shuffleBoard(prev.board);
          return { ...prev, board: shuffledBoard, isProcessing: false }; // Stop processing to show shuffled board
      }
      
      return { ...prev, isProcessing: false };
    });

    if (scoreGained >= 40) {
      getAICommentary(scoreGained).then(setAiCommentary);
      setTimeout(() => setAiCommentary(null), 1500);
    }
  }, [isLevelComplete]); // Dependent on isLevelComplete

  useEffect(() => {
    if (gameState.screen === 'game' && gameState.isProcessing) {
      const timer = setTimeout(processBoardStep, 250); // Slightly slower for better visual feel
      return () => clearTimeout(timer);
    }
  }, [gameState.isProcessing, gameState.tick, gameState.screen, processBoardStep]);
  
  const [rewardClaimed, setRewardClaimed] = useState(false);

  useEffect(() => {
    // FIX: Trigger reward even if still processing, but wait to show screen
    if (gameState.screen === 'game' && isLevelComplete && !rewardClaimed) {
        
        
        const reward = Math.floor(Math.random() * 11) + 10; 
        setGameState(prev => ({
            ...prev, coinsFromLevels: prev.coinsFromLevels + reward, lastLevelReward: reward, isProcessing: false 
        }));
        setRewardClaimed(true);
        playSFX('win');
    }
    if (!isLevelComplete) setRewardClaimed(false);
  }, [isLevelComplete, gameState.screen, rewardClaimed]);

  const prepareLevel = useCallback(async (level: number) => {
    
    

    setLoadingText(t('loading'));
    setGameState(prev => ({ ...prev, screen: 'loading' }));
    
    let data;
    try { data = await getLevelObjective(level); } catch (e) { data = {}; }
    
    const rawFruits = Array.isArray(data?.targetFruits) ? data.targetFruits : [];
    const validTargetFruits: TargetFruit[] = rawFruits
      .map((tf: any) => {
        const normalizedColor = (tf.color || '').toLowerCase();
        if (CANDY_COLORS.includes(normalizedColor as CandyColor)) {
          return { color: normalizedColor as CandyColor, current: 0, target: typeof tf.count === 'number' ? tf.count : 15 };
        }
        return null;
      })
      .filter((tf): tf is TargetFruit => tf !== null);

    if (data.levelType !== 'score' && validTargetFruits.length === 0) {
        validTargetFruits.push({ color: 'red', current: 0, target: 10 + Math.floor(level / 2) });
    }

    setGameState(prev => ({
      ...prev, level, 
      objective: data?.objective || { ru: `Уровень ${level}`, en: `Level ${level}` },
      levelType: data?.levelType || 'collect',
      storySegment: data?.storySegment || { ru: "...", en: "..." },
      targetScore: typeof data?.targetScore === 'number' ? data.targetScore : 500 + (level * 100),
      targetFruits: validTargetFruits, board: createBoard(), 
      moves: Math.max(15, 35 - Math.floor(level / 3)), 
      jars: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0, orange: 0 },
      isProcessing: false, screen: 'story', tick: 0,
      score: 0 
    }));
  }, [t]);

  const goToMap = () => {
    setGameState(prev => ({ ...prev, screen: 'map' }));
    setTimeout(() => {
        if (mapContainerRef.current) {
             const levelHeight = 120; 
             const totalHeight = mapData.totalHeight;
             const levelTop = totalHeight - (gameState.level * levelHeight) - 250;
             const containerHeight = mapContainerRef.current.clientHeight;
             mapContainerRef.current.scrollTo({
                 top: levelTop - (containerHeight / 2),
                 behavior: 'smooth'
             });
        }
    }, 100);
  };

  const useJar = (color: CandyColor) => {
    if (gameState.jars[color] < JAR_MAX || gameState.isProcessing || gameState.moves <= 0 || isLevelComplete) return;
    if (!hasInteractedRef.current) unlockAudio();
    playSFX('swap');
    setVortexColor(color);
    setTimeout(() => setVortexColor(null), 400);

    setGameState(prev => {
      const count = prev.board.filter(c => c?.color === color).length;
      const newBoard = prev.board.map(c => c?.color === color ? null : c);
      const newTargets = prev.targetFruits.map(t => t.color === color ? { ...t, current: t.current + count } : t);
      return {
        ...prev, board: newBoard, jars: { ...prev.jars, [color]: 0 },
        targetFruits: newTargets, score: prev.score + count * 20, totalScore: prev.totalScore + count * 20,
        totalJarsUsed: prev.totalJarsUsed + 1, isProcessing: true, tick: prev.tick + 1
      };
    });
  };

  const triggerBomb = (index: number) => {
    setTargetingMode(null);
    // 1. Start Animation (Falling)
    setBombAnim({ index, falling: true });

    // 2. Trigger Drop Transition
    setTimeout(() => {
        setBombAnim(prev => prev ? { ...prev, falling: false } : null);
    }, 50);

    // 3. Explode after animation
    setTimeout(() => {
        playSFX('explode'); // Make sure to add 'explode' to SFX or use 'match'
        setGameState(prev => {
            const newBoard = [...prev.board];
            const r = Math.floor(index / GRID_SIZE);
            const c = index % GRID_SIZE;
            let scoreAdd = 0;

            for(let i = r - 1; i <= r + 1; i++) {
                for(let j = c - 1; j <= c + 1; j++) {
                    if (i >= 0 && i < GRID_SIZE && j >= 0 && j < GRID_SIZE) {
                        const idx = i * GRID_SIZE + j;
                        if (newBoard[idx]) {
                            scoreAdd += 20;
                            newBoard[idx] = null;
                        }
                    }
                }
            }
            return { ...prev, board: newBoard, score: prev.score + scoreAdd, totalScore: prev.totalScore + scoreAdd, isProcessing: true, tick: prev.tick + 1 };
        });
        setBombAnim(null);
    }, 600);
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent, index: number) => {
    if (!hasInteractedRef.current) unlockAudio();
    resetHintTimer();
    
    // Allow moves only if game is not processing and not finished
    if (gameState.isProcessing || gameState.moves <= 0 || isLevelComplete) return;
    
    let clientX, clientY;
    if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
    }
    touchStartRef.current = { x: clientX, y: clientY, id: index };
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (!touchStartRef.current || gameState.isProcessing || gameState.moves <= 0 || isLevelComplete) return;
    
    let clientX, clientY;
    if ('changedTouches' in e) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
    } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
    }

    const diffX = clientX - touchStartRef.current.x;
    const diffY = clientY - touchStartRef.current.y;
    const absX = Math.abs(diffX);
    const absY = Math.abs(diffY);
    const startIdx = touchStartRef.current.id;
    let endIdx = -1;

    if (Math.max(absX, absY) > 30) {
        if (absX > absY) {
            if (diffX > 0) endIdx = startIdx + 1; 
            else endIdx = startIdx - 1; 
            if (diffX > 0 && startIdx % GRID_SIZE === GRID_SIZE - 1) endIdx = -1;
            if (diffX < 0 && startIdx % GRID_SIZE === 0) endIdx = -1;
        } else {
            if (diffY > 0) endIdx = startIdx + GRID_SIZE; 
            else endIdx = startIdx - GRID_SIZE; 
        }
        if (endIdx >= 0 && endIdx < GRID_SIZE * GRID_SIZE && gameState.board[endIdx] !== null) {
             performSwap(startIdx, endIdx);
        }
    } else {
        if (targetingMode === 'bomb') {
            triggerBomb(startIdx);
        } else {
            playSFX('click');
        }
    }
    touchStartRef.current = null;
  };

  const performSwap = (s1: number, s2: number) => {
        const newBoard = [...gameState.board];
        const temp = newBoard[s1];
        newBoard[s1] = newBoard[s2];
        newBoard[s2] = temp;
        
        if (checkForMatches(newBoard).length > 0) {
          playSFX('swap');
          setGameState(prev => ({ 
            ...prev, board: newBoard, moves: prev.moves - 1, 
            totalMoves: prev.totalMoves + 1, isProcessing: true, tick: prev.tick + 1 
          }));
        } else {
            // INVALID MOVE ANIMATION
            playSFX('click'); 
            // 1. Show the swap
            setGameState(prev => ({...prev, board: newBoard, isProcessing: true }));
            // 2. Swap back after delay
            setTimeout(() => {
                setGameState(prev => {
                     // We need to revert using the PREVIOUS valid board state or manually swap back in current logic.
                     // Simplest way with current architecture: Manually swap back in the newBoard array and set it.
                     const revertBoard = [...newBoard];
                     const t = revertBoard[s1];
                     revertBoard[s1] = revertBoard[s2];
                     revertBoard[s2] = t;
                     return { ...prev, board: revertBoard, isProcessing: false };
                });
            }, 300);
        }
  };

  const buyItem = (item: typeof SHOP_ITEMS[0]) => {
    setGameState(prev => {
        const price = isSaleActive ? item.salePrice : item.price;
        if (prev.coinsFromLevels >= price) {
            playSFX('buy');
            return {
                ...prev, 
                coinsFromLevels: prev.coinsFromLevels - price,
                inventory: { ...prev.inventory, [item.id]: prev.inventory[item.id as keyof Inventory] + 1 }
            };
        } else {
            return prev;
        }
    });
    
    if (totalCoins < (isSaleActive ? item.salePrice : item.price)) {
        playSFX('lose'); 
        alert(t('not_enough'));
    }
  };

  const useInventoryItem = (type: keyof Inventory, itemDetails: typeof SHOP_ITEMS[0]) => {
      if (gameState.inventory[type] > 0) {
          playSFX('coin');
          setGameState(prev => {
              const newState = {
                  ...prev,
                  inventory: { ...prev.inventory, [type]: prev.inventory[type] - 1 }
              };
              if (type === 'magicSnowflake') {
                 // FULL FILL ONE RANDOM
                 const colors = CANDY_COLORS;
                 const randomColor = colors[Math.floor(Math.random() * colors.length)];
                 newState.jars = { ...prev.jars, [randomColor]: JAR_MAX }; 
              } else if (type === 'santaBag') {
                 // FULL FILL ALL
                 const newJars = { ...prev.jars };
                 CANDY_COLORS.forEach(c => {
                     newJars[c] = JAR_MAX;
                 });
                 newState.jars = newJars;
              } else if (type === 'bomb') {
                 setTargetingMode('bomb');
                 setShowInventoryModal(false);
                 return prev; // Don't consume yet, wait for target
              } else {
                 newState.moves = prev.moves + itemDetails.moves;
              }
              return newState;
          });
          setShowInventoryModal(false);
      }
  };

  const getAchievementIcon = (groupId: string) => {
      switch(groupId) {
          case 'level': return <Crown size={24} className="text-yellow-300" />;
          case 'score': return <Trophy size={24} className="text-yellow-400" />;
          case 'jars': return <Zap size={24} className="text-blue-300" />;
          case 'moves': return <Flame size={24} className="text-orange-400" />;
          default: return <Award size={24} className="text-white" />;
      }
  };
  
  // --- ISOMETRIC MAP LOGIC ---
  const mapData = useMemo(() => {
    const levelHeight = 120; // Dense levels
    const maxVisibleLevel = gameState.level + 5; // Updated to show a bit more ahead
    const levels = Array.from({ length: maxVisibleLevel }, (_, i) => i + 1);
    const totalHeight = levels.length * levelHeight + 350; 

    // Generate Path Points (More organic winding)
    const pathPoints: {x: number, y: number}[] = [];
    levels.forEach((l, idx) => {
         const top = totalHeight - (l * levelHeight) - 200;
         const xOffset = 30 * Math.sin(idx * 0.8) + 10 * Math.cos(idx * 0.3);
         const left = 50 + xOffset; 
         pathPoints.push({x: left, y: top});
    });

    const decorElements: {type: string, x: number, y: number, scale: number}[] = [];
    
    // Add side mountains periodically
    for(let i=0; i<levels.length; i+=2) {
       const yPos = totalHeight - (i * levelHeight) - 150;
       decorElements.push({ type: 'mountain', x: 5, y: yPos, scale: 1.2 });
       decorElements.push({ type: 'mountain', x: 95, y: yPos - 60, scale: 1.2 });
    }

    pathPoints.forEach((pt, i) => {
         const side = i % 2 === 0 ? 1 : -1;
         if (i % 2 === 0) {
             decorElements.push({ type: 'tree', x: pt.x - (side * 45), y: pt.y - 10, scale: 0.9 + Math.random()*0.2 });
         } else {
             decorElements.push({ type: 'rock', x: pt.x + (side * 40), y: pt.y + 20, scale: 0.8 });
         }

         if (i % 4 === 0) {
            decorElements.push({ type: 'cloud', x: 20 + (i*13 % 70), y: pt.y - 100, scale: 1 });
         }
    });

    // Cloud Cover for future levels
    const cloudCover: {x: number, y: number, scale: number}[] = [];
    levels.forEach((l, idx) => {
        if (l > gameState.level + 2) {
            const pt = pathPoints[idx];
            // Multiple clouds per hidden level for density
            cloudCover.push({ x: pt.x, y: pt.y, scale: 2 });
            cloudCover.push({ x: pt.x - 10, y: pt.y + 20, scale: 1.5 });
            cloudCover.push({ x: pt.x + 10, y: pt.y - 10, scale: 1.8 });
        }
    });

    return { levels, totalHeight, levelHeight, pathPoints, decorElements, cloudCover };
  }, [gameState.level]);

  // NEW: Scroll detection logic for Map to prevent accidental clicks
  const onMapInteractionStart = (e: React.TouchEvent | React.MouseEvent) => {
      const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const y = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      mapInteractionRef.current = { startX: x, startY: y };
  };

  const handleMapNodeClick = (lvl: number, isUnlocked: boolean, e: React.MouseEvent) => {
      // Calculate distance from start
      let distance = 0;
      if (mapInteractionRef.current) {
          const x = e.clientX;
          const y = e.clientY;
          const dx = x - mapInteractionRef.current.startX;
          const dy = y - mapInteractionRef.current.startY;
          distance = Math.sqrt(dx*dx + dy*dy);
      }
      
      // If movement is small (tap), allow level start
      if (distance < 10 && isUnlocked) {
          playSFX('click'); 
          prepareLevel(lvl); 
      }
      // Reset interaction
      mapInteractionRef.current = null;
  };
  
  // 🔥 Функция закрытия окна
  


  const renderScreen = () => {
      const GlobalSnow = <Snowfall />;
      // Safe area for iPhone notch/home bar
      const safeAreaStyle = { paddingBottom: 'env(safe-area-inset-bottom, 20px)', paddingTop: 'env(safe-area-inset-top, 20px)' };

      if (gameState.screen === 'blocked') {
          return (
             <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 text-white z-[200]">
                 {GlobalSnow}
                 <div className="bg-white/10 p-8 rounded-[2rem] text-center border-4 border-slate-700 animate-scale-up">
                     <Lock size={64} className="mx-auto mb-6 text-red-400" />
                     <h2 className="game-font text-3xl mb-4 ui-text-shadow">{t('locked')}</h2>
                     <p className="text-xl mb-6 text-slate-300">{t('locked_desc')}</p>
                     <p className="text-sm font-bold text-yellow-400 uppercase tracking-widest">— Дядя Макар</p>
                 </div>
             </div>
          );
      }

      if (gameState.screen === 'settings') {
          return (
              <div className="fixed inset-0 bg-blue-50 flex flex-col text-slate-800 z-[60]" style={safeAreaStyle}>
                <div className="w-full bg-white p-4 pt-8 flex items-center justify-between shadow-sm animate-scale-up">
                    <button onClick={() => { playSFX('click'); setGameState(prev => ({ ...prev, screen: 'menu' })); }} className="game-font text-lg flex items-center gap-1 text-slate-500 ui-text-shadow">
                        <ChevronRight className="rotate-180" /> {t('back')}
                    </button>
                    <h1 className="game-font text-xl text-blue-600 ui-text-shadow">{t('settings')}</h1>
                    <div className="w-8"></div>
                </div>

                <div className="p-6 animate-scale-up overflow-y-auto pb-20">
                     {/* LANGUAGE - Modified as requested */}
                    <div className="bg-white p-2 rounded-3xl shadow-lg mb-4 flex">
                         <button 
                             onClick={() => setGameState(prev => ({...prev, settings: {...prev.settings, language: 'ru'}}))}
                             className={`flex-1 py-4 rounded-2xl font-bold text-xl transition-all ${gameState.settings.language !== 'en' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                         >RU</button>
                         <button 
                             onClick={() => setGameState(prev => ({...prev, settings: {...prev.settings, language: 'en'}}))}
                             className={`flex-1 py-4 rounded-2xl font-bold text-xl transition-all ${gameState.settings.language === 'en' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                         >EN</button>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-lg mb-4 flex items-center justify-between">
                         <div className="flex items-center gap-3 text-purple-600">
                            {gameState.settings.soundEnabled ? <Volume2 size={28} /> : <VolumeX size={28} />}
                            <h3 className="game-font text-xl ui-text-shadow">{t('audio')}</h3>
                         </div>
                         <button 
                             onClick={() => setGameState(prev => ({...prev, settings: {...prev.settings, soundEnabled: !prev.settings.soundEnabled}}))}
                             className={`w-16 h-8 rounded-full p-1 transition-colors ${gameState.settings.soundEnabled ? 'bg-green-500' : 'bg-slate-300'}`}
                         >
                             <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${gameState.settings.soundEnabled ? 'translate-x-8' : 'translate-x-0'}`}></div>
                         </button>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-lg mb-4 flex items-center justify-between">
                         <div className="flex items-center gap-3 text-purple-600">
                            <Music size={28} />
                            <h3 className="game-font text-xl ui-text-shadow">{t('music')}</h3>
                         </div>
                         <button 
                             onClick={() => setGameState(prev => ({...prev, settings: {...prev.settings, musicEnabled: !prev.settings.musicEnabled}}))}
                             className={`w-16 h-8 rounded-full p-1 transition-colors ${gameState.settings.musicEnabled ? 'bg-green-500' : 'bg-slate-300'}`}
                         >
                             <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${gameState.settings.musicEnabled ? 'translate-x-8' : 'translate-x-0'}`}></div>
                         </button>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-lg mb-4 flex items-center justify-between">
                         <div className="flex items-center gap-3 text-purple-600">
                            <Lightbulb size={28} />
                            <h3 className="game-font text-xl ui-text-shadow">{t('hints')}</h3>
                         </div>
                         <button 
                             onClick={() => setGameState(prev => ({...prev, settings: {...prev.settings, hintsEnabled: !prev.settings.hintsEnabled}}))}
                             className={`w-16 h-8 rounded-full p-1 transition-colors ${gameState.settings.hintsEnabled ? 'bg-green-500' : 'bg-slate-300'}`}
                         >
                             <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${gameState.settings.hintsEnabled ? 'translate-x-8' : 'translate-x-0'}`}></div>
                         </button>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-lg mb-4">
                        <div className="flex items-center gap-3 mb-4 text-purple-600">
                            <Clock size={28} />
                            <h3 className="game-font text-xl ui-text-shadow">{t('timer')}</h3>
                        </div>
                        <p className="text-sm text-slate-500 mb-6">{t('timer_desc')}</p>
                        
                        <div className="relative">
                            <input 
                                type="number" 
                                min="0"
                                placeholder={t('no_limit')}
                                value={gameState.settings.maxDailyMinutes === null ? '' : gameState.settings.maxDailyMinutes}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const num = val === '' ? null : Math.max(0, parseInt(val));
                                    setGameState(prev => ({ ...prev, settings: { ...prev.settings, maxDailyMinutes: num } }));
                                }}
                                className="w-full bg-slate-100 border-2 border-slate-200 rounded-xl px-4 py-4 text-2xl font-bold text-slate-700 outline-none focus:border-purple-500 transition-colors placeholder:text-slate-300"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">{t('min')}</div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-lg mb-8 text-center">
                         <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">{t('played_today')}</p>
                         <p className="text-3xl font-black text-slate-700">{Math.floor(gameState.minutesPlayedToday)} <span className="text-lg text-slate-400 font-bold">{t('min')}</span></p>
                    </div>

                    <div className="text-center mt-8 pb-4">
                        <p className="game-font text-slate-400 text-[10px] tracking-widest uppercase">FRUIT CRASH v8.5 WINTER TALES</p>
                    </div>
                </div>
              </div>
          );
      }

      if (gameState.screen === 'loading') {
        return (
          <div className="fixed inset-0 flex flex-col items-center justify-center p-6 text-white z-[200]">
            {GlobalSnow}
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center animate-bounce shadow-xl">
               <GiftIcon size={50} />
            </div>
            <h2 className="game-font text-2xl mt-8 animate-pulse uppercase tracking-widest ui-text-shadow">{loadingText}</h2>
          </div>
        );
      }

      if (gameState.screen === 'menu') {
        return (
          <div key="menu-screen" onClick={unlockAudio} className="fixed inset-0 flex flex-col items-center justify-center p-6 text-white overflow-hidden bg-gradient-to-b from-blue-600 via-blue-400 to-white">
            {GlobalSnow}
            <div className="absolute top-4 right-4 flex gap-2 z-20" style={{top: 'max(1rem, env(safe-area-inset-top))'}}>
              <div className="bg-white text-purple-600 px-4 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg border-2 border-slate-100 btn-press">
                 <Gem size={20} /> {totalCrystals}
              </div>
              <div className="bg-white text-amber-600 px-4 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg border-2 border-slate-100 btn-press">
                 <CoinIcon size={20} /> {totalCoins}
              </div>
              <button onClick={(e) => { e.stopPropagation(); playSFX('click'); setGameState(prev => ({...prev, screen: 'settings'})); }} className="p-3 bg-white/20 rounded-2xl btn-press">
                 <Settings />
              </button>
            </div>

            <div className="text-center animate-scale-up w-full px-4 relative z-10 max-w-xs md:max-w-2xl">
              <div className="mb-4 flex justify-center gap-4">
                 <div className="drop-shadow-lg animate-bounce"><SantaIcon size={60} /></div>
                 <div className="drop-shadow-lg animate-bounce" style={{ animationDelay: '0.2s' }}><GiftIcon size={50} /></div>
              </div>
              
              <div className="relative mb-2">
                 <h1 className="game-font text-[4.5rem] sm:text-[6rem] md:text-[7rem] lg:text-[8rem] leading-[0.9] text-blue-900 title-text absolute w-full top-0 left-0 z-0 select-none">FRUIT<br/>CRASH</h1>
                 <h1 className="game-font text-[4.5rem] sm:text-[6rem] md:text-[7rem] lg:text-[8rem] leading-[0.9] title-gradient relative z-10 select-none">FRUIT<br/>CRASH</h1>
              </div>

              <div className="text-blue-900 font-black tracking-widest text-sm mt-4 uppercase bg-white/60 inline-block px-4 py-1 rounded-full border border-white/50 backdrop-blur-sm shadow-sm">
                  {t('season_subtitle')}
              </div>
              
              <div className="mt-12 flex flex-col gap-4">
                <button onClick={() => { playSFX('click'); goToMap(); }} className="bg-blue-600 hover:bg-blue-500 py-6 rounded-3xl game-font text-3xl shadow-[0_8px_0_rgb(29,78,216)] active:translate-y-2 flex items-center justify-center gap-3 border-4 border-blue-400/50 btn-press ui-text-shadow">
                  <Play fill="white" /> {t('play')}
                </button>
                <div className="flex gap-4">
                    <button onClick={() => { playSFX('click'); setGameState(prev => ({ ...prev, screen: 'shop' })); }} className="flex-1 bg-yellow-500 py-4 rounded-3xl game-font text-xl shadow-[0_6px_0_rgb(202,138,4)] active:translate-y-1 flex flex-col items-center justify-center gap-1 leading-none btn-press ui-text-shadow">
                      <ShoppingBag size={28} />
                      <span className="text-sm font-bold tracking-wide mt-1">{t('shop')}</span>
                    </button>
                    <button onClick={() => { playSFX('click'); setGameState(prev => ({ ...prev, screen: 'achievements' })); }} className="flex-1 bg-purple-500 py-4 rounded-3xl game-font text-xl shadow-[0_6px_0_rgb(126,34,206)] active:translate-y-1 flex flex-col items-center justify-center gap-1 leading-none btn-press ui-text-shadow">
                      <Trophy size={28} />
                      <span className="text-sm font-bold tracking-wide mt-1">{t('achievements')}</span>
                    </button>
                </div>
              </div>
            </div>

          </div>
        );
      }

      if (gameState.screen === 'shop') {
          const lang = gameState.settings.language;
          const filteredItems = SHOP_ITEMS.filter(item => {
              if (shopTab === 'featured') return true;
              if (shopTab === 'boosters') return ['magicSnowflake', 'santaBag', 'bomb', 'smallPack', 'mediumPack', 'largePack'].includes(item.id);
              if (shopTab === 'moves') return ['smallPack', 'mediumPack', 'largePack'].includes(item.id);
              return true;
          });

          const chunkedItems = [];
          for (let i = 0; i < filteredItems.length; i += 2) {
              chunkedItems.push(filteredItems.slice(i, i + 2));
          }

          return (
            <div onClick={unlockAudio} className="fixed inset-0 bg-gradient-to-b from-slate-50 to-blue-100 flex flex-col text-slate-900 z-[60]" style={safeAreaStyle}>
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-blue-300/20 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-purple-300/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
                </div>

                {/* Top Header */}
                <div className="w-full bg-white/80 backdrop-blur-md p-4 pt-8 flex items-center justify-between shadow-sm z-20 relative border-b border-white/50">
                    <button onClick={() => { playSFX('click'); setGameState(prev => ({ ...prev, screen: 'menu' })); }} 
                        className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-600 shadow-sm border border-slate-100 active:scale-95 transition-all hover:bg-slate-50">
                        <ChevronRight className="rotate-180" size={24} />
                    </button>
                    <h2 className="game-font text-2xl text-slate-800 tracking-wider drop-shadow-sm">{t('shop')}</h2>
                    <div className="bg-purple-100/80 backdrop-blur-sm text-purple-800 px-4 py-1.5 rounded-2xl font-bold flex items-center gap-2 border border-purple-200 shadow-inner mr-2 ml-auto">
                       <Gem size={20} /> <span className="text-lg">{totalCrystals}</span>
                    </div>
                    <div className="bg-amber-100/80 backdrop-blur-sm text-amber-800 px-4 py-1.5 rounded-2xl font-bold flex items-center gap-2 border border-amber-200 shadow-inner">
                       <CoinIcon size={20} /> <span className="text-lg">{totalCoins}</span>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 flex flex-col overflow-hidden z-10 relative">
                    <div className="px-6 pt-6 pb-2 shrink-0">
                        {/* Section Title */}
                        <div className="flex items-center gap-3">
                            <h3 className="game-font text-xl text-slate-700 uppercase tracking-widest drop-shadow-sm">
                                {shopTab === 'featured' ? (lang === 'ru' ? 'Все товары' : 'All Items') : 
                                 shopTab === 'boosters' ? t('boosters') : (lang === 'ru' ? 'Ходы' : 'Moves')}
                            </h3>
                            <div className="h-1 flex-1 bg-gradient-to-r from-blue-200 to-transparent rounded-full opacity-50"></div>
                        </div>
                    </div>

                    {/* Horizontal Items List */}
                    <div className="flex-1 overflow-x-auto custom-scrollbar flex items-center pb-8 pt-2 snap-x snap-mandatory">
                        <div className="px-6 flex gap-6 min-w-full h-full items-center">
                            {chunkedItems.map((chunk, chunkIndex) => (
                                <div key={chunkIndex} className="flex flex-col gap-6 h-full justify-center snap-center shrink-0">
                                    {chunk.map((item, index) => {
                                        const globalIndex = chunkIndex * 2 + index;
                                        const price = isSaleActive ? item.salePrice : item.price;
                                        const discount = isSaleActive ? Math.round((1 - (item.salePrice / item.price)) * 100) : 0;
                                        const canAfford = totalCoins >= price;
                                        
                                        return (
                                            <button 
                                                key={item.id} 
                                                onClick={() => buyItem(item)}
                                                style={{ animationDelay: `${globalIndex * 0.1}s` }}
                                                className={`relative bg-white/90 backdrop-blur-sm p-4 rounded-[2rem] shadow-lg border-4 flex items-center active:scale-95 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group w-[340px] h-[160px] justify-between animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards
                                                    ${canAfford ? 'border-white hover:border-blue-200' : 'border-slate-100 opacity-80 grayscale-[0.5]'}
                                                `}
                                            >
                                                {/* Shine Effect */}
                                                <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
                                                    <div className="absolute top-0 left-[-100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-25deg] transition-all duration-1000 group-hover:left-[200%]"></div>
                                                </div>

                                                {isSaleActive && (
                                                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-black px-2 py-1 rounded-full shadow-md rotate-12 z-10 border-2 border-white animate-bounce">
                                                        -{discount}%
                                                    </div>
                                                )}
                                                
                                                <div className={`w-28 h-28 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner
                                                    ${shopTab === 'boosters' ? 'bg-purple-100' : 'bg-blue-100'}
                                                `}>
                                                    <div className="drop-shadow-lg filter">
                                                        <ShopItemImage id={item.id} size={64} />
                                                    </div>
                                                </div>
                                                
                                                <div className="flex flex-col items-start gap-2 flex-1 ml-4 h-full justify-center">
                                                    <span className="game-font text-slate-800 text-lg leading-tight text-left line-clamp-2">
                                                        {lang === 'en' ? item.title : (item as any).titleRu}
                                                    </span>
                                                    
                                                    <div className={`w-full py-3 px-4 rounded-xl font-black flex items-center justify-center gap-2 transition-all shadow-sm mt-auto
                                                        ${canAfford 
                                                            ? 'bg-gradient-to-r from-green-400 to-green-500 text-white shadow-green-200 group-hover:shadow-green-300 group-hover:from-green-500 group-hover:to-green-600' 
                                                            : 'bg-slate-200 text-slate-400'}
                                                    `}>
                                                        <span className="text-xl">{price}</span>
                                                        <CoinIcon size={20} />
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
                            <div className="w-6 shrink-0"></div>
                        </div>
                    </div>
                </div>

                {/* Bottom Tabs */}
                <div className="bg-white/90 backdrop-blur-md border-t border-slate-100 p-3 pb-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20 rounded-t-[2rem]" style={{paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))'}}>
                    <div className="flex justify-around max-w-md mx-auto bg-slate-100/50 p-1.5 rounded-[1.5rem]">
                        <button 
                            onClick={() => { playSFX('click'); setShopTab('featured'); }}
                            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl transition-all flex-1 ${shopTab === 'featured' ? 'bg-white text-purple-600 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Zap size={20} fill={shopTab === 'featured' ? "currentColor" : "none"} />
                            {shopTab === 'featured' && <span className="text-xs font-bold uppercase tracking-wide animate-in fade-in zoom-in duration-200">{lang === 'ru' ? 'Все' : 'All'}</span>}
                        </button>
                        <button 
                            onClick={() => { playSFX('click'); setShopTab('boosters'); }}
                            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl transition-all flex-1 ${shopTab === 'boosters' ? 'bg-white text-purple-600 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Flame size={20} fill={shopTab === 'boosters' ? "currentColor" : "none"} />
                            {shopTab === 'boosters' && <span className="text-xs font-bold uppercase tracking-wide animate-in fade-in zoom-in duration-200">{lang === 'ru' ? 'Усилители' : 'Boosters'}</span>}
                        </button>
                    </div>
                </div>
            </div>
          );
      }

      if (gameState.screen === 'map') {
        const { levels, totalHeight, levelHeight, pathPoints, decorElements, cloudCover } = mapData;
        
        return (
          <div onClick={unlockAudio} className="fixed inset-0 z-[40]">
             {/* Map Background Wrapper: Force White Background */}
             <div className="map-wrapper">
                 {GlobalSnow}

                 {/* Map Header */}
                 <div className="absolute top-0 left-0 w-full p-4 z-[100] flex justify-between items-center pointer-events-none animate-scale-up" style={{top: 'max(0px, env(safe-area-inset-top))'}}>
                     <button onClick={() => { playSFX('click'); setGameState(prev => ({ ...prev, screen: 'menu' })); }} className="pointer-events-auto bg-white/90 p-2 rounded-xl shadow-lg border border-blue-200 btn-press">
                       <Home className="text-blue-700" />
                     </button>
                     <div className="pointer-events-auto bg-white text-purple-600 px-4 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg border-2 border-slate-100 btn-press mr-2 ml-auto">
                        <Gem size={20} /> {totalCrystals}
                     </div>
                     <div className="pointer-events-auto bg-white text-amber-600 px-4 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg border-2 border-slate-100 btn-press">
                        <CoinIcon size={20} /> {totalCoins}
                     </div>
                 </div>

                 {/* 2D Scrollable Map with Isometric Graphics */}
                 <div ref={mapContainerRef} 
                      className="map-scroller animate-scale-up"
                      onMouseDown={onMapInteractionStart}
                      onTouchStart={onMapInteractionStart}
                 >
                    <div style={{ width: '100%', height: totalHeight, position: 'relative' }}>
                         
                         {/* 1. TERRAIN ISLANDS (ICE COLOR) */}
                         <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0" style={{ height: totalHeight }}>
                            {pathPoints.map((pt, i) => {
                                if (i % 2 !== 0) return null; // Draw islands every other point
                                const width = 200 + (i % 3) * 30;
                                return (
                                    <g key={`island-${i}`}>
                                        <ellipse cx={pt.x + '%'} cy={pt.y + 15} rx={width/2} ry={60} fill="#3b82f6" opacity="0.3" />
                                        <ellipse cx={pt.x + '%'} cy={pt.y} rx={width/2} ry={60} fill="#dbeafe" />
                                        <ellipse cx={pt.x + '%'} cy={pt.y + 5} rx={width/2 - 10} ry={50} fill="#bfdbfe" opacity="0.6" />
                                    </g>
                                )
                            })}
                         </svg>

                         {/* 2. THE PATH */}
                         <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-[1]" style={{ height: totalHeight }}>
                            {pathPoints.map((pt, i) => {
                                if (i === pathPoints.length - 1) return null;
                                const next = pathPoints[i+1];
                                return (
                                    <path key={`road-out-${i}`}
                                        d={`M ${pt.x}% ${pt.y} Q ${pt.x}% ${pt.y - 80}, ${next.x}% ${next.y}`}
                                        fill="none" stroke="#64748b" strokeWidth="36" strokeLinecap="round" 
                                        style={{ transform: 'translateY(4px)' }}
                                    />
                                )
                            })}
                            {pathPoints.map((pt, i) => {
                                if (i === pathPoints.length - 1) return null;
                                const next = pathPoints[i+1];
                                return (
                                    <path key={`road-in-${i}`}
                                        d={`M ${pt.x}% ${pt.y} Q ${pt.x}% ${pt.y - 80}, ${next.x}% ${next.y}`}
                                        fill="none" stroke="#e2e8f0" strokeWidth="28" strokeLinecap="round" 
                                    />
                                )
                            })}
                            {pathPoints.map((pt, i) => {
                                if (i === pathPoints.length - 1) return null;
                                const next = pathPoints[i+1];
                                return (
                                    <path key={`road-dash-${i}`}
                                        d={`M ${pt.x}% ${pt.y} Q ${pt.x}% ${pt.y - 80}, ${next.x}% ${next.y}`}
                                        fill="none" stroke="#94a3b8" strokeWidth="22" strokeLinecap="round" strokeDasharray="10 20"
                                        style={{ opacity: 0.3 }}
                                    />
                                )
                            })}
                         </svg>

                         {/* 3. DECORATION LAYER */}
                         {decorElements.map((el, i) => (
                             <div key={`decor-${i}`} className="absolute pointer-events-none" 
                                  style={{ left: el.x + '%', top: el.y + 'px', transform: `translate(-50%, -80%) scale(${el.scale})`, zIndex: 2 }}>
                                 {el.type === 'tree' && <IsoTree />}
                                 {el.type === 'rock' && <IsoRock />}
                                 {el.type === 'mountain' && <IsoMountain />}
                                 {el.type === 'cloud' && <div className="text-white drop-shadow-md opacity-40"><Cloud size={80} fill="white" /></div>}
                             </div>
                         ))}

                         {/* 4. NODES */}
                         {levels.map((lvl, index) => {
                             const isUnlocked = lvl <= gameState.level;
                             const isCurrent = lvl === gameState.level;
                             const isPassed = lvl < gameState.level;
                             const pt = pathPoints[index];
                             
                             if (!pt) return null;

                             return (
                                <div key={lvl} 
                                    className="iso-node"
                                    style={{ top: `${pt.y}px`, left: `${pt.x}%`, width: '50px', height: '40px', zIndex: 10 }}
                                    onClick={(e) => handleMapNodeClick(lvl, isUnlocked, e)}
                                >
                                    <div className="absolute top-1 left-0 w-full h-full bg-blue-900/20 rounded-[40%] blur-[2px]"></div>
                                    <div className={`absolute top-0 left-0 w-full h-full rounded-[40%] border-b-4 transition-all
                                        ${isCurrent ? 'bg-red-500 border-red-700' : (isPassed ? 'bg-emerald-500 border-emerald-700' : 'bg-blue-300 border-blue-400')}
                                        ${isUnlocked ? 'cursor-pointer active:border-b-0 active:translate-y-1' : ''}
                                    `}>
                                        <div className="flex items-center justify-center w-full h-full pb-1">
                                            {isPassed && <Star fill="white" className="text-white w-5 h-5 drop-shadow-sm" />}
                                            {!isUnlocked && <Lock size={14} className="text-blue-600/50" />}
                                            {isUnlocked && !isPassed && !isCurrent && <span className="game-font text-blue-900/50">{lvl}</span>}
                                        </div>
                                    </div>
                                    {isCurrent && (
                                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
                                            <div className="filter drop-shadow-xl animate-bounce z-20">
                                                <SantaIcon size={48} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                             );
                         })}

                         {/* 5. CLOUDS COVERING FUTURE */}
                         {cloudCover.map((c, i) => (
                            <div key={`cloud-${i}`} className="absolute pointer-events-none"
                                style={{ left: `${c.x}%`, top: `${c.y}px`, transform: `translate(-50%, -50%) scale(${c.scale})`, zIndex: 20 }}
                            >
                                <Cloud size={64} fill="white" className="text-slate-100 drop-shadow-lg opacity-95" />
                            </div>
                         ))}

                         {/* SANTA'S HOUSE & SLEIGH AT BOTTOM */}
                         <div className="absolute left-1/2 transform -translate-x-1/2 flex items-end justify-center gap-4 pointer-events-none" style={{ top: `${totalHeight - 140}px`, zIndex: 5 }}>
                             <div style={{ transform: 'scale(1.2)' }}>
                                <SantaHouse />
                             </div>
                             <div className="mb-2" style={{ transform: 'scale(0.8)' }}>
                                <IsoSleigh />
                             </div>
                         </div>
                         
                         <div style={{ height: '200px', width: '100%', position: 'absolute', top: `${totalHeight}px` }}></div>
                    </div>
                 </div>

                 <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-white via-white/80 to-transparent z-[101] flex justify-center pb-8 pt-20 pointer-events-none" style={{paddingBottom: 'max(2rem, env(safe-area-inset-bottom))'}}>
                    <button onClick={() => { playSFX('click'); prepareLevel(gameState.level); }}
                        className="pointer-events-auto relative group active:scale-95 transition-transform"
                    >
                        <div className="absolute inset-0 bg-amber-800 rounded-xl transform translate-y-2"></div>
                        <div className="relative bg-gradient-to-b from-amber-400 to-amber-600 border-4 border-amber-800 rounded-xl px-12 py-3 shadow-xl flex items-center gap-4">
                            <div className="absolute -top-3 left-2 right-2 h-4 bg-white rounded-full opacity-90"></div>
                            
                            <div className="bg-amber-800/30 p-2 rounded-lg">
                                <Play fill="white" className="text-white" size={32} />
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-amber-100 text-[10px] font-bold uppercase tracking-wider leading-none mb-1">{t('level')}</span>
                                <span className="game-font text-4xl text-white drop-shadow-md leading-none ui-text-shadow">{gameState.level}</span>
                            </div>
                        </div>
                    </button>
                 </div>
             </div>
          </div>
        );
      }

      if (gameState.screen === 'achievements') {
        const lang = gameState.settings.language;
        return (
          <div onClick={unlockAudio} className="fixed inset-0 bg-slate-900 flex flex-col text-white z-[60]" style={safeAreaStyle}>
            <div className="w-full bg-slate-900 border-b border-slate-800 p-4 pt-8 flex items-center justify-between shadow-xl animate-scale-up">
              <button onClick={() => { playSFX('click'); setGameState(prev => ({ ...prev, screen: 'menu' })); }} className="game-font text-lg flex items-center gap-1 text-yellow-400 ui-text-shadow">
                <ChevronRight className="rotate-180" /> {t('back')}
              </button>
              <div className="flex gap-4 items-center">
                <h1 className="game-font text-xl text-white ui-text-shadow">{t('achievements')}</h1>
                <div className="bg-white text-purple-600 px-3 py-1 rounded-full flex items-center gap-1 font-bold border border-purple-500/50">
                   <Gem size={16} /> {totalCrystals}
                </div>
                <div className="bg-white text-amber-600 px-3 py-1 rounded-full flex items-center gap-1 font-bold border border-yellow-500/50">
                   <CoinIcon size={16} /> {totalCoins}
                </div>
              </div>
              <div className="w-8"></div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 pb-10 animate-scale-up">
              {visibleAchievements.map((ach) => (
                <div key={ach.id} onClick={(e) => e.stopPropagation()} className={`p-5 rounded-3xl border-2 ${ach.unlocked ? (ach.claimed ? 'bg-slate-800/50 border-slate-700 opacity-50' : 'bg-green-500/10 border-green-500') : 'bg-slate-800 border-slate-700'}`}>
                  <div className="flex gap-4 items-center">
                    <div className={`p-3 rounded-2xl ${ach.unlocked && !ach.claimed ? 'bg-green-500 animate-pulse' : (ach.claimed ? 'bg-slate-700' : 'bg-slate-700')} relative`}>
                      {getAchievementIcon(ach.groupId)}
                      <div className="absolute -bottom-2 -right-2 bg-slate-900 text-[10px] px-1 rounded border border-slate-700 font-bold text-white">
                          L{ach.level}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="game-font text-lg leading-tight flex justify-between ui-text-shadow">
                        {lang === 'en' ? ach.titleEn : ach.title}
                        {ach.claimed ? 
                            <span className="text-green-500 text-sm flex items-center gap-1">{t('claimed')}</span>
                            :
                            <span className="text-yellow-400 text-sm flex items-center gap-1"><CoinIcon size={12}/> +{ach.reward}</span>
                        }
                      </h3>
                      <p className="text-slate-400 text-xs mt-1">{lang === 'en' ? ach.descriptionEn : ach.description}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    {ach.unlocked && !ach.claimed ? (
                        <button 
                            onClick={(e) => { e.stopPropagation(); claimAchievement(ach.id); }}
                            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl shadow-[0_4px_0_rgb(21,128,61)] active:translate-y-1 active:shadow-none transition-all flex justify-center items-center gap-2 btn-press"
                        >
                            {t('reward')} <CoinIcon size={16} />
                        </button>
                    ) : (
                        <div>
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full bg-yellow-400 transition-all duration-500`} style={{ width: `${Math.min(100, (ach.current / ach.requirement) * 100)}%` }} />
                            </div>
                            <div className="flex justify-between mt-1 text-[10px] text-slate-500 uppercase font-bold">
                                <span>{t('progress')}</span>
                                <span>{ach.current} / {ach.requirement}</span>
                            </div>
                        </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      if (gameState.screen === 'story') {
        const lang = gameState.settings.language;
        const storyText = typeof gameState.storySegment === 'object' ? (gameState.storySegment as any)[lang] : gameState.storySegment;
        
        return (
          <div onClick={unlockAudio} className="fixed inset-0 bg-blue-100 flex items-center justify-center p-6 text-center z-[50]">
            <div className="story-card max-w-xs w-full p-8 rounded-[2rem] border-4 border-blue-300 shadow-2xl animate-in fade-in duration-300 relative bg-white">
               <div className="absolute -top-6 -left-6 rotate-[-15deg]"><SantaIcon size={64} /></div>
               <div className="absolute -bottom-4 -right-4 rotate-[15deg]"><GiftIcon size={50} /></div>
               
              {/* UPDATED: Added 'font-montserrat' here */}
              <h2 className="font-montserrat font-bold text-xl text-blue-600 mb-4 mt-4 ui-text-shadow">{t('level')} {gameState.level}</h2>
              <div className="mb-2">
                 {gameState.levelType === 'score' ? 
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded-lg border border-yellow-200">{t('score_mode')}</span>
                    :
                    <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-lg border border-green-200">{t('collect_mode')}</span>
                 }
              </div>
              <p className="text-slate-700 italic font-semibold leading-relaxed mb-8 bg-blue-50 p-4 rounded-xl border border-blue-100">
                "{storyText}"
              </p>
              
              <div className="mb-6">
                <p className="text-xs font-bold text-slate-400 uppercase mb-2">{t('collect_goal')}</p>
                {gameState.levelType === 'score' ? (
                     <div className="flex flex-col items-center justify-center bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                         {/* UPDATED: Added 'font-montserrat' here as well for score targets if needed, keeping Titan One for big numbers */}
                         <div className="text-4xl font-black text-yellow-500 flex items-center gap-2">
                             <Star fill="currentColor" /> {gameState.targetScore}
                         </div>
                     </div>
                ) : (
                    <div className="flex flex-wrap justify-center gap-3">
                       {gameState.targetFruits.map((tf, i) => (
                           <div key={i} className="flex flex-col items-center bg-slate-50 p-2 rounded-xl min-w-[60px]">
                               <span className="text-2xl">{EMOJI_MAP[tf.color]}</span>
                               <span className="text-sm font-black text-slate-600">{tf.target}</span>
                           </div>
                       ))}
                    </div>
                )}
              </div>
              <button onClick={() => { playSFX('click'); setGameState(prev => ({ ...prev, screen: 'game' })); }} className="bg-blue-500 w-full py-4 rounded-2xl game-font text-xl text-white active:scale-95 transition shadow-lg btn-press ui-text-shadow">
                {t('go')}
              </button>
            </div>
          </div>
        );
      }

      // Game Screen Background Updated
      return (
        <div onClick={unlockAudio} className={`fixed inset-0 bg-white flex flex-col items-center p-4 overflow-hidden select-none z-10 touch-none`} style={{paddingTop: 'max(1rem, env(safe-area-inset-top))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'}}>
          {/* Audio Element Hidden */}
          <audio 
            ref={audioRef} 
            onEnded={playNextTrack} 
            onError={playNextTrack}
            autoPlay={false} // Handled manually
          />

          {/* COMPACT HEADER DESIGN */}
          <div className="w-full max-w-md bg-white/90 rounded-[1.5rem] p-3 shadow-lg mb-2 border-2 border-white relative z-10 flex flex-col gap-1">
             {/* Header Top Row: Score or Targets */}
             {gameState.levelType === 'score' ? (
                 <div className="flex items-center gap-3 w-full">
                     <div className="bg-yellow-400 p-2 rounded-xl text-white shadow-sm shrink-0">
                         <Star size={20} fill="white" />
                     </div>
                     <div className="flex-1">
                         <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-0.5">
                             {/* UPDATED: Applied font-montserrat */}
                             <span className="font-montserrat">{t('score')}</span>
                             <span>{gameState.score} / {gameState.targetScore}</span>
                         </div>
                         <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                             <div className="h-full bg-yellow-400 transition-all duration-500" style={{ width: `${Math.min(100, (gameState.score / gameState.targetScore) * 100)}%` }} />
                         </div>
                     </div>
                 </div>
             ) : (
                 // Compact Collect Mode - NO SCORE BAR
                 <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                        {gameState.targetFruits.map((tf, i) => (
                            <div key={i} className={`flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-50 shadow-sm border border-slate-100 ${tf.current >= tf.target ? 'opacity-40 grayscale' : ''}`}>
                            <span className="text-xl leading-none">{EMOJI_MAP[tf.color] || '❓'}</span>
                            <span className="text-xs font-black text-slate-700">{Math.min(tf.current, tf.target)}/{tf.target}</span>
                            </div>
                        ))}
                      </div>
                      
                      {/* Integrated Moves/Menu for Collect Mode to save vertical space */}
                      <div className="flex items-center gap-1.5 ml-2">
                            <div className="bg-purple-600 px-3 py-1.5 rounded-xl shadow-inner flex items-center gap-1 text-white">
                                <span className="game-font text-lg leading-none">{gameState.moves}</span>
                            </div>
                            <button onClick={() => { playSFX('click'); setShowInventoryModal(true); }} className="bg-green-500 w-8 h-8 rounded-lg text-white shadow-md active:scale-95 flex items-center justify-center btn-press">
                                <Plus size={18} />
                            </button>
                            <button onClick={() => { playSFX('click'); goToMap(); }} className="bg-slate-200 w-8 h-8 rounded-lg text-slate-500 shadow-md active:scale-95 flex items-center justify-center btn-press">
                                <Home size={16} />
                            </button>
                      </div>
                 </div>
             )}

             {/* Header Bottom Row: Only show separate controls if Score mode (since Collect mode has them integrated above) */}
             {gameState.levelType === 'score' && (
                 <div className="flex items-center justify-between mt-1">
                     <div className="flex items-center gap-2">
                         <div className="bg-purple-600 px-3 py-1.5 rounded-xl shadow-inner flex items-center gap-2 text-white">
                             {/* UPDATED: Applied font-montserrat */}
                             <span className="text-[10px] font-bold opacity-70 font-montserrat">{t('moves')}</span>
                             <span className="game-font text-xl leading-none">{gameState.moves}</span>
                         </div>
                     </div>
                     
                     <div className="flex items-center gap-2">
                        <button onClick={() => { playSFX('click'); setShowInventoryModal(true); }} className="bg-green-500 w-9 h-9 rounded-xl text-white shadow-md active:scale-95 flex items-center justify-center btn-press">
                            <Plus size={20} />
                        </button>
                        <button onClick={() => { playSFX('click'); goToMap(); }} className="bg-slate-200 w-9 h-9 rounded-xl text-slate-500 shadow-md active:scale-95 flex items-center justify-center btn-press">
                            <Home size={18} />
                        </button>
                     </div>
                 </div>
             )}
          </div>

          {/* AI Commentary Bar */}
          <div className="w-full max-w-md flex items-center gap-2 mb-2 px-1 z-10">
             <div className="w-10 h-10 bg-white rounded-xl border-2 border-blue-200 flex items-center justify-center shadow-md">
                 <SantaIcon size={28} />
             </div>
             <div className="flex-1 bg-white/80 p-2 rounded-xl rounded-tl-none shadow-md border border-white">
               {isShuffling ? 
                 <p className="text-slate-800 font-bold italic text-[10px] leading-tight animate-pulse text-red-500">{t('no_moves')}</p> 
                 : 
                 <p className="text-slate-800 font-bold italic text-[10px] leading-tight line-clamp-2">
                    {aiCommentary || (typeof gameState.objective === 'object' ? (gameState.objective as any)[gameState.settings.language] : gameState.objective)}
                 </p>
               }
             </div>
          </div>

          {/* Targeting Banner */}
          {targetingMode === 'bomb' && (
              <div className="absolute top-20 z-[60] bg-red-500 text-white px-6 py-2 rounded-full font-bold shadow-lg animate-pulse border-2 border-white flex items-center gap-2">
                  <Bomb size={20} />
                  <span>{t('ok')}? Select Target!</span>
                  <button onClick={() => setTargetingMode(null)} className="ml-2 bg-white/20 rounded-full p-1 hover:bg-white/40">X</button>
              </div>
          )}

          {/* Game Board */}
          <div className="relative bg-white/30 backdrop-blur-sm p-1.5 rounded-[1.5rem] shadow-xl border-4 border-white/60 z-10">
            <div className={`grid gap-0.5 touch-none transition-transform duration-500 ${isShuffling ? 'rotate-[360deg] scale-90' : ''}`} style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, width: 'min(85vw, 380px)', height: 'min(85vw, 380px)' }}>
              {gameState.board.map((candy, index) => {
                const isSwapHint = hintData?.swap.includes(index);
                const isMatchHint = hintData?.match.includes(index);

                return (
                <div key={candy?.id || `e-${index}`} 
                  onMouseDown={(e) => handleTouchStart(e, index)}
                  onMouseUp={handleTouchEnd}
                  onTouchStart={(e) => handleTouchStart(e, index)}
                  onTouchEnd={handleTouchEnd}
                  className={`relative flex items-center justify-center rounded-lg fruit-cell animate-spawn
                    ${candy ? COLOR_MAP[candy.color] : 'bg-white/10'} 
                    ${vortexColor && candy?.color === vortexColor ? 'vortex-animation' : ''}
                    ${isSwapHint ? 'animate-hint ring-4 ring-yellow-400 z-30' : ''}
                    ${targetingMode === 'bomb' ? 'cursor-crosshair hover:ring-4 hover:ring-red-500' : ''}
                    ${isMatchHint ? 'ring-4 ring-green-400 z-20 opacity-80 animate-pulse' : ''}
                  `}>
                  <span style={{ '--delay': `${(index % 3) * 0.5}s` } as React.CSSProperties}
                    className={`text-xl sm:text-3xl drop-shadow-md transition-transform duration-200 pointer-events-none ${candy ? 'scale-100' : 'scale-0'}`}>
                    {candy ? EMOJI_MAP[candy.color] : ''}
                  </span>
                </div>
              )})}

              {/* Bomb Animation Overlay */}
              {bombAnim && (
                  <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden rounded-[1rem]">
                      <div 
                          className="absolute transition-all duration-500 ease-in"
                          style={{
                              width: `${100/GRID_SIZE}%`,
                              height: `${100/GRID_SIZE}%`,
                              left: `${(bombAnim.index % GRID_SIZE) * (100/GRID_SIZE)}%`,
                              top: bombAnim.falling ? '-20%' : `${Math.floor(bombAnim.index / GRID_SIZE) * (100/GRID_SIZE)}%`
                          }}
                      >
                          <ShopItemImage id="bomb" size={40} />
                      </div>
                  </div>
              )}
            </div>

            {!gameState.tutorialSeen && (
                <div className="absolute inset-0 z-[150] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-white rounded-[2rem] p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in border-4 border-blue-200 relative">
                         <button onClick={() => { playSFX('click'); setGameState(prev => ({ ...prev, tutorialSeen: true })); }}
                             className="absolute top-4 right-4 text-slate-400 font-bold text-xs uppercase tracking-wider hover:text-blue-500 transition-colors">
                             {t('tutorial_skip')}
                         </button>
                         {tutorialStep === 0 && (
                             <div className="text-center flex flex-col items-center">
                                 <div className="mb-4"><SantaIcon size={64} /></div>
                                 <h3 className="game-font text-2xl text-blue-600 mb-2 ui-text-shadow">{t('tutorial_1_title')}</h3>
                                 <p className="text-slate-600 mb-6 font-bold">{t('tutorial_1_desc')}</p>
                                 <button onClick={() => { playSFX('click'); setTutorialStep(1); }} className="bg-green-500 text-white py-3 px-8 rounded-xl font-bold text-xl shadow-[0_4px_0_rgb(21,128,61)] active:translate-y-1 active:shadow-none btn-press">{t('ok')}</button>
                             </div>
                         )}
                         {tutorialStep === 1 && (
                             <div className="text-center">
                                 <div className="flex justify-center gap-2 mb-4 text-3xl">👆➡️</div>
                                 <h3 className="game-font text-2xl text-blue-600 mb-2 ui-text-shadow">{t('tutorial_2_title')}</h3>
                                 <p className="text-slate-600 mb-6 font-bold">{t('tutorial_2_desc')}</p>
                                 <button onClick={() => { playSFX('click'); setTutorialStep(2); }} className="bg-blue-500 text-white py-3 px-8 rounded-xl font-bold text-xl shadow-[0_4px_0_rgb(29,78,216)] active:translate-y-1 active:shadow-none btn-press">{t('got_it')}</button>
                             </div>
                         )}
                         {tutorialStep === 2 && (
                             <div className="text-center">
                                 <div className="text-6xl mb-4">🫙✨</div>
                                 <h3 className="game-font text-2xl text-purple-600 mb-2 ui-text-shadow">{t('tutorial_3_title')}</h3>
                                 <p className="text-slate-600 mb-6 font-bold">{t('tutorial_3_desc')}</p>
                                 <button onClick={() => { playSFX('click'); setGameState(prev => ({ ...prev, tutorialSeen: true })); }} className="bg-purple-500 text-white py-3 px-8 rounded-xl font-bold text-xl shadow-[0_4px_0_rgb(147,51,234)] active:translate-y-1 active:shadow-none btn-press">{t('lets_go')}</button>
                             </div>
                         )}
                         <div className="flex justify-center gap-2 mt-6">
                             {[0, 1, 2].map(step => ( <div key={step} className={`w-3 h-3 rounded-full ${tutorialStep === step ? 'bg-slate-800' : 'bg-slate-300'}`} /> ))}
                         </div>
                    </div>
                </div>
            )}

            {showInventoryModal && (
                 <div className="absolute inset-0 z-[110] bg-black/60 backdrop-blur-sm rounded-[2rem] flex flex-col items-center justify-center p-4 animate-in fade-in">
                     <div className="bg-white w-full rounded-2xl p-4 shadow-2xl max-h-[80vh] overflow-y-auto custom-scrollbar touch-pan-y">
                         <div className="flex justify-between items-center mb-4">
                             <h3 className="game-font text-slate-800 text-lg ui-text-shadow">{t('your_items')}</h3>
                             <button onClick={() => setShowInventoryModal(false)} className="text-slate-400 font-bold">X</button>
                         </div>
                         <div className="space-y-2">
                             {SHOP_ITEMS.map(item => {
                                 const lang = gameState.settings.language;
                                 return (
                                 <button key={item.id} disabled={gameState.inventory[item.id as keyof Inventory] === 0}
                                    onClick={() => useInventoryItem(item.id as keyof Inventory, item)}
                                    className={`w-full p-3 rounded-xl flex items-center justify-between border-2 
                                        ${gameState.inventory[item.id as keyof Inventory] > 0 ? 'bg-green-50 border-green-200 text-green-800 active:scale-95' : 'bg-slate-50 border-slate-100 text-slate-400 opacity-50'}`}>
                                     <span className="flex items-center gap-2 text-xl">
                                         <ShopItemImage id={item.id} /> 
                                         <span className="text-sm font-bold">{lang === 'en' ? item.title : (item as any).titleRu}</span>
                                     </span>
                                     <div className="flex items-center gap-2">
                                        <span className="bg-white px-2 py-1 rounded-lg text-xs font-bold border">x{gameState.inventory[item.id as keyof Inventory]}</span>
                                        {item.id === 'bomb' && gameState.inventory[item.id as keyof Inventory] > 0 && (
                                            <button onClick={(e) => { e.stopPropagation(); useInventoryItem('bomb', item); }} 
                                                className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-sm active:scale-95">
                                                USE
                                            </button>
                                        )}
                                     </div>
                                 </button>
                             )})}
                         </div>
                         {Object.values(gameState.inventory).every(v => v === 0) && <p className="text-center text-xs text-slate-400 mt-4">{t('empty')}</p>}
                     </div>
                 </div>
            )}

            {/* WIN/LOSE MODAL - Show even if processing is true, provided game over condition is met and delay passed */}
            {(gameState.moves <= 0 || isLevelComplete) && (
              <div className="absolute inset-0 z-[100] bg-white/95 backdrop-blur-md rounded-[2rem] flex flex-col items-center justify-center p-6 animate-in zoom-in">
                <div className={`p-6 rounded-full mb-4 shadow-xl ${isLevelComplete ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                   {isLevelComplete ? <Trophy size={48} /> : <RefreshCw size={48} />}
                </div>
                <h2 className="game-font text-4xl text-slate-900 ui-text-shadow">{isLevelComplete ? t('win') : t('lose')}</h2>
                <div className="flex flex-col items-center mb-6">
                    <p className="text-slate-500 font-bold">{isLevelComplete ? t('win_desc') : t('lose_desc')}</p>
                    {isLevelComplete && <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full mt-2 font-bold flex items-center gap-2 border border-yellow-300"><CoinIcon size={18} /> +{gameState.lastLevelReward}</div>}
                </div>
                
                <div className="flex gap-3 w-full max-w-xs">
                  <button onClick={() => {
                    playSFX('click');
                    playNextTrack(); 
                    if (isLevelComplete) {
                        setGameState(prev => ({ ...prev, level: prev.level + 1, screen: 'map' }));
                    } else {
                        prepareLevel(gameState.level);
                    }
                  }} className="flex-1 bg-orange-500 py-4 rounded-2xl game-font text-xl text-white shadow-lg w-full btn-press ui-text-shadow">
                    {isLevelComplete ? t('next') : t('retry')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Compact Jars Row */}
          <div className="mt-2 w-full max-w-md flex justify-between gap-1 px-1 z-10 h-16">
            {CANDY_COLORS.map(color => (
              <div key={color} onClick={() => useJar(color)} className={`relative flex-1 h-full active:scale-105 transition-transform ${(isLevelComplete || gameState.moves <= 0) ? 'pointer-events-none opacity-50' : ''}`}>
                 <JarIcon 
                    color={color} 
                    fillPercent={(gameState.jars[color] / JAR_MAX) * 100} 
                    isFull={gameState.jars[color] >= JAR_MAX} 
                 />
              </div>
            ))}
          </div>

          <div className="mt-auto py-2 opacity-50 flex items-center gap-2 z-10">
          </div>
        </div>
      );
  };

  return renderScreen();
};

export default App;
