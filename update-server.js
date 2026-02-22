const { Client } = require('ssh2');
const { readFileSync } = require('fs');

const config = {
  host: '47.118.30.248',
  port: 22,
  username: 'root',
  password: 'Zhang@3712'
};

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ SSH连接成功');
  
  // 读取本地server代码
  const serverCode = readFileSync('/home/wuying/clawd/valorant-lineup/valorant-lineup/server/index.js', 'utf8');
  console.log('📄 读取server/index.js:', serverCode.length, 'bytes');
  
  // SFTP上传
  conn.sftp((err, sftp) => {
    if (err) throw err;
    
    console.log('📤 上传server代码...');
    
    // 先上传到临时位置
    const localPath = '/home/wuying/clawd/valorant-lineup/valorant-lineup/server/index.js';
    const remotePath = '/var/www/valorant-lineup/valorant-lineup/server/index.js';
    
    sftp.fastPut(localPath, remotePath, (err) => {
      if (err) {
        console.error('上传失败:', err);
        conn.end();
        return;
      }
      
      console.log('✅ 后端代码上传成功！');
      
      // 重启后端服务
      const script = `
        cd /var/www/valorant-lineup/valorant-lineup/server
        npm install
        pm2 restart server
        sleep 3
        curl -s http://127.0.0.1:3001/api/stats
      `;
      
      conn.exec(script, (err, stream) => {
        if (err) throw err;
        
        stream.on('close', () => {
          console.log('\n✅ 后端更新完成！');
          conn.end();
        }).on('data', (data) => {
          process.stdout.write(data);
        }).stderr.on('data', (data) => {
          process.stderr.write(data);
        });
      });
    });
  });
});

conn.connect(config);
