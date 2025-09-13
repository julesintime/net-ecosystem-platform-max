import { UniversalAppBarClient } from "./universal-app-bar-client"
import { getAuthContext } from "@/lib/auth/actions"

export async function UniversalAppBar() {
  const { isAuthenticated } = await getAuthContext()

  return <UniversalAppBarClient isAuthenticated={isAuthenticated} />
}