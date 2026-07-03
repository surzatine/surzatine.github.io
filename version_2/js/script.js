(function () {
  "use strict";

  /* ---------- WebGL shader background ---------- */
  function initShader(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    function syncSize() {
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }
    if (typeof ResizeObserver !== "undefined") {
      new ResizeObserver(syncSize).observe(canvas);
    }
    syncSize();

    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return;

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;
    const fs = `precision highp float;
varying vec2 v_texCoord;
uniform float u_time;
uniform vec2 u_resolution;

void main() {
    vec2 uv = v_texCoord;
    vec3 color1 = vec3(0.06, 0.07, 0.10);
    vec3 color2 = vec3(0.0, 0.94, 1.0);
    vec3 color3 = vec3(0.5, 0.0, 1.0);

    float noise = sin(uv.x * 10.0 + u_time) * cos(uv.y * 10.0 + u_time) * 0.5 + 0.5;
    vec3 color = mix(color1, color2, noise * 0.2);
    color = mix(color, color3, sin(u_time * 0.5) * 0.1);

    float grid = abs(sin(uv.x * 50.0)) * abs(sin(uv.y * 50.0));
    grid = pow(grid, 0.1);
    color += vec3(grid) * 0.05;

    gl_FragColor = vec4(color, 1.0);
}`;
    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes = gl.getUniformLocation(prog, "u_resolution");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");

    let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
    window.addEventListener("mousemove", (event) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = 1.0 - (event.clientY - rect.top) / rect.height;
        mouse.x = nx * canvas.width;
        mouse.y = ny * canvas.height;
      }
    });

    function render(t) {
      if (typeof ResizeObserver === "undefined") syncSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(render);
    }
    render(0);
  }
  initShader("shader-canvas");

  /* ---------- Mobile nav toggle ---------- */
  const toggle = document.getElementById("mobile-nav-toggle");
  const mobileNav = document.getElementById("mobile-nav");
  if (toggle && mobileNav) {
    toggle.addEventListener("click", () => {
      const isOpen = mobileNav.classList.toggle("flex");
      mobileNav.classList.toggle("hidden", !isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  /* ---------- Glitch text scramble on hover ---------- */
  document.querySelectorAll(".glitch-text").forEach((text) => {
    text.addEventListener("mouseover", () => {
      const originalText = text.innerText;
      const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
      let iterations = 0;
      const interval = setInterval(() => {
        text.innerText = originalText
          .split("")
          .map((char, index) => {
            if (index < iterations) return originalText[index];
            return characters[Math.floor(Math.random() * characters.length)];
          })
          .join("");
        if (iterations >= originalText.length) clearInterval(interval);
        iterations += 1 / 3;
      }, 30);
    });
  });

  /* ---------- Corner brackets on image frames ---------- */
  document.querySelectorAll(".scanline-effect").forEach((frame) => {
    const createBracket = (pos) => {
      const b = document.createElement("div");
      b.className = `fui-bracket absolute border-2 ${pos}`;
      if (pos.includes("top")) b.style.borderBottom = "none";
      if (pos.includes("bottom")) b.style.borderTop = "none";
      if (pos.includes("left")) b.style.borderRight = "none";
      if (pos.includes("right")) b.style.borderLeft = "none";
      frame.appendChild(b);
    };
    createBracket("top-0 left-0");
    createBracket("top-0 right-0");
    createBracket("bottom-0 left-0");
    createBracket("bottom-0 right-0");
  });

  /* ---------- Fade-in on scroll ---------- */
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0");
            entry.target.classList.remove("opacity-0", "translate-y-10");
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".cyber-border").forEach((el) => {
      el.classList.add("transition-all", "duration-1000", "opacity-0", "translate-y-10", "reveal-init");
      observer.observe(el);
    });
  }

  /* ---------- Live telemetry readout (hero stats) ---------- */
  const bitrateEl = document.getElementById("bitrate");
  const latencyEl = document.getElementById("latency");
  if (bitrateEl && latencyEl) {
    setInterval(() => {
      bitrateEl.textContent = (44 + Math.random() * 3).toFixed(1);
      latencyEl.textContent = Math.round(9 + Math.random() * 8);
    }, 2200);
  }

  /* ---------- Skill bar fill (Intel page) ---------- */
  const skillFills = document.querySelectorAll(".skill-fill");
  if (skillFills.length) {
    if ("IntersectionObserver" in window) {
      const skillIO = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.style.width = entry.target.dataset.value + "%";
              skillIO.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.4 }
      );
      skillFills.forEach((el) => skillIO.observe(el));
    } else {
      skillFills.forEach((el) => (el.style.width = el.dataset.value + "%"));
    }
  }

  /* ---------- Contact form (Connect page) ---------- */
  const form = document.getElementById("contact-form");
  const formStatus = document.getElementById("form-status");
  if (form && formStatus) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validators = {
      name: (v) => v.trim().length > 0,
      email: (v) => emailPattern.test(v.trim()),
      message: (v) => v.trim().length > 0,
    };

    function setFieldError(fieldEl, hasError) {
      fieldEl.classList.toggle("error", hasError);
    }

    Object.keys(validators).forEach((name) => {
      const input = form.elements[name];
      const fieldEl = form.querySelector(`[data-field="${name}"]`);
      if (!input || !fieldEl) return;
      input.addEventListener("input", () => {
        if (validators[name](input.value)) setFieldError(fieldEl, false);
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let valid = true;
      Object.keys(validators).forEach((name) => {
        const input = form.elements[name];
        const fieldEl = form.querySelector(`[data-field="${name}"]`);
        if (!input || !fieldEl) return;
        const ok = validators[name](input.value);
        setFieldError(fieldEl, !ok);
        if (!ok) valid = false;
      });

      if (!valid) {
        formStatus.textContent = "// TRANSMISSION_BLOCKED: check fields";
        formStatus.classList.remove("text-primary");
        formStatus.classList.add("text-error");
        return;
      }

      formStatus.textContent = "// TRANSMITTING...";
      formStatus.classList.remove("text-error");

      setTimeout(() => {
        formStatus.textContent = "// TRANSMISSION_RECEIVED. I'll reply within 24h.";
        formStatus.classList.add("text-primary");
        form.reset();
      }, 900);
    });
  }
})();