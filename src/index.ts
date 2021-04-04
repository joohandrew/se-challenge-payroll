import "reflect-metadata";
import "dotenv-safe/config";
import { createConnection } from "typeorm";
import express, { Request, Response } from "express";
import { EmployeeLogController } from "./controllers/employeeLog";
import path from "path";

class Server {
  private employeeLogController: EmployeeLogController;
  private app: express.Application;

  constructor() {
    this.app = express();
    this.configuration();
    this.routes();
  }

  /**
   * Method to configure the server
   */
  public configuration() {
    this.app.set("port", process.env.PORT || 4000);
    this.app.use(express.json());
  }

  /**
   * Method to configure the routes
   */
  public async routes() {
    // Set up database connection
    await createConnection({
      type: "postgres",
      url: process.env.DATABASE_URL,
      logging: true,
      entities: [path.join(__dirname, "./entities/*")],
      synchronize: true,
      name: "wavehq",
    });

    this.employeeLogController = new EmployeeLogController();

    this.app.get("/", (_req: Request, res: Response) => {
      res.send("Hello world!");
    });

    this.app.use(`/api/employeeLog`, this.employeeLogController.router);
  }

  /**
   * Used to start the server
   */
  public start() {
    this.app.listen(this.app.get("port"), () => {
      console.log(`Server started on localhost:${this.app.get("port")} port.`);
    });
  }
}

const server = new Server(); // Create server instance
server.start(); // Execute the server
