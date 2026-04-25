export interface Restaurant {
  name: string;
  distance: string;
  walkingTime?: string;
  walkingDistance?: number;
  category: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

// 高德地图 Web 服务 API Key
// 申请地址: https://lbs.amap.com/
const AMAP_API_KEY = 'd010cc05039399e228e6e15d18ea45b9';

// 高德地图 Web 服务 API 基础 URL
const AMAP_API_BASE = 'https://restapi.amap.com/v3/place';

// 高德地图路径规划 API 基础 URL
const AMAP_DIRECTION_BASE = 'https://restapi.amap.com/v3/direction';

// 计算步行时间和实际导航距离
// 高德 around API 返回的 distance 是直线距离，需要转换
export async function calculateWalkingTime(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  straightDistance?: number // 如果有高德返回的直线距离，传入以提高准确性
): Promise<{ time: number; distance: number } | null> {
  try {
    // 优先尝试高德步行路径规划 API
    const url = new URL(`${AMAP_DIRECTION_BASE}/walking`);
    url.searchParams.set('key', AMAP_API_KEY);
    url.searchParams.set('origin', `${originLng},${originLat}`);
    url.searchParams.set('destination', `${destLng},${destLng}`);

    const response = await fetch(url.toString());
    if (!response.ok) {
      console.error('步行路径 API 请求失败:', response.status);
      return calculateFromStraightDistance(originLat, originLng, destLat, destLng, straightDistance);
    }

    const data = await response.json();
    console.log('步行路径 API 返回:', data);

    if (data.status !== '1' || !data.route?.paths?.[0]) {
      console.error('步行路径 API 返回错误:', data.info);
      return calculateFromStraightDistance(originLat, originLng, destLat, destLng, straightDistance);
    }

    const path = data.route.paths[0];
    const apiDistance = parseInt(path.distance) || 0;
    const apiTime = parseInt(path.time) || 0;

    // 如果 API 返回数据有效，使用它
    if (apiDistance > 0 && apiTime > 0) {
      // 验证 API 返回的距离是否合理（与直线距离对比）
      const straight = straightDistance || calculateHaversineDistance(originLat, originLng, destLat, destLng);
      const ratio = apiDistance / straight;

      // 如果 API 返回的距离明显不合理（小于直线距离），使用备用计算
      if (ratio < 0.8) {
        console.log('API 返回距离异常，使用备用计算');
        return calculateFromStraightDistance(originLat, originLng, destLat, destLng, straightDistance);
      }

      console.log(`使用 API 数据: 距离=${apiDistance}m, 时间=${apiTime}秒, 比率=${ratio.toFixed(2)}`);
      return { time: apiTime, distance: apiDistance };
    }

    return calculateFromStraightDistance(originLat, originLng, destLat, destLng, straightDistance);
  } catch (error) {
    console.error('计算步行时间失败:', error);
    return calculateFromStraightDistance(originLat, originLng, destLat, destLng, straightDistance);
  }
}

// 根据直线距离计算实际步行距离和时间（备用方案）
function calculateFromStraightDistance(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  straightDistance?: number
): { time: number; distance: number } {
  let straight: number;

  if (straightDistance && straightDistance > 0) {
    // 使用高德返回的直线距离（更准确）
    straight = straightDistance;
    console.log(`使用高德直线距离: ${straight}m`);
  } else {
    // 使用 Haversine 公式计算
    straight = calculateHaversineDistance(originLat, originLng, destLat, destLng);
    console.log(`使用 Haversine 计算直线距离: ${straight}m`);
  }

  // 路径系数：直线距离转实际导航距离
  // 根据用户反馈，实测 133m 直线距离对应 720m 导航距离，比例约 5.4
  // 但这个系数因地形而异，短距离系数更大，长距离系数趋近 1.3-1.5
  const pathCoefficient = calculatePathCoefficient(straight);
  const actualDistance = Math.round(straight * pathCoefficient);

  // 步行速度：考虑红绿灯、等待、过街等因素
  // 匀速步行约 5km/h，但实际导航会慢一些
  const walkingSpeedKmh = 4.5; // km/h
  const timeSeconds = Math.round((actualDistance / 1000 / walkingSpeedKmh) * 3600);

  console.log(`计算结果: 直线=${straight}m, 系数=${pathCoefficient.toFixed(2)}, 实际=${actualDistance}m, 时间=${Math.round(timeSeconds / 60)}分钟`);
  return { distance: actualDistance, time: timeSeconds };
}

// 根据直线距离估算路径系数
// 直线距离越短，路径系数越大（因为起点终点都在附近，路不能直接穿过去）
// 直线距离越长，路径系数越小（接近 1.3-1.5 的理论值）
function calculatePathCoefficient(straightDistance: number): number {
  if (straightDistance < 100) return 6.0;   // 100米以内：系数约 6
  if (straightDistance < 200) return 5.5;   // 100-200米：系数约 5.5
  if (straightDistance < 300) return 5.0;   // 200-300米：系数约 5
  if (straightDistance < 500) return 4.0;   // 300-500米：系数约 4
  if (straightDistance < 800) return 3.5;   // 500-800米：系数约 3.5
  if (straightDistance < 1000) return 3.0;  // 800-1000米：系数约 3
  if (straightDistance < 1500) return 2.5;   // 1-1.5km：系数约 2.5
  if (straightDistance < 2000) return 2.0;   // 1.5-2km：系数约 2
  return 1.6;                                 // 2km以上：系数约 1.6
}

// Haversine 公式计算两点间的直线距离（米）
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// 格式化步行时间为中文描述
export function formatWalkingTime(seconds: number): string {
  if (seconds < 60) {
    return '1分钟以内';
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes}分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}小时`;
  }
  return `${hours}小时${remainingMinutes}分钟`;
}

// 从类型字符串中提取主要类别
function extractCategory(type: string): string {
  if (!type) return '餐厅';
  const types = type.split(';');
  const foodTypes = ['餐饮', '中餐', '西餐', '快餐', '火锅', '烧烤', '面馆', '小吃', '日料', '韩料', '咖啡', '茶', '烘焙', '奶茶', '烧烤'];
  for (const t of types) {
    for (const ft of foodTypes) {
      if (t.includes(ft)) return ft;
    }
  }
  return types[0]?.split(',')[0] || '餐厅';
}

// 获取当前位置（使用浏览器 Geolocation API）
export function getCurrentPosition(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持定位功能'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('定位权限被拒绝，请在浏览器设置中允许使用位置'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('无法获取位置信息'));
            break;
          case error.TIMEOUT:
            reject(new Error('定位请求超时'));
            break;
          default:
            reject(new Error('定位失败'));
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

// 从高德地图 Web API 获取周边餐厅（支持分页获取所有结果）
async function fetchFromAMap(
  latitude: number,
  longitude: number,
  radius: number
): Promise<Restaurant[]> {
  const allRestaurants: Restaurant[] = [];
  let currentPage = 1;
  const pageSize = 100; // 高德API每次最多返回100条
  let hasMoreData = true;

  while (hasMoreData) {
    const url = new URL(`${AMAP_API_BASE}/around`);
    url.searchParams.set('key', AMAP_API_KEY);
    url.searchParams.set('location', `${longitude},${latitude}`);
    url.searchParams.set('types', '050000'); // 餐饮服务
    url.searchParams.set('radius', radius.toString());
    url.searchParams.set('offset', pageSize.toString());
    url.searchParams.set('page', currentPage.toString());
    url.searchParams.set('extensions', 'all');
    url.searchParams.set('output', 'json');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`);
    }

    const data = await response.json();

    // 调试：打印原始返回数据
    console.log(`高德API第${currentPage}页返回:`, data);

    if (data.status !== '1') {
      throw new Error(data.info || '高德API返回错误');
    }

    const pois = data.pois || [];
    const totalCount = parseInt(data.count) || 0;

    if (pois.length === 0) {
      hasMoreData = false;
    } else {
      const mapped = pois.map((poi: {
        name: string;
        address: string;
        distance: string;
        type: string;
        location: string;
      }) => ({
        name: poi.name,
        address: poi.address || '',
        distance: poi.distance ? `${poi.distance}m` : '',
        category: extractCategory(poi.type),
        latitude: poi.location ? parseFloat(poi.location.split(',')[1]) : undefined,
        longitude: poi.location ? parseFloat(poi.location.split(',')[0]) : undefined,
      }));
      allRestaurants.push(...mapped);

      // 检查是否还有更多数据
      if (allRestaurants.length >= totalCount || pois.length < pageSize) {
        hasMoreData = false;
      } else {
        currentPage++;
      }
    }
  }

  if (allRestaurants.length === 0) {
    throw new Error('周边没有找到餐厅');
  }

  console.log(`总共获取 ${allRestaurants.length} 家餐厅`);
  return allRestaurants;
}

// 获取周边餐厅列表
export async function getNearbyRestaurants(
  latitude: number,
  longitude: number,
  radius: number = 3000
): Promise<Restaurant[]> {
  try {
    const restaurants = await fetchFromAMap(latitude, longitude, radius);
    console.log(`成功获取 ${restaurants.length} 家餐厅`);
    return restaurants;
  } catch (error) {
    console.error('获取餐厅失败:', error);
    throw error;
  }
}
