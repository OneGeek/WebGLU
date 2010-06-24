// Spotlight
uniform vec3 l0_position;
uniform vec3 l0_color;
uniform vec3 l0_spot_target;
uniform float l0_focus;
uniform float l0_spot_field_angle;
uniform float l0_beam_field_angle;
uniform float l0_distance_falloff;
uniform sampler2D gobo;

// Smoke
uniform vec3 smoke_color;
uniform float smoke_density;
#define MAX_STEPS 7000
#define STEP_SIZE_RATIO 0.05

// Surface
uniform vec3 mat_color;
uniform float mat_shininess;

// Global
uniform float global_ambient;
uniform vec3 camera_position;

// Varyings
varying vec3 surface_point;
varying vec3 surface_color;
varying vec3 surface_normal;

vec3 getSpotlightContrib(const vec3 point, const vec3 normal, const vec3 color);
vec3 getSmokeContrib(const vec3 point);
float raleighScatter(const vec3 point, const vec3 view_dir);

void main(void) {
    vec3 final_color = vec3(0.0);

    final_color += global_ambient * mat_color;
    final_color += getSpotlightContrib(surface_point, surface_normal, mat_color);
    final_color += getSmokeContrib(surface_point);

    gl_FragColor = vec4(final_color, 1.0);
}

vec3 getSpotlightContrib(const vec3 point, const vec3 normal, const vec3 color) {
    vec3 l0_line_to_point = l0_position - point;
    float d = length(l0_line_to_point);
    vec3 l0_dir = normalize(l0_line_to_point);
    vec3 l0_spot_dir = normalize(l0_spot_target - l0_position);

    vec3 halfVector = ((normalize(point) + l0_spot_dir) / 2.0);

    float NdotL = max(dot(normal, normalize(-l0_spot_dir)), 0.0);


    vec3 l0_contrib = vec3(0.0);
    if (NdotL > 0.0) {

        float cos_cur_angle   = max(dot(-l0_dir, l0_spot_dir), 0.0);
        float cos_field_angle = cos(l0_spot_field_angle);
        float cos_beam_angle  = cos( l0_beam_field_angle + 
               ( l0_spot_field_angle - l0_beam_field_angle) * l0_focus);

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

            l0_contrib += l0_color * color * NdotL * pow(NdotHV, mat_shininess);
            l0_contrib /= pow(d / l0_distance_falloff,2.0);
        }

        l0_contrib *= texture2D(gobo, l0_dir.xy + vec2(0.5)).rgb;
    }

    return l0_contrib;    
}

vec3 getSmokeContrib(const vec3 point) {
    vec3 view_line = point - camera_position;
    vec3 view_dir  = normalize(view_line);
    float d = length(view_line);

    // Init at camera pos
    vec3 cur_voxel = camera_position;
    //vec3 average_color = getSpotlightContrib(point, surface_normal, mat_color);
    //vec3 average_color = smoke_color;
    vec3  average_color = vec3(0.0);
    float average_density = smoke_density;

    float steps = 0.0;
    // March to surface (uses int for fast less than)
    for (int STEP = 0; STEP < MAX_STEPS; STEP++) {
        steps++;
        // Stop marching at the surface
        if (length(cur_voxel - camera_position) > d) break;

        // Composite into accumulators
        average_density = average_density + smoke_density;
        
        average_color = (average_color + 

        raleighScatter(point, view_dir) * 
        getSpotlightContrib(cur_voxel, -view_dir, vec3(1.0))

        );



        // Move to next voxel along ray
        cur_voxel += view_dir * STEP_SIZE_RATIO;
    }

    average_density /= steps;

    float smoke_amount = pow((1.0 - average_density), d / 10.0);

    return ((1.0 - smoke_amount) * average_color) + (1.0 - smoke_amount) * smoke_color;
}

float raleighScatter(const vec3 point, const vec3 view_dir) {
    vec3 l0_line_to_point = l0_position - point;
    vec3 l0_dir = normalize(l0_line_to_point);

    float cos_scatter_angle = max(dot(l0_dir, view_dir), 0.0);

    return 0.75 * (1.0 + (cos_scatter_angle * cos_scatter_angle));
}
