attribute vec2 a_Position; //vec2 because of 2D view;
attribute vec3 a_Color;
varying vec3 v_Color;
uniform mat4 u_vMatrix;
uniform mat4 u_pMatrix;
uniform mat4 u_mMatrix;

void main () {
    gl_Position = u_pMatrix * u_vMatrix * u_mMatrix * vec4(a_Position, 0.0, 1.0);
    v_Color = a_Color;
}
