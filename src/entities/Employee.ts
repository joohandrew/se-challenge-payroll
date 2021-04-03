import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToOne,
  BaseEntity,
} from "typeorm";
import { Job } from "./Job";

@Entity()
export class Employee extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Job)
  @JoinColumn()
  job: Job;

  @Column({ unique: true })
  reportId: number;

  @Column()
  logDate: Date;

  @Column()
  hoursWorked: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
