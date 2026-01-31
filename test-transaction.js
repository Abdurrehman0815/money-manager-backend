// test-transaction.js
const API_URL = 'http://localhost:5000/api';

// Generate random user details
const randomNum = Math.floor(Math.random() * 10000);
const userEmail = `spender${randomNum}@test.com`;
const userPass = 'password123';

async function runTest() {
  console.log('🔵 Starting Transaction Logic Test...');

  try {
    // 1. REGISTER (To get a fresh Token)
    console.log(`\n1️⃣  Registering User (${userEmail})...`);
    const regRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Spender', email: userEmail, password: userPass })
    });
    const regData = await regRes.json();
    const token = regData.token;

    if (!token) throw new Error('Registration failed, no token.');
    console.log('✅ Registered! Token received.');

    // 2. GET ACCOUNTS (To find the "Cash" Account ID)
    console.log('\n2️⃣  Fetching Accounts...');
    const accRes = await fetch(`${API_URL}/transactions/accounts`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const accounts = await accRes.json();
    
    // Find the CASH account
    const cashAccount = accounts.find(acc => acc.type === 'Cash');
    console.log(`✅ Found Account: ${cashAccount.name} (Current Balance: ${cashAccount.balance})`);
    console.log(`   ID: ${cashAccount._id}`);

    // 3. ADD EXPENSE (Spend 500 from Cash)
    console.log('\n3️⃣  Adding Expense of 500...');
    const transRes = await fetch(`${API_URL}/transactions/add`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        type: 'expense',
        amount: 500,
        category: 'Food',
        division: 'Personal',
        description: 'Lunch',
        date: new Date(),
        accountFrom: cashAccount._id, // Deduct from Cash
        accountTo: null
      })
    });
    const transData = await transRes.json();
    
    if (transRes.status === 201) {
        console.log('✅ Expense Added!');
    } else {
        console.log('❌ Failed to add expense:', transData);
        return;
    }

    // 4. VERIFY BALANCE (Should be -500)
    console.log('\n4️⃣  Verifying New Balance...');
    const verifyRes = await fetch(`${API_URL}/transactions/accounts`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const verifyAccounts = await verifyRes.json();
    const updatedCash = verifyAccounts.find(acc => acc.type === 'Cash');

    if (updatedCash.balance === -500) {
        console.log(`✅ SUCCESS! New Balance is ${updatedCash.balance}. logic is perfect.`);
    } else {
        console.log(`❌ FAIL! Balance is ${updatedCash.balance}, expected -500.`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

runTest();