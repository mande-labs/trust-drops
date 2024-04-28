import { Request, Response } from 'express';
import httpStatus from 'http-status';
import {
  create,
  read,
  readByTwitterId,
  readById,
  update,
  isSignatureValid,
  queueApproval,
  authClient
} from '@components/user/user.service';
import { Client, auth } from 'twitter-api-sdk';
import { IUser, IUpdateUser } from '@components/user/user.interface';
import config from '@config/config';
const STATE = 'trustdrops';
const CODE_CHALLENGE= 'challenge';

const readUser = async (req: Request, res: Response) => {
  res.status(httpStatus.OK);
  res.send({ message: 'Read', output: await read(req.params.address) });
};

const getUserOauthUrl = async (req: Request, res: Response) => {
  const authUrl = authClient.generateAuthURL({
    state: STATE,
    code_challenge_method: 'plain',
    code_challenge: CODE_CHALLENGE
  });
  res.send({ url: authUrl });
};

const twitterCallback = async (req: Request, res: Response) => {
  const { code, state } = req.query;
  if (state !== STATE) return res.status(500).send("State isn't matching");

  const authClientLocal = new auth.OAuth2User({
    client_id: config.twitterClientId as string,
    client_secret: config.twitterClientSecret as string,
    callback: `${config.baseApiUrl}callback`,
    scopes: ['tweet.read', 'users.read'],
  });
  authClientLocal.generateAuthURL({
    state: STATE,
    code_challenge_method: 'plain',
    code_challenge: CODE_CHALLENGE
  });
  await authClientLocal.requestAccessToken(code as string);
  const twitterClientLocal = new Client(authClientLocal);
  const userData = await twitterClientLocal.users.findMyUser();
  console.log('userData - ', userData);

  const user = {
    twitterId: userData.data.id,
  } as IUser;
  let createdUser;
  const dbUser = await readByTwitterId(userData.data.id);
  try {
    if (!dbUser) {
      createdUser = await create(user);
    } else {
      createdUser = dbUser;
    }
  } catch (err) {
    res.status(httpStatus.BAD_REQUEST).send({ message: 'Twitter auth failed, please try again!' });
    return;
  }
  res.redirect(`${config.uiEndpoint}/airdrop?userId=${createdUser.id}`);
};

const queueTest = async (req: Request, res: Response) => {
  const user = {
    address: (Math.random() + 1).toString(36).substring(7),
    signature: (Math.random() + 1).toString(36).substring(7),
    twitterId: (Math.random() + 1).toString(36).substring(7),
  } as IUser;
  await create(user);
  queueApproval(user);
  res.send({ message: 'queued' });
};

const linkUserTwitter = async (req: Request, res: Response) => {
  // try {
    const { userId, address, signature } = req.body;
    console.log(req.body);

    if (!isSignatureValid(address as string, signature as string)) {
      return res.send({ error: 'Signature invalid!' });
    }

    const user = await readById(userId);

    if (!user) {
      res.status(httpStatus.BAD_REQUEST).send({ message: 'Invalid request , please try again!' });
      return;
    }

    // try {
      if (user.approved) {
        res.status(httpStatus.BAD_REQUEST).send({ message: 'Twitter already linked to some other account!' });
      }
    
      await update(user, {address, signature} as IUpdateUser);
      queueApproval(user);
    // } catch (err) {
    //   res.status(httpStatus.BAD_REQUEST).send({ message: 'Could not link, please try again!' });
    //   return;
    // }


    res.status(httpStatus.OK);
    res.send({ message: 'Linked' });
  // } catch (error) {
  //   console.log(error);
  //   res.send({ error });
  // }
};

export {
  readUser,
  getUserOauthUrl,
  twitterCallback,
  linkUserTwitter,
  queueTest,
};
