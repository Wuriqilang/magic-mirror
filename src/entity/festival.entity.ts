import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Festival {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  title: string; // e.g. "结婚纪念日"

  @Column()
  content: string; // e.g. "具体的执行建议, 注意事项"

  @Column()
  date: string; // e.g. "节日时间如 01-31"
}
