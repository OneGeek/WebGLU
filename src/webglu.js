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

    drawFn: null,
    updateFn: null,

    /* Begin rendering the scene */
    start: function $W_start(framelimit) {

        // use mozRequestAnimationFrame if available
        if (typeof(window.mozRequestAnimationFrame) != 'undefined') {
            var start = window.mozAnimationStartTime;
            window.addEventListener("MozBeforePaint", function step(event) {
                    $W.updateFn();
                    $W.drawFn();
                    window.mozRequestAnimationFrame();
                    }, false);
            window.mozRequestAnimationFrame();

        // fallback to setinterval
        }else {
            if (typeof(framelimit) === 'undefined') {
                framelimit = 10;
            }
            setInterval(function $W_redrawFn() {
                    $W.updateFn();
                    $W.drawFn();
                    },framelimit);
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
            $W.log(path);
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

        // Some hacks for running in both the shell and browser,
        // and for supporting F32 and WebGLFloat arrays

        $W.initLogging();
        $W.log("Initializing WebGLU");

        try { WebGLFloatArray; } catch (x) { WebGLFloatArray = Float32Array; }
        try { WebGLUnsignedShortArray; } catch (x) { WebGLUnsignedShortArray = Uint16Array; }


        var modules = [ 'Util', 'Constants', 'DefaultUniformActions', 'GLSL',
            'GLU', 'Animation', 'Object', 'Texture', 'Framebuffer', 'Material',
            'Renderer' ];

        for (var i = 0; i < modules.length; i++) {
            // If this is not the single file version, load each module
            if (typeof($W['init' + modules[i]]) === 'undefined') {
                $W.util.include($W.paths.libsrc + modules[i] + '.js');
            }
            $W['init' + modules[i]]();
        }

        // create the matrix stacks we'll be using to store transformations
        $W.modelview  = new $W.GLU.MatrixStack();
        $W.projection = new $W.GLU.MatrixStack();

        $W.camera     = new $W.Camera();
        $W.timer      = new $W.Timer();
        $W.fpsTracker = new $W.FPSTracker();

        $W.drawFn = $W.util.defaultDraw;
        $W.updateFn = $W.util.defaultUpdate;

        var success = true;
        if (canvasNode === false) {
            console.log("WebGL init skipped");
        }else {
            success = $W.initWebGL(canvasNode);
            new $W.ImageTexture('wglu_internal_missing_texture', $W.paths.textures + 'wglu_internal_missing_texture.png');
            var defaultMaterial ={
                name: "wglu_default",
                      program: {
                    name: "default" ,
                          shaders: [
                          {name:"wglu_default_vs", type:$W.GL.VERTEX_SHADER,
       source: "attribute vec3 vertex;                                                   \n"+
               "attribute vec3 color;                                                    \n"+
               "                                                                         \n"+
               "uniform mat4 ProjectionMatrix;                                           \n"+
               "uniform mat4 ModelViewMatrix;                                            \n"+
               "                                                                         \n"+
               "varying vec4 frontColor;                                                 \n"+
               "                                                                         \n"+
               "void main(void) {                                                        \n"+
               "    frontColor = vec4(color,1.0);                                        \n"+
               "                                                                         \n"+
               "    gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(vertex, 1.0);\n"+
               "}                                                                        \n"
                          },
                          {name:"wglu_default_fs", type:$W.GL.FRAGMENT_SHADER,
       source: "#ifdef GL_ES                    \n"+
               "precision highp float;          \n"+
               "#endif                          \n"+
               "varying vec4 frontColor;        \n"+
               "void main(void) {               \n"+
               "    gl_FragColor = frontColor;  \n"+
               "}                               \n"
                          },
                          ] 
                }
            }
            new $W.Material(defaultMaterial);

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
        if (typeof($W['initCrazyGLU'] == 'undefined')) {
            $W.util.include($W.paths.libsrc + 'crazyglu.js');
        }
        $W['initCrazyGLU']();
    },

    useGameGLU: function() {
        if (typeof($W['initGameGLU'] == 'undefined')) {
            $W.util.include($W.paths.libsrc + 'gameglu.js');
        }
        $W['initGameGLU']();
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

$W.LL = {
DEBUG :0,
       INFO  :1,
       NOTE  :2,
       WARN  :3
};
$W.loglevel = $W.LL.NOTE;
$W.initLogging = function() {
        if (window.console === undefined) {
            console = {};
        } // Dummy object

        if (console.log === undefined) {
            console.log = function(){};
        }else {
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
