import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Schedule {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  title: string; // e.g. "Dinner with friends"

  @Column()
  content: string; // e.g. "具体的执行建议, 注意事项"

  @Column()
  date: string; // e.g. "日期 如 2023-01-31"
}
