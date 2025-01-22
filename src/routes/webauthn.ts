import express, { Request, Response, NextFunction } from 'express';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import prisma from '../prisma';
import { Credential } from '@prisma/client';


const router = express.Router();
const rpName = 'Simple WebAuthn Example';
let rpID = '';
let origin = ``;

router.use((req: Request, res: Response, next: NextFunction) => {
  rpID = `${req.get('host')}`;
  origin = `https://${rpID}`;
  next();
});

// 1. Generate Registration Options
router.get('/generate-registration-options', async (req: any, res: any) => {
  const username = req.query.username as string;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  let user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    user = await prisma.user.create({ data: { username } });
  }

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

  await prisma.user.update({
    where: { id: user.id },
    data: { currentChallenge: options.challenge },
  });

  res.json(options);
});

// 2. Verify Registration Response
router.post('/verify-registration', async (req: any, res: any) => {
  const { username, response } = req.body;

  const user = await prisma.user.findUnique({
    where: { username },
    include: { credentials: true },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  try {
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: user.currentChallenge!,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (verification.verified && verification.registrationInfo) {
      const { credential } = verification.registrationInfo;
      const { id: credentialID, publicKey: credentialPublicKey, counter } = credential;

      await prisma.credential.create({
        data: {
          userId: user.id,
          credentialId: credentialID,
          publicKey: Buffer.from(credentialPublicKey).toString('base64url'),
          counter,
        },
      });

      return res.json({ verified: true });
    } else {
      return res.status(400).json({ error: 'Verification failed' });
    }
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message });
  }
});

// 3. Generate Authentication Options
router.get('/generate-authentication-options', async (req: any, res: any) => {
  const username = req.query.username as string;

  const user = await prisma.user.findUnique({
    where: { username },
    include: { credentials: true },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: user.credentials.map((cred: Credential) => ({
      id: cred.credentialId,
      type: 'public-key',
    })),
    userVerification: 'preferred',
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { currentChallenge: options.challenge },
  });

  res.json(options);
});

// 4. Verify Authentication Response
router.post('/verify-authentication', async (req: any, res: any) => {
  const { username, response } = req.body;

  const user = await prisma.user.findUnique({
    where: { username },
    include: { credentials: true },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const authenticator = user.credentials.find((cred: Credential) => cred.credentialId === response.rawId);
  if (!authenticator) {
    return res.status(400).json({ error: 'Authenticator not found' });
  }

  try {
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: user.currentChallenge!,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: authenticator.credentialId,
        publicKey: Buffer.from(authenticator.publicKey, 'base64url'),
        counter: authenticator.counter,
      },
    });

    if (verification.verified) {
      await prisma.credential.update({
        where: { credentialId: authenticator.credentialId },
        data: { counter: verification.authenticationInfo.newCounter },
      });

      return res.json({ verified: true });
    } else {
      return res.status(400).json({ error: 'Verification failed' });
    }
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message });
  }
});

export default router;
