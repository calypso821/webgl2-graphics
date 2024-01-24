#version 300 es
precision mediump float;

uniform mediump sampler2D uTexture;
uniform vec3 uCameraPosition;
uniform int uNormalMap;

struct Normal {
    float factor;
    mediump sampler2D texture;
};

struct Light {
    vec3 position[15];
    vec3 color[15];
    vec3 direction [15];
    vec3 distanceFactor[15];
    vec2 blendValues[15];
    int type[15];
};

struct Material {
    float specular;
    float shininess;

    vec4 baseFactor;
    vec3 specularFactor;
    float roughnessFactor;
};

float ambient = 0.01;
uniform int uLightCount;
uniform Light uLight;
uniform Material uMaterial;
uniform Normal uNormal;

in vec3 vPosition;
in vec3 vNormal;
in vec3 vTangent;
in vec2 vTexCoord; 

out vec4 oColor;

void main() {
    oColor = vec4(0.0);
    for (int i = 0; i < uLightCount; i++) {
        vec3 surfacePosition = vPosition;

        vec3 N = normalize(vNormal);

        // Process normal map
        if (uNormalMap == 1) {
            vec3 T = normalize(vTangent);
            vec3 B = normalize(cross(N, T));
            mat3 TBN = mat3(T, B, N);
            // Normal values [0, 1] - RGB
            vec3 N_texture = texture(uNormal.texture, vTexCoord).rgb;
            // Map values to [-1, 1]
            N_texture = normalize(N_texture * 2.0 - 1.0);
            // Transforming normal from tangent space (texture) to global space 
            N = TBN * N_texture * uNormal.factor;
        }

        vec3 D = normalize(uLight.direction[i]);
        vec3 L = normalize(uLight.position[i] - surfacePosition);
        vec3 V = normalize(uCameraPosition - surfacePosition);
        vec3 R = normalize(reflect(-L, N));

        float d = distance(surfacePosition, uLight.position[i]);
        // Half angle between direction of light and direction to object
        float angle = acos(max(0.0, dot(D, -L)));

        // STEP function
        //float Af = 1.0 - step(thresholdAngle, angle);
        // SMOOTH step function (gradual transition)
        //float Af = 1.0 - smoothstep(uLight.blendValues[i][0], uLight.blendValues[i][1], angle);
        
        // Calculate distance factor of attenuation (point, spot lights)
        // If light is directional
        float Ad = 1.0;
        if (uLight.type[i] == 1 || uLight.type[i] == 2) {
            Ad = 1.0 / dot(uLight.distanceFactor[i], vec3(1, d, d * d));
        }
        
        // Calculate aligment factor of attenuation (point, spot lights)
        // If light is directional, point
        float Af = 1.0;
        if (uLight.type[i] == 2) {
            float lowT = uLight.blendValues[i][0];
            float highT = uLight.blendValues[i][1];
            Af = 1.0 - smoothstep(lowT, highT, angle);
        }

        float attenuation = Ad * Af;
        
        // shininessFactor map from roughness
        float shininessFactor = clamp(-log2(uMaterial.roughnessFactor) * 50.0, 10.0, 200.0);

        float lambert = max(0.0, dot(L, N));
        float phong = pow(max(0.0, dot(V, R)), shininessFactor);
       
        vec3 lightColor = attenuation * uLight.color[i];
        vec3 diffuseLight = lambert * lightColor * uMaterial.baseFactor.rgb;
        vec3 specularLight = phong * lightColor * uMaterial.specularFactor;
        vec3 ambientLight = ambient * lightColor;

        const float gamma = 2.2;
        vec3 albedo = pow(texture(uTexture, vTexCoord).rgb, vec3(gamma));
        vec3 finalColor = albedo * (diffuseLight + ambientLight) + specularLight;
        oColor += pow(vec4(finalColor, 1), vec4(1.0 / gamma));
    }
   
}