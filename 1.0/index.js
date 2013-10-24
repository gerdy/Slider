/**
 * @fileoverview 
 * @author jixiangac<jixiangac@gmail.com>
 * @module slider
 **/
KISSY.add(function (S, Node,Base) {

    'use strict';

    var D = S.DOM,
        E = S.Event;

    function Slider(config) {
      var self = this;
      Slider.superclass.constructor.call(self, config);
      self.init();
    }

    S.extend(Slider, S.Base);
    S.augment(Slider, {
        init : function () {
             var self = this;
             this.el = this.get('element');
             //---------
             // min,max
             //---------
             if (!self.get('min') || self.get('min') < 0) {
                self.set('min', 0);
             }
             if (!self.get('max') || self.get('max') > 100) {
                self.set('max', 100);
             }
             //---------
             //values参数
             //---------
             this.vals = this.get('values');
             function _initValues(flag) {//flag标记是否是数组
                var _second = flag ? self.vals : self.vals[0];
                if (_second < self.get('min')){
                   _second = self.get('min');
                }
                if (_second > self.get('max')){
                  _second = self.get('max');
                }
                self.set('values', [0, _second]);
                self.single = true;
                self.vals = self.get('values'); 
             }
             if (S.isArray(this.vals)) {
                if (this.vals.length > 2) {
                  var err = new Error();
                  err.name = '参数values出错';
                  err.message = 'values数组长度最多两位';
                  throw(err);
                }
                if (this.vals.length === 1) {
                   _initValues();
                } else {
                   this.vals.sort(function(a,b){return a-b;});
                   if (this.vals[0] < this.get('min')){
                      this.vals[0] = this.get('min');
                   }
                   if (this.vals[1] > this.get('max')){
                      this.vals[1] = this.get('max');
                   }
                }
             } else {
                _initValues(true);
             }
             this.render();
         }
       ,render : function () {
             var self = this
               , values = self.get('values')
               , min = self.get('min')
               , exisitHandlers = D.children('a', self.el)
               , handler = "<a class='ui-slider-handle ui-state-default'></a>"
               , handlers = [];
             //insert container
             D.addClass(self.el, 'ui-slider ui-slider-horizontal');
             //insert block
              self.range = D.create('<div></div>', {
                css: {
                  width: Math.abs(values[1] - values[0]) + '%',
                  left: values[0] + '%'
                }
              });
             self.range.className = 'ui-slider-range';
             D.append(self.range, self.el);
             //insert handlers
             for (var i = exisitHandlers.length, len = values.length; i < len; i++) {
                if (self.single && i === 0) {
                   continue;
                }
                var _handler = D.create(handler,{css : {left:values[i] + '%'}});
                D.append(_handler, self.el);
                handlers.push(_handler);
             }

             self.handlers = handlers;

             S.each(self.handlers, function (item, i) {
                 E.on(item, 'mousedown', function (e) {
                    self.clickTarget = item;
                    self.clickIndex = i;
                    self._mouseDown(e);
                 });               
             });

             E.on(document, 'mousemove', function (e) {
                if (self.tickDrag) {
                    self._mouseDrag(e); 
                }
             });

             E.on(document, 'mouseup', function (e) {
                self._mouseUp(e);
             });
           }
        , _mouseDown : function (e) {
             var self = this;
             var btnIsLeft = (e.which === 1);
             if (!btnIsLeft || !self._mouseCapture(e)) {
                return false;
             }
             self.tickDrag = true;
             e.halt();
          }
        , _mouseUp : function (e) {
             var self = this;
             var _is = !!self.clickTarget;
             self._stop(e);
             self.tickDrag = false;
             self.clickTarget = null;
             self.clickIndex = null;
             _is && this.fire('stop');
          }
        , _mouseCapture : function (e) {
             var position
               , normValue
               , distance
               , closestHandle
               , index
               , self = this;
             var min = this.get('min')
               , max = this.get('max');
             var values = self.get('values');

             self.elSize = {
                width: D.outerWidth(self.el, true),
                height: D.outerHeight(self.el, true)
             }
             self.elOffset = D.offset(self.el);

             position = {x: e.pageX, y: e.pageY};
             normValue = self._normValueFromMouse(position);

             if (self.values(0) === self.values(1) && !self.single) {
                if (normValue > self.values(0)) {
                    index = 1
                } else if (normValue < self.values(1)) {
                    index = 0
                } else {
                    index = self._last_index;
                }
             } else {
                index = self.clickIndex;
             }
              // (if both handles of a range are at 0,
              // the first is always used as the one with least distance,
              // and moving it is obviously prevented by preventing negative ranges)
             if (!self.single && self.values(1) === min) {
                index = 1;
             }
             closestHandle = self.handlers[index];
             self._last_index = index;

             D.addClass(closestHandle, 'ui-state-active');
             
             // self._cacheOtherIndex = (index === 0 ? 1 : 0);
             if (self.single) {
                self._cacheStopPostion = self.values(1);
             } else {
                self._cacheStopPostion = self.values(index === 0 ? 1 : 0)
             }
             self._clickOffset = {
                  left : e.pageX - D.offset(closestHandle).left - (D.width(closestHandle)/2)
             };
             // console.log(self._cacheStopPostion)
             return true;
          }
        ,_mouseDrag : function (e) {
             var self = this
               , normValue
               , _distance;
             
             if (!self.tickDrag || self.clickTarget === null) {
                 return false;
             }

             normValue = self._normValueFromMouse({x:e.pageX,y:e.pageY});
             if (self.single) {
                self._change(null, 1, normValue);
             } else{
               self._change(null, self.clickIndex, normValue);
             }
             
              var originIndex = self.clickIndex;

              if (normValue < self.values(0)) {
                   self.clickIndex = 0;
                   self._change(null, 1, self.values(0));
                   self._stop(e, self.clickIndex);
               } else if (normValue > self.values(1)) {
                   var _index = 0;
                   if (!self.single) {
                      self.clickIndex = 1;
                   } else {
                     _index = 1;
                   }
                   self._change(null, _index, self.values(1));
                   self._stop(e, self.clickIndex);
               }
               self._slide(e, originIndex, normValue);
             return false;
          }
         ,_stop : function (e, index) {
            D.removeClass(this.handlers, 'ui-state-active');
            if (arguments.length > 1 && !this.single) {
              var otherIndex = (index ===0) ? 1 : 0;
              D.addClass(this.handlers[index], 'ui-state-active');
            }
          }
         ,_slide : function (e, index , newVal) {
             var self = this;
             var _distance;
             if (self.single) {
                _distance = self.values(1);
                D.css(self.range, {width: Math.abs(_distance) + '%', left: 0});
                D.css(self.handlers[0], 'left', _distance + '%');
                return;
             }
             var _w1 = self.values(index)
               , _w2 = self._cacheStopPostion;

             if (e === 'set') {
                _w1 = self.values(0);
                _w2 = self.values(1);
             }
             _distance = _w2 - _w1;
             D.css(self.range, {width: Math.abs(_distance) + '%', left: this.values(0) + '%'});

             if (e === 'set') {
                D.css(self.handlers[0], 'left', _w1 + '%');
                D.css(self.handlers[1], 'left', _w2 + '%');               
                return;
             }
             D.css(self.handlers[index], 'left', self.values(index) + '%');
             D.css(self.handlers[index === 0 ? 1 : 0], 'left', self._cacheStopPostion + '%');
         }
        ,values : function (index, newVal) {
             var vals
               , newValues
               , i
               , values = this.get('values');
             var self = this;

             if (arguments.length > 1) {
                self._change(null, index, newVal);
                return;
             }
             if (arguments.length) {
                return self._values(index);
             }
          }
        ,_values : function (index) {
             var values = this.get('values');
             return this._trimAlignValue(values[index]);
          }
        ,getValues: function () {
           var vals = this.get('values');
           if (this.single) {
             return vals[1];
           }
           return vals;
        }
        ,setValues: function (index, newVal) {
           var self = this;
           var values = this.get('values');
           if (S.isArray(arguments[0])) {
              values = arguments[0];
              this.set('values', values, true);
              this._slide('set', 0,values[0]);
              this._slide('set', 1,values[1]);
              return;
           }
           if (arguments.length === 1 && this.single) {
              values[1] = parseInt(arguments[0], 10);
              this._slide(null, 1, values[1]);
           } else {
             newVal = parseInt(newVal, 10) || 0;
             if ( (index ==0 && newVal > values[1]) 
                ||(index ==1 && newVal < values[0]) ) {
                return;
             }
             if (index == 1 && newVal > self.get('max')) {
                newVal = 100;
             }
             if (index == 0 && newVal < self.get('min')) {
                newVal = 0;
             }
             values[index] = newVal;
             this._slide('set', index,values[index]);
           }
           this.set('values', values, true);
           // this.values(index, newVal);
        }
        ,_change : function (e, index, val) {
             var values = this.get('values');
             if (arguments.length > 2) {
                 values[index] = val;
             }
             this.set('values', values, true);
             this.fire('change',{
                index: index,
                val : val
             });
             // console.log(values)
          }
        ,_normValueFromMouse : function (position) {
             var pixelTotal
               , pixelMouse
               , percentMouse
               , valueTotal
               , valueMouse
               , min = this.get('min')
               , max = this.get('max');
             var self = this;

             pixelTotal = self.elSize.width;
             pixelMouse = position.x - self.elOffset.left - (self._clickOffset ? self._clickOffset.left : 0);
             percentMouse = (pixelMouse / pixelTotal);

             if (percentMouse > 1) {
                 percentMouse = 1;
             }
             if (percentMouse < 0) {
                 percentMouse = 0;
             }
             valueTotal = max - min;
             valueMouse = min + percentMouse * valueTotal;
             return self._trimAlignValue(valueMouse);
        }
        ,_trimAlignValue : function (val) {
            var min = this.get('min');
            var max = this.get('max');
            var step = this.get('step');
            
            if (val <= min) {
              return min;
            }
            if (val >= max) {
              return max;
            }
            step = (step > 0) ? step : 1;
            var valModStep = (val - min) % step
              , alignValue = val - valModStep;

            if (Math.abs(valModStep) * 2 >= step) {
              alignValue += (valModStep > 0) ? step : (-step);
            }

            return parseFloat(alignValue.toFixed(5));
        }
    });

    return Slider;
}, {
    requires:[
      'node', 
      'base',
      './slider.css'
    ]
});



