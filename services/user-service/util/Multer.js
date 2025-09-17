const path = require("path");
const fs = require("fs");
const util = require("util");
const stream = util.promisify(require("stream").pipeline);
const { logger } = require("./logger");


const multer = async (request) => {
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
              path: `${request.protocol}://${request.headers.host}/uploads/${safeFilename}`,
            };
            logger(request, "INFO", "FileSaving", request.user.username || "guest", true, null, request.cookies?.token || null);
          } catch (err) {
            logger(request, "ERROR", "FileSaving", request.user.username || "guest", false, "FAILTOSAVE", request.cookies?.token || null);
          }
        } else {
          body[part.fieldname] = part.value;
        }
      }

      return body;
    }
  } catch (error) {
    logger(request, "ERROR", "FileSaving", request.user.username || "guest", false, "FAILTOPROCESS", request.cookies?.token || null);
    throw error;
  }
  return request.body;
};

module.exports = multer;
