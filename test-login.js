const http = require('http');

const loginData = JSON.stringify({
    email: 'mikaelsky1@gmail.com',
    password: 'senha@123'
});

console.log('=== Galaxy Fit API Test ===\n');

const req = http.request({
    hostname: 'localhost',
    port: 3001,
    path: '/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
    }
}, res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        try {
            const result = JSON.parse(body);
            console.log('1. Login:', result.success ? 'SUCCESS ✓' : 'FAILED ✗');

            if (result.success && result.data && result.data.token) {
                console.log('   Email:', result.data.user.email);

                const token = result.data.token;
                const req2 = http.request({
                    hostname: 'localhost',
                    port: 3001,
                    path: '/workouts',
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer ' + token
                    }
                }, res2 => {
                    let body2 = '';
                    res2.on('data', chunk => body2 += chunk);
                    res2.on('end', () => {
                        try {
                            const workouts = JSON.parse(body2);
                            console.log('\n2. Get Workouts:', workouts.success ? 'SUCCESS ✓' : 'FAILED ✗');
                            if (workouts.success && workouts.data) {
                                console.log('   Total workouts:', workouts.data.length);
                                if (workouts.data.length > 0) {
                                    console.log('   First workout:', workouts.data[0].workout_name);
                                    console.log('   Last workout:', workouts.data[workouts.data.length - 1].workout_name);
                                }
                            } else {
                                console.log('   Error:', workouts.error);
                            }
                        } catch (e) {
                            console.log('   Parse error:', e.message);
                        }
                        console.log('\n=== Test Complete ===');
                    });
                });
                req2.end();
            } else {
                console.log('   Error:', result.error);
                console.log('\n=== Test Complete ===');
            }
        } catch (e) {
            console.log('   Parse error:', e.message);
            console.log('\n=== Test Complete ===');
        }
    });
});

req.on('error', e => console.error('Request error:', e.message));
req.write(loginData);
req.end();
