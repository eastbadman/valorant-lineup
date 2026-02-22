const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('✅ 连接成功');
  
  const script = `
    echo "=== 检查PM2状态 ==="
    pm2 list
    
    echo ""
    echo "=== 测试API ==="
    curl -s http://127.0.0.1:3001/api/stats
    
    echo ""
    echo ""
    echo "=== 测试前端 ==="
    curl -s http://127.0.0.1:4173 | head -10
    
    echo ""
    echo ""
    echo "=== 检查dist目录 ==="
    ls -la /var/www/valorant-lineup/valorant-lineup/dist/ 2>/dev/null || echo "dist目录不存在"
    
    echo ""
    echo "=== 检查前端日志 ==="
    pm2 logs client --lines 5 --nostream
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
