export interface Restaurant {
  name: string;
  distance: string;
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
    throw error; // 抛出错误，让上层处理
  }
}
