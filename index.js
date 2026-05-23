// const dns = require('node:dns');
// dns.setServers(['8.8.8.8', '8.8.4.4']);
const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const { ObjectId } = require('mongodb');
dotenv.config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express()
const port = process.env.PORT || 7000
const uri = process.env.MONGODB_URI;

app.use(cors())
app.use(express.json())

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let roomsCollection;
let bookingsCollection;

async function connectDB() {
  try {
    await client.connect();
    const db = client.db('studynook');
    roomsCollection = db.collection('rooms');
    bookingsCollection = db.collection('bookings');
    await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB!");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/rooms', async (req, res) => {
  try {
    const result = await roomsCollection.find().toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
})

app.get('/rooms/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await roomsCollection.findOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
})
app.post('/rooms', async (req, res) => {
  try {
    const newRoom = req.body;
    const result = await roomsCollection.insertOne(newRoom);
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
})

app.post('/bookings', async (req, res) => {
  try {
    const newRoom = req.body;
    const result = await bookingsCollection.insertOne(newRoom);
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
})



app.put('/rooms/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const updatedRoom = req.body;
    const result = await roomsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedRoom }
    );
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
})

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`)
  })
})
