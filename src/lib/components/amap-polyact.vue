<template>
  <div></div>
</template>

<script>
import Polyact from 'polyact'
import CONSTANTS from '../utils/constant';
const TAG = 'kiwi-amap-polyact';

export default {
  name: TAG,
  props: ['heatMapInfo', 'isHidden'],
  data () {
    return {
      changedHeatMapInfo: null,
    }
  },
  watch: {
    heatMapInfo (nv) {
      if (!this.isHidden) {
        this.renderHeatMapInfo(nv)
        this.changedHeatMapInfo = null
      } else {
        this.changedHeatMapInfo = nv
      }
    },
    isHidden (hidden) {
      this.$emit('isRendering', true)
      if (!hidden && this.changedHeatMapInfo) {
        this.renderHeatMapInfo(this.changedHeatMapInfo)
        this.changedHeatMapInfo = null
      }
    }
  },
  methods: {
    renderHeatMapInfo(heatMapInfo) {
      if (heatMapInfo && heatMapInfo.grids && heatMapInfo.grids.length) {
        this.heatMapInfo.grids.map(el => {
          el['count'] = el.orderCount
          el['payload'] = el.grid
        })
        const grids = heatMapInfo.grids
        const groupSize = 70
        const timeGap = 100
        const groupCount = Math.ceil(grids.length / groupSize)
        for (let i = 0; i < groupCount; i += 1) {
          this.delayedRender(grids.slice(i * groupSize, (i + 1) * groupSize), i * timeGap, (groupCount - 1) * timeGap)
        }
      }
    },
    delayedRender(grids, delay, totalTime) {
      const polyact = new Polyact(this.$amap)
      this.$polyact = polyact
      const vm = this
      setTimeout(_ => {
        polyact.render({
          type: 'grid',
          data: grids,
          colors: Array(this.heatMapInfo.rankCount).fill(null).map((_, index) => `rgba(199, 108, 134, ${1 / this.heatMapInfo.rankCount * (index + 1)})`),
          created (result) {
            if (delay === totalTime) {
              vm.$emit('isRendering', false)
            }
            result.forEach(({ polygon }) => {
              polygon.setOptions({ zIndex: 0 })
            })
            const polygons = result.map(({ polygon }) => polygon)
            vm.$watch('isHidden', _ => {
              if (vm.isHidden) {
                setTimeout(_ => {
                  vm.$amap.remove(polygons)
                  if (delay === 0) {
                    vm.$emit('isRendering', false)
                  }
                }, (totalTime - delay) * 4)
              } else {
                setTimeout(_ =>{
                  vm.$amap.add(polygons)
                  if (delay === totalTime) {
                    vm.$emit('isRendering', false)
                  }
                }, delay)
              }
            })
          }
        })
      }, delay)
    }
  },
  mounted () {
    this.$amap = this.$amap || this.$parent.$amap;
    if (this.$amap) {
    } else {
      this.$on(CONSTANTS.AMAP_READY_EVENT, map => {
        this.$amap = map;
      });
    }
  },
  destroyed () {
    if (this.$polyact) {
      this.$amap.remove([this.$polyact])
    }
  }
}
</script>
