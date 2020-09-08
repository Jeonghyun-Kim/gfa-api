import {
  Model,
  Table,
  Column,
  AllowNull,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
  DefaultScope,
  DataType,
} from 'sequelize-typescript';

@DefaultScope(() => ({
  attributes: ['id', 'userId', 'deviceInfo', 'path', 'createdAt'],
}))
@Table({
  tableName: 'counter',
  freezeTableName: true,
  timestamps: true,
  paranoid: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
})
export class Counter extends Model<Counter> {
  @AllowNull(false)
  @Column
  sessionId!: string;

  @AllowNull(false)
  @Column
  userId?: string;

  @Column(DataType.TEXT)
  deviceInfo?: string;

  @AllowNull(false)
  @Column
  path?: string;

  @CreatedAt
  @Column
  createdAt!: Date;

  @UpdatedAt
  @Column
  updatedAt!: Date;

  @DeletedAt
  @Column
  deletedAt!: Date;
}

export default Counter;
