attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;

varying vec2 texCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

//varying vec4 vColor;
void main()
{
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
    texCoord = aTextureCoord;
}
