#version 300 es

layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec2 aTexCoord;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

out vec2 vTexCoord;

void main() {
    vTexCoord = aTexCoord;
    mat4 mvpMatrix = uProjectionMatrix * uViewMatrix * uModelMatrix;
    gl_Position = mvpMatrix * (vec4(aPosition, 1));
}
