uniform sampler2D wglu_mat_texture0;
varying vec2 vTexCoord;

void main(void) {
    gl_FragColor = texture2D(wglu_mat_texture0, vTexCoord);
} 
