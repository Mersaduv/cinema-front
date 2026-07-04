import CollectionsClient from "../components/collections/CollectionsClient";
import { getCachedCollectionsList } from "../lib/collections/collections-page-cache";

export default async function CollectionsPage() {
  const result = await getCachedCollectionsList(1, 48);

  return (
    <CollectionsClient
      initialItems={result.items}
      initialMeta={result.meta}
      initialError={result.error}
    />
  );
}
