/** @author Benjamin DeLillo */
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

/** 
 * The primary WebGLU namespace.
 * Holds drawing related data and has useful functions and objects for
 * working with WebGL.
 * @namespace The primary WebGLU namespace.
 */
$W = {

    createdObjectCount:0,
    
    /** Various paths used by WebGLU. 
     * Call $W.initPaths before using.
     */
    paths:{
        /** Path to *GLU libraries themselved */
        libsrc : "../../src/",

        /** Where shaders are stored */
        shaders : "../../shaders/",

        /** Where external libraries, like Sylvester, are stored */
        external : "../../external/",

        /** Which Sylvester lib to load
         * Sylvester.src.js or Sylvester.js
         * */
        sylvester : "Sylvester.src.js"
    },

    /** The raw WebGL object for low level work.  */
    GL : null,


    /** Renderable objects */
    renderables:[],
    pickables  :[],
    objects    :[],

    /** GLSL shaders */
    shaders  : [],

    /** GLSL shader programs */
    programs : [],

    /** Textures */
    textures : [],

    /** Model-View transform matrix */
    modelview:null,

    /** Projection transform matrix */
    projection:null,

    /** Viewport camera
     * @type Camera
     */
    camera:null,

    /** Keeps track of the FPS */
    fpsTracker:null,
    /** Quick access to FPS */
    FPS : 0,

    /** Provides frame timing */
    timer:null,

    /** Canvas object being rendered to */
    canvas:null,

    /** Clears the entire WebGLU system to pre-init state */
    reset: function() {
        $W.GL = null;
        $W.modelview = null;
        $W.projection = null;
        $W.camera = null;
        $W.fpsTracker = null;
        $W.FPS = 0;
        $W.timer = null;
        $W.canvas = null;
        $W.objects = [];
        $W.renderables = [];
        $W.pickables = [];
        $W.shaders = [];
        $W.programs = [];
        $W.textures = [];
    },

    Framebuffer:function() {
        var GL = $W.GL;
        var RBUF = GL.RENDERBUFFER;
        var FBUF = GL.FRAMEBUFFER;

        this.glFramebuffer = GL.createFramebuffer();
        this.glRenderbuffers = [];
        this.glTextures = [];

        this.bind = function() {
            GL.bindFramebuffer(FBUF, this.glFramebuffer);
        }

        this.unbind = function() {
            GL.bindFramebuffer(FBUF, null);
        }

        this.attachRenderbuffer = function(storageFormat, width, height, attachment) {
            var rBuffer = GL.createRenderbuffer();
            this.glRenderbuffers.push(rBuffer);
            
            GL.bindRenderbuffer(RBUF, rBuffer);
            GL.renderbufferStorage(RBUF, storageFormat, width, height);
            GL.bindRenderbuffer(RBUF, null);

            GL.framebufferRenderbuffer(FBUF, attachment, RBUF, rBuffer);
        }

        this.attachExistingTexture = function(texture, attachment) {
            this.glTextures.push(texture.glTexture);
            GL.framebufferTexture2D(FBUF, attachment, GL.TEXTURE_2D, texture.glTexture, new WebGLUnsignedByteArray(4*500*500));
        }

        this.attachNewTexture = function(format, width, height, attachment) {
            var texture = new $W.texture.Texture('Texture' + $W.textures.length);

            texture.bind();
            GL.texImage2D(GL.TEXTURE_2D, 0, format, width, height,
                          0, format, $W.GL.UNSIGNED_BYTE, null);
            texture.unbind();

            this.attachExistingTexture(texture, attachment);
        }

        this.attachTexture = function() {
            this.bind();
            if (arguments.length === 4) {   
                this.attachNewTexture.apply(this, arguments);
            }else {
                this.attachExistingTexture.apply(this, arguments);
            }
            this.unbind();
        }
    },

    /** @namespace Contains animation objects 
     * XXX unnecessary, flatten
     */
    anim:{
        /** @class A procedurally generated animation. 
         * Starts updating immediately.
         */
        ProceduralAnimation:function() {
            $W.ObjectState.call(this); // subclass of ObjectState

            /** XXX The right way to do this? */
            var ptyp = $W.anim.ProceduralAnimation.prototype;

            /** The time in milliseconds since this animation began */
            this.age = 0;

            /** Call to advance the animation by `dt` milliseconds */
            this.update = function(dt){};
            this._update = function(dt){};

            /** Internal.
             * @return {Function} Update this animation.
             */
            ptyp._play = function() {
                return (function(dt) {
                        this.preUpdate(dt);

                        this.age += dt;

                        this._update(dt);

                        this.updatePosition(dt);
                        this.updateRotation(dt);
                        this.updateScale(dt);

                        this.postUpdate(dt);
                });
            }

            /** Internal.
             * @return {Function} Do nothing.
             */
            ptyp._pause = function() {
                return (function() {});
            }

            /** This animation will advance on subsequent update() 
             * calls.
             */
            this.play = function() {
                this.update = ptyp._play();
            }

            /** This animation will not change on subsequent update() 
             * calls.
             */
            this.pause = function() {
                this.update = ptyp._pause();
            }

            /** Called before `dt` is added to this.age 
             * Does nothing by default.
             */
            this.preUpdate      = function(dt){}

            /** Update the position. Does nothing by default. */
            this.updatePosition = function(dt){}
            /** Update the rotation. Does nothing by default. */
            this.updateRotation = function(dt){}
            /** Update the scale. Does nothing by default. */
            this.updateScale    = function(dt){}

            /** Called after all other update calls.
             * Does nothing by default.
             */
            this.postUpdate     = function(dt){}

            this.play();
        },


        /** @class A single frame of animation.
         * A position, rotation, and scale at a particular point in time.
         *
         * @param {3 Array} pos Position.
         * @param {3 Array} rot Rotation.
         * @param {3 Array} scl Scale.
         * @param {Number} atTime Time, in seconds, this keyframe occurs at.
         */
        KeyFrame:function (pos, rot, scl, atTime) {
            if (arguments.length == 4) {
                $W.ObjectState.call(this, pos, rot, scl); // Subclass ObjectState
                this.atTime = atTime * 1000; // time, in seconds, this keyframe occurs at
            }else {
                $W.ObjectState.call(this); 
                this.atTime = 0;
            }
        },

        /** @class A keyframe based animation 
         * Rotations interpolation uses quaternions.
         */
        KeyFrameAnimation:function() {
            $W.anim.ProceduralAnimation.call(this); // Subclass ProceduralAnimation

            this.keyframes = [];
            /** Frame index to interpolate from. */
            this.A = 0; 
            /** Frame index to interpolate to. */
            this.B = 1; 

            /** Time scale multiplier */
            this.timeScale = 1;


            this.update = function(dt) {
                this.age += dt * this.timeScale;

                // Time for next frame?
                if (this.age >= (this.keyframes[this.B]).atTime) {

                    // Increment frame counters
                    this.A = ++this.A % this.keyframes.length;
                    this.B = ++this.B % this.keyframes.length;

                    // Account for slop (by throwing it out)
                    this.age = (this.keyframes[this.A]).atTime;
                }


                var progress = this.age - (this.keyframes[this.A]).atTime;
                var duration = (this.keyframes[this.B]).atTime - (this.keyframes[this.A]).atTime;
                var t = progress / duration;


                // Interpolate position
                this.position.elements = $W.util.lerpTriple(t, 
                        this.keyframes[this.A].position.elements,
                        this.keyframes[this.B].position.elements);

                // Interpolate quaternions for rotation
                this.q = $W.util.slerp(t,
                        this.keyframes[this.A].q,
                        this.keyframes[this.B].q);

                // Interpolate scale
                this.scale.elements = $W.util.lerpTriple(t, 
                        this.keyframes[this.A].scale.elements,
                        this.keyframes[this.B].scale.elements);
            }

            /** Add a new keyframe. 
             * For now it needs to be added in time order as it
             * doesn't sort on its own.
             * @param {Keyframe} keyframe The keyframe to add.
             */
            this.addKeyframe = function(keyframe) {
                this.keyframes.push(keyframe);
            }

            /** Remove the keyframe at index from the list of keyframes.
             * @param {Integer} index The index of the keyframe to remove.
             */
            this.removeKeyframe = function(index) {
                var result = [];

                // - 1 for frame -1
                for (var i = 0; i < this.keyframes.length - 1; i++) {
                    if (i != index) {
                        result.push(this.keyframes[i]);
                    }
                }
            }
        }

    },


    /** @namespace Texture classes */
    texture:{
        Texture: function(name) {
            this.glTexture = $W.GL.createTexture();
            this.name = name;
            $W.textures[name] = this;

            this.bind = function() {
                $W.GL.bindTexture($W.GL.TEXTURE_2D, this.glTexture);
            }
                
            this.unbind = function() {
                $W.GL.bindTexture($W.GL.TEXTURE_2D, this.glTexture);
            }
        },

        Canvas: function(name, src) {
            $W.texture.Texture.call(this, name);

            this.canvas = src;
            this.canvas.texture = this;

            this.update = function() {
                var gl = $W.GL;
                this.texture.bind();
                gl.texImage2D(gl.TEXTURE_2D, 0, this);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                this.texture.unbind();
            }

        },

        /** A dynamic texture from a `video` element.    
         * @param {String} name The global name this texture will be referenced
         * by elsewhere.
         * @param {String|Video} src Video path or DOM video element.
         */
        Video: function(name, src) {
            $W.texture.Texture.call(this, name);

            this.setSource = function(video) {
                // Path to video
                if (typeof(video) === 'string') {
                    this.video = document.createElement('video');
                    document.getElementsByTagName('body')[0].appendChild(this.video);

                    this.video.src = video;

                // DOM Video element
                }else {
                    this.video = video;
                }

                this.video.texture = this;
                this.video.autobuffer = true;
                this.video.play();
                this.video.addEventListener("timeupdate", this.update, true);
            }

            this.update = function() {
                var gl = $W.GL;
                this.texture.bind();
                gl.texImage2D(gl.TEXTURE_2D, 0, this.texture.video);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                //gl.generateMipmap(gl.TEXTURE_2D);
                //gl.bindTexture(gl.TEXTURE_2D, null); // clean up after ourselves
            }

            this.setSource(src);
        },

        /** A static texture from an image file.
         * @param {String} name The global name this texture will be referenced
         * by elsewhere.
         * @param {String} src Path to image file.
         */
        Image: function(name, src) {
            $W.texture.Texture.call(this, name);
            this.image = document.createElement('img');
            this.image.texture = this;

            this.image.onload = function() {
                var gl = $W.GL;
                console.group('Loading texture `' + name + "`");
                this.texture.bind();
                gl.texImage2D(gl.TEXTURE_2D, 0, this.texture.image);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.bindTexture(gl.TEXTURE_2D, null); // clean up after ourselves
                console.log('Done');
                console.groupEnd();
            }

            this.setSource = function(src) {
                this.image.src = src;
            }

            if (src !== undefined) {
                this.setSource(src);
            }
        }
    },

    // Classes
    /** @class Quaternion implementation.
     * based on reference implementation at 
     * http://3dengine.org/Quaternions
     */
    Quaternion:function() {
        // Called as Quaternion(x, y, z, theta)
        if (arguments.length == 4) {
            var angle = (arguments[3] / 180.0) * Math.PI;
            var result = Math.sin(angle / 2);
            this.w = Math.cos(angle / 2);
            this.x = arguments[0] * result;
            this.y = arguments[1] * result;
            this.z = arguments[2] * result;

        // Called as Quaternion([w, x, y, z])
        }else if (arguments[0] !== undefined && arguments[0].length == 4) {
            this.w = arguments[0][0];
            this.x = arguments[0][1];
            this.y = arguments[0][2];
            this.z = arguments[0][3];

        // Called as Quaternion()
        }else {
            this.w = 1;
            this.x = 0;
            this.y = 0;
            this.z = 0;
        }

        this.matrix = function() {
            var w = this.w;
            var x = this.x;
            var y = this.y;
            var z = this.z;
            var xx = x * x;
            var yy = y * y;
            var zz = z * z;
            var xy = x * y;
            var xz = x * z;
            var xw = x * w;
            var yz = y * z;
            var yw = y * w;
            var zw = z * w;

            var m = [[],[],[],[]];

            m[0][0] = 1 - 2 * (yy + zz);
            m[0][1] = 2 * (xy + zw);
            m[0][2] = 2 * (xz - yw);
            m[0][3] = 0;
            m[1][0] = 2 * (xy - zw);
            m[1][1] = 1 - 2 * (xx + zz);
            m[1][2] = 2 * (yz + xw);
            m[1][3] = 0;
            m[2][0] = 2 * (xz + yw);
            m[2][1] = 2 * (yz - xw);
            m[2][2] = 1 - 2 * (xx + yy);
            m[2][3] = 0;
            m[3][0] = 0;
            m[3][1] = 0;
            m[3][2] = 0;
            m[3][3] = 1;
            
            return $M(m);
        }

        this.multiply = function(q) {
            var result = new $W.Quaternion();
            result.w = this.w * q.w - this.x * q.x - this.y * q.y - this.z * q.z;
            result.x = this.w * q.x + this.x * q.w + this.y * q.z - this.z * q.y;
            result.y = this.w * q.y + this.y * q.w + this.z * q.x - this.x * q.z;
            result.z = this.w * q.z + this.z * q.w + this.x * q.y - this.y * q.x;
            return result;
        }
    },

    /** @class Common state representation (position, rotation, scale).
     * A position, rotation, and scale.
     * @param {3 Array} pos Position.
     * @param {3 Array} rot Rotation.
     * @param {3 Array} scl Scale.
     */
    ObjectState:function(position, rotation, scale) {
        if (arguments.length == 3) {
            this.position  = $V(position);
            this.rotation  = $V(rotation);
            this.scale      = $V(scale);
        }else {
            this.position  = Vector.Zero(3);
            this.rotation  = Vector.Zero(3);
            this.scale      = $V([1,1,1]);
        }

        this.recalculateQuaternion = function() {
            // No need to calc for no rotation
            if (this.rotation.eql(Vector.Zero(3))) {
                this.q = new $W.Quaternion();

            }else {
                var qh = new $W.Quaternion(0, 1, 0, this.rotation.e(1));
                var qp = new $W.Quaternion(1, 0, 0, this.rotation.e(2));
                var qr = new $W.Quaternion(0, 0, 1, this.rotation.e(3));

                this.q = (qr.multiply(qp)).multiply(qh);
            }
        }
        
        this.recalculateQuaternion();

        /** Set a new position. */
        this.setPosition = function(x, y, z) { 
            // Called as setPosition(x, y, z)
            if (arguments.length == 3) {
                this.position.elements = [x, y, z]; 

            // Called as setPosition([x, y, z])
            }else {
                this.position.elements = arguments[0];
            }
        }

        /** Set a new rotation. */
        this.setRotation = function() { 
            // Called as setRotation(x, y, z)
            if (arguments.length == 3) {
                this.rotation.elements = arguments; 

            // Called as setRotation([x, y, z])
            }else {
                this.rotation.elements = arguments[0];
            }

            this.recalculateQuaternion();
        }

        /** Set a new scale. */
        this.setScale = function(x, y, z){ 
            this.scale.elements    = [x, y, z]; 
        }


        this.equals = function(other) {
            if ((other.scale !== undefined &&
                 other.position !== undefined &&
                 other.rotation !== undefined) && (

                this.scale == other.scale &&
                this.position == other.position &&
                this.rotation == other.rotation )) {

                return true;
            }else {
                return false;
            }
        }
    },


    /** 
     * Useful, but not necessay if provide your own draw calls
     * @class Keeps track of viewport camera characteristics. 
     */
    Camera:function() {
        $W.ObjectState.call(this); // subclass of ObjectState

        /** Vertical field of view in degrees. */
        this.yfov = 75;

        /** Aspect ratio */
        this.aspectRatio = 1;

        /** Coordinates the camera will point at.
         * @type {Vector}
         */
        this.target = $V([0,0,0]);

        this.up = $V([0,1,0]);

        /** Set a new target for the camera .
         * Changes the camera target without recreating the
         * target vector.
         */
        this.setTarget = function(x, y, z) {
            this.target.elements = [x, y, z];
        }

        /** Per frame update.
         * Replace as needed.
         */
        this.update = function() {}
    },


    /** @class Keeps track of time since application start.
     * Provides delta time between ticks.
     */
    Timer:function () {
        /** The time passed since this timer was started to the time of
         * the most recent tick in milliseconds.
         */
        this.age = 0;

        /** The current application time in milliseconds. */
        this.t  = (new Date()).getTime();

        /** The delta time between the previous two ticks. */
        this.dt = 0;

        /** The time of the previous tick */
        this.pt = this.t;

        /** Update the timer */
        this.tick = function() {
            this.t = (new Date()).getTime();
            this.dt = this.t - this.pt;
            this.pt = this.t;
            this.age += this.dt;
        }

        /** The time passed since this timer was started to the time of
         * the most recent tick in seconds.
         */
        this.ageInSeconds = function() {
            return this.age / 1000;
        }
    },

    /** @class Provides an easy way to track FPS. */
    FPSTracker:function () {
        /** Number of frames to average over. */
        this.frameAvgCount = 20;  

        // frame timing statistics
        
        /** Milliseconds per frame. */
        this.mspf= 0; 

        /** Frames per second. */
        this.fps = 0;

        this.recentFPS = []; // last several FPS calcs to average over

        /** Update the FPS. */
        this.update = function(dt) {
            this.mspf += dt; // add this past frame time and renormalize
            this.mspf /= 2;

            if (this.recentFPS.unshift(Math.floor(1000 / this.mspf)) > this.frameAvgCount) {
                this.recentFPS.pop();
            } // average FPS over the past frameAvgCount frames
            
            this.fps = 0;
            for (var i = 0; i < this.recentFPS.length; i++) {
                this.fps += this.recentFPS[i];
            }
            this.fps /= this.recentFPS.length;
        }
    },


    /** @namespace Utility functions. */
    util: {
        /** Load the file at the given path as text.
         * @param {String} path The path to the file.
         * @return {String} Data in the file as text.
         */
        loadFileAsText:function(path) {
            console.log("Loading file `" + path + "`");
            var xhr = null;
            xhr = new XMLHttpRequest();

            if (!xhr) { 
                return null; 
            }

            xhr.overrideMimeType("text/xml");

            // Deal with firefox security for file:// urls
            try {
                var nsPM = null;
                if (typeof(netscape) !== 'undefined' && 
                    typeof(netscape.security) !== 'undefined' && 
                    typeof(netscape.security.PrivilegeManager) !== 'undefined') {
                    nsPM = netscape.security.PrivilegeManager;
                }
                if (document.location.href.match(/^file:\/\//)) {
                    if (nsPM !== null) {
                        nsPM.enablePrivilege("UniversalBrowserRead");
                    }
                }
            }catch (e) {
                console.error(e);
                throw "\tBrowser security may be restrcting access to local files";
            }

            try {

                xhr.open("GET", path, false);

                // Ignore cache if the file is served from localhost or is at a
                // file:// url as it's safe to assume that's a developer.
                var url = window.location.href;
                if (    url.match(/^http:\/\/localhost/) !== null ||
                        url.match(/^http:\/\/127\.0\.0\.1/) !== null ||
                        url.match(/^file:/) !== null) {

                    xhr.setRequestHeader('Pragma', 'Cache-Control: no-cache');
                }

                xhr.send(null);

            }catch (e) { 
                throw e; 
            }

            console.log("\tCompleted with status: " + xhr.status);

            return xhr.responseText;
        },

        include: function(path) {
            var script = $W.util.loadFileAsText(path);
            window.eval(script);
        }
    },


    /** 
     * Initialize the WebGLU system, optionally initizlizing the WebGL
     * subsystem.
     * canvasNode - the DOM node of a canvas element to init WebGL,
     *              defaults to using the DOM element with ID 'canvas'.
     *              Pass `false` to skip init of WebGL subsystem.
     */
    initialize:function(canvasNode) {
        $W.initLogging();

        $W.util.include($W.paths.libsrc + 'Util.js');
        $W.util.include($W.paths.libsrc + 'Constants.js');
        $W.util.include($W.paths.libsrc + 'GLSL.js');
        $W.util.include($W.paths.libsrc + 'GLU.js');
        $W.util.include($W.paths.libsrc + 'Object.js');

        $W.extendArray();
        $W.loadSylvester();

        console.group("Initializing WebGLU");

        // Prep the shader subsystem
        $W.GLSL.initialize();

        // create the matrix stacks we'll be using to store transformations
        $W.modelview  = new $W.GLU.MatrixStack();
        $W.projection = new $W.GLU.MatrixStack();

        $W.camera     = new $W.Camera();
        $W.timer      = new $W.Timer();
        $W.fpsTracker = new $W.FPSTracker();

        var success = true;
        if (canvasNode === false) {
            console.log("WebGL init skipped");
        }else {
            success = $W.initWebGL(canvasNode);
        }

        console.groupEnd();
        return success;
    },

    /** Ensure that we can log, or at least not error if we try to */
    initLogging:function() {
        if (window.console === undefined) {
            console = {};
        } // Dummy object

        if (console.log === undefined) {
            console.log = function(){};
        }

        // If console.log exists, but one or more of the others do not,
        // use console.log in those cases.
        if (console.warn === undefined) {
            console.warn           = console.log;
        }
        if (console.error === undefined) {
            console.error          = console.log;
        }
        if (console.group === undefined) {
            console.group          = console.log;
        }
        if (console.groupCollapsed === undefined) {
            console.groupCollapsed = console.group;
        }
        if (console.groupEnd === undefined) {
            console.groupEnd       = console.log;
        }
    },

    /** Use debugging context.
     * Must be called <i>after</i> initialize().
     */
    useWebGLDebug: function() {
        $W.util.include($W.paths.external + 'webgl-debug.js');
        $W.GL = WebGLDebugUtils.makeDebugContext($W.GL);
    },

    useCrazyGLU: function() {
        $W.util.include($W.paths.libsrc + 'crazyglu.js');
    },

    useGameGLU: function() {
        $W.util.include($W.paths.libsrc + 'gameglu.js');
    },

    disableGrouping:function() {
        console.oldGroup = console.group;
        console.group = console.log;

        console.oldGroupCollapsed = console.group;
        console.groupCollapsed = console.log;
    },

    enableGrouping:function() {
        console.group = console.oldGroup;
        console.groupCollapsed = console.oldGroupCollapsed;
    },

    /** Setup the WebGL subsytem.
     * Create a WebGL context on the given canvas.
     *
     * XXX Can't yet handle multiple canvii
     * @param canvas DOM node or element id of a canvas.
     */
    initWebGL: function(canvas) {
        if (canvas === undefined) {
            $W.canvas = document.getElementById('canvas');

        }else if (typeof(canvas) == "string") {
            $W.canvas = document.getElementById(canvas);

        }else { $W.canvas = canvas; }

        $W.GL = null;
        $W.GL = $W.util.getGLContext($W.canvas);

        if (typeof($W.GL) !== "undefined" && $W.GL !== null) {
            $W.constants.VERTEX = $W.GL.VERTEX_SHADER;
            $W.constants.FRAGMENT = $W.GL.FRAGMENT_SHADER;

            // on by default
            $W.GL.enable(this.GL.DEPTH_TEST);

            $W.newProgram('default');

            // XXX Fragile paths
            $W.programs['default'].attachShader('defaultVS', $W.paths.shaders + 'default.vert');
            $W.programs['default'].attachShader('defaultFS', $W.paths.shaders + 'default.frag');
            $W.programs['default'].link();
            
            $W.GL.viewport(0, 0, $W.canvas.width, $W.canvas.height);

            console.log('WebGL initialized');
            return true;
        }else {
            console.log('WebGL init failed');
            return false;
		}
    },


    /** Create a new ShaderProgram and add it to the program list.
     * @param {String} name The global name for this program.
     */
    newProgram: function(name) {
        this.programs[name] = new $W.GLSL.ShaderProgram(name);
    },
            
    /** Add the given object to the object list.
     * @param {Object} obj The object to add.
     */
    addObject: function(obj) {
        this.objects.push(obj);
    },

    clearObjects: function() {
        this.objects = [];
    },

    _setupMatrices: function() {
        $W.modelview.loadIdentity();
        $W.projection.loadIdentity();

        $W.projection.multMatrix(
            $W.GLU.perspective( $W.camera.yfov, $W.camera.aspectRatio, 
                                0.01, 10000)); 
        $W.projection.multMatrix($W.GLU.lookAt(
            $W.camera.position.e(1),
            $W.camera.position.e(2),
            $W.camera.position.e(3),
            $W.camera.target.e(1),
            $W.camera.target.e(2),
            $W.camera.target.e(3),
            $W.camera.up.e(1),
            $W.camera.up.e(2),
            $W.camera.up.e(3)));

        $W.modelview.rotate($W.camera.rotation.e(1), [1, 0, 0]);
        $W.modelview.rotate($W.camera.rotation.e(2), [0, 1, 0]);
        $W.modelview.rotate($W.camera.rotation.e(3), [0, 0, 1]);
    },


    /** Draw all objects from the camera's perspective. */
    draw: function() {
        $W.clear();

        $W._setupMatrices();

        $W._drawObjects();                            
    },

	_updateState : function() {
		$W.timer.tick();
		$W.fpsTracker.update($W.timer.dt);
		$W.FPS = Math.round($W.fpsTracker.fps);
	},

    /** Update all objects. */
	update : function() {
		$W._updateState();

        for (var i = 0; i < this.objects.length; i++) {
            $W.objects[i].update($W.timer.dt);
        }

        $W.camera.update();
	},

    _drawObjects : function() {
        for (var i = 0; i < $W.objects.length; i++) {
            $W.objects[i].draw();
        }
    },

    /** Clear the canvas */
	clear : function() {
		// clearing the color buffer is really slow
		$W.GL.clear($W.GL.COLOR_BUFFER_BIT|$W.GL.DEPTH_BUFFER_BIT);
	}
}

// Utility functions

$W.extendArray = function() {
    Array.prototype.findByAttributeValue = function(attribute, value) {
        for (var i = 0; i < this.length; i++) {
            if (this[i][attribute] === value) {
                return this[i];
            }
        }
        return null;
    };

    /** Returns this array less any objects for which the given attribute
     * is equal to the given value.
     * @param {String} attribute The name of the attribute.
     * @param {Any} value The value to exclude on.
     */
    Array.prototype.removeByAttributeValue = function(attribute, value) {
        var result = [];

        for (var i = 0; i < this.length; i++) {
            if (this[i][attribute] !== value) {
                result.push(this[i]);
            }
        }
    };

    //--------------------------------------------------------------------------
    // Takes a 2D array [[1,2],[3,4]] and makes it 1D [1,2,3,4]
    //--------------------------------------------------------------------------
    Array.prototype.flatten = function() {
        var res = [];
        if (this[0].length !== undefined) {
            for (var i = 0; i < this.length; i++) {
                res = res.concat(this[i]);
            }
        }else {
            res = this;
        }
        return res;
    }

    Array.prototype.remove = function(item) {
        var res = [];

        if (item.equals !== undefined) {
            for (var i = 0; i < this.length; i++) {
                if (!(item.equals(this[i]))) {
                    res.push(this[i]);
                }
            }
        }else{
            for (var i = 0; i < this.length; i++) {
                if (this[i] != item) {
                    res.push(this[i]);
                }
            }
        }

        return res;
    }
    // returns the index into this array of
    // if it's an array of arrays it assumes the
    // item in the first index of each subarry
    // is the key.
    Array.prototype.indexOf = function(item) {
        for (var i = 0; i < this.length; i++) {
            if (!this[i].length) {
                if (this[i] == item) {
                    return i;
                }
            }else {
                if (this[i][0] == item) {
                    return i;
                }
            }
        }

        return undefined;
    }
}


/* Calculate normals at each vertex in vertices, by looking
 * at triangles formed by every face and averaging.
 * (c) 2009 Vladimir Vukicevic
 */
$W.util.calculateNormals = function(vertices, faces) {
    var nvecs;

    if (vertices[0].length == 3) {
        nvecs = new Array(vertices.length);

        for (var i = 0; i < faces.length; i++) {
            var j0 = faces[i][0];
            var j1 = faces[i][1];
            var j2 = faces[i][2];

            var v1 = $V(vertices[j0]);
            var v2 = $V(vertices[j1]);
            var v3 = $V(vertices[j2]);


            var va = v2.subtract(v1);
            var vb = v3.subtract(v1);

            var n = va.cross(vb).toUnitVector();

            if (!nvecs[j0]) nvecs[j0] = [];
            if (!nvecs[j1]) nvecs[j1] = [];
            if (!nvecs[j2]) nvecs[j2] = [];

            nvecs[j0].push(n);
            nvecs[j1].push(n);
            nvecs[j2].push(n);
        }

    }else { // handle flattened arrays
        nvecs = new Array(vertices.length / 3)

        for (var i = 0; i < faces.length; i+=3) {
            var j0 = faces[i+0];
            var j1 = faces[i+1];
            var j2 = faces[i+2];

            var v1 = $V([vertices[j0], vertices[j0+1], vertices[j0+2]]);
            var v2 = $V([vertices[j1], vertices[j2+1], vertices[j2+2]]);
            var v3 = $V([vertices[j2], vertices[j2+1], vertices[j2+2]]);


            var va = v2.subtract(v1);
            var vb = v3.subtract(v1);

            var n = va.cross(vb).toUnitVector();

            if (!nvecs[j0]) nvecs[j0] = [];
            if (!nvecs[j1]) nvecs[j1] = [];
            if (!nvecs[j2]) nvecs[j2] = [];

            nvecs[j0].push(n);
            nvecs[j1].push(n);
            nvecs[j2].push(n);
        }
    }

    var normals = new Array(vertices.length);

    // now go through and average out everything
    for (var i = 0; i < nvecs.length - 1; i++) {
        var count = nvecs[i].length;
        var x = 0;
        var y = 0;
        var z = 0;

        for (var j = 0; j < count; j++) {
            x += nvecs[i][j].elements[0];
            y += nvecs[i][j].elements[1];
            z += nvecs[i][j].elements[2];
        }

        normals[i] = [x/count, y/count, z/count];
    }

    return normals;
}


//--------------------------------------------------------------------------
//
// augment Sylvester some
// (c) 2009 Vladimir Vukicevic
$W.loadSylvester = function() {
    $W.util.include($W.paths.external + $W.paths.sylvester);

    Matrix.Translation = function (v)
    {
        if (v.elements.length == 2) {
            var r = Matrix.I(3);
            r.elements[2][0] = v.elements[0];
            r.elements[2][1] = v.elements[1];
            return r;
        }

        if (v.elements.length == 3) {
            var r = Matrix.I(4);
            r.elements[0][3] = v.elements[0];
            r.elements[1][3] = v.elements[1];
            r.elements[2][3] = v.elements[2];
            return r;
        }

        throw "Invalid length for Translation";
    }


    Matrix.prototype.trace = function() {
        return this[0][0] + this[1][1] + this[2][2];
    }

    Matrix.prototype.flatten = function ()
    {
        var result = [];
        if (this.elements.length === 0) {
            return [];
        }


        for (var j = 0; j < this.elements[0].length; j++) {
            for (var i = 0; i < this.elements.length; i++) {
                result.push(this.elements[i][j]);
            }
        }
        return result;
    }

    Matrix.prototype.ensure4x4 = function()
    {
        if (this.elements.length == 4 && 
                this.elements[0].length == 4) {
            return this;
        }

        if (this.elements.length > 4 ||
                this.elements[0].length > 4) {
            return null;
        }

        for (var i = 0; i < this.elements.length; i++) {
            for (var j = this.elements[i].length; j < 4; j++) {
                if (i == j) {
                    this.elements[i].push(1);
                }else {
                    this.elements[i].push(0);
                }
            }
        }

        for (var i = this.elements.length; i < 4; i++) {
            if (i === 0) {
                this.elements.push([1, 0, 0, 0]);
            }else if (i == 1) {
                this.elements.push([0, 1, 0, 0]);
            }else if (i == 2) {
                this.elements.push([0, 0, 1, 0]);
            }else if (i == 3) {
                this.elements.push([0, 0, 0, 1]);
            }
        }

        return this;
    };

    Matrix.prototype.make3x3 = function()
    {
        if (this.elements.length != 4 ||
                this.elements[0].length != 4) {
            return null;
        }

        return Matrix.create([[this.elements[0][0], this.elements[0][1], this.elements[0][2]],
                [this.elements[1][0], this.elements[1][1], this.elements[1][2]],
                [this.elements[2][0], this.elements[2][1], this.elements[2][2]]]);
    };

    Vector.prototype.flatten = function ()
    {
        return this.elements;
    }; 

    Vector.prototype.vec3Zero = Vector.Zero(3);

    Vector.prototype.invert = function() {
        return Vector.prototype.vec3Zero.subtract(this);
    }
}

