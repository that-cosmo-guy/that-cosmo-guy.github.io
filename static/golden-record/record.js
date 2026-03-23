// ABOUTME: Draws the spinning pixel art record on the intro screen
// ABOUTME: Uses Canvas API with low-res rendering and pixelated upscaling

const Record = {
  canvas: null,
  ctx: null,
  angle: 0,
  animationId: null,

  init() {
    this.canvas = document.getElementById('spinning-record');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.spin();
  },

  drawRecord(angle) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = 50;

    ctx.clearRect(0, 0, w, h);

    // Outer disc
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a2e';
    ctx.fill();
    ctx.strokeStyle = '#c9a84c';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Grooves - concentric circles with slight gold tint
    for (let i = 1; i <= 8; i++) {
      const gr = r - (i * 5);
      if (gr <= 8) break;
      ctx.beginPath();
      ctx.arc(cx, cy, gr, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(201, 168, 76, ${0.1 + (i * 0.03)})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Label area (gold center)
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#c9a84c';
    ctx.fill();

    // Inner label detail
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#8a6d2b';
    ctx.fill();

    // Spindle hole
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a0f';
    ctx.fill();

    // Light reflection line that rotates
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(r - 4, 0);
    ctx.strokeStyle = 'rgba(232, 212, 139, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  },

  spin() {
    this.drawRecord(this.angle);
    this.angle += 0.02;
    this.animationId = requestAnimationFrame(() => this.spin());
  },

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
};
