let eventHelper;
class EventHelper {
  constructor() {
    /**
     * listener has表
     * {
     *  instance: {
     *              eventName: [...handlers]
     *            }
     * }
     */
    this._listener = new Map(); // Map数据结构
  }
  // https://lbs.amap.com/api/javascript-api/reference/event/?sug_index=3
  // eventHelper.addListener(this.$amapComponent.editor, key, filterSet[key]);
  // 给覆盖物类实例 add event
  addListener(instance, eventName, handler, context) {
    if (!AMap.event) throw new Error('please wait for Map API load');
    let listener = AMap.event.addListener(instance, eventName, handler, context);
    if (!this._listener.get(instance)) this._listener.set(instance, {});
    let listenerMap = this._listener.get(instance);
    if (!listenerMap[eventName]) listenerMap[eventName] = [];
    listenerMap[eventName].push(listener); // {接口: {事件: [...handlers]}}
  }

  removeListener(instance, eventName, handler) {
    if (!AMap.event) throw new Error('please wait for Map API load');
    if (!this._listener.get(instance) || !this._listener.get(instance)[eventName]) return;
    let listenerArr = this._listener.get(instance)[eventName];
    if (handler) {
      let l_index = listenerArr.indexOf(handler);
      AMap.event.removeListener(listenerArr[l_index]);
      listenerArr.splice(l_index, 1);
    } else {
      listenerArr.forEach(listener => {
        AMap.event.removeListener(listener);
      });
      this._listener.get(instance)[eventName] = [];
    }
  }
  // https://lbs.amap.com/api/javascript-api/reference/event/?sug_index=0
  // 添加一次并且移除
  addListenerOnce(instance, eventName, handler, context) {
    return AMap.event.addListenerOnce(instance, eventName, handler, context);
  }
  trigger(instance, eventName, args) {
    return AMap.event.trigger(instance, eventName, args);
  }

  clearListeners(instance) {
    let listeners = this._listener.get(instance);
    if (!listeners) return;
    Object.keys(listeners).map(eventName => {
      this.removeListener(instance, eventName);
    });
  }
};

eventHelper = eventHelper || new EventHelper();

export default eventHelper;
