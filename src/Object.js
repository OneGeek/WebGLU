
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
$W.Object = function (type, flags) {
    //console.group("Creating object");
    $W.ObjectState.call(this);

    $W.addObject(this);

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





    // XXX these are also clunky
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
            this.scale.e(3) * this.animation.scale.e(2),
            this.scale.e(3) * this.animation.scale.e(3)
        ]);
    };

    /** Set the x y and z components of the object's scale to the given
     * value.
     * @param {Number} s New scale of the object.
     */
    this.setScaleUniformly = function(s) { 
        this.scale = $V([s,s,s]); 
    };





    /** Set the shader program to the named program 
     * @param {String} program Program name.
     */
    this.setShaderProgram = function (program) {
        lastShaderProgram = this.shaderProgram;
        this.shaderProgram = program;
    };

    this.revertShaderProgram = function(){
        var tmp = this.shaderProgram;
        this.shaderProgram = lastShaderProgram;
        lastShaderProgram = tmp;
    };

    /** Add an object as a child to this object.
     * @param {Object} obj The object to add as a child.
     */
    this.addChild = function(obj) {
        this._children.push(obj);
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
            this._elements = false;
            this._drawFunction = this._drawArrays();
            $W.GL.bindBuffer($W.GL.ELEMENT_ARRAY_BUFFER, null);

        // use drawElements
        }else {
            this._elements = elements.flatten();
            this._elementCount = this._elements.length;
            this._elementBuffer = $W.GL.createBuffer();
            this._drawFunction = this._drawElements();
            $W.GL.bindBuffer($W.GL.ELEMENT_ARRAY_BUFFER, this._elementBuffer);
            $W.GL.bufferData($W.GL.ELEMENT_ARRAY_BUFFER,new WebGLUnsignedShortArray(this._elements), 
                    $W.GL.STATIC_DRAW);
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
    this.fillArray = function(name, contents) {
        console.log("Filling `" + name + "` array");
        this._debugArrays = contents;
        this.arrays[name] = new WebGLFloatArray(contents.flatten());

        if (this.buffers[name] === undefined) {
            this.buffers[name] = $W.GL.createBuffer();
        }
        this.bufferArray(name);
    };

    this.bufferArray = function(name) {
        var gl = $W.GL;
        var prg= $W.programs[this.shaderProgram];
        var atrb = prg.attributes.findByAttributeValue('name', name);
        if (atrb === null) {
            return;
        }

        try {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers[atrb.name]);
            gl.bufferData(gl.ARRAY_BUFFER, this.arrays[atrb.name], 
                    gl.STATIC_DRAW);

            gl.enableVertexAttribArray(atrb.location);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }catch (err) {
            console.error("Object attribute buffer error");
            console.error(atrb.name);
            console.error(err);
        }
        
    };

    this.bind = function() {
        var gl = $W.GL;
        var program = $W.programs[this.shaderProgram];

        try{
            for (var i = 0; i < program.attributes.length; i++) {
                var atrb = program.attributes[i];

                gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers[atrb.name]);
                gl.vertexAttribPointer(atrb.location, atrb.length, 
                        gl.FLOAT, false, 0, 0);
                gl.bindBuffer(gl.ARRAY_BUFFER, null);
            }
        }catch (e) {
            console.error("Object attribute bind error");
            console.error(e);
        }

    };

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
    };


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
    };

    this._drawElements = function() {
        return (function() {
            $W.GL.bindBuffer($W.GL.ELEMENT_ARRAY_BUFFER, this._elementBuffer);
            try {
                $W.GL.drawElements(this.type, this._elementCount, 
                    $W.GL.UNSIGNED_SHORT, this._elements);
            }catch (e) {
                console.error(e);
            }
        });
    };

    // drawArrays by default
    this._drawFunction = this._drawArrays();
    
    /** draw this object at the given postion, rotation, and scale
     * @param {3 Element Array} pos Position array.
     * @param {Matrix} rot Rotation matrix.
     * @param {3 Element Array} scale Scaling array.
     */
    this.drawAt = function(pos, rot, scale) {
            $W.modelview.push();

            $W.modelview.translate(pos);
            $W.modelview.multiply(rot);
            $W.modelview.scale(scale);

            for (var i = 0; i < this._children.length; i++) {
                this._children[i].draw();
            }

            $W.programs[this.shaderProgram].use();
            $W.programs[this.shaderProgram].processUniforms(this);

            $W.modelview.pop();

            this.bind();

            this._drawFunction();
            $W.GL.bindTexture($W.GL.TEXTURE_2D, null);
    };

    this.drawChildrenAt = function(pos, rot, scale) {
            $W.modelview.pushMatrix();

            $W.modelview.translate(pos);
            $W.modelview.multMatrix(rot);
            $W.modelview.scale(scale);

            for (var i = 0; i < this._children.length; i++) {
                this._children[i].draw();
            }

            $W.modelview.popMatrix();
    };

    /** draw this object at its internally stored position, rotation, and
     * scale, INCLUDING its current animation state.
     */
    this.draw = function() {
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

        for (var i = 0; i < this._children.length; i++) {
            this._children[i].update(dt);
        }
    };

    //console.groupEnd();
};
