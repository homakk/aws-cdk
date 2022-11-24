"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
// eslint-disable-next-line import/no-extraneous-dependencies
const aws_sdk_1 = require("aws-sdk");
const AUTO_DELETE_OBJECTS_TAG = 'aws-cdk:auto-delete-objects';
const s3 = new aws_sdk_1.S3();
async function handler(event) {
    switch (event.RequestType) {
        case 'Create':
            return;
        case 'Update':
            return onUpdate(event);
        case 'Delete':
            return onDelete(event.ResourceProperties?.BucketName);
    }
}
exports.handler = handler;
async function onUpdate(event) {
    const updateEvent = event;
    const oldBucketName = updateEvent.OldResourceProperties?.BucketName;
    const newBucketName = updateEvent.ResourceProperties?.BucketName;
    const bucketNameHasChanged = newBucketName != null && oldBucketName != null && newBucketName !== oldBucketName;
    /* If the name of the bucket has changed, CloudFormation will try to delete the bucket
       and create a new one with the new name. So we have to delete the contents of the
       bucket so that this operation does not fail. */
    if (bucketNameHasChanged) {
        return onDelete(oldBucketName);
    }
}
/**
 * Recursively delete all items in the bucket
 *
 * @param bucketName the bucket name
 */
async function emptyBucket(bucketName) {
    const listedObjects = await s3.listObjectVersions({ Bucket: bucketName }).promise();
    const contents = [...listedObjects.Versions ?? [], ...listedObjects.DeleteMarkers ?? []];
    if (contents.length === 0) {
        return;
    }
    const records = contents.map((record) => ({ Key: record.Key, VersionId: record.VersionId }));
    await s3.deleteObjects({ Bucket: bucketName, Delete: { Objects: records } }).promise();
    if (listedObjects?.IsTruncated) {
        await emptyBucket(bucketName);
    }
}
async function onDelete(bucketName) {
    if (!bucketName) {
        throw new Error('No BucketName was provided.');
    }
    if (!await isBucketTaggedForDeletion(bucketName)) {
        process.stdout.write(`Bucket does not have '${AUTO_DELETE_OBJECTS_TAG}' tag, skipping cleaning.\n`);
        return;
    }
    try {
        await emptyBucket(bucketName);
    }
    catch (e) {
        if (e.code !== 'NoSuchBucket') {
            throw e;
        }
        // Bucket doesn't exist. Ignoring
    }
}
/**
 * The bucket will only be tagged for deletion if it's being deleted in the same
 * deployment as this Custom Resource.
 *
 * If the Custom Resource is every deleted before the bucket, it must be because
 * `autoDeleteObjects` has been switched to false, in which case the tag would have
 * been removed before we get to this Delete event.
 */
async function isBucketTaggedForDeletion(bucketName) {
    const response = await s3.getBucketTagging({ Bucket: bucketName }).promise();
    return response.TagSet.some(tag => tag.Key === AUTO_DELETE_OBJECTS_TAG && tag.Value === 'true');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2REFBNkQ7QUFDN0QscUNBQTZCO0FBRTdCLE1BQU0sdUJBQXVCLEdBQUcsNkJBQTZCLENBQUM7QUFFOUQsTUFBTSxFQUFFLEdBQUcsSUFBSSxZQUFFLEVBQUUsQ0FBQztBQUViLEtBQUssVUFBVSxPQUFPLENBQUMsS0FBa0Q7SUFDOUUsUUFBUSxLQUFLLENBQUMsV0FBVyxFQUFFO1FBQ3pCLEtBQUssUUFBUTtZQUNYLE9BQU87UUFDVCxLQUFLLFFBQVE7WUFDWCxPQUFPLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN6QixLQUFLLFFBQVE7WUFDWCxPQUFPLFFBQVEsQ0FBQyxLQUFLLENBQUMsa0JBQWtCLEVBQUUsVUFBVSxDQUFDLENBQUM7S0FDekQ7QUFDSCxDQUFDO0FBVEQsMEJBU0M7QUFFRCxLQUFLLFVBQVUsUUFBUSxDQUFDLEtBQWtEO0lBQ3hFLE1BQU0sV0FBVyxHQUFHLEtBQTBELENBQUM7SUFDL0UsTUFBTSxhQUFhLEdBQUcsV0FBVyxDQUFDLHFCQUFxQixFQUFFLFVBQVUsQ0FBQztJQUNwRSxNQUFNLGFBQWEsR0FBRyxXQUFXLENBQUMsa0JBQWtCLEVBQUUsVUFBVSxDQUFDO0lBQ2pFLE1BQU0sb0JBQW9CLEdBQUcsYUFBYSxJQUFJLElBQUksSUFBSSxhQUFhLElBQUksSUFBSSxJQUFJLGFBQWEsS0FBSyxhQUFhLENBQUM7SUFFL0c7O3NEQUVrRDtJQUNsRCxJQUFJLG9CQUFvQixFQUFFO1FBQ3hCLE9BQU8sUUFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0tBQ2hDO0FBQ0gsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxLQUFLLFVBQVUsV0FBVyxDQUFDLFVBQWtCO0lBQzNDLE1BQU0sYUFBYSxHQUFHLE1BQU0sRUFBRSxDQUFDLGtCQUFrQixDQUFDLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDcEYsTUFBTSxRQUFRLEdBQUcsQ0FBQyxHQUFHLGFBQWEsQ0FBQyxRQUFRLElBQUksRUFBRSxFQUFFLEdBQUcsYUFBYSxDQUFDLGFBQWEsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUN6RixJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1FBQ3pCLE9BQU87S0FDUjtJQUVELE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFXLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLEdBQUcsRUFBRSxTQUFTLEVBQUUsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNsRyxNQUFNLEVBQUUsQ0FBQyxhQUFhLENBQUMsRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7SUFFdkYsSUFBSSxhQUFhLEVBQUUsV0FBVyxFQUFFO1FBQzlCLE1BQU0sV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0tBQy9CO0FBQ0gsQ0FBQztBQUVELEtBQUssVUFBVSxRQUFRLENBQUMsVUFBbUI7SUFDekMsSUFBSSxDQUFDLFVBQVUsRUFBRTtRQUNmLE1BQU0sSUFBSSxLQUFLLENBQUMsNkJBQTZCLENBQUMsQ0FBQztLQUNoRDtJQUNELElBQUksQ0FBQyxNQUFNLHlCQUF5QixDQUFDLFVBQVUsQ0FBQyxFQUFFO1FBQ2hELE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLHlCQUF5Qix1QkFBdUIsNkJBQTZCLENBQUMsQ0FBQztRQUNwRyxPQUFPO0tBQ1I7SUFDRCxJQUFJO1FBQ0YsTUFBTSxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7S0FDL0I7SUFBQyxPQUFPLENBQUMsRUFBRTtRQUNWLElBQUksQ0FBQyxDQUFDLElBQUksS0FBSyxjQUFjLEVBQUU7WUFDN0IsTUFBTSxDQUFDLENBQUM7U0FDVDtRQUNELGlDQUFpQztLQUNsQztBQUNILENBQUM7QUFFRDs7Ozs7OztHQU9HO0FBQ0gsS0FBSyxVQUFVLHlCQUF5QixDQUFDLFVBQWtCO0lBQ3pELE1BQU0sUUFBUSxHQUFHLE1BQU0sRUFBRSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDN0UsT0FBTyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssdUJBQXVCLElBQUksR0FBRyxDQUFDLEtBQUssS0FBSyxNQUFNLENBQUMsQ0FBQztBQUNsRyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGltcG9ydC9uby1leHRyYW5lb3VzLWRlcGVuZGVuY2llc1xuaW1wb3J0IHsgUzMgfSBmcm9tICdhd3Mtc2RrJztcblxuY29uc3QgQVVUT19ERUxFVEVfT0JKRUNUU19UQUcgPSAnYXdzLWNkazphdXRvLWRlbGV0ZS1vYmplY3RzJztcblxuY29uc3QgczMgPSBuZXcgUzMoKTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIoZXZlbnQ6IEFXU0xhbWJkYS5DbG91ZEZvcm1hdGlvbkN1c3RvbVJlc291cmNlRXZlbnQpIHtcbiAgc3dpdGNoIChldmVudC5SZXF1ZXN0VHlwZSkge1xuICAgIGNhc2UgJ0NyZWF0ZSc6XG4gICAgICByZXR1cm47XG4gICAgY2FzZSAnVXBkYXRlJzpcbiAgICAgIHJldHVybiBvblVwZGF0ZShldmVudCk7XG4gICAgY2FzZSAnRGVsZXRlJzpcbiAgICAgIHJldHVybiBvbkRlbGV0ZShldmVudC5SZXNvdXJjZVByb3BlcnRpZXM/LkJ1Y2tldE5hbWUpO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIG9uVXBkYXRlKGV2ZW50OiBBV1NMYW1iZGEuQ2xvdWRGb3JtYXRpb25DdXN0b21SZXNvdXJjZUV2ZW50KSB7XG4gIGNvbnN0IHVwZGF0ZUV2ZW50ID0gZXZlbnQgYXMgQVdTTGFtYmRhLkNsb3VkRm9ybWF0aW9uQ3VzdG9tUmVzb3VyY2VVcGRhdGVFdmVudDtcbiAgY29uc3Qgb2xkQnVja2V0TmFtZSA9IHVwZGF0ZUV2ZW50Lk9sZFJlc291cmNlUHJvcGVydGllcz8uQnVja2V0TmFtZTtcbiAgY29uc3QgbmV3QnVja2V0TmFtZSA9IHVwZGF0ZUV2ZW50LlJlc291cmNlUHJvcGVydGllcz8uQnVja2V0TmFtZTtcbiAgY29uc3QgYnVja2V0TmFtZUhhc0NoYW5nZWQgPSBuZXdCdWNrZXROYW1lICE9IG51bGwgJiYgb2xkQnVja2V0TmFtZSAhPSBudWxsICYmIG5ld0J1Y2tldE5hbWUgIT09IG9sZEJ1Y2tldE5hbWU7XG5cbiAgLyogSWYgdGhlIG5hbWUgb2YgdGhlIGJ1Y2tldCBoYXMgY2hhbmdlZCwgQ2xvdWRGb3JtYXRpb24gd2lsbCB0cnkgdG8gZGVsZXRlIHRoZSBidWNrZXRcbiAgICAgYW5kIGNyZWF0ZSBhIG5ldyBvbmUgd2l0aCB0aGUgbmV3IG5hbWUuIFNvIHdlIGhhdmUgdG8gZGVsZXRlIHRoZSBjb250ZW50cyBvZiB0aGVcbiAgICAgYnVja2V0IHNvIHRoYXQgdGhpcyBvcGVyYXRpb24gZG9lcyBub3QgZmFpbC4gKi9cbiAgaWYgKGJ1Y2tldE5hbWVIYXNDaGFuZ2VkKSB7XG4gICAgcmV0dXJuIG9uRGVsZXRlKG9sZEJ1Y2tldE5hbWUpO1xuICB9XG59XG5cbi8qKlxuICogUmVjdXJzaXZlbHkgZGVsZXRlIGFsbCBpdGVtcyBpbiB0aGUgYnVja2V0XG4gKlxuICogQHBhcmFtIGJ1Y2tldE5hbWUgdGhlIGJ1Y2tldCBuYW1lXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGVtcHR5QnVja2V0KGJ1Y2tldE5hbWU6IHN0cmluZykge1xuICBjb25zdCBsaXN0ZWRPYmplY3RzID0gYXdhaXQgczMubGlzdE9iamVjdFZlcnNpb25zKHsgQnVja2V0OiBidWNrZXROYW1lIH0pLnByb21pc2UoKTtcbiAgY29uc3QgY29udGVudHMgPSBbLi4ubGlzdGVkT2JqZWN0cy5WZXJzaW9ucyA/PyBbXSwgLi4ubGlzdGVkT2JqZWN0cy5EZWxldGVNYXJrZXJzID8/IFtdXTtcbiAgaWYgKGNvbnRlbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHJlY29yZHMgPSBjb250ZW50cy5tYXAoKHJlY29yZDogYW55KSA9PiAoeyBLZXk6IHJlY29yZC5LZXksIFZlcnNpb25JZDogcmVjb3JkLlZlcnNpb25JZCB9KSk7XG4gIGF3YWl0IHMzLmRlbGV0ZU9iamVjdHMoeyBCdWNrZXQ6IGJ1Y2tldE5hbWUsIERlbGV0ZTogeyBPYmplY3RzOiByZWNvcmRzIH0gfSkucHJvbWlzZSgpO1xuXG4gIGlmIChsaXN0ZWRPYmplY3RzPy5Jc1RydW5jYXRlZCkge1xuICAgIGF3YWl0IGVtcHR5QnVja2V0KGJ1Y2tldE5hbWUpO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIG9uRGVsZXRlKGJ1Y2tldE5hbWU/OiBzdHJpbmcpIHtcbiAgaWYgKCFidWNrZXROYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdObyBCdWNrZXROYW1lIHdhcyBwcm92aWRlZC4nKTtcbiAgfVxuICBpZiAoIWF3YWl0IGlzQnVja2V0VGFnZ2VkRm9yRGVsZXRpb24oYnVja2V0TmFtZSkpIHtcbiAgICBwcm9jZXNzLnN0ZG91dC53cml0ZShgQnVja2V0IGRvZXMgbm90IGhhdmUgJyR7QVVUT19ERUxFVEVfT0JKRUNUU19UQUd9JyB0YWcsIHNraXBwaW5nIGNsZWFuaW5nLlxcbmApO1xuICAgIHJldHVybjtcbiAgfVxuICB0cnkge1xuICAgIGF3YWl0IGVtcHR5QnVja2V0KGJ1Y2tldE5hbWUpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgaWYgKGUuY29kZSAhPT0gJ05vU3VjaEJ1Y2tldCcpIHtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICAgIC8vIEJ1Y2tldCBkb2Vzbid0IGV4aXN0LiBJZ25vcmluZ1xuICB9XG59XG5cbi8qKlxuICogVGhlIGJ1Y2tldCB3aWxsIG9ubHkgYmUgdGFnZ2VkIGZvciBkZWxldGlvbiBpZiBpdCdzIGJlaW5nIGRlbGV0ZWQgaW4gdGhlIHNhbWVcbiAqIGRlcGxveW1lbnQgYXMgdGhpcyBDdXN0b20gUmVzb3VyY2UuXG4gKlxuICogSWYgdGhlIEN1c3RvbSBSZXNvdXJjZSBpcyBldmVyeSBkZWxldGVkIGJlZm9yZSB0aGUgYnVja2V0LCBpdCBtdXN0IGJlIGJlY2F1c2VcbiAqIGBhdXRvRGVsZXRlT2JqZWN0c2AgaGFzIGJlZW4gc3dpdGNoZWQgdG8gZmFsc2UsIGluIHdoaWNoIGNhc2UgdGhlIHRhZyB3b3VsZCBoYXZlXG4gKiBiZWVuIHJlbW92ZWQgYmVmb3JlIHdlIGdldCB0byB0aGlzIERlbGV0ZSBldmVudC5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gaXNCdWNrZXRUYWdnZWRGb3JEZWxldGlvbihidWNrZXROYW1lOiBzdHJpbmcpIHtcbiAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBzMy5nZXRCdWNrZXRUYWdnaW5nKHsgQnVja2V0OiBidWNrZXROYW1lIH0pLnByb21pc2UoKTtcbiAgcmV0dXJuIHJlc3BvbnNlLlRhZ1NldC5zb21lKHRhZyA9PiB0YWcuS2V5ID09PSBBVVRPX0RFTEVURV9PQkpFQ1RTX1RBRyAmJiB0YWcuVmFsdWUgPT09ICd0cnVlJyk7XG59Il19