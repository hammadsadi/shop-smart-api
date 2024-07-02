const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// Init Express
const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "https://smart-shop-ca369.web.app"],
    credentials: true,
  })
);
app.use(cookieParser());

const tokenVerify = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).send("Unauthorized Access");
  }
  if (token) {
    jwt.verify(token, process.env.SCRET_KEY, (err, decode) => {
      if (err) {
        return res.status(401).send("Unauthorized Access");
      }
      req.user = decode;
      next();
    });
  }
};

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
    // Collections
    const queriesCollection = client.db("queriesDB").collection("queries");
    const recommendationCollection = client
      .db("queriesDB")
      .collection("recommendations");

    // Token Related Api
    app.post("/jwt", (req, res) => {
      const email = req.body;
      const token = jwt.sign(email, process.env.SCRET_KEY, {
        expiresIn: "365d",
      });

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    // Clear Token
    app.post("/cookie-clear", (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          maxAge: 0,
        })
        .send({ success: true });
    });
    // Create Queries
    app.post("/queries", tokenVerify, async (req, res) => {
      const queryData = req.body;
      const result = await queriesCollection.insertOne(queryData);
      res.send(result);
    });

    // Get All Queries
    app.get("/queries", async (req, res) => {
      const search = req.query.search;
      const query = search
        ? {
            productName: { $regex: search, $options: "i" },
          }
        : {};
      const options = {
        // Sort returned documents in ascending order by title (A->Z)
        sort: { "user.date": -1 },
      };
      // const query = {};
      const result = await queriesCollection.find(query, options).toArray();
      res.send(result);
    });

    // Get Single Queries
    app.get("/queries/:id", tokenVerify, async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await queriesCollection.findOne(query);
      res.send(result);
    });

    // Get User Added Query
    app.get("/user-query/:email", tokenVerify, async (req, res) => {
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
    app.put("/update-query/:id", tokenVerify, async (req, res) => {
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
    app.delete("/delete-query/:id", tokenVerify, async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await queriesCollection.deleteOne(query);
      res.send(result);
    });

    // Create Recommendation
    app.post("/recommendation", tokenVerify, async (req, res) => {
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
    app.get("/recommendation/:id", tokenVerify, async (req, res) => {
      const { id } = req.params;
      const filter = { queryId: id };
      const result = await recommendationCollection.find(filter).toArray();
      res.send(result);
    });

    // Get My Recommendation
    app.get("/my-recommendation/:email", tokenVerify, async (req, res) => {
      const { email } = req.params;

      const filter = { recommenderEmail: email };
      const result = await recommendationCollection.find(filter).toArray();
      res.send(result);
    });

    // Delete My Recommendation
    app.delete("/delete-recommendation/:id", tokenVerify, async (req, res) => {
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

    // Get All User Recommendations
    app.get(
      "/get-all-users-recommendations/:email",
      tokenVerify,
      async (req, res) => {
        const { email } = req.params;
        const result = await recommendationCollection
          .find({ recommenderEmail: { $ne: email } })
          .toArray();
        res.send(result);
      }
    );

    // Get All Trending Query
    app.get("/trending-queries", async (req, res) => {
      const result = await recommendationCollection.find().toArray();
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
