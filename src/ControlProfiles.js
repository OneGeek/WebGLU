/** @ignore Wrapper function to allow multifile or single file organization */
$W.initControlProfiles = function() {
    if (typeof($G) === 'undefined') {
        $W.useGameGLU();
    }

    
    /** For dropin control systems
     * @namespace Control Profiles
     */
    $G.profiles = {};
        
    $W.camera.profileUpdates = [];
    $W.camera.update = function() {
        for (var i = 0; i < this.profileUpdates.length; i++) {
            this.profileUpdates[i](this);
        }
    };

     
    /** @class A input handling and camera updating control profile
     * @memberOf $G.profiles
     */
    $G.profiles.Profile = function() {
        this.apply = function Profile_apply() {
            this.controls();
            this.camera();
        };
    };

    /** Click-dragging will rotate the camera
     */
    $G.profiles.DragToRotateCamera = new function() {
        $G.profiles.Profile.call(this);

        this.controls = function DragToRotateCamera_controls() {
            var st = $G.state;

            st.mouseDown    = false;
            st.wasMouseDown = false;
            st.lastM  = $V([0,0]);
            st.posM   = $V([0,0]);
            st.deltaM = $V([0,0]);
            st.totalM = $V([0,0]);

            $G.bind('-m1', function(x,y) {
                    st.mouseDown = false;
            });

            $G.bind('+m1', function(x,y) {
                    st.mouseDown = true;
                    st.lastM.elements = [x, y];
                    st.posM.elements = [x,y];
            });

            $G.bind('mousemove', function(x,y) {
                if (st.mouseDown && st.wasMouseDown) {
                    // avoid moving around when we click then release, move
                    // the mouse, then click again.
                    st.lastM.elements = st.posM.elements;
                    st.posM.elements = [x, y];
                    st.deltaM = st.posM.subtract(st.lastM);
                    st.totalM = st.totalM.add(st.deltaM);
                }
                st.wasMouseDown = st.mouseDown;
            });

        };

        this.camera = function DragToRotateCamera_camera() {
            var st = $G.state;
            $W.camera.profileUpdates.push(function(camera) {

                var x = -1 * st.totalM.e(1);
                var y = st.totalM.e(2);

                x /= 100;
                y /= 100;

                camera.target.elements = [Math.cos(x), y, Math.sin(x)];
                st.deltaM.elements = [0,0];
            });
        };
    }();

    /** Scrolling the mouse will zoom the camera
     */
    $G.profiles.ScrollToZoomCamera = new function() {
        $G.profiles.Profile.call(this);

        this.controls = function DragToRotateCamera_controls() {
            var st = $G.state;

            st.zoom = $W.camera.yfov;

            $G.bind('mousewheel', function(delta) {
                    st.zoom -= delta * 1.5;
                    st.zoom = Math.max(10, st.zoom);
                    st.zoom = Math.min(90, st.zoom);
            });

        };

        this.camera = function DragToRotateCamera_camera() {
            var st = $G.state;
            $W.camera.profileUpdates.push(function(camera) {
                camera.yfov = st.zoom;
            });
        };
    }();


};
/** @author Benjamin DeLillo */
/*
     *  Copyright (c) 2009-2010 Benjamin P. DeLillo
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


