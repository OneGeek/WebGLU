
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
$W.Object = function (type, shouldAdd) {
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

        // use drawElements
        }else {
            this._elements = elements.flatten();
            this._elementCount = this._elements.length;
            this._elementBuffer = $W.GL.createBuffer();
            this._drawFunction = this._drawElements();
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
    };





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
    };

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
