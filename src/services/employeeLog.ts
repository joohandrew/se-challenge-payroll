import fs from "fs";
import { parse } from "fast-csv";
import { Employee } from "../entities/Employee";
import { EmployeeLog } from "../entities/EmployeeLog";
import { getConnection } from "typeorm";
import { EmployeeLogRepository } from "../repositories/employeeLog";
import { EmployeeRepository } from "../repositories/employee";
import { getJobType } from "../entities/Job";

interface EmployeeReport {
  employeeId: number;
  jobGroupType: string;
  payPeriodStartDate: Date;
  payPeriodEndDate: Date;
  totalHours: number;
}
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

  public report = async (reportID: number) => {
    const existingReport = await this.employeeLogRepository.findOne({
      reportId: reportID,
    });
    if (!existingReport) {
      throw new Error("noReport");
    }

    const allEmployeeLogs: EmployeeReport[] = await this.employeeLogRepository
      .createQueryBuilder("employeeLog")
      .select(
        "employeeLog.employeeId, employeeLog.jobGroupType, employeeLog.payPeriodStartDate, employeeLog.payPeriodEndDate"
      )
      .addSelect("SUM(employeeLog.hoursWorked)", "totalHours")
      .where("employeeLog.reportId = :reportId", { reportId: reportID })
      .groupBy(
        "employeeLog.employeeId, employeeLog.jobGroupType, employeeLog.payPeriodStartDate, employeeLog.payPeriodEndDate"
      )
      .orderBy("employeeLog.employeeId", "ASC")
      .addOrderBy("employeeLog.payPeriodStartDate", "ASC")
      .execute();

    const employeeReports = allEmployeeLogs.map((employeeLog) => {
      const jobType = getJobType(employeeLog.jobGroupType);
      const jobRate = jobType?.rate || 0;
      return {
        employeeId: `${employeeLog.employeeId}`,
        payPeriod: {
          startDate: employeeLog.payPeriodStartDate,
          endDate: employeeLog.payPeriodEndDate,
        },
        amountPaid: "$" + (employeeLog.totalHours * jobRate).toFixed(2),
      };
    });
    const payrollReport = {
      payrollReport: {
        employeeReports: employeeReports,
      },
    };
    return payrollReport;
  };

  private generatePayPeriodDate(date: Date) {
    if (date.getDate() <= 15) {
      return {
        startDate: new Date(date.getFullYear(), date.getMonth(), 1),
        endDate: new Date(date.getFullYear(), date.getMonth(), 15),
      };
    } else {
      return {
        startDate: new Date(date.getFullYear(), date.getMonth(), 16),
        endDate: new Date(date.getFullYear(), date.getMonth() + 1, 0),
      };
    }
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
            const payperiod = this.generatePayPeriodDate(dateObject);

            const employeeLog = new EmployeeLog();
            employeeLog.logDate = new Date(dateObject);
            employeeLog.payPeriodStartDate = payperiod.startDate;
            employeeLog.payPeriodEndDate = payperiod.endDate;
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
