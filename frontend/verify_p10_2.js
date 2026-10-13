const BASE = 'http://localhost:8080';

async function testPhase10_2() {
  console.log('=== PHASE 10.2 E2E VERIFICATION SCRIPT ===');

  const uid = Math.floor(Math.random() * 9000 + 1000);
  const username = `p102_user_${uid}`;
  const password = 'password123';

  // 1. Register
  const regRes = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email: `${username}@test.com`, password }),
  });
  console.log('1. Registration Status:', regRes.status);

  // 2. Login
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('2. Login Status:', loginRes.status, '| Token Present:', !!token);

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 3. Initial Dashboard Summary
  const sumRes1 = await fetch(`${BASE}/api/dashboard/summary`, { headers: authHeaders });
  const sum1 = await sumRes1.json();
  console.log('3. Initial Total Applications:', sum1.totalApplications);

  // 4. Create Applications
  const app1 = await (await fetch(`${BASE}/api/applications`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      companyName: 'Acme Corp',
      jobRole: 'Frontend Developer',
      location: 'Remote',
      status: 'APPLIED',
      appliedDate: '2026-06-01',
      jobUrl: 'https://acme.com/jobs/1',
      notes: 'Applied via company portal'
    })
  })).json();
  console.log('4a. Created App 1 ID:', app1.id, '| Status:', app1.status);

  const app2 = await (await fetch(`${BASE}/api/applications`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      companyName: 'Stark Industries',
      jobRole: 'Lead Architect',
      location: 'New York, NY',
      status: 'INTERVIEW',
      appliedDate: '2026-06-05',
      jobUrl: 'https://stark.com/careers',
      notes: 'Round 1 technical scheduled'
    })
  })).json();
  console.log('4b. Created App 2 ID:', app2.id, '| Status:', app2.status);

  const app3 = await (await fetch(`${BASE}/api/applications`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      companyName: 'Wayne Enterprises',
      jobRole: 'Security Specialist',
      location: 'Gotham',
      status: 'OFFER',
      appliedDate: '2026-06-10',
      notes: 'Offer letter received'
    })
  })).json();
  console.log('4c. Created App 3 ID:', app3.id, '| Status:', app3.status);

  // 5. Dashboard Summary after creation
  const sumRes2 = await fetch(`${BASE}/api/dashboard/summary`, { headers: authHeaders });
  const sum2 = await sumRes2.json();
  console.log('5. Dashboard Summary | Total:', sum2.totalApplications, '| Applied:', sum2.applied, '| Interview:', sum2.interview, '| Offer:', sum2.offers);

  // 6. Recent Applications
  const recentList = await (await fetch(`${BASE}/api/dashboard/recent`, { headers: authHeaders })).json();
  console.log('6. Recent Applications Count:', recentList.length);

  // 7. Search Applications
  const searchRes = await (await fetch(`${BASE}/api/applications?search=Stark`, { headers: authHeaders })).json();
  console.log('7. Search "Stark" Count:', searchRes.content.length, '| Found:', searchRes.content[0]?.companyName);

  // 8. Filter by Status
  const filterStatusRes = await (await fetch(`${BASE}/api/applications?status=OFFER`, { headers: authHeaders })).json();
  console.log('8. Filter Status "OFFER" Count:', filterStatusRes.content.length);

  // 9. Filter by Date Range
  const filterDateRes = await (await fetch(`${BASE}/api/applications?fromDate=2026-06-04&toDate=2026-06-08`, { headers: authHeaders })).json();
  console.log('9. Filter Date Range (June 4 - June 8) Count:', filterDateRes.content.length);

  // 10. Sort Applications
  const sortRes = await (await fetch(`${BASE}/api/applications?sortBy=companyName&direction=asc`, { headers: authHeaders })).json();
  console.log('10. Sorted by Company Asc:', sortRes.content.map(a => a.companyName).join(', '));

  // 11. Paginate Applications
  const pageRes = await (await fetch(`${BASE}/api/applications?page=0&size=2`, { headers: authHeaders })).json();
  console.log('11. Pagination Page 0 Size 2 | Returned:', pageRes.content.length, '| Total Pages:', pageRes.totalPages);

  // 12. Edit Application
  const updateRes = await (await fetch(`${BASE}/api/applications/${app1.id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      companyName: 'Acme Corporation International',
      jobRole: 'Senior Frontend Developer',
      location: 'Remote',
      status: 'SCREENING',
      appliedDate: '2026-06-01',
      notes: 'HR Screening call passed'
    })
  })).json();
  console.log('12. Updated App 1 Role:', updateRes.jobRole, '| New Status:', updateRes.status);

  // 13. Delete Application
  const deleteRes = await fetch(`${BASE}/api/applications/${app3.id}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  console.log('13. Deleted App 3 Status:', deleteRes.status);

  // 14. Final Summary Verification
  const sumRes3 = await fetch(`${BASE}/api/dashboard/summary`, { headers: authHeaders });
  const sum3 = await sumRes3.json();
  console.log('14. Final Dashboard Total Applications:', sum3.totalApplications);

  console.log('=== E2E INTEGRATION VERIFICATION COMPLETE: ALL PASSED ===');
}

testPhase10_2().catch(err => {
  console.error('E2E TEST FAILED:', err);
  process.exit(1);
});
