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
  SaveOptions,
  UpdateQuery,
} from 'mongoose';

export abstract class BaseRepository<T> {
  protected constructor(protected readonly model: Model<T>) {}

  /**
   * Create a new document in the collection.
   * @param doc Data to create document with
   * @param options Optional save options (e.g. session)
   * @returns The created document
   */
  async create(doc: Partial<T>, options?: SaveOptions): Promise<T> {
    const created = new this.model(doc);
    return (await created.save(options)) as unknown as T;
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
   * Find paginated documents matching the filter query.
   * This is the standard way any feature module lists a paginated collection.
   *
   * @param filter Filter criteria for matching documents
   * @param pagination Page (1-indexed) and limit options
   * @param sort Optional sorting criteria
   * @returns Object containing matching items and total count of matched documents
   */
  async findPaginated(
    filter: QueryFilter<T> = {},
    pagination: { page: number; limit: number },
    sort?: Record<string, 1 | -1 | 'asc' | 'desc'>,
  ): Promise<{ items: T[]; total: number }> {
    const page = Math.max(1, pagination.page || 1);
    const limit = Math.max(1, pagination.limit || 20);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .sort(sort as Parameters<ReturnType<Model<T>['find']>['sort']>[0])
        .skip(skip)
        .limit(limit)
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    return { items, total };
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
    options: QueryOptions<T> = { returnDocument: 'after' },
  ): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, update, options).exec();
  }

  /**
   * Update a single document matching the filter query.
   * @param filter Filter criteria for matching document
   * @param update Update operations to apply
   * @param options Optional query/update options
   * @returns Object with matchedCount and modifiedCount
   */
  async updateOne(
    filter: QueryFilter<T> = {},
    update: UpdateQuery<T>,
    options?: Parameters<Model<T>['updateOne']>[2],
  ): Promise<{ matchedCount: number; modifiedCount: number }> {
    const result = await this.model.updateOne(filter, update, options).exec();
    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    };
  }

  /**
   * Update multiple documents matching the filter query.
   * @param filter Filter criteria for matching documents
   * @param update Update operations to apply
   * @param options Optional query/update options
   * @returns Object with matchedCount and modifiedCount
   */
  async updateMany(
    filter: QueryFilter<T> = {},
    update: UpdateQuery<T>,
    options?: Parameters<Model<T>['updateMany']>[2],
  ): Promise<{ matchedCount: number; modifiedCount: number }> {
    const result = await this.model.updateMany(filter, update, options).exec();
    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    };
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

