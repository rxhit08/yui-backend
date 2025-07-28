import multer from "multer";

const storage = multer.memoryStorage(); // ✅ store in memory

export const upload = multer({ storage });
