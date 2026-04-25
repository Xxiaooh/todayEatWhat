import { motion } from 'framer-motion';

interface RandomizerProps {
  onSpin: () => void;
  isSpinning: boolean;
  disabled?: boolean;
}

export function Randomizer({ onSpin, isSpinning, disabled }: RandomizerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <motion.button
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        onClick={onSpin}
        disabled={disabled || isSpinning}
        className={`
          px-14 py-5 rounded-full text-xl font-bold
          transition-all duration-200 shadow-lg
          ${disabled || isSpinning
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
            : 'btn-warm text-white hover:shadow-xl'
          }
        `}
      >
        {isSpinning ? '抽取中...' : '开始抽取'}
      </motion.button>
      {!disabled && !isSpinning && (
        <p className="text-warm-orange/60 text-sm mt-4">
          点击按钮，让猫爪帮你选餐厅
        </p>
      )}
    </div>
  );
}
