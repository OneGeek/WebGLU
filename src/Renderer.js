$W.initRenderer = function() {
    $W.renderer = {};
    $W.renderer.bindObjectAttributes = function RNDR_bindObjectAttributes(obj, mat) {
        var program = mat.program;
        for (var i = 0; i < mat.attributes.length; i++) {
            var attrib = mat.attributes[i];
            var arrayBuffer = obj.arrayBuffers[attrib.name];

            if (arrayBuffer === null || typeof(arrayBuffer) === 'undefined') {
                console.warn("No data for attribute `" + attrib.name + "`");
            } else {
                try {
                    arrayBuffer.bind();
                    arrayBuffer.buffer();
                    arrayBuffer.associate(attrib);
                }catch (e) {
                    console.error(e);
                    console.trace();
                }
            }       
        }
    };
    $W.renderer.processUniforms = function RNDR_processUniforms(obj, mat) {
        for (var i = 0; i < mat.uniforms.length; i++) {
            mat.uniforms[i].action(mat.uniforms[i], obj, mat);
        }
    };
    $W.renderer.renderObject = function RNDR_renderObject(obj, mat, drawFun) {
        mat.program.use();
        this.processUniforms(obj, mat);
        this.bindObjectAttributes(obj, mat);
        try {
            drawFun(obj, mat);
        }catch (e) {
            console.error("draw error");
            console.error(e);
        }
    };

    $W.renderer.drawArrays = function OBJ_drawArrays(obj, mat) {
        try {
            $W.GL.drawArrays(obj.type, 0, obj.vertexCount);
        }catch (e) {
            console.error("drawArrays Failure");
            console.error(e);
        }
    };

    $W.renderer.drawElements = function OBJ_drawElements(obj, mat) {
        var elements = obj.arrayBuffers.wglu_internal_elements;
        $W.GL.bindBuffer($W.GL.ELEMENT_ARRAY_BUFFER, elements.glBuffer);
        try {
            $W.GL.drawElements(obj.type, elements.data.length, 
                $W.GL.UNSIGNED_SHORT, elements.data);
        }catch (e) {
            console.error("drawElements Failure");
            console.error(e);
        }
    };
};

/** @author Benjamin DeLillo */
/*
     *  Copyright (c) 2009-10 Benjamin P. DeLillo
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
