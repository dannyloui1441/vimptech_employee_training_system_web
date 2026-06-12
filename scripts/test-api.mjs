const BASE_URL = 'http://localhost:3000';
const EMP_TOKEN = 'Bearer emp_employee-001';

async function run() {
  console.log("=== 1. FETCHING SUBJECTS ===");
  const res1 = await fetch(`${BASE_URL}/api/employees/me/subjects`, {
    headers: { 'Authorization': EMP_TOKEN }
  });
  
  if (res1.status !== 200) {
    console.error(`Error: ${res1.status} - ${await res1.text()}`);
    return;
  }
  
  const data1 = await res1.json();
  const firstSubject = data1.subjects[0];
  if (!firstSubject) {
    console.log("No assigned subjects found for this employee.");
    return;
  }
  
  console.log(`Subject: ${firstSubject.name} (mode: ${firstSubject.mode})`);
  
  // Find a module that is not started
  const targetModule = firstSubject.modules.find(m => !m.started_at);
  if (!targetModule) {
    console.log("All modules are already started. Let's print the first module details:");
    const m = firstSubject.modules[0];
    console.log(` - ID: ${m.id}, started_at: ${m.started_at}, completed_at: ${m.completed_at}`);
    return;
  }
  
  console.log("Found an unstarted module:");
  console.log(" - ID:", targetModule.id);
  console.log(" - Module:", targetModule.module);
  console.log(" - Content Progress Percent:", targetModule.content_progress_percent);
  console.log(" - Started At:", targetModule.started_at);
  console.log(" - Completed At:", targetModule.completed_at);
  
  console.log("\n=== 2. CALLING PROGRESS API (progress: 0) ON UNSTARTED MODULE ===");
  const progressRes = await fetch(`${BASE_URL}/api/modules/progress`, {
    method: 'POST',
    headers: {
      'Authorization': EMP_TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      moduleId: targetModule.id,
      subjectId: firstSubject.id,
      progress: 0
    })
  });
  
  console.log("Progress API Response Status:", progressRes.status);
  console.log("Progress API Response Body:", await progressRes.text());
  
  console.log("\n=== 3. FETCHING SUBJECTS AGAIN TO VERIFY TIMESTAMPS ===");
  const res2 = await fetch(`${BASE_URL}/api/employees/me/subjects`, {
    headers: { 'Authorization': EMP_TOKEN }
  });
  
  const data2 = await res2.json();
  const updatedModule = data2.subjects[0].modules.find(m => m.id === targetModule.id);
  console.log("Module details after start:");
  console.log(" - ID:", updatedModule.id);
  console.log(" - Module:", updatedModule.module);
  console.log(" - Content Progress Percent:", updatedModule.content_progress_percent);
  console.log(" - Started At:", updatedModule.started_at);
  console.log(" - Completed At:", updatedModule.completed_at);
}

run().catch(console.error);
