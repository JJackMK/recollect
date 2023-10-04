const express = require('express');
const router = express.Router();
const database = require('../database');

// Import your database functions
const {
  fetchArtists,
  fetchRecordsByArtistId,
  fetchRecordById,
  fetchTracksByRecordId,
  fetchTopCollections,
  fetchUsernameByUserId,
  fetchCollection,
  fetchUserByUsername
} = require('../database');

// Define your API routes



// GET artists
router.get('/artists', async (req, res) => {
  // Call your fetchArtists function and return the result
});

// GET records by artist ID
router.get('/artist/:id/records', async (req, res) => {
  // Call your fetchRecordsByArtistId function and return the result
});

// GET record by ID
router.get('/record/:id', async (req, res) => {
  // Call your fetchRecordById function and return the result
});

// GET tracks by record ID
router.get('/record/:id/tracks', async (req, res) => {
  // Call your fetchTracksByRecordId function and return the result
});

// GET top collections
router.get('/top-collections', async (req, res) => {
    try {
      const topCollections = await fetchTopCollections();
      res.json(topCollections);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // GET username by user ID
  router.get('/user/:id/username', async (req, res) => {
    try {
      const userId = req.params.id;
      const username = await fetchUsernameByUserId(userId);
      res.json({ username });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });


router.get("/collection/:id", (req, res) => {
    const collectionId = req.params.id;
  
    database.fetchCollection(collectionId, (err, collection) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error fetching collection");
      }
  
      if (collection) {
        res.json(collection);
      } else {
        res.status(404).send("Collection not found");
      }
    });
});

router.post("/login", async (req, res) => {
    const { username, password } = req.body;
  
    fetchUserByUsername(username, async (err, user) => {
      if (err) throw err;
  
      if (!user) {
        res.status(401).send("Invalid username or password");
        return;
      }
  
      const isPasswordValid = await bcrypt.compare(password, user.user_password);
  
      if (!isPasswordValid) {
        res.status(401).send("Invalid username or password");
        return;
      }
  
      req.session.userId = user.user_id;
      res.redirect("/");
    });
  });
  
router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) throw err;
        res.redirect("/");
      });});

module.exports = router;
