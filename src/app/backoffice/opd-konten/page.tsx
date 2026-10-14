import { redirect } from "next/navigation";

// Existing bookmarks lead to the dashboard; OPD content management is retired.
export default function OpdKontenPage() {
  redirect("/backoffice");
}
