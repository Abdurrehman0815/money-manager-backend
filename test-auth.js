// test-auth.js
// This script uses the native 'fetch' API (Node.js 18+)

const API_URL = 'http://localhost:5000/api/auth';

// 1. Create a random user so we don't get "User already exists" errors
const randomNum = Math.floor(Math.random() * 10000);
const testUser = {
  username: `TestUser_${randomNum}`,
  email: `user${randomNum}@test.com`,
  password: 'password123'
};

async function runTest() {
  console.log('🔵 Starting Auth System Test...');
  console.log(`👤 Testing with: ${testUser.email}`);

  try {
    // --- STEP 1: REGISTER ---
    console.log('\n1️⃣  Testing Registration...');
    const regRes = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    const regData = await regRes.json();
    
    if (regRes.status === 201) {
      console.log('✅ Registration SUCCESS!');
      console.log('   User ID:', regData._id);
      console.log('   Token received:', regData.token ? "YES" : "NO");
    } else {
      console.log('❌ Registration FAILED:', regData);
      return; // Stop if register fails
    }

    // --- STEP 2: LOGIN ---
    console.log('\n2️⃣  Testing Login...');
    const loginRes = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });

    const loginData = await loginRes.json();

    if (loginRes.status === 200) {
      console.log('✅ Login SUCCESS!');
      console.log('   Welcome back:', loginData.username);
      console.log('   Token:', loginData.token.substring(0, 20) + '...');
    } else {
      console.log('❌ Login FAILED:', loginData);
    }

  } catch (error) {
    console.error('❌ System Error:', error.message);
    console.log('   (Make sure your server is running on port 5000)');
  }
}

runTest();