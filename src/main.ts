import PointVertexShader from "./shaders/point.vert";
import PointFragmentShader from "./shaders/point.frag";
import { mat4 } from "gl-matrix";


class Clock {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  program: WebGLProgram | null = null;
  ctx2d: CanvasRenderingContext2D

  constructor(canvas: HTMLCanvasElement, textCanvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl = canvas.getContext("webgl");
    if (!gl) throw new Error("Cannot get canvas context");
    this.gl = gl;
    const ctx = textCanvas.getContext('2d');
    if(!ctx) throw new Error("Cannot get canvas context");
    this.ctx2d = ctx;
  }

  private createShader(
    type: typeof this.gl.FRAGMENT_SHADER | typeof this.gl.VERTEX_SHADER,
    src: string
  ): WebGLShader {
    const { gl } = this;

    const shader = gl.createShader(type);
    if (!shader) throw new Error("Error while create shader instance!");
    gl.shaderSource(shader, src);
    gl.compileShader(shader);

    const SHADER_COMPILE_STATUS = gl.getShaderParameter(
      shader,
      gl.COMPILE_STATUS
    );
    if (SHADER_COMPILE_STATUS === null)
      throw new Error(
        "Error while compiling shader!" + `Shader source: ${src}`
      );

    return shader;
  }

  private createProgram(
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader
  ): WebGLProgram {
    const { gl } = this;

    const vertexShaderStatus = gl.getShaderParameter(
      vertexShader,
      gl.COMPILE_STATUS
    );
    const fragmentShaderStatus = gl.getShaderParameter(
      fragmentShader,
      gl.COMPILE_STATUS
    );

    if (vertexShaderStatus === null || fragmentShaderStatus === null) {
      throw new Error(
        "Cannot create programm because of shader compile status is null: " +
          `vertexShader: ${vertexShaderStatus}, fragmentShader: ${fragmentShaderStatus}`
      );
    }

    const program = gl.createProgram();
    if (!program) throw new Error("Error while creating program!");

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    return program;
  }

  public setup() {
    const { gl } = this;
    const vs = this.createShader(gl.VERTEX_SHADER, PointVertexShader);
    const fs = this.createShader(gl.FRAGMENT_SHADER, PointFragmentShader);
    const program = this.createProgram(vs, fs);

    gl.linkProgram(program);
    gl.useProgram(program);

    this.program = program;
  }

  private createRectangle(): {
    VERTEX_BUFFER: WebGLBuffer | null;
    FACES_BUFFER: WebGLBuffer | null;
    COLOR_BUFFER: WebGLBuffer | null;
  } {
    const { gl } = this;
    const FACES_BUFFER = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, FACES_BUFFER);

    const VERTEX_BUFFER = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, VERTEX_BUFFER);

    /**
     * 0                           1
     * _________________________
     * |........................|
     * |........................|
     * |........................|
     * |........................|
     * |........................|
     * |........................|
     * |........................|
     * _________________________
     * 2                           3
     */

    const vertexes = new Float32Array([
      -1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, vertexes, gl.STATIC_DRAW);
    //triangles vertex (3 points per triangle =_=)
    const vertexFaces = new Uint16Array([0, 1, 2, 1, 2, 3]);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, FACES_BUFFER);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, vertexFaces, gl.STATIC_DRAW);

    const COLOR_BUFFER = gl.createBuffer();
    const colors = new Float32Array([
      0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
    ]);
    gl.bindBuffer(gl.ARRAY_BUFFER, COLOR_BUFFER);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

    return {
      FACES_BUFFER,
      VERTEX_BUFFER,
      COLOR_BUFFER,
    };
  }

  private clearCanvas(): void {
    const { gl } = this;

    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  public render(time: number) {
    console.log(time);
    const { gl } = this;
    if (!this.program) throw new Error("Cannot get programm.");
    const { program } = this;

    /* Attrbute pointers */
    const a_Position = gl.getAttribLocation(program, "a_Position");
    const a_Color = gl.getAttribLocation(program, "a_Color");

    const u_vMatrix = gl.getUniformLocation(program, "u_vMatrix");
    const u_pMatrix = gl.getUniformLocation(program, "u_pMatrix");
    const u_mMatrix = gl.getUniformLocation(program, "u_mMatrix");

    gl.enableVertexAttribArray(a_Position);
    gl.enableVertexAttribArray(a_Color);
    /*_________________ */

    /* Matrixes */
    const projectionMatrix = mat4.create();

    mat4.perspective(
      projectionMatrix,
      40,
      this.canvas.width / this.canvas.height,
      0,
      100
    );
    const viewMatrix = mat4.create();
    const modelMatrix = mat4.create();
    const { FACES_BUFFER, VERTEX_BUFFER, COLOR_BUFFER } =
      this.createRectangle();

    gl.bindBuffer(gl.ARRAY_BUFFER, VERTEX_BUFFER);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, COLOR_BUFFER);
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, 0, 0);

    mat4.identity(viewMatrix);
    mat4.identity(modelMatrix);

    mat4.translate(viewMatrix, viewMatrix, [0.0, 0.0, -1.0]);
    // mat4.translate(modelMatrix, modelMatrix, [0.0, 0.0, 0.0])

    const drawClockFace = () => {
      for (let i = 0; i < 12; i++) {
        mat4.identity(modelMatrix);
        mat4.rotateZ(modelMatrix, modelMatrix, (Math.PI / 180) * 30 * i);

        if (i % 3 === 0) {
          mat4.translate(modelMatrix, modelMatrix, [1.5, 0.0, 0.0]);
          mat4.scale(modelMatrix, modelMatrix, [0.3, 0.05, 1.0]);
        } else {
          mat4.translate(modelMatrix, modelMatrix, [1.4, 0.0, 0.0]);
          mat4.scale(modelMatrix, modelMatrix, [0.2, 0.03, 1.0]);
        }


        gl.uniformMatrix4fv(u_vMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(u_pMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(u_mMatrix, false, modelMatrix);

        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
      }
    }

    function drawArrows() {

      function drawSingleArrow(type: 'hour' | 'minute' | 'second', angle: number) {
        type ArrowProps = {
          width: number,
          length: number
        }
        const arrows: Record<typeof type, ArrowProps> = {
          hour: {
            length: 0.4,
            width: 0.02
          },
          minute: {
            length: 0.6, 
            width: 0.02
          },
          second: {
            length: 0.7,
            width: 0.01
          }
        }

        mat4.identity(modelMatrix);
        mat4.rotateZ(modelMatrix, modelMatrix, (Math.PI / 180) * ( 90 - angle));
        mat4.scale(modelMatrix, modelMatrix, [arrows[type].length, arrows[type].width, 0.0]);
        mat4.translate(modelMatrix, modelMatrix, [1, 0.0, 0.0]);
        gl.uniformMatrix4fv(u_vMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(u_pMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(u_mMatrix, false, modelMatrix);
  
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
      }
      
      const date = new Date();
      let hours = date.getHours();
      if(hours > 12) hours -= 12;
      const ANGLE_STEP = 360 / 12
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      const milliseconds = date.getMilliseconds()
      const secondsAngle = (( 360 / 60 ) * seconds) + (milliseconds  * 0.006)
      const minutesAngle = (360 / 60) * minutes + (seconds * 0.1)
      const hoursArrowAngle = ( hours * ANGLE_STEP ) + (minutes * (ANGLE_STEP / 60));

      drawSingleArrow('hour', hoursArrowAngle);
      drawSingleArrow('minute', minutesAngle);
      drawSingleArrow('second', secondsAngle);
    }

    const animate = () => {
      this.clearCanvas();
      drawClockFace();
      drawArrows();
      window.requestAnimationFrame(animate.bind(this));
    };
    animate();

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, FACES_BUFFER);

    gl.flush();
  }

  public play(time = 0) {
    this.render(time);
  }
}
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const textCanvas = document.getElementById("canvas_text") as HTMLCanvasElement;
textCanvas.width = window.innerWidth;
textCanvas.height = window.innerHeight;
const clock = new Clock(canvas, textCanvas);
clock.setup();
clock.play();
console.log(clock);
