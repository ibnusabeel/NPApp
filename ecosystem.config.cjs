module.exports = {
  apps: [
    {
      name: "npapp",
      script: "server.js",
      cwd: "/www/wwwroot/npapp",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "384M",
      env: {
        NODE_ENV: "production",
        PORT: 3002,
        NODE_OPTIONS: "--max-old-space-size=200",
      },
    },
  ],
};
