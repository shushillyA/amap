// Map实例管理器
/**
 * 1. map实例化后与vue组件不是依存关系，所以需要一个map实例管理器
 */
export default class AMapManager {
  constructor() {
    this._componentMap = new Map();
    this._map = null;
  }
  setMap(map) {
    this._map = map;
  }
  getMap() {
    return this._map;
  }
  setComponent(id, component) {
    this._componentMap.set(id, component);
  }
  getComponent(id) {
    return this._componentMap.get(id);
  }
  getChildInstance(id) {
    return this.getComponent(id);
  }
  removeComponent(id) {
    this._componentMap.delete(id);
  }
};
