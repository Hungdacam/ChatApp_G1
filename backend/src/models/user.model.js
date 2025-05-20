const mongoose = require('mongoose');

const userShema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      unique: true,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
      select:false
    },
    avatar: {
      type: String,
      default: "",
    },
    dob: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["Nam", "Nữ"],
    },
    createAt: {
      type: Date,
      default: Date.now
    }
  });
const User = mongoose.model('user',userShema);

module.exports = User
