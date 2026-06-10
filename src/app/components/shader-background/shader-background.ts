import { Component, ElementRef, Input, ViewChild, AfterViewInit, OnDestroy, OnChanges, SimpleChanges, NgZone } from '@angular/core';
import { BackgroundMode } from '../../services/theme.service';

const VERTEX_SHADER = `
attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const COMMON_FS_HEADER = `
precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
varying vec2 v_texCoord;

float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}
`;

const SHADER_COFFEE = COMMON_FS_HEADER + `
void main() {
    vec2 uv = v_texCoord;
    vec2 mouse = u_mouse / u_resolution;
    
    // Parallax shift
    uv += (mouse - 0.5) * 0.02;

    // Base deep navy colors
    vec3 color1 = vec3(0.043, 0.063, 0.125); // #0B1020
    vec3 color2 = vec3(0.078, 0.106, 0.204); // #141B34
    vec3 accentPurple = vec3(0.424, 0.388, 1.0); // #6C63FF
    vec3 accentWarm = vec3(1.0, 0.78, 0.42); // #FFC76B

    // Animated background gradients
    float noise = hash(uv + u_time * 0.01);
    float t = u_time * 0.2;
    
    vec2 p1 = vec2(0.5 + 0.5 * sin(t), 0.5 + 0.5 * cos(t * 0.8));
    vec2 p2 = vec2(0.5 + 0.5 * cos(t * 0.7), 0.5 + 0.5 * sin(t * 1.1));
    
    float d1 = length(uv - p1);
    float d2 = length(uv - p2);
    
    vec3 finalColor = mix(color1, color2, uv.y);
    finalColor += accentPurple * (0.15 / (d1 + 0.5));
    finalColor += accentWarm * (0.05 / (d2 + 0.8));
    
    // Subtle grain
    finalColor += (noise - 0.5) * 0.02;

    gl_FragColor = vec4(finalColor, 1.0);
}`;

const SHADER_RAIN = COMMON_FS_HEADER + `
void main() {
    vec2 uv = v_texCoord;
    vec2 mouse = u_mouse / u_resolution;
    uv += (mouse - 0.5) * 0.01;

    vec3 color1 = vec3(0.03, 0.04, 0.08); // Deeper navy
    vec3 color2 = vec3(0.05, 0.07, 0.15);
    
    vec3 finalColor = mix(color1, color2, uv.y);

    // Fine rain drops - smaller and denser
    vec2 rainUv = uv * vec2(400.0, 1.5);
    float rainTime = u_time * 3.5;
    float r = hash(vec2(floor(rainUv.x), 0.0));
    float phase = rainUv.y + rainTime + r * 10.0;
    float drop = step(0.90, fract(phase)) * step(0.7, hash(vec2(floor(rainUv.x), floor(phase))));
    
    finalColor += drop * 0.12 * vec3(0.7, 0.8, 1.0);
    
    // Subtle grain
    finalColor += (hash(uv + u_time) - 0.5) * 0.015;

    gl_FragColor = vec4(finalColor, 1.0);
}`;

const SHADER_SPACE = COMMON_FS_HEADER + `
void main() {
    vec2 uv = v_texCoord;
    vec2 mouse = u_mouse / u_resolution;
    uv += (mouse - 0.5) * 0.02;

    vec3 spaceColor = vec3(0.01, 0.01, 0.03); // Deeper space
    
    // Fine star field
    float stars = 0.0;
    vec2 starUv = uv * 300.0;
    vec2 ipos = floor(starUv);
    if (hash(ipos) > 0.99) {
        float blink = 0.4 + 0.6 * sin(u_time * 1.5 + hash(ipos) * 10.0);
        stars = blink;
    }
    
    vec3 finalColor = spaceColor + stars * 0.35;
    
    // Subtle nebula glow
    float nebula = 0.08 / length(uv - vec2(0.5 + sin(u_time*0.08)*0.15, 0.5));
    finalColor += nebula * vec3(0.15, 0.1, 0.35) * 0.4;

    gl_FragColor = vec4(finalColor, 1.0);
}`;

@Component({
  selector: 'app-shader-background',
  standalone: true,
  templateUrl: './shader-background.html',
  styleUrls: ['./shader-background.css']
})
export class ShaderBackgroundComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('glcanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() mode: BackgroundMode = 'coffee';

  private gl!: WebGLRenderingContext | null;
  private program!: WebGLProgram | null;
  private animationFrameId: number = 0;
  private resizeObserver!: ResizeObserver;
  private mouse = { x: 0, y: 0 };

  private uTimeLoc: WebGLUniformLocation | null = null;
  private uResLoc: WebGLUniformLocation | null = null;
  private uMouseLoc: WebGLUniformLocation | null = null;

  constructor(private ngZone: NgZone) { }

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext;

    if (!this.gl) {
      console.warn('WebGL not supported');
      return;
    }

    this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    window.addEventListener('mousemove', this.onMouseMove);

    this.resizeObserver = new ResizeObserver(() => this.syncSize());
    this.resizeObserver.observe(canvas);
    this.syncSize();

    this.compileAndUseShader(this.getFragmentShader(this.mode));

    this.ngZone.runOutsideAngular(() => {
      this.renderLoop(0);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['mode'] && !changes['mode'].firstChange && this.gl) {
      this.compileAndUseShader(this.getFragmentShader(this.mode));
    }
  }

  ngOnDestroy() {
    window.removeEventListener('mousemove', this.onMouseMove);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private onMouseMove = (event: MouseEvent) => {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    if (rect.width && rect.height) {
      const nx = (event.clientX - rect.left) / rect.width;
      const ny = 1.0 - (event.clientY - rect.top) / rect.height;
      this.mouse.x = nx * canvas.width;
      this.mouse.y = ny * canvas.height;
    }
  };

  private syncSize() {
    const canvas = this.canvasRef.nativeElement;
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      if (this.gl) {
        this.gl.viewport(0, 0, w, h);
      }
    }
  }

  private getFragmentShader(mode: BackgroundMode): string {
    switch (mode) {
      case 'rain': return SHADER_RAIN;
      case 'space': return SHADER_SPACE;
      case 'coffee':
      default: return SHADER_COFFEE;
    }
  }

  private compileAndUseShader(fsSource: string) {
    if (!this.gl) return;
    const gl = this.gl;

    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, VERTEX_SHADER);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, fsSource);
    gl.compileShader(fs);

    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.error('Fragment shader compilation error', gl.getShaderInfoLog(fs));
      return;
    }

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);
    this.program = prog;

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    this.uTimeLoc = gl.getUniformLocation(prog, 'u_time');
    this.uResLoc = gl.getUniformLocation(prog, 'u_resolution');
    this.uMouseLoc = gl.getUniformLocation(prog, 'u_mouse');
  }

  private renderLoop = (time: number) => {
    if (!this.gl || !this.program || !this.canvasRef) return;
    const gl = this.gl;
    const canvas = this.canvasRef.nativeElement;

    if (this.uTimeLoc) gl.uniform1f(this.uTimeLoc, time * 0.001);
    if (this.uResLoc) gl.uniform2f(this.uResLoc, canvas.width, canvas.height);
    if (this.uMouseLoc) gl.uniform2f(this.uMouseLoc, this.mouse.x, this.mouse.y);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    this.animationFrameId = requestAnimationFrame(this.renderLoop);
  };
}
