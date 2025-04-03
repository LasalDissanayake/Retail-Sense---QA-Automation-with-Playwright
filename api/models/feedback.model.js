import mongoose from 'mongoose';
import mongooseSequence from 'mongoose-sequence'; // Import mongoose-sequence

const connection = mongoose.connection; // Get mongoose connection


const feedbackSchema = new mongoose.Schema({
  userID: { type: Number},
  feedbackID: { type: Number, unique: true },
  // productID: { type: String, required: true },
  rating: { type: String, required: true},
  comment: { type: String},
  // orderID: { type: String , required: true},
});
feedbackSchema.plugin(mongooseSequence(connection), { inc_field: 'feedbackID', start_seq: 1 });

const feedback = mongoose.model('feedback', feedbackSchema);

export default feedback;

