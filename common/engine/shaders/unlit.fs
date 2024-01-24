#version 300 es
precision mediump float;
precision mediump sampler2D;

uniform mediump sampler2D uTexture;

struct Material {
    vec4 baseFactor;
};

uniform Material uMaterial;

in vec2 vTexCoord;

out vec4 oColor;

void main() {
    vec4 baseColor = texture(uTexture, vTexCoord);
    oColor = uMaterial.baseFactor * baseColor;
}
