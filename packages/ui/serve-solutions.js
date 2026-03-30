const { createServer } = require('node:http');
const { createReadStream, statSync, existsSync } = require('node:fs');
const { join } = require('node:path');

const { resolve } = require('node:path');
const solutionsDir = process.env['SOLUTIONS_DIR'] || resolve(__dirname, '../../solutions');
const port = parseInt(process.env['SOLUTIONS_PORT'] || '4250', 10);

const server = createServer((req, res) => {
  console.log(`${req.method} ${req.url} Range:${req.headers['range'] ?? 'none'}`);
  const { pathname } = new URL(req.url, 'http://localhost');

  if (pathname === '/health') {
    res.writeHead(200);
    res.end('ok');
    return;
  }

  // Match /solutions-Nd.mugbin pattern.
  const match = pathname.match(/^\/solutions-\d+d\.mugbin$/);
  if (!match) {
    res.writeHead(404);
    res.end();
    return;
  }

  const filename = pathname.slice(1); // Remove leading /
  const filePath = join(solutionsDir, filename);

  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end();
    return;
  }

  const { size } = statSync(filePath);
  const rangeHeader = req.headers['range'];

  if (rangeHeader) {
    const [, startStr, endStr] = rangeHeader.match(/bytes=(\d+)-(\d*)/) ?? [];
    const start = parseInt(startStr, 10);
    const end = endStr ? parseInt(endStr, 10) : size - 1;
    res.writeHead(206, {
      'Content-Type': 'application/octet-stream',
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
    });
    createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Accept-Ranges': 'bytes',
      'Content-Length': size,
    });
    createReadStream(filePath).pipe(res);
  }
});

server.listen(port, () => {
  console.log(`Solutions server listening on http://localhost:${port} (serving from ${solutionsDir})`);
});
