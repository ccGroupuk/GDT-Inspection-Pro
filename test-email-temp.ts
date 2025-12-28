import { sendGenericEmail } from './server/email';

async function testEmail() {
  console.log('Sending test email...');
  const result = await sendGenericEmail(
    'jonathands43@hotmail.com',
    'CCC Group - Email Test',
    'This is a test email from your CCC Group CRM.\n\nIf you received this, your email system is working correctly!',
    'Jonathan'
  );
  console.log('Result:', result);
  process.exit(result.success ? 0 : 1);
}

testEmail();
