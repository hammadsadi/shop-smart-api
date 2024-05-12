const express = require("express");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// Init Express
const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

// MongoDB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@syedsadibd.a5hvdhf.mongodb.net/?retryWrites=true&w=majority&appName=syedsadibd`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });

    // Collections
    const queriesCollection = client.db("queriesDB").collection("queries");
    const recommendationCollection = client
      .db("queriesDB")
      .collection("recommendations");

    // Create Queries
    app.post("/queries", async (req, res) => {
      const queryData = req.body;
      const result = await queriesCollection.insertOne(queryData);
      res.send(result);
    });

    // Get All Queries
    app.get("/queries", async (req, res) => {
      const options = {
        // Sort returned documents in ascending order by title (A->Z)
        sort: { "user.date": -1 },
      };
      const query = {};
      const result = await queriesCollection.find(query, options).toArray();
      res.send(result);
    });

    // Get Single Queries
    app.get("/queries/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await queriesCollection.findOne(query);
      res.send(result);
    });

    // Get User Added Query
    app.get("/user-query/:email", async (req, res) => {
      const { email } = req.params;
      const options = {
        // Sort returned documents in ascending order by title (A->Z)
        sort: { "user.date": -1 },
      };
      const query = { "user.email": email };
      const result = await queriesCollection.find(query, options).toArray();
      res.send(result);
    });

    // Update Query
    app.put("/update-query/:id", async (req, res) => {
      const { id } = req.params;
      const updateData = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          ...updateData,
        },
      };
      const result = await queriesCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // Delete Own Query
    app.delete("/delete-query/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await queriesCollection.deleteOne(query);
      res.send(result);
    });

    // Create Recommendation
    app.post("/recommendation", async (req, res) => {
      const recommendatioData = req.body;

      const updateRecommentCount = await queriesCollection.updateOne(
        { _id: new ObjectId(recommendatioData.queryId) },
        { $inc: { recommendationCount: 1 } }
      );

      const result = await recommendationCollection.insertOne(
        recommendatioData
      );
      res.send(result);
    });
    // All Recommendation
    app.get("/recommendation/:id", async (req, res) => {
      const { id } = req.params;
      const filter = { queryId: id };
      const result = await recommendationCollection.find(filter).toArray();
      res.send(result);
    });

    // Get My Recommendation
    app.get("/my-recommendation/:email", async (req, res) => {
      const { email } = req.params;
      const filter = { recommenderEmail: email };
      const result = await recommendationCollection.find(filter).toArray();
      res.send(result);
    });

    // Delete My Recommendation
    app.delete("/delete-recommendation/:id", async (req, res) => {
      const { id } = req.params;
      const { queryId } = req.query;
      const updateRecommentCount = await queriesCollection.updateOne(
        { _id: new ObjectId(queryId) },
        { $inc: { recommendationCount: -1 } }
      );

      const filter = { _id: new ObjectId(id) };
      const result = await recommendationCollection.deleteOne(filter);

      res.send(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello");
});

// Listen Server
app.listen(port, () => {
  console.log(`Server is Running On PORT ${port}`);
});
