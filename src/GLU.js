
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

    /** glMultMatrix
     * (c) 2009 Vladimir Vukicevic
     * @param {Vector} m A Sylvester matrix to multiply by.
     */
    this.multMatrix = function (m) {
        this.matrix = this.matrix.x(m);
    };

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
