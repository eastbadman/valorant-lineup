const { Client } = require('ssh2');
const { readFileSync, readdirSync, statSync } = require('fs');
const { join } = require('path');
const scp = require('scp2');

const config = {
  host: '47.118.30.248',
  port: 22,
  username: 'root',
  password: 'Zhang@3712'
};

// 使用SSH执行命令上传
const conn = new Client();

conn.on('ready', () => {
  console.log('✅ SSH连接成功');
  
  // 读取本地dist文件
  const distPath = '/home/wuying/clawd/valorant-lineup/valorant-lineup/dist';
  const files = readdirSync(distPath);
  console.log('📁 本地dist文件:', files);
  
  // 创建远程目录并上传
  const script = `
    rm -rf /var/www/valorant-lineup/valorant-lineup/dist
    mkdir -p /var/www/valorant-lineup/valorant-lineup/dist/assets
  `;
  
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    
    stream.on('close', () => {
      console.log('✅ 准备上传...');
      
      // 使用scp上传
      const scpClient = require('scp2');
      scpClient.scp(distPath, {
        host: config.host,
        username: config.username,
        password: config.password,
        path: '/var/www/valorant-lineup/valorant-lineup/dist'
      }, (err) => {
        if (err) {
          console.error('上传失败:', err);
          conn.end();
          return;
        }
        
        console.log('✅ 上传成功！');
        
        // 重启服务
        conn.exec('pm2 restart all && sleep 3 && curl -s http://127.0.0.1:4173 | head -5', (err, stream) => {
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
    }).on('data', (data) => {
      process.stdout.write(data);
    });
  });
});

conn.connect(config);
