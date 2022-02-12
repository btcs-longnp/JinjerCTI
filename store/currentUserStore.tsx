import { atom } from 'recoil';
import User, { newUser } from '../models/user/User';

export const currentUserState = atom<User>({
  key: 'currentUserState',
  default: newUser('dummy_id', 'Agent', '100007', '0000'),
});
