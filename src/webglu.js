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
    renderableObjects:[],
    pickableObjects:[],
    objects  : [],

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
        $W.renderableObjects = [];
        $W.pickableObjects = [];
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

    /** @namespace Contains (semi)constant values that generally shouldn't be 
     * changed.
     */
    constants:{ 
        /** @namespace Color constants */
        colors: {
          RED  :[1.0, 0.0, 0.0],
          GREEN:[0.0, 1.0, 0.0],
          BLUE :[0.0, 0.0, 1.0],
          GREY :[0.5, 0.5, 0.5],
          WHITE:[1.0, 1.0, 1.0],
          BLACK:[0.0, 0.0, 0.0]
        },

        /** Data for a unit cube.
         * Intended to be used with setElements.
         */
        unitCube:{
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

        },

        /** The name that a uniform variable needs to have to be automatically
         * identified as the Model-View Matrix.
         */
        ModelViewUniform    : 'ModelViewMatrix',

        /** The name that a uniform variable needs to have to be automatically
         * identified as the Projection Matrix.
         */
        ProjectionUniform   : 'ProjectionMatrix',

        /** The name that a uniform variable needs to have to be automatically
         * identified as the Normal Matrix.
         */
        NormalMatrixUniform : 'NormalMatrix'
    },

    /** @namespace Utility functions. */
    util:{
        include: function(path) {
            var script = $W.util.loadFileAsText(path);
            window.eval(script);
        },

        /** Clips a value to a given range.
         * @param {Number|null} min The minimum value this function can
         * return. If null is passed, there is no minimum.
         * @param {Number|null} max The maximum value this function can
         * return. If null is passed, there is no minimum.
         * @param {Number} val The value to clip.
         */
        clip: function(val, min, max) {
            if (min !== null && val < min) {
                return min;
            }else if (max !== null && val > max) {
                return max;
            }else {
                return val;
            }
        },

        sphereCollide:function(p1, p2, r1, r2) {
            return p1.distanceFrom(p2) < r1 + r2;
        },

        /** Get axis/angle representation of the rotation.
         * Based on http://www.euclideanspace.com/maths/geometry/rotations/conversions/eulerToAngle/index.htm
         * XXX unused
         */
        getAxisAngle : function(rotation) {
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
        },

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
        genSphere: function(rings, slices, r) {
            // Default to unit sphere
            if (r === undefined) { r = 1; }

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
                    var sinPhi   = Math.sin(phi);
                    var cosTheta = Math.cos(theta);
                    var cosPhi   = Math.cos(phi);

                    var x = cosPhi * sinTheta;
                    var y = cosTheta;
                    var z = sinPhi * sinTheta;

                    var u = 1 - (slice / slices);
                    var v = ring / rings;

                    
                    sphere.vertices = sphere.vertices.concat([r*x, r*y, r*z]);
                    sphere.normals = sphere.normals.concat([x, y, z]);
                    sphere.texCoords = sphere.texCoords.concat([u,v]);
                }
            }

            for (var ring = 0; ring < rings; ++ring) {
                for (var slice   = 0; slice < slices; ++slice) {
                    var first = (ring * slices) + (slice % slices);
                    var second = first + slices;

                    sphere.indices = sphere.indices.concat([first, second, first+1, second, second+1, first+1]);                    
                }
            }

            return sphere;
        }, 

        /** Spherical linear interpolation. For interpolating quaternions.
         * Based on reference implementation at http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/index.htm
         * @param {Number} t How far along to interpolate.
         * @param {Quaternion} q1 {@link Quaternion} to interpolate from.
         * @param {Quaternion} q2 {@link Quaternion} to interpolate to.
         */
        slerp:function(t, q1, q2) {
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
        },

        /** Linear interpolation between numbers.
         * @param {Number} a Value to interpolate from.
         * @param {Number} b Value to interpolate to.
         * @param {Number} t Value from 0 to 1 representing the fraction
         * between the two values to interpolate by.
         */
        lerp:function(t,a,b) {
            return a + t * (b - a);
        },

        /** Linear interpolation between triples
         * @param {Array of 3 elements} a Array of values to interpolate from.
         * @param {Array of 3 elements} b Array of values to interpolate to.
         * @param {Number} t Value from 0 to 1 representing the fraction
         * between the two sets of values to interpolate by.
         */
        lerpTriple:function(t,a,b) {
            return [$W.util.lerp(t, a[0], b[0]),
                    $W.util.lerp(t, a[1], b[1]),
                    $W.util.lerp(t, a[2], b[2])
            ];
        },


        /** Load the file at the given path as text.
         * @param {String} path The path to the file.
         * @return {String} Data in the file as text.
         */
        loadFileAsText:function(path) {
            console.log("Loading file `" + path + "`");
            var xhr = null;
            xhr = new XMLHttpRequest();
            xhr.overrideMimeType("text/xml");

            if (!xhr) { return null; }

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
                console.groupEnd();
                console.error(e);
                throw "Browser security may be restrcting access to local files";
            }

            try {
                xhr.open("GET", path, false);
                xhr.send(null);

            }catch (e) { 
                throw e; 
            }

            console.log("\tCompleted with status: " + xhr.status);

            return xhr.responseText;
        },

        /** Calculates the 3x3 inverse transpose of the Model-View matrix.
         * Returns it in a format suitable to be passed directly as shader
         * uniform.
         * @return {WebGLFloatArray} 3x3 inverse transpose, ready to be sent as
         * a uniform.
         */
        getNormalMatrixForUniform: function() {
            return new WebGLFloatArray($W.modelview.matrix.inverse().transpose().make3x3().flatten());
        },

        /** Create a WebGL context for the specified canvas.
         * @param {Canvas} canvas A canvas element.
         * @return {WebGL Context} A WebGL context for the passed
         * canvas.
         */
        getGLContext: function(canvas) {
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

            if (!!gl) { console.log('using ' + type); }

            return gl;
        },

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
    Object:function (type, shouldAdd) {
        //console.group("Creating object");
        $W.ObjectState.call(this);

        if (shouldAdd !== false) {
            $W.addObject(this);
        }

        /** Name of shader program used to render this object */
        this.shaderProgram = 'default';
        var lastShaderProgram = 'default';

        /** Number of vertices in this object.
         * Used when rendering with drawArrays.
         */
        this.vertexCount = 0;

        this.id = $W.createdObjectCount++;

        /* The type of rendering to use for this object, possible values are:<br>
         * $W.GL.POINTS         <br>
         * $W.GL.LINES          <br>
         * $W.GL.LINE_LOOP      <br>
         * $W.GL.LINE_STRIP     <br>
         * $W.GL.TRIANGLES      <br>
         * $W.GL.TRIANGLE_STRIP <br>
         * $W.GL.TRIANGLE_FAN   <br>
         */
        this.type = type; // render type (wglu.GL.LINES, wglu.GL.POINTS, wglu.GL.TRIANGLES, etc.)

        this._elements = false;
        this._elementBuffer = null;
        this._elementCount = 0;

        /** WebGL array buffers for attribute data. */
        this.buffers = [];

        /** WebGL*array's of attribute data. */
        this.arrays = [];
        this._debugArrays = [];

        /** Names of textures this object uses. */
        this.textures = [];

        this._children = [];


        /** The animation for this object. */
        this.animation = new $W.anim.ProceduralAnimation();

        this._drawFunction = null;

        /** Set the shader program to the named program 
         * @param {String} program Program name.
         */
        this.setShaderProgram = function (program) {
            lastShaderProgram = this.shaderProgram;
            this.shaderProgram = program;
        }

        this.revertShaderProgram = function(){
            var tmp = this.shaderProgram;
            this.shaderProgram = lastShaderProgram;
            lastShaderProgram = tmp;
        }

        /** Add an object as a child to this object.
         * @param {Object} obj The object to add as a child.
         */
        this.addChild = function(obj) {
            this._children.push(obj);
        }

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
                this._elements = false;
                this._drawFunction = this._drawArrays();

            // use drawElements
            }else {
                this._elements = elements.flatten();
                this._elementCount = this._elements.length;
                this._elementBuffer = $W.GL.createBuffer();
                this._drawFunction = this._drawElements();
            }
        }

        /** Fills the array of the given name, where name is a 
         * vertex attribute in the shader. 
         * Also creates a buffer to hold the data in WebGL.
         * @param {String} name The attribute variable name in a shader
         * attached to the shader program used by this object. (this is
         * not verified for you)
         * @param {Array} contents The data to pass to the attribute.
         */
        this.fillArray = function(name, contents) {
            console.log("Filling `" + name + "` array");
            this._debugArrays = contents;
            this.arrays[name] = new WebGLFloatArray(contents.flatten());

            if (this.buffers[name] === undefined) {
                this.buffers[name] = $W.GL.createBuffer();
            }
        }

        /** XXX Not working Buffers the data for this object once. */
        this.bufferArrays = function() {
            var gl = $W.GL;
            var prg= $W.programs[this.shaderProgram];

            for (var i = 0; i < prg.attributes.length; i++) {
                try{
                    if (this.arrays[prg.attributes[i].name] !== undefined) {
                        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers[prg.attributes[i].name]);
                        gl.bufferData(gl.ARRAY_BUFFER, this.arrays[prg.attributes[i].name], 
                                gl.STATIC_DRAW);
                        gl.vertexAttribPointer(prg.attributes[i].location, 
                                prg.attributes[i].length, 
                                gl.FLOAT, false, 0, 0);

                        gl.enableVertexAttribArray(prg.attributes[i].location);
                    }
                }catch (err) {
                    console.error(e);
                }
            }

            if (this._elements !== false) {
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._elementBuffer);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new WebGLUnsignedShortArray(this._elements), 
                        gl.STATIC_DRAW);
            }

        }

        /** XXX Not working Binds the data buffers for rendering. */
        this.bindBuffers = function() {
            var gl = $W.GL;
            var prg= $W.programs[this.shaderProgram];
            //with ($W.GL){ with ($W.programs[this.shaderProgram]) {

            for (var i = 0; i < prg.attributes.length; i++) {
                try {
                    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers[prg.attributes[i].name]);
                    gl.bufferData(gl.ARRAY_BUFFER, this.arrays[prg.attributes[i].name], gl.STATIC_DRAW);
                    gl.vertexAttribPointer(prg.attributes[i].location, 
                            prg.attributes[i].length, 
                            gl.FLOAT, false, 0, 0);
                    gl.enableVertexAttribArray(prg.attributes[i].location);
                }catch (e) {
                    console.error(e);
                    //$W.draw = function() {};
                    // Stop rendering after error
                }
            }

            if (!(this._elements === false)) {
                $W.GL.bindBuffer($W.GL.ELEMENT_ARRAY_BUFFER, this._elementBuffer);
            }
            //}}
        }

        /** Buffer all the data stored in this object's attribute
         * arrays and set vertexAttribPointers for them.
         * XXX I'm pretty sure this is naive. I think I can buffer once,
         * then just rebind when I draw
         */
        this._bufferArrays = function() {
            var program = $W.programs[this.shaderProgram];

            for (var i = 0; i < program.attributes.length; i++) {
                var name      = program.attributes[i].name; 
                var attribute = program.attributes[i].location;
                var length    = program.attributes[i].length;
                var buffer    = program.attributes[i].buffer;

                var step = 0;
                try{
                    $W.GL.bindBuffer($W.GL.ARRAY_BUFFER, this.buffers[name]);
                    step++;
                    $W.GL.bufferData($W.GL.ARRAY_BUFFER, 
                            this.arrays[name], $W.GL.STATIC_DRAW);
                    step++;

                    $W.GL.vertexAttribPointer(attribute, length, $W.GL.FLOAT, false, 0, 0);
                    step++;
                    $W.GL.enableVertexAttribArray(attribute);
                    step++;
                }catch (e) {
                    if (typeof(this.arrays[name]) === 'undefined') {
                        console.error("`" + name + "` data is undefined");
                    }else if (step === 0) {
                        console.error("err: binding `" + name + "` buffer");
                    }else if (step === 1) {
                        console.error("err: buffering data for `" + name + "`");
                    }else if (step === 2) {
                        console.error("err: in vertexAttribPointer `" + name + "`");
                    }else if (step === 3) {
                        console.error("err: enabling attrib array`" + name + "`");
                    }
                }
            }

            
            // if elements aren't disabled
            // XXX convert to callback to avoid `if`
            if (this._elements !== false) {
                $W.GL.bindBuffer($W.GL.ELEMENT_ARRAY_BUFFER, this._elementBuffer);
                $W.GL.bufferData($W.GL.ELEMENT_ARRAY_BUFFER,new WebGLUnsignedShortArray(this._elements), 
                        $W.GL.STATIC_DRAW);
            }
        }


        this.setTexture = function(texture, sampler) {
            this.textures[0] = texture;
            console.log("Applying `" + texture + "` texture");
            $W.programs[this.shaderProgram].setUniformAction(sampler, 
                    function(obj) {
                        var gl = $W.GL;
                        gl.activeTexture(gl.TEXTURE0);
                        gl.bindTexture(gl.TEXTURE_2D, 
                            $W.textures[obj.textures[0]].glTexture);
                        gl.uniform1i(this.location, 0);
                    });
        }


        /** Bind the textures for this object.
         * XXX Will only work with single texturing
         * @deprecated Use setTexture(texture, sampler) instead.
         */
        this.bindTextures = function() {
            return;
            var gl = $W.GL;
            for (var i = 0; i < this.textures.length; i++) {
                gl.activeTexture(gl.TEXTURE0);
                this.textures[i].bind();
                gl.uniform1i(gl.getUniformLocation($W.programs[this.shaderProgram].glProgram, 'sampler'), 0);
            }
        }


        // XXX these are also clunky
        /** @returns {Vector} The sum of the object's base position and its 
         * animation.
         */
        this.animatedPosition = function() { 
            return this.position.add(this.animation.position); 
        }

        /** @returns {Vector} The sum of the object's base rotation and its 
         * animation. 
         */
        this.animatedRotation = function() { 
            //return this.rotation.add(this.animation.rotation); 
            return this.q.multiply(this.animation.q);
        }

        /** @returns {Vector} The product of the object's base scale and its 
         * animation. 
         */
        this.animatedScale    = function() { 
            return $V([
                this.scale.e(1) * this.animation.scale.e(1),
                this.scale.e(3) * this.animation.scale.e(2),
                this.scale.e(3) * this.animation.scale.e(3)
            ]);
        }

        /** Set the x y and z components of the object's scale to the given
         * value.
         * @param {Number} s New scale of the object.
         */
        this.setScaleUniformly = function(s) { 
            this.scale = $V([s,s,s]); 
        }

        // These allow us to do array or element drawing without
        // testing a boolean every frame
        this._drawArrays = function() {
            return (function() {
                try {
                    $W.GL.drawArrays(this.type, 0, this.vertexCount);
                }catch (e) {
                    console.error(e);
                }
            });
        }

        this._drawElements = function() {
            return (function() {
                try {
                    $W.GL.drawElements(this.type, this._elementCount, 
                        $W.GL.UNSIGNED_SHORT, this._elements);
                }catch (e) {
                    console.error(e);
                }
            });
        }

        // drawArrays by default
        this._drawFunction = this._drawArrays();
        
        /** draw this object at the given postion, rotation, and scale
         * @param {3 Element Array} pos Position array.
         * @param {Matrix} rot Rotation matrix.
         * @param {3 Element Array} scale Scaling array.
         */
        this.drawAt = function(pos, rot, scale) {
                $W.modelview.pushMatrix();

                $W.modelview.translate(pos);
                $W.modelview.multMatrix(rot);
                $W.modelview.scale(scale);

                for (var i = 0; i < this._children.length; i++) {
                    this._children[i].draw();
                }

                $W.programs[this.shaderProgram].use();
                $W.programs[this.shaderProgram].processUniforms(this);

                $W.modelview.popMatrix();

                //this.bindBuffers();
                this._bufferArrays();
                //this.bindTextures();
                

                this._drawFunction();
                $W.GL.bindTexture($W.GL.TEXTURE_2D, null);
        }

        this.drawChildrenAt = function(pos, rot, scale) {
                $W.modelview.pushMatrix();

                $W.modelview.translate(pos);
                $W.modelview.multMatrix(rot);
                $W.modelview.scale(scale);

                for (var i = 0; i < this._children.length; i++) {
                    this._children[i].draw();
                }

                $W.modelview.popMatrix();
        }

        /** draw this object at its internally stored position, rotation, and
         * scale, INCLUDING its current animation state.
         */
        this.draw = function() {
            this.drawAt(
                this.animatedPosition().elements, 
                this.animatedRotation().matrix(),
                this.animatedScale().elements
            );
        }

        this.drawChildren = function() {
            this.drawChildrenAt(
                this.animatedPosition().elements, 
                this.animatedRotation().matrix(),
                this.animatedScale().elements
            );
        }

        /** Update this object's animation state. 
         * @param {Number} dt The delta time since the previous call to
         * update.
         */
        this.update = function(dt) {
            this.animation.update(dt);

            for (var i = 0; i < this._children.length; i++) {
                this._children[i].update(dt);
            }
        }

        //console.groupEnd();
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



    /** 
     * Initialize the WebGLU system, optionally initizlizing the WebGL
     * subsystem.
     * canvasNode - the DOM node of a canvas element to init WebGL,
     *              defaults to using the DOM element with ID 'canvas'.
     *              Pass `false` to skip init of WebGL subsystem.
     */
    initialize:function(canvasNode) {
        $W.initLogging();

        $W.util.include($W.paths.libsrc + 'GLSL.js');
        $W.util.include($W.paths.libsrc + 'GLU.js');

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

