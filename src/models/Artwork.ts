import {
  Model,
  Table,
  Column,
  AllowNull,
  Length,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
  ForeignKey,
  BelongsTo,
  DefaultScope,
} from 'sequelize-typescript';

import { Artist } from './Artist';

@DefaultScope(() => ({
  attributes: ['id', 'fileName', 'artistId'],
}))
@Table({
  tableName: 'artwork',
  freezeTableName: true,
  timestamps: true,
  paranoid: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
})
export class Artwork extends Model<Artwork> {
  @Length({ max: 70 })
  @Column
  fileName!: string;

  @ForeignKey(() => Artist)
  @AllowNull(false)
  @Column
  artistId!: number;

  @CreatedAt
  @Column
  createdAt!: Date;

  @UpdatedAt
  @Column
  updatedAt!: Date;

  @DeletedAt
  @Column
  deletedAt!: Date;

  @BelongsTo(() => Artist, {
    foreignKey: 'artistId',
  })
  artist!: Artist;
}

export default Artwork;
