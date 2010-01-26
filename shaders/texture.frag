uniform sampler2D sampler;
varying vec2 vTexCoord;

void main(void) {
    gl_FragColor = texture2D(sampler, vTexCoord);
} 
