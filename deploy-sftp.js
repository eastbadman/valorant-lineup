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
  
  // 读取本地打包的dist
  const distTar = readFileSync('/tmp/dist.tar.gz');
  console.log('📦 读取dist.tar.gz:', distTar.length, 'bytes');
  
  // SFTP上传
  conn.sftp((err, sftp) => {
    if (err) throw err;
    
    console.log('📤 上传中...');
    
    sftp.fastPut('/tmp/dist.tar.gz', '/tmp/dist.tar.gz', (err) => {
      if (err) {
        console.error('上传失败:', err);
        conn.end();
        return;
      }
      
      console.log('✅ 上传成功！');
      
      // 解压并重启
      const script = `
        cd /var/www/valorant-lineup/valorant-lineup
        rm -rf dist
        tar xzf /tmp/dist.tar.gz
        ls -la dist/
        pm2 restart all
        sleep 3
        curl -s http://127.0.0.1:4173 | head -5
      `;
      
      conn.exec(script, (err, stream) => {
        if (err) throw err;
        
        stream.on('close', () => {
          console.log('\n✅ 部署完成！');
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
