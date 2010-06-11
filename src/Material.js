$W.Material = function(name) {


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

    this.initFromJSON = function MAT_initFromJSON(file) {
        // Get single line JSON formatted material definition
        var materialDef = eval('(' + file.replace(/\n/g, '') + ')');

        this.name = materialDef.name;
        $W.log('loading material `' + this.name + '` from file');
        $W.indentLog();

        // If a program of the name specified in the material doesn't already
        // exist, create it with the specified parameters.
        var program = $W.programs[materialDef.program.name];
        if (typeof(program) === 'undefined') {

            program = new $W.GLSL.ShaderProgram(materialDef.program.name);

            for (var i = 0; i < materialDef.program.shaders.length; i++) {
                var shaderDef = materialDef.program.shaders[i];

                program.attachShader(shaderDef.name, shaderDef.path);
            }
            program.use();
        }

        this.program = program;
        this.setupUniforms();

        // If textures specified in the material do not exist, create them.
        if (typeof(materialDef.textures) !== 'undefined') {
            for (var i = 0; i < materialDef.textures.length; i++) {
                var textureDef = materialDef.textures[i];
                if (typeof($W.textures[textureDef.name]) === 'undefined') {

                    // type is Image, Canvas, or Video. this calls
                    // ImageTexture, CanvasTexture or VideoTexture.
                    if (textureDef.type === "Image") {
                        new $W.ImageTexture(textureDef.name, textureDef.path);

                    }else if (textureDef.type == "Canvas") {
                        new $W.CanvasTexture(textureDef.name, 
                                document.getElementById(textureDef.element_id));

                    }else if (textureDef.type === "Video") {
                        new $W.VideoTexture(textureDef.name, textureDef.path);
                    }

                    this.textures.push(textureDef.name);
                    this.setupTextureUniforms();
                }
            }
        }
        $W.dedentLog();
    };

    this.setupTextureUniforms = function MAT_setupTextureUniforms() {
        for (var i = 0; i < this.textures.length; i++) {
            var action = genMultiTextureAction(i);
            console.log(action);
            this.setUniformAction('wglu_mat_texture'+i, action);
        }
    };


    // Manual
    // Material(name)
    if (arguments.length === 1) {
        $W.log("creating material `" + name + "`");
        this.name = name;

    // Load from file
    // Material(name, path)
    }else if (arguments.length === 2) {
        this.initFromJSON($W.util.loadFileAsText(arguments[1]));

        // Passing null as the name when loading from file
        // uses the file's provided name.
        if (name !== null) {
            this.name = name;
        }

/*
    // Manual
    // Material(name, program)
    }else if (arguments.length === 2) {
        this.name = name;

        // with existing program
        if (typeof(arguments[2]) == "string") {
            this.program = $W.programs[arguments[2]];
        }else {
            this.program = arguments[2];
        }
        this.program.use();
        this.reset();

*/

    }else {
        throw new Error("No Material() overload for " + arguments.length + " arguments");
    }

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
