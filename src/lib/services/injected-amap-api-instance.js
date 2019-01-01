import AMapAPILoader from './lazy-amap-api-loader';

// 高德api懒加载实例
let lazyAMapApiLoaderInstance = null;
const initAMapApiLoader = (config) => {
  if (lazyAMapApiLoaderInstance) return;
  lazyAMapApiLoaderInstance = new AMapAPILoader(config);
  lazyAMapApiLoaderInstance.load();
};
export {
  lazyAMapApiLoaderInstance,
  initAMapApiLoader
};
