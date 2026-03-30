const port = parseInt(process.env['SOLUTIONS_PORT'] || '4250', 10);
module.exports = {
  '/solutions-*d.mugbin': {
    target: `http://localhost:${port}`,
    secure: false,
  },
};
