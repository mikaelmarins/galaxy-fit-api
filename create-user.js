const http = require('http');

// Criar/atualizar usuário mikaelsky1@gmail.com
const signupData = JSON.stringify({
    email: 'mikaelsky1@gmail.com',
    password: 'senha@123',
    name: 'Mikael'
});

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/auth/signup',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': signupData.length
    }
};

const req = http.request(options, res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        console.log('Signup result:', body);
    });
});

req.on('error', e => console.error('Error:', e.message));
req.write(signupData);
req.end();
