import { Badge } from "@/components/ui/badge";
import type { Product } from "@/data/types";
import { getProductStockMeta } from "@/lib/data/products";

interface ProductBadgesProps {
  product: Product;
  compact?: boolean;
}

export default function ProductBadges({
  product,
  compact = false,
}: Readonly<ProductBadgesProps>) {
  const stockMeta = getProductStockMeta(product.stock_status);

  return (
    <div className="flex flex-wrap gap-2">
      {product.featured ? <Badge>Premium</Badge> : null}
      {product.pickup_only && !compact ? (
        <Badge variant="muted">Recogida en local</Badge>
      ) : null}
      <Badge variant={stockMeta.badgeVariant}>{stockMeta.label}</Badge>
    </div>
  );
}
