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
  
  const commands = [
    // 停止所有服务
    'pm2 delete all || true',
    
    // 清理并重新克隆
    'rm -rf /var/www/valorant-lineup',
    'rm -rf /var/www/valorant-lineup.bak',
    
    // 克隆最新代码
    'cd /var/www && git clone https://github.com/eastbadman/valorant-lineup.git',
    
    // 安装依赖
    'cd /var/www/valorant-lineup/valorant-lineup/server && npm install',
    'cd /var/www/valorant-lineup/valorant-lineup && npm install',
    
    // 构建前端
    'cd /var/www/valorant-lineup/valorant-lineup && npm run build',
    
    // 启动后端
    'cd /var/www/valorant-lineup/valorant-lineup/server && pm2 start npm --name "valorant-server" -- start',
    
    // 启动前端
    'cd /var/www/valorant-lineup/valorant-lineup && pm2 start npm --name "valorant-client" -- run preview -- --port 4173 --host',
    
    // 保存并重载
    'pm2 save',
    'nginx -s reload',
    
    // 检查服务状态
    'sleep 3 && curl -s http://127.0.0.1:3001/api/stats',
    'curl -s http://127.0.0.1:4173 | head -5'
  ];
  
  let index = 0;
  
  function runNext() {
    if (index >= commands.length) {
      console.log('\n✅ 部署完成！');
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
        console.log(output.substring(0, 800));
        if (code !== 0) console.log(`⚠️ 返回码: ${code}`);
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

conn.on('error', (err) => console.error('SSH连接失败:', err.message));
conn.connect(config);
