// database.js
const connection = require('./connection.js');


async function fetchTopCollections() {
    const query = `
      SELECT collection.collection_id, collection.collection_name, user.username, COALESCE(AVG(collection_review.stars_rating_id), 0) as avg_rating, GROUP_CONCAT(record.record_artwork ORDER BY collection_record.collection_record_id SEPARATOR ',') as record_artworks
      FROM collection
      JOIN user ON collection.user_id = user.user_id
      LEFT JOIN collection_review ON collection.collection_id = collection_review.collection_id
      JOIN collection_record ON collection.collection_id = collection_record.collection_id
      JOIN record ON collection_record.record_id = record.record_id
      GROUP BY collection.collection_id
      LIMIT 3;
    `;
    
    return new Promise((resolve, reject) => {
      connection.query(query, (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });
  }
  
async function fetchUsernameByUserId(userId) {
    const query = 'SELECT username FROM user WHERE user_id = ?';
    
    return new Promise((resolve, reject) => {
      connection.query(query, [userId], (err, result) => {
        if (err) reject(err);
        resolve(result[0].username);
      });
    });
}

async function fetchArtists() {
    
}

async function fetchRecordsByArtistId() {
    
}

async function fetchRecordById() {
    
}

async function fetchTracksByRecordId() {
    
}

async function fetchUserByUsername(username) {
    const query = "SELECT * FROM user WHERE username = ?";
    
    return new Promise((resolve, reject) => {
      connection.query(query, [username], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0]);
        }
      });
    });
  }
  
function fetchCollection(collectionId, callback) {
    const query = `
      SELECT collection.collection_id, collection.collection_name, user.username, record.record_id, record.record_name, record.record_artwork as artwork, artist.artist_name
      FROM collection
      JOIN user ON collection.user_id = user.user_id
      JOIN collection_record ON collection.collection_id = collection_record.collection_id
      JOIN record ON collection_record.record_id = record.record_id
      JOIN record_artist ON record.record_id = record_artist.record_id
      JOIN artist ON record_artist.artist_id = artist.artist_id
      WHERE collection.collection_id = ?;
    `;
  
    connection.query(query, [collectionId], (err, records) => {
      if (err) {
        return callback(err, null);
      }
  
      if (records.length > 0) {
        const collection = {
          collection_id: records[0].collection_id,
          collection_name: records[0].collection_name,
          username: records[0].username,
          records: records.map((record) => ({
            record_id: record.record_id,
            record_name: record.record_name,
            artwork: record.artwork,
            artist_name: record.artist_name,
          })),
        };
  
        callback(null, collection);
      } else {
        callback(null, null);
      }
    });
  }

module.exports = {
    // ...
    fetchTopCollections,
    fetchUsernameByUserId,
    fetchCollection,
  };
  