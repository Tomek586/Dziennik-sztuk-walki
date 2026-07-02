import { Redirect } from 'expo-router';

/** Zaślepka taba „Nagraj" — właściwy przycisk otwiera modal /record. */
export default function RecordTab() {
  return <Redirect href="/record" />;
}
