import { redirect } from "next/navigation";

/** The product catalog now lives on the Inventory page; keep old links working. */
export default function ProductsPage() {
  redirect("/inventory");
}
