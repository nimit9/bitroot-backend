import { fileURLToPath } from "url";
import multer from "multer";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({
    dest: "./files/",
    // you might also want to set some limits: https://github.com/expressjs/multer#limits
});

export default upload;
