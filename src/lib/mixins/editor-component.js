import eventHelper from '../utils/event-helper';
export default {
  methods: {
    setEditorEvents() {
      // 高德功能类实例的editor or prop的events
      // 可编辑 并且 有 事件回调
      if (!this.$amapComponent.editor || !this.events) return;
      console.log('register events', this.$amapComponent || this.events);
      // 高德插件event
      // https://lbs.amap.com/api/javascript-api/reference/plugin/#AMap.PolyEditor
      // 只添加以下
      let filters = ['addnode', 'adjust', 'removenode', 'end', 'move'];
      let filterSet = {};
      // add event belongs filters
      Object.keys(this.events).forEach(key => {
        if (filters.indexOf(key) !== -1) filterSet[key] = this.events[key];
      });
      Object.keys(filterSet).forEach(key => {
        eventHelper.addListener(this.$amapComponent.editor, key, filterSet[key]);
      });
    }
  }
};
