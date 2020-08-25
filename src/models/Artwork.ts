import {
  Model,
  Table,
  Column,
  AllowNull,
  Length,
  Default,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
} from 'sequelize-typescript';

@Table({
  tableName: 'artwork',
  freezeTableName: true,
  timestamps: true,
  paranoid: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
})
export class Artwork extends Model<Artwork> {
  @AllowNull(false)
  @Column
  artistId!: number;

  @Length({ max: 70 })
  @Column
  landscapeFileName!: string;

  @Length({ max: 70 })
  @Column
  portraitFileName!: string;

  @AllowNull(false)
  @Default(0)
  @Column
  hitCount!: number;

  @AllowNull(false)
  @Default(0)
  @Column
  seeMoreCount!: number;

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

export default Artwork;
