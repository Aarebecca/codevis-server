import path from "path";

export const config = {
  port: process.env.PORT || 3000,
  uploadDir: path.join(__dirname, "../uploads"),
};
