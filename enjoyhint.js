var EnjoyHint = function (_options) {
    var $event_element;
    var that = this;
    var defaults = {
        maxElementSearchAttempt :20,
        onStart: function () {
        },
        onEnd: function () {
        },
        onSkip: function () {
        },
        onNext: function () {
        }
    };
    
    var options = $.extend(defaults, _options);
    var data = [];
    var current_step = 0;
    var timerHandler = null;
    $body = $('body');

    /********************* PRIVATE METHODS ***************************************/
    var init = function () {
        if ($('.enjoyhint')) {
            $('.enjoyhint').remove();
        }
        $body.css({'overflow':'hidden'});
        $(document).on("touchmove",lockTouch);
        $body.enjoyhint({
            onNextClick: function () {
                nextStep();
            },
            onSkipClick: function () {
                options.onSkip();
                skipAll();
            }
        });
    };
    var lockTouch = function(e) {
        e.preventDefault();
    };
    var destroyEnjoy = function () {
        stopElementMonitoring();
        $('.enjoyhint').remove();
        $body.css({'overflow':'auto'});
        $(document).off("touchmove", lockTouch);
    };
    that.clear = function(){
        var $nextBtn = $('.enjoyhint_next_btn');
        var $skipBtn = $('.enjoyhint_skip_btn');
        $nextBtn.removeClass(that.nextUserClass);
        $nextBtn.text("Next");
        $skipBtn.removeClass(that.skipUserClass);
        $skipBtn.text("Skip");
    };
    var getShapeDatafromStepData = function (step_data) {
        var $element = $(step_data.selector);
        if (!$element.length) return null;
        var max_habarites = Math.max($element.outerWidth(), $element.outerHeight());
        var radius = step_data.radius || Math.round(max_habarites / 2) + 5;
        var offset = $element.offset();
        var w = $element.outerWidth();
        var h = $element.outerHeight();
        var shape_margin = (step_data.margin !== undefined) ? step_data.margin : 10;
        var coords = {
            x: offset.left + Math.round(w / 2),
            y: offset.top + Math.round(h / 2) - $(document).scrollTop()
        };
        var shape_data = {
            enjoyHintElementSelector: step_data.selector,
            center_x: coords.x,
            center_y: coords.y,
            text: step_data.description,
            top: step_data.top,
            bottom: step_data.bottom,
            left: step_data.left,
            right: step_data.right,
            margin: step_data.margin,
            scroll: step_data.scroll,
        };
        if (step_data.skipArrow)
            shape_data.skipArrow = step_data.skipArrow;
        if (step_data.disableUI)
            shape_data.disableUI = step_data.disableUI;
        if (step_data.shape && step_data.shape == 'circle') {
            shape_data.shape = 'circle';
            shape_data.radius = radius;
        } else {
            shape_data.radius = 0;
            shape_data.width = w + shape_margin;
            shape_data.height = h + shape_margin;
        }
        return shape_data;
    }
    var stepAction = function () {
        $body.enjoyhint('setProgress',current_step+1,data.length);
        if (!(data && data[current_step])) {
            $body.removeClass('enjoyhint-disabled-ui');
            $body.enjoyhint('hide');
            options.onEnd();
            destroyEnjoy();
            return;
        }
        options.onNext();
        var $enjoyhint = $('.enjoyhint');
        $enjoyhint.removeClass("enjoyhint-step-" + current_step);
        $enjoyhint.removeClass("enjoyhint-step-" + (current_step + 1));
        $enjoyhint.addClass("enjoyhint-step-" + (current_step + 1));
        var step_data = data[current_step];
        if (step_data.onBeforeStart && typeof step_data.onBeforeStart === 'function') {
            step_data.onBeforeStart();
        }
        var timeout = step_data.timeout || 0;
        setTimeout(function () {
            if (!step_data.selector) {
                for (var prop in step_data) {
                    if (step_data.hasOwnProperty(prop) && prop.split(" ")[1]) {
                        step_data.selector = prop.split(" ")[1];
                        step_data.event = prop.split(" ")[0];
                        if (prop.split(" ")[0] == 'next' || prop.split(" ")[0] == 'auto' || prop.split(" ")[0] == 'custom') {
                            step_data.event_type = prop.split(" ")[0];
                        }
                        step_data.description = step_data[prop];
                    }
                }
            }
            setTimeout(function () {
                that.clear();
            }, 250);
            $(document.body).scrollTo(step_data.selector, step_data.scrollAnimationSpeed || 250, {offset: -100});
            var waitForElementFn = function (callbackFn,timeOut, maxAttempts) {
                if (maxAttempts)
                    setTimeout(function () {                       
                        var $element = $(step_data.selector);
                        if (!$element.length) waitForElementFn(callbackFn,timeOut,maxAttempts-1);
                        else {
                            callbackFn();
                        }
                    }, timeOut);
            }
            //wait until expected element appears asynchronously
            var action = function () {
                var $element = $(step_data.selector);
                var event = makeEventName(step_data.event);
                $body.enjoyhint('show');
                $body.enjoyhint('hide_next');
                $event_element = $element;
                if (step_data.event_selector) {
                    $event_element = $(step_data.event_selector);
                }
                if (!step_data.event_type && step_data.event == "key") {
                    $element.keydown(function (event) {
                        if (event.which == step_data.keyCode) {
                            current_step++;
                            stepAction();
                        }
                    });
                }
                if (step_data.showNext == true) {
                    $body.enjoyhint('show_next');
                }
                if (step_data.showSkip == false) {
                    $body.enjoyhint('hide_skip');
                } else {
                    $body.enjoyhint('show_skip');
                }
                if (step_data.showSkip == true) {
                }
                if (step_data.nextButton) {
                    var $nextBtn = $('.enjoyhint_next_btn');
                    $nextBtn.addClass(step_data.nextButton.className || "");
                    $nextBtn.text(step_data.nextButton.text || "Next");
                    that.nextUserClass = step_data.nextButton.className;
                }
                if (step_data.skipButton) {
                    var $skipBtn = $('.enjoyhint_skip_btn');
                    $skipBtn.addClass(step_data.skipButton.className || "");
                    $skipBtn.text(step_data.skipButton.text || "Skip");
                    that.skipUserClass = step_data.skipButton.className;
                }
                if (step_data.event_type) {
                    switch (step_data.event_type) {
                        case 'auto':
                            $element[step_data.event]();
                            switch (step_data.event) {
                                case 'click':
                                    break;
                            }
                            current_step++;
                            stepAction();
                            return;
                            break;
                        case 'custom':
                            on(step_data.event, function () {
                                current_step++;
                                off(step_data.event);
                                stepAction();
                            });
                            break;
                        case 'next':
                            $body.enjoyhint('show_next');
                            break;
                    }
                } else {
    
                    $event_element.on(event, function (e) {
                        if (step_data.keyCode && e.keyCode != step_data.keyCode) {
                            return;
                        }
                        if (this  === $(step_data.selector)[0]) {
                            current_step++;
                        }
                        
                        $(this).off(event);
                        stepAction(); // clicked
                    });
                    
                    
                }
                var shape_data = getShapeDatafromStepData(step_data);
                that.last_shape_data = shape_data;                
                $body.enjoyhint('render_label_with_shape', shape_data, that.stop);
            }
            if (current_step+1 < data.length && data[current_step+1].event === 'next') {
                action();
            } else {
                waitForElementFn(action, step_data.scrollAnimationSpeed + 20 || 270, options.maxElementSearchAttempt);
            }
        }, timeout);
    };
    var nextStep = function() {
        current_step++;
        stepAction();
    };
    var skipAll = function() {
        var step_data = data[current_step];
        var $element = $(step_data.selector);
        off(step_data.event);
        $element.off(makeEventName(step_data.event));
        destroyEnjoy();
    };
    var makeEventName = function (name, is_custom) {
        return name + (is_custom ? 'custom' : '') + '.enjoy_hint';
    };
    var on = function (event_name, callback) {
        $body.on(makeEventName(event_name, true), callback);
    };
    var off = function (event_name) {
        $body.off(makeEventName(event_name, true));
    };

    /********************* PUBLIC METHODS ***************************************/
    window.addEventListener('resize', function() {
        if ($event_element != null) {
            $body.enjoyhint('redo_events_near_rect', $event_element[0].getBoundingClientRect());
        }
    });
    that.stop = function() {
        skipAll();
    };
    that.reRunScript = function(cs) {
        current_step = cs;
        stepAction();
    };
    function monitorElementAnimations() {
        var step_data = data[current_step];
        if (step_data) {
            var shape_data = getShapeDatafromStepData(step_data);
            if (shape_data && that.last_shape_data && (shape_data.center_x != that.last_shape_data.center_x || shape_data.center_y != that.last_shape_data.center_y)) {
                that.last_shape_data = shape_data;
                var $element = $(step_data.selector);
                if ($element) {
                    if ($event_element != null) {
                        $body.enjoyhint('render_label_with_shape', shape_data, that.stop);
                        //$body.enjoyhint('redo_events_near_rect', $event_element[0].getBoundingClientRect());
                    }
                }
            }
        }
    }
    function stopElementMonitoring() {
        window.clearInterval(timerHandler);
        timerHandler = null;
    }
    that.runScript = function () {
        if (timerHandler) {
            stopElementMonitoring();
        }
        timerHandler = window.setInterval(monitorElementAnimations, 1000);
        current_step = 0;
        options.onStart();
        stepAction();
    };
    that.resumeScript = function () {
        stepAction();
    };
    that.setCurrentStep = function(cs) {
        current_step = cs;
    };
    that.getCurrentStep = function () {
        return current_step;
    };
    that.trigger = function (event_name) {
        switch (event_name) {
            case 'next':
                nextStep();
                break;
            case 'skip':
                skipAll();
                break;
        }
    };
    that.setScript = function (_data) {
        if (_data) {
            data = _data;
        }
    };
    //support deprecated API methods
    that.set = function (_data) {
        that.setScript(_data);
    };
    that.setSteps = function (_data) {
        that.setScript(_data);
    };
    that.run = function () {
        that.runScript();
    };
    that.resume = function () {
        that.resumeScript();
    };
    init();
};CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {

    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
};

(function ($) {

    var that;

    var originalLabelLeft, originalLabelTop;
    var originalArrowLeft, originalArrowTop;
    var originalCenterX, originalCenterY;
    var originalSkipbuttonLeft, originalSkipbuttonTop;
    var prevWindowWidth, prevWindowHeight;
    var originalWidth = window.innerWidth, originalHeight = window.innerHeight;

    var methods = {

        init: function (options) {

            return this.each(function () {

                var defaults = {

                    onNextClick: function () {

                    },
                    onSkipClick: function () {

                    },

                    animation_time: 800,

                    showProgressPanel:true
                };

                this.enjoyhint_obj = {};
                that = this.enjoyhint_obj;

                that.resetComponentStuff = function() {

                    originalLabelLeft = null;
                    originalLabelTop = null;
                    originalArrowLeft = null;
                    originalArrowTop = null;
                    originalCenterX = null;
                    originalCenterY = null;
                    originalSkipbuttonLeft = null;
                    originalSkipbuttonTop = null;
                    prevWindowWidth = null;
                    prevWindowHeight = null;
                    originalWidth = window.innerWidth;
                    originalHeight = window.innerHeight;
                };


                var $that = $(this);
                that.options = jQuery.extend(defaults, options);

                //general classes
                that.gcl = {

                    chooser: 'enjoyhint'
                };

                // classes
                that.cl = {

                    enjoy_hint: 'enjoyhint',
                    hide: 'enjoyhint_hide',
                    disable_events_element: 'enjoyhint_disable_events',
                    btn: 'enjoyhint_btn',
                    skip_btn: 'enjoyhint_skip_btn',
                    close_btn: 'enjoyhint_close_btn',
                    next_btn: 'enjoyhint_next_btn',
                    main_canvas: 'enjoyhint_canvas',
                    main_svg: 'enjoyhint_svg',
                    svg_wrapper: 'enjoyhint_svg_wrapper',
                    svg_transparent: 'enjoyhint_svg_transparent',
                    kinetic_container: 'kinetic_container',
                    progress_panel: 'enjoyhint_progress'
                };

                function makeSVG(tag, attrs) {

                    var el = document.createElementNS('http://www.w3.org/2000/svg', tag);

                    for (var k in attrs) {

                        el.setAttribute(k, attrs[k]);
                    }

                    return el;
                }


                // =======================================================================
                // ========================---- enjoyhint ----==============================
                // =======================================================================

                that.canvas_size = {

                    w: $(window).width()*1.4,
                    h: $(window).height()*1.4
                };

                var canvas_id = "enj_canvas";

                that.enjoyhint = $('<div>', {'class': that.cl.enjoy_hint + ' ' + that.cl.svg_transparent}).appendTo($that);
                that.enjoyhint_svg_wrapper = $('<div>', {'class': that.cl.svg_wrapper + ' ' + that.cl.svg_transparent}).appendTo(that.enjoyhint);
                that.$stage_container = $('<div id="' + that.cl.kinetic_container + '">').appendTo(that.enjoyhint);
                that.$canvas = $('<canvas id="' + canvas_id + '" width="' + that.canvas_size.w + '" height="' + that.canvas_size.h + '" class="' + that.cl.main_canvas + '">').appendTo(that.enjoyhint);
                that.$svg = $('<svg width="' + that.canvas_size.w + '" height="' + that.canvas_size.h + '" class="' + that.cl.main_canvas + ' ' + that.cl.main_svg + '">').appendTo(that.enjoyhint_svg_wrapper);

                var defs = $(makeSVG('defs'));
                var marker = $(makeSVG('marker', {id: "arrowMarker", viewBox: "0 0 36 21", refX: "21", refY: "10", markerUnits: "strokeWidth", orient: "auto", markerWidth: "16", markerHeight: "12"}));
                var polilyne = $(makeSVG('path', {style: "fill:none; stroke:rgb(255,255,255); stroke-width:2", d: "M0,0 c30,11 30,9 0,20"}));

                defs.append(marker.append(polilyne)).appendTo(that.$svg);

                that.kinetic_stage = new Kinetic.Stage({
                    container: that.cl.kinetic_container,
                    width: that.canvas_size.w,
                    height: that.canvas_size.h,
                    scaleX: 1
                });

                that.layer = new Kinetic.Layer();
                that.rect = new Kinetic.Rect({
                    fill: 'rgba(0,0,0,0.6)',
                    width: that.canvas_size.w,
                    height: that.canvas_size.h
                });

                var $top_dis_events = $('<div>', {'class': that.cl.disable_events_element}).appendTo(that.enjoyhint);
                var $bottom_dis_events = $top_dis_events.clone().appendTo(that.enjoyhint);
                var $left_dis_events = $top_dis_events.clone().appendTo(that.enjoyhint);
                var $right_dis_events = $top_dis_events.clone().appendTo(that.enjoyhint);

                var stopPropagation = function(e) {

                    e.stopImmediatePropagation();
                };

                $("button").focusout(stopPropagation);
                $top_dis_events.click(stopPropagation);
                $bottom_dis_events.click(stopPropagation);
                $left_dis_events.click(stopPropagation);
                $right_dis_events.click(stopPropagation);


                that.$skip_btn = $('<div>', {'class': that.cl.skip_btn}).appendTo(that.enjoyhint).html('Skip').click(function (e) {

                    that.hide();
                    that.options.onSkipClick();
                });
                that.$next_btn = $('<div>', {'class': that.cl.next_btn}).appendTo(that.enjoyhint).html('Next').click(function (e) {

                    that.options.onNextClick();
                });

                that.$close_btn = $('<div>', {'class': that.cl.close_btn}).appendTo(that.enjoyhint).html('').click(function (e) {

                    that.hide();
                    that.options.onSkipClick();
                });
                if (that.options.showProgressPanel) {
                    var totalSteps = "1";
                    that.$progress_panel = $('<div>', { 'class': that.cl.progress_panel }).appendTo(that.enjoyhint) .html('1/' + totalSteps);
                }

                that.$canvas.mousedown(function (e) {

                    $('canvas').css({left: '4000px'});

                    var BottomElement = document.elementFromPoint(e.clientX, e.clientY);
                    $('canvas').css({left: '0px'});

                    $(BottomElement).click();

                    return false;
                });


                var circle_r = 0;
                var shape_init_shift = 130;

                that.shape = new Kinetic.Shape({
                    radius: circle_r,
                    center_x: -shape_init_shift,
                    center_y: -shape_init_shift,
                    width: 0,
                    height: 0,
                    sceneFunc: function (context) {

                        var ctx = this.getContext("2d")._context;
                        var pos = this.pos;
                        var def_comp = ctx.globalCompositeOperation;
                        ctx.globalCompositeOperation = 'destination-out';
                        ctx.beginPath();

                        var x = this.attrs.center_x - Math.round(this.attrs.width / 2);
                        var y = this.attrs.center_y - Math.round(this.attrs.height / 2);
                        ctx.roundRect(x, y, this.attrs.width, this.attrs.height, this.attrs.radius);
                        ctx.fillStyle = "red";
                        ctx.fill();

                        ctx.globalCompositeOperation = def_comp;
                    }
                });

                that.shape.radius = circle_r;
                that.layer.add(that.rect);
                that.layer.add(that.shape);
                that.kinetic_stage.add(that.layer);

                $(window).on('resize', function() {

                    if (!($(that.stepData.enjoyHintElementSelector).is(":visible"))) {

                        that.stopFunction();
                        $(window).off('resize');
                        return;
                    }

                    prevWindowWidth = window.innerWidth;
                    prevWindowHeight = window.innerHeight;

                    var boundingClientRect = $(that.stepData.enjoyHintElementSelector)[0].getBoundingClientRect();

                    that.shape.attrs.center_x = Math.round(boundingClientRect.left + boundingClientRect.width / 2);
                    that.shape.attrs.center_y = Math.round(boundingClientRect.top + boundingClientRect.height / 2);
                    that.shape.attrs.width = boundingClientRect.width + 11;
                    that.shape.attrs.height = boundingClientRect.height + 11;

                    var newWidth = window.innerWidth;
                    var newHeight = window.innerHeight;
                    var scaleX = newWidth / originalWidth;
                    var scaleY = newHeight / originalHeight;

                    that.kinetic_stage.setAttr('width', originalWidth * scaleX);
                    that.kinetic_stage.setAttr('height', originalHeight * scaleY);

                    if (that.stepData != null) {

                        prevWindowWidth = window.innerWidth;
                        prevWindowHeight = window.innerHeight;


                        /* Init */

                        if (!originalCenterX) {

                            originalCenterX = that.shape.attrs.center_x;
                            originalCenterY = that.shape.attrs.center_y;
                        }

                        if (!originalArrowLeft) {

                            originalArrowLeft = [];
                            var attr = $('#enjoyhint_arrpw_line').attr('d');
                            if (attr && attr.length) {
                                originalArrowLeft.push(attr.substr(1).split(',')[0]);
                                originalArrowLeft.push(attr.substr(attr.indexOf('Q') + 1).split(',')[0]);
                                originalArrowLeft.push(attr.split(' ')[2].split(',')[0]);
                                originalArrowTop = [];
                                originalArrowTop.push(attr.split(',')[1].split(' ')[0]);
                                originalArrowTop.push(attr.split(',')[2].split(' ')[0]);
                                originalArrowTop.push(attr.split(',')[3]);
                            }
                        }

                        var labelElement = $('.enjoy_hint_label');

                        if (!originalLabelLeft) {

                            originalLabelLeft = labelElement[0].getBoundingClientRect().left;
                            originalLabelTop = labelElement[0].getBoundingClientRect().top;
                        }

                        var skipButton = $('.enjoyhint_skip_btn');

                        if (!originalSkipbuttonLeft) {

                            originalSkipbuttonLeft = skipButton[0].getBoundingClientRect().left;
                            originalSkipbuttonTop = skipButton[0].getBoundingClientRect().top;
                        }


                        /* Resizing label */

                        labelElement.css('left', window.innerWidth / 2 - labelElement.outerWidth() / 2);


                        /* Resizing arrow */

                        var labelRect = labelElement[0].getBoundingClientRect();

                        if (window.innerWidth < 640) {

                            $('#enjoyhint_arrpw_line').hide();
                            labelElement.css('top', window.innerHeight / 2 - labelElement.outerHeight() / 2);
                        } else {

                            $('#enjoyhint_arrpw_line').show();

                            labelElement.css('top', originalLabelTop);

                            var x1, x2, y1, y2;

                            var labelLeftOfShape = labelRect.left + labelRect.width / 2 < that.shape.attrs.center_x;
                            var labelAboveShape = labelRect.top + labelRect.height / 2 < that.shape.attrs.center_y;

                            if (window.innerWidth < 1200) {

                                x1 = Math.round(labelRect.left + (labelRect.width / 2 + 15) * (labelRect.left + labelRect.width / 2 < that.shape.attrs.center_x ? 1 : -1));
                                y1 = Math.round(labelRect.top + labelRect.height * (labelRect.top + labelRect.height / 2 < that.shape.attrs.center_y ? 1 : -1));
                                x2 = Math.round(that.shape.attrs.center_x + (that.shape.attrs.radius + 15) * (labelLeftOfShape ? -1 : 1));
                                y2 = Math.round(that.shape.attrs.center_y);
                            } else {

                                x1 = Math.round((labelRect.left + (labelRect.width / 2)) + ((labelRect.width / 2 + 15) * (labelLeftOfShape ? 1 : -1)));
                                y1 = Math.round(labelRect.top + labelRect.height / 2);
                                x2 = Math.round(that.shape.attrs.center_x);
                                y2 = Math.round(that.shape.attrs.center_y + (((that.shape.attrs.height / 2) + 15) * (labelAboveShape ? -1 : 1)));
                            }

                            var midX = x1 + (x2 - x1) / 2;
                            var midY = y1 + (y2 - y1) / 2;

                            var bezX = x1 < x2 ? x2 : x1;
                            var bezY = y1 < y2 ? y1 : y2;

                            if (Math.abs(labelRect.left + labelRect.width / 2 - that.shape.attrs.center_x) < 200) {

                                x1 = x2 = labelRect.left + labelRect.width / 2;
                                y1 = labelRect.top;
                                bezX = x1;
                                bezY = y1;
                                console.log("ok");
                            }

                            if (window.innerWidth < 900) {

                                bezX = x1 < x2 ? x1 : x2;
                                bezY = y1 < y2 ? y2 : y1;
                            }

                            var newCoordsLine = "M%d1,%d2 Q%d3,%d4 %d5,%d6"
                                .replace("%d1", x1).replace("%d2", y1)
                                .replace("%d3", bezX).replace("%d4", bezY)
                                .replace("%d5", x2).replace("%d6", y2);
                           // $('#enjoyhint_arrpw_line')[0].setAttribute('d', newCoordsLine);
                    /*that.renderArrow({
                        x_from: x1,
                        y_from: y1,
                        x_to: x2,
                        y_to: y2,
                        by_top_side: false
                    });*/
                        
                        var control_point_x = 0;
                        var control_point_y = 0;
                        if (labelAboveShape) {

                            if (y1 >= y2) {

                                control_point_y = y2;
                                control_point_x = x1;
                            } else {

                                control_point_y = y1;
                                control_point_x = x2;
                            }
                        } else {

                            if (y1 >= y2) {

                                control_point_y = y1;
                                control_point_x = x2;
                            } else {

                                control_point_y = y2;
                                control_point_x = x1;
                            }
                        }

                        $('#enjoyhint_arrpw_line').remove();
                        var d = 'M' + x1 + ',' + y1 + ' Q' + control_point_x + ',' + control_point_y + ' ' + x2 + ',' + y2;
                        that.$svg.append(makeSVG('path', {style: "fill:none; stroke:rgb(255,255,255); stroke-width:3", 'marker-end': "url(#arrowMarker)", d: d, id: 'enjoyhint_arrpw_line'}));
                        that.enjoyhint.removeClass(that.cl.svg_transparent);
                        }
                        
                        that.disableEventsNearRect(boundingClientRect);


                        /* Resizing skip button */

                        var newSkipbuttonLeft = +originalSkipbuttonLeft + (that.shape.attrs.center_x - originalCenterX) / 2;
                        skipButton.css('left', newSkipbuttonLeft < 15 ? 15 : newSkipbuttonLeft);
                        skipButton.css('top', labelRect.top + labelRect.height + 20);
                    }

                    that.rect = new Kinetic.Rect({
                        fill: 'rgba(0,0,0,0.6)',
                        width: window.innerWidth,
                        height: window.innerHeight
                    });

                    that.layer.removeChildren();
                    that.layer.add(that.rect);
                    that.layer.add(that.shape);
                    that.layer.draw();
                    that.kinetic_stage.draw();
                });

                var enjoyhint_elements = [
                    that.enjoyhint,
                    $top_dis_events,
                    $bottom_dis_events,
                    $left_dis_events,
                    $right_dis_events
                ];

                that.show = function () {

                    that.enjoyhint.removeClass(that.cl.hide);
                };

                that.hide = function () {

                    that.enjoyhint.addClass(that.cl.hide);

                    var tween = new Kinetic.Tween({
                        node: that.shape,
                        duration: 0.002,
                        center_x: -shape_init_shift,
                        center_y: -shape_init_shift
                    });

                    tween.play();
                };

                that.hide();

                that.hideNextBtn = function () {

                    that.$next_btn.addClass(that.cl.hide);
                    that.nextBtn = "hide";
                };

                that.showNextBtn = function () {

                    that.$next_btn.removeClass(that.cl.hide);
                    that.nextBtn = "show";
                };

                that.hideSkipBtn = function () {

                    that.$skip_btn.addClass(that.cl.hide);
                };

                that.showSkipBtn = function () {

                    that.$skip_btn.removeClass(that.cl.hide);
                };

                

                that.renderCircle = function (data) {

                    var r = data.r || 0;
                    var x = data.x || 0;
                    var y = data.y || 0;

                    var tween = new Kinetic.Tween({
                        node: that.shape,
                        duration: 0.2,
                        center_x: x,
                        center_y: y,
                        width: r * 2,
                        height: r * 2,
                        radius: r
                    });

                    tween.play();

                    var left = x - r;
                    var right = x + r;
                    var top = y - r;
                    var bottom = y + r;
                    var margin = 20;

                    return {
                        x: x,
                        y: y,
                        left: left,
                        right: right,
                        top: top,
                        bottom: bottom,
                        conn: {
                            left: {
                                x: left - margin,
                                y: y
                            },
                            right: {
                                x: right + margin,
                                y: y
                            },
                            top: {
                                x: x,
                                y: top - margin
                            },
                            bottom: {
                                x: x,
                                y: bottom + margin
                            }
                        }
                    };

                };

                that.renderRect = function (data, timeout) {

                    var r = data.r || 5;
                    var x = data.x || 0;
                    var y = data.y || 0;
                    var w = data.w || 0;
                    var h = data.h || 0;
                    var margin = 20;

                    var tween = new Kinetic.Tween({
                        node: that.shape,
                        duration: timeout,
                        center_x: x,
                        center_y: y,
                        width: w,
                        height: h,
                        radius: r
                    });

                    tween.play();

                    var half_w = Math.round(w / 2);
                    var half_h = Math.round(h / 2);
                    var left = x - half_w;
                    var right = x + half_w;
                    var top = y - half_h;
                    var bottom = y + half_h;

                    return {
                        x: x,
                        y: y,
                        left: left,
                        right: right,
                        top: top,
                        bottom: bottom,
                        conn: {
                            left: {
                                x: left - margin,
                                y: y
                            },
                            right: {
                                x: right + margin,
                                y: y
                            },
                            top: {
                                x: x,
                                y: top - margin
                            },
                            bottom: {
                                x: x,
                                y: bottom + margin
                            }
                        }
                    };
                };

                that.renderLabel = function (data) {

                    var x = data.x || 0;
                    that.originalElementX = x;
                    var y = data.y || 0;
                    var text = data.text || 0;

                    var label = that.getLabelElement({
                        x: x,
                        y: y,
                        text: data.text
                    });

                    var label_w = label.width();
                    var label_h = label.height();
                    var label_left = label.offset().left;
                    var label_right = label.offset().left + label_w;
                    var label_top = label.offset().top - $(document).scrollTop();
                    var label_bottom = label.offset().top + label_h;

                    var margin = 10;

                    var conn_left = {
                        x: label_left - margin,
                        y: label_top + Math.round(label_h / 2)
                    };

                    var conn_right = {
                        x: label_right + margin,
                        y: label_top + Math.round(label_h / 2)
                    };

                    var conn_top = {
                        x: label_left + Math.round(label_w / 2),
                        y: label_top - margin
                    };

                    var conn_bottom = {
                        x: label_left + Math.round(label_w / 2),
                        y: label_bottom + margin
                    };

                    label.detach();

                    setTimeout(function () {

                        $('#enjoyhint_label').remove();
                        label.appendTo(that.enjoyhint);
                    }, that.options.animation_time / 2);

                    return {
                        label: label,
                        left: label_left,
                        right: label_right,
                        top: label_top,
                        bottom: label_bottom,
                        conn: {
                            left: conn_left,
                            right: conn_right,
                            top: conn_top,
                            bottom: conn_bottom
                        }

                    };
                };

                that.renderArrow = function (data) {

                    if (window.innerWidth >= 640) {

                        var x_from = data.x_from || 0;
                        var y_from = data.y_from || 0;
                        var x_to = data.x_to || 0;
                        var y_to = data.y_to || 0;
                        var by_top_side = data.by_top_side;
                        var control_point_x = 0;
                        var control_point_y = 0;
                        if (by_top_side) {

                            if (y_from >= y_to) {

                                control_point_y = y_to;
                                control_point_x = x_from;
                            } else {

                                control_point_y = y_from;
                                control_point_x = x_to;
                            }
                        } else {

                            if (y_from >= y_to) {

                                control_point_y = y_from;
                                control_point_x = x_to;
                            } else {

                                control_point_y = y_to;
                                control_point_x = x_from;
                            }
                        }
                    }


                    var text = data.text || '';
                    that.enjoyhint.addClass(that.cl.svg_transparent);

                    setTimeout(function () {

                        $('#enjoyhint_arrpw_line').remove();

                        var d = 'M' + x_from + ',' + y_from + ' Q' + control_point_x + ',' + control_point_y + ' ' + x_to + ',' + y_to;
                        that.$svg.append(makeSVG('path', {style: "fill:none; stroke:rgb(255,255,255); stroke-width:3", 'marker-end': "url(#arrowMarker)", d: d, id: 'enjoyhint_arrpw_line'}));
                        that.enjoyhint.removeClass(that.cl.svg_transparent); 

                    }, that.options.animation_time / 2);
                };

                that.getLabelElement = function(data) {

                    return $('<div>', { "class": 'enjoy_hint_label', id: 'enjoyhint_label',unselectable : "on" })
                        .css({
                            'top': data.y + 'px',
                            'left': data.x + 'px'
                        })
                        .html(data.text).on("mousedown",
                            function(e) {
                                var startX = e.pageX;
                                var startY = e.pageY;
                                var initialD = $('#enjoyhint_arrpw_line').attr('d');
                                function updateD(initialD, dx, dy) {
                                    var initialCoords = initialD.split(' ');
                                    var currentX = Number(initialCoords[0].split(',')[0].substr(1));
                                    var currentY = Number(initialCoords[0].split(',')[1]);
                                    initialCoords[0] = 'M' + (currentX + dx) + ',' + (currentY + dy);
                                    return initialCoords.join(' ');
                                }
                                var elem = e.target;
                                this.classList.add('drag');
                                $("body").on("mousemove.enjoyhint",
                                    function(ee) {
                                        var y = ee.pageY - startY;
                                        var x = ee.pageX - startX;
                                        $(elem).css("transform", "translate3d(" + x + "px," + y + "px,0px)");
                                        if (initialD && initialD.length)  $('#enjoyhint_arrpw_line').attr('d', updateD(initialD, x, y));
                                    }).on("mouseup.enjoyhint", function (ee) {
                                        var y = ee.pageY - startY;
                                        var x = ee.pageX - startX;
                                        if (initialD && initialD.length) {
                                            initialD = updateD(initialD, x, y);
                                            $('#enjoyhint_arrpw_line').attr('d', initialD);
                                            
                                        }
                                        $(elem).css("transform", "translate3d(0px,0px,0px)");
                                        $(elem).css("left", ($(elem).position().left + x) + "px");
                                        $(elem).css("top", ($(elem).position().top + y) + "px");
                                        $(elem).removeClass("drag");
                                        $("body").off("mousemove.enjoyhint");
                                        $("body").off("mouseup.enjoyhint");
                                });
                            }
                        ).appendTo(that.enjoyhint);
                    };

                that.disableEventsNearRect = function (rect) {
                    function disableHandler(e) {
                        if ($body.hasClass("enjoyhint-disabled-ui") && !($(e.target).hasClass(that.cl.next_btn) || $(e.target).hasClass(that.cl.close_btn) || $(e.target).hasClass(that.cl.skip_btn))) {
                            e.stopPropagation();
                            e.preventDefault();
                        }
                    }
                    if (this.stepData.disableUI) {
                        $body.addClass('enjoyhint-disabled-ui');
                        document.addEventListener("click", disableHandler, true);
                    } else {
                        document.removeEventListener("click", disableHandler);
                        $body.removeClass('enjoyhint-disabled-ui', disableHandler)
                    } 
                    

                    $top_dis_events.css({
                        top: '0',
                        left: '0'
                    }).height(rect.top+5);

                    $bottom_dis_events.css({
                        top: (rect.bottom -5) + 'px',
                        left: '0'
                    });

                    $left_dis_events.css({
                        top: '0',
                        left: 0 + 'px'
                    }).width(rect.left);

                    $right_dis_events.css({
                        top: '0',
                        left: rect.right + 'px'
                    });
                };

                (function($) {

                    $.event.special.destroyed = {

                        remove: function(o) {

                            if (o.handler) {

                                o.handler()
                            }
                        }
                    }
                })(jQuery);

                that.renderLabelWithShape = function (data) {

                    that.stepData = data;

                    function findParentDialog(element) {

                        if (element.tagName === "MD-DIALOG") {

                            return element;
                        } else if (typeof element.tagName == "undefined") {

                            return null;
                        } else {

                            return findParentDialog($(element).parent()[0]);
                        }
                    }

                    var dialog = findParentDialog($(that.stepData.enjoyHintElementSelector)[0]);

                    if (dialog != null) {

                        $(dialog).on('dialogClosing', function() {

                            that.stopFunction();
                            return;
                        });
                    }

                    that.resetComponentStuff();

                    var shape_type = data.shape || 'rect';
                    var shape_data = {};

                    var half_w = 0;
                    var half_h = 0;

                    var shape_offsets = {
                        top: data.top || 0,
                        bottom: data.bottom || 0,
                        left: data.left || 0,
                        right: data.right || 0
                    };

                    switch (shape_type) {

                        case 'circle':

                            half_w = half_h = data.radius;

                            var sides_pos = {
                                top: data.center_y - half_h + shape_offsets.top,
                                bottom: data.center_y + half_h - shape_offsets.bottom,
                                left: data.center_x - half_w + shape_offsets.left,
                                right: data.center_x + half_w - shape_offsets.right
                            };

                            var width = sides_pos.right - sides_pos.left;
                            var height = sides_pos.bottom - sides_pos.top;
                            data.radius = Math.round(Math.min(width, height) / 2);

                            //new half habarites
                            half_w = half_h = Math.round(data.radius / 2);

                            var new_half_w = Math.round(width / 2);
                            var new_half_h = Math.round(height / 2);

                            //new center_x and center_y
                            data.center_x = sides_pos.left + new_half_w;
                            data.center_y = sides_pos.top + new_half_h;

                            shape_data = that.renderCircle({
                                x: data.center_x,
                                y: data.center_y,
                                r: data.radius
                            });

                            break;

                        case 'rect':

                            half_w = Math.round(data.width / 2);
                            half_h = Math.round(data.height / 2);

                            var sides_pos = {
                                top: data.center_y - half_h + shape_offsets.top,
                                bottom: data.center_y + half_h - shape_offsets.bottom,
                                left: data.center_x - half_w + shape_offsets.left,
                                right: data.center_x + half_w - shape_offsets.right
                            };

                            data.width = sides_pos.right - sides_pos.left;
                            data.height = sides_pos.bottom - sides_pos.top;

                            half_w = Math.round(data.width / 2);
                            half_h = Math.round(data.height / 2);

                            //new center_x and center_y
                            data.center_x = sides_pos.left + half_w;
                            data.center_y = sides_pos.top + half_h;

                            shape_data = that.renderRect({
                                x: data.center_x,
                                y: data.center_y,
                                w: data.width,
                                h: data.height,
                                r: data.radius
                            }, 0.2);

                            break;
                    }

                    var body_size = {
                        w: that.enjoyhint.width(),
                        h: that.enjoyhint.height()
                    };

                    var label = that.getLabelElement({
                        x: 0,
                        y: 0,
                        text: data.text
                    });

                    var label_width = label.outerWidth();
                    var label_height = label.outerHeight();
                    label.remove();
                    var top_offset = data.center_y - half_h;
                    var bottom_offset = body_size.h - (data.center_y + half_h);
                    var left_offset = data.center_x - half_w;
                    var right_offset = body_size.w - (data.center_x + half_w);

                    var label_hor_side = (body_size.w - data.center_x) < data.center_x ? 'left' : 'right';
                    var label_ver_side = (body_size.h - data.center_y) < data.center_y ? 'top' : 'bottom';
                    var label_shift = 150;
                    var label_margin = 40;
                    var label_shift_with_label_width = label_shift + label_width + label_margin;
                    var label_shift_with_label_height = label_shift + label_height + label_margin;
                    var label_hor_offset = half_w + label_shift;
                    var label_ver_offset = half_h + label_shift;

                    //original: var label_x = (label_hor_side == 'left') ? data.center_x - label_hor_offset - label_width : data.center_x + label_hor_offset;
                    var label_y = (label_ver_side == 'top') ? data.center_y - label_ver_offset - label_height : data.center_y + label_ver_offset;
                    var label_x = window.innerWidth / 2 - label_width / 2;

                    if (top_offset < label_shift_with_label_height && bottom_offset < label_shift_with_label_height) {

                        label_y = data.center_y + label_margin;
                    }

                    if (window.innerWidth <= 640) {

                    }

                    var label_data = that.renderLabel({
                        x: label_x,
                        y: label_y,
                        text: data.text
                    });

                    that.$next_btn.css({
                        left: label_x,
                        top: label_y + label_height + 20
                    });

                    var left_skip = label_x + that.$next_btn.width() + 10;

                    if (that.nextBtn == "hide"){

                        left_skip = label_x;
                    }

                    that.$skip_btn.css({
                        left: left_skip,
                        top: label_y + label_height + 20
                    });

                    that.$close_btn.css({
                        right : 10,
                        top: 10
                    });

                    that.disableEventsNearRect({
                        top: shape_data.top,
                        bottom: shape_data.bottom,
                        left: shape_data.left,
                        right: shape_data.right
                    });

                    var x_to = 0;
                    var y_to = 0;
                    var arrow_side = false;
                    var conn_label_side = 'left';
                    var conn_circle_side = 'left';

                    var is_center = (label_data.left <= shape_data.x && label_data.right >= shape_data.x);
                    var is_left = (label_data.right < shape_data.x);
                    var is_right = (label_data.left > shape_data.x);

                    var is_abs_left = (label_data.right < shape_data.left);
                    var is_abs_right = (label_data.left > shape_data.right);

                    var is_top = (label_data.bottom < shape_data.top);
                    var is_bottom = (label_data.top > shape_data.bottom);
                    var is_mid = (label_data.bottom >= shape_data.y && label_data.top <= shape_data.y);
                    var is_mid_top = (label_data.bottom <= shape_data.y && !is_top);
                    var is_mid_bottom = (label_data.top >= shape_data.y && !is_bottom);


                    function setArrowData(l_s, c_s, a_s) {

                        conn_label_side = l_s;
                        conn_circle_side = c_s;
                        arrow_side = a_s;
                    }

                    function sideStatements(top_s, mid_top_s, mid_s, mid_bottom_s, bottom_s) {

                        var statement = [];

                        if (is_top) {

                            statement = top_s;
                        } else if (is_mid_top) {

                            statement = mid_top_s;
                        } else if (is_mid) {

                            statement = mid_s;
                        } else if (is_mid_bottom) {

                            statement = mid_bottom_s;
                        } else {//bottom

                            statement = bottom_s;
                        }

                        if (!statement) {

                            return;
                        } else {

                            setArrowData(statement[0], statement[1], statement[2]);
                        }
                    }

                    if (is_center) {

                        if (is_top) {

                            setArrowData('bottom', 'top', 'top');
                        } else if (is_bottom) {

                            setArrowData('top', 'bottom', 'bottom');
                        } else {
                            $('#enjoyhint_arrpw_line').remove();
                            return;
                        }

                    } else if (is_left) {

                        sideStatements(
                            ['right', 'top', 'top'],//top
                            ['bottom', 'left', 'bottom'],//mid_top
                            ['right', 'left', 'top'],//mid
                            ['top', 'left', 'top'],//mid_bot
                            ['right', 'bottom', 'bottom']//bot
                        );

                    } else {//right

                        sideStatements(
                            ['left', 'top', 'top'],//top
                            ['bottom', 'right', 'bottom'],//mid_top
                            ['left', 'right', 'top'],//mid
                            ['top', 'right', 'top'],//mid_bot
                            ['left', 'bottom', 'bottom']//bot
                        );

                    }

                    var label_conn_coordinates = label_data.conn[conn_label_side];
                    var circle_conn_coordinates = shape_data.conn[conn_circle_side];
                    var by_top_side = (arrow_side == 'top');
                    if (!data.skipArrow) {
                    that.renderArrow({
                        x_from: label_conn_coordinates.x,
                        y_from: label_conn_coordinates.y,
                        x_to: window.innerWidth < 640 ? shape_data.left + (shape_data.left > 0) : circle_conn_coordinates.x,
                        y_to: window.innerWidth < 640 ? shape_data.conn.left.y : circle_conn_coordinates.y,
                        by_top_side: by_top_side
                    }) } else {
                        $('#enjoyhint_arrpw_line').remove();
                    };

                };

                that.clear = function () {

                    that.ctx.clearRect(0, 0, 3000, 2000);
                };

                return this;
            });
        },

        setProgress : function(current, total) {
            if (that.$progress_panel) {
                var getPie = function(val) {
                    var p = parseFloat(val);
                    var NS = "http://www.w3.org/2000/svg";
                    var svg = document.createElementNS(NS, "svg");
                    var circle1 = document.createElementNS(NS, "circle");
                    circle1.setAttribute("r", 15);
                    circle1.setAttribute("cx", 20);
                    circle1.setAttribute("cy", 20);
                    circle1.setAttribute("fill", "transparent");
                    circle1.setAttribute("stroke-linecap", "butt");
                    circle1.setAttribute("stroke-width", "2pt");
                    circle1.setAttribute("stroke", "black");
                    var circle = document.createElementNS(NS, "circle");
                    circle.setAttribute("r", 15);
                    circle.setAttribute("cx", 20);
                    circle.setAttribute("cy", 20);
                    circle.setAttribute("fill", "transparent");                    
                    circle.setAttribute("stroke-linecap", "butt");
                    circle.setAttribute("stroke-width", "2pt");
                    circle.setAttribute("stroke", "white");
                    circle.setAttribute("stroke-dasharray", p + " 100");

                    svg.setAttribute("viewBox", "0 0 40 40");
                    svg.setAttribute("style", "transform: rotate(270deg);");
                    svg.appendChild(circle1);
                    svg.appendChild(circle);
                    return svg;
                }
                $(that.$progress_panel).html(getPie((current / total) * 100)); //.text(current + "/" + total);
            }
        },

        set: function (val) {

            this.each(function () {

                this.enjoyhint_obj.setValue(val);
            });

            return this;
        },

        show: function () {

            this.each(function () {

                this.enjoyhint_obj.show();
            });

            return this;
        },

        hide: function () {

            this.each(function () {

                this.enjoyhint_obj.hide();
            });

            return this;
        },

        hide_next: function () {

            this.each(function () {

                this.enjoyhint_obj.hideNextBtn();
            });

            return this;
        },

        show_next: function () {

            this.each(function () {

                this.enjoyhint_obj.showNextBtn();
            });

            return this;
        },

        hide_skip: function () {

            this.each(function () {

                this.enjoyhint_obj.hideSkipBtn();
            });

            return this;
        },

        show_skip: function () {

            this.each(function () {

                this.enjoyhint_obj.showSkipBtn();
            });

            return this;
        },

        render_circle: function (x, y, r) {

            this.each(function () {

                this.enjoyhint_obj.renderCircle(x, y, r);
            });

            return this;
        },

        render_label: function (x, y, r) {

            this.each(function () {

                this.enjoyhint_obj.renderLabel(x, y, r);
            });

            return this;
        },

        render_label_with_shape: function (data, stopFunction) {

            this.each(function () {

                that.stopFunction = stopFunction;
                this.enjoyhint_obj.renderLabelWithShape(data);
            });

            return this;
        },

        redo_events_near_rect: function(rect) {

            that.disableEventsNearRect({
                top: rect.top,
                bottom: rect.bottom,
                left: rect.left,
                right: rect.right
            });
        },

        clear: function () {

            this.each(function () {

                this.enjoyhint_obj.clear();
            });

            return this;
        },

        close: function (val) {

            this.each(function () {

                this.enjoyhint_obj.closePopdown();
            });

            return this;
        }
    };

    $.fn.enjoyhint = function (method) {

        if (methods[method]) {

            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {

            return methods.init.apply(this, arguments);
        } else {

            $.error('Method ' + method + ' does not exist on $.numinput');
        }

        return this;
    };
})(window.jQuery);