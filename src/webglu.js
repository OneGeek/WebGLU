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

    draw: function(){},
    update: function(){},

    _draw: function $W_draw() {
        $W.util.defaultDraw();
        $W.draw();
    },
    _update: function $W_draw() {
        $W.util.defaultUpdate();
        $W.update();
    },

    /* Begin rendering the scene */
    start: function $W_start(framelimit) {

        // use mozRequestAnimationFrame if available
        if (typeof(window.mozRequestAnimationFrame) != 'undefined') {
            var redraw = function $W_mozRedraw() {
                $W._update();
                $W._draw();
                window.mozRequestAnimationFrame(redraw);
            };
            window.mozRequestAnimationFrame(redraw);

        // fallback to setinterval
        }else {
            if (typeof(framelimit) === 'undefined') {
                framelimit = 10;
            }
            setInterval(function $W_redrawFn() {
                    $W._update();
                    $W._draw();
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
     * canvas - the DOM node or id string of a canvas element to init WebGL,
     *          defaults to using the DOM element with ID 'canvas'.
     *          Pass `false` to skip init of WebGL subsystem.
     */
    initialize:function $W_initialize(canvas) {
        $W.initLogging();
        $W.log("Initializing WebGLU");

        var initModule = function(module) {
            // If this is not the single file version, load each module
            if (typeof($W['init' + module]) === 'undefined') {
                $W.util.include($W.paths.libsrc + module + '.js');
            }

            // In either case call the appropriate init function
            $W['init' + module]();
        };

        // Init Util module early so we can bail out fast.
        initModule('Util');
        $W.util.setCanvas(canvas);
        if (!$W.util.hasWebGLTypes()) {
           $W.util.displayWebGLFailure(); 
           return;
        }

        var modules = ['Constants', 'DefaultUniformActions', 'GLSL',
            'GLU', 'Animation', 'Object', 'Texture', 'Framebuffer', 'Material',
            'Renderer' ];

        for (var i = 0; i < modules.length; i++) {
            initModule(modules[i]);
        }

        // create the matrix stacks we'll be using to store transformations
        $W.modelview  = new $W.GLU.MatrixStack();
        $W.projection = new $W.GLU.MatrixStack();

        $W.camera     = new $W.Camera();
        $W.timer      = new $W.Timer();

        if (canvas === false) {
            console.log("WebGL init skipped");
        }else {
            if ($W.util.initWebGL()) {
                $W.camera.aspectRatio = $W.canvas.width / $W.canvas.height;
                $W.util.loadDefaultAssets();
                return true;
            }else {
                return false;
            }
        }
    },

    /** Ensure that we can log, or at least not error if we try to */

    /** Use debugging context.
     * Must be called <i>after</i> initialize().
     */
    useWebGLDebug: function() {
        $W.util.include($W.paths.external + 'webgl-debug.js');
        $W.GL = WebGLDebugUtils.makeDebugContext($W.GL);
    },

    useControlProfiles: function() {
        if (typeof($W['initControlProfiles']) == 'undefined') {
            $W.util.include($W.paths.libsrc + 'ControlProfiles.js');
        }
        $W.initControlProfiles();
    },

    useCrazyGLU: function() {
        if (typeof($W['initCrazyGLU']) == 'undefined') {
            $W.util.include($W.paths.libsrc + 'crazyglu.js');
        }
        $W.initCrazyGLU();
    },

    useGameGLU: function() {
        if (typeof($W['initGameGLU']) == 'undefined') {
            $W.util.include($W.paths.libsrc + 'gameglu.js');
        }
        $W.initGameGLU();
    },
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
