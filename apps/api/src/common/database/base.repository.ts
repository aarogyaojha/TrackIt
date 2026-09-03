/**
 * BaseRepository<T>
 *
 * Enforcing AGENTS.md Backend Architecture (Strict Layering - CSR):
 * `controller -> service -> repository`
 *
 * This base repository and its derived repository classes are the ONLY places
 * where a Mongoose Model is touched directly. Feature services and controllers
 * MUST NOT interact with Mongoose models directly.
 */

import {
  Model,
  ProjectionType,
  QueryFilter,
  QueryOptions,
  UpdateQuery,
} from 'mongoose';

export abstract class BaseRepository<T> {
  protected constructor(protected readonly model: Model<T>) {}

  /**
   * Create a new document in the collection.
   * @param doc Data to create document with
   * @returns The created document
   */
  async create(doc: Partial<T>): Promise<T> {
    const created = new this.model(doc);
    return (await created.save()) as unknown as T;
  }

  /**
   * Find a single document by its MongoDB _id.
   * @param id The document ID
   * @param projection Optional projection fields
   * @param options Optional query options
   * @returns The document if found, null otherwise
   */
  async findById(
    id: string,
    projection?: ProjectionType<T>,
    options?: QueryOptions<T>,
  ): Promise<T | null> {
    return this.model.findById(id, projection, options).exec();
  }

  /**
   * Find a single document matching the filter query.
   * @param filter Filter criteria
   * @param projection Optional projection fields
   * @param options Optional query options
   * @returns The document if found, null otherwise
   */
  async findOne(
    filter: QueryFilter<T>,
    projection?: ProjectionType<T>,
    options?: QueryOptions<T>,
  ): Promise<T | null> {
    return this.model.findOne(filter, projection, options).exec();
  }

  /**
   * Find multiple documents matching the filter query.
   * @param filter Filter criteria
   * @param projection Optional projection fields
   * @param options Optional query options
   * @returns Array of matching documents
   */
  async find(
    filter: QueryFilter<T> = {},
    projection?: ProjectionType<T>,
    options?: QueryOptions<T>,
  ): Promise<T[]> {
    return this.model.find(filter, projection, options).exec();
  }

  /**
   * Update a document by its MongoDB _id.
   * @param id The document ID
   * @param update Update operations to apply
   * @param options Optional query options (defaults to { new: true })
   * @returns The updated document if found, null otherwise
   */
  async updateById(
    id: string,
    update: UpdateQuery<T>,
    options: QueryOptions<T> = { new: true },
  ): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, update, options).exec();
  }

  /**
   * Delete a document by its MongoDB _id.
   * @param id The document ID
   * @param options Optional query options
   * @returns The deleted document if found, null otherwise
   */
  async deleteById(
    id: string,
    options?: QueryOptions<T>,
  ): Promise<T | null> {
    return this.model.findByIdAndDelete(id, options).exec();
  }
}
