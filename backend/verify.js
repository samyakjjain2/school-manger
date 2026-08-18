const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- STARTING BACKEND API VERIFICATION ---');
  
  try {
    // 1. Get Initial Students list
    console.log('Fetching initial students...');
    const listRes = await fetch(`${API_BASE}/students`);
    if (!listRes.ok) throw new Error('Failed to fetch students list');
    const initialStudents = await listRes.json();
    console.log(`Initial count: ${initialStudents.length} students found.`);

    // 2. Add New Test Student
    const testStudent = {
      first_name: 'Testy',
      last_name: 'McTestFace',
      email: 'testy.mctest@example.com',
      phone: '555-999-1234',
      class_name: 'Grade 10-A',
      roll_number: 'TEST-999',
      date_of_birth: '2010-01-01',
      gender: 'Male'
    };

    console.log('Adding new test student...');
    const addRes = await fetch(`${API_BASE}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testStudent)
    });

    if (!addRes.ok) {
      const err = await addRes.json();
      throw new Error(`Failed to add student: ${JSON.stringify(err)}`);
    }

    const addData = await addRes.json();
    console.log(`Success response: ${addData.message}`);
    const newStudentId = addData.student.id;
    console.log(`New student ID: ${newStudentId}`);

    // 3. Verify Added Student is Saved and Returned
    console.log('Fetching updated student list...');
    const listRes2 = await fetch(`${API_BASE}/students`);
    const updatedStudents = await listRes2.json();
    console.log(`New count: ${updatedStudents.length} students found.`);
    
    const found = updatedStudents.find(s => s.id === newStudentId);
    if (!found) {
      throw new Error('Newly created student was not found in the list!');
    }
    console.log('Verified: New student successfully saved in database!');

    // 4. Delete the Test Student to restore DB state
    console.log('Cleaning up test student...');
    const delRes = await fetch(`${API_BASE}/students/${newStudentId}`, {
      method: 'DELETE'
    });
    if (!delRes.ok) throw new Error('Failed to delete test student during cleanup');
    const delData = await delRes.json();
    console.log(`Success response: ${delData.message}`);

    console.log('--- ALL BACKEND TESTS PASSED SUCCESSFULLY! ---');
  } catch (error) {
    console.error('--- BACKEND TESTS FAILED ---');
    console.error(error.message);
    process.exit(1);
  }
}

runTests();
