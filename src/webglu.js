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

        textures : "../../textures/",

        materials : "../../materials/",

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

    /** Shaders */
    shaders  : [],

    /** Shader Programs */
    programs : [],

    /** Textures */
    textures : [],

    /** Materials */
    materials: [],

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
        $W.materials = [];
    },

    /** Create a new ShaderProgram and add it to the program list.
     * @param {String} name The global name for this program.
     */
    newProgram: function(name) {
        console.error('$W.newProgram is deprecated, use $W.GLSL.ShaderProgram directly');
        return new $W.GLSL.ShaderProgram(name);
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

    updateDraw: function $W_updateDraw() {
        $W.update();
        $W.draw();
    },

    drawFn: function $W_draw() {
        $W.updateDraw();
    },

    start: function $W_start() {
        setInterval($W.drawFn,10);
    },

    /** Draw all objects from the camera's perspective. */
    draw: function $W_draw() {
        $W.clear();

        $W._setupMatrices();

        $W._drawObjects();                            

        $W.GL.flush();
    },

	_updateState : function $W_updateState() {
		$W.timer.tick();
		$W.fpsTracker.update($W.timer.dt);
		$W.FPS = Math.round($W.fpsTracker.fps);
	},

    /** Update all objects and textures. */
	update : function $W_update() {
		$W._updateState();

        for (var i = 0; i < this.objects.length; i++) {
            $W.objects[i].update($W.timer.dt);
        }

        for (var i = 0; i < this.textures.length; i++) {
            $W.textures[i].update();
        }

        $W.camera.update();
	},

    _drawObjects : function $W_drawObjects() {
        for (var i = 0; i < $W.renderables.length; i++) {
            $W.objects[i].draw();
        }
    },

    /** Clear the canvas */
	clear : function() {
		// clearing the color buffer is really slow
		$W.GL.clear($W.GL.COLOR_BUFFER_BIT|$W.GL.DEPTH_BUFFER_BIT);
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

        /** Set the x y and z components of the object's scale to the given
         * value.
         * @param {Number} s New scale of the object.
         */
        this.setScaleUniformly = function(s) { 
            this.scale = $V([s,s,s]); 
        };


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

        this.dir = function() {
            return (this.target.subtract(this.position)).toUnitVector();
        };

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
            $W.info("Loading file `" + path + "`");
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


            if (xhr.status !== 200) {
                console.error("\tCompleted with status: " + xhr.status);
                return "File load error: " + xhr.status;
            }else {
                $W.debug("\tCompleted with status: " + xhr.status);
                return xhr.responseText;
            }

        },

        include: function(path) {
            $W.info('Including ' + path);
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
    initialize:function $W_initialize(canvasNode) {
        $W.initLogging();
        $W.log("Initializing WebGLU");

        $W.util.include($W.paths.libsrc + 'Util.js');

        $W.util.extendArray();
        $W.util.loadSylvester();

        $W.util.include($W.paths.libsrc + 'Constants.js');
        $W.util.include($W.paths.libsrc + 'DefaultUniformActions.js');
        $W.util.include($W.paths.libsrc + 'GLSL.js');
        $W.util.include($W.paths.libsrc + 'GLU.js');
        $W.util.include($W.paths.libsrc + 'Animation.js');
        $W.util.include($W.paths.libsrc + 'Object.js');
        $W.util.include($W.paths.libsrc + 'Texture.js');
        $W.util.include($W.paths.libsrc + 'Framebuffer.js');
        $W.util.include($W.paths.libsrc + 'Material.js');
        $W.util.include($W.paths.libsrc + 'Renderer.js');

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
            new $W.ImageTexture('wglu_internal_missing_texture', $W.paths.textures + 'wglu_internal_missing_texture.png');
            new $W.Material({path:$W.paths.materials + 'default.json'});

        }

        return success;
    },

    /** Ensure that we can log, or at least not error if we try to */

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

            
            $W.GL.viewport(0, 0, $W.canvas.width, $W.canvas.height);

            console.log('WebGL initialized');
            return true;
        }else {
            console.log('WebGL init failed');
            return false;
		}
    }
};

$W.initLogging = function() {
        if (window.console === undefined) {
            console = {};
        } // Dummy object

        if (console.log === undefined) {
            console.log = function(){};
        }else {
            $W.LL = {
                DEBUG :0,
                INFO  :1,
                NOTE  :2,
                WARN  :3
            };
            $W.logPrefix = '\t';
            $W.logIndentAmount = 0;
            $W.getLogPrefix = function() {
                var prefix = '';
                for (var i = 0; i < $W.logIndentAmount; i++) {
                    prefix += $W.logPrefix;
                }
                return prefix;
            };
            $W.indentLog = function(){$W.logIndentAmount++;};
            $W.dedentLog = function(){$W.logIndentAmount--;};
                    
                    
            $W.loglevel = $W.LL.NOTE;
            $W.log = function(message, level) {
                if (typeof(level) === 'undefined') {level = $W.LL.NOTE;}

                if (level >= $W.loglevel) {
                    if (typeof(message) === 'string') {
                        console.log($W.getLogPrefix() + message);
                    }else {
                        console.dir(message);
                    }
                }
            };
            $W.info = function(message) {
                $W.log(message, $W.LL.INFO);
            };
            $W.debug = function(message) {
                $W.log(message, $W.LL.DEBUG);
            };
            $W.warn = function(message) {  
                if ($W.LL.WARN >= $W.loglevel) {
                    console.warn($W.getLogPrefix() + message);
                }
            };
        }

        // If console.log exists, but one or more of the others do not,
        // use console.log in those cases.
        if (console.dir === undefined) {
            console.dir           = console.log;
        }
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
    };
$W.initLogging();
