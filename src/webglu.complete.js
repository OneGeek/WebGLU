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
        if (typeof(framelimit) === 'undefined') {
            framelimit = 10;
        }
        setInterval(function $W_redrawFn() {
            $W.updateFn();
            $W.drawFn();
        },framelimit);
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
            if (typeof($W['init' + modules[i]] == 'undefined')) {
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

$W.initCrazyGLU = function() {

    $W.AMBIENT = 'ambient';
    $W.SPECULAR = 'specular';
    $W.DIFFUSE = 'diffuse';
    $W.POSITION = 'position';

    $W.constants.LightSourceUniform = "wglu_LightSource";


    $W.GLSL.util.handleIncludes = function(source) {
        var maxIncludeDepth = 32;
        var includeDepth = 0;


        var includes = source.match(/^#pragma\s*INCLUDE.*/gm);
        if (includes !== null) {
        }
        while (includes !== null && includeDepth < maxIncludeDepth) {
            for (var i = 0; i < includes.length; i++) {
                var include = includes[i].replace(/^#pragma\s*INCLUDE\s*/g, "");
                include = include.replace(/["'<>]/g,"");

                console.log ("Including " + include);

                source = source.replace(includes[i], 
                        $W.util.loadFileAsText($W.paths.shaders + include));
            }
            var includes = source.match(/^#pragma.*/gm);
            includeDepth++;
        }
        return source
    };

    $W.GLSL.util.handlePragmas =  function(source) {
        var pragmas = source.match(/^#pragma.*/gm);

        if (pragmas !== null) {
            for (var i = 0; i < pragmas.length; i++) {
                if (pragmas[i] !== null) {
                    var pragma = pragmas[i].split(/\s+/g);
                    
                    if (pragma[1] === "WEBGLU_LIGHTS") {
                        source = source.replace(pragmas[i], 
                                "#pragma INCLUDE 'lighting.glsl'");

                        $W.lights = [];
                        for (var j = 0; j < 3; j++) {
                            $W.lights[j] = {
                                ambient:[0,0,0,0],
                                diffuse:[0,0,0,0],
                                specular:[0,0,0,0],
                                position:[0,0,0,0]
                            };
                        }
                        console.log("Lighting uniforms enabled");
                    }
                }
            }
            source = $W.GLSL.util.handleIncludes(source);
        }
        return source;
    }

    /*
    $W.defaultUniformActions[$W.constants.LightSourceUniform] = 
        function(uniform, object, material) {
            $W.GL.uniform4fv(this.location, false, 
                    new WebGLFloatArray($W.lights[0].position));
    };
    */

    $W.usePicking = function() {
        $W.newProgram('pick');
        $W.programs.pick.attachShader('pickVS', $W.paths.shaders + 'pick.vert');
        $W.programs.pick.attachShader('pickFS', $W.paths.shaders + 'pick.frag');

        try{
            $W.pickBuffer = new $W.Framebuffer();
            $W.pickBuffer.attachTexture($W.GL.RGBA, $W.canvas.width, $W.canvas.height, $W.GL.COLOR_ATTACHMENT0);
            $W.pickBuffer.attachRenderbuffer($W.GL.DEPTH_COMPONENT16, $W.canvas.width, $W.canvas.height, $W.GL.DEPTH_ATTACHMENT);
        }catch (e) {
            console.error(e);
        }
    }

    $W.drawForPicking = function() {
        $W.modelview.pushMatrix();

        $W.modelview.translate(this.animatedPosition().elements);
        $W.modelview.multMatrix(this.animatedRotation().matrix());
        $W.modelview.scale(this.animatedScale().elements);

        for (var i = 0; i < this._children.length; i++) {
            $W.drawForPicking.call(this._children[i]);
        }

        $W.programs.pick.use();
        $W.programs.pick.setUniform( 'pickColor', this.id / 255 );
        $W.programs.pick.processUniforms(this);

        this._bufferArrays();
        this._drawFunction();

        $W.modelview.popMatrix();
        $W.GL.bindTexture($W.GL.TEXTURE_2D, null);
    };

    $W.updatePickBuffer = function(shouldUnbind) {
        $W._setupMatrices();
        $W.pickBuffer.bind();

        $W.GL.clearColor(1.0, 1.0, 1.0, 1.0);
        $W.GL.clear($W.GL.COLOR_BUFFER_BIT | $W.GL.DEPTH_BUFFER_BIT);
        $W.GL.disable($W.GL.BLEND);
        $W.GL.lineWidth(7);


        for (var i = 0; i < $W.pickables.length; i++) {
            $W.drawForPicking.call($W.pickables[i]);
        }

        if (shouldUnbind !== false) {
            $W.pickBuffer.unbind();
        }
        $W.GL.enable($W.GL.BLEND);
        $W.GL.lineWidth(1);
        $W.GL.clearColor(0.9, 0.9, 0.9, 1.0);
    }

    $W.getObjectIDAt = function(x, y) {
        $W.updatePickBuffer(false);
        var id = $W.GL.readPixels(x,$W.canvas.height-y,1,1, 
                             $W.GL.RGBA, $W.GL.UNSIGNED_BYTE)[0];
        $W.pickBuffer.unbind();

        return id;
    }

    if (typeof(V3) === 'undefined') {
        $W.util.include($W.paths.external + 'mjs.js');
    }

    V3.equals = function V3_equals(a, b) {
        return ((a[0] == b[0]) && 
                (a[1] == b[1]) && 
                (a[2] == b[2]));   
    }


    V3.Zero = V3.$(0,0,0);

    V3.parallelComponent = function(vec, unitBasis) {
        var projection = V3.dot(vec, unitBasis);
        return V3.scale(unitBasis, projection);
    }

    V3.perpendicularComponent = function(vec, unitBasis) {
        return V3.sub(vec, V3.parallelComponent(vec, unitBasis) );
    }

    V3.truncateLength = function(vec, maxLength) {
        var maxLengthSquared = maxLength * maxLength;
        var vecLengthSquared = V3.lengthSquared(vec);

        if (vecLengthSquared <= maxLengthSquared) {
            return vec;
        }else {
            return V3.scale(vec, (maxLength / Math.sqrt(vecLengthSquared)));
        }

    }

    V3.elements = function(vec) {
        return [vec[0], vec[1], vec[2]];
    }

    $W.util.blendScalar = function(smoothRate, newValue, smoothedAccumulator) {
        return $W.util.lerp($W.util.clip(smoothRate, 0, 1), smoothedAccumulator, newValue);
    }

    $W.util.blendVector = function(smoothRate, newValue, smoothedAccumulator) {
        var vA = [smoothedAccumulator[0], smoothedAccumulator[1], smoothedAccumulator[2]];
        var vB = [newValue[0], newValue[1], newValue[2]];

        return $W.util.lerpTriple($W.util.clip(smoothRate, 0, 1), vA, vB);
    };

    $W.util.sphericalWrapAround = function(position, center, radius) {
        var offset = V3.sub(position, center);
        var r = V3.length(offset);

        var neg2radius = -2 * radius;
        var offsetOver_r = V3.scale(offset, 1/r);
        var change = V3.scale(offsetOver_r, neg2radius);
        //console.log(V3.elements(position),V3.elements(change));



        if (r > radius) {
            return V3.add(position, V3.scale(
                            V3.scale(offset, 1/r), (radius * -2)));
        }else {
            return position;
        }
    }

    $W.OS= {};
    // OpenSteer -- Steering Behaviors for Autonomous Characters
    //
    // Copyright (c) 2002-2005, Sony Computer Entertainment America
    // Original author: Craig Reynolds <craig_reynolds@playstation.sony.com>
    //
    // Permission is hereby granted, free of charge, to any person obtaining a
    // copy of this software and associated documentation files (the "Software"),
    // to deal in the Software without restriction, including without limitation
    // the rights to use, copy, modify, merge, publish, distribute, sublicense,
    // and/or sell copies of the Software, and to permit persons to whom the
    // Software is furnished to do so, subject to the following conditions:
    //
    // The above copyright notice and this permission notice shall be included in
    // all copies or substantial portions of the Software.
    //
    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    // IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    // FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
    // THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    // LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
    // FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
    // DEALINGS IN THE SOFTWARE.
    $W.OS.vecLimitDeviationAngleUtility= function(isInside, source, cosineOfConeAngle, basis) {
        // immediately return zero length input vectors
        var sourceLength = V3.length(source);
        if (sourceLength == 0) {
            return source;
        }

        // measure the angular diviation of "source" from "basis"
        var direction = V3.scale(source, 1 / sourceLength);
        var cosineOfSourceAngle = V3.dot(direction, basis);

        // Simply return "source" if it already meets the angle criteria.
        if (isInside) {
            // source vector is already inside the cone, just return it
            if (cosineOfSourceAngle >= cosineOfConeAngle) return source;

        }else {
            // source vector is already outside the cone, just return it
            if (cosineOfSourceAngle <= cosineOfConeAngle) return source;
        }

        // find the portion of "source" that is perpendicular to "basis"
        var perp = V3.perpendicularComponent(source, basis);

        // normalize that perpendicular
        var unitPerp = V3.normalize(perp);

        // construct a new vector whose length equals the source vector,
        // and lies on the intersection of a plane (formed the source and
        // basis vectors) and a cone (whose axis is "basis" and whose
        // angle corresponds to cosineOfConeAngle)
        var perpDist = Math.sqrt(1 - (cosineOfConeAngle * cosineOfConeAngle));
        var c0 = V3.scale(basis, cosineOfConeAngle);
        var c1 = V3.scale(unitPerp, perpDist);

        return V3.scale( (V3.add(c0, c1)), sourceLength);
    };

    $W.OS.limitMaxDeviationAngle= function limitMaxDeviationAngle(source, cosineOfConeAngle, basis) {
        return $W.OS.vecLimitDeviationAngleUtility(true, source, cosineOfConeAngle, basis);
    };

    $W.OS.RandomVectorInUnitRadiusSphere=function RandomVectorInUnitRadiusSphere() {
        var v;


        do {
            v = V3.$((Math.random()*2) - 1,
                     (Math.random()*2) - 1,
                     (Math.random()*2) - 1);

        }while (V3.length(v) >= 1);

        return v;
    };

    $W.OS.RandomUnitVector=function RandomUnitVector() {
        return V3.normalize($W.OS.RandomVectorInUnitRadiusSphere());
    };

    $W.OS.LocalSpace=function LocalSpace() {
        var up;
        var side;
        var forward;
        var position;

        this.up       = function OS_LS_up() { return up; }
        this.side     = function OS_LS_side() { return side; }
        this.forward  = function OS_LS_forward() { return forward; }
        this.position = function OS_LS_position() { return position; }

        this.setUp       = function(u) { up = u; }
        this.setSide     = function(s) { side = s; }
        this.setForward  = function(f) { forward = f; }
        this.setPosition = function(p) { position = p; }

        this.rotationMatrix = function() {
            var m = [[],[],[],[]];

            m[0][0]=side[0];
            m[0][1]=side[1];
            m[0][2]=side[2];
            m[0][3]=0.0;
            
            m[1][0]=up[0];
            m[1][1]=up[1];
            m[1][2]=up[2];
            m[1][3]=0.0;

            m[2][0]=forward[0];
            m[2][1]=forward[1];
            m[2][2]=forward[2];
            m[2][3]=0.0;	

            m[3][0]=0;
            m[3][1]=0;
            m[3][2]=0;
            m[3][3]=1.0;

            return $M(m);
        }

        this.setUnitSideFromForwardAndUp = function() {
            side = V3.cross(forward, up);
            side = V3.normalize(side);
        }

        this.regenerateOrthonormalBasisUF = function(newUnitForward) {
            forward = newUnitForward;

            this.setUnitSideFromForwardAndUp();

            up = V3.cross(side, forward);
        }

        this.localRotateForwardToSide = function(v) {
            return V3.$(-v[2], v[1], v[0]);
        }

        this.resetLocalSpace = function() {
            forward = V3.$(0,0,1);
            side = this.localRotateForwardToSide(forward);
            up = V3.$(0,1,0);
            position = V3.$(0,0,0);
        }

        this.resetLocalSpace();
    };

    $W.OS.SimpleVehicle=function SimpleVehicle() {
        $W.OS.LocalSpace.call(this);
        $W.OS.steering.call(this);
        
        var mass     = 0.5;
        var radius   = 0.5;
        var speed    = 0;
        var maxForce = 0.1;
        var maxSpeed = 1.0;

        var smoothedAcceleration = V3.$(0,0,0);
        var smoothedPosition = this.position();

        this.smoothedPosition = function() { return smoothedPosition; }
        this.syncSmoothedPosition = function() { smoothedPosition = this.position(); }
        
        this.mass = function() { return mass; }
        this.radius = function() { return radius; }
        this.speed = function() { return speed; } 
        this.maxForce = function() { return maxForce; }
        this.maxSpeed = function() { return maxSpeed; }

        this.velocity = function() { return V3.scale(this.forward(), this.speed()); }

        this.setMass = function(m) { mass = m; }
        this.setRadius = function(r) { radius = r; }
        this.setSpeed = function(s) { speed = s; }
        this.setMaxForce = function(mf) { maxForce = mf; }
        this.setMaxSpeed = function(ms) { maxSpeed = ms; }

        this.resetSV = function() {
            this.setMass(1);
            this.setSpeed(0);
            
            this.setRadius(0.5);

            this.setMaxForce(0.1);
            this.setMaxSpeed(1.0);
        }

        this.reset = this.resetSV;

        this.adjustRawSteeringForce = function(force, elapsedTime) {
            var maxAdjustedSpeed = 0.2 * this.maxSpeed();

            if ((this.speed() > maxAdjustedSpeed) || (V3.equals(force, V3.Zero))) {
                return force;

            }else {
                var range = this.speed() / maxAdjustedSpeed;
                var cosine = $W.util.lerp(Math.pow(range, 20), 1.0, -1.0);
                return $W.OS.limitMaxDeviationAngle(force, cosine, this.forward());
            }
        }

        this.regenerateLocalSpace = function(newVelocity, elapsedTime) {
            if (this.speed() > 0) {
                this.regenerateOrthonormalBasisUF(
                        V3.scale(newVelocity, 1 / this.speed()));
            }
        }

        this.regenerateLocalSpaceForBanking = function(newVelocity, elapsedTime) {

            // the length of this global-upward-pointing vector controls the vehicle's
            // tendency to right itself as it is rolled over from turning acceleration
            var globalUp = V3.$(0, 0.5, 0);

            // acceleration points toward the center of local path curvature, the
            // length determines how much the vehicle will roll while turning
            var accelUp = V3.scale(smoothedAcceleration, 0.00);

            // combined banking, sum of UP due to turning and global UP
            var bankUp = V3.add(accelUp, globalUp);

            // blend bankUp into vehicle's UP basis vector
            var smoothRate = elapsedTime * 3;
            var tempUp = this.up();

            tempUp = $W.util.blendVector(smoothRate, bankUp, tempUp);
            
            this.setUp(V3.normalize(tempUp));

            // adjust orthonormal basis vectors to be aligned with new velocity
            if (this.speed() > 0) {
                this.regenerateOrthonormalBasisUF(
                        V3.scale(newVelocity, 1 / this.speed()));
            }
        }

        this.applySteeringForce = function(force, elapsedTime) {
            var adjustedForce = this.adjustRawSteeringForce(force, elapsedTime);

            // enforce limit on magnitude of steering force
            var clippedForce = V3.truncateLength(adjustedForce, this.maxForce());

            // compute acceleration and velocity
            var newAcceleration = V3.scale(clippedForce, 1 / this.mass());
            var newVelocity = this.velocity();

            // damp out abrupt changes and oscillations in steering acceleration
            // (rate is proportional to time step, then clipped into useful range)
            if (elapsedTime > 0) {
                var smoothRate = $W.util.clip(9 * elapsedTime, 0.15, 0.4)
                smoothedAcceleration = 
                    $W.util.blendVector(smoothRate, newAcceleration, smoothedAcceleration);
                
            }
            // Euler integrate (per frame) acceleration into velocity
            V3.add(V3.scale(smoothedAcceleration, elapsedTime), newVelocity, newVelocity);

            // enforce speed limit
            newVelocity = V3.truncateLength(newVelocity, this.maxSpeed());

            // update Speed
            this.setSpeed (V3.length(newVelocity));


            // Euler integrate (per frame) velocity into position
            this.setPosition(V3.add(this.position(), 
                                    V3.scale(newVelocity, elapsedTime)));


            // regenerate local space (by default: align vehicle's forward axis with
            // new velocity, but this behavior may be overridden by derived classes.)
            this.regenerateLocalSpace (newVelocity, elapsedTime);

            // maintain path curvature information
            // XXX implement
            //measurePathCurvature (elapsedTime);

            // running average of recent positions
            smoothedPosition = $W.util.blendVector(elapsedTime * 0.06,
                                                   this.position(),
                                                   this.smoothedPosition());
            smoothedPosition = this.position();

        }

        this.reset();
    };

    $W.OS.Boid=function Boid() {
        $W.OS.SimpleVehicle.call(this);

        this.update = function(elapsedTime, flock, worldRadius) {
            this.applySteeringForce(this.steerToFlock(flock), elapsedTime);
            this.sphericalWrapAround(worldRadius);
        }

        this.sphericalWrapAround = function(worldRadius) {
            if (V3.length(this.position()) > worldRadius) {
                this.setPosition($W.util.sphericalWrapAround(this.position(), 
                                                        V3.Zero, worldRadius));
                this.syncSmoothedPosition();
            }
        }

        this.regenerateLocalSpace = this.regenerateLocalSpaceForBanking;


        this.resetB = function() {
            this.resetSV();
            
            this.setMaxForce(.17);

            this.setMaxSpeed(.9);

            this.setSpeed(this.maxSpeed() * 0.3);

            var fwd = $W.OS.RandomUnitVector();
            fwd[1] = 0.3 * fwd[1];

            this.regenerateOrthonormalBasisUF(V3.normalize(fwd));


            this.setPosition(V3.scale($W.OS.RandomVectorInUnitRadiusSphere(),200));
        }

        this.reset = this.resetB;
        this.reset();
    };

    $W.OS.Flock=function Flock(boidCount, boidModel) {
        this.boidModel = boidModel;
        this.flock = [];
        this.worldRadius = 70;
        this.scale = 5;

        for (var i = 0; i < boidCount; i++) {
            this.flock.push(new $W.OS.Boid());
        };

        this.update = function OS_Flock_update(dt) {
            for(var i = 0; i < this.flock.length; i++) {
                this.flock[i].update(dt, this.flock, this.worldRadius);
            }

        }

        this.draw = function OS_Flock_draw() {
            for(var i = 0; i < this.flock.length; i++) {
                var dir = this.flock[i].side();
                this.boidModel.drawAt( V3.elements( V3.scale(this.flock[i].smoothedPosition(), 1/this.scale) ),
                                       this.flock[i].rotationMatrix(),
                                       this.boidModel.scale.elements );
            }
        }
    };

    $W.OS.steering=function steering() {
        this.steerToFlock = function OS_steerToFlock(flock) {
            var radiusScale = 2;
            var separationRadius =  5.0 * radiusScale;
            var separationAngle  = -0.707;
            var separationWeight =  8.0;
            
            var alignmentRadius = 7.5 * radiusScale;
            var alignmentAngle  = 0.7;
            var alignmentWeight = 10.0;
             
            var cohesionRadius = 9.0 * radiusScale;
            var cohesionAngle  = -0.15;
            var cohesionWeight = 10.0;

            var neighbors = [];

            for (var i = 0; i < flock.length; i++) {
                var other = flock[i];

                if (this.inBoidNeighborhood(other, separationRadius, cohesionRadius, 
                                             alignmentAngle)) {
                    neighbors.push(other);
                }
            }

            var separation = this.steerForSeparation (separationRadius, separationAngle, neighbors);
            var alignment  = this.steerForAlignment  (alignmentRadius, alignmentAngle, neighbors);
            var cohesion   = this.steerForCohesion   (cohesionRadius, cohesionAngle, neighbors);

            separation = V3.scale(separation, separationWeight);
            alignment = V3.scale(alignment, alignmentWeight);
            cohesion = V3.scale(cohesion, cohesionWeight);

            return  V3.add(separation, V3.add(alignment, cohesion));
        }

        this.steerForSeparation = function OS_steerForSeparation(maxDistance, cosMaxAngle, flock) {
            // steering accumulator and count of neighbors, both initially zero
            var steering = V3.$(0,0,0);
            var neighbors = 0;

            // for each of the other vehicles...
            for (var i = 0; i < flock.length; i++) {
                var other = flock[i];

                if (this.inBoidNeighborhood(other, this.radius() * 3, maxDistance, cosMaxAngle)) {
                    
                    // add in steering contribution
                    // (opposite of the offset direction, divided once by distance
                    // to normalize, divided another time to get 1/d falloff)
                    var offset = V3.sub(other.position(), this.position());
                    var invNegDistSquared = 1 / -(V3.dot(offset, offset));
                    var scaledOffset = V3.scale(offset, invNegDistSquared);
                    steering = V3.add(scaledOffset, steering);

                    // count neighbors
                    neighbors++;
                }
            }

            steering[1] = 0.1 * steering[1];
            steering = V3.normalize(steering);
            return steering;
        }

        this.steerForAlignment = function OS_steerForAlignment(maxDistance, cosMaxAngle, flock) {    
            var steering = V3.$(0,0,0);
            var neighbors = 0;

            // for each of the other vehicles...
            for (var i = 0; i < flock.length; i++) {
                var other = flock[i];

                if (this.inBoidNeighborhood(other, this.radius() * 3, maxDistance, cosMaxAngle)) {

                    // accumulate sum of neighbor's heading
                    V3.add(other.forward(), steering, steering);

                    // count neighbors
                    neighbors++;
                }
            }

            // divide by neighbors, subtract off current position to get error-
            // correcting direction, then normalize to pure direction
            if (neighbors > 0) {
                steering = V3.normalize( 
                                    V3.sub( V3.scale(steering, 1 / neighbors),       
                                            this.forward()));
            }

            return steering;
        }

        this.steerForCohesion = function OS_steerForCohesion(maxDistance, cosMaxAngle, flock) {    
            var steering = V3.$(0,0,0);
            var neighbors = 0;

            // for each of the other vehicles...
            for (var i = 0; i < flock.length; i++) {
                var other = flock[i];

                if (this.inBoidNeighborhood(other, this.radius() * 3, maxDistance, cosMaxAngle)) {
                    // accumulate sum of neighbor's positions
                    V3.add(other.position(), steering, steering);

                    // count neighbors
                    neighbors++;
                }
            }


            // divide by neighbors, subtract off current position to get error-
            // correcting direction, then normalize to pure direction
            if (neighbors > 0) {
                steering = V3.normalize( 
                                    V3.sub( V3.scale(steering, 1 / neighbors),       
                                            this.position()));
            }

            return steering;

        }


        this.inBoidNeighborhood = function OS_inBoidNeighborhood(other, minDistance, maxDistance, cosMaxAngle) {
            if (other === this) {
                return false;

            }else {
                var offset = V3.sub(other.position(), this.position());
                var distanceSquared = V3.lengthSquared(offset);

                // definitely in neighborhood if inside minDistance sphere
                if (distanceSquared < (minDistance * minDistance)){
                    return true;
                }else {
                    // definitely not in neighborhood if outside maxDistance sphere
                    if (distanceSquared > (maxDistance * maxDistance)) {
                        return false;
                    }else {
                        // otherwise, test angular offset from forward axis
                        var unitOffset = V3.scale(offset, 1 / Math.sqrt(distanceSquared));
                        var forwardness= V3.dot(this.forward(), unitOffset);
                        return forwardness > cosMaxAngle;
                    }
                }
            }
        }
    };



    /** @class A Particle emitter utility class.
     * @param {Vector} position The point in space particles will
     * be emitted from.
     * @param {Function} init Class function for a single particle.
     * @param {Function} update Function to call to update each particle.
     */
    $W.PointPartcleEmitter = function(position, init, update) {
        $W.ObjectState.call(this); // subclass of ObjectState
        

    }


    /** @class A physical simulation.  */
    $W.SimulatedObject = function(physType) {
        $W.Object.call(this, $W.GL.TRIANGLES);

        if (typeof($W.world) == 'undefined') {
            $W.world = { 
                objects:[],
                age:0,

                update:function(dt) {
                    // Cleared per frame
                    for (var i = 0; i < this.objects.length; i++) {
                        this.objects[i].alreadyCollidedWith = [];
                    }
                    for (var i = 0; i < this.objects.length; i++) {
                        this.objects[i].updateSim(dt);
                    }
                }
            }
        }
        this.index = $W.world.objects.length;
        $W.world.objects.push(this); // Add this to global physical object list

        /** Forces to be applied this frame.
         * Cleared with each call to update()
         */
        this.impulses = [];

        this.alreadyCollidedWith = [];

        /** Type of object to simulate
         * "sphere" or "wall" are valid
         */
        this.physType = physType;

        /** Bounding sphere radius */
        this.radius = 5;
        /** Object mass */
        this.mass = 1;
        /** Object velocity */
        this.velocity = Vector.Zero(3);
        /** Angular velocity */
        this.omega = Vector.Zero(3);
        /** Coefficient of restitution */
        this.restitution = 1;

        this.maxSpeed = 0.02;

        this.applyImpulse = function(impulse) {
            this.impulses.push(impulse);
        }

        this.shouldTestCollisionWith = function(object) {
            // Walls don't collide
            if (this.physType == "wall" && object.physType == "wall"){
                return false;
            }

            // Don't test collision against self
            if (this.index === object.index) {
                return false;
            }

            // Don't recalc collisions if we've already tested
            for (var i = 0; i < object.alreadyCollidedWith.length; i++) {
                if (this.index === object.alreadyCollidedWith[i]) {
                    return false;
                }
            }

            return true;
        }

        this.tempSphereForWallCollision = function(other) {
            var sphere = {};
            sphere.velocity = this.velocity;
            sphere.impulses = [];
            sphere.applyImpulse = function(){};
            sphere.radius = this.radius;
            sphere.position = this.line.pointClosestTo(other.position);
            sphere.physType = "wall";
            return sphere;
        }

        this.performCollisions = function(dt) {
            for (var i = 0; i < $W.world.objects.length; i++) {
                var object = $W.world.objects[i];

                if (this.shouldTestCollisionWith(object) && this.isColliding(object)) {
                    var a = this;
                    var b = object;

                    if (a.physType == "wall") {
                        a = a.tempSphereForWallCollision(b);
                    }
                    if (b.physType == "wall") {
                        b = b.tempSphereForWallCollision(a);
                    }

                    var t = collisionDeltaOffset(this, object);
                    dt += t;

                    var actionNormal = a.position.subtract(b.position).toUnitVector();
                    a.position = a.position.add(b.velocity.x(t));
                    b.position = b.position.add(a.velocity.x(t));

                    var vDiff = a.velocity.subtract(b.velocity);
                    var relativeNormalVelocity = vDiff.dot(actionNormal);

                    var impulse = actionNormal.x(relativeNormalVelocity);
                    object.applyImpulse(impulse.x(1 / object.mass).x(this.restitution));
                    this.applyImpulse(impulse.invert().x(1 / this.mass).x(object.restitution));
                }

                object.alreadyCollidedWith.push(this.index);
            }
        }

        this.updateSim = function(dt) {
            //--- calculate forces ---
            this.performCollisions(dt);


            //--- calculate velocities ---
            // Apply accrued impulses
            while (this.impulses.length > 0) {
                this.velocity = this.velocity.add(this.impulses.pop());
            }

            var temp = V3.$(this.velocity.e(1), this.velocity.e(2), this.velocity.e(3));
            //this.velocity.elements = V3.elements(V3.truncateLength(temp, this.maxSpeed));

            //--- integrate position/rotation ---
            this.position = this.position.add(this.velocity.x(dt));
        }

        var areColliding = function(a, b) {
            return didCollide(a, b, 0);
        }

        var collisionDeltaOffset = function(a, b) {
            // Back up to when the collision occurred
            // Otherwise objects could get stuck inside one another
            var t = 0;
            while (t < $W.timer.dt && didCollide(a, b, t++)) {}
            return t; // to catch back up
        }

        var didCollide = function(a, b, t) {
            if (a.physType == "wall" && b.physType == "wall") { return false; }
            var pa;
            var pb;

            if (a.physType == "sphere") {
                pa = a.position;
            }else if (a.physType == "wall") {
                pa = a.line.pointClosestTo(b.position);
            }

            if (b.physType == "sphere") {
                pb = b.position;
            }else if (b.physType == "wall") {
                pb = b.line.pointClosestTo(a.position);
            }

            return $W.util.sphereCollide(
                    pa.subtract(a.velocity.x(t)),
                    pb.subtract(b.velocity.x(t)), 
                    a.radius, b.radius);
        }

        this.isColliding = function(obj) {
            return areColliding(this, obj);
        }
    }


    /** Parse a .obj model file
     * XXX Not quite working.
     * @return model An object containing model data as flat
     * arrays.
     * @return model.vertices Vertices of the object.
     * @return model.normals Normals of the object.
     * @return model.texCoords Texture coordinates of the object.
     * @return model.faces Element indices of the object.
     */
    $W.util.parseOBJ = function(obj) {
        console.group("Processing .obj file...");
        var data = {};
        var model = {};
        var counts = [0,0,0,0];

        var getDataFromLinesStartingWith = function(str) {
            var data = [];
            var linePattern = new RegExp("^" + str + "\\s.*", 'gim');


            var lines = obj.match(linePattern);
            if (lines !== null) {
                for (var i = 0; i < lines.length; i++) {
                    data.push(lines[i].match(/[-0-9e/\.\+]+/gi));
                }
            }

            return data;
        };


        data.vertices   = getDataFromLinesStartingWith('v');
        data.normals    = getDataFromLinesStartingWith('vn');
        data.texCoords  = getDataFromLinesStartingWith('vt');
        data.faces      = getDataFromLinesStartingWith('f');

        for (var f = 0; f < data.faces.length; f++) {
            var face = data.faces[f];

            if (face.length === 4) {
                data.faces[f] = [face[0],face[1],face[2]];
                data.faces.push([face[1],face[2],face[3]]);
            }
        }

        model.vertices   = [];
        model.normals    = [];
        model.texCoords  = [];
        // face format : v/vt/vn
        for (var f = 0; f < data.faces.length; f++) {
            for (var v = 0; v < data.faces[f].length; v++) {
                var vertex = data.faces[f][v].split('/');;

                model.vertices  = 
                    model.vertices.concat (data.vertices [vertex[0]-1]); // v
                model.texCoords = 
                    model.texCoords.concat(data.texCoords[vertex[1]-1]); // vt
                model.normals   = 
                    model.normals.concat  (data.normals  [vertex[2]-1]); // vn
            }
        };

        model.vertexCount = model.vertices.length / 3;

        console.log(data.vertices.length + " unique vertices" +
                "\n" + data.faces.length + " faces" +
                "\nfor a total of " + model.vertexCount + " model vertices"
                );
        console.groupEnd();

        model.data = data;
        return model;
    }
};
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
$W.initUtil = function() {
    if ($W.util === undefined) {
        $W.util = {
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

                $W.debug("\tCompleted with status: " + xhr.status);

                return xhr.responseText;

            },

            include: function(path) {
                var script = $W.util.loadFileAsText(path);
                window.eval(script);
            }
        }
    };

    $W.util.loadFileAsJSON = function UTIL_loadFileAsJSON(path) {
        // Get JSON text from file
        var file = $W.util.loadFileAsText(path);

        // Reformat to single line and surround with ()
        var JSONtext = '(' + file.replace(/\n/g, '') + ')';

        // Evaluate to JSON object 
        var JSON = eval(JSONtext)

        return JSON
    };

    $W.initWebGL = function(canvas) {
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

            $W.log('WebGL initialized');
            return true;
        }else {
            $W.log('WebGL init failed');
            return false;
        }
    };

    $W.util.genDummyArray = function(contents, repeat) {
        var result = [];
        for (var i = 0; i < repeat; i++) {
            result = result.concat(contents);
        }
        return result;
    };


    /** Clips a value to a given range.
     * @param {Number|null} min The minimum value this function can
     * return. If null is passed, there is no minimum.
     * @param {Number|null} max The maximum value this function can
     * return. If null is passed, there is no minimum.
     * @param {Number} val The value to clip.
     */
    $W.util.clip= function UTIL_clip(val, min, max) {
        if (min !== null && val < min) {
            return min;
        }else if (max !== null && val > max) {
            return max;
        }else {
            return val;
        }
    };

    $W.util.sphereCollide=function UTIL_sphereCollide(p1, p2, r1, r2) {
        return p1.distanceFrom(p2) < r1 + r2;
    };

    /** Get axis/angle representation of the rotation.
     * Based on http://www.euclideanspace.com/maths/geometry/rotations/conversions/eulerToAngle/index.htm
     * XXX unused
     */
    $W.util.getAxisAngle = function UTIL_getAxisAngle(rotation) {
        if (rotation.elements == [0,0,0]) {return {angle:0,axis:[1,0,0]};}
        var c1 = Math.cos(rotation.e(2) / 2); // c1 = cos(heading / 2)
        var c2 = Math.cos(rotation.e(1) / 2); // c2 = cos(attitude / 2)
        var c3 = Math.cos(rotation.e(3) / 2); // c3 = cos(bank / 2)
        var s1 = Math.sin(rotation.e(2) / 2); // s1 = sin(heading / 2) 
        var s2 = Math.sin(rotation.e(1) / 2); // s2 = sin(attitude / 2)
        var s3 = Math.sin(rotation.e(3) / 2); // s3 = sin(bank / 2)    

        var result = {};

        result.angle = 2 * Math.acos(c1*c2*c3 - s1*s2*s3);

        result.axis = [];
        result.axis[0] = s1*s2*c3 + c1*c2*s3;
        result.axis[1] = s1*c2*c3 + c1*s3*s3;
        result.axis[2] = c1*s2*c3 - s1*c2*s3;

        // Normalize
        var mag = Math.sqrt(result.axis[0]*result.axis[0] + result.axis[1]*result.axis[1] + result.axis[2]*result.axis[2]);
        //if (Math.abs(result.axis[0]) > 1) result.axis[0] /= mag;
        //if (Math.abs(result.axis[1]) > 1) result.axis[1] /= mag;
        //if (Math.abs(result.axis[2]) > 1) result.axis[2] /= mag;

        return result;
    };

    /** Generate vertices, normals, texture coordinates, and element 
     * indices for a sphere. Intended to be rendered with setElements.
     * XXX Not a 'sliced' sphere, need to fix that.
     * @param rings Number of horizontal rings that make up the sphere.
     * @param slices Number of triangles per ring.
     * @param [r] The radius of the sphere, defaults to 1.0 if omitted.
     *
     * @returns sphere Object containing sphere data.
     * @returns {Array} sphere.vertices Vertices for sphere of radius r.
     * @returns {Array} sphere.normals Normals for sphere with given number
     * of rings and slices.
     * @returns {Array} sphere.texCoords Texture coordinates for sphere 
     * with given number of rings and slices.
     * @returns {Array} sphere.indices Per element indices.
     */
    $W.util.genSphere= function UTIL_genSphere(rings, slices, r) {
        // Default to 10 rings and 10 slices
        if (rings === undefined) { var rings = 10; }
        if (slices === undefined) { var slices = 10; }
        // Default to unit sphere
        if (r === undefined) { var r = 1; }

        var sphere = {};
        sphere.vertices = [];
        sphere.normals  = [];
        sphere.texCoords= [];
        sphere.indices  = [];

        for (var ring = 0; ring <= rings; ++ring) {
            for (var slice   = 0; slice <= slices; ++slice) {
                var theta    = ring * Math.PI / rings;
                var phi      = slice * 2 * Math.PI / slices;

                var sinTheta = Math.sin(theta);
                var cosTheta = Math.cos(theta);

                var sinPhi   = Math.sin(phi);
                var cosPhi   = Math.cos(phi);

                var x = cosPhi * sinTheta;
                var y = cosTheta;
                var z = sinPhi * sinTheta;

                var u = 1 - (slice / slices);
                var v = Math.abs(ring - 1) * (1 / rings);
                
                sphere.vertices = sphere.vertices.concat([r*x, r*y, r*z]);
                sphere.normals = sphere.normals.concat([x, y, z]);
                sphere.texCoords = sphere.texCoords.concat([u,v]);
            }
        }

        for (var ring = 0; ring < rings; ring++) {
            for (var slice = 0; slice < slices; slice++) {
                var a = (ring * slices) + ring + slice;
                var b = a + 1;
                var c = b + slices;
                var d = c + 1;

                sphere.indices = sphere.indices.concat([a, b, c]);
                sphere.indices = sphere.indices.concat([c, d, b]);
            }
        }

        return sphere;
    };

    /** Spherical linear interpolation. For interpolating quaternions.
     * Based on reference implementation at http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/index.htm
     * @param {Number} t How far along to interpolate.
     * @param {Quaternion} q1 {@link Quaternion} to interpolate from.
     * @param {Quaternion} q2 {@link Quaternion} to interpolate to.
     */
    $W.util.slerp=function UTIL_slerp(t, q1, q2) {
        var result = new $W.Quaternion();

        var cosHalfTheta = q1.w * q2.w + q1.x * q2.x + q1.y * q2.y + q1.z * q2.z;

        // q1 == q2
        if (Math.abs(cosHalfTheta) >= 1) {
            result.w = q1.w;
            result.x = q1.x;
            result.y = q1.y;
            result.z = q1.z;

        }else {
            var halfTheta = Math.acos(cosHalfTheta);
            var sinHalfTheta = Math.sqrt(1 - cosHalfTheta * cosHalfTheta);

            // Theta = 180, any direction is valid
            if (Math.abs(sinHalfTheta) < 0.001) {
                result.w = q1.w * 0.5 + q2.w * 0.5;
                result.x = q1.x * 0.5 + q2.x * 0.5;
                result.y = q1.y * 0.5 + q2.y * 0.5;
                result.z = q1.z * 0.5 + q2.z * 0.5;

            // Spherical linear interpolation
            }else {
                // Ratios
                var a = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
                var b = Math.sin(t * halfTheta) / sinHalfTheta;

                result.w = q1.w * a + q2.w * b;
                result.x = q1.x * a + q2.x * b;
                result.y = q1.y * a + q2.y * b;
                result.z = q1.z * a + q2.z * b;
            }
        }

        return result;
    };

    /** Linear interpolation between numbers.
     * @param {Number} a Value to interpolate from.
     * @param {Number} b Value to interpolate to.
     * @param {Number} t Value from 0 to 1 representing the fraction
     * between the two values to interpolate by.
     */
    $W.util.lerp= function UTIL_lerp(t,a,b) {
        return a + t * (b - a);
    };

    /** Linear interpolation between triples
     * @param {Array of 3 elements} a Array of values to interpolate from.
     * @param {Array of 3 elements} b Array of values to interpolate to.
     * @param {Number} t Value from 0 to 1 representing the fraction
     * between the two sets of values to interpolate by.
     */
    $W.util.lerpTriple=function UTIL_lerpTriple(t,a,b) {
        return [$W.util.lerp(t, a[0], b[0]),
                $W.util.lerp(t, a[1], b[1]),
                $W.util.lerp(t, a[2], b[2])
        ];
    };



    /** Calculates the 3x3 inverse transpose of the Model-View matrix.
     * Returns it in a format suitable to be passed directly as shader
     * uniform.
     * @return {WebGLFloatArray} 3x3 inverse transpose, ready to be sent as
     * a uniform.
     */
    $W.util.getNormalMatrixForUniform= function UTIL_getNormalMatrixForUniform() {
        return new WebGLFloatArray($W.modelview.matrix.inverse().transpose().make3x3().flatten());
    };

    /** Create a WebGL context for the specified canvas.
     * @param {Canvas} canvas A canvas element.
     * @return {WebGL Context} A WebGL context for the passed
     * canvas.
     */
    $W.util.getGLContext= function UTIL_getGLContext(canvas) {
        var gl = null;
        var type = '';

        try { if (!gl) {                       
                  type = '3d';                 
                  gl = canvas.getContext(type);
        }} catch (e){}
        try { if (!gl) { 
                  type = 'moz-webgl';
                  gl = canvas.getContext(type); 
        }} catch (e){}
        try { if (!gl) {                       
                  type = 'webkit-3d';          
                  gl = canvas.getContext(type);
        }} catch (e){}
        try { if (!gl) {                       
                  type = 'webgl';          
                  gl = canvas.getContext(type);
        }} catch (e){}

        if (!!gl) { $W.debug('using ' + type); }

        return gl;
    };

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
    $W.util.loadSylvester = function() {
        $W.util.include($W.paths.external + $W.paths.sylvester);

        Matrix.Translation = function MTX_Translation (v) {
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


        Matrix.prototype.trace = function MTX_trace() {
            return this[0][0] + this[1][1] + this[2][2];
        }

        Matrix.prototype.flatten = function MTX_flatten() {
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

        Matrix.prototype.ensure4x4 = function MTX_ensure4x4()
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

        Matrix.prototype.make3x3 = function MTX_make3x3()
        {
            if (this.elements.length != 4 ||
                    this.elements[0].length != 4) {
                return null;
            }

            return Matrix.create([[this.elements[0][0], this.elements[0][1], this.elements[0][2]],
                    [this.elements[1][0], this.elements[1][1], this.elements[1][2]],
                    [this.elements[2][0], this.elements[2][1], this.elements[2][2]]]);
        };

        Vector.prototype.flatten = function VEC_flatten() {
            return this.elements;
        }; 

        Vector.prototype.vec3Zero = Vector.Zero(3);

        Vector.prototype.invert = function VEC_invert() {
            return Vector.prototype.vec3Zero.subtract(this);
        }
    };

    $W.util.extendArray = function() {
        $W.util.searchArrayByPropertyValue = function(arr, propertyName, value) {
            for (var i = 0; i < arr.length; i++) {
                if (arr[i][propertyName] === value) {
                    return arr[i];
                }
            }
            return null;
        };                                              

        $W.util.searchArrayByName = function(arr, name) {
            return $W.util.searchArrayByPropertyValue(arr, 'name', name);
        };

        Array.prototype.findByPropertyValue = function(propertyName, value) {
            for (var i = 0; i < this.length; i++) {
                if (this[i][propertyName] === value) {
                    return this[i];
                }
            }
            return null;
        };

        Array.prototype.findByName = function(value) {
            return this.findByPropertyValue('name', value);
        };

        Array.prototype.findByAttributeValue = Array.prototype.findByPropertyValue;

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
        Array.prototype.flatten = function ARR_flatten(){
            var res = [];
            if (this[0].length !== undefined) {
                for (var i = 0; i < this.length; i++) {
                    res = res.concat(this[i]);
                }
            }else {
                res = this;
            }
            return res;
        };
        $W.util.flattenArray = function UTIL_flattenArray(arr) {
            var res = [];
            if (arr[0].length !== undefined) {
                for (var i = 0; i < arr.length; i++) {
                    res = res.concat(arr[i]);
                }
            }else {
                res = arr;
            }
            return res;
        };

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
        };

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
        };
    };



    // Classes
    /** @class Quaternion implementation.
     * based on reference implementation at 
     * http://3dengine.org/Quaternions
     */
    $W.Quaternion = function() {
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
    };

    /** 
     * Useful, but not necessay if provide your own draw calls
     * @class Keeps track of viewport camera characteristics. 
     */
    $W.Camera = function() {
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
    };


    /** @class Keeps track of time since application start.
     * Provides delta time between ticks.
     */
    $W.Timer = function () {
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
    };

    /** @class Provides an easy way to track FPS. */
    $W.FPSTracker = function () {
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
    };

    /** Clear the canvas */
    $W.util.clear = function UTIL_clear() {
        // clearing the color buffer is really slow
        $W.GL.clear($W.GL.COLOR_BUFFER_BIT|$W.GL.DEPTH_BUFFER_BIT);
    },
            
    $W.util.setupMatrices = function UTIL_setupMatrices() {
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
    };

    $W.util.drawObjects = function UTIL_drawObjects() {
        for (var i = 0; i < $W.renderables.length; i++) {
            $W.objects[i].draw();
        }
    };

    /** Draw all objects from the camera's perspective. */
    $W.util.defaultDraw = function UTIL_defaultDraw() {
        $W.util.clear();
        $W.util.setupMatrices();
        $W.util.drawObjects();                            
        $W.GL.flush();
    };

    /** Update the internal timer and FPS counter */
    $W.util.updateState = function UTIL_updateState() {
        $W.timer.tick();
        $W.fpsTracker.update($W.timer.dt);
        $W.FPS = Math.round($W.fpsTracker.fps);
    };

    /** Update all objects and textures. */
    $W.util.defaultUpdate = function UTIL_defaultUpdate() {
        $W.util.updateState();

        for (var i = 0; i < $W.objects.length; i++) {
            $W.objects[i].update($W.timer.dt);
        }

        for (var i = 0; i < $W.textures.length; i++) {
            $W.textures[i].update();
        }

        $W.camera.update();
    };

    $W.util.extendArray();
    $W.util.loadSylvester();
};
$W.initConstants = function() {
    /** @namespace Contains (semi)constant values that generally shouldn't be 
     * changed.
     */
    $W.constants = {};

    /** @namespace Color constants */
    $W.constants.colors = {
      RED  :[1.0, 0.0, 0.0],
      GREEN:[0.0, 1.0, 0.0],
      BLUE :[0.0, 0.0, 1.0],
      GREY :[0.5, 0.5, 0.5],
      WHITE:[1.0, 1.0, 1.0],
      BLACK:[0.0, 0.0, 0.0]
    };

    /** The name that a uniform variable needs to have to be automatically
     * identified as the Model-View Matrix.
     */
    $W.constants.ModelViewUniform    = 'ModelViewMatrix',

    /** The name that a uniform variable needs to have to be automatically
     * identified as the Projection Matrix.
     */
    $W.constants.ProjectionUniform   = 'ProjectionMatrix',

    /** The name that a uniform variable needs to have to be automatically
     * identified as the Normal Matrix.
     */
    $W.constants.NormalMatrixUniform = 'NormalMatrix'


    /** Data for a unit cube.
     * Intended to be used with setElements.
     */
    $W.constants.unitCube = {
        /** Vertices on the unit cube. */
        vertices : [
            // Front face
            -1.0, -1.0,  1.0,
             1.0, -1.0,  1.0,
             1.0,  1.0,  1.0,
            -1.0,  1.0,  1.0,
            
            // Back face
            -1.0, -1.0, -1.0,
            -1.0,  1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0, -1.0, -1.0,
            
            // Top face
            -1.0,  1.0, -1.0,
            -1.0,  1.0,  1.0,
             1.0,  1.0,  1.0,
             1.0,  1.0, -1.0,
            
            // Bottom face
            -1.0, -1.0, -1.0,
             1.0, -1.0, -1.0,
             1.0, -1.0,  1.0,
            -1.0, -1.0,  1.0,
            
            // Right face
             1.0, -1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0,  1.0,  1.0,
             1.0, -1.0,  1.0,
            
            // Left face
            -1.0, -1.0, -1.0,
            -1.0, -1.0,  1.0,
            -1.0,  1.0,  1.0,
            -1.0,  1.0, -1.0

        ],
          
        /** Normals on the unit cube. */
        normals : [
            // Front
             0.0,  0.0,  1.0,
             0.0,  0.0,  1.0,
             0.0,  0.0,  1.0,
             0.0,  0.0,  1.0,
            
            // Back
             0.0,  0.0, -1.0,
             0.0,  0.0, -1.0,
             0.0,  0.0, -1.0,
             0.0,  0.0, -1.0,
            
            // Top
             0.0,  1.0,  0.0,
             0.0,  1.0,  0.0,
             0.0,  1.0,  0.0,
             0.0,  1.0,  0.0,
            
            // Bottom
             0.0, -1.0,  0.0,
             0.0, -1.0,  0.0,
             0.0, -1.0,  0.0,
             0.0, -1.0,  0.0,
            
            // Right
             1.0,  0.0,  0.0,
             1.0,  0.0,  0.0,
             1.0,  0.0,  0.0,
             1.0,  0.0,  0.0,
            
            // Left
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0

        ],
          
        /** Texture coordinates on the unit cube. */
        texCoords : [
            // Front
            0.0,  0.0,
            1.0,  0.0,
            1.0,  1.0,
            0.0,  1.0,
            // Back
            0.0,  0.0,
            1.0,  0.0,
            1.0,  1.0,
            0.0,  1.0,
            // Top
            0.0,  0.0,
            1.0,  0.0,
            1.0,  1.0,
            0.0,  1.0,
            // Bottom
            0.0,  0.0,
            1.0,  0.0,
            1.0,  1.0,
            0.0,  1.0,
            // Right
            0.0,  0.0,
            1.0,  0.0,
            1.0,  1.0,
            0.0,  1.0,
            // Left
            0.0,  0.0,
            1.0,  0.0,
            1.0,  1.0,
            0.0,  1.0
        ],

        /** Per element indices for unit cube */
        indices : [
            0,  1,  2,      0,  2,  3,    // front
            4,  5,  6,      4,  6,  7,    // back
            8,  9,  10,     8,  10, 11,   // top
            12, 13, 14,     12, 14, 15,   // bottom
            16, 17, 18,     16, 18, 19,   // right
            20, 21, 22,     20, 22, 23    // left
        ]
    };

};

$W.initDefaultUniformActions = function() {
    $W.uniformActions = [];
    $W.uniformNames = {};
    $W.uniformNames.ModelView       = 'ModelViewMatrix';
    $W.uniformNames.Projection      = 'ProjectionMatrix';
    $W.uniformNames.NormalMatrix    = 'NormalMatrix';
    $W.uniformNames.SimpleTexture   = 'sampler';
    $W.uniformNames.MaterialTexture = 'wglu_mat_texture';
    ModelViewAction = 
        function DUA_ModelViewAction(_, object, material) {
            $W.GL.uniformMatrix4fv(this.location, false, 
                    $W.modelview.getForUniform());
        };

    ProjectionAction = 
        function DUA_ProjectionAction(_, object, material) {
            $W.GL.uniformMatrix4fv(this.location, false, 
                    $W.projection.getForUniform());
        };

    NormalMatrixAction = 
        function DUA_NormalMatrixAction(_, object, material){
            $W.GL.uniformMatrix3fv(this.location, false, 
                    $W.util.getNormalMatrixForUniform());
        };

    SimpleSamplerAction = 
        function DUA_SimpleSamplerAction(_, object, material) {
            try {
                var gl = $W.GL;
                gl.activeTexture(gl.TEXTURE0);
                $W.textures[object.textures[0]].bind();
                gl.uniform1i(this.location, 0);
            }catch (e) {
                console.error("Simple texture uniform error");
                console.error(e);
            }
        };

    MaterialTextureAction = 
        function DUA_MaterialTextureAction(_, object, material) {
            try {
                $W.GL.activeTexture($W.GL.TEXTURE0);
                if (typeof(material.textures[0]) === 'undefined') {
                    $W.textures.wglu_internal_missing_texture.bind();
                }else {
                    $W.textures[material.textures[0]].bind();
                }
                $W.GL.uniform1i(this.location, 0);
            }catch (e) {
                console.error("Material texture uniform error");
                console.error(e);
            }
        };

    genMultiTextureAction = function DUA_genMultiTextureAction(texNum) {
        eval("var action = \n"+
"        function DUA_MultiTextureAction"+texNum+"(_ , object, material) {\n"+
"           try {\n"+
"               $W.GL.activeTexture($W.GL.TEXTURE0);\n"+
"               if (typeof(material.textures["+texNum+"]) === 'undefined') {\n"+
"                   $W.textures.wglu_internal_missing_texture.bind();\n"+
"               }else {\n"+
"                   $W.textures[material.textures["+texNum+"]].bind();\n"+
"               }\n"+
"               $W.GL.uniform1i(this.location, "+texNum+");\n"+
"           }catch (e) {\n"+
"               console.error('Material texture uniform error');\n"+
"               console.error(e);\n"+
"           }\n"+
"        }");
        return action;
    };
            


    $W.uniformActions[$W.constants.ModelViewUniform]  = ModelViewAction;
    $W.uniformActions[$W.constants.ProjectionUniform] = ProjectionAction;
    $W.uniformActions[$W.constants.NormalUniform]     = NormalMatrixAction;
    $W.uniformActions[$W.constants.SimpleTextureUniform] = SimpleSamplerAction;

    $W.util.getUniformAction = function(name) {
        var action = $W.uniformActions[name];

        if (typeof(action) === 'undefined') {
            action = function(){};
            $W.debug("\tno default action for uniform `" + name + "` found");
                

        }else {
            $W.debug("\tfound `" + action.name + "` for uniform `" + name + "`");
        }

        return action;
    };
};

$W.initGLSL = function() {
    /** 
     * @namespace Contains objects for working with GLSL shaders and
     * shader programs
     */
    $W.GLSL = {
        shaderVarLengths: {
            int:1,
            float:1,
            bool:1,
            vec2:2,
            vec3:3,
            vec4:4
        },

        uniformSetters: {
            int:function(value) {
                $W.GL.uniform1i(this.location, value);
            },
            float:function(value) {
                $W.GL.uniform1f(this.location, value);
            },
            vec2:function(value) {
                $W.GL.uniform2fv(this.location, value);
            },
            vec3:function(value) {
                $W.GL.uniform3fv(this.location, value);
            },
            vec4:function(value) {
                $W.GL.uniform4fv(this.location, value);
            },
            mat3:function(value) {
                $W.GL.uniformMatrix3fv(this.location, value);
            },
            mat4:function(value) {
                $W.GL.uniformMatrix4fv(this.location, value);
            },
            sampler2D:function(value) {
                $W.GL.uniform1i(this.location, value);
            }
        }

    };

    $W.GLSL.util = {
        getUniformSetter: function GLSL_getUniformSetter(type){
            setter = $W.GLSL.uniformSetters[type];

            if (typeof(setter) !== 'undefined') {
                return setter;
            }else {
                console.error("No setter for uniform of type `" + type + "`");
                return null;
            }
        },

        getShaderSourceById: function(id) {
            var source;
            var shaderScript = document.getElementById(id);
            if (!shaderScript) {
                console.error("No script with id '" + id + "'");
                return null;
            }
        
            source = "";
            var k = shaderScript.firstChild;
            while (k) {
                if (k.nodeType === 3) {
                    source += k.textContent;
                }
                k = k.nextSibling;
            }
        
            return source;
        },
        
        getShaderTypeById: function(id) {
            var type;
            var shaderScript = document.getElementById(id);
            if (!shaderScript) {
                console.error("No script with id '" + id + "'");
                return null;
            }
        
            if (shaderScript.type === "x-shader/x-fragment") {
                type = $W.GL.FRAGMENT_SHADER;
            } else if (shaderScript.type === "x-shader/x-vertex") {
                type = $W.GL.VERTEX_SHADER;
            } else {
                console.warn('invalid shader type' + shaderScript.type);
            }
        
            return type;
        }
    };


    /** @class Holds data for shader attribute variables.
     * @param {String} name Attributes have the name they are given in
     * the shader code.
     */
    $W.GLSL.Attribute = function (name, length, location) {
        this.name = name;
        this.length = length;
        this.location = location;
        this.clone = function() {
            return new $W.GLSL.Attribute(this.name, this.length, this.location);
        }
    };



    /** @class Holds data for shader uniform variables
     * @param {String} name Uniforms have the name they are given in
     * the shader code.
     * @param {Function} action The function to update the data in the 
     * uniform each frame.
     */
    $W.GLSL.Uniform = function (name, action, type, location) {
        this.name = name;
        this.location = location;  // only used by the shader program
        this.action = action;
        this.type = type;

        this.set =$W.GLSL.util.getUniformSetter(type);

        this.clone = function() {
            return new $W.GLSL.Uniform(this.name, this.action, this.type, this.location);
        }
    };


    /** @class Handles compilation, attributes, and uniforms of a GLSL
     * shader.
     * @param {String} name All shaders need a unique name
     * @param {String} [src] The source code, if not included then
     * name is assumed to be a DOM element Id to a script element 
     * containing the source code for a shader.
     * @param [type] The type of shader, valid types are<br>
     * $W.GL.VERTEX_SHADER<br>
     * $W.GL.FRAGMENT_SHADER<br>
     */
    $W.GLSL.Shader = function(name, src, type) {
        $W.log("creating shader '" + name + "'");
        $W.indentLog();
        $W.shaders[name] = this;

        /** Name of the shader. */
        this.name = name;
        var name = this.name;

        /** Source code of the shader. */
        var source = src;

        /** Shader type $W.GL.VERTEX_SHADER or $W.GL.FRAGMENT_SHADER. */
        this.type = -1;

        // If the source wasn't passed in we assume name is an element
        // ID in the page
        if (source === undefined) {
            source = getShaderSourceById(name);
            this.type = getShaderTypeById(name);

        // Else we just use the provided source and type
        }else {
            this.type = type;
        }

        /** The WebGL shader object. */
        var glShader = null;

        /** Attributes for this shader. */
        this.attributes = [];
        /** Uniforms for this shader. */
        this.uniforms   = [];

        /** Names of programs which use this shader. */
        var programs   = [];

        /** Tracks if this shader need to be (re)compiled. */
        var isDirty = true;

        // TODO Have _dirty and _clean update the dirty status of all
        // programs which use this shader.
        var dirty = function() {
            glShader = null;
            $W.log("Marking shader `" + name + "` as dirty", $W.LL.INFO);
            for (var i = 0; i < programs.length; i++) {
                $W.log('dirtying program `' + programs[i] + "`", $W.LL.INFO);
                $W.programs[programs[i]].dirty();                            
            }
            isDirty = true;
        };

        var clean = function() {
            isDirty = false;
        };
        this.isDirty = function() {
            return isDirty;
        };


        this.addProgram = function(name) {
            programs.push(name);
        };
        this.removeProgram = function(name) {
            programs = programs.remove(name);
        };
        
        /** Change the source for this shader 
         * @param {String} src The source code.
         */
        this.setSource = function(src) {
            dirty();
            source = src;
        };

        this.source = function() {
            return source;
        };

        /** @returns The raw WebGL shader object */
        this.getGLShader = function() {
            // Ensure the shader is valid before we return it
            if (isDirty) {
                $W.info("'" + this.name + "' is dirty");
                if (!this.compile()) {
                    return false;
                }else {
                    clean();
                }
            }else {
                $W.info("'" + this.name + "' is clean, using");
            }
            return glShader;
        }

        /** Store the information about this named uniform. 
         * @param {String} name The uniform variable name as defined in
         * the shader source.
         * @param {Function} [action=function(){}] The function to call 
         * each frame to prep/send this uniform to the shader.
         */
        this.addUniform = function(name, action, type) {
            $W.debug("\tadding uniform '" + name + "'");
            if (!action) {
                action = function(){}
            }
            this.uniforms.push(new $W.GLSL.Uniform(name, action, type));
        }

        /** Store the information about this named attribute. 
         * @param {String} name The attribute variable name as defined in
         * the shader source.
         * @param {Integer} [length=3] The length of the attribute.
         */
        this.addAttribute = function(name, length) {
            $W.debug("\tadding attribute '" + name + "'");
            if (!length) { length = 3; }
            this.attributes.push(new $W.GLSL.Attribute(name, length));
        }

        // Find and initialize all uniforms and attributes found in the source
        this.parseShaderVariables = function(str) {
            var tokens = str.split(/[\[\]\s\n;]+?/);

            for (var i = 0; i < tokens.length; i++) {
                if (tokens[i] === "attribute") {
                    var type = tokens[i+1];
                    var name = tokens[i+2];
                    var length = $W.GLSL.shaderVarLengths[type];
                    this.addAttribute(name, length);
                }                               
                if (tokens[i] === "uniform") {
                    var type = tokens[i+1];
                    var name = tokens[i+2];

                    this.addUniform(name, $W.util.getUniformAction(name), type);
                }
            }
        };

        /** Compile the shader if able.
         * Lets any shader programs which use this shader know they need to
         * relink
         */
        this.compile = function() {
            if (this.type === $W.GL.VERTEX_SHADER) {
                $W.debug("compiling '" + this.name + "' as vertex shader");
            }else if (this.type === $W.GL.FRAGMENT_SHADER) {
                $W.debug("compiling '" + this.name + "' as vertex shader");
            }else {
                console.error("compiling '" + this.name + "' as unknown type " + this.type);
            }   
            if (glShader !== null) {
                $W.GL.deleteShader(glShader);
                glShader = null;
            }

            var shader = $W.GL.createShader(this.type);
            
            $W.GL.shaderSource(shader, source);
            $W.GL.compileShader(shader);

            if (!$W.GL.getShaderParameter(shader, $W.GL.COMPILE_STATUS)) {
                console.error("Compile error in `" + this.name + "`\n" +
                        $W.GL.getShaderInfoLog(shader));
                glShader = null;
            } else {
                clean();
                glShader = shader;
            }

            return (glShader !== null);
        };

        //source = $W.GLSL.util.handlePragmas(source);
        this.parseShaderVariables(source);
        this.compile();
        $W.dedentLog();
    };

    /** @class Handles data and linking for a shader program.
     * Also ensures all shaders which it uses are compiled and up
     * to date.
     * @param {String} name All shader programs need a unique name.
     */
    $W.GLSL.ShaderProgram = function(name) {
        $W.log("creating shader program '" + name + "'");
        $W.indentLog();

        /** Global name of the shader program. */
        this.name = name;
        $W.programs[name] = this;

        /** WebGL shader program object. */
        this.glProgram  = null;

        /** Tracks link state and compile state of all attached shaders. */
        var isDirty = true;

        var dirty = function() {
            this.glProgram = null;
            isDirty = true;
        }
        this.dirty = dirty;

        var clean = function() {
            isDirty = false;
        }

        this.isDirty = function() {
            return isDirty;
        }
        
        /** Attached shaders */
        this.shaders   = [];

        /** Attributes from all attached shaders. */
        this.attributes = [];

        /** Uniforms from all attached shaders. */
        this.uniforms   = [];

        this._setupAttributes = function() {
            this.attributes = [];

            // Each shader keeps track of its attributes,
            for (var i = 0; i < this.shaders.length; i++) {
                var shader = $W.shaders[this.shaders[i]];

                for (var j = 0; j < shader.attributes.length; j++) {
                    var attribute = shader.attributes[j].clone();

                    // but attribute locations are unique to each program
                    attribute.location = $W.GL.getAttribLocation(this.glProgram, attribute.name);

                    // buffers are unique to each object
                    //attribute.buffer   = $W.GL.createBuffer();

                    this.attributes.push(attribute);
                }
            }
        }

        this._setupUniforms = function() {


            // Each shader keeps track of its uniforms
            for (var i = 0; i < this.shaders.length; i++) {
                var shader = $W.shaders[this.shaders[i]];

                for (var j = 0; j < shader.uniforms.length; j++) {
                    var uniform = shader.uniforms[j].clone();

                    // locations are unique to each shader program (I think)
                    uniform.location = $W.GL.getUniformLocation(this.glProgram, uniform.name);
                    $W.debug(uniform.name + " " + uniform.location);
                    this.uniforms.push(uniform);
                }
            }
        }

        /** Set the action to take per fram for a particular uniform.
         * Here instead of the shader because different programs can both
         * use the same shader, but treat it differently.
         * XXX What if two shaders have the same named variable
         * XXX Move to Object? If different objects could need to 
         * different actions then we ought to store the uniform actions
         * on a per-object basis.
         * @param {String} name The name of the uniform.
         * @param {Function} action The function to call per frame.
         */
        this.setUniformAction = function(name, action) {
            this.use();

            var uniform = this.uniforms.findByAttributeValue('name', name);

            if (uniform === undefined) {
                console.error("Cannot set uniform `" + name + "` in shader program `" + this.name + "`, no uniform with that name exists");
                return;
            }else {
                $W.info("Setting action for uniform `" + name + "` in shader program `" + this.name + "`");
            }

            uniform.action = action;
        }

        /** Set the named uniform variable to a single value.
         * Overloaded to allow 1-4 values to be passed. This allows 
         * this function to set the value of int, float, vec2, vec3, and
         * vec4 uniform variables in a shader.
         * @param {String} name The name of the uniform to set.
         * @param optional1 A value
         * @param optional2 A value
         * @param optional3 A value
         * @param optional4 A value
         */
        this.setUniform = function(name) {
            // Program must be active before we can do anything with it
            this.use();

            var uniform;
            for (var i = 0; i < this.uniforms.length; i++) {
                if (this.uniforms[i].name === name) {
                    uniform = this.uniforms[i];
                }
            }

            if (uniform === undefined) {
                console.error("Cannot set uniform `" + name + "` in shader program `" + this.name + "`, no uniform with that name exists");
                return;
            }else {
                $W.log("Setting uniform `" + name + "` in shader program `" + this.name + "`", $W.LL.DEBUG);
            }

            //XXX deal with other types too
            if (arguments.length === 2) {
                var val = arguments[1];
                if (uniform.type === "int") {
                    uniform.action = function() {
                        $W.GL.uniform1i(this.location, val);
                    }
                }else {
                    uniform.action = function() {
                        $W.GL.uniform1f(this.location, val);
                    }
                }

            } else if (arguments.length === 3) {
                uniform.action = function() {
                    $W.GL.uniform2f(this.location, 
                        arguments[1], arguments[2]);
                }

            } else if (arguments.length === 4) {
                uniform.action = function() {
                    $W.GL.uniform3f(this.location, 
                        arguments[1], arguments[2], 
                        arguments[3]);
                }

            } else if (arguments.length === 5) {
                uniform.action = function() {
                    $W.GL.uniform4f(this.location, 
                        arguments[1], arguments[2], 
                        arguments[3], arguments[4]);
                }

            }
        }

        /** Called once per frame to calculate and set uniforms. */
        this.processUniforms = function(obj) {
            for (var i = 0; i < this.uniforms.length; i++) {
                this.uniforms[i].action(this.uniforms[i], obj);
            }
        }

        /** Link this shader program to make it useable.
         * Will [re]compile all attached shaders if necessary.
         */
        this.link = function() {
            $W.log("linking program `" + this.name + "`");


            // Only delete the program if one already exists
            if (this.glProgram !== null) {
                $W.log("already exists, deleting and relinking");
                $W.GL.deleteProgram(this.glProgram);
                this.attributes = [];
                this.uniforms = [];
                this.glProgram = null;
            }

            this.glProgram = $W.GL.createProgram();

            // Attach all the shaders
            for (var i = 0; i < this.shaders.length; i++) {
                var shader = $W.shaders[this.shaders[i]];
                var glShader = shader.getGLShader();

                // if the shader is still dirty after calling get,
                // which should have cleaned it, then the compile failed.
                if (shader.isDirty()) {
                    $W.warn(this.shaders[i] + " failed to compile");
                }else {
                    $W.GL.attachShader(this.glProgram, glShader);
                }	
            }

            $W.GL.linkProgram(this.glProgram);

            // Check for errors
            if (!$W.GL.getProgramParameter(this.glProgram, $W.GL.LINK_STATUS)) {
                console.error("Link error in `" + this.name + "`\n" +
                        $W.GL.getProgramInfoLog(this.glProgram));
                dirty();
            }
                
            clean();
            this._setupAttributes();
            this._setupUniforms();

            console.groupEnd();
            return isDirty;
        }

        /** XXX @Deprecated */
        this.detachShaderByName = function(name) {
            console.warn("detachShaderByName is deprecated, use detachShader instead");
            this.detachShader(name);
        }

        /** Remove the named shader from this program.
         * Can be used to alter a shader program on the fly.
         * @param {String} name
         */
        this.detachShader = function(name) {
            var tempShaders = [];

            for (var i = 0; i < this.shaders.length; i++) {
                if (this.shaders[i] != name) {
                    tempShaders.push(this.shaders[i]);
                }
            }

            isDirty = true;
            this.shaders = tempShaders;
        }

        /** Attach a shader to this shader program.
         * Overloaded to work with as <br>
         * attachShader(GLSL.Shader shader)<br>
         * attachShader(String name, String source, type)<br>
         * attachShader(String name, String filePath)<br>
         * attachShader(String name, String source, type)<br>
         */
        this.attachShader = function(shader, path, type) {
            // Shader from node ID, filename, or source.
            // Otherwise we've been passed a shader object.
            if (typeof shader === 'string') { 
                // Shader from ID
                if (arguments.length === 1) {
                    shader = new $W.GLSL.Shader(shader);

                // Shader from file
                }else if (arguments.length === 2){

                    // Try to infer type
                    var ext = path.slice(path.length - 4);
                    if (ext === 'vert' || ext.slice(2) === 'vp') {
                        type = $W.GL.VERTEX_SHADER;
                    }
                    if (ext === 'frag' || ext.slice(2) === 'fp') {
                        type = $W.GL.FRAGMENT_SHADER;
                    }

                    try {
                        shader = new $W.GLSL.Shader(shader, $W.util.loadFileAsText(path), type); 
                    }catch (e) {
                        console.error(e);
                        return;
                    }

                // Shader from source
                }else {
                    shader = new $W.GLSL.Shader(shader, path, type);
                }
            }

            this._attachShader(shader);
        }

        this._attachShader = function(shader) {
            $W.log("\tattaching '" + shader.name + "' to '" + this.name + "'", $W.LL.INFO);
            try{
                shader.addProgram(this.name);
            }catch(e) {
                console.error(e);
            }
            isDirty = true;
            this.shaders.push(shader.name);
        }

        /** XXX @Deprecated */
        this.attachShaderByID = function(name) {
            console.warn("attachShaderByID is deprecated, use attachShader instead");
            this.attachShader(new $W.GLSL.Shader(name));
        }

        /** Set this shader program to be the active program for
         * rendering.
         */
        this.use = function() {
            // Try to link if needed
            if (isDirty) {
                if (!this.link()) { return false; }
            }
            $W.GL.useProgram(this.glProgram);
            return true;
        }

        $W.dedentLog();
    };
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
$W.initGLU = function() {
    /** @namespace Functions with similar functionaliy to the original GLU
     * libraries.
     */
    $W.GLU = {
        /** Given a point in screen-space, transform to an object-space point */
        unproject:function(winX, winY, winZ, model, proj, view) {
            if (model === undefined){model = $W.modelview.matrix;}
            if (proj === undefined) {proj = $W.projection.matrix;}
            if (view === undefined) {view = [0,0, $W.canvas.width, $W.canvas.height];}

            var pickMatrix = (model.multiply(proj)).inverse();
        },
        
        //----------------------------
        // these are like the OpenGL functions of the same name
        
        /** glLookAt
         * (c) 2009 Vladimir Vukicevic
         */
        lookAt : function (ex, ey, ez,
                           tx, ty, tz,
                           ux, uy, uz) {
            var eye = $V([ex, ey, ez]);
            var target = $V([tx, ty, tz]);
            var up = $V([ux, uy, uz]);

            var z = eye.subtract(target).toUnitVector();
            var x = up.cross(z).toUnitVector();
            var y = z.cross(x).toUnitVector();

            var m = $M([[x.e(1), x.e(2), x.e(3), 0],
                    [y.e(1), y.e(2), y.e(3), 0],
                    [z.e(1), z.e(2), z.e(3), 0],
                    [0, 0, 0, 1]]);

            var t = $M([[1, 0, 0, -ex],
                    [0, 1, 0, -ey],
                    [0, 0, 1, -ez],
                    [0, 0, 0, 1]]);
            return m.x(t);
        },

        /** glOrtho
         * (c) 2009 Vladimir Vukicevic
         */
        ortho : 
            function (left, right,
                    bottom, top,
                    znear, zfar)
            {
                var tx = -(right+left)/(right-left);
                var ty = -(top+bottom)/(top-bottom);
                var tz = -(zfar+znear)/(zfar-znear);

                return $M([[2/(right-left), 0, 0, tx],
                        [0, 2/(top-bottom), 0, ty],
                        [0, 0, -2/(zfar-znear), tz],
                        [0, 0, 0, 1]]);
            },

        /** glFrustrum
         * (c) 2009 Vladimir Vukicevic
         */
        frustrum : 
            function (left, right,
                    bottom, top,
                    znear, zfar)
            {
                var X = 2*znear/(right-left);
                var Y = 2*znear/(top-bottom);
                var A = (right+left)/(right-left);
                var B = (top+bottom)/(top-bottom);
                var C = -(zfar+znear)/(zfar-znear);
                var D = -2*zfar*znear/(zfar-znear);

                return $M([[X, 0, A, 0],
                        [0, Y, B, 0],
                        [0, 0, C, D],
                        [0, 0, -1, 0]]);
            },

        /** glPerpective
         * (c) 2009 Vladimir Vukicevic
         */
        perspective : 
            function (fovy, aspect, znear, zfar)
            {
                var ymax = znear * Math.tan(fovy * Math.PI / 360.0);
                var ymin = -ymax;
                var xmin = ymin * aspect;
                var xmax = ymax * aspect;
     
                return $W.GLU.frustrum(xmin, xmax, ymin, ymax, znear, zfar);
            }
    };





    /* @class Operates similarly to the standard OpenGL built in matricies. 
    * However * it is not identical. Rather than calling glMatrixMode, 
    * you specify the matrix you want to modify prior to the call.
    * e.g. if `myTranslationVector` is the vector to translate by then to 
    * translate the ModelView matrix you would call
    * `$W.modelview.translate(myTranslationVector);`
    */
    $W.GLU.MatrixStack = function()  {
        this._matrixStack = [];
        this.matrix = Matrix.I(4);

        /** converts the matrix to the format we need when we send it to 
         * a shader.
         * @returns {WebGLFloatArray} The matrix as a flattened array.
         */
        this.getForUniform = function() {
           return new WebGLFloatArray(this.matrix.flatten());
        };


        /** glPushMatrix
         * (c) 2009 Vladimir Vukicevic
         * @param {Matrix} [m=this.matrix] A Sylvester matrix to add on 
         * top of the stack.
         */
        this.pushMatrix = function (m) {
            if (m) {
                this._matrixStack.push(m.dup());
                this.matrix = m.dup();
            } else {
                this._matrixStack.push(this.matrix.dup());
            }
        };
        this.push = this.pushMatrix;

        /** glPopMatrix
         * (c) 2009 Vladimir Vukicevic
         */
        this.popMatrix = function () {
            if (this._matrixStack.length === 0) {
                throw "Invalid popMatrix!";
            }
            this.matrix = this._matrixStack.pop();
            return this.matrix;
        };
        this.pop = this.popMatrix;

        /** glMultMatrix
         * (c) 2009 Vladimir Vukicevic
         * @param {Vector} m A Sylvester matrix to multiply by.
         */
        this.multMatrix = function (m) {
            this.matrix = this.matrix.x(m);
        };
        this.multiply = this.multMatrix;

        /** glTranslate
         * (c) 2009 Vladimir Vukicevic
         * @param {Vector} v A Sylvester vector to translate by
         */
        this.translate = function (v) {
            var m = Matrix.Translation($V([v[0],v[1],v[2]])).ensure4x4();
            this.multMatrix(m);
        };

        /** glRotate
         * (c) 2009 Vladimir Vukicevic
         * @param {Number} ang Angle to rotate by.
         * @param {Vector} v A Sylvester vector to rotate around.
         */
        this.rotate = function (ang, v) {
            var arad = ang * Math.PI / 180.0;
            var m = Matrix.Rotation(arad, $V([v[0], v[1], v[2]])).ensure4x4();
            this.multMatrix(m);
        };

        /** glScale
         * (c) 2009 Vladimir Vukicevic
         * @param {Vector} v A Sylvester vector to scale by.
         */
        this.scale = function (v) {
            var m = Matrix.Diagonal([v[0], v[1], v[2], 1]);
            this.multMatrix(m);
        };

        /** invert
         * (c) 2009 Vladimir Vukicevic
         */
        this.invert = function () {
            this.matrix = this.matrix.inv();
        };

        /** glLoadIdentity
         * (c) 2009 Vladimir Vukicevic
         */
        this.loadIdentity = function () {
            this.matrix = Matrix.I(4);
        };
    };
};
$W.initAnimation = function() {
    /** @class A procedurally generated animation. 
     * Starts updating immediately.
     */
    $W.ProceduralAnimation = function ProceduralAnimation() {
        $W.ObjectState.call(this); // subclass of ObjectState

        /** XXX The right way to do this? */
        var ptyp = $W.ProceduralAnimation.prototype;

        /** The time in milliseconds since this animation began */
        this.age = 0;

        /** Call to advance the animation by `dt` milliseconds */
        this.update = function(dt){};
        this._update = function(dt){};

        /** Internal.
         * @return {Function} Update this animation.
         */
        this._play = function(dt) {
            this.preUpdate(dt);

            this.age += dt;

            this._update(dt);

            this.updatePosition(dt);
            this.updateRotation(dt);
            this.updateScale(dt);

            this.postUpdate(dt);
        }

        /** Internal.
         * @return {Function} Do nothing.
         */
        this._pause = function() { }

        /** This animation will advance on subsequent update() 
         * calls.
         */
        this.play = function() {
            this.update = this._play;
        }

        /** This animation will not change on subsequent update() 
         * calls.
         */
        this.pause = function() {
            this.update = this._pause;
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
    };


    /** @class A single frame of animation.
     * A position, rotation, and scale at a particular point in time.
     *
     * @param {3 Array} pos Position.
     * @param {3 Array} rot Rotation.
     * @param {3 Array} scl Scale.
     * @param {Number} atTime Time, in seconds, this keyframe occurs at.
     */
    $W.Keyframe = function Keyframe(pos, rot, scl, atTime) {
        if (arguments.length == 4) {
            $W.ObjectState.call(this, pos, rot, scl); // Subclass ObjectState
            this.atTime = atTime * 1000; // time, in seconds, this keyframe occurs at
        }else {
            $W.ObjectState.call(this); 
            this.atTime = 0;
        }
    };

    /** @class A keyframe based animation 
     * Rotations interpolation uses quaternions.
     */
    $W.KeyFrameAnimation = function() {
        $W.ProceduralAnimation.call(this); // Subclass ProceduralAnimation

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
    };
};
$W.initObject = function() {
    
    /** @class Common state representation (position, rotation, scale).
     * A position, rotation, and scale.
     * @param {3 Array} pos Position.
     * @param {3 Array} rot Rotation.
     * @param {3 Array} scl Scale.
     */
    $W.ObjectState = function(position, rotation, scale) {
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
        };
    };

    /** @class Storage and handling of GL data arrays
     * @param {String} name Attribute name data is for
     */
    $W.ArrayBuffer = function(name, data) {
        this.name = name;
        this.data = data;
        this.glData = new WebGLFloatArray(data);
        this.glBuffer = $W.GL.createBuffer();

        this.setData = function ABUF_setData(data) {
            this.data = data;
            this.glData = new WebGLFloatArray(data);
        };

        this.buffer = function ABUF_buffer() {
            try {
                this.bind();
                $W.GL.bufferData($W.GL.ARRAY_BUFFER, this.glData, $W.GL.STATIC_DRAW);
                this.unbind();
            }catch (e) {
                console.error(e);
            }
        };

        this.associate = function ABUF_associate(attrib) {
            try {
                this.bind();
                $W.GL.enableVertexAttribArray(attrib.location);
                $W.GL.vertexAttribPointer(attrib.location, attrib.length,
                        $W.GL.FLOAT, false, 0, 0);
                this.unbind();
            }catch (e) {
                console.error("Failed to associate array buffer `" + this.name + 
                        "` with vertex attribute `" + attrib.name + "`");
                console.dir(this, attrib);
                console.error(e);
            }
        };

        this.bind = function ABUF_bind() {
            $W.GL.bindBuffer($W.GL.ARRAY_BUFFER, this.glBuffer);
        };
        this.unbind = function ABUF_unbind() {
            $W.GL.bindBuffer($W.GL.ARRAY_BUFFER, null);
        };
    };


    $W.RENDERABLE   = 1;
    $W.PICKABLE     = 2;
    /** @class Contains pertinent render information for an individual renderable entity.
     *
     * Make sure to set vertexCount correctly
     * Animations are clunky right now, I'm working on it.
     *
     * @param type The type of rendering to use for this object, possible values
     * are:<br>
     * $W.GL.POINTS         <br>
     * $W.GL.LINES          <br>
     * $W.GL.LINE_LOOP      <br>
     * $W.GL.LINE_STRIP     <br>
     * $W.GL.TRIANGLES      <br>
     * $W.GL.TRIANGLE_STRIP <br>
     * $W.GL.TRIANGLE_FAN   <br>
     * @param {Boolean} shouldAdd Set to false to not add this the the object
     * list in case you want to handle rendering in a specific manner, e.g. as
     * the child of another object.
     */
    $W.createObject = function(params) {
        var obj = new $W.Object(params.type);
        var has = function(param){
            return typeof(param) !== 'undefined';
        };

        if (has(params.material)){
            obj.setMaterial(params.material);
        }

        if (has(params.model)){
            obj.fromModel(params.model);
        }else if (has(params.data)){
            obj.fillArrays(params.data);
        }

        if (has(params.vertexCount)){
            obj.vertexCount = params.vertexCount;
        }

        return obj;
    };


    $W.Object = function (type, flags) {
        //console.group("Creating object");
        $W.ObjectState.call(this);

        $W.objects.push(this);

        if (typeof(flags) === 'undefined' ||/*backcompat*/ flags === true) {
            flags = $W.RENDERABLE | $W.PICKABLE;
        }/*backcompat*/else if(flags === false) {
            flags = $W.PICKABLE;
        }


        if (flags & $W.RENDERABLE){
            $W.renderables.push(this);
        }

        if (flags & $W.PICKABLE) {
            $W.pickables.push(this);
        }


        /** Number of vertices in this object.
         * Used when rendering with drawArrays.
         */
        this.vertexCount = 0;

        this.id = $W.createdObjectCount++;

        /* The type of rendering to use for this object */
        this.type = type; 

        this.material = $W.materials['wglu_default'];

        this.arrayBuffers = [];

        this.children = [];

        /** The animation for this object. */
        this.animation = new $W.ProceduralAnimation();

        // drawArrays by default
        this._drawFunction = $W.renderer.drawArrays;

        /** Name of shader program used to render this object */
        /** Add an object as a child to this object.
         * @param {Object} obj The object to add as a child.
         */
        this.addChild = function(obj) {
            this.children.push(obj);
        };

        /** Set the indices for the elements of this object.
         * Draws this object with drawElements unless set with
         * false.
         * @param {Array|Boolean} elements The array of indices of the
         * elements or false, which disabled drawElements rendering
         * for this object.
         */
        this.setElements = function(elements) {
            // don't use drawElements
            if (elements === false) {
                this.arrayBuffers.wglu_internal_elements = undefined;
                $W.GL.bindBuffer($W.GL.ELEMENT_ARRAY_BUFFER, null);

            // use drawElements
            }else {
                this._drawFunction = $W.renderer.drawElements;

                var elementAB = new $W.ArrayBuffer('wglu_internal_elements',
                        $W.util.flattenArray(elements));

                $W.GL.bindBuffer($W.GL.ELEMENT_ARRAY_BUFFER, elementAB.glBuffer);
                $W.GL.bufferData($W.GL.ELEMENT_ARRAY_BUFFER,
                        new WebGLUnsignedShortArray( elementAB.data), 
                        $W.GL.STATIC_DRAW);

                this.arrayBuffers.wglu_internal_elements = elementAB;
            }
        };

        /** Set the material of this object to the indicated material
         *
         * @param material {String|Material} Either the name of an existing material
         * or a Material object.
         */
        this.setMaterial = function OBJ_setMaterial(material) {
            if (typeof(material) === 'string') { 
                this.material = $W.materials[material];
            }else {
                this.material = material;
            }
        };

        /** Fills the array of the given name, where name is a 
         * vertex attribute in the shader. 
         * Also creates a buffer to hold the data in WebGL.
         * @param {String} name The attribute variable name in a shader
         * attached to the shader program used by this object. (this is
         * not verified for you)
         * @param {Array} contents The data to pass to the attribute.
         */
        this.fillArray = function OBJ_fillArray(name, data) {
            data = data.flatten();
            if (typeof(this.arrayBuffers[name]) === 'undefined') {
                this.arrayBuffers[name] = new $W.ArrayBuffer(name, data);
            }else {
                this.arrayBuffers[name].setData(data);
            }

            this.arrayBuffers[name].buffer();
        };

        this.fillArrays = function OBJ_fillArrays(arrays) {
            for (var i = 0; i < arrays.length; i++) {
                var arr = arrays[i];
                if (arr[0] === 'wglu_elements') {
                    this.setElements(arr[1]);
                }else {
                    this.fillArray(arr[0], arr[1]);
                }
            }
        };

        this.fromModel = function OBJ_fromModel(model) {
            this.fillArrays([['vertex', model.vertices],
                             ['normal', model.normals],
                             ['texCoord', model.texCoords],
                             ['wglu_elements', model.indices]]);

        };

        /** draw this object at the given postion, rotation, and scale
         * @param {3 Element Array} pos Position array.
         * @param {Matrix} rot Rotation matrix.
         * @param {3 Element Array} scale Scaling array.
         */
        this.drawAt = function OBJ_drawAt(pos, rot, scale) {
                $W.modelview.push();

                $W.modelview.translate(pos);
                $W.modelview.multiply(rot);
                $W.modelview.scale(scale);

                for (var i = 0; i < this.children.length; i++) {
                    this.children[i].draw();
                }

                $W.renderer.renderObject(this, this.material, this._drawFunction);

                $W.modelview.pop();
                $W.GL.bindTexture($W.GL.TEXTURE_2D, null);
        };

        this.drawChildrenAt = function(pos, rot, scale) {
                $W.modelview.pushMatrix();

                $W.modelview.translate(pos);
                $W.modelview.multMatrix(rot);
                $W.modelview.scale(scale);

                for (var i = 0; i < this.children.length; i++) {
                    this.children[i].draw();
                }

                $W.modelview.popMatrix();
        };

        /** draw this object at its internally stored position, rotation, and
         * scale, INCLUDING its current animation state.
         */
        this.draw = function OBJ_draw() {
            this.drawAt(
                this.animatedPosition().elements, 
                this.animatedRotation().matrix(),
                this.animatedScale().elements
            );
        };

        this.drawChildren = function() {
            this.drawChildrenAt(
                this.animatedPosition().elements, 
                this.animatedRotation().matrix(),
                this.animatedScale().elements
            );
        };

        /** Update this object's animation state. 
         * @param {Number} dt The delta time since the previous call to
         * update.
         */
        this.update = function(dt) {
            this.animation.update(dt);

            for (var i = 0; i < this.children.length; i++) {
                this.children[i].update(dt);
            }
        };

        
        /** @returns {Vector} The sum of the object's base position and its 
         * animation.
         */
        this.animatedPosition = function() { 
            return this.position.add(this.animation.position); 
        };

        /** @returns {Vector} The sum of the object's base rotation and its 
         * animation. 
         */
        this.animatedRotation = function() { 
            //return this.rotation.add(this.animation.rotation); 
            return this.q.multiply(this.animation.q);
        };

        /** @returns {Vector} The product of the object's base scale and its 
         * animation. 
         */
        this.animatedScale    = function() { 
            return $V([
                this.scale.e(1) * this.animation.scale.e(1),
                this.scale.e(2) * this.animation.scale.e(2),
                this.scale.e(3) * this.animation.scale.e(3)
            ]);
        };

        //console.groupEnd();
    };
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
$W.initTexture = function() {
    $W.Texture = function(name) {
        this.glTexture = $W.GL.createTexture();
        this.name = name;
        $W.textures[name] = this;

        this.bind = function() {
            $W.GL.bindTexture($W.GL.TEXTURE_2D, this.glTexture);
        };
            
        this.unbind = function() {
            $W.GL.bindTexture($W.GL.TEXTURE_2D, null);
        };

        this.update = function(){};

        this.bind();
        $W.GL.texParameteri($W.GL.TEXTURE_2D, $W.GL.TEXTURE_MIN_FILTER, $W.GL.LINEAR);
        $W.GL.texParameteri($W.GL.TEXTURE_2D, $W.GL.TEXTURE_WRAP_S, $W.GL.CLAMP_TO_EDGE);
        $W.GL.texParameteri($W.GL.TEXTURE_2D, $W.GL.TEXTURE_WRAP_T, $W.GL.CLAMP_TO_EDGE);

    };

    $W.CanvasTexture = function(name, src) {
        $W.Texture.call(this, name);

        this.canvas = src;
        this.canvas.texture = this;

        this.update = function() {
            var gl = $W.GL;
            this.bind();
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, 
                gl.UNSIGNED_BYTE, this.canvas);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            this.unbind();
        };

    };

    /** A dynamic texture from a `video` element.    
     * @param {String} name The global name this texture will be referenced
     * by elsewhere.
     * @param {String|Video} src Video path or DOM video element.
     */
    $W.VideoTexture = function(name, src) {
        $W.Texture.call(this, name);

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
            this.video.loop = true;
            this.video.play();
            this.video.addEventListener("timeupdate", this.update, true);
        };

        this.update = function() {
            var gl = $W.GL;
            this.bind();
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, 
                gl.UNSIGNED_BYTE, this.video);
            //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            //gl.generateMipmap(gl.TEXTURE_2D);
            //gl.bindTexture(gl.TEXTURE_2D, null); // clean up after ourselves
        }

        this.setSource(src);
    };

    /** A static texture from an image file.
     * @param {String} name The global name this texture will be referenced
     * by elsewhere.
     * @param {String} src Path to image file.
     */
    $W.ImageTexture = function(name, src) {
        $W.Texture.call(this, name);
        this.image = document.createElement('img');
        this.image.texture = this;

        this.image.onload = function() {
            var gl = $W.GL;
            $W.debug('Loaded texture `' + name + "`");
            this.texture.bind();

            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, 
                gl.UNSIGNED_BYTE, this.texture.image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

            this.texture.unbind();
        }

        this.setSource = function(src) {
            this.image.src = src;
        };

        if (src !== undefined) {
            this.setSource(src);
        }
    };
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
$W.initFramebuffer = function() {

    $W.framebuffers = {};

    $W.Framebuffer = function(name) {
        $W.info("Creating framebuffer");
        var GL = $W.GL;
        var RBUF = GL.RENDERBUFFER;
        var FBUF = GL.FRAMEBUFFER;

        this.name = name;
        $W.framebuffers[name] = this;
        this.glFramebuffer = GL.createFramebuffer();
        this.glRenderbuffers = [];
        this.textures = [];

        this.isGood = function FBUF_isGood() {
            try {
                if (!GL.isFramebuffer(this.glFramebuffer)) {
                    throw("Invalid framebuffer");
                }
                var status = GL.checkFramebufferStatus(this.glFramebuffer);
                switch (status) {
                    case GL.FRAMEBUFFER_COMPLETE:
                        break;
                    default:
                        throw("Incomplete framebuffer: " + status);
                }
            }catch (e) {
                console.error(e);
                return false;
            }
            return true;
        };

        this.bind = function FBUF_bind(){
            GL.bindFramebuffer(FBUF, this.glFramebuffer);
        };

        this.unbind = function FBUF_unbind(){
            GL.bindFramebuffer(FBUF, null);
        };

        this.attachRenderbuffer = function FBUF_attachRenderbuffer(storageFormat, width, height, attachment) {
            var rBuffer = GL.createRenderbuffer();
            this.glRenderbuffers.push(rBuffer);

            this.bind();
            GL.bindRenderbuffer(RBUF, rBuffer);
            GL.renderbufferStorage(RBUF, storageFormat, width, height);
            GL.framebufferRenderbuffer(FBUF, attachment, RBUF, rBuffer);
            GL.bindRenderbuffer(RBUF, null);
            this.unbind();
        };

        this.attachExistingTexture = function FBUF_attachExistingTexture(texture, attachment) {
            this.textures.push(texture);
            texture.bind();
            GL.framebufferTexture2D(GL.FRAMEBUFFER, attachment, GL.TEXTURE_2D, texture.glTexture, 0);
            texture.unbind();
        }

        this.attachNewTexture = function FBUF_attachNewTexture(format, width, height, attachment) {
            var texture = new $W.Texture(this.name + 'Texture' + this.textures.length);

            texture.bind();
            try{
                GL.texImage2D(GL.TEXTURE_2D, 0, format, width, height,
                        0, format, $W.GL.UNSIGNED_BYTE, null);
            } catch (e) {
                console.warn('Using empty texture fallback');
                var storage = new WebGLUnsignedByteArray(4 * width * height);
                GL.texImage2D(GL.TEXTURE_2D, 0, format, width, height,
                        0, format, $W.GL.UNSIGNED_BYTE, storage);
            }
            texture.unbind();

            this.attachExistingTexture(texture, attachment);
        }

        this.attachTexture = function FBUF_attachTexture() {
            this.bind();
            if (arguments.length === 4) {   
                this.attachNewTexture.apply(this, arguments);
            }else {
                this.attachExistingTexture.apply(this, arguments);
            }
            this.unbind();
        }
    };
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
$W.initMaterial = function() {

    /* Creates a new material from the provided definition.
     * Definition is JS object (possibly loaded from JSON) in
     * the following format
     * {
     *  name: "matName", // The name this material will be refered to by.
     *                   // Must be unique within this application
     *
     *  program: {
     *      name: "prgName", // If there already exists a shader program
     *                       // with this name, it will be used. Otherwise
     *                       // one will be created as defined here.
     *      shaders: [ // List of shaders in this program.
     *                 // As with the program itself, if a shader with the
     *                 // given name already exists it will take precedence
     *                 // over creating a new shader.
     *          {name: "VS", path: "VS.vert"},
     *          {name: "FS", path: "FS.frag"},
     *          // etc.
     *      ]
     *  },
     *
     *  textures: [
     *      // type can be `Image`, `Video`, or `Canvas`
     *      {name:"tex", type:"Image", path:"tex.jpg"},
     *      // etc.
     *  ]
     * }
     * or
     * {
     *  path: "mat.json"
     * }
     * where mat.json is a file containing JSON in the first format
     */
    $W.Material = function(materialDef) {

        this.name = null;
        this.program = null;
        this.uniforms   = [];
        this.attributes = [];
        this.textures   = [];
        this.framebuffer= null;

        this.setUniformAction = function MAT_setUniformAction(name, action) {
            var uniform = $W.util.searchArrayByName(this.uniforms, name);
            if (uniform !== null) { 
                uniform.action = action;
            }else {
                console.warn("Cannot set uniform action for nonexistant uniform `"+
                        name + "`");
            }
        };

        this.setupUniforms = function MAT_setupUniforms() {
            this.uniforms = [];
            this.attributes = [];

            for (var i = 0; i < this.program.uniforms.length; i++) {
                this.uniforms.push(this.program.uniforms[i].clone());
            }

            for (var i = 0; i < this.program.attributes.length; i++) {
                var attrib = this.program.attributes[i];

                if (attrib.location !== -1) {
                    this.attributes.push(attrib.clone());
                    $W.GL.enableVertexAttribArray(attrib.location);

                }
            }

        };

        this.setupTextureUniforms = function MAT_setupTextureUniforms() {
            for (var i = 0; i < this.textures.length; i++) {
                var action = genMultiTextureAction(i);
                this.setUniformAction('wglu_mat_texture'+i, action);
            }
        };

        this.initFromDef = function MAT_initFromDef(matDef) {
            // If we've been provided a path, use that file.
            // Allow for name override.
            if (typeof(matDef.path) !== 'undefined') {
                if (typeof(matDef.name) !== 'undefined') {
                    this.name = matDef.name;
                    matDef = $W.util.loadFileAsJSON(matDef.path);
                }else {
                    matDef = $W.util.loadFileAsJSON(matDef.path);
                    this.name = matDef.name;
                }
            }else {
                this.name = matDef.name;
            }

            $W.log(matDef.name);

            $W.log('creating material `' + this.name + '`');
            $W.indentLog();

            var initProgram = function MAT_initProgram(prgDef) {
                // If a program of the name specified in the material doesn't already
                // exist, create it with the specified parameters.
                var program = $W.programs[prgDef.name];
                if (typeof(program) === 'undefined') {

                    program = new $W.GLSL.ShaderProgram(prgDef.name);

                    for (var i = 0; i < prgDef.shaders.length; i++) {
                        var shaderDef = prgDef.shaders[i];

                        // Load shader from file
                        if (typeof(shaderDef.path) !== 'undefined') {
                            program.attachShader(shaderDef.name, shaderDef.path);

                        // Load shader from source code
                        }else if (typeof(shaderDef.source) !== 'undefined') {
                            program.attachShader(shaderDef.name, shaderDef.source, 
                                    shaderDef.type);
                        }
                    }
                    program.use();
                }

                return program
            };

            var initTextures = function MAT_initTextures(texDef) {
                var textures = []

                // If textures specified in the material do not exist, create them.
                if (typeof(texDef) !== 'undefined') {
                    for (var i = 0; i < texDef.length; i++) {
                        var texture = texDef[i];

                        if (typeof($W.textures[texture.name]) === 'undefined') {

                            // type is Image, Canvas, or Video. this calls
                            // ImageTexture, CanvasTexture or VideoTexture.
                            if (texture.type === "Image") {
                                new $W.ImageTexture(texture.name, texture.path);

                            }else if (texture.type == "Canvas") {
                                new $W.CanvasTexture(texDef.name, 
                                        document.getElementById(texture.element_id));

                            }else if (texture.type === "Video") {
                                
                                new $W.VideoTexture(texture.name, texture.path);
                            }

                            textures.push(texture.name);
                        }
                    }
                }
                return textures
            };

            this.program = initProgram(matDef.program);
            this.setupUniforms();

            this.textures = initTextures(matDef.textures);
            this.setupTextureUniforms();

            $W.log(this);

            $W.dedentLog();
        };

        this.initFromDef(materialDef)

        $W.materials[this.name] = this;
    };
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
$W.initRenderer = function() {
    $W.renderer = {};
    $W.renderer.bindObjectAttributes = function RNDR_bindObjectAttributes(obj, mat) {
        var program = mat.program;
        for (var i = 0; i < mat.attributes.length; i++) {
            var attrib = mat.attributes[i];
            var arrayBuffer = obj.arrayBuffers[attrib.name];

            if (arrayBuffer === null || typeof(arrayBuffer) === 'undefined') {
                console.warn("No data for attribute `" + attrib.name + "`");
            } else {
                try {
                    arrayBuffer.bind();
                    arrayBuffer.buffer();
                    arrayBuffer.associate(attrib);
                }catch (e) {
                    console.error(e);
                    console.trace();
                }
            }       
        }
    };
    $W.renderer.processUniforms = function RNDR_processUniforms(obj, mat) {
        for (var i = 0; i < mat.uniforms.length; i++) {
            mat.uniforms[i].action(mat.uniforms[i], obj, mat);
        }
    };
    $W.renderer.renderObject = function RNDR_renderObject(obj, mat, drawFun) {
        mat.program.use();
        this.processUniforms(obj, mat);
        this.bindObjectAttributes(obj, mat);
        try {
            drawFun(obj, mat);
        }catch (e) {
            console.error("draw error");
            console.error(e);
        }
    };

    $W.renderer.drawArrays = function OBJ_drawArrays(obj, mat) {
        try {
            $W.GL.drawArrays(obj.type, 0, obj.vertexCount);
        }catch (e) {
            console.error("drawArrays Failure");
            console.error(e);
        }
    };

    $W.renderer.drawElements = function OBJ_drawElements(obj, mat) {
        var elements = obj.arrayBuffers.wglu_internal_elements;
        $W.GL.bindBuffer($W.GL.ELEMENT_ARRAY_BUFFER, elements.glBuffer);
        try {
            $W.GL.drawElements(obj.type, elements.data.length, 
                $W.GL.UNSIGNED_SHORT, elements.data);
        }catch (e) {
            console.error("drawElements Failure");
            console.error(e);
        }
    };
};

/** @author Benjamin DeLillo */
/*
     *  Copyright (c) 2009-10 Benjamin P. DeLillo
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
