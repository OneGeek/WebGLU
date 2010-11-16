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
        if (typeof(Matrix) == 'undefined') {
            $W.util.include($W.paths.external + $W.paths.sylvester);
        }

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
