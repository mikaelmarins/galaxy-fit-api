const http = require('http');

const signup = (email, password, name) => {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ email, password, name });
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/auth/signup',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };
        const req = http.request(options, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(JSON.parse(body)));
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
};

const login = (email, password) => {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ email, password });
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };
        const req = http.request(options, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(JSON.parse(body)));
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
};

const getWorkouts = (token) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/workouts',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };
        const req = http.request(options, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(JSON.parse(body)));
        });
        req.on('error', reject);
        req.end();
    });
};

async function runTests() {
    console.log('=== API Test Script ===\n');

    // Test 1: Signup
    console.log('1. Testing Signup...');
    try {
        const signupResult = await signup('apitest@galaxyfitsync.app', 'teste123', 'API Test');
        console.log('   Signup result:', signupResult.success ? 'SUCCESS' : 'FAILED');
        if (!signupResult.success) console.log('   Error:', signupResult.error);
    } catch (e) {
        console.log('   Signup error:', e.message);
    }

    // Test 2: Login
    console.log('\n2. Testing Login...');
    try {
        const loginResult = await login('apitest@galaxyfitsync.app', 'teste123');
        console.log('   Login result:', loginResult.success ? 'SUCCESS' : 'FAILED');
        if (loginResult.success) {
            console.log('   User:', loginResult.data.user.email);
            console.log('   Token received: YES');

            // Test 3: Get Workouts
            console.log('\n3. Testing Get Workouts...');
            const workoutsResult = await getWorkouts(loginResult.data.token);
            console.log('   Workouts result:', workoutsResult.success ? 'SUCCESS' : 'FAILED');
            console.log('   Workouts count:', workoutsResult.data?.length || 0);
        } else {
            console.log('   Error:', loginResult.error);
        }
    } catch (e) {
        console.log('   Login error:', e.message);
    }

    console.log('\n=== Tests Complete ===');
}

runTests();
