const { Client } = require('ssh2');

const config = {
  host: '47.118.30.248',
  port: 22,
  username: 'root',
  password: 'Zhang@3712'
};

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ SSH连接成功！开始部署...\n');
  
  const commands = [
    'cd /var/www && git clone https://github.com/eastbadman/valorant-lineup.git',
    'cd /var/www/valorant-lineup/valorant-lineup/server && npm install',
    'cd /var/www/valorant-lineup/valorant-lineup && npm install',
    'cd /var/www/valorant-lineup/valorant-lineup && npm run build',
    'cd /var/www/valorant-lineup/valorant-lineup/server && pm2 start npm --name "valorant-server" -- start',
    'cd /var/www/valorant-lineup/valorant-lineup && pm2 start npm --name "valorant-client" -- run preview -- --port 4173 --host',
    'pm2 save',
    'sleep 3',
    'curl -s http://127.0.0.1:3001/api/stats',
    'curl -s http://127.0.0.1:4173 | head -5'
  ];
  
  let index = 0;
  
  function runNext() {
    if (index >= commands.length) {
      console.log('\n🎉 部署完成！');
      conn.end();
      return;
    }
    
    const cmd = commands[index];
    console.log(`[${index + 1}/${commands.length}] ${cmd}`);
    
    conn.exec(cmd, (err, stream) => {
      if (err) {
        console.error('❌ 执行失败:', err);
        index++;
        runNext();
        return;
      }
      
      let output = '';
      stream.on('close', (code) => {
        // 只显示关键输出
        const lines = output.split('\n');
        const important = lines.filter(l => 
          l.includes('✅') || l.includes('❌') || l.includes('error') || 
          l.includes('Error') || l.includes('built') || l.includes('online') ||
          l.includes('Saving') || l.includes('Cloning') || l.includes('added')
        ).slice(0, 10).join('\n');
        console.log(important || '(完成)');
        if (code !== 0 && output.includes('error')) {
          console.log('⚠️ 有错误，检查日志...');
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

conn.on('error', (err) => console.error('❌ SSH连接失败:', err.message));
conn.connect(config);
