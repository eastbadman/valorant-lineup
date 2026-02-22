const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('✅ 连接成功');
  
  // 直接用curl下载最新代码
  const script = `
    echo "=== 检查当前版本 ==="
    cd /var/www/valorant-lineup && git log --oneline -1
    
    echo ""
    echo "=== 强制更新 ==="
    cd /var/www/valorant-lineup && git fetch origin --depth 1 && git reset --hard origin/main
    
    echo ""
    echo "=== 验证版本 ==="
    git log --oneline -1
    
    echo ""
    echo "=== 重新构建 ==="
    cd valorant-lineup && npm run build
    
    echo ""
    echo "=== 重启服务 ==="
    pm2 restart all
  `;
  
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    
    stream.on('close', () => {
      console.log('\n✅ 完成');
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
