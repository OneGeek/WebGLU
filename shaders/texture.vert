attribute vec3 vertex;
attribute vec3 color;
attribute vec2 texCoord;

uniform mat4 ProjectionMatrix;
uniform mat4 ModelViewMatrix;

varying vec2 vTexCoord;

void main(void) {
    vTexCoord = texCoord;

    gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(vertex, 1.0);
}  
