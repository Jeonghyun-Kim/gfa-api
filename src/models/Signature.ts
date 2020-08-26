import {
  Model,
  Table,
  Column,
  DataType,
  AllowNull,
  Length,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
  DefaultScope,
} from 'sequelize-typescript';

@DefaultScope(() => ({
  attributes: ['id', 'fileName', 'name', 'content', 'createdAt'],
}))
@Table({
  tableName: 'signature',
  freezeTableName: true,
  timestamps: true,
  paranoid: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
})
export class Signature extends Model<Signature> {
  @AllowNull(false)
  @Column
  userId?: string;

  @Length({ max: 70 })
  @Column
  fileName?: string;

  @Length({ min: 2, max: 30 })
  @Column
  name?: string;

  @Length({ max: 500 })
  @Column(DataType.TEXT)
  content?: string;

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

export default Signature;
