import upperCamelCase from 'uppercamelcase';

// 初始化接口
import {initAMapApiLoader, lazyAMapApiLoaderInstance} from './services/injected-amap-api-instance';

// 组建导入
import AMap from './components/amap.vue'; // 地图原型
import AMapMarker from './components/amap-marker.vue'; // 点坐标
import AMapSearchBox from './components/amap-search-box.vue'; // 搜索组件
import AMapCircle from './components/amap-circle.vue'; // 圆
// import AMapGroupImage from './components/amap-ground-image.vue'; // 图片覆盖物
import AMapInfoWindow from './components/amap-info-window.vue'; // 信息窗体
import AMapPolyline from './components/amap-polyline.vue'; // 折线
import AMapPolygon from './components/amap-polygon.vue'; // 多边形
import AMapText from './components/amap-text.vue'; // 文本
import AMapPolyact from './components/amap-polyact.vue'; // 热力图
// import AMapBezierCurve from './components/amap-bezier-curve.vue'; // 贝塞尔曲线
// import AMapCircleMarker from './components/amap-circle-marker.vue'; // 圆点标记
// import AMapEllipse from './components/amap-ellipse.vue'; // 椭圆
// import AMapRectangle from './components/amap-rectangle.vue'; // 矩形

// managers
import AMapManager from './managers/amap-manager';
// 自定义组件 注释
// import createCustomComponent from './adapter/custom-adapter';

let components = [
  AMap,
  AMapMarker,
  AMapSearchBox,
  AMapCircle,
  // AMapGroupImage,
  AMapInfoWindow,
  AMapPolygon,
  AMapPolyline,
  AMapText,
  AMapPolyact,
  // AMapBezierCurve,
  // AMapCircleMarker,
  // AMapEllipse,
  // AMapRectangle
];

let KiwiAMap = {
  initAMapApiLoader,
  AMapManager
};

// npm Vue.use() start
/**
 * 1. 注册 全局组件
 * 2. 将组件构造器 存入VueAMap
 */
KiwiAMap.install = (Vue = window.Vue) => {
  if (KiwiAMap.installed) return;
  Vue.config.optionMergeStrategies.deferredReady = Vue.config.optionMergeStrategies.created;
  components.map(_component => {
    // register component global
    Vue.component(_component.name, _component);
    // component cache
    // kiwi-amap => KiwiAMap.KiwiAmap 用于api?
    KiwiAMap[upperCamelCase(_component.name).replace(/^Kiwi/, '')] = _component;
  });
};
// npm Vue.use() end

// cdn引入 start
const install = function(Vue, opts = {}) {
  /* istanbul ignore if */
  if (install.installed) return;
  KiwiAMap.install(Vue);
};
/* istanbul ignore if */
if (window && window.Vue) {
  install(window.Vue);
};
// cdn引入 end

console.log('KiwiAMap', KiwiAMap);
// Vue.use(KiwiAMap)

export default KiwiAMap;
export {
  AMapManager,
  // createCustomComponent,
  initAMapApiLoader,
  lazyAMapApiLoaderInstance
};
