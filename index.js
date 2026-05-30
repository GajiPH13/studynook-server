// const dns = require('node:dns');
// dns.setServers(['8.8.8.8', '8.8.4.4']);
const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const { ObjectId } = require('mongodb');
dotenv.config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');

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

const JWKS = createRemoteJWKSet(
  new URL('http://localhost:3000/api/auth/jwks')
)
const verifyJWT = async (req, res, next) => {
  const authHeader = req?.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'unauthorized access' });
  }
  const token = authHeader?.split(' ')[1];
  if (!token) {
    return res.status(401).send({ message: 'unauthorized access' });
  }
  // console.log(token);
  try {
    const { payload } = await jwtVerify(token, JWKS);
    console.log(payload);
    next();
  } catch (error) {
    return res.status(401).send({ message: 'unauthorized access' });
  }


};

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
    const limit = parseInt(req.query.limit) || 0;

    const query = roomsCollection.find();

    const result = limit > 0
      ? await query.limit(limit).toArray()
      : await query.toArray();

    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});
// Middleware
app.get('/rooms/:id', verifyJWT,
  async (req, res) => {
    try {
      const id = req.params.id;
      const result = await roomsCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  })

// myBookings endpoint
app.get('/my-bookings/:userId', verifyJWT, async (req, res) => {
  try {
    const userId = await req.params.userId;
    const result = await bookingsCollection.find({ userId: userId }).toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
})

// My listings endpoint
app.get('/my-listings/:userId', verifyJWT, async (req, res) => {
  try {
    const userId = await req.params.userId;
    const result = await roomsCollection.find({ userId: userId }).toArray();

    res.send(result);
    console.log(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
})

app.post('/rooms',verifyJWT, async (req, res) => {
  try {
    const newRoom = req.body;
    const result = await roomsCollection.insertOne(newRoom);
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
})
// Room Edit
app.patch('/rooms/:id',verifyJWT, async (req, res) => {
  try {
    const id = req.params.id;
    const updatedRoom = {...req.body};
    delete updatedRoom._id;
    const result = await roomsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedRoom }
    );
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
})


app.post('/bookings', verifyJWT, async (req, res) => {
  try {
    const newRoom = req.body;
    const result = await bookingsCollection.insertOne(newRoom);
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
})



app.patch('/bookings/:id',verifyJWT, async (req, res) => {
  try {
    const id = req.params.id;
    const updatedRoom = req.body;
    const result = await bookingsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedRoom }
    );
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
})

app.delete('/bookings/:id', verifyJWT, async (req, res) => {
  try {
    const id = req.params.id;
    const result = await bookingsCollection.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
})
app.delete('/rooms/:id', verifyJWT, async (req, res) => {
  try {
    const id = req.params.id;
    const result = await roomsCollection.deleteOne({ _id: new ObjectId(id) });
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
