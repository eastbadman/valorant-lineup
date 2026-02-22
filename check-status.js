const { Client } = require('ssh2');

const config = {
  host: '47.118.30.248',
  port: 22,
  username: 'root',
  password: 'Zhang@3712'
};

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ SSH连接成功！');
  
  const commands = [
    'pm2 list',
    'pm2 logs valorant-server --lines 5 --nostream',
    'curl -s http://localhost:3001/api/stats',
    'curl -s http://localhost:4173 | head -20'
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
        console.error('执行失败:', err);
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
        output += data.toString();
      });
    });
  }
  
  runNext();
});

conn.on('error', (err) => {
  console.error('SSH连接失败:', err.message);
});

conn.connect(config);
