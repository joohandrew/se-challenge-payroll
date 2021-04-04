import { EmployeeLog } from "../entities/EmployeeLog";
import { EntityRepository, Repository } from "typeorm";

@EntityRepository(EmployeeLog)
export class EmployeeLogRepository extends Repository<EmployeeLog> {}
