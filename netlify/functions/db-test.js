const { MongoClient } = require("mongodb");

exports.handler = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: "MONGODB_URI not set" }),
    };
  }

  let client;
  try {
    client = new MongoClient(uri, { useUnifiedTopology: true });
    await client.connect();

    // Check available databases
    const admin = client.db().admin();
    const result = await admin.listDatabases();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Connected to MongoDB ✅",
        databases: result.databases.map((db) => db.name),
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "MongoDB connection failed ❌",
        error: err.message,
      }),
    };
  } finally {
    if (client) await client.close();
  }
};
