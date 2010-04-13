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
    }
};

$W.light = function(light, pname, param) {

};

$W.GLSL.util = {
    handlePragmas: function(source) {
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
    },

    handleIncludes: function(source) {
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
            console.log('invalid shader type' + shaderScript.type);
        }
    
        return type;
    }
};



/** Nothing, for now */
$W.GLSL.initialize = function() {
    
};



/** @class Holds data for shader attribute variables.
 * @param {String} name Attributes have the name they are given in
 * the shader code.
 */
$W.GLSL.Attribute = function (name, length) {
    this.name = name;
    this.length = length;
    this.location = null;
    this.buffer = null;
    this.clone = function() {
        return new $W.GLSL.Attribute(this.name, this.length);
    }
};



/** @class Holds data for shader uniform variables
 * @param {String} name Uniforms have the name they are given in
 * the shader code.
 * @param {Function} action The function to update the data in the 
 * uniform each frame.
 */
$W.GLSL.Uniform = function (name, action, type) {
    this.name = name;
    this.location = 0;  // only used by the shader program
    this.action = action;
    this.type = type;

    this.clone = function() {
        return new $W.GLSL.Uniform(this.name, this.action, this.type);
    }
};

$W.GLSL.useLighting = function(shader) {

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
    //console.groupCollapsed("creating shader '" + name + "'");
    console.group("creating shader '" + name + "'");
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
        console.log("Marking shader `" + name + "` as dirty");
        for (var i = 0; i < programs.length; i++) {
            console.log('dirtying program `' + programs[i] + "`");
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

    /** Set up a Uniform for the modelview matrix.
     * Creates the appropriate action for sending the matrix
     * each frame.
     * @param {String} name Name of the uniform in the shader.
     */
    this.setModelViewUniform = function(name) {
        console.log("using '" + name + "' as ModelView uniform");

        var uniform = this.uniforms.findByAttributeValue('name', name);

        uniform.action = function() {
            $W.GL.uniformMatrix4fv(this.location, false, 
                    $W.modelview.getForUniform());
        };
    };

    /** Set up a Uniform for the projection matrix.
     * Creates the appropriate action for sending the matrix
     * each frame.
     * @param {String} name Name of the uniform in the shader.
     */
    this.setProjectionUniform = function(name) {
        console.log("using '" + name + "' as Projection uniform");

        var uniform;
        for (var i = 0; i < this.uniforms.length; i++) {
            if (this.uniforms[i].name === name) {
                uniform = this.uniforms[i];
            }
        }

        uniform.action = function() {
            $W.GL.uniformMatrix4fv(this.location, false, 
                    $W.projection.getForUniform());
        };
    };

    /** Set up a Uniform for the normal matrix.
     * Creates the appropriate action for sending the matrix
     * each frame.
     * @param {String} name Name of the uniform in the shader.
     */
    this.setNormalMatrixUniform = function(name) {
        console.log("using '" + name + "' as normal transformation matrix");

        var uniform;
        for (var i = 0; i < this.uniforms.length; i++) {
            if (this.uniforms[i].name === name) {
                uniform = this.uniforms[i];
            }
        }

        uniform.action = function() {
            $W.GL.uniformMatrix3fv(this.location, false, 
                    $W.util.getNormalMatrixForUniform());
        };
    }

    /** @returns The raw WebGL shader object */
    this.getGLShader = function() {
        // Ensure the shader is valid before we return it
        if (isDirty) {
            console.log("'" + this.name + "' is dirty");
            if (!this.compile()) {
                return false;
            }else {
                clean();
            }
        }else {
            console.log("'" + this.name + "' is clean, using");
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
        console.log("adding uniform '" + name + "'");
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
        console.log("adding attribute '" + name + "'");
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
                this.addUniform(name, function(){}, type);


                if (name === $W.constants.ModelViewUniform) {
                    this.setModelViewUniform($W.constants.ModelViewUniform);

                }else if (name === $W.constants.ProjectionUniform) {
                    this.setProjectionUniform($W.constants.ProjectionUniform);

                }else if (name === $W.constants.NormalMatrixUniform) {
                    this.setNormalMatrixUniform($W.constants.NormalMatrixUniform);

                }else if (name === $W.constants.LightSourceUniform) {

                    var uniform;
                    for (var j = 0; j < this.uniforms.length; j++) {
                        if (this.uniforms[j].name === name) {
                            uniform = this.uniforms[j];
                        }
                    }

                    console.log(source);
            
                    uniform.name = ($W.constants.LightSourceUniform + 
                                    "");
                    uniform.type = "vec4";

                    uniform.action = function() {
                        $W.GL.uniform4fv(this.location, false, 
                                new WebGLFloatArray($W.lights[0].position));
                    };
                }
            }
        }
    };

    /** Compile the shader if able.
     * Lets any shader programs which use this shader know they need to
     * relink
     */
    this.compile = function() {
        if (this.type === $W.GL.VERTEX_SHADER) {
            console.log("compiling '" + this.name + "' as vertex shader");
        }else if (this.type === $W.GL.FRAGMENT_SHADER) {
            console.log("compiling '" + this.name + "' as vertex shader");
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
            console.groupCollapsed('Compile error');
            console.log(source);
            console.groupEnd();
            glShader = null;
        } else {
            clean();
            glShader = shader;
        }

        return (glShader !== null);
    };

    source = $W.GLSL.util.handlePragmas(source);
    this.parseShaderVariables(source);
    this.compile();

    console.groupEnd();
};





/** @class Handles data and linking for a shader program.
 * Also ensures all shaders which it uses are compiled and up
 * to date.
 * @param {String} name All shader programs need a unique name.
 */
$W.GLSL.ShaderProgram = function(name) {
    console.log("creating shader program '" + name + "'");

    /** Global name of the shader program. */
    this.name = name;

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
                attribute.buffer   = $W.GL.createBuffer();

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
                console.log(uniform.name + " " + uniform.location);
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
            //console.log("Setting action for uniform `" + name + "` in shader program `" + this.name + "`");
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
            //console.log("Setting uniform `" + name + "` in shader program `" + this.name + "`");
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
            this.uniforms[i].action(obj);
        }
    }

    /** Link this shader program to make it useable.
     * Will [re]compile all attached shaders if necessary.
     */
    this.link = function() {
        console.group("linking program `" + this.name + "`");


        // Only delete the program if one already exists
        if (this.glProgram !== null) {
            console.log("already exists, deleting and relinking");
            $W.GL.deleteProgram(this.glProgram);
            this.attributes = [];
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
                console.log(this.shaders[i] + " failed to compile");
            }else {
                $W.GL.attachShader(this.glProgram, 
                        $W.shaders[this.shaders[i]].getGLShader());
            }	
        }

        $W.GL.linkProgram(this.glProgram);

        // Check for errors
        if (!$W.GL.getProgramParameter(this.glProgram, $W.GL.LINK_STATUS)) {
            console.group('Link error');
            console.error($W.GL.getProgramInfoLog(this.glProgram));
            dirty();
            console.groupEnd();
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
        console.log("attaching '" + shader.name + "' to '" + this.name + "'");
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

    console.groupEnd();
};
