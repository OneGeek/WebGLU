attribute vec3 vertex;
attribute vec3 color;

uniform mat4 ProjectionMatrix;
uniform mat4 ModelViewMatrix;

void main(void) {
    gl_FrontColor = vec4(color,1.0);

    gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(vertex, 1.0);
}  
