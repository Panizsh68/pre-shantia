const http = require('http');

const req = http.request('http://localhost:3000/health/live', res => {
  process.exit(res.statusCode === 200 ? 0 : 1);
});

req.on('error', () => process.exit(1));
req.end();
