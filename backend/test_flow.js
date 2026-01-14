const fetch = require('node-fetch'); // Ensure node-fetch is available or use native fetch in Node 18+

// Use native fetch if node-fetch is not found (Node 18+)
const request = global.fetch || require('node-fetch');

const BASE_URL = 'http://localhost:5000';

const generateRandomString = () => Math.random().toString(36).substring(7);
const adminEmail = `admin_${generateRandomString()}@test.com`;
const customerEmail = `customer_${generateRandomString()}@test.com`;
const password = 'password123';

let adminToken;
let customerToken;
let hallId;
let packageId;
let bookingId;

const log = (msg, type = 'info') => {
  const color = type === 'error' ? '\x1b[31m' : type === 'success' ? '\x1b[32m' : '\x1b[37m';
  console.log(`${color}[${type.toUpperCase()}] ${msg}\x1b[0m`);
};

const runTests = async () => {
  try {
    log('Starting API Tests...', 'info');

    // 1. Register Admin
    log(`1. Registering Admin (${adminEmail})...`);
    const adminRegRes = await request(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Admin User',
        email: adminEmail,
        password,
        phone: '1234567890',
        role: 'admin',
      }),
    });
    const adminRegData = await adminRegRes.json();
    if (!adminRegRes.ok) throw new Error(adminRegData.message);
    adminToken = adminRegData.token;
    log('Admin Registered & Logged In', 'success');

    // 2. Create Hall (as Admin)
    log('2. Creating Hall...');
    const hallRes = await request(`${BASE_URL}/api/halls`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: `Grand Hall ${generateRandomString()}`,
        location: 'City Center',
        capacity: 500,
        price: 1000,
        facilities: ['AC', 'Parking'],
      }),
    });
    const hallData = await hallRes.json();
    if (!hallRes.ok) throw new Error(hallData.message);
    hallId = hallData._id;
    log(`Hall Created: ${hallId}`, 'success');

    // 3. Create Package (as Admin)
    log('3. Creating Package...');
    const pkgRes = await request(`${BASE_URL}/api/packages`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        hallId,
        title: 'Gold Package',
        price: 500,
        services: ['Decoration', 'Food'],
      }),
    });
    const pkgData = await pkgRes.json();
    if (!pkgRes.ok) throw new Error(pkgData.message);
    packageId = pkgData._id;
    log(`Package Created: ${packageId}`, 'success');

    // 4. Register Customer
    log(`4. Registering Customer (${customerEmail})...`);
    const custRegRes = await request(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Customer User',
        email: customerEmail,
        password,
        phone: '0987654321',
        role: 'customer',
      }),
    });
    const custRegData = await custRegRes.json();
    if (!custRegRes.ok) throw new Error(custRegData.message);
    customerToken = custRegData.token;
    log('Customer Registered & Logged In', 'success');

    // 5. Book Hall (as Customer)
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 10); // 10 days from now

    log('5. Booking Hall...');
    const bookRes = await request(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        hallId,
        packageId,
        eventDate,
        guestsCount: 200,
      }),
    });
    const bookData = await bookRes.json();
    if (!bookRes.ok) throw new Error(bookData.message);
    bookingId = bookData._id;
    log(`Booking Created: ${bookingId}`, 'success');

    // 6. Double Booking Check
    log('6. Testing Double Booking Prevention...');
    const doubleBookRes = await request(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        hallId,
        packageId,
        eventDate, // Same date
        guestsCount: 100,
      }),
    });
    const doubleBookData = await doubleBookRes.json();
    if (doubleBookRes.ok) throw new Error('Double booking should have failed!');
    log(`Double Booking Prevented: ${doubleBookData.message}`, 'success');

    // 7. Approve Booking (as Admin)
    log('7. Approving Booking...');
    const approveRes = await request(`${BASE_URL}/api/bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'approved',
      }),
    });
    const approveData = await approveRes.json();
    if (!approveRes.ok) throw new Error(approveData.message);
    if (approveData.status !== 'approved') throw new Error('Status not updated');
    log('Booking Approved', 'success');

    log('ALL TESTS PASSED SUCCESSFULLY!', 'success');

  } catch (error) {
    log(`TEST FAILED: ${error.message}`, 'error');
    process.exit(1);
  }
};

runTests();
