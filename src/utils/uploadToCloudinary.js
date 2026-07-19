const sharp = require("sharp");
const streamifier = require("streamifier");
const cloudinary = require("../../Config/cloudinary");

async function uploadToCloudinary(file, folder) {
    if (!file) return null;

    const compressedBuffer = await sharp(file.buffer)
        .resize(800, 800, {
            fit: "inside",
            withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toBuffer();

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "image",
                format: "webp",
            },
            (error, result) => {
                if (error) {
                    console.error("Cloudinary Error:", error);
                    return reject(error);
                }

                resolve(result.secure_url);
            }
        );

        streamifier.createReadStream(compressedBuffer).pipe(stream);
    });
}

module.exports = uploadToCloudinary;