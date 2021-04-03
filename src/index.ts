import "reflect-metadata";
import "dotenv-safe/config";
import { createConnection } from "typeorm";
import { Employee } from "./entities/Employee";
import { Job } from "./entities/Job";
import express from "express";

const main = async () => {
  await createConnection({
    type: "postgres",
    url: process.env.DATABASE_URL,
    logging: true,
    entities: [Employee, Job],
    synchronize: true,
  });

  const app = express();
  app.listen(parseInt(process.env.PORT!), () => {
    console.log("server started on localhost:4000");
  });
};

main();
