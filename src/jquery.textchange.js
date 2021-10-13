(function($) {
    'use strict';

    var $timerId = -1;
    var $objects = [];

    var method = {
        checkDelayed: function()
        {
            for (var i = 0; i < $objects.length; i++) {
                var obj = $objects[i];
                var val = obj.inp.value;

                if (obj.dt > 0 && (new Date()).getTime() - obj.dt >= obj.to) {
                    method.triggerEvent(obj, val);
                }
            }
        },

        checkChanges: function(obj)
        {
            var val = obj.inp.value;

            if (obj.val != val) {
                if (obj.to > 0) {
                    obj.dt = (new Date()).getTime();
                } else {
                    method.triggerEvent(obj, val);
                }

                obj.val = val;
            }
        },

        triggerEvent: function(obj, val)
        {
            if (obj.old == val) {
                return;
            }

            $(obj.inp).trigger('textchange' + (obj.ns == '' ? '' : '.' + obj.ns), [obj.guid]);

            obj.old = val;
            obj.dt = 0;
        },

        eventString: function(namespace)
        {
            var events = [
                'input',
                'change',
                'propertychange',
                'paste',
                'focusout',
            ];

            if (namespace != '') {
                $.each(events, function(index, event) {
                    events[index] += '.' + namespace;
                });
            }

            return events.join(' ');
        },
    };

    $.fn.textchange = function(data, handler)
    {
        if ($.isFunction(data)) {
            handler = data;
            data = 0;
        }
        
        if (handler === undefined) {
            $(this).off('textchange');
        } else {
            $(this).on('textchange', data, handler);
        }
    }
    
    $.event.special.textchange = {
        setup: function(data, namespaces)
        {
            if ($timerId < 0) {
                $timerId = setInterval(method.checkDelayed, 1);
            }
        },

        teardown: function(namespaces)
        {
            if ($timerId > -1) {
                clearInterval($timerId);
                $timerId = -1;
            }
        },

        add: function(handleObj)
        {
            var timeout = handleObj.data, handler = handleObj.handler;

            if (timeout === undefined) {
                timeout = 0;
            }

            $(this).each(function(key, inp) {
                if ($.isFunction($(inp).val)) {
                    var obj = {
                        inp: inp,
                        guid: handleObj.guid,
                        val: $(inp).val(),
                        old: $(inp).val(),
                        ns: handleObj.namespace,
                        to: timeout,
                        dt: 0,
                    };

                    $(inp).on(method.eventString(handleObj.namespace), function(e) {
                        if (e.type == 'focusout') {
                            method.triggerEvent(obj, $(this).val());
                        } else {
                            method.checkChanges(obj);
                        }
                    });

                    $objects.push(obj);
                }
            });

            if ($.isFunction(handler)) {
                handleObj.handler = function(e, guid)
                {
                    if (handleObj.guid != guid) {
                        e.preventDefault();
                    } else {
                        return handler.apply(this, arguments);
                    }
                }
            }
        },

        remove: function(handleObj)
        {
            var objects = [];

            $(this).each(function(key, inp) {
                for (var i = 0; i < $objects.length; i++) {
                    var obj = $objects[i];

                    if (obj.inp != inp || obj.ns != handleObj.namespace) {
                        objects.push(obj);
                    } else {
                        $(obj.inp).off(method.eventString(handleObj.namespace));
                    }
                }
            });

            $objects = objects;
        }
    };
})(jQuery);
