import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Header } from './components/Header';
import { LocationStatus } from './components/LocationStatus';
import { Randomizer } from './components/Randomizer';
import { ResultCard } from './components/ResultCard';
import { useLocation } from './hooks/useLocation';
import type { Restaurant } from './services/mapService';

// 精美的猫爪 SVG 组件
const PawPrint = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="currentColor">
    {/* 主掌垫 */}
    <ellipse cx="50" cy="62" rx="26" ry="23" />
    {/* 上方四个小肉垫 */}
    <ellipse cx="22" cy="32" rx="11" ry="10" />
    <ellipse cx="40" cy="18" rx="10" ry="11" />
    <ellipse cx="60" cy="18" rx="10" ry="11" />
    <ellipse cx="78" cy="32" rx="11" ry="10" />
  </svg>
);

// 浮动猫爪装饰
const FloatingPaw = ({ className, delay = 0 }: { className?: string; delay?: number }) => (
  <motion.div
    className={`absolute text-warm-orange cat-paw ${className}`}
    style={{ opacity: 0.12 }}
    animate={{
      y: [0, -15, 0],
      rotate: [0, 8, 0],
    }}
    transition={{
      duration: 5,
      delay,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  >
    <PawPrint className="w-20 h-20 md:w-28 md:h-28" />
  </motion.div>
);

function App() {
  const { position, restaurants, loading, error, retry } = useLocation();
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const handleSpin = useCallback(() => {
    if (restaurants.length === 0) return;

    setIsSpinning(true);
    setSelectedRestaurant(null);

    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * restaurants.length);
      setSelectedRestaurant(restaurants[randomIndex]);
      setIsSpinning(false);
    }, 1500);
  }, [restaurants]);

  const handleRetry = useCallback(() => {
    setSelectedRestaurant(null);
    handleSpin();
  }, [handleSpin]);

  return (
    <div className="min-h-screen bg-warm-gradient flex flex-col relative overflow-hidden">
      {/* 浮动猫爪装饰 */}
      <FloatingPaw className="top-16 left-4" delay={0} />
      <FloatingPaw className="top-32 right-8" delay={1} />
      <FloatingPaw className="bottom-40 left-12" delay={2} />
      <FloatingPaw className="bottom-20 right-16" delay={0.5} />
      <FloatingPaw className="top-1/2 left-2" delay={1.5} />
      <FloatingPaw className="top-48 right-4" delay={2.5} />

      <Header />

      <LocationStatus
        status={loading ? 'loading' : error ? 'error' : position ? 'success' : 'idle'}
        message={error ? `获取餐厅失败: ${error}` : (position ? `已定位，共 ${restaurants.length} 家餐厅` : undefined)}
        onRetry={retry}
      />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative z-10">
        <AnimatePresence mode="wait">
          {isSpinning ? (
            <motion.div
              key="spinning"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center gap-4"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <PawPrint className="w-20 h-20 text-warm-orange cat-paw" />
              </motion.div>
              <p className="text-2xl font-bold text-warm-orange">正在抽取中...</p>
            </motion.div>
          ) : selectedRestaurant ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              <ResultCard restaurant={selectedRestaurant} onRetry={handleRetry} />
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Randomizer
                onSpin={handleSpin}
                isSpinning={isSpinning}
                disabled={loading || restaurants.length === 0}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-4 text-center text-sm text-warm-orange/60">
        <p>今天吃什么？让猫爪帮你决定！</p>
      </footer>
    </div>
  );
}

export default App;
