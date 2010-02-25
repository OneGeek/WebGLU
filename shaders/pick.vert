attribute vec3 vertex;

uniform float pickColor;
uniform mat4 ProjectionMatrix;
uniform mat4 ModelViewMatrix;

//varying vec4 view;

void main(void) {
    gl_FrontColor = vec4(pickColor, 0.0, 0.0, 1.0);


    vec4 v = ProjectionMatrix * ModelViewMatrix * vec4(vertex, 1.0);


    gl_Position = v;
}  
