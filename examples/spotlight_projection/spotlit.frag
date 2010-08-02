// Spotlight
uniform vec3 l0_position;
uniform vec3 l0_color;
uniform vec3 l0_target;
uniform float l0_focus;
uniform float l0_spot_angle;
uniform float l0_beam_angle;
uniform float l0_falloff;
uniform sampler2D gobo;

// Smoke
uniform vec3 smoke_color;
uniform float smoke_density;
uniform int max_steps;
uniform float step_size;
#define PI 3.14159
#define PI180 PI / 180.0

// Surface
uniform vec3 mat_color;
uniform float obj_shininess;

// Global
uniform float global_ambient;
uniform vec3 camera_position;

// Varyings
varying vec3 surface_point;
varying vec3 surface_color;
varying vec3 surface_normal;

float raleighScatter(const vec3 point, const vec3 view_dir);
vec3 getSpotlightContrib(const vec3 point, const vec3 normal, const vec3 color);
vec3 getSmokeContrib();

void main(void) {
    vec3 final_color = global_ambient * surface_color;
    final_color += getSpotlightContrib(surface_point, surface_normal, surface_color);
    final_color += getSmokeContrib();

    gl_FragColor = vec4(final_color, 1.0);
}
        float spot_angle = l0_spot_angle * PI180; 
        float beam_angle = l0_beam_angle * PI180; 
        vec3 l0_spot_dir = normalize(l0_target - l0_position);

vec3 getSpotlightContrib(const vec3 point, const vec3 normal, const vec3 color) {
    vec3 l0_line_to_point = l0_position - point;
    vec3 l0_dir = normalize(l0_line_to_point);
    float d = length(l0_line_to_point);

    vec3 halfVector = ((normalize(point) + l0_spot_dir) * 0.5);

    float NdotL = max(dot(normal, normalize(-l0_spot_dir)), 0.0);


    vec3 l0_contrib = vec3(0.0);
    if (NdotL > 0.0) {

        float cos_cur_angle   = max(dot(-l0_dir, l0_spot_dir), 0.0);
        float cos_field_angle = cos(spot_angle);
        float cos_beam_angle  = cos(beam_angle + 
               (spot_angle - beam_angle) * l0_focus);

        float field_amount = (cos_cur_angle - cos_field_angle) / 
                             (cos_beam_angle - cos_field_angle);

        float beam_amount  = (cos_cur_angle - cos_beam_angle) / 
                             (1.0 - cos_beam_angle);

        // In Area light
        if (cos_cur_angle > cos_field_angle) {
            float NdotHV = max(dot(normal, normalize(halfVector)), 0.0);

            // within beam
            if (cos_cur_angle > cos_beam_angle) {
                l0_contrib = 0.5 + 0.5 * vec3(beam_amount);

            // within field
            }else {
                l0_contrib = 0.5 * vec3(field_amount);
            }

            l0_contrib += l0_color * color * NdotL * pow(NdotHV, obj_shininess);
            l0_contrib /= pow(d / l0_falloff,2.0);
        }

        l0_contrib *= texture2D(gobo, l0_dir.xy + vec2(0.5)).rgb;
    }

    return l0_contrib;    
}

vec3 getSmokeContrib() {
    vec3 view_line = surface_point - camera_position;
    vec3 view_dir  = normalize(view_line);
    vec3 l0_line_to_point = l0_position - surface_point;
    vec3 l0_dir = normalize(l0_line_to_point);
    float cos_scatter_angle = max(dot(l0_dir, view_dir), 0.0);
    float raleighScatter = 0.75 * (1.0 + (cos_scatter_angle * cos_scatter_angle));
    float d = length(view_line);

    // Init at camera pos
    vec3 cur_voxel = camera_position;
    vec3 average_color = smoke_color;
    float average_density = smoke_density;

    float steps = 0.0;
    // March to surface (uses int for fast less than)
    for (int STEP = 0; 
            STEP < max_steps && 
            length(cur_voxel - camera_position) < d; STEP++) {
        steps++;

        // Composite into accumulators
        average_density += smoke_density;
        
        average_color += (raleighScatter * 
        getSpotlightContrib(cur_voxel, -view_dir, vec3(1.0))
        );

        // Move to next voxel along ray
        cur_voxel += view_dir * step_size;
    }

    average_density /= steps;

    float smoke_amount = pow((1.0 - average_density), d / 10.0);

    return ((1.0 - smoke_amount) * average_color) + (1.0 - smoke_amount) * smoke_color;
}

