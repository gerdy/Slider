## 综述

   slider是滑动条组件。

* 版本：1.0
* 作者：jixiangac
* demo：[http://gallery.kissyui.com/slider/1.0/demo/index.html](http://gallery.kissyui.com/slider/1.0/demo/index.html)

## 初始化组件

    S.use('gallery/slider/1.0/index', function (S, Slider) {
         var slider = new Slider({
         	 element : '#container'//容器，容器或者容器的父元素必须有个固定宽度
           , values : [0, 54]//滑块的百分比
         });
    })

## 配置说明
   
   + element {id}
     容器，容器或者容器的父元素必须有个固定宽度
   + values {number || Array}
     设定滑块的值（百分比），最多两个滑块,当两个模块时值为Array,如果只有一个滑块，可以是number或者Array的值为一个(例如[37])
   + max {number}
     滑动的最大百分比限定，默认100
   + mini {number}
     滑动的最小百分比限定，默认0

## 方法

   + getValues
     获取当前滑块的百分比

   + setValues 
     *参数: newVal{number} || (index, newVal) || [number, number]*
     单个滑块时候,直接传更新的值即可
     两个滑块,index为第几个滑块,newVal是更新的值
     一次性更新两个模块的值，直接传Array

## 事件

   + change
     滑块滑动时候触发

   + stop
     滑块滑动完成后触发

## 参考

   本组件参考了阿拉蕾的Slider(http://arale.alipay.im/alipay/slider/)
   TODO:竖向的配置

