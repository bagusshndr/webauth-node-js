const { startRegistration } = SimpleWebAuthnBrowser;

const elemRegister = document.getElementById('register');
const elemSuccess = document.getElementById('success');
const elemError = document.getElementById('error');

elemRegister.addEventListener('click', async () => {
  elemSuccess.innerHTML = '';
  elemError.innerHTML = '';

  const username = prompt('Enter username for registration:');
  if (!username) {
    elemError.innerHTML = 'Registration cancelled. Username is required.';
    return;
  }

  try {
    const resp = await fetch(`https://feda-2001-448a-2020-2c65-79-6b39-fae3-f7d0.ngrok-free.app/webauthn/generate-registration-options?username=${username}`);
    const optionsJSON = await resp.json();
    
    const attResp = await startRegistration({ optionsJSON });

    const verificationResp = await fetch('https://feda-2001-448a-2020-2c65-79-6b39-fae3-f7d0.ngrok-free.app/webauthn/verify-registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        response: attResp,
      }),
    });
    

    const verificationJSON = await verificationResp.json();

    if (verificationJSON && verificationJSON.verified) {
      elemSuccess.innerHTML = 'Registration successful!';
    } else {
      elemError.innerHTML = `Registration failed: <pre>${JSON.stringify(verificationJSON)}</pre>`;
    }
  } catch (error) {
    if (error.name === 'InvalidStateError') {
      elemError.innerText = 'Error: Authenticator was probably already registered by user';
    } else {
      elemError.innerText = `Unexpected error: ${error.message}`;
    }
  }
});