const http = require('http');

function testLogin() {
  console.log('🔄 Testing login with hr@dayflow.com...\n');
  
  const data = JSON.stringify({
    email: 'hr@dayflow.com',
    password: 'password123'
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = http.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ Login successful!');
        console.log('\nResponse data:');
        console.log(JSON.stringify(JSON.parse(responseData), null, 2));
      } else {
        console.log('❌ Login failed!');
        console.log('Status:', res.statusCode);
        console.log('Error:', JSON.stringify(JSON.parse(responseData), null, 2));
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Connection error:', error.message);
    console.log('Full error:', error);
  });

  req.write(data);
  req.end();
}

testLogin();
