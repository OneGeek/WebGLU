

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

                        }else if (textureDef.type == "Canvas") {
                            new $W.CanvasTexture(textureDef.name, 
                                    document.getElementById(texture.element_id));

                        }else if (textureDef.type === "Video") {
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
