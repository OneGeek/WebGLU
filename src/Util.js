/** Clips a value to a given range.
 * @param {Number|null} min The minimum value this function can
 * return. If null is passed, there is no minimum.
 * @param {Number|null} max The maximum value this function can
 * return. If null is passed, there is no minimum.
 * @param {Number} val The value to clip.
 */
$W.util.clip= function(val, min, max) {
    if (min !== null && val < min) {
        return min;
    }else if (max !== null && val > max) {
        return max;
    }else {
        return val;
    }
};

$W.util.sphereCollide=function(p1, p2, r1, r2) {
    return p1.distanceFrom(p2) < r1 + r2;
};

/** Get axis/angle representation of the rotation.
 * Based on http://www.euclideanspace.com/maths/geometry/rotations/conversions/eulerToAngle/index.htm
 * XXX unused
 */
$W.util.getAxisAngle = function(rotation) {
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
$W.util.genSphere= function(rings, slices, r) {
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
$W.util.slerp=function(t, q1, q2) {
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
$W.util.lerp=function(t,a,b) {
    return a + t * (b - a);
};

/** Linear interpolation between triples
 * @param {Array of 3 elements} a Array of values to interpolate from.
 * @param {Array of 3 elements} b Array of values to interpolate to.
 * @param {Number} t Value from 0 to 1 representing the fraction
 * between the two sets of values to interpolate by.
 */
$W.util.lerpTriple=function(t,a,b) {
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
$W.util.getNormalMatrixForUniform= function() {
    return new WebGLFloatArray($W.modelview.matrix.inverse().transpose().make3x3().flatten());
};

/** Create a WebGL context for the specified canvas.
 * @param {Canvas} canvas A canvas element.
 * @return {WebGL Context} A WebGL context for the passed
 * canvas.
 */
$W.util.getGLContext= function(canvas) {
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
