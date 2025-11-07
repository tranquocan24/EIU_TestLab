// Quick script to delete old attempt
// Usage: node delete-attempt.js <YOUR_TOKEN> <ATTEMPT_ID>

const token = process.argv[2];
const attemptId = process.argv[3];

if (!token || !attemptId) {
  console.log('❌ Usage: node delete-attempt.js <TOKEN> <ATTEMPT_ID>');
  console.log('\nSteps:');
  console.log('1. Get your token from browser localStorage');
  console.log('2. Get attempt ID from: GET http://localhost:3001/attempts/my-attempts');
  console.log('3. Run: node delete-attempt.js YOUR_TOKEN ATTEMPT_ID');
  process.exit(1);
}

async function deleteAttempt() {
  try {
    console.log('🔍 Fetching your attempts...');
    const listResponse = await fetch('http://localhost:3001/attempts/my-attempts', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!listResponse.ok) {
      const error = await listResponse.text();
      console.error('❌ Failed to fetch attempts:', error);
      process.exit(1);
    }

    const attempts = await listResponse.json();
    console.log('📋 Your attempts:', JSON.stringify(attempts.data, null, 2));

    console.log(`\n🗑️  Deleting attempt: ${attemptId}`);
    const deleteResponse = await fetch(`http://localhost:3001/attempts/${attemptId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!deleteResponse.ok) {
      const error = await deleteResponse.text();
      console.error('❌ Failed to delete attempt:', error);
      process.exit(1);
    }

    const result = await deleteResponse.json();
    console.log('✅ Success:', result);

    console.log('\n✨ Attempt deleted! You can now retake the exam.');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deleteAttempt();
