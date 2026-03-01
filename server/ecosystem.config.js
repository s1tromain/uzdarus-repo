# 🚀 PM2 ECOSYSTEM CONFIG
# Сохрани в /server/ecosystem.config.js
# Команды:
# pm2 start ecosystem.config.js
# pm2 save
# pm2 startup

module.exports = {
  apps: [
    {
      name: 'uzdarus-api',
      script: './src/api.js',
      instances: 'max',
      exec_mode: 'cluster',
      
      // Environment
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      
      // Restart policies
      max_memory_restart: '500M',
      listen_timeout: 3000,
      kill_timeout: 5000,
      
      // Error & Output logs
      error_file: '/var/log/pm2/error.log',
      out_file: '/var/log/pm2/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Watch mode (автоперезагрузка при изменении)
      watch: false, // false в production!
      ignore_watch: ['node_modules', 'logs', '.env'],
    }
  ],
  
  // Auto restart after system reboot
  deploy: {
    production: {
      user: 'root',
      host: 'твой-домен.com',
      ref: 'origin/main',
      repo: 'git@github.com:твой-repo.git',
      path: '/opt/uzdarus-api',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};
