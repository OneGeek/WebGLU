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
    state:{},

    constants:{
        keycodes:{
            backspace : 8,
            tab : 9,
            enter : 13,
            shift : 16,
            ctrl : 17,
            alt : 18,
            pause_break : 19,
            caps_lock : 20,
            esc: 27,
            pgup : 33,
            pgdown : 34,
            end : 35,
            home : 36,
            left : 37,
            up : 38,
            right : 39,
            down : 40,
            insert : 45,
            del: 46,
            0 : 48,
            1 : 49,
            2 : 50,
            3 : 51,
            4 : 52,
            5 : 53,
            6 : 54,
            7 : 55,
            8 : 56,
            9 : 57,
            a : 65,
            b : 66,
            c : 67,
            d : 68,
            e : 69,
            f : 70,
            g : 71,
            h : 72,
            i : 73,
            j : 74,
            k : 75,
            l : 76,
            m : 77,
            n : 78,
            o : 79,
            p : 80,
            q : 81,
            r : 82,
            s : 83,
            t : 84,
            u : 85,
            v : 86,
            w : 87,
            x : 88,
            y : 89,
            z : 90,
            win : 91,
            num0 : 96,
            num1 : 97,
            num2 : 98,
            num3 : 99,
            num4 : 100,
            num5 : 101,
            num6 : 102,
            num7 : 103,
            num8 : 104,
            num9 : 105,
            multiply : 106,
            plus : 107,
            minus : 109,
            dot : 110,
            divide : 111,
            f1 : 111,
            f2 : 113,
            f3 : 114,
            f4 : 115,
            f5 : 116,
            f6 : 117,
            f7 : 118,
            f8 : 119,
            f9 : 120,
            f10 : 120,
            f11 : 122,
            f12 : 123,
            num_lock : 144,
            scroll_lock : 145,
            comma : 186,
            equals : 187,
            dash : 189,
            period : 190,
            slash : 191,
            tilde : 192,
            left_bracket : 219,
            backslash : 220,
            right_bracket : 221,
            single_quote : 222
        }
    },

    event:{
        _keycodes:[],
        _actions:[],

        _initialize:function() {
            var kc = this._keycodes;
            kc['backspace'] = 8;
            kc['tab'] = 9;
            kc['enter'] = 13;
            kc['shift'] = 16;
            kc['ctrl'] = 17;
            kc['alt'] = 18;
            kc['pause/break'] = 19;
            kc['caps lock'] = 20;
            kc['escape'] = 27;
            kc['pgup'] = 33;
            kc['pgdown'] = 34;
            kc['end'] = 35;
            kc['home'] = 36;
            kc['left'] = 37;
            kc['up'] = 38;
            kc['right'] = 39;
            kc['down'] = 40;
            kc['insert'] = 45;
            kc['delete'] = 46;
            kc['0'] = 48;
            kc['1'] = 49;
            kc['2'] = 50;
            kc['3'] = 51;
            kc['4'] = 52;
            kc['5'] = 53;
            kc['6'] = 54;
            kc['7'] = 55;
            kc['8'] = 56;
            kc['9'] = 57;
            kc['a'] = 65;
            kc['b'] = 66;
            kc['c'] = 67;
            kc['d'] = 68;
            kc['e'] = 69;
            kc['f'] = 70;
            kc['g'] = 71;
            kc['h'] = 72;
            kc['i'] = 73;
            kc['j'] = 74;
            kc['k'] = 75;
            kc['l'] = 76;
            kc['m'] = 77;
            kc['n'] = 78;
            kc['o'] = 79;
            kc['p'] = 80;
            kc['q'] = 81;
            kc['r'] = 82;
            kc['s'] = 83;
            kc['t'] = 84;
            kc['u'] = 85;
            kc['v'] = 86;
            kc['w'] = 87;
            kc['x'] = 88;
            kc['y'] = 89;
            kc['z'] = 90;
            kc['win'] = 91;
            kc['num0'] = 96;
            kc['num1'] = 97;
            kc['num2'] = 98;
            kc['num3'] = 99;
            kc['num4'] = 100;
            kc['num5'] = 101;
            kc['num6'] = 102;
            kc['num7'] = 103;
            kc['num8'] = 104;
            kc['num9'] = 105;
            kc['num*'] = 106;
            kc['num+'] = 107;
            kc['num-'] = 109;
            kc['num.'] = 110;
            kc['num/'] = 111;
            kc['f1'] = 111;
            kc['f2'] = 113;
            kc['f3'] = 114;
            kc['f4'] = 115;
            kc['f5'] = 116;
            kc['f6'] = 117;
            kc['f7'] = 118;
            kc['f8'] = 119;
            kc['f9'] = 120;
            kc['f10'] = 120;
            kc['f11'] = 122;
            kc['f12'] = 123;
            kc['num lock'] = 144;
            kc['scroll lock'] = 145;
            kc[';'] = 186;
            kc['equal sign	'] = 187;
            kc['comma	'] = 188;
            kc['dash	'] = 189;
            kc['period	'] = 190;
            kc['forward slash	'] = 191;
            kc['grave accent	'] = 192;
            kc['open bracket	'] = 219;
            kc['back slash	'] = 220;
            kc['close braket	'] = 221;
            kc['single quote	'] = 222;
            document.addEventListener("keydown", function(ev) {
                if ($G.event._actions['+' + ev.keyCode] !== undefined) {
                    $G.event._actions['+' + ev.keyCode]();
                }

            }, false);

            document.addEventListener("keyup", function(ev) {
                if ($G.event._actions['-' + ev.keyCode] !== undefined) {
                    $G.event._actions['-' + ev.keyCode]();
                }
            
            }, false);

            // 1 and 3 are left and right mouse buttons respectively
            $G.event._actions['+mouse'] = [];
            $G.event._actions['+mouse'][1] = function(x,y){};
            $G.event._actions['+mouse'][3] = function(x,y){};

            $G.event._actions['-mouse'] = [];
            $G.event._actions['-mouse'][1] = function(x,y){};
            $G.event._actions['-mouse'][3] = function(x,y){};

            $G.event._actions['mousemove'] = function(x,y){};

            document.addEventListener("mousedown", function(ev) {
                $G.event._actions['+mouse'][ev.which](ev.screenX, ev.screenY);
            }, false);

            document.addEventListener("mouseup", function(ev) {
                $G.event._actions['-mouse'][ev.which](ev.screenX, ev.screenY);
            }, false);

            document.addEventListener("mousemove", function(ev) {
                $G.event._actions['mousemove'](ev.screenX, ev.screenY);
            }, false);
        },

        /** 
         */
        bindOnElement:function(element, eventName, action) {
            element.addEventListener(eventName, action, false);
        },


        // Add this key to the list of bound keys so we can only
        // try to call functions for keys that have been bound.
        //
        // Associate the corresponding keycode with the passed function
        // in the function array.
        //
        // '+keyname' or 'keyname' binds to the keydown event
        // '-keyname' binds to keyup
        bind:function(key, action) {
            // XXX Kludge

            if (key == "+m1" || key == "m1") {
                $G.event._actions['+mouse'][1] = action;

            }else if (key == "+m2" || key == "m2") {
                $G.event._actions['+mouse'][3] = action;

            }else if (key == "-m1") {
                $G.event._actions['-mouse'][1] = action;

            }else if (key == "-m2") {
                $G.event._actions['-mouse'][3] = action;

            }else if (key == "mousemove") {
                $G.event._actions['mousemove'] = action;
            }


            if (key[0] == "+" || key[0] == "-") {

                if (key[0] == "+") {
                    key = $G.constants.keycodes[key.slice(1)];
                    $G.event._actions['+' + key] = action;

                }else if (key[0] == "-") {
                    key = $G.constants.keycodes[key.slice(1)];
                    $G.event._actions['-' + key] = action;
                }

            // Default to keydown
            }else {
                key = $G.constants.keycodes[key];
                $G.event._actions['+' + key] = action;
            }
        },
    },

    initialize:function() {
        this.event._initialize();
    }
}

