const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const config = {
  host: '47.118.30.248',
  port: 22,
  username: 'root',
  password: 'Zhang@3712'
};

const localPath = '/home/wuying/clawd/valorant-lineup/valorant-lineup';
const remotePath = '/var/www/valorant-lineup';

async function deploy() {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    
    conn.on('ready', () => {
      console.log('✅ SSH连接成功！');
      
      // 部署命令
      const commands = [
        `cd ${remotePath} && git stash || true`,
        `cd ${remotePath} && git pull origin main || echo "git pull failed, will use upload"`,
        `cd ${remotePath}/server && npm install`,
        `cd ${remotePath} && npm install`,
        `cd ${remotePath} && npm run build`,
        `pm2 delete valorant-server || true`,
        `pm2 delete valorant-client || true`,
        `cd ${remotePath}/server && pm2 start npm --name "valorant-server" -- start`,
        `cd ${remotePath} && pm2 start npm --name "valorant-client" -- run preview -- --port 4173 --host`,
        `pm2 save`,
        `nginx -t && nginx -s reload`,
      ];
      
      let index = 0;
      
      function runNext() {
        if (index >= commands.length) {
          console.log('\n✅ 部署完成！');
          conn.end();
          resolve();
          return;
        }
        
        const cmd = commands[index];
        console.log(`\n[${index + 1}/${commands.length}] 执行: ${cmd}`);
        
        conn.exec(cmd, (err, stream) => {
          if (err) {
            console.error('执行失败:', err);
            index++;
            runNext();
            return;
          }
          
          let output = '';
          stream.on('close', (code) => {
            console.log(output);
            if (code !== 0) {
              console.log(`⚠️ 命令返回码: ${code}`);
            }
            index++;
            runNext();
          }).on('data', (data) => {
            output += data.toString();
          }).stderr.on('data', (data) => {
            output += data.toString();
          });
        });
      }
      
      runNext();
    });
    
    conn.on('error', (err) => {
      console.error('SSH连接失败:', err.message);
      reject(err);
    });
    
    conn.connect(config);
  });
}

deploy().then(() => {
  console.log('🎉 全部完成！');
}).catch(err => {
  console.error('部署失败:', err);
});
