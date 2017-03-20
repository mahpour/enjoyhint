window.enjoyhintcounter = 0;
window.EnjoyHint = function (_options) {

    var $event_element;
    var that = this;
    that.id = ++window.enjoyhintcounter;
    var defaults = {

        maxElementSearchAttempt :200,

        onStart: function () {

        },

        onEnd: function () {

        },

        onSkip: function () {

        },

        onNext: function () {

        }
    };

    

    this.options = $.extend(defaults, _options);
    this.data = [];
    this.current_step = 0;
    this.timerHandler = null;

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

                that.nextStep();
            },

            onSkipClick: function () {

                that.options.onSkip();
                that.skipAll();
            }
        });
    };

    var lockTouch = function(e) {

        e.preventDefault();
    };

    that.destroyEnjoy = function () {
        $body.removeClass('enjoyhint-disabled-ui');
        that.stopElementMonitoring();
        $('.enjoyhint').remove();
        $body.css({ 'overflow': 'auto' });
        //window.removeEventListener('resize.enjoyhint');
        $(document).off("touchmove", lockTouch);
        $(document).off(".enjoyhint");
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
        var max_habarites = Math.max($element.outerWidth() || Number($element.attr('width')), $element.outerHeight() || Number($element.attr('height')));
        var radius = step_data.radius || Math.round(max_habarites / 2) + 5;
        var offset = $element.offset();
        var w = $element.outerWidth() || Number($element.attr('width'));
        var h = $element.outerHeight() || Number($element.attr('height'));
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

    var makeEventName = function (name, is_custom) {

        return name + (is_custom ? 'custom' : '') + '.enjoy_hint';
    };
    var on = function(event_name, callback) {
        $body.on(makeEventName(event_name, true), callback);
    };

    var off = function (event_name) {
        $body.off(makeEventName(event_name, true));
    };
    
    that.stepAction = function () {
        
        console.log('step_index:', that.id+": "+that.current_step);
        $body.enjoyhint('setProgress', that.current_step + 1, that.data.length);
        if (!(that.data && that.data[that.current_step])) {
            $body.removeClass('enjoyhint-disabled-ui');
            $body.enjoyhint('hide');
            that.options.onEnd();
            that.destroyEnjoy();
            return;
        }

        that.options.onNext();

        var $enjoyhint = $('.enjoyhint');

        $enjoyhint.removeClass("enjoyhint-step-" + that.current_step);
        $enjoyhint.removeClass("enjoyhint-step-" + (that.current_step + 1));
        $enjoyhint.addClass("enjoyhint-step-" + (that.current_step + 1));

        var step_data = that.data[that.current_step];

        if (step_data.onBeforeStart && typeof step_data.onBeforeStart === 'function') {

            step_data.onBeforeStart();
        }

        var timeout = step_data.timeout || 0;
        setTimeout(function () {

            that.clear();
        }, 250);

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

            

            $(document.body).scrollTo(step_data.selector, step_data.scrollAnimationSpeed || 250, {offset: -100});

            var waitForElementFn = function (callbackFn, timeOut, maxAttempts) {
                    if (that.elementSearchTimer != null) {
                        clearInterval(that.elementSearchTimer);
                        that.elementSearchTimer = null;
                    }
                    that.elementSearchTimer = setInterval(function () {
                        var step_data = that.data[that.current_step];
                        var $element = $(step_data.selector);
                        maxAttempts--;
                        if (maxAttempts<=0 && !$element.length) {
                            clearInterval(that.elementSearchTimer);
                            if (console && console.log) {
                                console.log("element not found: " + step_data.selector);
                            }
                            return;
                        }
                        if (!$element.length || !$element.is(":visible")) {
                            if (console && console.log) {
                                console.log("searching for element: " + step_data.selector);
                            }
                            //waitForElementFn(callbackFn, timeOut, maxAttempts - 1);                            
                        }
                        else {
                            if ($element && $element.length && $element[0].scrollIntoView) {
                                $element[0].scrollIntoView();
                            }
                            clearInterval(that.elementSearchTimer);
                            callbackFn();
                        }
                    }, timeOut);
            }

            //wait until expected element appears asynchronously
            var action = function () {
                var step_data = that.data[that.current_step];
                //var current_step = that.current_step;
                //var data = that.data;
                var $element = $(step_data.selector).first();
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

                            that.current_step++;
                            that.stepAction();

                            return;
                            break;

                        case 'custom':
                            
                            on(step_data.event, function (e, data) {
                                step_data = that.data[that.current_step];
                                if (data != undefined && data.constructor !== MouseEvent) { // if custom event has passed an instance of the action that was triggered at that time 
                                    
                                    if (step_data.event === data.event && step_data.selector === data.selector) {
                                        that.current_step++;
                                        console.log('step trigger:', that.current_step);
                                        off(step_data.event);
                                        that.stepAction();
                                    }
                                } else if (data != undefined && data.constructor === MouseEvent &&  $(step_data.selector)[0] === data.currentTarget) {
                                    that.current_step++;
                                    console.log('step trigger:', that.current_step);
                                    off(step_data.event);
                                    that.stepAction();
                                } 
                            });

                            break;

                        case 'next':

                            $body.enjoyhint('show_next');
                            break;
                    }

                } else {
                    $body.off('click.enjoyhint');
                    $event_element.on(event, function (e) {
                        step_data = that.data[that.current_step];
                        if (step_data.keyCode && e.keyCode != step_data.keyCode) {

                            return;
                        }

                        if (this  === $(step_data.selector)[0]) {
                            that.current_step++;
                            $(this).off(event);
                            that.stepAction();
                        }
                        
                         // clicked
                    });
                    
                    

                }

                var shape_data = getShapeDatafromStepData(step_data);
                that.last_shape_data = shape_data;                
                var progressPercentage = Math.round(((that.current_step + 1) / that.data.length) * 100) + "%";
                $body.enjoyhint('render_label_with_shape', shape_data, that.stop, progressPercentage);
            }
            if (that.current_step + 1 < that.data.length && that.data[that.current_step + 1].event === 'next') {
                action();
            } else {
                waitForElementFn(action, step_data.scrollAnimationSpeed + 20 || 270, that.options.maxElementSearchAttempt);
            }
        }, timeout);
    };

    that.nextStep = function() {

        that.current_step++;
        that.stepAction();
    };

    that.skipAll = function() {

        var step_data = that.data[that.current_step];
        if (step_data && step_data.selector) {
            var $element = $(step_data.selector);
            off(step_data.event);
            $element.off(makeEventName(step_data.event));
        }
        that.destroyEnjoy();
    };

    


    /********************* PUBLIC METHODS ***************************************/

    window.addEventListener('resize.enjoyhint', function() {
        if ($event_element != null && $event_element.length) {
            $body.enjoyhint('redo_events_near_rect', $event_element[0].getBoundingClientRect());
        }
    }.bind(that));

    that.stop = function() {

        that.skipAll();
    };

    that.reRunScript = function(cs) {

        that.current_step = cs;
        that.stepAction();
    };

    that.monitorElementAnimations=function() {
        var that = this;
        var current_step = that.current_step;
        var step_data = that.data[current_step];
        if (step_data) {
            var shape_data = getShapeDatafromStepData(step_data);
            if (shape_data && that.last_shape_data && (shape_data.center_x != that.last_shape_data.center_x || shape_data.center_y != that.last_shape_data.center_y)) {
                that.last_shape_data = shape_data;
                var $element = $(step_data.selector);
                if ($element) {
                    if ($event_element != null) {
                        var progressPercentage = Math.round(((current_step + 1)/ that.data.length) * 100) + "%";
                        $body.enjoyhint('render_label_with_shape', shape_data, that.stop,progressPercentage);
                        //$body.enjoyhint('redo_events_near_rect', $event_element[0].getBoundingClientRect());
                    }
                    
                }
            }
            if ($(step_data.selector).offset().top > $(window).height()) {
                $(step_data.selector)[0].scrollIntoView();
            }
        }
    }
    that.stopElementMonitoring=function() {
        window.clearInterval(that.timerHandler);
        that.timerHandler = null;
    }
    that.init = init;
    that.runScript = function () {
        if (that.timerHandler) {
            stopElementMonitoring();
        }
        //setupCssAnimationObserver()
        that.timerHandler = window.setInterval(that.monitorElementAnimations.bind(that), 1000);
        that.current_step = 0;
        that.options.onStart.apply(that);
        that.stepAction();
    };

    that.resumeScript = function () {

        stepAction();
    };

    that.setCurrentStep = function(cs) {

        that.current_step = cs;
    };

    that.getCurrentStep = function () {

        return that.current_step;
    };

    that.trigger = function (event_name) {

        switch (event_name) {

            case 'next':

                that.nextStep();
                break;

            case 'skip':

                that.skipAll();
                break;
        }
    };

    that.setScript = function (_data) {

        if (_data) {

            that.data = _data;
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
}
