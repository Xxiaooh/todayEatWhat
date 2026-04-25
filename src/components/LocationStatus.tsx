interface LocationStatusProps {
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
  onRetry?: () => void;
}

export function LocationStatus({ status, message, onRetry }: LocationStatusProps) {
  return (
    <div className="w-full py-3 px-4 text-center relative z-10">
      {status === 'idle' && (
        <p className="text-warm-orange/60 text-sm">🐱 等待获取位置中...</p>
      )}
      {status === 'loading' && (
        <p className="text-warm-orange text-sm animate-pulse">📍 正在获取你的位置...</p>
      )}
      {status === 'success' && (
        <p className="text-soft-red text-sm font-medium">{message || '定位成功'}</p>
      )}
      {status === 'error' && (
        <div className="space-y-2">
          <p className="text-coral text-sm">❌ {message || '获取失败'}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-warm-orange text-sm underline hover:text-coral transition-colors"
            >
              点击重试
            </button>
          )}
        </div>
      )}
    </div>
  );
}
