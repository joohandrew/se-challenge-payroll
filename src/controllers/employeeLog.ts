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

  public report = async (req: Request, res: Response) => {
    const reportId = req.query.reportId;
    try {
      if (!reportId) {
        res.status(400).send({
          message: `Must add param reportId to the request`,
        });
      }
      let isNum = /^\d+$/.test(reportId as string);
      if (!isNum) {
        res.status(400).send({
          message: `reportId param should only contain numeric digits`,
        });
      }

      const payrollReport = await this.employeeLogService.report(
        Number(reportId)
      );
      res.send(payrollReport);
    } catch (error) {
      if (error.message === "noReport") {
        res.status(400).send({
          message: `Report with ID ${reportId} does not exist`,
        });
      } else {
        res.status(500).send({
          message: `Could not generate a JSON response for report #${reportId}`,
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
    this.router.get("/report", this.report);
  }
}
