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
  HasMany,
  Scopes,
  PrimaryKey,
} from 'sequelize-typescript';

import { Artwork } from './Artwork';

@Scopes(() => ({
  withArtworks: {
    include: [
      {
        model: Artwork,
        as: 'artworks',
      },
    ],
  },
}))
@Table({
  tableName: 'artist',
  freezeTableName: true,
  timestamps: true,
  paranoid: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
})
export class Artist extends Model<Artist> {
  @PrimaryKey
  @AllowNull(false)
  @Column
  id!: number;

  @Length({ max: 70 })
  @Column
  thumbFileName!: string;

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

  @HasMany(() => Artwork, {
    foreignKey: 'artistId',
  })
  artworks?: Artwork[];
}

export default Artist;
