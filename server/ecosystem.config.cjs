module.exports = {
  apps: [
    {
      name: 'typing-api',
      script: './dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      node_args: '--max-old-space-size=150',
      max_memory_restart: '180M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
};
