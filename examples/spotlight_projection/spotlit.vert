
attribute vec3 vertex;
attribute vec3 normal;
attribute vec3 color;
attribute vec2 texCoord;

uniform mat4 ModelViewMatrix;
uniform mat4 ProjectionMatrix;
uniform mat3 NormalMatrix;


varying vec3 surface_point;
varying vec3 surface_color;
varying vec3 surface_normal;
varying vec3 halfvector;

void main(void) {
    surface_point = (ModelViewMatrix * vec4(vertex, 1.0)).xyz;
    surface_normal= normalize((ModelViewMatrix * vec4(normal,1.0)).xyz);
    surface_color = color;


    gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(vertex, 1.0);
}
