require("dotenv").config();
const express = require('express');
const path = require("path");
const app = express();
const port = process.env.PORT;
const fs = require('fs');
const multer  = require('multer');


app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));
app.use(express.urlencoded({extended: false}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get("/" , (req, res) => {
    return res.render("index");
});
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = `./uploads/${Date.now()}-email/`;

        // Create the directory if it doesn't exist
        fs.mkdirSync(uploadPath, { recursive: true });

        return cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        return cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const mysql = require('mysql2');

// create the connection
const db = mysql.createConnection({
  host: process.env.HOST_NAME,
  user: process.env.HOST_USER,
  password: process.env.HOST_PASSWORD,
  database: process.env.DATABASE_NAME,
}).promise();

const upload = multer({ storage});


app.post('/stats', upload.fields([{ name: 'cover_photo', maxCount: 1 }, { name: 'additional_photos', maxCount: 50 }]), async (req, res) => {
    const coverPhoto = req.files['cover_photo']; // Array with 1 file for cover photo
    const additionalPhotos = req.files['additional_photos']; // Array of additional photos

    console.log("Uploaded files:", req.files);

    // Validation: Ensure both cover photo and additional photos are present
    if (!coverPhoto || coverPhoto.length === 0) {
        return res.status(400).send("Cover photo is required.");
    }
    if (!additionalPhotos || additionalPhotos.length === 0) {
        return res.status(400).send("At least one additional photo is required.");
    }

    try {
        // Insert a new product ID for this batch of files
        const sqlInsertProduct = `INSERT INTO products (created_at) VALUES (CURRENT_TIMESTAMP)`;
        const [productResult] = await db.query(sqlInsertProduct);
        console.log(productResult);
        const productId = productResult.insertId;

        // Insert cover photo
        const coverPhotoRecord = [
            coverPhoto[0].filename,
            coverPhoto[0].path,
            true, // is_cover = true
            productId
        ];

        const sqlInsertCoverPhoto = `
            INSERT INTO uploaded_files (filename, filepath, is_cover, product_id)
            VALUES (?, ?, ?, ?)
        `;
        await db.query(sqlInsertCoverPhoto, coverPhotoRecord);

        // Insert additional photos
        const additionalPhotoRecords = additionalPhotos.map(photo => [
            photo.filename,
            photo.path,
            false, // is_cover = false
            productId
        ]);

        const sqlInsertAdditionalPhotos = `
            INSERT INTO uploaded_files (filename, filepath, is_cover, product_id)
            VALUES ?
        `;
        await db.query(sqlInsertAdditionalPhotos, [additionalPhotoRecords]);

        console.log("Files metadata saved to the database");

        res.send("Files uploaded successfully!");
    } catch (error) {
        console.error("Error uploading files:", error);
        res.status(500).send("An error occurred while uploading files.");
    }
});



app.get('/files', async (req, res) => {
    const sql = `
        SELECT product_id,
               GROUP_CONCAT(CASE WHEN is_cover THEN filepath END) AS cover_photo,
               GROUP_CONCAT(CASE WHEN NOT is_cover THEN filepath END) AS other_photos
        FROM uploaded_files
        GROUP BY product_id
    `;
    const [files] = await db.query(sql);

    const formattedFiles = files.map(file => ({
        product_id: file.product_id,
        cover_photo: file.cover_photo,
        other_photos: file.other_photos ? file.other_photos.split(',') : []
    }));
    console.log("formated file ========" , formattedFiles);
    res.render('files', { files: formattedFiles });
});



app.listen(port, () => console.log("server started at port: 8000"));
