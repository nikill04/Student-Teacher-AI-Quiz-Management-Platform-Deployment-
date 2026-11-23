import mongoose from 'mongoose';

// Structure of a User document
const userSchema = new mongoose.Schema({
  name: String,

  // "unique: true" also creates an index, so finding users by email is fast
  email: { type: String, unique: true },

  // Hashed password (NEVER store plain passwords!)
  password: String,

  // Either 'student' or 'teacher'
  role: { type: String, enum: ['student', 'teacher'], default: 'student' },

  // Batches this user belongs to (list of Batch ids)
  batches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Batch' }],
});

const User = mongoose.model('User', userSchema);
export default User;

/*
Example User document:
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  name: "John Doe",
  email: "john@example.com",
  password: "$2a$10$hashedpassword...",
  role: "student",
  batches: [ObjectId("507f191e810c19729de860ea")]
}

To get full batch details instead of ids:
  const user = await User.findById(userId).populate('batches');
*/
