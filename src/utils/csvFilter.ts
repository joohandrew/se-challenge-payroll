import { Request } from "express";
import { FileFilterCallback } from "multer";

export const csvFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
): void => {
  if (file.originalname.match(/\.(csv)$/)) {
    return callback(null, true);
  } else {
    return callback(new Error("Only csv files are allowed!"));
  }
};
