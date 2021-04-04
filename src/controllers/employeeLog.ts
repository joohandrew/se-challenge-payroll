import { Router, Response, Request } from "express";
import multer from "multer";
import { csvFilter } from "../utils/csvFilter";
import { EmployeeLogService } from "../services/employeeLog";

export class EmployeeLogController {
  public router: Router;
  private employeeLogService: EmployeeLogService;

  constructor() {
    this.employeeLogService = new EmployeeLogService();
    this.router = Router();
    this.routes();
  }

  public upload = async (req: Request, res: Response) => {
    try {
      if (req.file == undefined) {
        return res.status(400).send("Please upload a CSV file!");
      }
      const newEmployeeLogs = await this.employeeLogService.upload(req.file);
      res.send(newEmployeeLogs);
    } catch (error) {
      const reportID = Number(req.file.originalname.replace(/\D/g, ""));
      if (error.message === "existingReportID") {
        res.status(400).send({
          message: `Report with ID ${reportID} already exists`,
        });
      } else {
        res.status(500).send({
          message: "Could not upload the file: " + req.file.originalname,
        });
      }
    }
  };

  /**
   * Configure the routes of controller
   */
  public routes() {
    const UPLOAD_PATH = "static/assets/uploads/";
    const upload = multer({
      dest: UPLOAD_PATH,
      fileFilter: csvFilter,
    });
    this.router.post("/upload", upload.single("file"), this.upload);
  }
}
