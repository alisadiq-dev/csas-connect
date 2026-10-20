import { listDemoAccounts } from "@/lib/demo-accounts";
import { LoginView } from "./login-view";

// Server wrapper: loads the (non-production) demo accounts, then renders the interactive client form.
export default async function LoginPage() {
  const demoAccounts = await listDemoAccounts();
  return <LoginView demoAccounts={demoAccounts} />;
}
