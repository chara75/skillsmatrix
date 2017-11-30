/*! stn_ratingslider.js = v0.0.1 | (c) 2017 @chara75 */
(function(factory) {
    'use strict';

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // CommonJS
        module.exports = factory(require('jquery'));
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function($){
    'use strict'

       // Polyfill Number.isNaN(value)
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN
    Number.isNaN = Number.isNaN || function(value) {
        return typeof value === 'number' && value !== value;
    };

   /**
     * Range feature detection
     * @return {Boolean}
     */
    function supportsRange() {
        var input = document.createElement('input');
        input.setAttribute('type', 'range');
        return input.type !== 'text';
    }

    var pluginName = 'stn_ratingslider',
        pluginIdentifier = 0,
        hasInputRangeSupport = supportsRange(),
        defaults = {
            polyfill: false,  
            beforePadding: 25,
            afterPadding: 30,          
            rangeClass: 'stn_ratingslider',
            disabledClass: 'stn_ratingslider__disabled',
            activeClass: 'stn_ratingslider__active',
            controlClass: 'ratingcontrol',
            lineClass: 'ratingline',
            fillClass: 'ratingline__fill',
            pointClass: 'ratingpoint',
            pointFillClass: 'ratingpoint__fill',
            handleClass: 'ratinghandle',
            numberClass: 'ratingnumber',
            numberSelectedClass: 'ratingnumber__selected',
            textSelectedClass: 'ratingtext__selected',            
            startEvent: ['mousedown', 'touchstart', 'pointerdown'],
            moveEvent: ['mousemove', 'touchmove', 'pointermove'],
            endEvent: ['mouseup', 'touchend', 'pointerup'],
            showSelectedLabel: true,
            /* 
                If labels passed use the following object format 
                [ { key: 0, text: 'None'}, { key: 1, text: 'Basic'}, ... ] 
            */                
            labels: []
        };
    
    /**
     * Delays a function for the given number of milliseconds, and then calls
     * it with the arguments supplied.
     *
     * @param  {Function} fn   [description]
     * @param  {Number}   wait [description]
     * @return {Function}
     */
    function delay(fn, wait) {
        var args = Array.prototype.slice.call(arguments, 2);
        return setTimeout(function(){ return fn.apply(null, args); }, wait);
    }

    /**
     * Returns a debounced function that will make sure the given
     * function is not triggered too much.
     *
     * @param  {Function} fn Function to debounce.
     * @param  {Number}   debounceDuration OPTIONAL. The amount of time in milliseconds for which we will debounce the function. (defaults to 100ms)
     * @return {Function}
     */
    function debounce(fn, debounceDuration) {
        debounceDuration = debounceDuration || 100;
        return function() {
            if (!fn.debouncing) {
                var args = Array.prototype.slice.apply(arguments);
                fn.lastReturnVal = fn.apply(window, args);
                fn.debouncing = true;
            }
            clearTimeout(fn.debounceTimeout);
            fn.debounceTimeout = setTimeout(function(){
                fn.debouncing = false;
            }, debounceDuration);
            return fn.lastReturnVal;
        };
    }

    /**
     * Check if a `element` is visible in the DOM
     *
     * @param  {Element}  element
     * @return {Boolean}
     */
    function isHidden(element) {
        return (
            element && (
                element.offsetWidth === 0 ||
                element.offsetHeight === 0 ||
                // Also Consider native `<details>` elements.
                element.open === false
            )
        );
    }

    /**
     * Get hidden parentNodes of an `element`
     *
     * @param  {Element} element
     * @return {[type]}
     */
    function getHiddenParentNodes(element) {
        var parents = [],
            node    = element.parentNode;

        while (isHidden(node)) {
            parents.push(node);
            node = node.parentNode;
        }
        return parents;
    }

    /**
     * Returns dimensions for an element even if it is not visible in the DOM.
     *
     * @param  {Element} element
     * @param  {String}  key     (e.g. offsetWidth …)
     * @return {Number}
     */
    function getDimension(element, key) {
        var hiddenParentNodes       = getHiddenParentNodes(element),
            hiddenParentNodesLength = hiddenParentNodes.length,
            inlineStyle             = [],
            dimension               = element[key];

        // Used for native `<details>` elements
        function toggleOpenProperty(element) {
            if (typeof element.open !== 'undefined') {
                element.open = (element.open) ? false : true;
            }
        }

        if (hiddenParentNodesLength) {
            for (var i = 0; i < hiddenParentNodesLength; i++) {

                // Cache style attribute to restore it later.
                inlineStyle[i] = hiddenParentNodes[i].style.cssText;

                // visually hide
                if (hiddenParentNodes[i].style.setProperty) {
                    hiddenParentNodes[i].style.setProperty('display', 'block', 'important');
                } else {
                    hiddenParentNodes[i].style.cssText += ';display: block !important';
                }
                hiddenParentNodes[i].style.height = '0';
                hiddenParentNodes[i].style.overflow = 'hidden';
                hiddenParentNodes[i].style.visibility = 'hidden';
                toggleOpenProperty(hiddenParentNodes[i]);
            }

            // Update dimension
            dimension = element[key];

            for (var j = 0; j < hiddenParentNodesLength; j++) {

                // Restore the style attribute
                hiddenParentNodes[j].style.cssText = inlineStyle[j];
                toggleOpenProperty(hiddenParentNodes[j]);
            }
        }
        return dimension;
    }

    /**
     * Returns the parsed float or the default if it failed.
     *
     * @param  {String}  str
     * @param  {Number}  defaultValue
     * @return {Number}
     */
    function tryParseFloat(str, defaultValue) {
        var value = parseFloat(str);
        return Number.isNaN(value) ? defaultValue : value;
    }

    /**
     * Capitalize the first letter of string
     *
     * @param  {String} str
     * @return {String}
     */
    function ucfirst(str) {
        return str.charAt(0).toUpperCase() + str.substr(1);
    }

    /**
     * Plugin
     * @param {String} element
     * @param {Object} options
     */
    function Plugin(element, options) {
        this.$window            = $(window);
        this.$document          = $(document);
        this.$element           = $(element);
        this.options            = $.extend( {}, defaults, options );
        this.beforePadding      = this.options.beforePadding;
        this.afterPadding       = this.options.afterPadding;
        this.onInit             = this.options.onInit;
        this.onSlide            = this.options.onSlide;
        this.onSlideEnd         = this.options.onSlideEnd;
        this.DIMENSION          = 'width';
        this.DIRECTION          = 'left';
        this.DIRECTION_STYLE    = 'left';
        this.COORDINATE         = 'x';

        // Plugin should only be used as a polyfill
        if (this.polyfill) {
            // Input range support?
            if (hasInputRangeSupport) { return false; }
        }

        this.identifier = 'js-' + pluginName + '-' +(pluginIdentifier++);
        this.startEvent = this.options.startEvent.join('.' + this.identifier + ' ') + '.' + this.identifier;
        this.moveEvent  = this.options.moveEvent.join('.' + this.identifier + ' ') + '.' + this.identifier;
        this.endEvent   = this.options.endEvent.join('.' + this.identifier + ' ') + '.' + this.identifier;
        this.toFixed    = (this.step + '').replace('.', '').length - 1;
        

        this.$range = $('<div class="' + this.options.rangeClass + '" id="' + this.identifier + '"></div>');
        this.$control = $('<div class="' + this.options.controlClass + '"></div>');
        this.$line = $('<div class="' + this.options.lineClass + '"></div>');
        this.$fill = $('<div class="' + this.options.fillClass + '"></div>');
        this.$handle = $('<div class="' + this.options.handleClass + '"></div>');
        this.$selectedText = $('<div class="' + this.options.textSelectedClass + '"></div>');
        this.$hiddenPoint = $('<div class="' + this.options.pointClass + '"></div>');
        this.$hiddenPoint.hide();
        this.points = [];

        this.$element.after(this.$range);
        this.$range.append(this.$control);
        this.$control.append(this.$line, this.$fill, this.$handle, this.$selectedText, this.$hiddenPoint);

        // visually hide the input
        this.$element.css({
            'position': 'absolute',
            'width': '1px',
            'height': '1px',
            'overflow': 'hidden',
            'opacity': '0'
        });

        // Store context
        this.handleDown = $.proxy(this.handleDown, this);
        this.handleMove = $.proxy(this.handleMove, this);
        this.handleEnd  = $.proxy(this.handleEnd, this);

        this.init();

        // Attach Events
        var _this = this;
        this.$window.on('resize.' + this.identifier, debounce(function() {
            // Simulate resizeEnd event.
            delay(function() { _this.update(false, false); }, 300);
        }, 20));

        this.$document.on(this.startEvent, '#' + this.identifier + ':not(.' + this.options.disabledClass + ')', this.handleDown);

        // Listen to programmatic value changes
        this.$element.on('change.' + this.identifier, function(e, data) {
            if (data && data.origin === _this.identifier) {
                return;
            }
            console.log('changed');
            var value = e.target.value,
                pos = _this.getPositionFromValue(value);
            _this.setPosition(pos);
        });
    }

    Plugin.prototype.init = function() {
        this.update(true, false);

        if (this.onInit && typeof this.onInit === 'function') {
            this.onInit();
        }
    }

    Plugin.prototype.update = function(updateAttributes, triggerSlide) {
        updateAttributes = updateAttributes || false;

        this.beforePadding = tryParseFloat(this.beforePadding, 0);
        this.afterPadding = tryParseFloat(this.afterPadding, 0);
        this.rangeDimension     = getDimension(this.$range[0], 'offset' + ucfirst(this.DIMENSION));
        this.lineDimension      = this.rangeDimension - this.beforePadding - this.afterPadding;          
        this.handleDimension    = getDimension(this.$handle[0], 'offset' + ucfirst(this.DIMENSION));
        this.pointDimension     = getDimension(this.$hiddenPoint[0], 'offset' + ucfirst(this.DIMENSION));
        this.maxHandlePos       = this.lineDimension - this.handleDimension;
        this.grabPos            = this.handleDimension / 2;
        
        if (updateAttributes) {
            this.min    = tryParseFloat(this.$element[0].getAttribute('min'), 0);
            this.max    = tryParseFloat(this.$element[0].getAttribute('max'), 4);
            this.value  = tryParseFloat(this.$element[0].value, this.min);
            this.step   = tryParseFloat(this.$element[0].getAttribute('step'), 1);
            this.addPoints();
        }
        this.position           = this.getPositionFromValue(this.value);
        
        this.$line[0].style[this.DIMENSION] = this.lineDimension + 'px';
        this.$line[0].style[this.DIRECTION_STYLE] = this.beforePadding + 'px';
        this.$fill[0].style[this.DIRECTION_STYLE] = this.beforePadding + 'px';
        
        this.$control.remove('.' + this.options.pointClass + ' .' + this.options.numberClass);

        //add points to UI
        this.points.forEach((point, index) => {
            var numberString = point.pointValue;
            var pointPosition = this.getPositionFromValue(point.pointValue);
            var $point = $("<div data-value='" + point.pointValue + "' class='" + this.options.pointClass + "' style='left: " + pointPosition + "px'></div>");
            var $number = $("<div data-value='" + point.pointValue + "' class='" + this.options.numberClass + "' style='left: " + pointPosition + "px'>" + numberString + "</div>")
            this.$control.append($point);
            this.$control.append($number);
        });
                
        this.updateFillAndSelectedUI();
        
        // Consider disabled state
        if (this.$element[0].disabled) {
            this.$range.addClass(this.options.disabledClass);
        } else {
            this.$range.removeClass(this.options.disabledClass);
        }


        //this.position = this.getPointPosition(this.value);
        //this.setPosition(this.position, triggerSlide);
};    

    Plugin.prototype.addPoints = function() {

        this.stepCount = Math.ceil((this.max - this.min)/this.step) + 1;
        for (var i=0; i<this.stepCount; i++) {
            var ratingValue = Math.min((i * this.step), this.max);
            this.points.push({
                pointValue: ratingValue
            });
        }
    }

    Plugin.prototype.updateFillAndSelectedUI = function() {
        this.$control.find('.' + this.options.pointFillClass).removeClass(this.options.pointFillClass);
        this.$control.find('.' + this.options.numberSelectedClass).removeClass(this.options.numberSelectedClass);
        
        //select the point that matches the current value
        
        var selectedNumberSelector = '.' + this.options.numberClass + '[data-value="' + this.value + '"]';
        //this.$handle = this.$control.find(selectedPointSelector);
        //this.$handle.addClass(this.options.pointSelectedClass);
        this.$control.find(selectedNumberSelector).addClass(this.options.numberSelectedClass);
        
    
        //find all the points that need to be filled in
        var _this = this;
        this.$control.find('.' + this.options.pointClass).filter(function() {
            if (parseInt($(this).attr('data-value')) <= _this.value) {
                $(this).addClass(_this.options.pointFillClass);
            }
        });

        //fill in the line and move the handle
        var position = this.getPositionFromValue(this.value);
        this.$handle[0].style[this.DIRECTION_STYLE] = ((position + (this.pointDimension/2)) - (this.grabPos/2)) + 'px';
        this.$fill[0].style[this.DIMENSION] = (position - this.beforePadding) + 'px';

        //show all points except the hiddenPoint and then hide the point that the handle is over
        this.$control.find('.' + this.options.pointClass + '[data-value]').show();
        var selectedPointSelector = '.' + this.options.pointClass + '[data-value="' + this.value + '"]';
        this.$control.find(selectedPointSelector).hide();

        //set the selected Item text
        this.$selectedText.text(this.getLabel(this.value));
        
    }

    Plugin.prototype.getLabel = function(ratingValue) {
        var labelText = "";
        var labels = this.options.labels;
        if (this.options.showSelectedLabel && labels && labels.length > 0) {
            labels.forEach((label) => {
                if (label.key == ratingValue) {
                    labelText = label.text;
                }
            })
        }
        return labelText;
    }

    Plugin.prototype.handleDown = function(e) {
        e.preventDefault();
        this.$document.on(this.moveEvent, this.handleMove);
        this.$document.on(this.endEvent, this.handleEnd);
        // add active class because Firefox is ignoring
        // the handle:active pseudo selector because of `e.preventDefault();`
        this.$range.addClass(this.options.activeClass);
        
        // If we click on the handle don't set the new position

        if ((' ' + e.target.className + ' ').replace(/[\n\t]/g, ' ').indexOf(this.options.handleClass) > -1) {
            return;
       }
        var pos         = this.getRelativePosition(e),
            rangePos    = this.$range[0].getBoundingClientRect()[this.DIRECTION],
            handlePos   = this.getPositionFromNode(this.$handle[0]) - rangePos,
            setPos      = pos - this.grabPos;

        this.setPosition(setPos);

        if (pos >= handlePos && pos < handlePos + this.handleDimension) {
            this.grabPos = pos - handlePos;
        }

    };

    Plugin.prototype.handleMove = function(e) {
        e.preventDefault();
        
        var pos = this.getRelativePosition(e);
        var setPos = (pos - this.grabPos);
        this.setPosition(setPos);
        
    };

    Plugin.prototype.handleEnd = function(e) {
        e.preventDefault();
        this.$document.off(this.moveEvent, this.handleMove);
        this.$document.off(this.endEvent, this.handleEnd);
        
        this.$range.removeClass(this.options.activeClass);

        // Ok we're done fire the change event
        
        this.$element.trigger('change', { origin: this.identifier });

        if (this.onSlideEnd && typeof this.onSlideEnd === 'function') {
            this.onSlideEnd(this.position, this.value);
        }
        
    };

    Plugin.prototype.cap = function(pos, min, max) {
        if (pos < min) { return min; }
        if (pos > max) { return max; }
        return pos;
    };

    Plugin.prototype.setPosition = function(pos, triggerSlide) {
        var value, newPos;

        if (triggerSlide === undefined) {
            triggerSlide = true;
        }

        // Snapping steps
        value = this.getValueFromPosition(this.cap(pos, 0, this.maxHandlePos));
        newPos = this.getPositionFromValue(value);

        this.setValue(value);

        // Update globals
        this.position = newPos;
        this.value = value;

        // Update ui
        this.updateFillAndSelectedUI();
        
        if (triggerSlide && this.onSlide && typeof this.onSlide === 'function') {
            this.onSlide(newPos, value);
        }
    };

    // Returns element position relative to the parent
    Plugin.prototype.getPositionFromNode = function(node) {
        var i = 0;
        while (node !== null) {
            i += node.offsetLeft;
            node = node.offsetParent;
        }
        return i;
    };

    Plugin.prototype.getRelativePosition = function(e) {
        // Get the offset DIRECTION relative to the viewport
        var ucCoordinate = ucfirst(this.COORDINATE),
            rangePos = this.$range[0].getBoundingClientRect()[this.DIRECTION],
            pageCoordinate = 0;

        if (typeof e.originalEvent['client' + ucCoordinate] !== 'undefined') {
            pageCoordinate = e.originalEvent['client' + ucCoordinate];
        }
        else if (
          e.originalEvent.touches &&
          e.originalEvent.touches[0] &&
          typeof e.originalEvent.touches[0]['client' + ucCoordinate] !== 'undefined'
        ) {
            pageCoordinate = e.originalEvent.touches[0]['client' + ucCoordinate];
        }
        else if(e.currentPoint && typeof e.currentPoint[this.COORDINATE] !== 'undefined') {
            pageCoordinate = e.currentPoint[this.COORDINATE];
        }

        return pageCoordinate - rangePos;
    };

    Plugin.prototype.getPositionFromValue = function(value) {
        var percentage, pos;
        percentage = (value - this.min)/(this.max - this.min);
        pos = (!Number.isNaN(percentage)) ? percentage * this.lineDimension : 0;
        return pos + this.beforePadding;
    };

    Plugin.prototype.getValueFromPosition = function(pos) {
        var percentage, value;
        percentage = (pos / (this.lineDimension || 1));
        value = this.step * Math.round(percentage * (this.max - this.min) / this.step) + this.min;
        return Number((value).toFixed(this.toFixed));
    };

    Plugin.prototype.setValue = function(value) {
        if (value === this.value && this.$element[0].value !== '') {
            return;
        }

        // Set the new value and fire the `input` event
        this.$element
            .val(value)
            .trigger('input', { origin: this.identifier });
    };

    Plugin.prototype.destroy = function() {
        this.$document.off('.' + this.identifier);
        this.$window.off('.' + this.identifier);

        this.$element
            .off('.' + this.identifier)
            .removeAttr('style')
            .removeData('plugin_' + pluginName);

        // Remove the generated markup
        if (this.$range && this.$range.length) {
            this.$range[0].parentNode.removeChild(this.$range[0]);
        }
    };

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[pluginName] = function(options) {
        var args = Array.prototype.slice.call(arguments, 1);

        return this.each(function() {
            var $this = $(this),
                data  = $this.data('plugin_' + pluginName);

            // Create a new instance.
            if (!data) {
                $this.data('plugin_' + pluginName, (data = new Plugin(this, options)));
            }

            // Make it possible to access methods from public.
            // e.g `$element.rangeslider('method');`
            if (typeof options === 'string') {
                data[options].apply(data, args);
            }
        });
    };

}));
