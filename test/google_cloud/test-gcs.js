require('dotenv').config({ path: '../../.env'});
const { Storage } = require('@google-cloud/storage');

const bucketName = process.env.GCP_BUCKET_NAME;
const keyfile = '../../generacion-472902-a49bace4a296.json'; // process.env.GOOGLE_APPLICATION_CREDENTIALS;

const storage = new Storage({ keyFilename: keyfile });

async function testGCS() {
  try {
    const [files] = await storage.bucket(bucketName).getFiles({ maxResults: 1 });
    console.log("¡La conexión funciona! El bucket existe y respondió.");
    if (files.length) {
      console.log("Primer archivo del bucket:", files[0].name);
    } else {
      console.log("El bucket está vacío.");
    }
  } catch (e) {
    console.error("Error de conexión:", e.message);
  }
}

testGCS();
