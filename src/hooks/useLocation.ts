import { useState, useEffect, useCallback } from 'react';
import { getCurrentPosition, getNearbyRestaurants } from '../services/mapService';
import type { Restaurant } from '../services/mapService';

interface UseLocationResult {
  position: { latitude: number; longitude: number } | null;
  restaurants: Restaurant[];
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function useLocation(): UseLocationResult {
  const [position, setPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocationAndRestaurants = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const pos = await getCurrentPosition();
      setPosition(pos);

      // 存储用户位置，供 ResultCard 计算步行时间使用
      sessionStorage.setItem('userPosition', JSON.stringify(pos));

      const nearbyRestaurants = await getNearbyRestaurants(pos.latitude, pos.longitude, 1000);
      setRestaurants(nearbyRestaurants);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取餐厅列表失败';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocationAndRestaurants();
  }, [fetchLocationAndRestaurants]);

  return {
    position,
    restaurants,
    loading,
    error,
    retry: fetchLocationAndRestaurants,
  };
}
