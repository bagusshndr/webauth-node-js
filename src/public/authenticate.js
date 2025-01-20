const { startAuthentication } = SimpleWebAuthnBrowser;

const elemAuthenticate = document.getElementById('authenticate');
elemAuthenticate.addEventListener('click', async () => {
  elemSuccess.innerHTML = '';
  elemError.innerHTML = '';

  // Minta username dari pengguna
  const username = prompt('Enter username for authentication:');
  if (!username) {
    elemError.innerText = 'Authentication cancelled. Username is required.';
    return;
  }

  try {
    // GET opsi autentikasi dari backend
    const resp = await fetch(`https://feda-2001-448a-2020-2c65-79-6b39-fae3-f7d0.ngrok-free.app/webauthn/generate-authentication-options?username=${username}`);
    const optionsJSON = await resp.json();

    // Mulai proses autentikasi menggunakan SimpleWebAuthnBrowser
    const asseResp = await startAuthentication({ optionsJSON });

    // Kirim respons ke backend untuk verifikasi
    const verificationResp = await fetch('https://feda-2001-448a-2020-2c65-79-6b39-fae3-f7d0.ngrok-free.app/webauthn/verify-authentication', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        response: asseResp,
      }),
    });

    const verificationJSON = await verificationResp.json();

    // Tampilkan hasil verifikasi
    if (verificationJSON && verificationJSON.verified) {
      elemSuccess.innerText = 'Authentication successful!';
    } else {
      elemError.innerHTML = `Authentication failed: <pre>${JSON.stringify(verificationJSON)}</pre>`;
    }
  } catch (error) {
    // Tangani error dari proses autentikasi
    elemError.innerText = `Unexpected error: ${error.message}`;
  }
});