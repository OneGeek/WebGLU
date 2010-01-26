attribute vec3 vertex;
attribute vec3 normal;
 
uniform vec3 lightDirection;

uniform mat4 ProjectionMatrix;
uniform mat4 ModelViewMatrix;
uniform mat3 NormalMatrix;

varying float vNdotL;
varying vec2 vTexCoord;

float NdotL;

void main(void) {
    vTexCoord = vertex.xy;
    vNdotL =  max(dot(normalize(NormalMatrix * normal), lightDirection), 1.0);
    gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(vertex, 1.0);
}  
