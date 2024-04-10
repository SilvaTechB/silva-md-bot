  
  const mongoose = require('mongoose');  
  const TempDb = new mongoose.Schema({
  id: { type: String,  unique: true ,required: true, default:"Suhail_Md"},
  data : { type: Object, default: {} } });  
  const dbtemp = mongoose.model("dbtemp", TempDb)
  module.exports = { dbtemp }
  