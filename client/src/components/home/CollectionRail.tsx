import { Link } from 'react-router-dom';
import { useCategories } from '@/hooks/useCategories';
import { Skeleton } from '@/components/ui/Skeleton';
import { Category } from '@/types';

const RAIL_SIZE = 10;

function pickRoundRobin(categories: Category[], count: number): Category[] {
  const result: Category[] = [];
  let round = 0;
  while (result.length < count) {
    let addedAny = false;
    for (const parent of categories) {
      const child = parent.children?.[round];
      if (child) {
        result.push(child);
        addedAny = true;
        if (result.length >= count) break;
      }
    }
    if (!addedAny) break;
    round += 1;
  }
  return result;
}

export function CollectionRail() {
  const { data: categories = [], isLoading } = useCategories();
  const rail = pickRoundRobin(categories, RAIL_SIZE);

  return (
    <section className="container-app py-7 sm:py-9">
      <h2 className="mb-4 font-display text-xl font-bold text-gray-900 sm:mb-5 sm:text-2xl">Shop by Category</h2>
      <div className="-mx-3 flex gap-4 overflow-x-auto px-3 pb-1 sm:mx-0 sm:grid sm:grid-cols-5 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-10">
        {isLoading
          ? Array.from({ length: RAIL_SIZE }).map((_, i) => <Skeleton key={i} className="aspect-square w-20 shrink-0 rounded-full sm:w-auto" />)
          : rail.map((cat) => (
              <Link key={cat._id} to={`/collections/${cat.slug}`} className="group flex w-20 shrink-0 flex-col items-center gap-2 text-center sm:w-auto">
                <div className="aspect-square w-full overflow-hidden rounded-full border border-gray-100 bg-gray-50 shadow-sm transition-shadow group-hover:shadow-cardHover">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <span className="line-clamp-2 text-[11px] font-medium leading-tight text-gray-700 sm:text-xs">{cat.name}</span>
              </Link>
            ))}
      </div>
    </section>
  );
}
