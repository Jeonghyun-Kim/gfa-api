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
  attributes: [
    'id',
    'fileName',
    'artistId',
    'artistName',
    'title',
    'size',
    'material',
  ],
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

  @AllowNull(false)
  @Column
  artistName!: string;

  @AllowNull(false)
  @Column
  title!: string;

  @AllowNull(false)
  @Column
  size!: string;

  @AllowNull(false)
  @Column
  material!: string;

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
