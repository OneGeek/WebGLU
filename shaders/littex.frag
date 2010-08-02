#ifdef GL_ES
precision highp float;
#endif
uniform sampler2D sampler;
varying vec2 vTexCoord;
varying float vNdotL;

void main(void) {
    gl_FragColor = normalize(texture2D(sampler, vTexCoord)) * vNdotL;
} 
