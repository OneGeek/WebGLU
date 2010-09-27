attribute vec3 vertex;
attribute vec3 color;

uniform mat4 ProjectionMatrix;
uniform mat4 ModelViewMatrix;

varying vec4 frontColor;

void main(void) {
    frontColor = vec4(color,1.0);

    gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(vertex, 1.0);
}  
