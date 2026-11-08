import ScrollShell from '@/components/ScrollShell';
import Hero from '@/components/Hero';
import Overview from '@/components/Overview';
import Ancestry from '@/components/Ancestry';
import FatherProfile from '@/components/FatherProfile';
import MotherProfile from '@/components/MotherProfile';
import FamilyTree from '@/components/FamilyTree';
import Bond from '@/components/Bond';
import FamilyLife from '@/components/FamilyLife';
import Conflict from '@/components/Conflict';
import Exile from '@/components/Exile';
import Legacy from '@/components/Legacy';
import Closing from '@/components/Closing';

export default function Home() {
  return (
    <ScrollShell>
      <Hero />
      <Overview />
      <Ancestry />
      <FatherProfile />
      <MotherProfile />
      <FamilyTree />
      <Bond />
      <FamilyLife />
      <Conflict />
      <Exile />
      <Legacy />
      <Closing />
    </ScrollShell>
  );
}