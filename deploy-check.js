const { Client } = require('ssh2');

const conn = new Client();

const config = {
  host: '47.118.30.248',
  port: 22,
  username: 'root',
  password: 'Zhang@3712'
};

conn.on('ready', () => {
  console.log('SSH连接成功！');
  
  // 执行多个命令
  const commands = [
    'ls -la /etc/nginx/conf.d/',
    'cat /etc/nginx/conf.d/*.conf 2>/dev/null || echo "无额外配置"',
    'ls -la /var/www/ 2>/dev/null || echo "目录不存在"',
    'which node npm pm2',
    'node -v 2>/dev/null || echo "node未安装"'
  ];
  
  let index = 0;
  
  function runNext() {
    if (index >= commands.length) {
      conn.end();
      return;
    }
    
    const cmd = commands[index];
    console.log(`\n执行: ${cmd}`);
    
    conn.exec(cmd, (err, stream) => {
      if (err) {
        console.error('执行命令失败:', err);
        index++;
        runNext();
        return;
      }
      
      let output = '';
      stream.on('close', () => {
        console.log(output);
        index++;
        runNext();
      }).on('data', (data) => {
        output += data.toString();
      }).stderr.on('data', (data) => {
        output += 'STDERR: ' + data.toString();
      });
    });
  }
  
  runNext();
});

conn.on('error', (err) => {
  console.error('SSH连接失败:', err.message);
});

conn.connect(config);
