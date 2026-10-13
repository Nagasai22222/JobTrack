const BASE = 'http://localhost:8080';

async function testPhase10_3() {
  console.log('=== PHASE 10.3 E2E VERIFICATION SCRIPT ===');

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
  const username = `p103_user_${uid}`;
  const password = 'password123';

  // 1. Auth Setup
  const regRes = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email: `${username}@test.com`, password }),
  });
  assert(regRes.status === 201, 'User registration returned HTTP 201');

  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  assert(loginRes.status === 200 && !!token, 'User login returned HTTP 200 with JWT token');

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 2. Create Target Job Application
  const createRes = await fetch(`${BASE}/api/applications`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      companyName: 'TechCorp Solutions',
      jobRole: 'Full Stack Engineer',
      location: 'Remote',
      status: 'APPLIED',
      appliedDate: '2026-06-15',
      notes: 'Phase 10.3 Test Application'
    })
  });
  const app = await createRes.json();
  assert(createRes.status === 201 && app.id > 0, `Created application ID ${app.id}`);

  // 3. Comments CRUD
  const initComments = await (await fetch(`${BASE}/api/applications/${app.id}/comments`, { headers: authHeaders })).json();
  assert(Array.isArray(initComments) && initComments.length === 0, 'Initial comments list is empty');

  // Create Comment
  const comment1Res = await fetch(`${BASE}/api/applications/${app.id}/comments`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ content: 'First technical screening note logged.' })
  });
  const comment1 = await comment1Res.json();
  assert(comment1Res.status === 201 && comment1.id > 0, `Created comment ID ${comment1.id}`);

  // Update Comment
  const updateCommentRes = await fetch(`${BASE}/api/applications/${app.id}/comments/${comment1.id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({ content: 'Updated technical screening note logged with feedback.' })
  });
  const updatedComment = await updateCommentRes.json();
  assert(updateCommentRes.status === 200 && updatedComment.content.includes('feedback'), 'Updated comment content successfully');

  // Delete Comment
  const delCommentRes = await fetch(`${BASE}/api/applications/${app.id}/comments/${comment1.id}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  assert(delCommentRes.status === 204, 'Deleted comment returned HTTP 204 No Content');

  // 4. Activity History Timeline Verification
  const historyRes = await fetch(`${BASE}/api/applications/${app.id}/history`, { headers: authHeaders });
  const history = await historyRes.json();
  assert(historyRes.status === 200 && Array.isArray(history), 'Fetched activity timeline history');
  assert(history.length >= 4, `History timeline recorded ${history.length} lifecycle audit events`);

  const actions = history.map(h => h.action);
  assert(actions.includes('APPLICATION_CREATED'), 'Timeline includes APPLICATION_CREATED');
  assert(actions.includes('COMMENT_ADDED'), 'Timeline includes COMMENT_ADDED');
  assert(actions.includes('COMMENT_UPDATED'), 'Timeline includes COMMENT_UPDATED');
  assert(actions.includes('COMMENT_DELETED'), 'Timeline includes COMMENT_DELETED');

  // 5. Document Management
  const docFormData = new FormData();
  const fileContent = 'Dummy resume content for Phase 10.3 integration test.';
  const blob = new Blob([fileContent], { type: 'text/plain' });
  docFormData.append('file', blob, 'resume_john_doe.txt');
  docFormData.append('documentType', 'RESUME');

  const uploadRes = await fetch(`${BASE}/api/applications/${app.id}/documents`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: docFormData
  });
  const doc = await uploadRes.json();
  assert(uploadRes.status === 201 && doc.id > 0, `Uploaded document ID ${doc.id} (${doc.originalFileName})`);

  // Document List
  const docList = await (await fetch(`${BASE}/api/applications/${app.id}/documents`, { headers: authHeaders })).json();
  assert(Array.isArray(docList) && docList.length === 1, 'Document list contains 1 item');

  // Document Download
  const downloadRes = await fetch(`${BASE}/api/applications/${app.id}/documents/${doc.id}/download`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const downloadedText = await downloadRes.text();
  assert(downloadRes.status === 200 && downloadedText === fileContent, 'Downloaded document content matches original upload');

  // Document Delete
  const delDocRes = await fetch(`${BASE}/api/applications/${app.id}/documents/${doc.id}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  assert(delDocRes.status === 204, 'Deleted document returned HTTP 204 No Content');

  // 6. Updated History check
  const updatedHistory = await (await fetch(`${BASE}/api/applications/${app.id}/history`, { headers: authHeaders })).json();
  const updatedActions = updatedHistory.map(h => h.action);
  assert(updatedActions.includes('DOCUMENT_UPLOADED'), 'Timeline includes DOCUMENT_UPLOADED');
  assert(updatedActions.includes('DOCUMENT_DELETED'), 'Timeline includes DOCUMENT_DELETED');

  console.log('===================================');
  console.log(`Phase 10.3 Integration Results: Passed: ${passed}, Failed: ${failed}`);
  console.log('===================================');

  if (failed > 0) process.exit(1);
}

testPhase10_3().catch(err => {
  console.error('VERIFICATION SCRIPT ERROR:', err);
  process.exit(1);
});
