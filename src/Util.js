if ($W.util === undefined) {
    $W.util = {
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
    }
}

/** Clips a value to a given range.
 * @param {Number|null} min The minimum value this function can
 * return. If null is passed, there is no minimum.
 * @param {Number|null} max The maximum value this function can
 * return. If null is passed, there is no minimum.
 * @param {Number} val The value to clip.
 */
$W.util.clip= function clip(val, min, max) {
    if (min !== null && val < min) {
        return min;
    }else if (max !== null && val > max) {
        return max;
    }else {
        return val;
    }
};

$W.util.sphereCollide=function sphereCollide(p1, p2, r1, r2) {
    return p1.distanceFrom(p2) < r1 + r2;
};

/** Get axis/angle representation of the rotation.
 * Based on http://www.euclideanspace.com/maths/geometry/rotations/conversions/eulerToAngle/index.htm
 * XXX unused
 */
$W.util.getAxisAngle = function getAxisAngle(rotation) {
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
$W.util.genSphere= function genSphere(rings, slices, r) {
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
};

/** Spherical linear interpolation. For interpolating quaternions.
 * Based on reference implementation at http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/index.htm
 * @param {Number} t How far along to interpolate.
 * @param {Quaternion} q1 {@link Quaternion} to interpolate from.
 * @param {Quaternion} q2 {@link Quaternion} to interpolate to.
 */
$W.util.slerp=function slerp(t, q1, q2) {
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
$W.util.lerp= function lerp(t,a,b) {
    return a + t * (b - a);
};

/** Linear interpolation between triples
 * @param {Array of 3 elements} a Array of values to interpolate from.
 * @param {Array of 3 elements} b Array of values to interpolate to.
 * @param {Number} t Value from 0 to 1 representing the fraction
 * between the two sets of values to interpolate by.
 */
$W.util.lerpTriple=function lerpTriple(t,a,b) {
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
$W.util.getNormalMatrixForUniform= function getNormalMatrixForUniform() {
    return new WebGLFloatArray($W.modelview.matrix.inverse().transpose().make3x3().flatten());
};

/** Create a WebGL context for the specified canvas.
 * @param {Canvas} canvas A canvas element.
 * @return {WebGL Context} A WebGL context for the passed
 * canvas.
 */
$W.util.getGLContext= function getGLContext(canvas) {
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
};

//--------------------------------------------------------------------------
//
// augment Sylvester some
// (c) 2009 Vladimir Vukicevic
$W.util.loadSylvester = function() {
    $W.util.include($W.paths.external + $W.paths.sylvester);

    Matrix.Translation = function (v) {
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

    Matrix.prototype.flatten = function () {
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

    Vector.prototype.flatten = function () {
        return this.elements;
    }; 

    Vector.prototype.vec3Zero = Vector.Zero(3);

    Vector.prototype.invert = function() {
        return Vector.prototype.vec3Zero.subtract(this);
    }
};
