# 技术设计

## 技术栈
- React + TypeScript + Vite（前端核心框架，轻量且打包速度快）
- Tailwind CSS（原子化 CSS，方便快速实现极简风格和移动端适配）
- Framer Motion（用于实现流畅的“抽取”动画，例如老虎机滚动或卡片翻转效果）
- 第三方地图 API（如高德地图 Web JS API 或腾讯位置服务，用于精准获取定位及周边 500 米餐饮 POI 数据）

## 项目结构
src/
  components/
    Header.tsx (顶部标题，极简展示)
    LocationStatus.tsx (提示当前定位状态及精度)
    Randomizer.tsx (核心组件：包含抽取按钮及动画逻辑)
    ResultCard.tsx (展示抽中的餐厅名称、距离、标签及导航外链)
  services/
    mapService.ts (封装地图 API 请求：获取当前经纬度、拉取周边餐饮列表)
  hooks/
    useLocation.ts (自定义 Hook，处理浏览器 Geolocation API 的权限和状态)
  App.tsx
  main.tsx

## 数据管理
- 应用核心状态（如：用户当前坐标、获取到的周边餐厅数组、最终抽中的餐厅对象）使用 React 的 `useState` 和 `useEffect` 进行管理。
- 由于是“打开即用”的工具属性，餐厅数据直接通过外部地图 API 实时拉取，不进行复杂的本地数据库存储或全局状态管理（无需 Redux/Zustand），保证轻量化。
- 可以利用 `localStorage` 简单缓存用户的部分偏好（例如：是否开启过音效、上次拒绝访问位置的记录），以便优化二次打开的体验。