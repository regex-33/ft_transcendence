const path = require("path");
const fs = require("fs");
const util = require("util");
const stream = util.promisify(require("stream").pipeline);

const getBody = async (request) => {
  try {
    if (request.isMultipart()) {
      const parts = request.parts();
      const body = {};
      const uploadDir = path.join(__dirname, "..", "uploads");

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      for await (const part of parts) {
        if (part.file) {
          const safeFilename = Date.now() + "_" + path.basename(part.filename);
          const filePath = path.join(uploadDir, safeFilename);

          try {
            await stream(part.file, fs.createWriteStream(filePath));
            body[part.fieldname] = {
              name: safeFilename,
              path: path.join("uploads", safeFilename),
            };
            console.log("File saved:", filePath);
          } catch (err) {
            console.error("File save error:", err);
          }
        } else {
          body[part.fieldname] = part.value;
        }
      }

      return body;
    }
  } catch (error) {
    throw new Error(`Failed to process multipart request: ${error.message}`);
  }
  return request.body;
};

module.exports = getBody;
