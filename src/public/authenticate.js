const { startAuthentication } = SimpleWebAuthnBrowser;

const elemAuthenticate = document.getElementById('authenticate');
elemAuthenticate.addEventListener('click', async () => {
  elemSuccess.innerHTML = '';
  elemError.innerHTML = '';

  const username = prompt('Enter username for authentication:');
  if (!username) {
    elemError.innerText = 'Authentication cancelled. Username is required.';
    return;
  }

  try {
    const resp = await fetch(`https://feda-2001-448a-2020-2c65-79-6b39-fae3-f7d0.ngrok-free.app/webauthn/generate-authentication-options?username=${username}`);
    const optionsJSON = await resp.json();
    
    const asseResp = await startAuthentication({ optionsJSON });

    const verificationResp = await fetch('https://feda-2001-448a-2020-2c65-79-6b39-fae3-f7d0.ngrok-free.app/webauthn/verify-authentication', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        response: asseResp,
      }),
    });

    const verificationJSON = await verificationResp.json();

    if (verificationJSON && verificationJSON.verified) {
      elemSuccess.innerText = 'Authentication successful!';
    } else {
      elemError.innerHTML = `Authentication failed: <pre>${JSON.stringify(verificationJSON)}</pre>`;
    }
  } catch (error) {
    elemError.innerText = `Unexpected error: ${error.message}`;
  }
});