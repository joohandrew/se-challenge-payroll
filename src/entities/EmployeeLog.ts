import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  BaseEntity,
  ManyToOne,
  VersionColumn,
} from "typeorm";
import { Employee } from "./Employee";

@Entity()
export class EmployeeLog extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  employeeId: number;

  @ManyToOne(() => Employee)
  @JoinColumn()
  employee: Employee;

  @Column()
  jobGroupType: string;

  @Column()
  reportId: number;

  @Column()
  logDate: Date;

  @Column()
  payPeriodStartDate: Date;

  @Column()
  payPeriodEndDate: Date;

  @Column("decimal", { precision: 5, scale: 2 })
  hoursWorked: number;

  @VersionColumn()
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
