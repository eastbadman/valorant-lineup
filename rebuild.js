const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('✅ 连接成功');
  
  const script = `
    cd /var/www/valorant-lineup
    
    # 拉取最新代码
    echo "=== 拉取最新代码 ==="
    git fetch origin
    git reset --hard origin/main
    
    # 重新安装依赖
    echo "=== 安装依赖 ==="
    cd valorant-lineup/server && npm install
    cd .. && npm install
    
    # 构建
    echo "=== 构建前端 ==="
    npm run build
    
    # 重启服务
    echo "=== 重启服务 ==="
    pm2 restart all
    
    sleep 3
    echo ""
    echo "=== 测试 ==="
    curl -s http://127.0.0.1:3001/api/stats
    echo ""
    curl -s http://127.0.0.1:4173 | head -5
    
    echo ""
    echo "✅ 完成!"
  `;
  
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    
    stream.on('close', () => {
      console.log('\n连接关闭');
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
});

conn.connect({
  host: '47.118.30.248',
  port: 22,
  username: 'root',
  password: 'Zhang@3712'
});
