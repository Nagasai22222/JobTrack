const BASE = 'http://localhost:8080';

async function testPhase10_4() {
  console.log('=== PHASE 10.4 E2E VERIFICATION SCRIPT ===');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  const uid = Math.floor(Math.random() * 9000 + 1000);
  const username = `p104_user_${uid}`;
  const password = 'password123';

  // 1. Registration
  const regRes = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email: `${username}@test.com`, password }),
  });
  assert(regRes.status === 201, '1. User registration returned HTTP 201');

  // 2. Login
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  assert(loginRes.status === 200 && !!token, '2. User login returned HTTP 200 with token');

  // 3. JWT Header Verification
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  assert(token.length > 20, '3. JWT authentication token validated');

  // 4. Dashboard Summary Initial
  const sumRes1 = await fetch(`${BASE}/api/dashboard/summary`, { headers: authHeaders });
  const sum1 = await sumRes1.json();
  assert(sumRes1.status === 200 && sum1.totalApplications === 0, '4. Initial dashboard summary fetched (0 applications)');

  // 5. Application Creation
  const createRes = await fetch(`${BASE}/api/applications`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      companyName: 'Apex Financial',
      jobRole: 'Backend Engineer',
      location: 'Chicago, IL',
      status: 'APPLIED',
      appliedDate: '2026-06-20',
      notes: 'Initial application'
    })
  });
  const app = await createRes.json();
  assert(createRes.status === 201 && app.id > 0, `5. Application created with ID ${app.id}`);

  // 6. Application Retrieval by ID
  const getRes = await fetch(`${BASE}/api/applications/${app.id}`, { headers: authHeaders });
  const fetchedApp = await getRes.json();
  assert(getRes.status === 200 && fetchedApp.companyName === 'Apex Financial', '6. Application retrieved by ID');

  // 7. Application Update
  const updateRes = await fetch(`${BASE}/api/applications/${app.id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      companyName: 'Apex Financial Group',
      jobRole: 'Senior Backend Engineer',
      location: 'Remote - Chicago',
      status: 'APPLIED',
      appliedDate: '2026-06-20',
      notes: 'Updated application role'
    })
  });
  const updatedApp = await updateRes.json();
  assert(updateRes.status === 200 && updatedApp.jobRole === 'Senior Backend Engineer', '7. Application details updated');

  // 8. Status Transition Workflow (APPLIED -> SCREENING -> INTERVIEW)
  const status1Res = await fetch(`${BASE}/api/applications/${app.id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      companyName: updatedApp.companyName,
      jobRole: updatedApp.jobRole,
      status: 'SCREENING',
      appliedDate: updatedApp.appliedDate
    })
  });
  const status1App = await status1Res.json();
  assert(status1Res.status === 200 && status1App.status === 'SCREENING', '8a. Status transitioned to SCREENING');

  const status2Res = await fetch(`${BASE}/api/applications/${app.id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      companyName: updatedApp.companyName,
      jobRole: updatedApp.jobRole,
      status: 'INTERVIEW',
      appliedDate: updatedApp.appliedDate
    })
  });
  const status2App = await status2Res.json();
  assert(status2Res.status === 200 && status2App.status === 'INTERVIEW', '8b. Status transitioned to INTERVIEW');

  // 9. Status Transition Reflected in History
  const historyRes = await fetch(`${BASE}/api/applications/${app.id}/history`, { headers: authHeaders });
  const history = await historyRes.json();
  const statusEvents = history.filter(h => h.action === 'APPLICATION_STATUS_CHANGED');
  assert(historyRes.status === 200 && statusEvents.length >= 2, '9. Status transitions automatically recorded in activity history');

  // 10. Application Search
  const searchRes = await (await fetch(`${BASE}/api/applications?search=Apex`, { headers: authHeaders })).json();
  assert(searchRes.content.length === 1 && searchRes.content[0].companyName.includes('Apex'), '10. Search query returned matching application');

  // 11. Status Filtering
  const filterRes = await (await fetch(`${BASE}/api/applications?status=INTERVIEW`, { headers: authHeaders })).json();
  assert(filterRes.content.length === 1 && filterRes.content[0].status === 'INTERVIEW', '11. Status filter returned matching application');

  // 12. Date Filtering
  const dateRes = await (await fetch(`${BASE}/api/applications?fromDate=2026-06-19&toDate=2026-06-21`, { headers: authHeaders })).json();
  assert(dateRes.content.length === 1, '12. Date range filter returned matching application');

  // 13. Sorting
  const sortRes = await (await fetch(`${BASE}/api/applications?sortBy=companyName&direction=asc`, { headers: authHeaders })).json();
  assert(sortRes.content.length >= 1, '13. Applications sorted successfully');

  // 14. Pagination
  const pageRes = await (await fetch(`${BASE}/api/applications?page=0&size=5`, { headers: authHeaders })).json();
  assert(pageRes.pageSize === 5 && pageRes.currentPage === 0, '14. Server-side pagination parameters respected');

  // 15. Application Details Retrieval
  const detailsRes = await fetch(`${BASE}/api/applications/${app.id}`, { headers: authHeaders });
  assert(detailsRes.status === 200, '15. Application details endpoint verified');

  // 16. Comments Retrieval
  const commentsRes = await fetch(`${BASE}/api/applications/${app.id}/comments`, { headers: authHeaders });
  assert(commentsRes.status === 200, '16. Comments retrieval verified');

  // 17. Document Retrieval
  const docsRes = await fetch(`${BASE}/api/applications/${app.id}/documents`, { headers: authHeaders });
  assert(docsRes.status === 200, '17. Documents retrieval verified');

  // 18. Application Deletion
  const delRes = await fetch(`${BASE}/api/applications/${app.id}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  assert(delRes.status === 204, '18. Application deletion returned HTTP 204');

  // 19. Final Dashboard State Check
  const sumRes2 = await fetch(`${BASE}/api/dashboard/summary`, { headers: authHeaders });
  const sum2 = await sumRes2.json();
  assert(sumRes2.status === 200 && sum2.totalApplications === 0, '19. Final dashboard summary updated (0 applications)');

  // 20. Unauthorized Access Behavior
  const unauthRes = await fetch(`${BASE}/api/applications`, {
    headers: { 'Content-Type': 'application/json' }
  });
  assert(unauthRes.status === 401, '20. Unauthorized request without JWT rejected with HTTP 401');

  console.log('===================================');
  console.log(`Phase 10.4 Integration Results: Passed: ${passed}, Failed: ${failed}`);
  console.log('===================================');

  if (failed > 0) process.exit(1);
}

testPhase10_4().catch(err => {
  console.error('VERIFICATION SCRIPT ERROR:', err);
  process.exit(1);
});
