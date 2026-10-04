import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, minlength: 6, select: false },
  name: { type: String, default: '' },
  collegeName: { type: String, default: '' },
  yearOfStudy: { type: String, default: '' },
  selectedLanguage: { type: String, enum: ['python', 'java', 'cpp', 'javascript'], default: null },
  assignedLevel: { type: String, enum: ['beginner', 'intermediate', 'expert'], default: null },
  assessmentCompleted: { type: Boolean, default: false },
  assessmentScore: { type: Number, default: null },
  isBlocked: { type: Boolean, default: false },
  levelProgress: [{
    level: { type: String, enum: ['beginner', 'intermediate', 'expert'] },
    modulesCompleted: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Module' }],
    quizzesPassed: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }],
    finalTestPassed: { type: Boolean, default: false },
    finalTestScore: { type: Number, default: null },
    averageQuizScore: { type: Number, default: null },
  }],
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);
