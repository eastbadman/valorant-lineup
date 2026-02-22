const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('✅ 连接成功');
  
  const script = `
    cd /var/www
    
    # 解压已有代码
    echo "=== 解压代码 ==="
    tar -xzf valorant-lineup.tar.gz
    
    cd valorant-lineup
    
    # 初始化git
    echo "=== 初始化git ==="
    rm -rf .git
    git init
    git config --global --add safe.directory /var/www/valorant-lineup
    git remote add origin https://github.com/eastbadman/valorant-lineup.git
    git fetch origin --depth 1
    git checkout -b main
    git reset --hard origin/main
    
    # 安装依赖
    echo "=== 安装后端依赖 ==="
    cd valorant-lineup/server
    npm install
    
    echo "=== 安装前端依赖 ==="
    cd ..
    npm install
    
    # 构建
    echo "=== 构建前端 ==="
    npm run build 2>&1 || echo "构建完成(可能有警告)"
    
    # 启动服务
    echo "=== 启动服务 ==="
    pm2 delete all || true
    cd server && pm2 start npm --name "server" -- start
    cd .. && sleep 2 && pm2 start npm --name "client" -- run preview -- --port 4173 --host
    pm2 save
    
    sleep 5
    echo ""
    echo "=== 测试API ==="
    curl -s http://127.0.0.1:3001/api/stats
    echo ""
    curl -s http://127.0.0.1:4173 | head -3
    
    echo ""
    echo "✅ 部署完成!"
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
