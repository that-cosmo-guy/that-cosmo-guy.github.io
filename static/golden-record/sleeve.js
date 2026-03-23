// ABOUTME: Generates pixel art record sleeve front and back covers on canvas
// ABOUTME: Front shows a golden record design, back shows the track listing and greeting

const Sleeve = {
  PIXEL_FONT: '16px "Press Start 2P", monospace',
  SMALL_FONT: '12px "Press Start 2P", monospace',
  TINY_FONT: '10px "Press Start 2P", monospace',

  // Color palette
  GOLD: '#c9a84c',
  GOLD_LIGHT: '#e8d48b',
  GOLD_DARK: '#8a6d2b',
  SPACE: '#0a0a0f',
  GROOVE: '#1a1a2e',
  DIM: '#6a6a8a',
  WHITE: '#e8e8f0',

  generateFront(canvas, tracks, greeting) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Background - deep space
    ctx.fillStyle = this.SPACE;
    ctx.fillRect(0, 0, w, h);

    // Starfield
    this.drawStarfield(ctx, w, h, 200);

    // Border
    ctx.strokeStyle = this.GOLD;
    ctx.lineWidth = 6;
    ctx.strokeRect(16, 16, w - 32, h - 32);

    // Inner border
    ctx.strokeStyle = this.GOLD_DARK;
    ctx.lineWidth = 2;
    ctx.strokeRect(28, 28, w - 56, h - 56);

    // Title
    ctx.font = '28px "Press Start 2P", monospace';
    ctx.fillStyle = this.GOLD;
    ctx.textAlign = 'center';
    ctx.fillText('YOUR', w / 2, 110);
    ctx.fillText('GOLDEN', w / 2, 150);
    ctx.fillText('RECORD', w / 2, 190);

    // Draw the record in the center
    this.drawCenterRecord(ctx, w / 2, h / 2 + 40, 320, tracks);

    // Track count
    ctx.font = this.SMALL_FONT;
    ctx.fillStyle = this.DIM;
    ctx.textAlign = 'center';
    ctx.fillText(`${tracks.length} TRACK${tracks.length === 1 ? '' : 'S'}`, w / 2, h - 130);

    // Date
    const now = new Date();
    const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
    ctx.fillText(`ASSEMBLED ${dateStr}`, w / 2, h - 100);

    // Bottom text
    ctx.font = this.SMALL_FONT;
    ctx.fillStyle = this.GOLD_DARK;
    ctx.fillText('LAUNCHED FROM EARTH', w / 2, h - 60);
  },

  generateBack(canvas, tracks, greeting) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Background
    ctx.fillStyle = this.SPACE;
    ctx.fillRect(0, 0, w, h);

    // Border
    ctx.strokeStyle = this.GOLD;
    ctx.lineWidth = 6;
    ctx.strokeRect(16, 16, w - 32, h - 32);
    ctx.strokeStyle = this.GOLD_DARK;
    ctx.lineWidth = 2;
    ctx.strokeRect(28, 28, w - 56, h - 56);

    // Title
    ctx.font = '20px "Press Start 2P", monospace';
    ctx.fillStyle = this.GOLD;
    ctx.textAlign = 'center';
    ctx.fillText('TRACK LISTING', w / 2, 80);

    // Divider
    ctx.strokeStyle = this.GOLD_DARK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 100);
    ctx.lineTo(w - 60, 100);
    ctx.stroke();

    // Track listing - two columns if > 14 tracks
    ctx.font = this.TINY_FONT;
    ctx.textAlign = 'left';

    const startY = 135;
    const lineHeight = 32;
    const col1X = 60;
    const col2X = w / 2 + 20;
    const splitAt = Math.ceil(tracks.length / 2);

    tracks.forEach((track, i) => {
      const col = i < splitAt ? 0 : 1;
      const row = col === 0 ? i : i - splitAt;
      const x = col === 0 ? col1X : col2X;
      const y = startY + (row * lineHeight);

      // Track number
      const num = String(i + 1).padStart(2, '0');
      ctx.fillStyle = this.GOLD_DARK;
      ctx.fillText(num, x, y);

      // Track name (truncate if needed)
      const maxChars = 24;
      let title = track.title;
      if (title.length > maxChars) {
        title = title.substring(0, maxChars - 2) + '..';
      }
      ctx.fillStyle = this.WHITE;
      ctx.fillText(title, x + 40, y);

      // Artist
      if (track.artist) {
        let artist = track.artist;
        if (artist.length > maxChars) {
          artist = artist.substring(0, maxChars - 2) + '..';
        }
        ctx.fillStyle = this.DIM;
        ctx.fillText(artist, x + 40, y + 14);
      }
    });

    // Greeting section
    const greetingY = startY + (splitAt * lineHeight) + 50;

    if (greeting && greeting.trim()) {
      // Divider
      ctx.strokeStyle = this.GOLD_DARK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(60, greetingY - 20);
      ctx.lineTo(w - 60, greetingY - 20);
      ctx.stroke();

      ctx.font = this.SMALL_FONT;
      ctx.fillStyle = this.GOLD;
      ctx.textAlign = 'center';
      ctx.fillText('GREETING', w / 2, greetingY + 4);

      // Word wrap the greeting
      ctx.font = this.TINY_FONT;
      ctx.fillStyle = this.WHITE;
      ctx.textAlign = 'left';
      const lines = this.wordWrap(ctx, greeting, w - 160);
      lines.forEach((line, i) => {
        if (i < 8) { // Max 8 lines
          ctx.fillText(line, 80, greetingY + 34 + (i * 22));
        }
      });
    }

    // Footer
    ctx.font = this.TINY_FONT;
    ctx.fillStyle = this.GOLD_DARK;
    ctx.textAlign = 'center';
    ctx.fillText('YOURGOLDENRECORD.COM', w / 2, h - 50);
  },

  drawStarfield(ctx, w, h, count) {
    // Seeded random for consistent stars
    let seed = 42;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 0; i < count; i++) {
      const x = rand() * w;
      const y = rand() * h;
      const size = rand() < 0.1 ? 3 : (rand() < 0.3 ? 2 : 1);
      const alpha = 0.3 + (rand() * 0.5);
      ctx.fillStyle = `rgba(232, 232, 240, ${alpha})`;
      ctx.fillRect(Math.floor(x), Math.floor(y), size, size);
    }
  },

  drawCenterRecord(ctx, cx, cy, radius, tracks) {
    // Outer disc
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = this.GROOVE;
    ctx.fill();
    ctx.strokeStyle = this.GOLD;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Grooves
    for (let i = 1; i <= 30; i++) {
      const r = radius - (i * 8);
      if (r <= 60) break;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(201, 168, 76, ${0.05 + (i * 0.01)})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Track markers on grooves - one dot per track at different angles
    tracks.forEach((track, i) => {
      const angle = (i / 27) * Math.PI * 2 - Math.PI / 2;
      const r = radius - 24 - (i * 8);
      if (r > 60) {
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = this.GOLD_LIGHT;
        ctx.fill();
      }
    });

    // Gold label center
    ctx.beginPath();
    ctx.arc(cx, cy, 60, 0, Math.PI * 2);
    ctx.fillStyle = this.GOLD;
    ctx.fill();

    // Label inner ring
    ctx.beginPath();
    ctx.arc(cx, cy, 44, 0, Math.PI * 2);
    ctx.fillStyle = this.GOLD_DARK;
    ctx.fill();

    // Spindle hole
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fillStyle = this.SPACE;
    ctx.fill();

    // Label text
    ctx.font = this.TINY_FONT;
    ctx.fillStyle = this.SPACE;
    ctx.textAlign = 'center';
    ctx.fillText('YOUR', cx, cy - 4);
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillText('GOLDEN RECORD', cx, cy + 12);
  },

  wordWrap(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let current = '';

    words.forEach(word => {
      const test = current ? current + ' ' + word : word;
      const metrics = ctx.measureText(test);
      if (metrics.width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    });
    if (current) lines.push(current);
    return lines;
  },

  downloadCanvas(canvas, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
};
