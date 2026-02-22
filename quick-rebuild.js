const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('✅ 连接成功');
  
  const script = `
    cd /var/www/valorant-lineup
    
    echo "=== 拉取最新代码 ==="
    git fetch origin
    git reset --hard origin/main
    
    echo "=== 安装依赖 ==="
    cd valorant-lineup && npm install
    
    echo "=== 构建前端 ==="
    npm run build
    
    echo "=== 重启服务 ==="
    pm2 restart all
    
    sleep 2
    echo ""
    echo "=== 完成 ==="
    curl -s http://127.0.0.1:3001/api/stats
  `;
  
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    
    stream.on('close', () => {
      console.log('\n✅ 部署完成');
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
