$W.initFramebuffer = function() {

    $W.framebuffers = {};

    $W.Framebuffer = function(name) {
        $W.info("Creating framebuffer");
        var GL = $W.GL;
        var RBUF = GL.RENDERBUFFER;
        var FBUF = GL.FRAMEBUFFER;

        this.name = name;
        $W.framebuffers[name] = this;
        this.glFramebuffer = GL.createFramebuffer();
        this.glRenderbuffers = [];
        this.textures = [];

        this.isGood = function FBUF_isGood() {
            try {
                if (!GL.isFramebuffer(this.glFramebuffer)) {
                    throw("Invalid framebuffer");
                }
                var status = GL.checkFramebufferStatus(this.glFramebuffer);
                switch (status) {
                    case GL.FRAMEBUFFER_COMPLETE:
                        break;
                    default:
                        throw("Incomplete framebuffer: " + status);
                }
            }catch (e) {
                console.error(e);
                return false;
            }
            return true;
        };

        this.bind = function FBUF_bind(){
            GL.bindFramebuffer(FBUF, this.glFramebuffer);
        };

        this.unbind = function FBUF_unbind(){
            GL.bindFramebuffer(FBUF, null);
        };

        this.attachRenderbuffer = function FBUF_attachRenderbuffer(storageFormat, width, height, attachment) {
            var rBuffer = GL.createRenderbuffer();
            this.glRenderbuffers.push(rBuffer);

            this.bind();
            GL.bindRenderbuffer(RBUF, rBuffer);
            GL.renderbufferStorage(RBUF, storageFormat, width, height);
            GL.framebufferRenderbuffer(FBUF, attachment, RBUF, rBuffer);
            GL.bindRenderbuffer(RBUF, null);
            this.unbind();
        };

        this.attachExistingTexture = function FBUF_attachExistingTexture(texture, attachment) {
            this.textures.push(texture);
            texture.bind();
            GL.framebufferTexture2D(GL.FRAMEBUFFER, attachment, GL.TEXTURE_2D, texture.glTexture, 0);
            texture.unbind();
        }

        this.attachNewTexture = function FBUF_attachNewTexture(format, width, height, attachment) {
            var texture = new $W.Texture(this.name + 'Texture' + this.textures.length);

            texture.bind();
            try{
                GL.texImage2D(GL.TEXTURE_2D, 0, format, width, height,
                        0, format, $W.GL.UNSIGNED_BYTE, null);
            } catch (e) {
                console.warn('Using empty texture fallback');
                var storage = new WebGLUnsignedByteArray(4 * width * height);
                GL.texImage2D(GL.TEXTURE_2D, 0, format, width, height,
                        0, format, $W.GL.UNSIGNED_BYTE, storage);
            }
            texture.unbind();

            this.attachExistingTexture(texture, attachment);
        }

        this.attachTexture = function FBUF_attachTexture() {
            this.bind();
            if (arguments.length === 4) {   
                this.attachNewTexture.apply(this, arguments);
            }else {
                this.attachExistingTexture.apply(this, arguments);
            }
            this.unbind();
        }
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
