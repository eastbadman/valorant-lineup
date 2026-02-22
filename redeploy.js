const { Client } = require('ssh2');

const config = {
  host: '47.118.30.248',
  port: 22,
  username: 'root',
  password: 'Zhang@3712'
};

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ SSH连接成功！');
  
  // 先停止所有服务，然后更新代码
  const commands = [
    // 停止所有相关进程
    'pm2 delete all || true',
    
    // 备份旧代码
    'mv /var/www/valorant-lineup /var/www/valorant-lineup.bak || true',
    
    // 克隆最新代码
    'cd /var/www && git clone https://github.com/eastbadman/valorant-lineup.git',
    
    // 进入项目目录
    'cd /var/www/valorant-lineup/valorant-lineup',
    
    // 安装后端依赖
    'cd /var/www/valorant-lineup/valorant-lineup/server && npm install',
    
    // 安装前端依赖
    'cd /var/www/valorant-lineup/valorant-lineup && npm install',
    
    // 构建前端
    'cd /var/www/valorant-lineup/valorant-lineup && npm run build',
    
    // 启动后端
    'cd /var/www/valorant-lineup/valorant-lineup/server && pm2 start npm --name "valorant-server" -- start',
    
    // 启动前端预览
    'cd /var/www/valorant-lineup/valorant-lineup && pm2 start npm --name "valorant-client" -- run preview -- --port 4173 --host',
    
    // 保存pm2配置
    'pm2 save',
    
    // 重载nginx
    'nginx -s reload'
  ];
  
  let index = 0;
  
  function runNext() {
    if (index >= commands.length) {
      console.log('\n✅ 全部完成！');
      conn.end();
      return;
    }
    
    const cmd = commands[index];
    console.log(`\n[${index + 1}/${commands.length}] ${cmd}`);
    
    conn.exec(cmd, (err, stream) => {
      if (err) {
        console.error('执行失败:', err);
        index++;
        runNext();
        return;
      }
      
      let output = '';
      stream.on('close', (code) => {
        console.log(output.substring(0, 500)); // 限制输出长度
        if (code !== 0) {
          console.log(`⚠️ 返回码: ${code}`);
        }
        index++;
        runNext();
      }).on('data', (data) => {
        output += data.toString();
      }).stderr.on('data', (data) => {
        output += data.toString();
      });
    });
  }
  
  runNext();
});

conn.on('error', (err) => {
  console.error('SSH连接失败:', err.message);
});

conn.connect(config);
