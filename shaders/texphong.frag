
uniform sampler2D sampler;

varying vec3 vVertex;
varying vec2 vTexCoord;
varying vec3 L;
varying vec3 E;
varying vec3 Nf;


void main(void) {
    vec4 c = vec4(texture2D(sampler, vTexCoord));
    

    vec3 V = normalize(-E);
    vec3 Ln = normalize(vVertex - L);
    vec3 Ri = reflect(Nf, Ln);
    float d = distance(vVertex, L);

    float RdotV = max(dot(Ri, V), 0.0); 
    float NdotL = max(dot(Nf, Ln), 0.0);

    vec4 Lamb = vec4(0.3, 0.3, 0.3, 1.0);
    vec4 Ldiff = vec4(0.1, 0.1, 0.1, 1.0) * NdotL;
    vec4 Lspec = vec4(1.0, 0.69, 0.0, 1.0) * pow(RdotV, 30.0);

    vec4 Ltotal = (Ldiff) ;


    gl_FragColor = c ;
    

} 
