// Paint each planet once. A fixed noise grid keeps its weather consistent on reset.
(() => {
  const grid = new Float32Array(256 * 256);
  let seed = 3517;
  for (let i = 0; i < grid.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    grid[i] = seed / 4294967296;
  }
  const mix = (a, b, t) => a + (b - a) * t;
  function noise(x, y) {
    const ix = Math.floor(x), iy = Math.floor(y);
    let fx = x - ix, fy = y - iy;
    fx *= fx * (3 - 2 * fx);
    fy *= fy * (3 - 2 * fy);
    const row = (iy & 255) << 8, next = ((iy + 1) & 255) << 8;
    return mix(mix(grid[row + (ix & 255)], grid[row + ((ix + 1) & 255)], fx),
      mix(grid[next + (ix & 255)], grid[next + ((ix + 1) & 255)], fx), fy);
  }
  function clouds(x, y) {
    return noise(x, y) * .54 + noise(x * 2, y * 2) * .26 +
      noise(x * 4, y * 4) * .13 + noise(x * 8, y * 8) * .07;
  }
  const surfaces = {
    development: { tilt: -.22, colors: [[119, 48, 20], [192, 92, 39], [222, 150, 87], [249, 201, 135], [255, 230, 182]] },
    design: { tilt: .36, colors: [[31, 66, 100], [57, 111, 153], [101, 169, 191], [162, 206, 211], [211, 239, 235]] },
    launch: { tilt: -.53, colors: [[69, 54, 100], [112, 91, 151], [157, 136, 186], [205, 185, 222], [231, 219, 238]] }
  };
  function paint(canvas) {
    const kind = canvas.dataset.planet;
    const surface = surfaces[kind];
    if (!surface) return;
    const size = 360, radius = size * .46;
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const frame = ctx.createImageData(size, size);
    const c = Math.cos(surface.tilt), s = Math.sin(surface.tilt);
    for (let py = 0; py < size; py++) {
      const y = (py + .5 - size / 2) / radius;
      for (let px = 0; px < size; px++) {
        const x = (px + .5 - size / 2) / radius;
        const rr = x * x + y * y;
        if (rr >= 1) continue;
        const z = Math.sqrt(1 - rr);
        let lon = Math.atan2(x * c + y * s, z);
        let lat = Math.asin(y * c - x * s);
        let field;
        if (kind === 'development') {
          // Fold the latitude bands into an oval storm on the lit hemisphere.
          const dx = (lon + .32) / .47, dy = (lat - .21) / .135;
          const twist = 4.1 * Math.exp(-1.3 * (dx * dx + dy * dy));
          lon = -.32 + .47 * (dx * Math.cos(twist) - dy * Math.sin(twist));
          lat = .21 + .135 * (dx * Math.sin(twist) + dy * Math.cos(twist));
          const eddies = clouds(5 + lon * 3.2, 8 + lat * 8);
          const flow = lat + .12 * (eddies - .5) + .028 * Math.sin(lon * 4 + lat * 6);
          const detail = clouds(lon * 12 + eddies * 4, flow * 68);
          field = .48 + .22 * Math.sin(flow * 17 + .75 * Math.sin(flow * 9))
            + .105 * Math.sin(flow * 46 + detail * 2) + .48 * (detail - .5)
            + .09 * Math.sin(flow * 95 + eddies * 5);
        } else {
          const cloud = clouds(lon * 4 + 36, lat * 6 + 11);
          const detail = clouds(lon * 11 + cloud * 7, lat * 14 + cloud * 6);
          field = kind === 'design'
            ? .22 + .76 * cloud + .56 * (detail - .5) + .10 * Math.sin(lat * 27 + cloud * 13)
            : .23 + .67 * cloud + .45 * (detail - .5) + .15 * Math.sin(lat * 18 + cloud * 9);
        }
        const index = Math.max(0, Math.min(3.9999, field * 4));
        const band = Math.floor(index);
        const diffuse = Math.max(0, -.59 * x - .61 * y + .49 * z);
        const light = .11 + .91 * Math.pow(diffuse, .7) + .032 * z;
        const rim = Math.pow(1 - z, 4) * (.15 + .85 * diffuse);
        const offset = (py * size + px) * 4;
        for (let ch = 0; ch < 3; ch++) {
          const tone = mix(surface.colors[band][ch], surface.colors[band + 1][ch], index - band);
          frame.data[offset + ch] = tone * light + rim * surface.colors[4][ch] * .37;
        }
        frame.data[offset + 3] = Math.min(1, (1 - Math.sqrt(rr)) * radius + .5) * 255;
      }
    }
    ctx.putImageData(frame, 0, 0);
  }
  function render() { document.querySelectorAll('canvas[data-planet]').forEach(paint); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render, { once: true });
  else render();
})();
