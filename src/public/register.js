const { startRegistration } = SimpleWebAuthnBrowser;

const elemRegister = document.getElementById('register');
const elemSuccess = document.getElementById('success');
const elemError = document.getElementById('error');

// Event listener untuk tombol registrasi
elemRegister.addEventListener('click', async () => {
  elemSuccess.innerHTML = '';
  elemError.innerHTML = '';

  // Minta username dari pengguna
  const username = prompt('Enter username for registration:');
  if (!username) {
    elemError.innerHTML = 'Registration cancelled. Username is required.';
    return;
  }

  try {
    // GET opsi registrasi dari backend
    const resp = await fetch(`https://feda-2001-448a-2020-2c65-79-6b39-fae3-f7d0.ngrok-free.app/webauthn/generate-registration-options?username=${username}`);
    const optionsJSON = await resp.json();
    
    const attResp = await startRegistration({ optionsJSON });
    console.log('attResp: ',attResp);
    // Kirim respons ke backend untuk verifikasi
    const verificationResp = await fetch('https://feda-2001-448a-2020-2c65-79-6b39-fae3-f7d0.ngrok-free.app/webauthn/verify-registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        response: attResp,
      }),
    });
    

    const verificationJSON = await verificationResp.json();

    // Tampilkan hasil verifikasi
    if (verificationJSON && verificationJSON.verified) {
      elemSuccess.innerHTML = 'Registration successful!';
    } else {
      elemError.innerHTML = `Registration failed: <pre>${JSON.stringify(verificationJSON)}</pre>`;
    }
  } catch (error) {
    // Tangani error dari proses registrasi
    if (error.name === 'InvalidStateError') {
      elemError.innerText = 'Error: Authenticator was probably already registered by user';
    } else {
      elemError.innerText = `Unexpected error: ${error.message}`;
    }
  }
});

function uint8ArrayToBase64Url(uint8Array) {
  return btoa(String.fromCharCode(...uint8Array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64urlToBase64(base64url) {
  return base64url.replace(/-/g, '+').replace(/_/g, '/');
}