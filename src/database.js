const {MongoClient} = require('mongodb');

// MongoDB connection URL
const mongoURL = 'mongodb://localhost:27017/NodeJSMusicBot';


// Database Name
const mongoClient = new MongoClient(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true });
/** @type {Db | null} */
let db = null;

module.exports = {
	async connect() {
		try {
			await mongoClient.connect();
			db = mongoClient.db();
			console.log("Connected successfully to server");
		}
		catch(e) {
			console.error('Cannot connect to server, reason: ' + e)
		}
	},
	
	/**
	 @param {string} collectionName
	 @param {Object} params
	 */
	async mongoInsertDocuments(collectionName, params) {
	    // Get the documents collection
	    const collection = db.collection(collectionName);
	    // Insert some documents
		try {
			await collection.insertMany([
				params
			]);
			console.log('Inserted document into the collection');
		}
		catch(err) {
			console.error(err);
		}
	    /*, function(err) {
	        if(err !== null) {
	            console.error(err)
	        } else {
	            console.log('Inserted document into the collection');
	        }
	    });*/
	},
	
	/**
	 @param {string} collectionName
	 @param {Object} params
	 */
	mongoFindOne(collectionName, params)  {
	    // Get the documents collection
	    const collection = db.collection(collectionName);
	    // Find some documents
	    return collection.findOne(params);
	},
	
	/**
	 @param {string} collectionName
	 @param {Object} params
	 */
	mongoFind(collectionName, params) {
	    // Get the documents collection
	    const collection = db.collection(collectionName);
	    // Find some documents
	    return collection.find(params).toArray();
	},
	
	/**
	 @param {string} collectionName
	 @param {Object} filter
	 @param {Object} update
	 */
	async mongoUpdateDocument(collectionName, filter, update) {
	    // Get the documents collection
	    const collection = db.collection(collectionName);

	    try {
		    await collection.updateOne(filter, {$set: update});
		    console.log('Updated the document');
	    }
	    catch(err) {
	    	console.error(err);
	    }
	}
};