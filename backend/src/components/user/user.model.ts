import mongoose from 'mongoose';
import { IUser } from './user.interface';

const userSchema = new mongoose.Schema<IUser>({
  address: {
    type: String,
    unique: true,
    dropDups: true,
  },
  signature: { type: String },
  twitterId: {
    type: String,
    required: [true, 'Twitter is required!'],
    unique: true,
    dropDups: true,
  },
  approved: { type: Boolean, default: false },
});

const UserModel = mongoose.model<IUser>('User', userSchema);

// eslint-disable-next-line import/prefer-default-export
export { UserModel };
