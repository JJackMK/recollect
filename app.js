const path = require("path");
const express = require("express");
const connection = require("./connection.js");
const bcrypt = require("bcrypt");
const session = require("express-session");
const cookieParser = require('cookie-parser');

const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));

app.listen(process.env.PORT || 3000);
console.log(" Server is listenin//localhost:3000/ ");

const oneHour = 1000 * 60 * 60;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    secret: "your-session-secret",
    saveUninitialized: true,
    cookie: { maxAge: oneHour },
    resave: false,
  })
);

const apiRoutes = require('./routes/api');

app.use('/api', apiRoutes);

app.get("/", (req, res) => {
  if (req.session.userId) {
    res.render("index", { userId: req.session.userId });
  } else {
    res.render("index");
  }
});

app.get("/collection/:id", (req, res) => {
  res.render("collection");
});


app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const query = "SELECT * FROM user WHERE username = ?";
  connection.query(query, [username], async (err, results) => {
    if (err) throw err;

    if (results.length === 0) {
      res.status(401).send("Invalid username or password");
      return;
    }

    const user = results[0];
    const isPasswordValid = await bcrypt.compare(password, user.user_password);

    if (!isPasswordValid) {
      res.status(401).send("Invalid username or password");
      return;
    }

    req.session.userId = user.user_id;
    res.redirect("/");
  });
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) throw err;
    res.redirect("/");
  });
});

app.get("/signup", (req, res) => {
  res.render("sign-up");
});

app.post("/signup", async (req, res) => {
  const { first_name, surname, email, username, password } = req.body;

  // Hash the password using bcrypt
  const saltRounds = 10;
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const query = `
      INSERT INTO user (first_name, surname, user_email, username, user_password)
      VALUES (?, ?, ?, ?, ?);
    `;
    connection.query(query, [first_name, surname, email, username, hashedPassword], (err, result) => {
      if (err) {
        // Handle the error (e.g., show an error message or render an error page)
        console.error(err);
        res.status(500).send("An error occurred while signing up.");
      } else {
        // Redirect to the login page or another page after successful sign up
        res.redirect("/");
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while hashing the password.");
  }
});

app.get("/explore", (req, res) => {
  const query = "SELECT * FROM genre";
  connection.query(query, (err, genres) => {
    if (err) throw err;
    res.render("explore", { genres });
  });
});

app.get("/api/search/collections", (req, res) => {
  const { query, genre } = req.query;
  const searchQuery = `%${query}%`;

  const baseQuery = `
    SELECT collection.collection_id, collection.collection_name, user.username
    FROM collection
    JOIN user ON collection.user_id = user.user_id
  `;

  const genreFilter = genre
    ? `JOIN collection_genre ON collection.collection_id = collection_genre.collection_id
       JOIN genre ON collection_genre.genre_id = genre.genre_id
       WHERE genre.genre_name = ?`
    : "";

  const searchFilter = `
  ${genre ? "AND" : "WHERE"} collection.collection_name LIKE ?
  `;

  const finalQuery = `${baseQuery} ${genreFilter} ${searchFilter}`;

  const queryParams = genre ? [genre, searchQuery] : [searchQuery];
  
  connection.query(finalQuery, queryParams, (err, collections) => {
    if (err) throw err;
    res.json(collections);
  });
});

app.get("/api/search/records", (req, res) => {
  const { query, genre } = req.query;
  const searchQuery = `%${query}%`;

  const baseQuery = `
    SELECT record.record_id, record.record_name, record.record_label, record.release_date, record.record_artwork
    FROM record
  `;

  const genreFilter = genre
    ? `JOIN record_genre ON record.record_id = record_genre.record_id
       JOIN genre ON record_genre.genre_id = genre.genre_id
       WHERE genre.genre_name = ?`
    : "";

  const searchFilter = `
  ${genre ? "AND" : "WHERE"} record.record_name LIKE ?
  `;

  const finalQuery = `${baseQuery} ${genreFilter} ${searchFilter}`;

  const queryParams = genre ? [genre, searchQuery] : [searchQuery];

connection.query(finalQuery, queryParams, (err, records) => {
    if (err) throw err;
    res.json(records);
  });
});

app.get("/api/search/tracks", (req, res) => {
  const { query, genre } = req.query;
  const searchQuery = `%${query}%`;

  const baseQuery = `
    SELECT track.track_id, track.track_name, track.track_duration, record.record_id
    FROM track
    JOIN record ON track.record_id = record.record_id
  `;

  const genreFilter = genre
    ? `JOIN record_genre ON record.record_id = record_genre.record_id
       JOIN genre ON record_genre.genre_id = genre.genre_id
       WHERE genre.genre_name = ?`
    : "";

  const searchFilter = `
  ${genre ? "AND" : "WHERE"} track.track_name LIKE ?
  `;

  const finalQuery = `${baseQuery} ${genreFilter} ${searchFilter}`;

const queryParams = genre ? [genre, searchQuery] : [searchQuery];

connection.query(finalQuery, queryParams, (err, tracks) => {
    if (err) throw err;
    res.json(tracks);
  });
});

app.get("/record/:record_id", (req, res) => {
  const { record_id } = req.params;

  const fetchRecordById = (record_id) => {
    return new Promise((resolve, reject) => {
      connection.query("SELECT * FROM record WHERE record_id = ?", [record_id], (err, results) => {
        if (err) reject(err);
        if (results === undefined || results.length === 0) {
          resolve(null);
        } else {
          resolve(results[0]);
        }      });
    });
  };
  
  const fetchArtistByRecordId = (record_id) => {
    return new Promise((resolve, reject) => {
      connection.query(`
        SELECT artist.* FROM artist
        JOIN record_artist ON artist.artist_id = record_artist.artist_id
        JOIN record ON record_artist.record_id = record.record_id
        WHERE record.record_id = ?`, [record_id], (err, results) => {
        if (err) reject(err);
        if (results === undefined || results.length === 0) {
          resolve(null);
        } else {
          resolve(results[0]);
        }
      });
    });
  };
  
  const fetchTracksByRecordId = (record_id) => {
    return new Promise((resolve, reject) => {
      connection.query("SELECT * FROM track WHERE record_id = ? ORDER BY track_id", [record_id], (err, results) => {
        if (err) reject(err);
        if (results === undefined || results.length === 0) {
          resolve(null);
        } else {
          resolve(results);
        }
      });
    });
  };
  

  Promise.all([
    fetchRecordById(record_id),
    fetchArtistByRecordId(record_id),
    fetchTracksByRecordId(record_id),
  ])
    .then(([record, artist, tracks]) => {
      if (!record || !artist) {
        console.error("Error: Record or artist not found");
        // You can render a custom error page or redirect to another page
        res.status(404).send("Record or artist not found");
        return;
      }

      res.render("record", { record, artist, tracks });
    })
    .catch((err) => {
      console.error("Error occurred while fetching data:", err);
      // You can render a custom error page or redirect to another page
      res.status(500).send("An error occurred while fetching data");
    });
});

app.get("/artist/:artist_id", (req, res) => {
  const { artist_id } = req.params;
  
  const fetchArtistById = (artist_id) => {
    return new Promise((resolve, reject) => {
      connection.query("SELECT * FROM artist WHERE artist_id = ?", [artist_id], (err, results) => {
        if (err) reject(err);
        if (results === undefined || results.length === 0) {
          resolve(null);
        } else {
          resolve(results[0]);
        }
      });
    });
  };

  const fetchRecordsByArtistId = (artist_id) => {
    return new Promise((resolve, reject) => {
      connection.query(`
        SELECT record.* FROM record
        JOIN record_artist ON record.record_id = record_artist.record_id
        WHERE record_artist.artist_id = ?`, [artist_id], (err, results) => {
        if (err) reject(err);
        if (results === undefined || results.length === 0) {
          resolve(null);
        } else {
          resolve(results);
        }
      });
    });
  };
  
  Promise.all([
    fetchArtistById(artist_id),
    fetchRecordsByArtistId(artist_id),
  ])
    .then(([artist, records]) => {
      if (!artist) {
        res.status(404).send("Artist not found");
        return;
      }

      res.render("artist", { artist, records });
    })
    .catch((err) => {
      console.error("Error occurred while fetching data:", err);
      res.status(500).send("An error occurred while fetching data");
    });
});

