require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectID = require('mongodb').ObjectId;


// Middleware
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 5000;

// database Connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.1eg3a.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function verifyJwtToken(req, res, next) {
  if (req.headers?.authorization?.startsWith('Bearer ')) {
    const jwt = req.headers.authorization.split(' ')[1];
    try {
      const decodedUser = await admin.auth().verifyIdToken(jwt);
      req.decodedEmail = decodedUser.email;
    } catch { }
  }

  next();
}



async function run() {
  try {
    client.connect();
    const database = client.db(`${process.env.DB_NAME}`);
    const billCollection = database.collection('bills');
    const userLogin = database.collection('users');
    const userRegistration = database.collection('users');


    // GET ALL BILLS
    app.get('/billing-list', async (req, res) => {
      // backend pagination
      const perPage = 10;
      const total = await billCollection.countDocuments();
      const totalPages = Math.ceil(total / perPage);
      const page = req.query.page || 1;
      const skip = (page - 1) * perPage;
      // const bills = await billCollection.find().skip(skip).limit(perPage).toArray();
      const bill = await billCollection.find({}).skip(skip).limit(perPage).sort({ _id: -1 });
      const bills = await bill.toArray();
      res.json([bills, totalPages]);
    });


    // USER REGISTRATION WITH TOKEN
    app.post('/registration', async (req, res) => {
      const { email, password } = req.body;
      const user = { email, password };
      const result = await userRegistration.insertOne(user);
      res.json(result);
    });


    // LOGIN USER WITH TOKEN 
    app.post('/login', async (req, res) => {
      const { email, password } = req.body;
      const user = { email, password };
      const result = await userLogin.findOne(user);
      res.json(result);
    });


    // POST A BILL
    app.post('/add-billing', async (req, res) => {
      const result = await billCollection.insertOne(req.body);
      res.json(result);
    });

    // Update A BILL
    // app.put('/update-billing/:id', async (req, res) => {
    //   const result = await billCollection.updateOne({ _id: ObjectID(req.params.id) }, { $set: req.body });
    //   res.json(result);
    //   console.log(result);
    // });




    // DELETE A BILLING
    app.delete('/delete-billing/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectID(id) };
      const result = await billCollection.deleteOne(query);
      res.json(result);
    });

  } catch (err) {
    console.log(err);
  }finally{
    // client.close();
  }
}

run().catch(console.dir);




app.get('/', (req, res) => res.send('Welcome to Billing Ninja Server'));
app.listen(port, () => console.log(`Server Running on localhost:${port}`));