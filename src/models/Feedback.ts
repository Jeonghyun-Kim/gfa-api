import {
  Model,
  Table,
  Column,
  DataType,
  Length,
  IsEmail,
  AllowNull,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
  DefaultScope,
} from 'sequelize-typescript';

@DefaultScope(() => ({
  attributes: ['id', 'userId', 'email', 'content', 'createdAt'],
}))
@Table({
  tableName: 'feedback',
  freezeTableName: true,
  timestamps: true,
  paranoid: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
})
export class Feedback extends Model<Feedback> {
  @AllowNull(false)
  @IsEmail
  @Column
  email!: string;

  @AllowNull(false)
  @Column
  userId?: string;

  @AllowNull(false)
  @Length({ max: 500 })
  @Column(DataType.TEXT)
  content!: string;

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

export default Feedback;
