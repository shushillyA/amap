import upperCamelCase from 'uppercamelcase';
import { commonConvertMap } from '../utils/convert-helper';
import eventHelper from '../utils/event-helper';
// import { lazyAMapApiLoaderInstance } from '../services/injected-amap-api-instance';
import CONSTANTS from '../utils/constant';
// 唯一import KiwiAMap
import KiwiAMap from '../';

// 注册组件mixins
export default {
  data() {
    return {
      // 未监听方法
      unwatchFns: []
    };
  },

  mounted() {
    // 用于自定义组件
    // if (lazyAMapApiLoaderInstance) {
    //   lazyAMapApiLoaderInstance.load().then(() => {
    //     this.__contextReady && this.__contextReady.call(this, this.convertProps());
    //   });
    // }
    this.$amap = this.$amap || this.$parent.$amap;
    /**
     * mixins as begin
     * self as after
     * through ($on)
     */
    if (this.$amap) {
      this.register();
    } else {
      this.$on(CONSTANTS.AMAP_READY_EVENT, map => {
        this.$amap = map;
        this.register();
      });
    }
  },

  destroyed() {
    this.unregisterEvents();
    if (!this.$amapComponent) return;

    this.$amapComponent.setMap && this.$amapComponent.setMap(null);
    this.$amapComponent.close && this.$amapComponent.close();
    this.$amapComponent.editor && this.$amapComponent.editor.close();
    this.unwatchFns.forEach(item => item());
    this.unwatchFns = [];
  },

  methods: {
    // 在组件
    // this.handlers[prop] || AMap.setxxx || setOptions 方法
    getHandlerFun(prop) {
      if (this.handlers && this.handlers[prop]) {
        return this.handlers[prop];
      }
      // 后者为undefined
      return this.$amapComponent[`set${upperCamelCase(prop)}`] || this.$amapComponent.setOptions;
    },

    // 转换props属性
    /**
     * 1. 属性格式化
     * 2. 去除undefined
     */
    /**
     * 格式化优先级
     * 1. $type指定
     * 2. data中的converts指定
     * 3. else js库中找 没有就不初始化
     * 4. 根据data中的propsRedirect 将值重新复制给其余props
     * 5. 返回新props对象
     */
    convertProps() {
      const props = {};
      if (this.$amap) props.map = this.$amap;
      const { $options: { propsData = {} }, propsRedirect } = this;
      const result = Object.keys(propsData).reduce((res, _key) => {
        let key = _key;
        let propsValue = this.convertSignalProp(key, propsData[key]); // value converted 转换初始值
        if (propsValue === undefined) return res; // filter undefined
        // 重新赋值
        // content => value of content
        // content => value of template
        if (propsRedirect && propsRedirect[_key]) key = propsRedirect[key];
        props[key] = propsValue;
        return res;
      }, props);
      console.log('props result', result);
      return result;
    },
    // convert main
    convertSignalProp(key, sourceData) {
      let converter = '';
      let type = '';
      // TODO
      if (this.amapTagName) {
        console.log('amapTagName', this.amapTagName);
        try {
          // 组件实例中拿不到$type的值 需要从一开始就挂载到的VueAMap对象中找
          const name = upperCamelCase(this.amapTagName).replace(/^Kiwi/, '');
          const componentConfig = KiwiAMap[name] || '';
          // $type保存的是转换器的名字
          type = componentConfig.props[key].$type;
          converter = commonConvertMap[type];
        } catch (e) {}
      }
      // 指定的公共js中的方法
      if (type && converter) {
        return converter(sourceData);
      // 转换props 通过组件内部方法
      } else if (this.converters && this.converters[key]) {
        return this.converters[key].call(this, sourceData);
      // converter common 转换props 通过utils方法
      } else {
        // 先找公共js 没有就返回原值
        const convertFn = commonConvertMap[key];
        if (convertFn) return convertFn(sourceData);
        return sourceData;
      }
    },

    // 注册事件
    // 依赖组件的mixin中的setEditorEvents
    registerEvents() {
      // 针对特定事件添加props中的event行为
      this.setEditorEvents && this.setEditorEvents();
      if (!this.$options.propsData) return;
      // 为所有events绑定行为
      if (this.$options.propsData.events) {
        for (let eventName in this.events) {
          eventHelper.addListener(this.$amapComponent, eventName, this.events[eventName]);
        }
      }
      // 绑定后执行一次
      if (this.$options.propsData.onceEvents) {
        for (let eventName in this.onceEvents) {
          eventHelper.addListenerOnce(this.$amapComponent, eventName, this.onceEvents[eventName]);
        }
      }
    },

    unregisterEvents() {
      eventHelper.clearListeners(this.$amapComponent);
    },

    // 动态props
    setPropWatchers() {
      const { propsRedirect, $options: { propsData = {} } } = this;

      Object.keys(propsData).forEach(prop => {
        let handleProp = prop;
        if (propsRedirect && propsRedirect[prop]) handleProp = propsRedirect[prop];
        let handleFun = this.getHandlerFun(handleProp);
        // 1. props改变 触发 handle 比如 改变zoom
        // 2. events事件改变 改变事件回调
        if (!handleFun && prop !== 'events') return; // events为空 => 清除 不能return

        // 监听 props
        console.log('watch', prop);
        const unwatch = this.$watch(prop, nv => {
          if (prop === 'events') {
            this.unregisterEvents();
            this.registerEvents();
            return;
          }
          // 调用handleFun 群体buff
          if (handleFun && handleFun === this.$amapComponent.setOptions) {
            return handleFun.call(this.$amapComponent, {[handleProp]: this.convertSignalProp(prop, nv)});
          }
          // 调用handleFun 单体buff
          handleFun.call(this.$amapComponent, this.convertSignalProp(prop, nv));
        });

        // collect watchers for destroyed
        this.unwatchFns.push(unwatch); // 收集监听回调
      });
    },

    registerToManager() { // 找到manager
      let manager = this.amapManager || this.$parent.amapManager;
      if (manager && this.vid !== undefined) {
        manager.setComponent(this.vid, this.$amapComponent); // 收集 高德功能性实例
      }
    },

    // some prop can not init by initial created methods
    initProps() {
      const props = ['editable', 'visible'];
      // 处理editable visible
      props.forEach(propStr => {
        if (this[propStr] !== undefined) {
          // 1.在组件data.handlers中找到对应的方法（高德设置方法）
          // 2.没有就去高德的 功能实例.set【propStr】中找
          // 3.没有返回 setOptions 有可能是undefined
          const handleFun = this.getHandlerFun(propStr);
          handleFun && handleFun.call(this.$amapComponent, this.convertSignalProp(propStr, this[propStr]));
        }
      });

      // this.printReactiveProp();
    },

    /**
     * methods for developing
     * find reactive props
     */
    printReactiveProp() {
      Object.keys(this._props).forEach(k => {
        let fn = this.$amapComponent[`set${upperCamelCase(k)}`];
        if (fn) {
          console.log(k);
        }
      });
    },
    // 1. init and register
    register() {
      // 1-1. convertProps
      // 1-2. __initComponent => new AMap.method()
      // 调用高德类的实例化方法 返回功能实例 比如一个覆盖物 赋值给 this.$amapComponent
      const res = this.__initComponent && this.__initComponent(this.convertProps());
      if (res && res.then) res.then((instance) => this.registerRest(instance));  // promise
      else this.registerRest(res);
    },

    // AMap.method() => AMap component instance
    registerRest(instance) { // 注册剩余部分
      if (!this.$amapComponent && instance) this.$amapComponent = instance; // 处理异步写法
      /**
       * 1.注册事件
       * 2.初始化props
       * 3.监听props
       * 4.注册到map-manager
       */
      this.registerEvents(); // 绑定点击事件等事件
      this.initProps(); // 设置高德功能实例的属性 可编辑？ 隐藏？ 只能设置一次
      this.setPropWatchers(); // 设置动态监听
      this.registerToManager(); // 由于是2层设计 vue组件和高德实例 互不影响 需要设置一个高德实例Map
      // 执行以上初始化 后的方法 暴露
      // 高德组件实例， 高德地图实例， 管理器
      if (this.events && this.events.init) this.events.init(this.$amapComponent, this.$amap, this.amapManager || this.$parent.amapManager);
    },

    // helper method
    $$getInstance() {
      return this.$amapComponent;
    },
    $$setFitView(v = undefined) {
      const type = Object.prototype.toString.call(v)
      let list
      if (type !== '[object Array]') list = [v];
      else list = v;
      (list && this.$amap.setFitView(list)) ||
        this.$amap.setFitView()
    },
    $$getAddress(center) {
      const geocoder = new AMap.Geocoder({
        radius: 1000,
        extensions: 'all'
      });
      return new Promise((resolve, reject) => {
        try {
          geocoder.getAddress(center, function(status, result) {
            if (status === 'complete' && result.info === 'OK') {
              if (result && result.regeocode) {
                resolve(result.regeocode.formattedAddress)
              }
            } else {
              throw new Error('未找到')
            }
          })
        } catch (e) {
          reject(e.message)
        }
      })
    }
  }
};
