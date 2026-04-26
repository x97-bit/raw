async function test() {
  const loginRes = await fetch('http://127.0.0.1:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;

  const res = await fetch('http://127.0.0.1:3000/api/trpc/paymentMatching.getDashboard', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  console.log('Status:', res.status);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
test().catch(console.error);
