<template>
  <div class="kiwi-amap-container">
    <div class="kiwi-amap"></div>
    <slot></slot>
  </div>
</template>
<script>
import guid from '../utils/guid';
import CONST from '../utils/constant';
import { lngLatTo, toLngLat, toPixel } from '../utils/convert-helper';
import registerMixin from '../mixins/register-component';
import {lazyAMapApiLoaderInstance} from '../services/injected-amap-api-instance';
export default {
  name: 'kiwi-amap',
  mixins: [registerMixin],
  props: [
    'vid',
    'events',
    'center',
    'zoom',
    'draggEnable',
    'level',
    'zooms',
    'lang',
    'cursor',
    'crs',
    'animateEnable',
    'isHotspot',
    'defaultLayer',
    'rotateEnable',
    'resizeEnable',
    'showIndoorMap',
    'indoorMap',
    'expandZoomRange',
    'dragEnable',
    'zoomEnable',
    'doubleClickZoom',
    'keyboardEnable',
    'jogEnable',
    'scrollWheel',
    'touchZoom',
    'mapStyle',
    'plugin',
    'features',
    'amapManager'  // 地图管理 manager
  ],

  beforeCreate() {
    this._loadPromise = lazyAMapApiLoaderInstance.load();
  },

  destroyed() {
    this.$amap && this.$amap.destroy();
  },

  computed: {
    /**
    * convert plugin prop from 'plugin' to 'plugins'
    * unify plugin options
    * @return {Array}
    */
    plugins() {
      console.log('plugin', this.plugin);
      let plus = [];
      // amap plugin prefix reg
      const amap_prefix_reg = /^AMap./;

      // parse plugin full name
      const parseFullName = (pluginName) => {
        return amap_prefix_reg.test(pluginName) ? pluginName : 'AMap.' + pluginName;
      };

      // parse plugin short name
      const parseShortName = (pluginName) => {
        return pluginName.replace(amap_prefix_reg, '');
      };

      if (typeof this.plugin === 'string') {
        plus.push({
          pName: parseFullName(this.plugin),
          sName: parseShortName(this.plugin)
        });
      } else if (this.plugin instanceof Array) {
        plus = this.plugin.map(oPlugin => {
          let nPlugin = {};

          if (typeof oPlugin === 'string') {
            nPlugin = {
              pName: parseFullName(oPlugin),
              sName: parseShortName(oPlugin)
            };
          } else {
            oPlugin.pName = parseFullName(oPlugin.pName);
            oPlugin.sName = parseShortName(oPlugin.pName);
            nPlugin = oPlugin;
          }
          return nPlugin;
        });
      }
      return plus;
    }
  },

  data() {
    return {
      converters: {
        center(arr) {
          return toLngLat(arr);
        }
      },
      handlers: {
        zoomEnable(flag) {
          this.setStatus({zoomEnable: flag});
        },
        dragEnable(flag) {
          this.setStatus({dragEnable: flag});
        },
        rotateEnable(flag) {
          this.setStatus({rotateEnable: flag});
        }
      }
    };
  },

  mounted() {
    this.createMap();
  },

  addEvents() {
    this.$amapComponent.on('moveend', () => {
      let centerLngLat = this.$amapComponent.getCenter();
      this.center = [centerLngLat.getLng(), centerLngLat.getLat()];
    });
  },

  methods: {
    addPlugins() {
      let _notInjectPlugins = this.plugins.filter(_plugin => !AMap[_plugin.sName]);

      if (!_notInjectPlugins || !_notInjectPlugins.length) return this.addMapControls();
      return this.$amapComponent.plugin(_notInjectPlugins, this.addMapControls);
    },

    addMapControls() {
      if (!this.plugins || !this.plugins.length) return;

      //  store plugin instances
      this.$plugins = this.$plugins || {};

      this.plugins.forEach(_plugin => {
        const realPluginOptions = this.convertAMapPluginProps(_plugin);
        const pluginInstance = this.$plugins[realPluginOptions.pName] = new AMap[realPluginOptions.sName](realPluginOptions);

        // add plugin into map
        this.$amapComponent.addControl(pluginInstance);

        // register plugin event
        if (_plugin.events) {
          for (let k in _plugin.events) {
            let v = _plugin.events[k];
            if (k === 'init') v(pluginInstance);
            else AMap.event.addListener(pluginInstance, k, v);
          }
        }
      });
    },

    /**
    * parse plugin
    * @param  {Object}
    * @return {Object}
    */
    convertAMapPluginProps(plugin) {

      if (typeof plugin === 'object' && plugin.pName) {
        switch (plugin.pName) {
          case 'AMap.ToolBar': {
            // parse offset
            if (plugin.offset && plugin.offset instanceof Array) {
              plugin.offset = toPixel(plugin.offset);
            }
            break;
          }
          case 'AMap.Scale': {
            // parse offset
            if (plugin.offset && plugin.offset instanceof Array) {
              plugin.offset = toPixel(plugin.offset);
            }
            break;
          }
        }
        return plugin;
      } else {
        return '';
      }
    },

    setStatus(option) {
      this.$amap.setStatus(option);
    },
    // amap是createMap
    // 其余是__initAMapComponent
    createMap() {
      this._loadPromise.then(() => {
        let mapElement = this.$el.querySelector('.kiwi-amap');
        const elementID = this.vid || guid();
        mapElement.id = elementID;
        // new AMap only (props属性)
        this.$amap = this.$amapComponent = new AMap.Map(elementID, this.convertProps());
        if (this.amapManager) this.amapManager.setMap(this.$amap);
        this.$emit(CONST.AMAP_READY_EVENT, this.$amap);
        this.$children.forEach(component => {
          component.$emit(CONST.AMAP_READY_EVENT, this.$amap);
        });
        if (this.plugins && this.plugins.length) {
          console.log('plugins', this.plugins);
          this.addPlugins();
        }
      });
    },
    $$getCenter() {
      if (!this.$amap) return lngLatTo(this.center);
      return lngLatTo(this.$amap.getCenter());
    }
  }
};
</script>

<style lang="less">
.kiwi-amap-container {
  height: 100%;
.kiwi-amap {
    height: 100%;
  }
}
</style>
