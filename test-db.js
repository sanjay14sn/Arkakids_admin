const mongoose = require('mongoose');
const { Schema, model } = mongoose;

mongoose.connect('mongodb+srv://idealplayabacus20_db_user:Sanjay14@cluster0.8j0zt2f.mongodb.net/arka_kids?retryWrites=true&w=majority&appName=Cluster0')
  .then(async () => {
    const journalSchema = new Schema({}, { strict: false });
    const Journal = mongoose.models.Journal || model('Journal', journalSchema);
    
    const studentSchema = new Schema({}, { strict: false });
    const Student = mongoose.models.Student || model('Student', studentSchema);

    const journals = await Journal.find({}, { className: 1, title: 1, _id: 1, content: 1 }).lean();
    console.log("Journals:", JSON.stringify(journals, null, 2));

    const students = await Student.find({}, { name: 1, className: 1, parentPhone: 1, _id: 1 }).lean();
    console.log("Students:", JSON.stringify(students, null, 2));

    mongoose.disconnect();
  });
