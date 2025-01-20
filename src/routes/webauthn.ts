import express from 'express';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { User } from '../types/user';

const router = express.Router();

// Simulated in-memory user storage
const users: Record<string, User> = {};

// Relying Party configuration
const rpName = 'Simple WebAuthn Example';
const rpID = 'feda-2001-448a-2020-2c65-79-6b39-fae3-f7d0.ngrok-free.app';
const origin = `https://${rpID}`;

// 1. Generate Registration Options
router.get('/generate-registration-options', async (req: any, res: any) => {
  // const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const username = req.query.username as string;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const user = users[username] || { id: username, username, credentials: [] };
  users[username] = user;

  // Konversi userID menjadi Uint8Array
  const userID = Buffer.from(user.id, 'utf-8');

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID,
    userName: user.username,
    attestationType: 'direct',
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  });

  user.currentChallenge = options.challenge;
  res.json(options);
});

// 2. Verify Registration Response
router.post('/verify-registration', async (req: any, res: any) => {
  const { username, response } = req.body;
  const user = users[username];
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  try {
    console.log('mantulttt');
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: user.currentChallenge!,
      expectedOrigin:origin,
      expectedRPID: rpID,
    });
    console.log('mantul',verification);
    if (verification.verified && verification.registrationInfo) {
      const { credential } = verification.registrationInfo;
      const { id: credentialID, publicKey: credentialPublicKey, counter } = credential;

      // Simpan data yang sudah dalam format Base64URL
      user.credentials.push({
        credentialID, // Sudah Base64URL
        publicKey: Buffer.from(credentialPublicKey).toString('base64url'),
        counter,
      });

      users[username] = user;
      return res.json({ verified: true });
    } else {
      return res.status(400).json({ error: 'Verification failed' });
    }
  } catch (err) {
    console.log('err', err);
    return res.status(400).json({ error: (err as Error).message });
  }
});

// 3. Generate Authentication Options
router.get('/generate-authentication-options', async (req: any, res: any) => {
  const username = req.query.username as string;
  const user = users[username];
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: user.credentials.map((cred) => ({
      id: cred.credentialID,
      type: 'public-key',
    })),
    userVerification: 'preferred',
  });

  user.currentChallenge = options.challenge;
  res.json(options);
});

// 4. Verify Authentication Response
router.post('/verify-authentication', async (req: any, res: any) => {
  const { username, response } = req.body;
  const user = users[username];
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  try {
    console.log(user.credentials);
    console.log(response);
    const authenticator = user.credentials.find((cred) => cred.credentialID === response.rawId);
    if (!authenticator) {
      return res.status(400).json({ error: 'Authenticator not found' });
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: user.currentChallenge!,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: Buffer.from(authenticator.credentialID, 'base64url').toString(),
        publicKey: Buffer.from(authenticator.publicKey, 'base64url'),
        counter: authenticator.counter,
      },
    });

    if (verification.verified) {
      authenticator.counter = verification.authenticationInfo.newCounter;
      return res.json({ verified: true });
    }
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message });
  }
});


export default router;
