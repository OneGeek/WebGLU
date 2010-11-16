$W.initGameGLU = function() {
    /*
     *  Copyright (c) 2009 Benjamin P. DeLillo
     *  
     *  Permission is hereby granted, free of charge, to any person
     *  obtaining a copy of this software and associated documentation
     *  files (the "Software"), to deal in the Software without
     *  restriction, including without limitation the rights to use,
     *  copy, modify, merge, publish, distribute, sublicense, and/or sell
     *  copies of the Software, and to permit persons to whom the
     *  Software is furnished to do so, subject to the following
     *  conditions:
     *  
     *  The above copyright notice and this permission notice shall be
     *  included in all copies or substantial portions of the Software.
     *  
     *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
     *  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
     *  OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
     *  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
     *  HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
     *  WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
     *  FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
     *  OTHER DEALINGS IN THE SOFTWARE.
     */

    $G = {
        offsetX:0,
        offsetY:0,

        SimulatedWorld:{
            objects:[]
        },

        SphereSimulation:{

        },

        state:{},

        mouse: {
            LB:1,
            RB:2
        },

        keys:{
            backspace :  8, tab  :  9, enter : 13,
            shift     : 16, ctrl : 17, alt   : 18,
            pause_break : 19,
            caps_lock   : 20, esc: 27, space : 32,
            pgup : 33, pgdown : 34,
            end  : 35, home   : 36,
            left : 37, up : 38, right : 39, down : 40,
            insert : 45, del: 46,
            0 : 48, 1 : 49, 2 : 50, 3 : 51, 4 : 52,
            5 : 53, 6 : 54, 7 : 55, 8 : 56, 9 : 57,
            a : 65, b : 66, c : 67, d : 68, e : 69,
            f : 70, g : 71, h : 72, i : 73, j : 74,
            k : 75, l : 76, m : 77, n : 78, o : 79,
            p : 80, q : 81, r : 82, s : 83, t : 84,
            u : 85, v : 86, w : 87, x : 88, y : 89, z : 90,
            win : 91,
            num0 :  96, num1 :  97, num2 :  98, num3 :  99, num4 : 100,
            num5 : 101, num6 : 102, num7 : 103, num8 : 104, num9 : 105,
            multiply : 106, plus : 107, minus : 109, dot : 110, divide : 111,
            f1 : 111,  f2 : 113,  f3 : 114,  f4 : 115,
            f5 : 116,  f6 : 117,  f7 : 118,  f8 : 119,
            f9 : 120, f10 : 120, f11 : 122, f12 : 123,
            num_lock : 144, scroll_lock : 145,
            comma : 186, equals : 187, dash         : 189, period    : 190,
            slash : 191, tilde  : 192, left_bracket : 219, backslash : 220,
            right_bracket : 221, single_quote : 222
        },

        event:{
            _keys:[],
            _actions:[],

            _initialize:function() {
                var BIND = addEventListener;
                var actions = $G.event._actions;

                BIND("keydown", function(ev) {
                    if (actions['+' + ev.keyCode] !== undefined) {
                        actions['+' + ev.keyCode]();
                    } }, false);

                BIND("keyup", function(ev) {
                    if (actions['-' + ev.keyCode] !== undefined) {
                        actions['-' + ev.keyCode]();
                    } }, false);

                var M = $G.mouse;
                actions['+mouse'] = [];
                actions['+mouse'][M.LB] = function(x,y){};
                actions['+mouse'][M.RB] = function(x,y){};

                actions['-mouse'] = [];
                actions['-mouse'][M.LB] = function(x,y){};
                actions['-mouse'][M.RB] = function(x,y){};

                actions['mousemove'] = function(x,y){};

                BIND("mousedown", function(ev) {
                    actions['+mouse'][ev.which](
                        ev.clientX - $G.offsetX, ev.clientY - $G.offsetY);
                }, false);

                BIND("mouseup", function(ev) {
                    actions['-mouse'][ev.which](
                        ev.clientX -  $G.offsetX, ev.clientY -  $G.offsetY);
                }, false);

                BIND("mousemove", function(ev) {
                    actions['mousemove'](
                        ev.clientX -  $G.offsetX, ev.clientY -  $G.offsetY);
                }, false);

                BIND("DOMMouseScroll", function(ev) {
                    actions['mousewheel'](ev);
                }, false);
            },

            /** 
             */
            bindOnElement:function(element, eventName, action) {
                element.addEventListener(eventName, action, false);
            },


            /* Add this key to the list of bound keys so we can only
             * try to call functions for keys that have been bound.
             *
             * Associate the corresponding keycode with the passed function
             * in the function array.
             *
             * '+keyname' or 'keyname' binds to the keydown event
             * '-keyname' binds to keyup
             * @param
             */
            bind:function(key, action) {
                var M = $G.mouse
                var actions = $G.event._actions;

                // Elements
                if (arguments.length === 3) {
                    arguments[0].addEventListener(arguments[1], arguments[2]);

                // Mousebuttons XXX Kludge?
                }else if (key == "+m1" || key == "m1") {
                    actions['+mouse'][M.LB] = action;

                }else if (key == "+m2" || key == "m2") {
                    actions['+mouse'][M.RB] = action;

                }else if (key == "-m1") {
                    actions['-mouse'][M.LB] = action;

                }else if (key == "-m2") {
                    actions['-mouse'][M.RB] = action;

                }else if (key == "mousemove") {
                    actions['mousemove'] = action;

                }else if (key == "mousewheel") {
                    actions['mousewheel'] = action;
                

                // Keys
                }else if (key[0] == "+" || key[0] == "-") {

                    if (key[0] == "+") {
                        key = $G.keys[key.slice(1)];
                        actions['+' + key] = action;

                    }else if (key[0] == "-") {
                        key = $G.keys[key.slice(1)];
                        actions['-' + key] = action;
                    }

                // Default to keydown
                }else {
                    key = $G.keys[key];
                    actions['+' + key] = action;
                }
            },
        },

        initialize:function() {
            $G.event._initialize();
            if ($W !== undefined) {
                $G.offsetX = $W.canvas.offsetLeft;
                $G.offsetY = $W.canvas.offsetTop;
            }
        }
    }

};
