import fs from "fs";
import { parse } from "fast-csv";
import { Employee } from "../entities/Employee";
import { EmployeeLog } from "../entities/EmployeeLog";
import { getConnection } from "typeorm";
import { EmployeeLogRepository } from "../repositories/employeeLog";
import { EmployeeRepository } from "../repositories/employee";

export class EmployeeLogService {
  private employeeLogRepository: EmployeeLogRepository;
  private employeeRepository: EmployeeRepository;

  constructor() {
    this.employeeLogRepository = getConnection("wavehq").getCustomRepository(
      EmployeeLogRepository
    );
    this.employeeRepository = getConnection("wavehq").getCustomRepository(
      EmployeeRepository
    );
  }

  public upload = async (file: Express.Multer.File) => {
    const reportID = Number(file.originalname.replace(/\D/g, ""));
    const existingReport = await this.employeeLogRepository.findOne({
      reportId: reportID,
    });

    if (existingReport) {
      throw new Error("existingReportID");
    }

    const csvRows = await this.readFile(file);
    const employeePromiseArray: Promise<Employee>[] = this.makeEmployeePromiseArray(
      csvRows
    );
    const employees = await this.getEmployeesFromPromiseArray(
      employeePromiseArray
    );
    const employeeLogPromiseArray: Promise<EmployeeLog>[] = this.makeEmployeeLogPromiseArray(
      reportID,
      csvRows,
      employees
    );
    const employeeLogs = await this.getEmployeeLogsFromPromiseArray(
      employeeLogPromiseArray
    );

    return employeeLogs;
  };

  private readFile = (file: Express.Multer.File) => {
    const csvRows: any = {};
    return new Promise((resolve, reject) => {
      fs.createReadStream(file.path)
        .pipe(
          parse({
            headers: ["date", "hoursWorked", "employeeId", "jobGroup"],
            renameHeaders: true,
          })
        )
        .on("error", (error) => {
          reject(error.message);
        })
        .on("data", (row) => {
          if (csvRows[row.employeeId]) {
            const rows = csvRows[row.employeeId];
            rows.push(row);
            csvRows[row.employeeId] = rows;
          } else {
            csvRows[row.employeeId] = [row];
          }
        })
        .on("end", () => {
          resolve(csvRows);
        });
    });
  };

  private makeEmployeePromiseArray = (csvRows: any) => {
    const employeePromiseArray: Promise<Employee>[] = [];
    Object.keys(csvRows).forEach(async (key) => {
      employeePromiseArray.push(
        new Promise(async (resolve) => {
          let employee = await this.employeeRepository.findOne(Number(key));
          if (!employee) {
            employee = new Employee();
            employee.id = Number(key);
            resolve(this.employeeRepository.save(employee));
          }
          resolve(employee);
        })
      );
    });
    return employeePromiseArray;
  };

  private getEmployeesFromPromiseArray = (
    employeePromiseArray: Promise<Employee>[]
  ) => {
    return Promise.all(employeePromiseArray);
  };

  private makeEmployeeLogPromiseArray = (
    reportID: number,
    csvRows: any,
    employees: Employee[]
  ) => {
    const employeeLogPromiseArray: Promise<EmployeeLog>[] = [];
    employees.forEach((employee: Employee) => {
      const employeeLogList = csvRows[`${employee.id}`];
      employeeLogList.forEach((row: any) => {
        employeeLogPromiseArray.push(
          new Promise((resolve) => {
            const dateParts = row.date.split("/");
            const dateObject = new Date(
              +dateParts[2],
              dateParts[1] - 1,
              +dateParts[0]
            );

            const employeeLog = new EmployeeLog();
            employeeLog.logDate = new Date(dateObject);
            employeeLog.hoursWorked = Number(row.hoursWorked);
            employeeLog.employee = employee;
            employeeLog.jobGroupType = row.jobGroup;
            employeeLog.reportId = reportID;
            resolve(this.employeeLogRepository.save(employeeLog));
          })
        );
      });
    });
    return employeeLogPromiseArray;
  };

  private getEmployeeLogsFromPromiseArray = (
    employeeLogPromiseArray: Promise<EmployeeLog>[]
  ) => {
    return Promise.all(employeeLogPromiseArray);
  };
}
