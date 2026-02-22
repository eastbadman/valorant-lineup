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
  
  // 执行命令
  conn.exec('cat /etc/nginx/nginx.conf', (err, stream) => {
    if (err) {
      console.error('执行命令失败:', err);
      conn.end();
      return;
    }
    
    let output = '';
    stream.on('close', () => {
      console.log('Nginx配置:');
      console.log(output);
      conn.end();
    }).on('data', (data) => {
      output += data.toString();
    }).stderr.on('data', (data) => {
      console.error('STDERR:', data.toString());
    });
  });
});

conn.on('error', (err) => {
  console.error('SSH连接失败:', err.message);
});

conn.connect(config);
