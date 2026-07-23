import { Directory } from "@/components/directory";
import { companies } from "@/lib/companies";

export default function Home() {
  return <Directory initialCompanies={companies} />;
}
