/** @ignore Wrapper function to allow multifile or single file organization */
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

        /** Checks the rotation and updates the quaternion representation if
         * necessary
         */
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

        /** Set a new position. 
         * Takes (x,y,z) or (vector)
         */
        this.setPosition = function(x, y, z) { 
            // Called as setPosition(x, y, z)
            if (arguments.length == 3) {
                this.position.elements = [x, y, z]; 

                // Called as setPosition([x, y, z])
            }else {
                this.position.elements = arguments[0];
            }
        }

        /** Set a new rotation. 
         * Takes (x,y,z) or (vector)
         */
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

        /** Set a new scale. 
         * Takes (x,y,z) or (vector)
         */
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

        /** 
         * Specify data to store for on demand buffering.
         *
         * @param {Array} data Array of data
         */
        this.setData = function ABUF_setData(data) {
            this.data = data;
            this.glData = new WebGLFloatArray(data);
            this.buffer();
        };

        /** Append data to this buffer
         * @param {Array} data Data to append
         */
        this.append = function ABUF_append(data) {
            this.setData(this.data.concat(data));
        };

        /** 
         * Buffer the stored data into its WebGL ARRAY_BUFFER
         */
        this.buffer = function ABUF_buffer() {
            try {
                this.bind();
                $W.GL.bufferData($W.GL.ARRAY_BUFFER, this.glData, $W.GL.STATIC_DRAW);
                this.unbind();
            }catch (e) {
                console.error(e);
            }
        };

        /**
         * Associate this ArrayBuffer with a particular attribute.
         *
         * @param {$W.GLSL.Attribute} attrib The attribute this data will be be
         * used for.
         */
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

        /**  Bind this buffer
         */
        this.bind = function ABUF_bind() {
            $W.GL.bindBuffer($W.GL.ARRAY_BUFFER, this.glBuffer);
        };

        /**  Unbind this buffer
         */
        this.unbind = function ABUF_unbind() {
            $W.GL.bindBuffer($W.GL.ARRAY_BUFFER, null);
        };
    };


    $W.RENDERABLE   = 1;
    $W.PICKABLE     = 2;

    /** Utility function to help build objects from JSON
     *
     * @param params The paramaters object
     */
    $W.createObject = function(params) {
        obj = new $W.Object();
        obj.setupFromParams(params);
        return obj;
    };


    /** @class Contains pertinent render information for an individual renderable entity.
     *
     * Make sure to set vertexCount correctly
     * Animations are clunky right now, I'm working on it.
     *
     * @extends $W.ObjectState
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
     *
     * @property {Number} vertexCount Number of vertices in this object. Used
     * when rendering with drawArrays.
     */
    $W.Object = function (type, flags) {
        //console.group("Creating object");
        $W.ObjectState.call(this);
        if (typeof(flags) === 'undefined' ||/*backcompat*/ flags === true) {
            flags = $W.RENDERABLE | $W.PICKABLE;
        }/*backcompat*/else if(flags === false) {
            flags = $W.PICKABLE;
        }

        $W.objects.push(this);

        this.setupFromParams = function(params) {
            var has = function(param){
                return typeof(param) !== 'undefined';
            };

            if(has(params.type)) {
                this.type = params.type;
            }


            if (has(params.material)){
                this.setMaterial(params.material);
            }

            if (has(params.model)){
                this.fromModel(params.model);
            }else if (has(params.data)){
                this.fillArrays(params.data);
            }

            if (has(params.vertexCount)){
                this.vertexCount = params.vertexCount;
            }
        };


        if (flags & $W.RENDERABLE){
            $W.renderables.push(this);
        }

        if (flags & $W.PICKABLE) {
            $W.pickables.push(this);
        }

        this.vertexCount = 0;

        this.id = $W.createdObjectCount++;


        this.material = $W.materials['wglu_default'];

        this.buffers = [];

        this.children = [];

        /** The animation for this object. */
        this.animation = new $W.ProceduralAnimation();

        // drawArrays by default
        this._drawFunction = $W.renderer.drawArrays;

        /** Add an object as a child to this object.
         * @param {Object} obj The object to add as a child.
         */
        this.addChild = function(obj) {
            this.children.push(obj);
        };

        /** Set the indices for the elements of this object.
         * Draws this object with drawElements unless set with
         * false.
         *
         * @param {Array|Boolean} elements The array of indices of the
         * elements or false, which disables drawElements rendering
         * for this object.
         */
        this.setElements = function(elements) {
            // don't use drawElements
            if (elements === false) {
                this.buffers.wglu_internal_elements = undefined;
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

                this.buffers.wglu_internal_elements = elementAB;
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
            data = $W.util.flattenArray(data);
            if (typeof(this.buffers[name]) === 'undefined') {
                this.buffers[name] = new $W.ArrayBuffer(name, data);
            }else {
                this.buffers[name].setData(data);
            }

            this.buffers[name].buffer();
        };

        /** Passes several sets of attribute data to $W.Object.fillArray at once
         *
         * @param {Array} arrays Arrays of the format ["attribute", [0,0,0,...]]
         * corresponding to the arguments of $W.Object.fillArray
         */
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

        /** Uses an object of the format
         * {
         *      vertices:   [...],
         *      normals:    [...],
         *      texCoords:  [...],
         *      indices:    [...]
         * }
         * to fill the vertex, normal, texCoord and
         * wglu_elements arrays.
         */
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

        /**
         * Draw the children of this object with a particular transform applied
         * @param {3 Element Array} pos Position array.
         * @param {Matrix} rot Rotation matrix.
         * @param {3 Element Array} scale Scaling array.
         */
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

        /** Draw the children of this object using this object's current state
         */
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

        /** @returns {Matrix} The current rotation matrix
         */
        this.rotationMatrix = function OBJ_rotationMatrix() {
            return this.animatedRotation().matrix();
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

        /* The type of rendering to use for this object */
        if (typeof(type) === 'object') {
            this.setupFromParams(type);
        }else {
            this.type = type; 
        }

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
