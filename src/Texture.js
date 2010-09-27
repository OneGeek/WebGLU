$W.Texture = function(name) {
    this.glTexture = $W.GL.createTexture();
    this.name = name;
    $W.textures[name] = this;

    this.bind = function() {
        $W.GL.bindTexture($W.GL.TEXTURE_2D, this.glTexture);
    };
        
    this.unbind = function() {
        $W.GL.bindTexture($W.GL.TEXTURE_2D, null);
    };

    this.update = function(){};

    this.bind();
    $W.GL.texParameteri($W.GL.TEXTURE_2D, $W.GL.TEXTURE_MIN_FILTER, $W.GL.LINEAR);
    $W.GL.texParameteri($W.GL.TEXTURE_2D, $W.GL.TEXTURE_WRAP_S, $W.GL.CLAMP_TO_EDGE);
    $W.GL.texParameteri($W.GL.TEXTURE_2D, $W.GL.TEXTURE_WRAP_T, $W.GL.CLAMP_TO_EDGE);

};

$W.CanvasTexture = function(name, src) {
    $W.Texture.call(this, name);

    this.canvas = src;
    this.canvas.texture = this;

    this.update = function() {
        var gl = $W.GL;
        this.bind();
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, 
            gl.UNSIGNED_BYTE, this.canvas);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        this.unbind();
    };

};

/** A dynamic texture from a `video` element.    
 * @param {String} name The global name this texture will be referenced
 * by elsewhere.
 * @param {String|Video} src Video path or DOM video element.
 */
$W.VideoTexture = function(name, src) {
    $W.Texture.call(this, name);

    this.setSource = function(video) {
        // Path to video
        if (typeof(video) === 'string') {
            this.video = document.createElement('video');
            document.getElementsByTagName('body')[0].appendChild(this.video);

            this.video.src = video;

        // DOM Video element
        }else {
            this.video = video;
        }

        this.video.texture = this;
        this.video.autobuffer = true;
        this.video.loop = true;
        this.video.play();
        this.video.addEventListener("timeupdate", this.update, true);
    };

    this.update = function() {
        var gl = $W.GL;
        this.bind();
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, 
            gl.UNSIGNED_BYTE, this.video);
        //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        //gl.generateMipmap(gl.TEXTURE_2D);
        //gl.bindTexture(gl.TEXTURE_2D, null); // clean up after ourselves
    }

    this.setSource(src);
};

/** A static texture from an image file.
 * @param {String} name The global name this texture will be referenced
 * by elsewhere.
 * @param {String} src Path to image file.
 */
$W.ImageTexture = function(name, src) {
    $W.Texture.call(this, name);
    this.image = document.createElement('img');
    this.image.texture = this;

    this.image.onload = function() {
        var gl = $W.GL;
        $W.debug('Loaded texture `' + name + "`");
        this.texture.bind();

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, 
            gl.UNSIGNED_BYTE, this.texture.image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

        this.texture.unbind();
    }

    this.setSource = function(src) {
        this.image.src = src;
    };

    if (src !== undefined) {
        this.setSource(src);
    }
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
