const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('✅ 连接成功');
  
  const commands = [
    'cd /var/www/valorant-lineup && git fetch origin && git reset --hard origin/main',
    'cd /var/www/valorant-lineup/valorant-lineup && npm run build',
    'pm2 restart all && sleep 2 && curl -s http://127.0.0.1:3001/api/stats'
  ];
  
  let index = 0;
  
  function runNext() {
    if (index >= commands.length) {
      console.log('\n✅ 全部完成');
      conn.end();
      return;
    }
    
    const cmd = commands[index];
    console.log(`\n[${index + 1}/${commands.length}] ${cmd.substring(0, 60)}...`);
    
    const timeout = setTimeout(() => {
      console.log('⚠️ 命令超时，继续下一个...');
      index++;
      runNext();
    }, 120000); // 2分钟超时
    
    conn.exec(cmd, (err, stream) => {
      if (err) {
        console.error('错误:', err);
        clearTimeout(timeout);
        index++;
        runNext();
        return;
      }
      
      let output = '';
      stream.on('close', (code) => {
        clearTimeout(timeout);
        const important = output.split('\n')
          .filter(l => l.includes('✓') || l.includes('built') || l.includes('online') || l.includes('error'))
          .slice(0, 5).join('\n');
        console.log(important || '(完成)');
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

conn.connect({
  host: '47.118.30.248',
  port: 22,
  username: 'root',
  password: 'Zhang@3712'
});
