import mongoose from 'mongoose';
import mongooseSequence from 'mongoose-sequence'; // Import mongoose-sequence

const connection = mongoose.connection; // Get mongoose connection

const userSchema = new mongoose.Schema({
  userID: { type: Number, unique: true },
  UserName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  address: { type: String },
  mobile: { type: Number, required: true },
  role: {
    type: String,
    enum: ["admin", "customer"],
    default: "customer",
  },
});

// Auto-increment plugin
userSchema.plugin(mongooseSequence(connection), { inc_field: 'userID', start_seq: 1 });

const User = mongoose.model('User', userSchema);
export default User;
