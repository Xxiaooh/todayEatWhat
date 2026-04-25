import { motion } from 'framer-motion';

interface Restaurant {
  name: string;
  distance: string;
  category: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

interface ResultCardProps {
  restaurant: Restaurant | null;
  onRetry: () => void;
}

// 跳转到导航
function navigateToRestaurant(restaurant: Restaurant) {
  if (!restaurant.latitude || !restaurant.longitude) {
    alert('该餐厅暂无位置信息');
    return;
  }

  const { latitude, longitude, name } = restaurant;
  const encodedName = encodeURIComponent(name);

  // 检测设备类型
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile) {
    // 尝试使用高德地图 App
    const amapUrl = `amapuri://route/plan/?dlat=${latitude}&dlon=${longitude}&dname=${encodedName}&dev=0&t=1`;
    const googleUrl = `google.navigation:q=${latitude},${longitude}`;
    const appleUrl = `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`;

    // 尝试高德地图
    window.location.href = amapUrl;

    // 如果1秒后没跳转，尝试 Apple Maps (iOS)
    setTimeout(() => {
      window.location.href = appleUrl;
    }, 1000);

    // 如果2秒后还没跳转，尝试 Google Maps
    setTimeout(() => {
      window.location.href = googleUrl;
    }, 2000);
  } else {
    // 桌面端：打开高德地图网页版导航
    const amapWebUrl = `https://uri.amap.com/navigation?to=${longitude},${latitude},${encodedName}&mode=car&callnative=1`;
    window.open(amapWebUrl, '_blank');
  }
}

// 复制地址到剪贴板
function copyAddress(address: string) {
  navigator.clipboard.writeText(address).then(() => {
    alert('地址已复制到剪贴板');
  }).catch(() => {
    alert('复制失败');
  });
}

export function ResultCard({ restaurant, onRetry }: ResultCardProps) {
  if (!restaurant) return null;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 12 }}
      className="w-full max-w-md mx-auto p-4"
    >
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-warm p-8 border border-sweet-yellow/50">
        {/* 标题 */}
        <div className="text-center mb-6">
          <p className="text-coral text-sm mb-1">猫爪推荐给你</p>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {restaurant.name}
          </h2>
        </div>

        {/* 信息标签 */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {restaurant.distance && (
            <span className="px-4 py-2 bg-gradient-to-r from-warm-orange to-soft-orange text-white rounded-full text-sm font-medium">
              {restaurant.distance}
            </span>
          )}
          <span className="px-4 py-2 bg-gradient-to-r from-sweet-yellow to-muted-yellow text-warm-orange rounded-full text-sm font-medium">
            {restaurant.category}
          </span>
        </div>

        {/* 地址 */}
        {restaurant.address && (
          <div className="mb-6">
            <p className="text-gray-500 text-sm text-center mb-2">
              {restaurant.address}
            </p>
            <button
              onClick={() => copyAddress(restaurant.address!)}
              className="w-full text-sm text-warm-orange/70 hover:text-warm-orange transition-colors"
            >
              点击复制地址
            </button>
          </div>
        )}

        {/* 一键导航按钮 */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => navigateToRestaurant(restaurant)}
          disabled={!restaurant.latitude || !restaurant.longitude}
          className={`
            w-full py-3 px-6 mb-3 rounded-full font-semibold transition-all
            flex items-center justify-center gap-2
            ${restaurant.latitude && restaurant.longitude
              ? 'bg-gradient-to-r from-warm-orange to-soft-orange text-white hover:shadow-lg'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          一键导航
        </motion.button>

        {/* 重新抽取按钮 */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
          onClick={onRetry}
          className="w-full py-3 px-6 bg-gradient-to-r from-sweet-yellow to-muted-yellow text-warm-orange rounded-full font-semibold hover:shadow-md transition-shadow"
        >
          不满意？再抽一次
        </motion.button>
      </div>
    </motion.div>
  );
}
