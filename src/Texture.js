$W.Texture = function(name) {
    this.glTexture = $W.GL.createTexture();
    this.name = name;
    $W.textures[name] = this;

    this.bind = function() {
        $W.GL.bindTexture($W.GL.TEXTURE_2D, this.glTexture);
    };
        
    this.unbind = function() {
        $W.GL.bindTexture($W.GL.TEXTURE_2D, this.glTexture);
    };

};

$W.CanvasTexture = function(name, src) {
    $W.Texture.call(this, name);

    this.canvas = src;
    this.canvas.texture = this;

    this.update = function() {
        var gl = $W.GL;
        this.texture.bind();
        gl.texImage2D(gl.TEXTURE_2D, 0, this);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        this.texture.unbind();
    };

};

/** A dynamic texture from a `video` element.    
 * @param {String} name The global name this texture will be referenced
 * by elsewhere.
 * @param {String|Video} src Video path or DOM video element.
 */
$W.VideoTexture = function(name, src) {
    $W.texture.Texture.call(this, name);

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
        this.video.play();
        this.video.addEventListener("timeupdate", this.update, true);
    };

    this.update = function() {
        var gl = $W.GL;
        this.texture.bind();
        gl.texImage2D(gl.TEXTURE_2D, 0, this.texture.video);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
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
    $W.texture.Texture.call(this, name);
    this.image = document.createElement('img');
    this.image.texture = this;

    this.image.onload = function() {
        var gl = $W.GL;
        console.group('Loading texture `' + name + "`");
        this.texture.bind();
        gl.texImage2D(gl.TEXTURE_2D, 0, this.texture.image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null); // clean up after ourselves
        console.log('Done');
        console.groupEnd();
    }

    this.setSource = function(src) {
        this.image.src = src;
    };

    if (src !== undefined) {
        this.setSource(src);
    }
};
