import mongoose from 'mongoose';

const quizAttemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  answers: [{ questionIndex: Number, selectedIndex: Number }],
  score: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  passed: { type: Boolean, required: true },
}, { timestamps: true });

export default mongoose.model('QuizAttempt', quizAttemptSchema);
