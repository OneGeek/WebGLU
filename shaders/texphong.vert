attribute vec3 vertex;
attribute vec3 normal;
attribute vec2 texCoord;
 
uniform mat4 ProjectionMatrix;
uniform mat4 ModelViewMatrix;
uniform mat3 NormalMatrix;

varying vec3 vVertex;
varying vec2 vTexCoord;
varying vec3 L;
varying vec3 E;
varying vec3 Nf;

void main(void) {
    L = (vec4(3.0, 2.0, 3.0, 1.0) ).xyz;
    E = (vec4(1.0, 1.0, 1.0, 1.0) ).xyz;
    vVertex = (vec4(vertex, 1.0) * ModelViewMatrix ).xyz;
    vTexCoord = texCoord;

    //E = (vec4(vertex, 1.0) * ProjectionMatrix).xyz;
    Nf = normalize(NormalMatrix * normal);

    gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(vertex, 1.0);
}  
